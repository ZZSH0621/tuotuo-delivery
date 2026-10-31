/** Local, memory-only capture adapter. Never invoked automatically; not yet deployed. */
export class LocalCapture {
  constructor({env=globalThis,onState=()=>{},onPCM=()=>{},maxSeconds=30}={}) {
    Object.assign(this,{env,onState,onPCM,maxSeconds});this.phase='idle';this.generation=0;
  }
  emit(phase,message){this.phase=phase;this.onState({phase,message});}
  release(){clearTimeout(this.limit);this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;}
  async start(event){
    if(!event?.isTrusted||!['idle','error','ready'].includes(this.phase))return false;
    if(!this.env.isSecureContext||!this.env.navigator?.mediaDevices?.getUserMedia||!this.env.MediaRecorder){this.emit('error','当前环境不支持安全的本地音频采集；请继续文字输入。');return false;}
    const generation=++this.generation;this.emit('requesting','等待麦克风授权；尚未确认采集。');
    try {
      const stream=await this.env.navigator.mediaDevices.getUserMedia({audio:true,video:false});
      if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return false;}
      this.stream=stream;this.chunks=[];
      const recorder=new this.env.MediaRecorder(stream);this.recorder=recorder;
      recorder.ondataavailable=e=>{if(generation===this.generation&&e.data.size)this.chunks.push(e.data)};
      recorder.onerror=()=>{this.cancel();this.emit('error','音频采集失败，已释放麦克风；没有上传音频。');};
      recorder.onstop=async()=>{
        this.release();if(generation!==this.generation)return;
        const chunks=this.chunks;this.chunks=[];
        if(!chunks.length){this.emit('error','没有可解码的音频；可重试或使用文字。');return;}
        let context;
        try {
          this.emit('decoding','正在本机解码音频…');
          const blob=new Blob(chunks,{type:recorder.mimeType});
          const AC=this.env.AudioContext||this.env.webkitAudioContext;context=new AC();
          const audio=await context.decodeAudioData(await blob.arrayBuffer());
          const mono=new Float32Array(audio.length);
          for(let c=0;c<audio.numberOfChannels;c++){const ch=audio.getChannelData(c);for(let i=0;i<mono.length;i++)mono[i]+=ch[i]/audio.numberOfChannels;}
          if(generation!==this.generation)return;
          this.emit('ready','音频已在本机解码，准备本地识别；不上传。');
          await this.onPCM(mono,audio.sampleRate);
        }catch(e){if(generation===this.generation)this.emit('error','本机音频解码失败：'+e.name+'；请继续文字。');}
        finally{await context?.close();}
      };
      recorder.start();this.emit('recording','正在录音，仅保留在本机内存；点击停止后识别。');
      this.limit=setTimeout(()=>this.stop(),this.maxSeconds*1000);return true;
    }catch(e){this.release();if(generation!==this.generation)return false;const labels={NotAllowedError:'麦克风授权被拒绝',NotFoundError:'未找到麦克风',NotReadableError:'麦克风不可读取或正被占用',SecurityError:'当前页面策略阻止麦克风'};this.emit('error',(labels[e.name]||'无法启动麦克风')+' ['+e.name+']；未上传音频。');return false;}
  }
  stop(){if(this.phase!=='recording')return;this.emit('stopping','正在停止麦克风…');if(this.recorder?.state!=='inactive')this.recorder.stop();this.release();}
  cancel(){++this.generation;this.release();if(this.recorder?.state==='recording')this.recorder.stop();this.chunks=[];this.emit('idle','已取消，本轮音频未提交。');}
}
