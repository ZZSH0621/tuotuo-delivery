class NursePCM extends AudioWorkletProcessor {
 constructor(){super();this.buffer=new Float32Array(4096);this.offset=0;this.port.onmessage=({data})=>{if(data==='flush'){this.flush();this.port.postMessage({type:'flushed'});}};}
 flush(){if(this.offset){const chunk=this.buffer.slice(0,this.offset);this.port.postMessage({type:'pcm',pcm:chunk},[chunk.buffer]);this.offset=0;}}
 process(inputs){const channels=inputs[0];if(!channels?.length)return true;for(let i=0;i<channels[0].length;i++){let x=0;for(const ch of channels)x+=ch[i]||0;this.buffer[this.offset++]=x/channels.length;if(this.offset===this.buffer.length)this.flush();}return true;}
}
registerProcessor('nurse-pcm',NursePCM);
