import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import * as models from '../public/api-models.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function setup({pendingStart=false,pendingSubmit=false}={}){
 const html=readFileSync(new URL('../public/asr/index.html',import.meta.url),'utf8');
 const node=()=>({hidden:false,value:'',checked:false,dataset:{},classList:{add(){},toggle(){}},setAttribute(k,v){this[k]=v},removeAttribute(){},append(){},pause(){},replaceChildren(){},setPointerCapture(){},hasPointerCapture(){return true},releasePointerCapture(){}});
 const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],node()])),listeners={};
 const calls={start:0,stop:0,cancel:0,submit:0,messages:[],signal:null};let cfg,state='idle',generation=0,clock=1000,resolveStart,resolveSubmit;
 const startGate=new Promise(resolve=>resolveStart=resolve),submitGate=new Promise(resolve=>resolveSubmit=resolve);
 const document={hidden:false,documentElement:node(),getElementById:id=>{assert(nodes[id],'missing '+id);return nodes[id]},querySelectorAll:()=>[],querySelector:()=>node(),createElement:node,addEventListener(type,fn){(listeners[type]??=[]).push(fn)}};
 const messages=calls.messages,parent={postMessage:(data,origin)=>messages.push({data,origin})},window={scrollTo(){},addEventListener(){}};
 const blob=()=>new Blob([new Uint8Array(32044)]);
 const context={...models,document,window,parent,location:{search:'?embedded=1&home=1',origin:'https://nurse.example'},Date:class extends Date{static now(){return clock}},URLSearchParams,URL:{createObjectURL:()=> 'blob:local',revokeObjectURL(){}},Blob,AbortController,setInterval,clearInterval,setTimeout,clearTimeout,console,navigator:{},API_ERRORS:{},encodeWAV(){},readAPIStatus:async()=>({authenticated:false,anonymousAllowed:true,connected:true,serverKeyConfigured:true}),submitAPIFile:async({signal})=>{calls.submit++;calls.signal=signal;if(pendingSubmit)await submitGate;return '12床张三，20分钟后测血压';},createRecorder(config){cfg=config;return {get state(){return state},async start(){calls.start++;const g=++generation;state='starting';cfg.onState(state);if(pendingStart)await startGate;if(g!==generation)return;state='recording';cfg.onState(state)},async stop(){if(state!=='recording')return;calls.stop++;state='stopping';cfg.onState(state);state='idle';cfg.onState(state);cfg.onReady(blob(),{speechDetected:true,reason:'manual'})},cancel(){calls.cancel++;generation++;state='idle';cfg.onState(state)}}}};
 const source=readFileSync(new URL('../public/asr/app.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');vm.runInNewContext(source,context);
 const event=(overrides={})=>({pointerId:1,button:0,isPrimary:true,preventDefault(){},...overrides});
 return {nodes,calls,event,ready:tick,advance(ms){clock+=ms},resolveStart,resolveSubmit,state:()=>state,pauseState(){state='paused';cfg.onState(state)},silence(){state='idle';cfg.onState(state);cfg.onReady(blob(),{speechDetected:true,reason:'speech-ended'})},activity(type,isTrusted){for(const fn of listeners[type]||[])fn({isTrusted})},records:()=>messages.filter(m=>m.data.type==='tuotuo-asr-adopt')};
}
test('hold starts in gesture and release submits once; pointer click never starts another round',async()=>{
 const h=setup();await h.ready();h.nodes.record.onpointerdown(h.event());await tick();assert.equal(h.state(),'recording');assert.equal(h.nodes.record.disabled,false);assert.equal(h.nodes['record-actions'].hidden,false);assert.equal(h.nodes.record['aria-pressed'],'true');
 h.nodes.record.onclick({detail:1,preventDefault(){}});assert.equal(h.calls.start,1);h.advance(800);h.nodes.record.onpointerup(h.event());await tick();assert.equal(h.calls.stop,1);assert.equal(h.calls.submit,1);assert.equal(h.records().length,1);h.nodes.record.onclick({detail:1,preventDefault(){}});assert.equal(h.calls.start,1);
});
test('release before asynchronous permission finishes cancels without upload',async()=>{
 const h=setup({pendingStart:true});await h.ready();h.nodes.record.onpointerdown(h.event());assert.equal(h.state(),'starting');assert.equal(h.nodes['record-actions'].hidden,false);assert.equal(h.nodes.record.disabled,false);assert.equal(h.nodes['active-actions'].hidden,true);h.nodes.record.onpointerup(h.event());assert.equal(h.state(),'idle');h.resolveStart();await tick();assert.equal(h.state(),'idle');assert.equal(h.calls.stop,0);assert.equal(h.calls.submit,0);
});
test('paused rendering retains the main record control without disabling it',async()=>{
 const h=setup();await h.ready();h.nodes.record.onclick({detail:0});await tick();h.pauseState();assert.equal(h.nodes['record-actions'].hidden,false);assert.equal(h.nodes.record.disabled,false);assert.equal(h.nodes.stop.hidden,true);h.nodes['cancel-recording'].onclick();
});
test('pointer cancellation discards; unrelated pointers cannot finish the held recording',async()=>{
 const h=setup();await h.ready();h.nodes.record.onpointerdown(h.event());await tick();h.advance(800);h.nodes.record.onpointerup(h.event({pointerId:2}));assert.equal(h.state(),'recording');h.nodes.record.onpointercancel(h.event());await tick();assert.equal(h.state(),'idle');assert.equal(h.calls.submit,0);assert.equal(h.calls.stop,0);
});
test('keyboard and assistive click can start and end without holding',async()=>{
 const h=setup();await h.ready();h.nodes.record.onclick({detail:0});await tick();assert.equal(h.state(),'recording');assert.equal(h.nodes['record-actions'].hidden,false);assert.equal(h.nodes.record.disabled,false);assert.equal(h.nodes.stop.hidden,true);h.nodes.record.onclick({detail:0});await tick();assert.equal(h.calls.start,1);assert.equal(h.calls.stop,1);assert.equal(h.records().length,1);
});
test('silence auto-stop survives the late pointer event, and activity reports only trusted gestures',async()=>{
 const h=setup({pendingSubmit:true});await h.ready();h.nodes.record.onpointerdown(h.event());await tick();h.silence();assert.equal(h.calls.submit,1);h.nodes.record.onlostpointercapture(h.event());h.nodes.record.onpointercancel(h.event());assert.equal(h.calls.signal.aborted,false);h.resolveSubmit();await tick();assert.equal(h.records().length,1);
 const count=()=>h.calls.messages.filter(m=>m.data.type==='tuotuo-asr-activity').length;h.activity('pointerdown',false);assert.equal(count(),0);h.activity('keydown',true);assert.equal(count(),1);assert(h.calls.messages.some(m=>m.data.type==='tuotuo-asr-state'&&m.data.active===true));assert.equal(h.calls.messages.at(-2)?.origin??'https://nurse.example','https://nurse.example');
});


