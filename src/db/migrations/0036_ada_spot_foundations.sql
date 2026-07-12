-- Migration 0036 — Ada Spot foundations.
--
-- Ada Spot is a standalone, business-facing accessibility *screening* product
-- (QR card → free 2-photo read → $79 paid report). It is firewalled by design
-- from the photo-analyzer test bench: it NEVER reads or writes photo_analyses /
-- photo_reviews, nor any /photo, /review, or /admin/photo-review surface.
-- Everything here is net-new and namespaced spot_*.
--
-- Additive + reversible: five brand-new tables, no ALTER on any existing table.
-- Rollback is DROP TABLE in reverse FK order; the tables are empty at apply time.
--
-- Ref: /plan Phase 0 (Ada Spot foundations & schema).

-- spot_session — the paid-report spine: Stripe payment → upload set → report.
CREATE TABLE IF NOT EXISTS spot_session (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status                      text NOT NULL DEFAULT 'pending_payment'
                                CHECK (status IN ('pending_payment','paid','uploaded','in_review','delivered','refunded')),
  stripe_checkout_session_id  text UNIQUE,
  stripe_payment_intent_id    text,
  buyer_email                 text,
  buyer_name                  text,
  amount_cents                integer,
  photo_count                 integer,
  paid_at                     timestamptz,
  uploaded_at                 timestamptz,
  delivered_at                timestamptz,
  refunded_at                 timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS spot_session_status ON spot_session (status);
CREATE INDEX IF NOT EXISTS spot_session_buyer_email ON spot_session (buyer_email);

-- spot_read — free-tier reads (2 photos): honest scoped result + soft email gate.
CREATE TABLE IF NOT EXISTS spot_read (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_limit_key   text NOT NULL,
  result           jsonb,
  photo_count      integer NOT NULL DEFAULT 0,
  model_version    text,
  email            text,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS spot_read_rate_limit ON spot_read (rate_limit_key, created_at);

-- spot_report — the delivered artifact (hosted readout), retained after photos purge.
CREATE TABLE IF NOT EXISTS spot_report (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     uuid NOT NULL REFERENCES spot_session(id) ON DELETE CASCADE,
  slug           text NOT NULL UNIQUE,
  content        jsonb,
  model_version  text,
  hitl_status    text NOT NULL DEFAULT 'pending_review'
                   CHECK (hitl_status IN ('pending_review','released','rejected')),
  reviewed_by    text,
  reviewed_at    timestamptz,
  sent_at        timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS spot_report_session ON spot_report (session_id);
CREATE INDEX IF NOT EXISTS spot_report_hitl_status ON spot_report (hitl_status);

-- spot_photo — retention-tracked uploads (free + paid). Belongs to exactly one parent.
CREATE TABLE IF NOT EXISTS spot_photo (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid REFERENCES spot_session(id) ON DELETE CASCADE,
  read_id       uuid REFERENCES spot_read(id) ON DELETE CASCADE,
  blob_key      text NOT NULL,
  blob_url      text,
  delete_after  timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT spot_photo_one_parent CHECK ((session_id IS NOT NULL) <> (read_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS spot_photo_sweep ON spot_photo (delete_after) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS spot_photo_session ON spot_photo (session_id);
CREATE INDEX IF NOT EXISTS spot_photo_read ON spot_photo (read_id);

-- spot_rate_limit — free-tier throttle accounting (one row per read attempt).
CREATE TABLE IF NOT EXISTS spot_rate_limit (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_limit_key  text NOT NULL,
  ip_hash         text,
  outcome         text NOT NULL DEFAULT 'allowed'
                    CHECK (outcome IN ('allowed','soft_gated','blocked')),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS spot_rate_limit_key ON spot_rate_limit (rate_limit_key, created_at);
