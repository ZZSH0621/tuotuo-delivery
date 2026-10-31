import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createTranscriptionHandler} from '../server/transcription-handler.mjs';
import {submitAPIFile} from '../public/api-request.mjs';
import * as models from '../public/api-models.mjs';
test('server key sends without a browser key and fixed provider cannot be overridden',async()=>{
 let captured;
 const handler=createTranscriptionHandler({enabled:true,origin:'https://nurse.example',siteId:'site',serverKey:'server-test-secret',fixedProvider:'bailian-cn',authenticate:async()=>({verified:true,id:'owner'}),quota:{checkAttempt:async()=>true,reserve:async()=>true},inspectAudio:async()=>({sampleRate:16000}),maxCostMicrosPerRequest:1,transport:async(url,opts)=>{captured={url,opts};return Response.json({output:{text:'测试记录'}})}});
 const text=await submitAPIFile({file:new Blob(['synthetic-wave']),consent:true,session:{authenticated:true,connected:true,serverKeyConfigured:true},provider:'bailian-intl',requestId:'test-auto-server-123',fetcher:async(url,opts)=>{assert.equal(opts.body.has('api_key'),false);return handler(new Request('https://nurse.example'+url,{...opts,headers:{...opts.headers,Origin:'https://nurse.example'}}));}});
 assert.equal(text,'测试记录');assert.equal(captured.opts.headers.Authorization,'Bearer server-test-secret');assert.equal(new URL(captured.url).hostname,'dashscope.aliyuncs.com');
});
test('speech endpoint submits once and returns text directly to the workbench',async()=>{
 const html=readFileSync(new URL('../public/asr/index.html',import.meta.url),'utf8');
 const node=()=>({hidden:false,value:'',checked:false,dataset:{},classList:{add(){},toggle(){}},setAttribute(){},removeAttribute(){},append(){},pause(){},replaceChildren(){}});
 const nodes=Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],node()]));let recorderConfig,calls=0;
 const document={hidden:false,documentElement:node(),getElementById:id=>{assert(nodes[id],'missing DOM: '+id);return nodes[id]},querySelectorAll:()=>[],querySelector:()=>node(),createElement:node,addEventListener(){}};
 const messages=[];const location={search:'?embedded=1',origin:'https://nurse.example'};const window={scrollTo(){},addEventListener(){}};const parent={postMessage:(message,origin)=>messages.push({message,origin})};
 const context={...models,document,location,window,parent,URLSearchParams,URL:{createObjectURL:()=> 'blob:local',revokeObjectURL(){}},Blob,AbortController,setInterval,clearInterval,setTimeout,clearTimeout,console,createRecorder:config=>{recorderConfig=config;return {state:'idle',cancel(){}}},encodeWAV(){},readAPIStatus:async()=>({authenticated:true,connected:true,serverKeyConfigured:true}),submitAPIFile:async()=>{calls++;return '测试记录'},API_ERRORS:{},navigator:{}};
 let source=readFileSync(new URL('../public/asr/app.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
 vm.runInNewContext(source,context);await new Promise(resolve=>setImmediate(resolve));
 recorderConfig.onReady(new Blob([new Uint8Array(32044)]),{speechDetected:true,reason:'speech-ended'});await new Promise(resolve=>setImmediate(resolve));
 const delivered=messages.filter(m=>m.message.type==='tuotuo-asr-adopt');assert.equal(calls,1);assert.equal(delivered.length,1);assert.equal(delivered[0].message.type,'tuotuo-asr-adopt');assert.equal(delivered[0].message.text,'测试记录');assert.equal(delivered[0].origin,'https://nurse.example');assert(!html.includes('id="review-view"'));assert(!html.includes('id="api-key"'));assert(!html.includes('data-view="settings"'));
 assert.equal(nodes.record.hidden,false);assert(!html.includes('signin-record'));
 context.readAPIStatus=async()=>({authenticated:false,anonymousAllowed:true,connected:true,serverKeyConfigured:true});await vm.runInNewContext('refresh()',context);assert.equal(nodes.record.hidden,false);assert.equal(nodes.record.disabled,false);assert(!nodes['session-state'].textContent.includes('登录'));
});
