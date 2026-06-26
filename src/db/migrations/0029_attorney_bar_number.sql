-- Migration 0029: attorney bar number (portal Account self-serve, /plan Phase 2).
--
-- bar_number is a required-to-go-live field: the attorney enters it on their
-- Account page, and it feeds go-live readiness (computeReadiness) + the admin
-- approve gate. Nullable, no default: every existing row stays NULL until
-- entered. Additive + non-breaking — no table rewrite.

ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS bar_number text;
