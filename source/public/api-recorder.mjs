import {createSpeechEndpoint} from './speech-endpoint.mjs';
// This module only captures local audio. The caller owns its declared send policy.
// It never fetches, stores audio, bypasses permissions or retries upstream calls.
export function encodeWAV(chunks, inputRate) {
  if (!Number.isFinite(inputRate) || inputRate < 8000 || inputRate > 192000) throw Error('INVALID_RATE');
  const length = Math.min(chunks.reduce((n, c) => n + c.length, 0), Math.floor(inputRate * 30));
  const count = Math.floor(length * 16000 / inputRate);
  if (!length || !count) throw Error('EMPTY_RECORDING');
  const source = new Float32Array(length); let offset = 0;
  for (const chunk of chunks) { const n = Math.min(chunk.length, length - offset); source.set(chunk.subarray(0, n), offset); offset += n; if (offset === length) break; }
  const buffer = new ArrayBuffer(44 + count * 2), view = new DataView(buffer);
  const str = (at, s) => { for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); view.setUint32(4, 36 + count * 2, true); str(8, 'WAVE'); str(12, 'fmt '); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 16000, true); view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); str(36, 'data'); view.setUint32(40, count * 2, true);
  // Weighted source intervals: bounded local conversion, not clinical DSP validation.
  for (let i = 0; i < count; i++) {
    const start = i * inputRate / 16000, end = (i + 1) * inputRate / 16000; let total = 0, weight = 0;
    for (let j = Math.floor(start); j < Math.ceil(end) && j < length; j++) {
      const w = Math.min(end, j + 1) - Math.max(start, j); total += (Number.isFinite(source[j]) ? source[j] : 0) * w; weight += w;
    }
    const sample = Math.max(-1, Math.min(1, total / (weight || 1)));
    view.setInt16(44 + i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
  }
  source.fill(0); return new Blob([buffer], {type: 'audio/wav'});
}

