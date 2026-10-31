-- Reconstructed candidate schema. Metadata only: no credentials, audio or text.
CREATE TABLE IF NOT EXISTS api_attempt_windows (
  site_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  window_start_ms INTEGER NOT NULL CHECK (window_start_ms >= 0),
  attempts INTEGER NOT NULL CHECK (attempts > 0),
  PRIMARY KEY (site_id, user_id, window_start_ms)
) WITHOUT ROWID;

CREATE TABLE IF NOT EXISTS api_cost_reservations (
  site_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  request_id TEXT NOT NULL,
  budget_period_start_ms INTEGER NOT NULL CHECK (budget_period_start_ms >= 0),
  max_cost_micros INTEGER NOT NULL CHECK (max_cost_micros > 0),
  created_at_ms INTEGER NOT NULL CHECK (created_at_ms >= 0),
  PRIMARY KEY (site_id, user_id, request_id)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS api_cost_reservations_period
ON api_cost_reservations (site_id, user_id, budget_period_start_ms);
