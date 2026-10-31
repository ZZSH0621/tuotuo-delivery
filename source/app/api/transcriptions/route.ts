import {env} from 'cloudflare:workers';
import {runtimeConfig} from '../../../server/runtime-config.mjs';
import {unrestrictedUsage} from '../../../server/unrestricted-usage.mjs';
import {inspectAudio} from '../../../server/audio-validator.mjs';
import {createTranscriptionHandler} from '../../../server/transcription-handler.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){const config=runtimeConfig(env);if(!config.enabled||!config.serverKey)return Response.json({code:'BACKEND_NOT_CONNECTED'},{status:503,headers:{'Cache-Control':'no-store'}});const handler=createTranscriptionHandler({...config,authenticate:async()=>({verified:true,id:'public'}),quota:unrestrictedUsage,inspectAudio,transport:fetch});return handler(request);}
