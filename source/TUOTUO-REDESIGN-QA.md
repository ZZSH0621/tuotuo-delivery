# TUOTUO redesign validation

Baseline: deployed v16, commit b6aad11c7d78effb4835f0289749f34b6f13f371. Same Site and owner-only audience retained.

- Original JS/model/audio assets remain byte-for-byte unchanged (preservation regression test).
- 57/57 Node tests pass, including 5 presentation-layer regressions. TypeScript no-emit passes; official production build passes.
- Actual desktop browser visual inspected: hero mascot, cream work panels, sidebar, alarm overlay.
- Responsive CSS viewport 400px and 360px inspected using ordinary window resize + browser zoom (native browser minimum window width is 500px). No horizontal document overflow: scroll widths 388/350px respectively.
- Desktop 10-second fictional timer: explicit confirmation required; due overlay appears; return to work retains alarm; circular acknowledgment stops current reminder and leaves completed count 0.
- 400px form parsing and confirmation inspected: parsed fictional bed/name/20-minute values, manual checkbox remains required; cancel returns without task creation.
- Hero action focuses composer; typing prevents idle overlay through presentation guard. Existing 10-second idle interval preserved.
- Mascot contextual states: welcome, empty, wink, saved-success, idle sleep, due attention. Reduced-motion CSS removes transition/animation/smooth scroll.
- API configuration, credentials, budget, access policy and all backend code unchanged. No microphone requested; no cloud audio sent; no paid API enabled.

Limits: no real iPhone/iOS/Android hardware, vibration hardware or background reliability verification. DevTools device emulation is blocked by browser organization policy; not bypassed. Preview root requires hosted sign-in, unavailable on local managed preview; frontend QA uses its existing /legacy/index.html route. Hosted access/auth code preserved.

## v18 — dark workspace, source-inspired entrance, calm screen (2026-10-31)
- Preserve current PUBLIC audience (explicit user change rev4); same project, no API environment enablement.
- Dark pink/black record, summary, memo, audio, knowledge and task panels; light only for inset editable inputs. Checked core text tokens contrast 5.24:1 or better.
- TUOTUO妥妥 entrance uses source-verified reference letter rise/merge/lock timings (1250/2050/3950ms); reference production required sign-in, not claimed observed live. Removed source flash/audio. Skip/Escape, session-once, reduced-motion bypass/change, voice/modal/due reminder guards. Existing alarms preempt without unlocking their background.
- Calm screen: dedicated sleepy-yawn plush; genuine feature-detected Battery Status API level/charging updates or explicit unavailable text (Safari/iOS unsupported; not real-device tested). Privacy-masked earliest three upcoming countdowns; translucent notification cards, one-shot left-entry, reduced-motion fallback. Existing ACK still only acknowledges, never completes work.
- 72 Node tests pass, TypeScript and production build pass. New VM regressions cover intro safety/timing and battery/countdown/order/privacy/state preservation. Original core app.js remains unchanged.
- Actual Chromium 360/400px CSS viewports via native resize+zoom (not iPhone hardware), desktop checked. v18 screenshots in ../tuotuo-qa. API/mic/audio playback not invoked. Browser returned actual Battery API 100% charging for this cloud machine; that is not a claim about user's phone.
- Local preview retains clearly fictional QA tasks; denied deletion confirmation was not retried. No production user task data modified.
