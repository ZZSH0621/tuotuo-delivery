// Only documented ASR models and official provider hosts. No arbitrary proxy URLs.
export const API_PROVIDER_ENDPOINT='https://api.openai.com/v1/audio/transcriptions';
export const QWEN_ASR_MODEL='qwen-audio-3.1-asr-flash';
export const DEFAULT_ASR_MODEL=QWEN_ASR_MODEL;
export const ASR_MODELS=Object.freeze([QWEN_ASR_MODEL,'gpt-transcribe','gpt-4o-transcribe','gpt-4o-mini-transcribe','gpt-4o-mini-transcribe-2025-12-15','whisper-1']);
export const PROVIDERS=Object.freeze({
 'bailian-cn':{label:'阿里云百炼 · 北京',base:'https://dashscope.aliyuncs.com'},
 'bailian-intl':{label:'阿里云百炼 · 新加坡',base:'https://dashscope-intl.aliyuncs.com'},
 openai:{label:'OpenAI',base:'https://api.openai.com'}
});
export const isSupportedASRModel=value=>typeof value==='string'&&ASR_MODELS.includes(value);
export const defaultProvider=model=>model===QWEN_ASR_MODEL?'bailian-cn':'openai';
export function providerEndpoint(provider,workspace=''){
 if(!Object.hasOwn(PROVIDERS,provider))throw Error('PROVIDER_NOT_SUPPORTED');const p=PROVIDERS[provider];if(!p)throw Error('PROVIDER_NOT_SUPPORTED');
 let base=p.base;
 if(workspace){if(!['bailian-cn','bailian-intl'].includes(provider)||! /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/.test(workspace))throw Error('WORKSPACE_INVALID');const region=provider==='bailian-cn'?'cn-beijing':'ap-southeast-1';base=`https://${workspace}.${region}.maas.aliyuncs.com`;}
 return base+(provider==='openai'?'/v1/audio/transcriptions':'/api/v1/services/aigc/multimodal-generation/generation');
}
export function validModelProvider(model,provider){return isSupportedASRModel(model)&&Object.hasOwn(PROVIDERS,provider)&&(model===QWEN_ASR_MODEL?provider!=='openai':provider==='openai');}
