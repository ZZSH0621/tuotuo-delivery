import {env} from 'cloudflare:workers';

import {runtimeConfig} from '../../../server/runtime-config.mjs';
export const dynamic='force-dynamic';
export async function GET(){let ready=false;if(runtimeConfig(env).enabled&&env.DASHSCOPE_API_KEY&&env.DB){try{await env.DB.prepare('SELECT site_id FROM api_attempt_windows LIMIT 1').first();await env.DB.prepare('SELECT site_id FROM api_cost_reservations LIMIT 1').first();ready=true;}catch{}}return Response.json({authenticated:false,anonymousAllowed:true,backendReady:ready,connected:ready,serverKeyConfigured:!!env.DASHSCOPE_API_KEY,provider:env.ASR_PROVIDER||'bailian-cn',workspace:env.ASR_WORKSPACE||'',owner:false},{headers:{'Cache-Control':'no-store'}});}
