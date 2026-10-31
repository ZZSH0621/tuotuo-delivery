import {env} from 'cloudflare:workers';
import {runtimeConfig} from '../../../server/runtime-config.mjs';
import {unrestrictedUsage} from '../../../server/unrestricted-usage.mjs';
import {createSearchQueryHandler} from '../../../server/search-query-handler.mjs';
export const dynamic='force-dynamic';
export async function POST(request:Request){const config=runtimeConfig(env);if(!config.enabled||!config.serverKey)return Response.json({code:'SEARCH_NOT_CONFIGURED'},{status:503,headers:{'Cache-Control':'no-store'}});return createSearchQueryHandler({config,authenticate:async()=>({verified:true,id:'public'}),quota:unrestrictedUsage,transport:fetch})(request);}
