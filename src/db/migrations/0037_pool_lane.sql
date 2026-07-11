-- Migration 0037 — add the 'pool' lane.
--
-- Routing rebuild R4 (self-select pool). Non-matched actionable intakes enter a
-- shared pool that any eligible firm browses and claims first-come-first-serve
-- (Gina's Outcome 2) — never an exclusive admin referral. A pool case is
-- passive (firm_id null, status 'new') until a firm atomically claims it, at
-- which point it becomes that firm's normal worked case.
--
-- decideLane does NOT produce 'pool' yet (Phase 3 cutover) — this migration
-- widens the constraint so the lane can be written once the browse/claim path
-- exists. Additive + reversible; no existing row violates the widened set.
--
-- Ref: /plan "Self-select pool (R4)", Phase 1.

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
    'matched_self_referral',
    'pool'
  ));
