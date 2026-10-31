// A daily, server-derived quota identity. Raw network addresses are not stored.
export async function anonymousQuotaIdentity(request,siteId,secret,at=Date.now()){
 const address=request.headers.get('cf-connecting-ip')||'unavailable';
 const day=new Date(at).toISOString().slice(0,10);
 const encoder=new TextEncoder();
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=await crypto.subtle.sign('HMAC',key,encoder.encode(`${siteId}\n${day}\n${address}`));
 const hash=[...new Uint8Array(signature)].map(x=>x.toString(16).padStart(2,'0')).join('');
 return {verified:true,id:'anon:'+hash};
}
