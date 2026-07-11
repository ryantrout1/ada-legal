-- Migration 0036 — routing eligibility gate + matched_self_referral lane.
--
-- Routing rebuild Phase 2. Two changes:
--
-- (1) Per-litigation opt-in on firm assignments. A firm receives an exclusive
--     routed lead for a litigation only when it has explicitly opted in
--     (receives_matches = true) AND clears the firm-level eligibility floor
--     (status active + subscribed/pilot, enforced in code by isFirmEligible).
--     Default false: no litigation routes exclusively until a firm is turned
--     on. This is the fix for matches routing to firms that never signed up.
--
-- (2) New 'matched_self_referral' lane. A matched litigation whose firm is not
--     opted-in/eligible produces a passive case (firm_id null, no handoff, no
--     notification); the readout still shows the firm's public contact so the
--     claimant can reach out themselves.
--
-- Additive + reversible. No existing row violates the widened lane set; the
-- new columns default false/null, so existing assignments keep today's
-- (now non-routing) behavior until explicitly opted in.
--
-- Ref: /plan "Gate exclusive routing behind firm eligibility", Phase 2.

ALTER TABLE litigation_firm_assignments
  ADD COLUMN IF NOT EXISTS receives_matches boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS opted_in_at timestamptz;

ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_lane_enum;

ALTER TABLE cases
  ADD CONSTRAINT cases_lane_enum
  CHECK (lane IN (
    'routed_firm',
    'sourcing',
    'general_queue',
    'self_help',
    'no_action',
    'direct',
    'matched_self_referral'
  ));
