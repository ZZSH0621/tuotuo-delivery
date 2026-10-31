import {createTranscriptionHandler} from '../server/transcription-handler.mjs';
import {inspectAudio} from '../server/audio-validator.mjs';
export default {fetch(request){return createTranscriptionHandler({enabled:true,origin:'https://nurse.example',siteId:'test-site',serverKey:'synthetic-test-key',maxCostMicrosPerRequest:1,authenticate:async()=>({verified:true,id:'test-user'}),quota:{checkAttempt:async()=>true,reserve:async()=>true},inspectAudio,transport:fetch})(request);}};
