# Reviewed Bailian BYOK replacement

Baseline: production v21 `0539ced58ad138c19e118bf6ee2059727664e068`; preserves public root fix. Includes previously implemented 390px same-document portrait toggle from `aa61b5dc3a4f4944ac30105b121794a04bc4eb7c`.

## Included
- One visible Bailian voice entry replaces old local/browser/OpenAI UI panels and script bindings. Memo voice uses the same new screen with explicit memo destination. Adopting text appends only a draft; it never creates tasks, changes deadlines or saves memos automatically.
- Bailian Beijing/Singapore default, optional strict workspace subdomain; OpenAI legacy server compatibility retained but not shown in new UI. Fixed official endpoint allowlist, no custom URL or region fallback. Qwen model contract verified against https://help.aliyun.com/zh/model-studio/qwen-audio-asr-http-api .
- Local AudioWorklet capture, bounded WAV conversion and energy-based endpointing. Recording, silence, maximum duration and imports do not upload. User previews, checks one-round audio/key transfer + personal charge consent, then explicitly sends. Model/provider/workspace/key/audio changes revoke consent. Unsaved settings cannot send; region/workspace changes clear key. No automatic retry.
- Key stays page memory only, is sent through same-origin authenticated backend to the selected official provider, and clears on send/background/close. No uploaded `.env.local`, local-server, shared-key resolver or installer modifications were copied or executed.
- Closing/background/alarm interrupts recorder/request, drops stale results and preserves original reminder lifecycle. Cancellation cannot guarantee upstream was not billed.

## Verification
98 Node tests pass; final aggregate rerun after independent-review fixes required. TypeScript and official production build passed. Tests use synthetic PCM and mocked transport only, no paid API calls or microphone acquisition. Supported cloud Chromium UI verified root entry, one voice navigation, new 390px screen/settings, draft targets and existing alarm bar. No physical phone, real microphone, upstream credential, quota balance or actual transcription acceptance tested.
Screenshots: `../tuotuo-qa/asr-safe-portrait-390.png`, `asr-safe-settings.png`.
Old non-sensitive UI backup: `/workspace/scratch/5d5bfdc67cd8/tuotuo-voice-rollback-v21/`; complete rollback source remains v21 commit above. Original task/memo code regression normalizes only the three documented ASR hooks; task/clinical safeguards otherwise unchanged.

## Runtime remains disabled until deliberately configured
No environment settings changed. The existing server requires platform identity, exact HTTPS origin, D1 quota tables and explicit runtime enablement. UI honestly says unavailable while disabled; accepting a personal key does not prove validity.
Required non-secret settings: `API_TRANSCRIPTION_ENABLED=true`, `API_EXPECTED_ORIGIN=https://nurse-notes-demo.wiggly-char-1989.chatgpt.site`, positive integer `API_USER_DAILY_BUDGET_MICROS` and `API_MAX_COST_MICROS_PER_REQUEST` with maximum <= budget. Retained SITE_ID is the real project ID, not uploaded placeholder. D1 `api_attempt_windows` and `api_cost_reservations` must exist via reviewed migration. Current quota reserves configured units per request; it is not a provider account monetary hard cap. Choose ceilings explicitly rather than inventing provider charges. No server API secret is needed or permitted by this BYOK design.

Publishing code does not constitute tested live ASR or silently activate paid requests. Production enablement and one user-initiated real acceptance remain distinct.
