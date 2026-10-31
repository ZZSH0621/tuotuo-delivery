# New reconstructed candidate — 2026-10-30

The earlier 40-test local candidate and ZIP disappeared when the workspace snapshot changed. This is a NEW reconstruction, not the earlier hash or test evidence.

## Provenance and preservation
Official Sites Vinext starter/locked dependencies. Opened the same remote project with official source helper, current HEAD 617a7392ffd7cc58b0dc683787b42f83bdcd1189 (saved v15, not deployed). Application baseline is LIVE v14 commit 9757d40fd78ffbcdfef3954f7b2ca76475194291. Original model, six MP3s, memos, reminders, knowledge, capture scripts and cache URLs retained byte-for-byte. Only baseline index.html is changed to two primary voice routes; advanced diagnostics remain available. Hashes in rollback-assets.json. Original local recognizer is publicly pretrained, not claimed trained for this application.

## Implementation
Official server auth helper unchanged. Same-origin server-only per-request own-key OpenAI adapter; no shared fallback key, no secrets in source/storage/logs. API remains disabled with missing/default runtime config. Request/body/response/timeout limits, real WAV byte validation, atomic D1 rate/budget reservation, per-user/site persistent idempotency. No automatic retry/refund after uncertain upstream outcomes; late quota operations may still reserve conservatively.

API recording code explicitly requests microphone only on user click when connected. Reuses local PCM AudioWorklet, 30s cap, encodes16kHz monoPCM16WAV, stops tracks and requires acknowledged flush, previews locally, separate explicit paid-upload consent. Hidden page, alarm, cancellation and navigation invalidate late results and release capture. No cloud fallback. Result manual review then insertion only, never automatic tasks.

Local recognition remains available under the VERIFIED owner-only Sites audience, preserving the user's original path without guessing a site-scoped owner identity. This is NOT entitlement protection for downloadable models. Any future audience expansion requires revisiting the local route policy; old browser-local records are not multi-account isolated.

## Fresh verification
52/52 new tests pass: real SQLite concurrency + generated deployment schema, WAV malformed/limits, handler auth/consent/cancellation/timeouts/network mocks, recorder+fakeDOM lifecycle, original-asset hashes and official auth preservation. TypeScript and official build checked. Local D1 migration applied (3 commands), not a remote operation. Read-only managed preview shows two voice choices and API disabled; no real microphone, key, provider call, payment, or iPhone validation. Independent reviewers rechecked cancellation, atomic quotas, flush/screen guard and UI lifecycle.

## Deployment boundaries and rollback
Deploy only same project appgprj_6ae456215e8c81919aff115aec5ac9ab with existing custom owner-only revision3 audience; no access change. Managed D1 schema provision/migration via ordinary Sites publishing only. Do not use prior denied v15 publishing path. API off: no production activation until exact HTTPS origin, approved daily budget/per-request cap and real hosted isolation have been validated and paid-test authorized. No OPENAI_API_KEY configured: each user supplies their own key per request. Optional developer plugin is not mandatory for manual BYOK.

Rollback target: live v14 appgprj_6ae456215e8c81919aff115aec5ac9ab~appgver_b916b98e8b648191ba66734a690af0b7. Rollback through normal authorized private-version deployment only; no database deletion (migrations may already have applied after a failed release). Never overwrite or claim recovery of missing old ZIP.
