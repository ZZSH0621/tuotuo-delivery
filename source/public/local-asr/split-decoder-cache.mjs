import {DECODER} from './split-decoder-manifest.mjs';
/** Decoder cache assembled only from pinned same-origin chunks before pipeline starts. */
export function createSplitDecoderCache({baseURL,manifest=DECODER,fetcher=globalThis.fetch,cryptoImpl=globalThis.crypto,cacheStorage=globalThis.caches,onProgress=()=>{}}={}){
 const base=new URL(baseURL);let decoder=null,pending=null;
 const digest=async bytes=>Array.from(new Uint8Array(await cryptoImpl.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 const response=bytes=>new Response(bytes,{headers:{'Content-Type':'application/octet-stream','Content-Length':String(bytes.byteLength)}});
 const cacheName='nurse-asr-pinned-decoder-'+manifest.sha256;
 const mergedKey=new URL(manifest.file,base).href;
 let storePromise;const store=()=>storePromise ||= (cacheStorage?.open(cacheName).catch(()=>null) ?? Promise.resolve(null));
 async function prepare(){if(decoder)return;if(pending)return pending;pending=(async()=>{let loaded=0;const output=new Uint8Array(manifest.bytes);let offset=0;const cache=await store();
  // Only a fully validated reconstructed decoder is cached; stale/corrupt cache is ignored.
  const cached=await cache?.match(mergedKey).catch(()=>null);
  if(cached){const b=new Uint8Array(await cached.arrayBuffer());if(b.length===manifest.bytes&&await digest(b)===manifest.sha256){decoder=b;onProgress({status:'done',file:manifest.file,loaded:b.length,total:b.length,source:'validated-cache'});return;}await cache.delete(mergedKey).catch(()=>{});}
  for(const part of manifest.parts){const url=new URL(part.file,base);if(url.origin!==base.origin||!url.href.startsWith(base.href))throw Error('拒绝跨源或越界模型分块路径');const res=await fetcher(url.href,{credentials:'same-origin',redirect:'error'});if(!res.ok)throw Error(`模型分块下载失败 ${part.file}：HTTP ${res.status}`);const reader=res.body?.getReader();let bytes;
   if(reader){const arr=[];let n=0;while(true){const {done,value}=await reader.read();if(done)break;n+=value.byteLength;if(n>part.bytes){await reader.cancel();throw Error('模型分块大小超出清单：'+part.file);}arr.push(value);loaded+=value.byteLength;onProgress({status:'progress',file:manifest.file,part:part.file,loaded,total:manifest.bytes,progress:100*loaded/manifest.bytes});}bytes=new Uint8Array(n);let at=0;for(const a of arr){bytes.set(a,at);at+=a.length;}}
   else{bytes=new Uint8Array(await res.arrayBuffer());loaded+=bytes.length;onProgress({status:'progress',file:manifest.file,part:part.file,loaded,total:manifest.bytes,progress:100*loaded/manifest.bytes});}
   if(bytes.length!==part.bytes||await digest(bytes)!==part.sha256)throw Error('模型分块完整性校验失败：'+part.file);output.set(bytes,offset);offset+=bytes.length;
  }
  if(offset!==manifest.bytes||await digest(output)!==manifest.sha256)throw Error('合并模型SHA256校验失败');decoder=output;await cache?.put(mergedKey,response(output)).catch(()=>{});onProgress({status:'done',file:manifest.file,loaded:output.length,total:output.length,source:'verified-chunks'});
 })().finally(()=>{pending=null;});return pending;}
 return {prepare,
  async match(key){const name=String(key);if(name.split('?')[0].endsWith('/'+manifest.file)){if(!decoder)throw Error('模型尚未完成分块校验');return response(decoder);}const cache=await store();return cache?.match(key).catch(()=>undefined);},
  async put(key,res){if(String(key).split('?')[0].endsWith('/'+manifest.file))return;const cache=await store();await cache?.put(key,res).catch(()=>{});},
  get ready(){return !!decoder;}
 };
}
