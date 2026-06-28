-- Migration 0033 — add the 'direct' lane.
--
-- Self-originated matters: an attorney creates a matter directly in the portal
-- (no ada_session, no routing). These rows carry lane = 'direct' to keep them
-- cleanly separable from ADALL-routed work in analytics and the admin
-- placement queue. The router (decideLane) never produces 'direct'; only
-- createDirectCase does.
--
-- Additive + reversible: widens the cases_lane_enum check. No existing row
-- violates the widened set, so this is a safe online change.
--
-- Ref: /plan "Add a matter" Phase 1.

ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_lane_enum;

ALTER TABLE cases
  ADD CONSTRAINT cases_lane_enum
  CHECK (lane IN ('routed_firm', 'sourcing', 'general_queue', 'self_help', 'no_action', 'direct'));
