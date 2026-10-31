import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const js=readFileSync(new URL('../public/tuotuo.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/legacy/index.html',import.meta.url),'utf8');
function harness(){
 const calls={render:0,paint:0,idle:0,toast:[]};
 function el(){return {children:[],attrs:{},className:'',textContent:'',classList:{contains:()=>false,replace(){},remove(){},add(){}},prepend(v){this.children.unshift(v)},setAttribute(k,v){this.attrs[k]=v},scrollIntoView(){},focus(){}};}
 const nodes=Object.fromEntries(['#list .empty','#screenSaver','.saverMascot','#saverTitle','#toast','#input','.heroMascot','#mascotGreeting'].map(k=>[k,el()]));
 const filters=[el(),el()];filters[0].classList.contains=()=>true;
 const context={render(){calls.render++;nodes['#list .empty'].children=[]},paintSaver(){calls.paint++},idleScreen(){calls.idle++},toast(s){calls.toast.push(s);nodes['#toast'].children=[]},document:{activeElement:null,querySelector:k=>nodes[k],querySelectorAll:k=>k==='[data-filter],[data-view]'?filters:[],createElement:el},matchMedia:()=>({matches:true}),setTimeout(){return 1},clearTimeout(){},openModal(){}};
 vm.createContext(context);vm.runInContext(js,context);return {context,nodes,calls,filters};
}
test('redesign render delegates core rendering and adds presentation only',()=>{const {context,nodes,calls,filters}=harness();assert.equal(calls.render,1);assert.equal(nodes['#list .empty'].children.length,1);context.render();assert.equal(calls.render,2);assert.equal(nodes['#list .empty'].children.length,1);assert.equal(filters[0].attrs['aria-pressed'],'true');assert.equal(filters[1].attrs['aria-pressed'],'false');});
test('screensaver presentation follows alarm state without acknowledging/completing',()=>{const {context,nodes,calls}=harness();context.paintSaver();assert.match(nodes['.saverMascot'].className,/mascot-sleep/);nodes['#screenSaver'].classList.contains=()=>true;context.paintSaver();assert.match(nodes['.saverMascot'].className,/mascot-welcome/);assert.equal(calls.paint,2);assert(!/\backAlarm\s*\(|\.done\s*=|\.ack\s*=/.test(js));});
test('idle guard prevents covering active editors but delegates normal idle',()=>{const {context,calls}=harness();context.document.activeElement={matches:()=>true};context.idleScreen();assert.equal(calls.idle,0);context.document.activeElement={matches:()=>false};context.idleScreen();assert.equal(calls.idle,1);});
test('success mascot retains original feedback and never decorates errors',()=>{const {context,nodes,calls}=harness();context.toast('备忘录已保存');assert.equal(nodes['#toast'].children.length,1);context.toast('本地保存不可用');assert.equal(nodes['#toast'].children.length,0);assert.deepEqual(calls.toast,['备忘录已保存','本地保存不可用']);});
test('redesign retains consent, task controls, audio range and one replacement voice entry',()=>{for(const id of ['vibStart','vibCancel','vibSound','repeatVibrate','repeatInterval','input','memoPanel','screenSaver'])assert(html.includes(`id="${id}"`),id);assert.equal((html.match(/data-voice-entry=/g)||[]).length,1);assert.match(html,/id="motorVolume"[^>]*min="0"[^>]*max="200"/);assert(html.includes('仅知')||html.includes('不会标为完成'));assert(html.includes('候选知识 · 待院内审核'));assert(html.includes('全部禁止自动计时'));assert(html.includes('asr-integration.mjs'));});
