-- 0041: generic per-endpoint request throttle for public API surfaces.
--
-- The guide assistant (/api/public/guide-assistant, M2 Phase 4) is the
-- first public, unauthenticated, per-request-billed endpoint on the
-- platform. Its kill switch is real protection but a one-line Neon upsert
-- can turn it off, so the endpoint needs a throttle that does not depend
-- on anyone remembering the flag's history.
--
-- Why not reuse the Spot tables: spot_read / spot_rate_limit encode Spot's
-- paid-product metering (two free reads, then a soft upsell gate), counted
-- against reads that produced a report. That is a product rule, not a
-- throttle, and borrowing the tables would corrupt Spot's analytics.
--
-- Why `bucket` rather than a guide-specific table: M5 adds more public
-- writes (feedback, waitlist, votes) that will want the same throttle.
-- One row per request, one table, discriminated by bucket.
--
-- Privacy: rate_limit_key is the SHA-256 from deriveRateLimitKey (IP plus a
-- version-coarsened user agent). ip_hash is its first 16 chars, kept only
-- so an operator can group abuse without a join. No raw IP is stored, here
-- or anywhere upstream of here.
--
-- Retention: rows are pruned on a window (migration 0042 / cron). The index
-- leads with bucket + key so the hot path (count one key inside a window)
-- is an index-only range scan, and so pruning by created_at stays cheap.

CREATE TABLE IF NOT EXISTS api_rate_limit (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket         text        NOT NULL,
  rate_limit_key text        NOT NULL,
  ip_hash        text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_rate_limit_lookup
  ON api_rate_limit (bucket, rate_limit_key, created_at DESC);

CREATE INDEX IF NOT EXISTS api_rate_limit_created_at
  ON api_rate_limit (created_at);
