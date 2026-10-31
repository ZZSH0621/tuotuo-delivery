// Validated reconstruction; PCM16 RIFF/WAVE only (not MP3/WebM/float/RF64).
// Validates container structure and duration, not intelligibility or clinical accuracy.
export const WAV_LIMITS = Object.freeze({maxBytes:1900*1024,maxSeconds:30,maxChunks:1024,minRate:8000,maxRate:48000});
function invalid() { return Object.assign(new Error('AUDIO_INVALID'), {code:'AUDIO_INVALID'}); }
function aborted() { return Object.assign(new Error('AUDIO_ABORTED'), {name:'AbortError',code:'AUDIO_ABORTED'}); }
function checkAbort(signal) { if (signal?.aborted) throw aborted(); }
async function readBlob(blob, signal) {
  checkAbort(signal);
  let listener;
  try {
    const reading = blob.arrayBuffer();
    if (!signal) return await reading;
    return await Promise.race([reading, new Promise((_, reject) => {
      listener = () => reject(aborted());
      signal.addEventListener('abort', listener, {once:true});
      if (signal.aborted) listener();
    })]);
  } finally { if (listener) signal.removeEventListener('abort', listener); }
}
export async function inspectAudio(blob, {signal} = {}) {
  try {
    checkAbort(signal);
    if (!(blob instanceof Blob) || blob.size < 44 || blob.size > WAV_LIMITS.maxBytes) throw invalid();
    const buffer = await readBlob(blob, signal);
    checkAbort(signal);
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength !== blob.size || buffer.byteLength > WAV_LIMITS.maxBytes) throw invalid();
    const view = new DataView(buffer), length = buffer.byteLength;
    const id = offset => String.fromCharCode(...new Uint8Array(buffer, offset, 4));
    if (id(0) !== 'RIFF' || id(8) !== 'WAVE' || view.getUint32(4,true) !== length-8) throw invalid();
    let pos=12, chunks=0, format=null, dataBytes=null;
    while (pos < length) {
      checkAbort(signal);
      if (++chunks > WAV_LIMITS.maxChunks || length-pos < 8) throw invalid();
      const kind=id(pos), size=view.getUint32(pos+4,true), start=pos+8;
      const end=start+size, padded=end+(size%2);
      if (end > length || padded > length) throw invalid();
      if (kind === 'fmt ') {
        if (format || (size !== 16 && size !== 18)) throw invalid();
        const tag=view.getUint16(start,true), channels=view.getUint16(start+2,true);
        const sampleRate=view.getUint32(start+4,true), byteRate=view.getUint32(start+8,true);
        const blockAlign=view.getUint16(start+12,true), bits=view.getUint16(start+14,true);
        if (tag !== 1 || ![1,2].includes(channels) || sampleRate < WAV_LIMITS.minRate || sampleRate > WAV_LIMITS.maxRate || bits !== 16 || blockAlign !== channels*2 || byteRate !== sampleRate*blockAlign || (size === 18 && view.getUint16(start+16,true) !== 0)) throw invalid();
        format={channels,sampleRate,blockAlign};
      } else if (kind === 'data') {
        if (dataBytes !== null || size === 0) throw invalid();
        dataBytes=size;
      }
      pos=padded;
    }
    if (!format || dataBytes === null || dataBytes%format.blockAlign !== 0) throw invalid();
    const frames=dataBytes/format.blockAlign, seconds=frames/format.sampleRate;
    if (seconds <= 0 || seconds > WAV_LIMITS.maxSeconds) throw invalid();
    checkAbort(signal);
    return Object.freeze({validated:true,container:'wav',encoding:'pcm_s16le',seconds,frames,channels:format.channels,sampleRate:format.sampleRate,bitsPerSample:16,dataBytes,totalBytes:length});
  } catch (error) {
    if (signal?.aborted || error?.code === 'AUDIO_ABORTED') throw aborted();
    throw invalid();
  }
}
