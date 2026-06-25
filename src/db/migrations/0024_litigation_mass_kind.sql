-- Litigation kind — re-add mass action (additive, replayable).
--
-- Migration 0009 had kind IN ('class', 'mass'). Migration 0010 expanded the
-- landscape but DROPPED 'mass', leaving:
--   ('class', 'enforcement_action', 'consent_decree', 'pattern_of_practice', 'regulatory_challenge')
--
-- The router treats mass actions as a primary matched lane (a mass action in
-- a given state, routed to the firm representing it), so 'mass' has to be a
-- valid kind again. This swaps the CHECK to a strict SUPERSET of the 0010
-- set — no existing row can be rejected; the only effect is that 'mass' is
-- now insertable.
--
-- DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT is the same pattern migration
-- 0010 used for this column. Replayable.
--
-- Ref: /plan Phase 0 (Lawyer Workspace foundations) — open decision resolved:
-- token is 'mass', re-added in Phase 0.

ALTER TABLE litigation_listings DROP CONSTRAINT IF EXISTS litigation_listings_kind_check;
ALTER TABLE litigation_listings
  ADD CONSTRAINT litigation_listings_kind_check
  CHECK (kind IN ('class', 'mass', 'enforcement_action', 'consent_decree', 'pattern_of_practice', 'regulatory_challenge'));
