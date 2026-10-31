/** Local-only, dependency-free DEMO intake. No network, storage or medical defaults. */
export const FIELDS = ['bed','name','task','minutes','anchor'];
const QUESTIONS = {bed:'请说床号，例如三床。',name:'请说患者姓名，例如姓名张某。仅使用虚构患者。',task:'请说完整待办项目，例如测血压、做皮试或皮试判读。',minutes:'请说医嘱指定的提醒间隔，例如二十分钟。不自动推断医学时间。',anchor:'请说起算时间：从现在开始，或从几分钟前的操作开始。'};
export function chineseNumber(s) {
  if (/^\d+$/.test(s)) return Number(s);
  const digits = {零:0,一:1,二:2,两:2,三:3,四:4,五:5,六:6,七:7,八:8,九:9};
  if(s==='十') return 10;
  if(s.includes('十')) { const [a,b]=s.split('十'); return (a?digits[a]:1)*10+(b?digits[b]:0); }
  return digits[s];
}
const NUM='[零一二两三四五六七八九十0-9]+';
export function parseExplicit(text, field) {
  const p={}; let m;
  // Unsupported corrections/negations must not silently become positive instructions.
  if (/(?:不要|不是|取消|负数|负\s*[零一二两三四五六七八九十0-9]|-\s*\d)/.test(text)) return p;
  if((m=text.match(new RegExp(`(${NUM})\\s*(?:号床|床|床号)`)))) p.bed=String(chineseNumber(m[1]));
  if((m=text.match(/(?:姓名|名字叫|患者叫)\s*([\u4e00-\u9fff·]{2,12})(?=[，。\s]|$)/))) p.name=m[1];
  if(field==='name' && !p.name && /^[\u4e00-\u9fff·]{2,8}$/.test(text)) p.name=text;
  // A generic skin test is deliberately not normalized to a readout task.
  const task=text.match(/皮试判读|查看皮试结果|做皮试|测血压|测血糖|测体温|B超|b超|超声检查/);
  if(task) p.task=task[0];
  if(field==='task' && !task && text.length<=60) p.task=text;
  if(text==='皮试') p.task='皮试（需明确是操作还是判读）';
  if((m=text.match(new RegExp(`(${NUM})\\s*分钟(?:后|的间隔|$)`)))) p.minutes=chineseNumber(m[1]);
  if(/从现在|现在开始|刚(?:刚)?(?:做完|完成)/.test(text)) p.anchor={offsetMinutes:0,label:'从现在开始'};
  if((m=text.match(new RegExp(`从(${NUM})分钟前`)))) p.anchor={offsetMinutes:-chineseNumber(m[1]),label:m[0]+'的操作开始'};
  return p;
}
export class Intake {
  constructor({onChange=()=>{},onCreate=()=>{},now=()=>Date.now(),parser=parseExplicit}={}) {
    Object.assign(this,{onChange,onCreate,now,parser}); this.reset();
  }
  reset(){this.draft={};this.seen=new Set();this.status='draft';this.anchorAt=null;this.emit();}
  missing(){return FIELDS.find(k=>this.draft[k]===undefined || this.draft[k]==='') || (this.draft.task?.includes('需明确')?'task':null);}
  emit(message){const field=this.missing();this.onChange({status:this.status,draft:structuredClone(this.draft),field,prompt:message || (field?QUESTIONS[field]:this.summary()+'。请说“确认创建”，或补充修改。')});}
  summary(){const d=this.draft;return `${d.bed}床，${d.name}，${d.task}，${d.minutes}分钟，${d.anchor?.label}`;}
  accept(text,{final=true,eventId}={}) {
    text=text.trim(); if(!final||!text||this.status==='created'||this.status==='cancelled')return;
    if(eventId && this.seen.has(eventId)) return; if(eventId)this.seen.add(eventId);
    if(/^(取消|取消创建|不要创建)$/.test(text)){this.status='cancelled';this.emit('已取消草稿，未创建待办。');return;}
    if(/^(确认创建|确认建立)$/.test(text)) {
      if(this.missing()){this.emit('信息不完整。'+QUESTIONS[this.missing()]);return;}
      const dueAt=this.anchorAt+this.draft.minutes*60000;
      if(!Number.isFinite(dueAt)){this.emit('时间无效，请重新填写。');return;}
      // Set terminal state first: recognizer duplicate finals cannot create twice.
      this.status='created';const task={...structuredClone(this.draft),dueAt,anchorAt:this.anchorAt,createdAt:this.now(),source:'confirmed-demo-intake'};
      this.emit('已确认创建待办。提醒确认不代表工作完成。');this.onCreate(task);return;
    }
    const patch=this.parser(text,this.missing());
    if(patch.minutes!==undefined && (!Number.isFinite(patch.minutes)||patch.minutes<=0||patch.minutes>10080)) {delete patch.minutes;this.emit('请输入大于零且不超过七天的分钟数；这是Demo输入范围，不是医学规则。');return;}
    if(patch.anchor){if(!Number.isFinite(patch.anchor.offsetMinutes)){delete patch.anchor;}else this.anchorAt=this.now()+patch.anchor.offsetMinutes*60000;}
    Object.assign(this.draft,patch);this.status=this.missing()?'draft':'awaiting-confirmation';this.emit();
  }
}
export class LocalVoice {
  constructor({env=globalThis,onState=()=>{},onFinal=()=>{}}={}) {Object.assign(this,{env,onState,onFinal});this.ready=false;this.session=0;this.active=false;this.availability=null;this.installPromise=null;this.installWaitCancelled=false;}
  async probe(){
    const R=this.env.SpeechRecognition; // No legacy prefixed/cloud fallback.
    this.ready=false;
    try {
      if(!this.env.isSecureContext || !R || typeof R.available!=='function') throw Error('本浏览器无法确认本地中文识别，请使用文字。');
      const r=new R();
      if(!('processLocally' in r)) throw Error('缺少本地识别能力，未启用麦克风。');
      const availability=await R.available({langs:['zh-CN'],processLocally:true});
      this.availability=availability;
      if(availability!=='available') {
        const messages={downloadable:'可下载本地中文包：点击安装后由当前浏览器下载官方语言包，不会上传录音。',downloading:'浏览器正在下载中文包；没有可用百分比，可稍后重新检测。',unavailable:'当前浏览器未提供可下载的本地中文包；请使用文字或换支持此能力的浏览器。'};
        this.onState({state:availability,availability,canInstall:availability==='downloadable' && typeof R.install==='function',message:messages[availability] || '本地中文能力未知，请使用文字。'});return false;
      }
      r.processLocally=true;if(r.processLocally!==true)throw Error('无法强制本地识别。');
      r.lang='zh-CN';r.continuous=false;r.interimResults=true;this.recognition=r;this.ready=true;
      this.onState({state:'ready',availability:'available',canInstall:false,message:'本地中文识别可用；点击开始后才请求麦克风。'});return true;
    }catch(e){this.availability=null;this.onState({state:'text-only',canInstall:false,message:e.message});return false;}
  }
  installFromClick(event){
    if(!event?.isTrusted)return Promise.resolve(false);
    // Keep the same outstanding promise even after UI cancellation: install has no abort API.
    if(this.installPromise)return this.installPromise;
    const R=this.env.SpeechRecognition;
    if(!this.env.isSecureContext || !R || typeof R.install!=='function' || this.availability!=='downloadable') {
      this.onState({state:'install-blocked',message:'请先检测本地中文能力；只有可下载时才能安装。下载中请稍后重新检测，不重复安装。'});return Promise.resolve(false);
    }
    this.installWaitCancelled=false;this.ready=false;this.availability='downloading';
    this.onState({state:'installing',availability:'downloading',canInstall:false,message:'正在由当前浏览器下载并安装官方中文语言包；无百分比信息。不会请求麦克风。'});
    // Called synchronously inside trusted click to preserve browser user activation.
    let request;
    try{request=R.install({langs:['zh-CN'],processLocally:true});}catch(e){request=Promise.reject(e);}
    this.installPromise=(async()=>{
      try {
        const ok=await request;
        if(this.installWaitCancelled)return false;
        if(ok!==true){this.availability=null;this.onState({state:'install-failed',canInstall:false,message:'浏览器报告安装失败。请重新检测后再点击重试；不会自动重试或转云端。'});return false;}
        // A true install result alone is not readiness: re-check actual local availability.
        return await this.probe();
      }catch(e){if(!this.installWaitCancelled){this.availability=null;this.onState({state:'install-failed',canInstall:false,message:`语言包安装失败：${e.name || 'Error'}。请检查浏览器权限或网络后重新检测。`});}return false;
      }finally{this.installPromise=null;}
    })();
    return this.installPromise;
  }
  cancelInstallWait(){
    if(!this.installPromise)return false;
    this.installWaitCancelled=true;this.ready=false;
    this.onState({state:'install-wait-cancelled',canInstall:false,message:'已退出安装等待。浏览器没有取消下载接口，下载可能仍在继续；稍后可重新检测，不会自动开麦。'});return true;
  }
  environmentReport(){
    const policy=this.env.document?.permissionsPolicy || this.env.document?.featurePolicy;
    let microphonePolicy='unknown';try{if(policy?.allowsFeature)microphonePolicy=policy.allowsFeature('microphone');}catch{}
    return {secureContext:!!this.env.isSecureContext,embedded:!!this.env.self && this.env.self!==this.env.top,microphonePolicy,localLanguage:this.availability,mediaDevices:!!this.env.navigator?.mediaDevices?.getUserMedia,userActivation:this.env.navigator?.userActivation?.isActive ?? 'unknown'};
  }
  async diagnoseMicrophoneFromClick(event){
    if(!event?.isTrusted)return false;
    if(this.microphoneCheck)return this.microphoneCheck;
    const report=this.environmentReport();const media=this.env.navigator?.mediaDevices;
    if(!report.secureContext || !media?.getUserMedia || report.microphonePolicy===false){this.onState({state:'mic-error',code:'environment-blocked',report,message:report.microphonePolicy===false?'页面嵌入/权限策略禁止麦克风。请在独立浏览器标签打开正式网址后再检测。':'当前页面没有安全的麦克风接口，请用 HTTPS 正式网址在支持的浏览器打开。'});return false;}
    if(this.active){this.onState({state:'mic-error',code:'recognition-active',message:'请先停止语音识别再做麦克风诊断，避免设备竞争。'});return false;}
    this.onState({state:'mic-checking',report,message:'等待麦克风权限。此检查仅打开输入设备后立即释放，不录制、不回放、不上传；若未弹窗请检查地址栏权限。'});
    let request;try{request=media.getUserMedia({audio:true,video:false});}catch(e){request=Promise.reject(e);}
    this.microphoneCheck=(async()=>{let stream;try{stream=await request;const tracks=stream.getAudioTracks();const live=tracks.some(t=>t.readyState==='live');this.onState({state:live?'mic-ready':'mic-error',code:live?'track-opened':'no-live-track',report,message:live?'麦克风输入设备已成功打开并立即释放。此结果不代表检测到声音或中文转写成功；现在可点击开始说话。':'没有可用音频轨道。请检查系统默认输入设备。'});return live;
      }catch(e){const messages={NotAllowedError:'麦克风未获允许：检查地址栏本站麦克风权限，以及 Windows 隐私设置中的浏览器麦克风权限；也可能是嵌入页面策略限制。',NotFoundError:'未发现麦克风输入设备，请连接或启用输入设备。',NotReadableError:'设备无法读取，可能被其他应用独占或系统/硬件故障。关闭占用软件后重试。',AbortError:'设备初始化被中止，请重新检测。',SecurityError:'浏览器禁用了音频采集，请检查安全策略。',InvalidStateError:'页面不是活动文档，请在前台独立标签重试。'};this.onState({state:'mic-error',code:e.name || 'unknown',report,message:messages[e.name] || `麦克风检查失败（${e.name || 'unknown'}）。未上传音频。`});return false;
      }finally{stream?.getTracks().forEach(t=>t.stop());this.microphoneCheck=null;}})();return this.microphoneCheck;
  }
  startFromClick(event){
    if(!event?.isTrusted){this.onState({state:'start-blocked',code:'trusted-click-required',message:'请直接点击开始按钮，不能自动启动麦克风。'});return false;}
    if(!this.ready){this.onState({state:'start-blocked',code:'model-not-ready',message:this.availability==='downloadable'?'中文包尚未安装，请先点击下载，等待显示本地可用后再开始。':'本地中文能力尚未就绪，请先检测；开始按钮不可用不是麦克风故障。'});return false;}
    if(this.active){this.onState({state:'start-blocked',code:'already-starting',message:'正在等待采集事件或已在聆听；若长时间无响应，请点击停止后重试。'});return false;}
    if(this.microphoneCheck){this.onState({state:'error',code:'mic-check-pending',message:'麦克风诊断仍待处理，请先完成权限弹窗。'});return false;}
    if(this.environmentReport().microphonePolicy===false){this.onState({state:'error',code:'microphone-policy',message:'当前嵌入页面不允许麦克风，请在独立标签打开正式网址。'});return false;}
    this.stopSpeech();const r=this.recognition;const session=++this.session;this.active=true;this.lastRecognitionError=null;let captured=false,hadResult=false;
    const valid=()=>session===this.session;
    r.onresult=e=>{if(!this.active||!valid())return;for(let i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal){hadResult=true;this.onFinal(e.results[i][0].transcript,{final:true,eventId:`${session}:${i}`});}};
    r.onstart=()=>{if(valid()&&!this.lastRecognitionError)this.onState({state:'starting',message:'识别服务已启动，正在等待音频采集。'});};
    r.onaudiostart=()=>{if(valid()&&!this.lastRecognitionError){clearTimeout(this.startWatchdog);captured=true;this.onState({state:'listening',message:'麦克风已开始采集，请说话。音频仅交给本地识别引擎。'});}};
    r.onspeechstart=()=>{if(valid()&&!this.lastRecognitionError)this.onState({state:'speech-detected',message:'已检测到语音，等待最终中文转写。'});};
    const fail=code=>{clearTimeout(this.startWatchdog);this.active=false;this.lastRecognitionError=code;const messages={'start-timeout':'15秒内未收到音频采集开始事件，已停止本轮请求。请查看权限弹窗/地址栏；也可先运行只读诊断，再点击重试。','not-allowed':'麦克风/语音权限被拒绝；请运行麦克风检测，核对本站及 Windows 浏览器麦克风权限。','service-not-allowed':'浏览器拒绝本地识别服务；语言包可用不等于识别服务获准。请保留此错误码。','audio-capture':'音频采集失败，请运行麦克风检测以区分无设备、权限或设备占用。','no-speech':'未检测到可识别语音，请确认系统输入设备及静音状态，再点击说话。','language-not-supported':'当前识别引擎未接受 zh-CN；请重新检测能力，不必反复安装。','network':'本地识别引擎报告 network 错误；未切换云端。请保留错误码排查浏览器实现。','aborted':'本轮识别被浏览器中止，可重新点击开始。','InvalidStateError':'识别器当前无法再次启动，请结束当前会话后重试。','NotAllowedError':'浏览器拒绝启动；请在前台直接点击按钮并检查麦克风权限。'};this.onState({state:'error',code,message:messages[code] || `识别失败（${code}），请保留错误码；不会转云端。`});};
    r.onerror=e=>{if(valid()&&!this.lastRecognitionError)fail(e.error || 'unknown');};
    r.onend=()=>{if(!valid())return;clearTimeout(this.startWatchdog);this.active=false;if(this.lastRecognitionError)return;this.onState({state:hadResult?'idle':'no-result',message:hadResult?'本轮转写结束；点击继续回答。':captured?'音频采集结束但没有最终转写，请查看输入设备/重新说话。':'识别已结束但未收到音频采集开始事件，请运行麦克风检测。'});};
    try{r.processLocally=true;this.onState({state:'starting',message:'正在请求启动本地识别，等待麦克风权限/采集事件…'});r.start();if(this.active&&!captured)this.startWatchdog=setTimeout(()=>{if(valid()&&this.active&&!captured){fail('start-timeout');r.abort();}},15000);this.startWatchdog?.unref?.();return true;}catch(e){fail(e.name || 'unknown');return false;}
  }
  stop(){clearTimeout(this.startWatchdog);this.active=false;this.session++;this.recognition?.abort();}
  stopSpeech(){this.env.speechSynthesis?.cancel();}
  speakPrompt(text){
    // Half-duplex prevents the confirmation prompt being heard as the user's answer.
    this.stop();const synth=this.env.speechSynthesis;
    const voice=synth?.getVoices().find(v=>v.localService===true && /^zh(?:-|$)/i.test(v.lang));
    if(!voice || !this.env.SpeechSynthesisUtterance){this.onState({state:'text-prompt',message:'未发现本地中文朗读声音，请阅读提示。'});return false;}
    synth.cancel();const u=new this.env.SpeechSynthesisUtterance(text);u.voice=voice;u.lang=voice.lang;synth.speak(u);return true;
  }
  destroy(){this.cancelInstallWait();this.stop();this.stopSpeech();}
}
