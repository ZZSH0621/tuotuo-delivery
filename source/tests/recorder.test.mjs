import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecorder, encodeWAV} from '../public/api-recorder.mjs';
import {inspectAudio} from '../server/audio-validator.mjs';
import {readFileSync} from 'node:fs';
const turn = () => new Promise(resolve => setImmediate(resolve));
function fixture({deferPermission = false, permissionError, flush = true, rate = 48000, noWorklet = false} = {}) {
  const states = [], ready = [], contexts = [], nodes = [], timers = new Map();
  let calls = 0, stops = 0, serial = 0, resolvePermission;
  const stream = {getTracks: () => [{stop() { stops++; }}]};
  const graphNode = () => ({connect() {}, disconnect() {this.disconnected = true;}});
  class AudioContext {
    sampleRate = rate; state = 'suspended'; destination = {}; closed = false;
    audioWorklet = noWorklet ? undefined : {addModule: async url => assert.equal(url, '/local-asr/pcm-worklet.mjs')};
    constructor() { contexts.push(this); }
    async resume() { this.state = 'running'; }
    async close() { this.closed = true; this.state = 'closed'; }
    createMediaStreamSource(actual) { assert.equal(actual, stream); return this.source = graphNode(); }
    createGain() { return this.gain = {...graphNode(), gain: {value: 1}}; }
  }
  class AudioWorkletNode {
    constructor(context, name) {
      assert.equal(name, 'nurse-pcm'); nodes.push(this);
      this.port = {onmessage: null, postMessage: value => {assert.equal(value, 'flush'); if (flush) queueMicrotask(() => this.port.onmessage?.({data: {type: 'flushed'}}));}};
    }
    connect() {} disconnect() { this.disconnected = true; }
  }
  const platform = {isSecureContext: true, AudioContext, AudioWorkletNode, navigator: {mediaDevices: {getUserMedia: async constraints => {
    calls++; assert.equal(constraints.video, false); assert.equal(constraints.audio.channelCount, 1);
    if (permissionError) throw Object.assign(new Error('permission rejected'), {name: permissionError});
    return deferPermission ? new Promise(resolve => {resolvePermission = resolve;}) : stream;
  }}}};
  const recorder = createRecorder({platform, onState: s => states.push(s), onReady: b => ready.push(b),
    setTimer: (fn, ms) => {timers.set(++serial, {fn, ms}); return serial;}, clearTimer: id => timers.delete(id)});
  return {platform, recorder, states, ready, contexts, nodes, timers, get calls() {return calls;}, get stops() {return stops;},
    grant: () => resolvePermission(stream),
    pcm: (count = rate) => nodes.at(-1).port.onmessage({data: {type: 'pcm', pcm: new Float32Array(count).fill(0.2)}}),
    fire(ms) { for (const [id, timer] of [...timers]) if (timer.ms === ms) {timers.delete(id); timer.fn();} },
  };
}
test('capability checked before any microphone request', async () => {
  for (const mutate of [p => p.isSecureContext = false, p => delete p.AudioContext, p => delete p.AudioWorkletNode, p => delete p.navigator.mediaDevices]) {
    const f = fixture(); mutate(f.platform); await assert.rejects(f.recorder.start(), /RECORDING_UNSUPPORTED/); assert.equal(f.calls, 0);
  }
  const f = fixture({noWorklet: true}); await assert.rejects(f.recorder.start(), /RECORDING_UNSUPPORTED/); assert.equal(f.calls, 0); assert(f.contexts[0].closed);
});
test('stop flushes, closes graph/tracks and emits validator-compatible PCM16 mono WAV', async () => {
  const f = fixture(); await f.recorder.start(); assert.equal(f.recorder.state, 'recording'); assert.equal(f.contexts[0].gain.gain.value, 0); f.pcm();
  const stop = f.recorder.stop(); assert(f.stops > 0); assert.equal(f.recorder.state, 'stopping'); await stop;
  assert.equal(f.recorder.state, 'idle'); assert.equal(f.ready.length, 1); assert.deepEqual(f.states, ['starting', 'recording', 'stopping', 'idle']);
  const metadata = await inspectAudio(f.ready[0]); assert.equal(metadata.sampleRate, 16000); assert.equal(metadata.channels, 1); assert.equal(metadata.seconds, 1);
  assert(f.contexts[0].closed); assert(f.nodes[0].disconnected); assert.equal(f.nodes[0].port.onmessage, null); assert.equal(f.timers.size, 0);
});
test('duplicate start blocked and duplicate stop never emits twice', async () => {
  const f = fixture(); await f.recorder.start(); await assert.rejects(f.recorder.start(), /RECORDING_BUSY/); assert.equal(f.calls, 1);
  f.pcm(); await Promise.all([f.recorder.stop(), f.recorder.stop()]); assert.equal(f.ready.length, 1);
});
test('cancel while permission pending releases late stream', async () => {
  const f = fixture({deferPermission: true}); const start = f.recorder.start(); await turn(); assert.equal(f.calls, 1); f.recorder.cancel(); f.grant(); await start;
  assert.equal(f.recorder.state, 'idle'); assert.equal(f.stops, 1); assert.equal(f.ready.length, 0); assert(f.contexts[0].closed);
});
test('permission rejection closes context without audio callback', async () => {
  const f = fixture({permissionError: 'NotAllowedError'}); await assert.rejects(f.recorder.start(), {name: 'NotAllowedError'});
  assert.equal(f.recorder.state, 'idle'); assert(f.contexts[0].closed); assert.equal(f.ready.length, 0); assert.equal(f.timers.size, 0);
});
test('30-second limit automatically stops and bounds emitted WAV', async () => {
  const f = fixture({rate: 16000}); await f.recorder.start(); f.pcm(16000 * 31); f.fire(30000); await turn();
  assert.equal(f.recorder.state, 'idle'); assert.equal(f.ready.length, 1); assert.equal((await inspectAudio(f.ready[0])).seconds, 30); assert(f.stops > 0);
});
test('cancel during flush invalidates late callbacks', async () => {
  const f = fixture({flush: false}); await f.recorder.start(); f.pcm(); const oldMessage = f.nodes[0].port.onmessage;
  const stop = f.recorder.stop(); f.recorder.cancel(); oldMessage({data: {type: 'flushed'}}); await stop;
  assert.equal(f.ready.length, 0); assert.equal(f.recorder.state, 'idle'); assert.equal(f.timers.size, 0);
});
test('missing flush acknowledgement fails closed, not partial audio', async () => {
  const f = fixture({flush: false}); await f.recorder.start(); f.pcm(); const stop = f.recorder.stop(); const rejected = assert.rejects(stop, /FLUSH_TIMEOUT/); f.fire(300); await rejected;
  assert.equal(f.ready.length, 0); assert.equal(f.recorder.state, 'idle'); assert(f.contexts[0].closed); assert(f.stops > 0);
});
test('encoder rates, empties, clamping and nonfinite sample handling', async () => {
  for (const rate of [8000, 16000, 44100, 48000, 192000]) {
    const metadata = await inspectAudio(encodeWAV([new Float32Array(rate).fill(0.25)], rate));
    assert.equal(metadata.seconds, 1); assert.equal(metadata.sampleRate, 16000); assert.equal(metadata.bitsPerSample, 16);
  }
  assert.throws(() => encodeWAV([], 16000), /EMPTY/); assert.throws(() => encodeWAV([new Float32Array(1)], NaN), /RATE/);
  const view = new DataView(await encodeWAV([Float32Array.from([-2, 2, NaN])], 16000).arrayBuffer());
  assert.equal(view.getInt16(44, true), -32768); assert.equal(view.getInt16(46, true), 32767); assert.equal(view.getInt16(48, true), 0);
});
test('capture has no upload/persistence and UI distinguishes capture from send', () => {
  const source = readFileSync(new URL('../public/api-recorder.mjs', import.meta.url), 'utf8'); assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|console\./);
  const ui = readFileSync(new URL('../public/api-voice-ui.mjs', import.meta.url), 'utf8'); assert.match(ui, /apiRecord/); assert.match(ui, /apiSendConsent/); assert.match(ui, /isLocalVoiceListening/);
});
let uiSequence = 0;
async function uiFixture(t, options = {}) {
  const f = fixture(options), nodes = new Map(), calls = [];
  class Element extends EventTarget {
    value = ''; textContent = ''; checked = false; disabled = false; hidden = true; files = [];
    click() { this.onclick?.({isTrusted: false}); this.dispatchEvent(new Event('click')); }
    scrollIntoView() {} pause() {} removeAttribute(name) { delete this[name]; }
  }
  const q = id => {if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id);};
  const document = new EventTarget(); document.hidden = false; document.getElementById = q; document.querySelector = selector => q(selector);
  const window = new EventTarget(); window.showIndependentASR = () => {}; window.closeVoicePanel = () => {}; window.isLocalVoiceListening = () => false;
  const replacements = {...f.platform, document, window, fetch: async (url, args) => {
    calls.push({url, args}); assert.equal(url, '/api/session', 'record/stop/cancel must never upload'); return Response.json({authenticated: true, connected: true, owner: true});
  }};
  const originals = new Map(Object.keys(replacements).map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]));
  for (const [name, value] of Object.entries(replacements)) Object.defineProperty(globalThis, name, {value, writable: true, configurable: true});
  t.after(() => {q('apiCancel').onclick?.(); for (const [name, d] of originals) {if (d) Object.defineProperty(globalThis, name, d); else delete globalThis[name];}});
  await import(new URL(`../public/api-voice-ui.mjs?recorder-review=${++uiSequence}`, import.meta.url)); await turn(); return {...f, q, document, window, calls};
}
test('UI record/stop creates local preview only, suppresses screensaver and leaves consent unchecked', async t => {
  const f = await uiFixture(t); assert.equal(f.q('apiRecord').disabled, false); await f.q('apiRecord').onclick({isTrusted: true});
  assert.equal(f.window.isLocalVoiceListening(), true); assert.equal(f.q('apiStart').disabled, true); f.pcm(); await f.q('apiStopRecord').onclick();
  assert.equal(f.window.isLocalVoiceListening(), false); assert.equal(f.q('apiAudioPreview').hidden, false); assert.equal(f.q('apiSendConsent').checked, false); assert.equal(f.calls.length, 1);
  f.q('apiManualKey').value = 'DUMMY_NOT_REAL'; f.q('apiSendConsent').checked = true; f.window.dispatchEvent(new Event('pagehide'));
  assert.equal(f.q('apiManualKey').value, ''); assert.equal(f.q('apiAudioPreview').hidden, true); assert.equal(f.q('apiSendConsent').checked, false);
});
test('UI closing pending permission stops late track without preview/upload', async t => {
  const f = await uiFixture(t, {deferPermission: true}); const start = f.q('apiRecord').onclick({isTrusted: true}); await turn();
  f.q('closeAPIRecognition').onclick(); f.grant(); await start;
  assert.equal(f.q('apiRecognitionPanel').hidden, true); assert.equal(f.q('apiAudioPreview').hidden, true); assert.equal(f.window.isLocalVoiceListening(), false); assert.equal(f.calls.length, 1); assert(f.contexts[0].closed);
});
