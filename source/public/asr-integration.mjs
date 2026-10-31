// Same-origin recorder overlay; the original workbench and reminders stay alive.
let layer,frame,previousFocus,oldOverflow='',destination='task';
const previousListening=window.isLocalVoiceListening;
window.isLocalVoiceListening=()=>!!layer||!!previousListening?.();
const background=()=>[document.querySelector('main'),document.querySelector('aside')];
function close(){if(!layer)return;frame?.contentWindow?.postMessage({type:'tuotuo-asr-interrupt'},location.origin);layer.remove();layer=frame=null;document.body.style.overflow=oldOverflow;if(document.querySelector('#screenSaver').hidden)background().forEach(e=>e.inert=false);window.dispatchEvent(new Event('tuotuo-asr-return'));if(document.querySelector('#screenSaver').hidden)previousFocus?.focus();}
window.showAPIRecognition=(target='task')=>{
 if(layer||!document.querySelector('#screenSaver').hidden)return;
 destination=target==='memo'?'memo':'task';
 previousFocus=document.activeElement;oldOverflow=document.body.style.overflow;
 layer=document.createElement('section');layer.id='mobileASRLayer';layer.setAttribute('role','dialog');layer.setAttribute('aria-modal','true');layer.setAttribute('aria-label','语音记录');
 const exit=document.createElement('button');exit.className='asrOverlayClose';exit.textContent='关闭语音，返回工作台 ×';exit.onclick=close;
 frame=document.createElement('iframe');frame.src='/asr/?embedded=1&destination='+destination;frame.title='TUOTUO 语音记录';frame.allow='microphone';
 layer.append(exit,frame);document.body.append(layer);background().forEach(e=>e.inert=true);document.body.style.overflow='hidden';exit.focus();
};
window.addEventListener('message',e=>{if(!frame||e.source!==frame.contentWindow||e.origin!==location.origin)return;if(e.data?.type==='tuotuo-asr-close')close();if(e.data?.type==='tuotuo-asr-adopt'&&typeof e.data.text==='string'&&e.data.text.length<=12000){if(destination==='task'&&typeof window.recordTranscript==='function'){close();window.recordTranscript(e.data.text);return;}const field=document.querySelector(destination==='memo'?'#memoText':'#input');field.value+=(field.value.trim()?'\n':'')+e.data.text;close();field.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});field.focus();}});
window.addEventListener('care-alarm-start',close);
new MutationObserver(()=>{if(layer&&!document.querySelector('#screenSaver').hidden)close();}).observe(document.querySelector('#screenSaver'),{attributes:true,attributeFilter:['hidden']});
window.addEventListener('keydown',e=>{if(layer&&e.key==='Escape'){e.preventDefault();close();}});
// Standalone transcription returns a short-lived editable draft.
try{const value=sessionStorage.getItem('tuotuo-asr-handoff');sessionStorage.removeItem('tuotuo-asr-handoff');if(value){const d=JSON.parse(value),age=Date.now()-d.createdAt;if(typeof d.text==='string'&&d.text.length<=12000&&Number.isFinite(age)&&age>=0&&age<300000){if(d.destination!=='memo'&&typeof window.recordTranscript==='function')window.recordTranscript(d.text);else{const field=document.querySelector(d.destination==='memo'?'#memoText':'#input');field.value+=(field.value.trim()?'\n':'')+d.text;}}}}catch{}
