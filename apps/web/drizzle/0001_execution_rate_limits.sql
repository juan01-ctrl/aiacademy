CREATE TABLE IF NOT EXISTS execution_rate_limits (
  scope_key text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count >= 0)
);

CREATE INDEX IF NOT EXISTS execution_rate_limits_window_start_idx
  ON execution_rate_limits (window_start);
