export function anonymousQuotaIdentity(request:Request,siteId:string,secret:string,at?:number):Promise<{verified:boolean;id:string}>;
