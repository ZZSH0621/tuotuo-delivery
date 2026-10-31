import {pipeline,env} from './vendor/transformers.min.js';
import {createSplitDecoderCache} from './split-decoder-cache.mjs';
let loadId=null;
const decoderCache=createSplitDecoderCache({baseURL:new URL('./models/whisper-tiny/onnx/',import.meta.url).href,onProgress:progress=>self.postMessage({id:loadId,type:'progress',progress})});
env.useCustomCache=true;env.customCache=decoderCache;
env.allowRemoteModels=false;
env.allowLocalModels=true;
env.localModelPath=new URL('./models/',import.meta.url).href;
env.useBrowserCache=true;
env.backends.onnx.wasm.wasmPaths=new URL('./vendor/',import.meta.url).href;
env.backends.onnx.wasm.numThreads=1;
let pipe=null,working=false;
self.onmessage=async({data})=>{
 const {id,type,pcm}=data;
 try{
  if(type==='load'){
   loadId=id;await decoderCache.prepare();
   if(!pipe)pipe=await pipeline('automatic-speech-recognition','whisper-tiny',{device:'wasm',dtype:'q8',progress_callback:p=>self.postMessage({id,type:'progress',progress:p})});
   self.postMessage({id,type:'ready'});
  }else if(type==='transcribe'){
   if(!pipe)throw Error('请先点击加载本地模型。');
   if(working)throw Error('正在处理上一段音频。');
   if(!(pcm instanceof Float32Array)||pcm.length<1600||pcm.length>480000)throw Error('仅支持0.1到30秒的16kHz单声道音频。');
   working=true;const started=performance.now();
   const output=await pipe(pcm,{language:'chinese',task:'transcribe',return_timestamps:false,max_new_tokens:128});
   self.postMessage({id,type:'result',text:output.text,elapsedMs:performance.now()-started});
  }
 }catch(e){self.postMessage({id,type:'error',message:e.message});}finally{working=false;}
};
