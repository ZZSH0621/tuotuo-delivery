// Local energy-based endpointing only: no network, transcript or audio storage.
// It estimates the end of an utterance; it does not identify speakers or words.
export function createSpeechEndpoint({silenceMs=1800,noSpeechMs=8000,minSpeechMs=220}={}){
 let elapsed=0,lastVoice=0,voiceRun=0,heard=false,noise=.002,finished=false;
 return {
  consume(pcm,sampleRate){
   if(finished||!pcm?.length||!Number.isFinite(sampleRate)||sampleRate<=0)return null;
   const duration=pcm.length*1000/sampleRate;let energy=0;
   for(const sample of pcm){const x=Number.isFinite(sample)?sample:0;energy+=x*x;}
   const rms=Math.sqrt(energy/pcm.length),threshold=Math.max(.008,Math.min(.025,noise*3));
   elapsed+=duration;
   if(rms>=threshold){voiceRun+=duration;lastVoice=elapsed;if(voiceRun>=minSpeechMs)heard=true;}
   else{voiceRun=0;noise=noise*.96+Math.min(rms,.008)*.04;}
   if(heard&&elapsed-lastVoice>=silenceMs){finished=true;return 'speech-ended';}
   if(!heard&&elapsed>=noSpeechMs){finished=true;return 'no-speech';}
   return null;
  },
  get hasSpeech(){return heard;}
 };
}
