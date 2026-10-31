declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
declare namespace Cloudflare { interface Env {API_TRANSCRIPTION_ENABLED?:string;API_EXPECTED_ORIGIN?:string;API_USER_DAILY_BUDGET_MICROS?:string;API_MAX_COST_MICROS_PER_REQUEST?:string;SITE_OWNER_USER_ID?:string;} }

declare namespace Cloudflare { interface Env {DASHSCOPE_API_KEY?:string;ASR_PROVIDER?:string;ASR_WORKSPACE?:string;} }
