import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectAudio, WAV_LIMITS} from '../server/audio-validator.mjs';

// Synthetic silent PCM only: no recordings, files, device or network access.
function chunk(id, body) {
  const b=Buffer.alloc(8+body.length+(body.length%2));
  b.write(id); b.writeUInt32LE(body.length,4); body.copy(b,8); return b;
}
function fmt({channels=1,rate=16000,tag=1,bits=16,extended=false}={}) {
  const b=Buffer.alloc(extended?18:16);
  b.writeUInt16LE(tag,0); b.writeUInt16LE(channels,2); b.writeUInt32LE(rate,4);
  b.writeUInt32LE(rate*channels*2,8); b.writeUInt16LE(channels*2,12); b.writeUInt16LE(bits,14);
  return chunk('fmt ',b);
}
function riff(parts) {
  const body=Buffer.concat(parts), b=Buffer.alloc(12);
  b.write('RIFF'); b.writeUInt32LE(body.length+4,4); b.write('WAVE',8);
  return Buffer.concat([b,body]);
}
function wav(o={}) {
  const {channels=1,rate=16000,frames=rate}=o;
  return riff([fmt(o),chunk('data',Buffer.alloc(frames*channels*2))]);
}
const blob=b=>new Blob([b],{type:'audio/wav'});
const bad=async b=>assert.rejects(inspectAudio(blob(b)),e=>e.code==='AUDIO_INVALID' && e.message==='AUDIO_INVALID');

test('mono/stereo, supported rates, actual duration and immutable result',async()=>{
  for(const channels of [1,2]) for(const rate of [8000,16000,44100,48000]) {
    const r=await inspectAudio(blob(wav({channels,rate})));
    assert.equal(r.validated,true); assert.equal(r.seconds,1); assert.equal(r.frames,rate);
    assert.equal(r.channels,channels); assert.equal(r.sampleRate,rate); assert.ok(Object.isFrozen(r));
  }
});
test('MIME and duck types are not validation',async()=>{
  assert.equal((await inspectAudio(new Blob([wav()],{type:'application/octet-stream'}))).seconds,1);
  await bad(Buffer.alloc(100));
  await assert.rejects(inspectAudio({size:100,arrayBuffer:async()=>wav().buffer}),/AUDIO_INVALID/);
});
test('unknown chunks, odd padding, extended PCM and data before format',async()=>{
  const b=riff([chunk('JUNK',Buffer.from([1])),chunk('LIST',Buffer.alloc(0)),chunk('data',Buffer.alloc(32000)),fmt({extended:true})]);
  assert.equal((await inspectAudio(blob(b))).seconds,1);
});
test('compressed, float, extensible, bit depth, channels and rate rejected',async()=>{
  for(const o of [{tag:3},{tag:6},{tag:65534},{bits:8},{bits:24},{channels:3},{channels:0},{rate:7999},{rate:48001}]) await bad(wav(o));
});
test('invalid byte rate, block alignment and extension rejected',async()=>{
  for(const offset of [28,32]) {const b=wav(); b[offset]^=1; await bad(b);}
  const b=wav({extended:true}); b.writeUInt16LE(1,36); await bad(b);
});
test('headers, truncation, RIFF length, trailing bytes and oversized chunk rejected',async()=>{
  const b=wav(); await bad(b.subarray(0,43)); await bad(b.subarray(0,b.length-1));
  const wrong=Buffer.from(b); wrong.write('RF64'); await bad(wrong);
  const size=Buffer.from(b); size.writeUInt32LE(0,4); await bad(size);
  await bad(Buffer.concat([b,Buffer.from([0])]));
  const huge=Buffer.from(b); huge.writeUInt32LE(0xffffffff,40); await bad(huge);
});
test('truthful outer size cannot hide truncated chunk header or missing padding',async()=>{
  const b=Buffer.concat([wav(),Buffer.from([1,2,3])]); b.writeUInt32LE(b.length-8,4); await bad(b);
  const padded=riff([fmt(),chunk('data',Buffer.alloc(2)),chunk('JUNK',Buffer.from([1]))]);
  const missing=padded.subarray(0,padded.length-1); missing.writeUInt32LE(missing.length-8,4); await bad(missing);
});
test('duplicate/missing/empty chunks and incomplete PCM frames rejected',async()=>{
  const f=fmt(), d=chunk('data',Buffer.alloc(32000));
  for(const parts of [[f,f,d],[f,d,d],[d],[f],[f,chunk('data',Buffer.alloc(0))],[f,chunk('data',Buffer.alloc(3))]]) await bad(riff(parts));
});
test('30 second boundary derived from frame bytes',async()=>{
  assert.equal((await inspectAudio(blob(wav({frames:16000*30})))).seconds,30);
  await bad(wav({frames:16000*30+1}));
});
test('byte cap before read and bounded chunk count',async()=>{
  class TooLarge extends Blob {arrayBuffer(){throw new Error('should not read');}}
  await assert.rejects(inspectAudio(new TooLarge([new Uint8Array(WAV_LIMITS.maxBytes+1)])),/AUDIO_INVALID/);
  await bad(riff([fmt(),...Array.from({length:1023},()=>chunk('JUNK',Buffer.alloc(0))),chunk('data',Buffer.alloc(2))]));
});
test('preabort, pending read abort and underlying failure are sanitized',async()=>{
  const a=new AbortController(); a.abort(new Error('private'));
  const isAbort=e=>e.code==='AUDIO_ABORTED' && e.name==='AbortError' && e.message==='AUDIO_ABORTED';
  await assert.rejects(inspectAudio(blob(wav()),{signal:a.signal}),isAbort);
  class Stalled extends Blob {arrayBuffer(){return new Promise(()=>{});}}
  const b=new AbortController(), pending=inspectAudio(new Stalled([wav()]),{signal:b.signal});
  b.abort(); await assert.rejects(pending,isAbort);
  class Failed extends Blob {arrayBuffer(){throw new Error('private internal details');}}
  await assert.rejects(inspectAudio(new Failed([wav()])),e=>e.message==='AUDIO_INVALID');
});
