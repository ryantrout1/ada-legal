-- Migration 0047 — the class_member lane.
--
-- A matched class action is not an intake to hand over. If the person fits
-- the class a court certified, they are already in it: there is nothing to
-- enrol them in, and a firm that is not appointed class counsel cannot act
-- on the class claim however willing it is.
--
-- Until now the router never read the litigation's kind, so a class action
-- and a pattern-of-practice record took identical paths. A firm could
-- accept a class action, receive an exclusive routed lead, and have nothing
-- it could do with the class claim — while that lead stayed invisible to
-- every other firm, because exclusivity is the point of routed_firm.
--
-- firm_id is still set when a firm is eligible. The class action covers the
-- barrier; it does not cover a wasted trip, an injury, or anything specific
-- to that person, and those are real work. The firm receives them to check
-- for a separate claim rather than to take on the class claim.
--
-- Everyone in the lane reaches a firm rather than only those judged to have
-- something extra: a firm spending five minutes on someone with no separate
-- claim costs very little, and withholding someone who did have one costs
-- them their case.
--
-- Additive only — drop-and-re-add of the CHECK, the pattern 0036 and 0037
-- established. No existing row changes lane.
--
-- Ref: /plan class-action-match, Phase 3.

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
    'pool',
    'class_member'
  ));
