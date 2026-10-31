import {Intake,LocalVoice} from './voice-intake.mjs';
let latestPrompt='',lastDraft={};
const voice=new LocalVoice({onState:s=>{document.querySelector('#voiceState').textContent=s.message+(s.code?' ['+s.code+']':'');document.querySelector('#voiceStart').disabled=!voice.ready||voice.active;document.querySelector('#voiceInstall').disabled=s.canInstall!==true;document.querySelector('#voiceInstall').textContent=s.state==='installing'?'正在下载并安装…':'下载 / 重试中文离线语音包';},onFinal:(text,meta)=>intake.accept(text,meta)});
const intake=new Intake({onChange:s=>{latestPrompt=s.prompt;lastDraft=s.draft;document.querySelector('#intakePrompt').textContent=s.prompt.replace('已确认创建待办。提醒确认不代表工作完成。','已收到确认，正在处理草稿。');const d=s.draft;document.querySelector('#voiceDraftView').innerHTML=`<div class="researchDraft"><div><span class="pill due">${esc({draft:'待补充',created:'已确认',cancelled:'已取消','awaiting-confirmation':'待确认'}[s.status]||s.status)}</span><h3>${esc(d.task||'待明确事项')}</h3><p>床号：${esc(d.bed||'待补充')} · 姓名：${esc(d.name||'待补充')}</p><p>间隔：${d.minutes===undefined?'待补充':esc(d.minutes)+' 分钟'} · 起算：${esc(d.anchor?.label||'待补充')}</p><small>只有完整核对并明确“确认创建”后才处理。默认仅生成未计时草稿。</small></div></div>`;},onCreate:t=>{voice.stop();if(!document.querySelector('#voiceDemoTimer').checked){window.createVoiceResearchDraft(t);document.querySelector('#intakePrompt').textContent='已保存未计时研究草稿。没有启动闹钟；可在项目知识库补充。';toast('已生成研究草稿，未计时');return;}const task={id:crypto.randomUUID(),bed:t.bed,name:t.name,title:t.task+'（非临床测试）',due:t.dueAt,created:t.createdAt,done:false,ack:false,raw:'用户明确非临床计时测试',log:[],test:false};tasks.unshift(task);event(task,'任务创建','用户明确非临床测试；已核对时间与起算，计划 '+fmt(task.due));render();document.querySelector('#intakePrompt').textContent='非临床测试待办已创建；提醒到时不代表工作完成。';toast('已创建用户明确的非临床测试待办');}});
window.showVoice=()=>{document.querySelector('#voicePanel').hidden=false;document.querySelector('#voicePanel').scrollIntoView({behavior:'smooth',block:'start'})};
window.closeVoicePanel=()=>{voice.destroy();document.querySelector('#voicePanel').hidden=true;document.querySelector('#voiceState').textContent='已收起并停止聆听。'};
document.querySelector('#voiceProbe').onclick=async()=>{await voice.probe();document.querySelector('#voiceStart').disabled=!voice.ready;};
document.querySelector('#voiceInstall').onclick=e=>voice.installFromClick(e);
document.querySelector('#voiceStart').onclick=e=>voice.startFromClick(e);
document.querySelector('#voiceStop').onclick=()=>{voice.destroy();document.querySelector('#voiceState').textContent='已停止聆听和朗读；未删除草稿。';document.querySelector('#voiceStart').disabled=!voice.ready;};
document.querySelector('#voiceRead').onclick=()=>voice.speakPrompt(latestPrompt);
document.querySelector('#voiceSubmit').onclick=()=>{const el=document.querySelector('#voiceText');intake.accept(el.value);el.value=''};
document.querySelector('#voiceReset').onclick=()=>{voice.destroy();document.querySelector('#voiceDemoTimer').checked=false;intake.reset();};
document.querySelector('#voiceCancel').onclick=()=>{voice.destroy();intake.accept('取消');};

window.isLocalVoiceListening=()=>voice.active;

document.querySelector('#voiceDiagnose').onclick=async()=>{
 const report=[];
 report.push('此检查不请求麦克风、不录音。');
 report.push('安全上下文：'+(window.isSecureContext?'是':'否，需 HTTPS'));
 report.push('页面位置：'+(window.top===window?'独立网页':'嵌入页面；请尝试直接打开本站网址'));
 const policy=document.permissionsPolicy||document.featurePolicy;
 for(const key of ['microphone','on-device-speech-recognition']) {
  const known=policy?.features?.();
  report.push(key+' 页面策略：'+(known&&!known.includes(key)?'浏览器未报告此项':policy?.allowsFeature?String(policy.allowsFeature(key)):'无法读取'));
 }
 try{const p=await navigator.permissions.query({name:'microphone'});report.push('麦克风权限：'+({granted:'已允许',denied:'被拒绝',prompt:'尚待用户授权'}[p.state]||p.state));}catch{report.push('麦克风权限：浏览器不提供只读查询');}
 report.push('本地识别API：'+(typeof window.SpeechRecognition==='function'?'支持':'不支持；不采用云端替代'));
 report.push('浏览器：'+navigator.userAgent);
 report.push('本地识别可用不等于麦克风采集成功。若被拒绝，请自行查看地址栏权限；本页不会修改系统或浏览器设置。');
 const el=document.querySelector('#voiceDiagnostics');el.hidden=false;el.textContent=report.join('\n');
};
