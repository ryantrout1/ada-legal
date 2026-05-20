-- Attorney Portal — Phase 2 schema (additive, replayable).
--
-- ⚠️ NOT YET APPLIED to Neon. Drafted by /implementation for human review.
-- Per the autonomous loop's Rail 5 (shared-list / blast-radius), the loop
-- does NOT apply production migrations. Ryan applies this against Neon
-- project ancient-star-00703098 (main) after review, then the remainder of
-- Phase 2 (Drizzle types, in-memory mirrors, portalSeed body) lands.
--
-- Ref: .features/attorney-portal.md, .design/attorney-portal.md (Data model
--      changes), .implementation/attorney-portal.md (Phase 2).
--
-- Everything here is additive: ADD COLUMN IF NOT EXISTS, CREATE TABLE IF NOT
-- EXISTS, CREATE INDEX IF NOT EXISTS. No destructive ALTERs. Safe to replay.
-- The firm_name → law_firm_id backfill is guarded (WHERE law_firm_id IS NULL)
-- so re-running is idempotent.
--
-- Why these tables:
--   - attorneys.user_id   — links a vetted attorney to their ada_legal users
--                           row (and thus to a Clerk identity). The portal
--                           auth boundary (requireAttorney) resolves the
--                           signed-in Clerk user → users → attorneys via this.
--   - attorneys.law_firm_id — the firm an attorney belongs to. The portal
--                           queue is firm-scoped, so this is load-bearing
--                           routing data; it lives in Postgres with FK
--                           integrity (not in Clerk metadata).
--   - litigation_firm_assignments — many firms per litigation row. This is
--                           the routing fan-out that decides which firms see
--                           a matched session. Distinct from
--                           litigation_listings.lead_firm_id (the public
--                           "lead counsel" surface), which stays as-is.
--   - firm_session_handled — one sparse row per (session, firm) ONLY when a
--                           firm marks a case handled (one-bit state). The
--                           queue query joins this for the gray-out behavior.
--
-- Note on law_firms / users references: law_firms lives in schema-ch1.ts and
-- users in schema-core.ts; both physical tables exist in Neon (confirmed by
-- the design's information_schema scan). FK constraints are declared here in
-- SQL, matching the existing pattern (litigation_listings.lead_firm_id, 0010).

-- ─── attorneys: link to Clerk-backed user + owning firm ──────────────────────

ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS user_id     uuid REFERENCES users(id);
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS law_firm_id uuid REFERENCES law_firms(id);

-- Partial indexes: the lookups are always on non-null values (auth resolves
-- by user_id; the queue scopes by law_firm_id).
CREATE INDEX IF NOT EXISTS attorneys_user_id
  ON attorneys (user_id)     WHERE user_id     IS NOT NULL;
CREATE INDEX IF NOT EXISTS attorneys_law_firm_id
  ON attorneys (law_firm_id) WHERE law_firm_id IS NOT NULL;

-- Best-effort backfill of law_firm_id from the existing free-text firm_name.
-- Guarded (idempotent) and org-scoped: an attorney's firm must be in the same
-- organization, so we never link across orgs (law_firm_id gates portal data
-- access — a security boundary; cross-org leakage must be impossible).
--
-- [REVIEW NOTE] The org-scoping (a.org_id = lf.org_id) is a safety tightening
-- over the design's plain case-insensitive name match. It cannot create a
-- wrong-firm link across orgs. Remove the org_id predicate if ADALL ever
-- needs cross-org attorney↔firm links (not a v1 case). Ambiguous names (one
-- firm_name matching multiple law_firms.name within an org) resolve to an
-- arbitrary single match; reconcile those manually in B44. Unmatched rows
-- stay NULL by design — admin sets law_firm_id directly in B44.
UPDATE attorneys a
SET law_firm_id = lf.id
FROM law_firms lf
WHERE a.law_firm_id IS NULL
  AND a.firm_name IS NOT NULL
  AND a.org_id = lf.org_id
  AND lower(btrim(a.firm_name)) = lower(btrim(lf.name));

-- ─── litigation_firm_assignments: routing fan-out (many firms per case) ──────

CREATE TABLE IF NOT EXISTS litigation_firm_assignments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  litigation_listing_id uuid NOT NULL REFERENCES litigation_listings(id) ON DELETE CASCADE,
  law_firm_id           uuid NOT NULL REFERENCES law_firms(id)            ON DELETE CASCADE,
  assigned_by_user_id   uuid REFERENCES users(id),
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT litigation_firm_assignments_unique UNIQUE (litigation_listing_id, law_firm_id)
);

CREATE INDEX IF NOT EXISTS lfa_law_firm
  ON litigation_firm_assignments (law_firm_id);
CREATE INDEX IF NOT EXISTS lfa_litigation
  ON litigation_firm_assignments (litigation_listing_id);

-- ─── firm_session_handled: sparse one-bit handled state per (session, firm) ──

CREATE TABLE IF NOT EXISTS firm_session_handled (
  session_id          uuid NOT NULL REFERENCES ada_sessions(id) ON DELETE CASCADE,
  law_firm_id         uuid NOT NULL REFERENCES law_firms(id)    ON DELETE CASCADE,
  handled_by_user_id  uuid REFERENCES users(id),
  handled_at          timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, law_firm_id)
);

CREATE INDEX IF NOT EXISTS fsh_session
  ON firm_session_handled (session_id);