export function createRecorder({platform = globalThis, onState = () => {}, onReady = () => {}, onLevel = () => {}, onSegment = null, segmentSeconds = 25, maxSeconds = 30, autoStopOnSilence = false, silenceMs = 1800, noSpeechMs = 8000, setTimer = setTimeout, clearTimer = clearTimeout} = {}) {
  const maximumMs=onSegment?Infinity:maxSeconds*1000;
  let capturePeak=0,segmentPeak=0;
  let remaining = maximumMs, startedAt = 0, endpoint = null;
  let state = 'idle', generation = 0, stream, context, source, node, gain, timer, flushTimer, flushResolve, chunks = [], samples = 0;
  const update = value => { state = value; onState(value); };
  const wipe = () => { for (const chunk of chunks) chunk.fill(0); chunks = []; samples = 0; segmentPeak=0; };
  const release = () => {
    clearTimer(timer); clearTimer(flushTimer); flushResolve?.(false); flushResolve = null;
    for (const track of stream?.getTracks() || []) track.stop(); stream = null;
    for (const n of [source, node, gain]) { try { n?.disconnect(); } catch {} }
    if (node) node.port.onmessage = null; source = node = gain = null;
    const c = context; context = null; try { c?.close()?.catch(() => {}); } catch {}
  };
  function cancel() { generation++; endpoint=null; release(); wipe(); update('idle'); }
  async function start() {
    if (state !== 'idle') throw Error('RECORDING_BUSY');
    const AC = platform.AudioContext || platform.webkitAudioContext;
    if (!platform.isSecureContext || !platform.navigator?.mediaDevices?.getUserMedia || !AC || !platform.AudioWorkletNode) throw Error('RECORDING_UNSUPPORTED');
    capturePeak=0;segmentPeak=0;remaining = maximumMs; endpoint=autoStopOnSilence?createSpeechEndpoint({silenceMs,noSpeechMs}):null; const g = ++generation; update('starting');
    try {
      context = new AC(); if (!context.audioWorklet?.addModule) throw Error('RECORDING_UNSUPPORTED');
      await context.resume(); if (g !== generation) return;
      await context.audioWorklet.addModule('/local-asr/pcm-worklet.mjs'); if (g !== generation) return;
      const acquired = await platform.navigator.mediaDevices.getUserMedia({audio: {channelCount: 1, autoGainControl: true, echoCancellation: true, noiseSuppression: true}, video: false});
      if (g !== generation) { for (const t of acquired.getTracks()) t.stop(); return; } stream = acquired;
      if (context.state !== 'running') throw Error('AUDIO_CONTEXT_NOT_RUNNING');
      node = new platform.AudioWorkletNode(context, 'nurse-pcm'); source = context.createMediaStreamSource(stream); gain = context.createGain(); gain.gain.value = 0;
      node.port.onmessage = ({data}) => {
        if (g !== generation || !context) return;
        if (data?.type === 'flushed') { flushResolve?.(true); return; }
        if (data?.type === 'pcm' && data.pcm instanceof Float32Array) {
          let peak=0,energy=0;for(const sample of data.pcm){const x=Number.isFinite(sample)?sample:0;peak=Math.max(peak,Math.abs(x));energy+=x*x;}capturePeak=Math.max(capturePeak,peak);segmentPeak=Math.max(segmentPeak,peak);onLevel({rms:Math.sqrt(energy/(data.pcm.length||1)),peak,hasSignal:capturePeak>=.0001});
          if(onSegment){let offset=0;const target=Math.floor(context.sampleRate*Math.min(30,Math.max(1,segmentSeconds)));while(offset<data.pcm.length){const count=Math.min(data.pcm.length-offset,target-samples);if(count>0){chunks.push(data.pcm.slice(offset,offset+count));samples+=count;offset+=count;}if(samples>=target){const segment=encodeWAV(chunks,context.sampleRate),details={silent:segmentPeak<.0001};wipe();onSegment(segment,details);}}return;}
          const n = Math.min(data.pcm.length, Math.floor(context.sampleRate * 30) - samples);
          if (n > 0) { chunks.push(data.pcm.slice(0, n)); samples += n; }
          if(state==='recording'&&endpoint){const reason=endpoint.consume(data.pcm,context.sampleRate);if(reason)stop(reason).catch(()=>{});}
        }
      };
      source.connect(node); node.connect(gain); gain.connect(context.destination); update('recording');
      startedAt = Date.now(); if(Number.isFinite(remaining))timer = setTimer(() => { stop('limit').catch(() => {}); }, remaining);
    } catch (error) { if (g === generation) cancel(); throw error; }
  }
  async function stop(reason='manual') {
    if (!['recording','paused'].includes(state)) return;
    const wasPaused = state === 'paused'; const g = generation; update('stopping'); clearTimer(timer);
    for (const t of stream?.getTracks() || []) t.stop(); try { source.disconnect(); } catch {}
    try {
      if (wasPaused) await context.resume();
      if (g !== generation) return;
      const acknowledged = await new Promise(resolve => {
        flushResolve = resolve; flushTimer = setTimer(() => resolve(false), 300); node.port.postMessage('flush');
      });
      if (g !== generation) return;
      if (!acknowledged) throw Error('FLUSH_TIMEOUT');
      const blob = samples?encodeWAV(chunks, context.sampleRate):null;
      if(!blob&&!onSegment)throw Error('EMPTY_RECORDING');
      const details={reason,speechDetected:endpoint?.hasSpeech??null,silent:(onSegment?segmentPeak:capturePeak)<.0001};
      generation++; endpoint=null; release(); wipe(); update('idle'); onReady(blob,details);
    } catch (error) { if (g === generation) { cancel(); onState('error'); } throw error; }
  }
  async function pause() { if (state !== 'recording') return; const g=generation; clearTimer(timer); remaining=Math.max(1,remaining-(Date.now()-startedAt)); await context.suspend(); if(g===generation)update('paused'); }
  async function resume() { if (state !== 'paused') return; const g=generation; await context.resume(); if(g!==generation)return; startedAt=Date.now(); update('recording'); if(Number.isFinite(remaining))timer=setTimer(()=>stop('limit').catch(()=>{}),remaining); }
  return {start, stop, pause, resume, cancel, get state() { return state; }};
}
