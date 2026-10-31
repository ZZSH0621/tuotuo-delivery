import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const names=['openConfirm','settings','unlockMotor','prepareReminderAudio','motorToggle','alarmPulse','recordActivity'];
const functions=source.split(/\r?\n/).filter(line=>names.some(name=>line.startsWith(`function ${name}(`)||line.startsWith(`async function ${name}(`))).join('\n');
function setup({enabled=true,state='suspended',resumeReject=false}={}){
 const nodes=new Map(),calls={created:0,resumed:0,played:[],stopped:0,modal:'',toasts:[],vibrations:[]};
 const $=key=>{if(!nodes.has(key))nodes.set(key,{value:'',checked:false,hidden:true});return nodes.get(key)};
 $('#vibSound').checked=enabled;$('#repeatInterval').value='4';$('#bed').value='12';$('#name').value='示例患者甲';$('#title').value='测血压';$('#minutes').value='1';
 class AudioContext {constructor(){calls.created++;this.state=state}resume(){calls.resumed++;if(resumeReject)return Promise.reject(Error('blocked'));this.state='running';return Promise.resolve()}}
 const context={$,window:{AudioContext},motorContext:null,alarmQueue:[],tasks:[],alarmLoopGeneration:1,alarmPulses:0,alarmTimer:null,sound:false,vibTestSound:false,view:'',filter:'',lastActivity:0,navigator:{vibrate:x=>{calls.vibrations.push(x);return true}},crypto:{randomUUID:()=> 'test-task'},Number,Promise,Date,now:()=>1000,fmt:()=> 'test-time',esc:x=>x,openModal:(_title,html)=>calls.modal=html,closeModal(){},render(){},event(){},toast:x=>calls.toasts.push(x),playLibrary:async n=>calls.played.push(n),stopMotor:()=>calls.stopped++,stopLibrary:()=>calls.stopped++,hideSaver(){},setTimeout:()=>1};
 vm.createContext(context);vm.runInContext(functions,context);return {context,$,calls};
}
test('normal task creation unlocks reminder audio without prior library preview, then due task plays',async()=>{
 const h=setup();h.context.openConfirm({});h.$('#confirmForm').onsubmit({preventDefault(){}});await Promise.resolve();
 assert.equal(h.calls.created,1);assert.equal(h.calls.resumed,1);assert.equal(h.context.tasks.length,1);
 h.context.alarmQueue.push({id:'test-task',type:'task',soundChoice:2});await h.context.alarmPulse(1);assert.deepEqual(h.calls.played,[2]);
});
test('muted task creation neither unlocks nor plays; settings controls the actual alarm sound switch',async()=>{
 const h=setup({enabled:false});h.context.openConfirm({});h.$('#confirmForm').onsubmit({preventDefault(){}});assert.equal(h.calls.created,0);
 h.context.settings();assert(!/id="sound" checked/.test(h.calls.modal));h.$('#sound').onchange({target:{checked:true}});await Promise.resolve();assert.equal(h.$('#vibSound').checked,true);assert.equal(h.calls.created,1);
 h.$('#sound').onchange({target:{checked:false}});h.context.alarmQueue.push({id:'a',type:'task',soundChoice:1});await h.context.alarmPulse(1);assert.deepEqual(h.calls.played,[]);assert.match(h.$('#alarmCapability').textContent,/提示音已关闭/);assert.equal(h.calls.stopped,2);
});
test('restored pending tasks resume interrupted audio on trusted tap, never on wheel or synthetic events',async()=>{
 const h=setup({state:'interrupted'});h.context.tasks.push({done:false});h.context.recordActivity({isTrusted:false,type:'pointerdown'});h.context.recordActivity({isTrusted:true,type:'wheel'});assert.equal(h.calls.created,0);
 h.context.recordActivity({isTrusted:true,type:'pointerdown'});await Promise.resolve();assert.equal(h.calls.resumed,1);assert.equal(h.context.motorContext.state,'running');
});
test('blocked audio surfaces a recovery instruction and keeps task vibration independent',async()=>{
 const h=setup({resumeReject:true});await h.context.prepareReminderAudio();h.$('#repeatVibrate').checked=true;h.context.alarmQueue.push({id:'a',type:'task',soundChoice:3});await h.context.alarmPulse(1);assert.equal(h.calls.played.length,0);assert.equal(h.calls.vibrations.length,1);assert.match(h.$('#alarmCapability').textContent,/点击页面恢复/);assert.equal(h.context.alarmQueue.length,1);
});
