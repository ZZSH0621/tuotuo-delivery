import test from 'node:test';
import assert from 'node:assert/strict';
import {anonymousQuotaIdentity} from '../server/anonymous-quota.mjs';
import {readAPIStatus,submitAPIFile} from '../public/api-request.mjs';
const req=(ip,extra={})=>new Request('https://nurse.example/api/transcriptions',{headers:{...(ip?{'cf-connecting-ip':ip}:{}),...extra}});
test('anonymous identity is server-derived, daily bounded, and stores no raw network address',async()=>{
 const at=Date.UTC(2026,9,31),a=await anonymousQuotaIdentity(req('192.0.2.7'),'site','secret-key',at);
 assert(a.verified);assert.match(a.id,/^anon:[0-9a-f]{64}$/);assert(!a.id.includes('192.0.2.7'));
 assert.deepEqual(await anonymousQuotaIdentity(req('192.0.2.7',{'X-User-Id':'replace','oai-authenticated-user-id':'replace'}),'site','secret-key',at),a);
 for(const args of [[req('192.0.2.8'),'site','secret-key',at],[req('192.0.2.7'),'other','secret-key',at],[req('192.0.2.7'),'site','new-key',at],[req('192.0.2.7'),'site','secret-key',at+86400000]])assert.notEqual((await anonymousQuotaIdentity(...args)).id,a.id);
 assert.deepEqual(await anonymousQuotaIdentity(req(),'site','secret-key',at),await anonymousQuotaIdentity(req(),'site','secret-key',at));
});
test('public session can send audio without login or a browser API key',async()=>{
 const session=await readAPIStatus({fetcher:async()=>Response.json({authenticated:false,anonymousAllowed:true,connected:true,backendReady:true,serverKeyConfigured:true})});
 assert.equal(session.authenticated,false);assert.equal(session.connected,true);
 const text=await submitAPIFile({file:new Blob(['wave']),session,consent:true,fetcher:async(_url,opts)=>{assert.equal(opts.body.has('api_key'),false);return Response.json({code:'TRANSCRIBED_REVIEW_REQUIRED',text:'测试文字'});}});
 assert.equal(text,'测试文字');
});
