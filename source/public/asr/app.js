import {createRecorder,encodeWAV} from '/single-recorder.mjs';
import {readAPIStatus,submitAPIFile,API_ERRORS} from '/api-request.mjs';
import {DEFAULT_ASR_MODEL,QWEN_ASR_MODEL,ASR_MODELS,PROVIDERS,providerEndpoint,validModelProvider} from '/api-models.mjs';
const paths={mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"/>',settings:'<path d="m9.5 3 .7-1h3.6l.7 1 .3 2 1.7 1 1.8-.6 1.4.4 1.8 3.1-.4 1.4-1.5 1.2v2l1.5 1.2.4 1.4-1.8 3.1-1.4.4-1.8-.6-1.7 1-.3 2-.7 1h-3.6l-.7-1-.3-2-1.7-1-1.8.6-1.4-.4-1.8-3.1.4-1.4 1.5-1.2v-2L2.5 10l-.4-1.4 1.8-3.1 1.4-.4 1.8.6 1.7-1z"/><circle cx="12" cy="12" r="3"/>',document:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6m-6 5h6m-6 4h4"/>',upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',play:'<path d="m9 5 10 7-10 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',stop:'<rect x="6" y="6" width="12" height="12" rx="1"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.3"/>',chevron:'<path d="m9 5 7 7-7 7"/>',back:'<path d="m15 5-7 7 7 7"/>',arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',eye:'<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12"/><circle cx="12" cy="12" r="3"/>',close:'<path d="m6 6 12 12M6 18 18 6"/>',audio:'<path d="M9 18V5l11-2v13M9 8l11-2"/><ellipse cx="6" cy="18" rx="3" ry="3"/><ellipse cx="17" cy="16" rx="3" ry="3"/>',check:'<path d="m5 12 5 5L20 7"/>',copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>'};
const $=id=>document.getElementById(id),icon=name=>`<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.info}</svg>`;
document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));$('back').innerHTML=icon('back');
const heights=[4,7,13,20,29,35,27,20,12,8,6,15,11,18,23,14,9,12,22,30,38,48,33,25,38,44,26,18,11,22,17,10,6,14,8,10,17,27,34,21,12,7,4];
$('waveform').innerHTML=heights.map((h,i)=>`<span style="height:${h}px;--i:${i}"></span>`).join('');
const embedded=new URLSearchParams(location.search).get('embedded')==='1'&&parent!==window;
if(embedded)document.documentElement.classList.add('embedded');
if(new URLSearchParams(location.search).get('home')==='1')document.documentElement.classList.add('home-recorder');
const destination=new URLSearchParams(location.search).get('destination')==='memo'?'memo':'task';
let authLoaded=false,holdPointer=null,recordStartedAt=0,startAttempt=0,lastReportedActive=null;
let current='voice',mode='api',capture='idle',seconds=0,timer=null,file=null,previewURL=null,busy=false,controller=null,hasReview=false,toastTimer=null,operation=0,session={connected:false,authenticated:false,hasLocalKey:false};


