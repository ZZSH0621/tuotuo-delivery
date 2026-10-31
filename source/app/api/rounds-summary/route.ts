import {env} from 'cloudflare:workers';
import {runtimeConfig} from '../../../server/runtime-config.mjs';
import {handleRoundsSummary} from '../../../server/rounds-summary.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){return handleRoundsSummary(request,{config:runtimeConfig(env),transport:fetch});}
