import {fileURLToPath} from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
const wave=()=>{const b=Buffer.alloc(32044);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(16000,24);b.writeUInt32LE(32000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(32000,40);return b;};
test('Cloudflare runtime accepts WAV, invokes provider once, and returns text; redirects never followed',async()=>{
 let calls=0,status=200;
 const mf=new Miniflare({modules:true,scriptPath:fileURLToPath(new URL('./worker-asr-fixture.mjs',import.meta.url)),compatibilityDate:'2026-05-15',outboundService:async req=>{calls++;assert.equal(new URL(req.url).hostname,'dashscope.aliyuncs.com');assert.equal(req.headers.get('Authorization'),'Bearer synthetic-test-key');const body=await req.json();assert.match(body.input.messages[0].content[0].input_audio.data,/^data:audio\/wav;base64,/);return status===200?Response.json({output:{text:'运行时转写测试'}}):new Response(null,{status:302,headers:{Location:'https://redirect.invalid'}});}});
 try{for(const expected of [200,502]){const body=new FormData();body.set('file',new Blob([wave()],{type:'audio/wav'}),'voice.wav');body.set('model','qwen-audio-3.1-asr-flash');body.set('consent','send-to-provider-paid');const encoded=new Request('https://nurse.example/api/transcriptions',{method:'POST',body});const response=await mf.dispatchFetch(encoded.url,{method:'POST',headers:{Origin:'https://nurse.example','Content-Type':encoded.headers.get('content-type'),'Idempotency-Key':crypto.randomUUID()},body:new Uint8Array(await encoded.arrayBuffer())});assert.equal(response.status,expected,await response.clone().text());if(expected===200)assert.equal((await response.json()).text,'运行时转写测试');status=302;}assert.equal(calls,2);}finally{await mf.dispose();}
});