let settings={provider:'bailian-cn',workspace:'',model:DEFAULT_ASR_MODEL};
const msg=error=>error?.name==='AbortError'?'请求已取消；上游可能已计费，不会自动重试。':(API_ERRORS[error?.message]||'操作未完成，请检查权限、音频格式或网络后重试。')+(error?.providerCode?'（'+error.providerCode+'）':'');
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3200);}
function error(text=''){$('record-error').textContent=text;$('record-error').hidden=!text;}
function format(n){n=Math.max(0,Math.round(n));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;}
function clearKey(){}
function revokeConsent(){$('send-consent').checked=false;}
function render(){
 $('send-target').textContent=`本次发送至 ${PROVIDERS[settings.provider].label} · ${settings.model} · ${providerEndpoint(settings.provider,settings.workspace)}`;
 $('session-state').hidden=!!session.connected;
 $('recorder').classList.toggle('has-audio',!!file);$('recorder').classList.toggle('processing',busy);
 const active=['starting','recording','paused','stopping'].includes(capture),ready=!!file;
 if(embedded&&lastReportedActive!==(active||busy)){lastReportedActive=active||busy;parent.postMessage({type:'tuotuo-asr-state',active:lastReportedActive},location.origin);}
 $('recorder').classList.toggle('recording',capture==='recording'||capture==='paused');$('recorder').classList.toggle('paused',capture==='paused');$('timer').textContent=format(seconds);
 $('record-actions').hidden=false;$('active-actions').hidden=!active||holdPointer!==null;$('stop').hidden=true;$('audio-ready').hidden=!ready||active;
 $('cancel-recording').hidden=!active;
 $('pause').disabled=busy||!['recording','paused'].includes(capture);$('stop').disabled=busy||!['recording','paused'].includes(capture);
 $('pause').innerHTML=icon(capture==='paused'?'play':'pause')+`<span>${capture==='paused'?'继续':'暂停'}</span>`;
 $('record-caption').textContent=busy?(controller?'正在转写…':'正在准备…'):({starting:'正在请求麦克风权限',recording:'正在听',paused:'已暂停',stopping:'正在准备',idle:file?'本次录音':'说完自动转写',error:'录音未完成，请重新录制'})[capture];
 $('transcribe').disabled=busy||!file||!session.connected;
 $('transcribe').hidden=busy||hasReview;
 $('audio-preview').hidden=busy||!file;
 $('transcribe').innerHTML=(busy?(controller?'正在转写…':'正在准备音频…'):'重试转写')+icon('arrow');
 for(const id of ['remove-audio','api-mode','model-row'])$(id).disabled=busy||active;
 $('model-summary').textContent=mode==='api'?(settings.provider==='openai'?'OpenAI · 个人 API':'说完自动转写'):'设备端识别';
 $('config-state').textContent=session.serverKeyConfigured?'已就绪':'暂不可用';
 $('record').hidden=false;
 $('record').disabled=busy||capture==='stopping'||!authLoaded;
 $('record-label').textContent=busy?'正在转写…':capture==='stopping'?'正在处理…':capture==='starting'?'正在准备麦克风…':capture==='recording'?(holdPointer!==null?'松开完成记录':'点击结束记录'):'按住说话';
 $('record').setAttribute('aria-label',capture==='recording'?'结束录音并自动记录':'按住说话，松开后自动记录');
 $('record').setAttribute('aria-pressed',String(capture==='recording'));
 $('recorder').classList.toggle('holding',holdPointer!==null);
}
function show(view){current='voice';$('voice-view').hidden=false;$('back').hidden=!embedded;render();}
function clearAudio(){file=null;$('audio-preview').pause();$('audio-preview').removeAttribute('src');$('audio-preview').hidden=true;if(previewURL)URL.revokeObjectURL(previewURL);previewURL=null;$('audio-file').value='';hasReview=false;revokeConsent();}
function deliverTranscript(text){text=text.trim();if(!text)return;cancel({clear:new URLSearchParams(location.search).get('home')==='1'});if(embedded){parent.postMessage({type:'tuotuo-asr-adopt',text},location.origin);}else{sessionStorage.setItem('tuotuo-asr-handoff',JSON.stringify({text,destination,createdAt:Date.now()}));location.href='/legacy/index.html';}}
function ready(blob,name){clearAudio();file=blob;previewURL=URL.createObjectURL(blob);$('audio-preview').src=previewURL;$('audio-preview').hidden=false;$('file-name').textContent=name;$('audio-hint').textContent='音频结束后自动发送转写，可在这里试听。';capture='idle';render();}
const recorder=createRecorder({autoStopOnSilence:true,silenceMs:1800,noSpeechMs:8000,onState(state){capture=state;if(state==='recording')recordStartedAt=Date.now();if(state==='recording'&&!timer)timer=setInterval(()=>{if(capture==='recording'){seconds=Math.min(30,seconds+1);$('timer').textContent=format(seconds);}},1000);if(!['recording','paused'].includes(state)){clearInterval(timer);timer=null;}render();},onReady(blob,details){holdPointer=null;seconds=Math.max(1,Math.round((blob.size-44)/32000));ready(blob,'本轮录音 · '+format(seconds));if(!details?.speechDetected&&details?.reason!=='manual')error('未检测到语音，请重新录制。');else void transcribe();}});
function cancel({clear=false}={}){startAttempt++;holdPointer=null;operation++;recorder.cancel();controller?.abort();controller=null;busy=false;clearKey();revokeConsent();if(clear){clearAudio();seconds=0;}render();}
function back(){if(current!=='voice'){show('voice');return;}cancel({clear:true});if(embedded)parent.postMessage({type:'tuotuo-asr-close'},location.origin);else location.href='/legacy/index.html';}
$('back').onclick=back;document.querySelector('.brand').onclick=e=>{e.preventDefault();show('voice');};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{if(busy||['starting','recording','paused','stopping'].includes(capture)){toast('请先结束或取消当前录音与转写');return;}show(b.dataset.view);});
function endpointLabel(){}
function setMode(next){if(next==='local'){toast('公开源码未附本地模型，请在工作台的本地识别中配置模型。');return;}mode='api';render();}
$('api-mode').onclick=()=>setMode('api');
async function startRecording(){
 if(busy||!authLoaded||!session.connected||recorder.state!=='idle')return;
 error();if(!validModelProvider(settings.model,settings.provider)){error(API_ERRORS.ASR_MODEL_NOT_SUPPORTED);return;}
 clearAudio();seconds=0;operation++;const attempt=++startAttempt;
 try{await recorder.start();}catch(e){if(attempt===startAttempt){holdPointer=null;revokeConsent();error(e?.name==='NotAllowedError'?'麦克风权限未授予，请在浏览器中允许麦克风。':'无法开始录音，请检查麦克风与浏览器权限。');}}
 render();
}
async function finishRecording(){try{await recorder.stop();}catch{cancel({clear:true});error('这次录音未完成，请按住重新说。');}}
$('record').onpointerdown=e=>{
 if(e.isPrimary===false||e.button!==0||busy||!authLoaded||!session.connected||holdPointer!==null||recorder.state!=='idle')return;
 e.preventDefault();holdPointer=e.pointerId;try{$('record').setPointerCapture(e.pointerId);}catch{}
 void startRecording();
};
function releaseRecording(e,discard=false){
 if(holdPointer===null||e.pointerId!==holdPointer)return;
 e.preventDefault();holdPointer=null;
 try{if($('record').hasPointerCapture?.(e.pointerId))$('record').releasePointerCapture(e.pointerId);}catch{}
 if(discard||recorder.state==='starting'){cancel({clear:true});if(discard)error('已取消录音');return;}
 if(recorder.state==='recording'){if(Date.now()-recordStartedAt<250){cancel({clear:true});error('请按住按钮说话，松开后自动记录。');}else void finishRecording();}
 render();
}
$('record').onpointerup=e=>releaseRecording(e);
$('record').onpointercancel=e=>releaseRecording(e,true);
$('record').onlostpointercapture=e=>{if(holdPointer===e.pointerId)releaseRecording(e,true);};
// Pointer-generated clicks are consumed; keyboard/assistive clicks toggle capture.
$('record').onclick=e=>{if(e.detail!==0){e.preventDefault();return;}if(busy)return;if(recorder.state==='recording')void finishRecording();else if(recorder.state==='idle')void startRecording();};
$('pause').onclick=async()=>{try{if(recorder.state==='paused')await recorder.resume();else await recorder.pause();}catch{cancel();error('暂停或继续失败，请重新录制。');}};
$('stop').onclick=()=>finishRecording();
$('cancel-recording').onclick=()=>{cancel({clear:true});error('已取消录音，未发送音频。');};
$('remove-audio').onclick=()=>{cancel({clear:true});error();};
$('audio-file').onchange=async()=>{const selected=$('audio-file').files[0];if(!selected)return;error();revokeConsent();if(selected.size>10*1024*1024){error('文件超过 10 MB，请选择 30 秒内的短音频。');return;}clearAudio();seconds=0;const g=++operation;busy=true;render();let context;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('AUDIO_INVALID');context=new AC();const decoded=await context.decodeAudioData(await selected.arrayBuffer());if(g!==operation)return;if(!Number.isFinite(decoded.duration)||decoded.duration<=0||decoded.duration>30)throw Error('AUDIO_INVALID');const mono=new Float32Array(decoded.length);for(let c=0;c<decoded.numberOfChannels;c++){const ch=decoded.getChannelData(c);for(let i=0;i<mono.length;i++)mono[i]+=ch[i]/decoded.numberOfChannels;}const wav=encodeWAV([mono],decoded.sampleRate);mono.fill(0);seconds=Math.ceil(decoded.duration);ready(wav,selected.name);}catch(e){if(g===operation)error(msg(e));}finally{await context?.close().catch(()=>{});if(g===operation){busy=false;render();if(file)void transcribe();}}};
$('audio-preview').onerror=()=>{if(file)error('此音频无法试听，请换用 WAV 或 MP3 文件。');};
async function transcribe(){
 if(busy||!file||document.hidden)return;error();if(!validModelProvider(settings.model,settings.provider)){error(API_ERRORS.ASR_MODEL_NOT_SUPPORTED);return;}
 const g=++operation;controller=new AbortController();busy=true;hasReview=false;render();
 const key='';revokeConsent();
 try{const pending=submitAPIFile({file,apiKey:key,...settings,consent:true,session,signal:controller.signal});clearKey();const text=await pending;if(g!==operation)return;hasReview=true;deliverTranscript(text);}catch(e){if(g===operation)error(msg(e));}finally{if(g===operation){busy=false;controller=null;revokeConsent();render();}}
}
$('transcribe').onclick=()=>transcribe();
// Explicit cancellation remains reachable while an upstream request is in flight.
const cancelButton=document.createElement('button');cancelButton.className='secondary wide';cancelButton.id='cancel-request';cancelButton.textContent='取消本次转写';cancelButton.hidden=true;$('audio-ready').append(cancelButton);cancelButton.onclick=()=>{cancel();error('已取消本次请求；上游可能已计费，不会自动重试。');};
const baseRender=render;render=function(){baseRender();cancelButton.hidden=!busy;cancelButton.textContent=controller?'取消本次转写':'取消音频转换';};
async function refresh(){try{session=await readAPIStatus();authLoaded=true;settings.provider=session.provider||'bailian-cn';settings.workspace=session.workspace||'';$('session-state').textContent=!session.serverKeyConfigured?'转写服务暂不可用，请稍后重试。':!session.connected?'转写服务正在连接，请稍后重试。':'音频只用于本次转写';endpointLabel();render();}catch{session={connected:false,authenticated:false};authLoaded=true;$('session-state').textContent='暂时无法连接服务，请刷新后重试。';render();}}
window.addEventListener('pageshow',()=>{if(!busy)void refresh();});window.addEventListener('focus',()=>{if(!busy&&capture==='idle')void refresh();});
function suspend(){if(busy||['starting','recording','paused','stopping'].includes(capture)){cancel();error('页面进入后台或被提醒中断，已停止录音或请求。取消不保证上游未计费。');}clearKey();revokeConsent();$('audio-preview').pause();render();}
for(const type of ['pointerdown','keydown'])document.addEventListener(type,e=>{if(embedded&&e.isTrusted)parent.postMessage({type:'tuotuo-asr-activity'},location.origin);},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});window.addEventListener('pagehide',()=>cancel({clear:true}));window.addEventListener('message',e=>{if(embedded&&e.source===parent&&e.origin===location.origin&&e.data?.type==='tuotuo-asr-interrupt')suspend();});window.addEventListener('keydown',e=>{if(e.key==='Escape')back();});
endpointLabel();show('voice');refresh();






