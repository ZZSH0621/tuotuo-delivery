/** Reconstructed local candidate; no remote D1 provisioning or upstream calls.
 * Fixed-window quotas: each allowed reservation permits ONE upstream attempt.
 * Errors retain reservations; authenticated identities and cost caps come from
 * trusted server configuration. Never derive pricing or identity from the body.
 * Keep budget/window configuration stable and retain idempotency metadata.
 */
const positiveInteger = n => Number.isSafeInteger(n) && n > 0;
const identity = s => typeof s === 'string' && s.length > 0 && s.length <= 256 && !/[\u0000-\u001f\u007f]/.test(s);
const ATTEMPT = `
INSERT INTO api_attempt_windows (site_id,user_id,window_start_ms,attempts)
VALUES (?1,?2,?3,1)
ON CONFLICT (site_id,user_id,window_start_ms) DO UPDATE
SET attempts=api_attempt_windows.attempts+1
WHERE api_attempt_windows.attempts < ?4
RETURNING attempts`;
// One write statement makes uniqueness + remaining-budget check atomic.
// The unique request key intentionally spans ALL budget periods.
const RESERVE = `
INSERT INTO api_cost_reservations
  (site_id,user_id,request_id,budget_period_start_ms,max_cost_micros,created_at_ms)
SELECT ?1,?2,?3,?4,?5,?6
WHERE NOT EXISTS (
  SELECT 1 FROM api_cost_reservations WHERE site_id=?1 AND user_id=?2 AND request_id=?3
) AND COALESCE((
  SELECT SUM(max_cost_micros) FROM api_cost_reservations
  WHERE site_id=?1 AND user_id=?2 AND budget_period_start_ms=?4
),0) <= ?7 - ?5
ON CONFLICT (site_id,user_id,request_id) DO NOTHING
RETURNING request_id`;

// Unlimited daily usage still reserves each request ID exactly once.
const RESERVE_UNLIMITED = `
INSERT INTO api_cost_reservations
  (site_id,user_id,request_id,budget_period_start_ms,max_cost_micros,created_at_ms)
SELECT ?1,?2,?3,?4,?5,?6
WHERE NOT EXISTS (
  SELECT 1 FROM api_cost_reservations WHERE site_id=?1 AND user_id=?2 AND request_id=?3
)
ON CONFLICT (site_id,user_id,request_id) DO NOTHING
RETURNING request_id`;

export function createD1Quota({db, siteId: pinnedSiteId, now = Date.now, budgetMicros,
  budgetPeriodMs = 86400000, windowMs = 60000, attemptLimit = 3} = {}) {
  if (!db || typeof db.prepare !== 'function' || typeof now !== 'function' ||
      (budgetMicros !== null && !positiveInteger(budgetMicros)) || !positiveInteger(budgetPeriodMs) ||
      !positiveInteger(windowMs) || !positiveInteger(attemptLimit) ||
      (pinnedSiteId !== undefined && !identity(pinnedSiteId))) throw new TypeError('INVALID_QUOTA_CONFIGURATION');
  const scope = requestedSite => {
    const site = requestedSite ?? pinnedSiteId;
    return identity(site) && (pinnedSiteId === undefined || site === pinnedSiteId) ? site : null;
  };
  const timestamp = () => {
    const t = now();
    if (!Number.isSafeInteger(t) || t < 0) throw new Error('INVALID_QUOTA_CLOCK');
    return t;
  };
  return Object.freeze({
    async checkAttempt({siteId, userId, requestsPerMinute = attemptLimit} = {}) {
      const site = scope(siteId);
      if (!site || !identity(userId) || !positiveInteger(requestsPerMinute)) return false;
      const limit = Math.min(attemptLimit, requestsPerMinute);
      const t = timestamp(), start = Math.floor(t / windowMs) * windowMs;
      const row = await db.prepare(ATTEMPT).bind(site, userId, start, limit).first();
      return row !== null && row !== undefined;
    },
    async reserve({siteId, userId, requestId, maxCostMicros} = {}) {
      const site = scope(siteId);
      if (!site || !identity(userId) || typeof requestId !== 'string' ||
          !/^[a-zA-Z0-9_-]{16,80}$/.test(requestId) ||
          !positiveInteger(maxCostMicros) || (budgetMicros !== null && maxCostMicros > budgetMicros)) return false;
      const t = timestamp(), period = Math.floor(t / budgetPeriodMs) * budgetPeriodMs;
      const args=[site,userId,requestId,period,maxCostMicros,t];
      if(budgetMicros !== null)args.push(budgetMicros);
      const row = await db.prepare(budgetMicros === null ? RESERVE_UNLIMITED : RESERVE).bind(...args).first();
      return row !== null && row !== undefined;
    },
  });
}
