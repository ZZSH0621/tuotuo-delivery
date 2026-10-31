export const SEARCH_MODEL:string;
export function createSearchQueryHandler(options:any):(request:Request)=>Promise<Response>;
export function cleanSearchPlan(value:any):string[];
