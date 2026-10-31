import {QWEN_ASR_MODEL,providerEndpoint} from '../public/api-models.mjs';
function base64(bytes){let raw='';for(let i=0;i<bytes.length;i+=8192)raw+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(raw);}
export function transcriptText(data,model){
 if(model!==QWEN_ASR_MODEL)return data?.text;
 const out=data?.output;
 if(typeof out?.text==='string')return out.text;
 if(typeof out?.output?.sentence?.text==='string')return out.output.sentence.text;
 if(typeof out?.sentence?.text==='string')return out.sentence.text;
 if(Array.isArray(out?.sentences))return out.sentences.map(s=>s.text||'').join('');
 return undefined;
}
export async function callASRProvider({file,key,model,provider,workspace='',audio,signal,transport=fetch}){
 const endpoint=providerEndpoint(provider,workspace);
 if(model===QWEN_ASR_MODEL){
  const bytes=new Uint8Array(await file.arrayBuffer());
  try{return await transport(endpoint,{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','X-DashScope-SSE':'disable'},body:JSON.stringify({model,input:{messages:[{role:'user',content:[{type:'input_audio',input_audio:{data:`data:audio/wav;base64,${base64(bytes)}`}}]}]},parameters:{format:'wav',sample_rate:String(audio.sampleRate)}}),signal,redirect:'manual'});}finally{bytes.fill(0);key='';}
 }
 const form=new FormData();form.append('file',file,'voice.wav');form.append('model',model);form.append('response_format','json');
 try{return await transport(endpoint,{method:'POST',headers:{Authorization:`Bearer ${key}`},body:form,signal,redirect:'manual'});}finally{form.delete('file');key='';}
}

