-- Migration 0025: attorney-set statute-of-limitations date on cases (Phase 5 §7.3).
--
-- sol_date is ATTORNEY-SET ONLY and never auto-computed — a wrong computed
-- limitations deadline is malpractice exposure, and computing it would be UPL.
-- Nullable, no default: every existing row stays NULL ("Not set") until an
-- attorney enters a value in the workspace. Additive + non-breaking.

ALTER TABLE cases ADD COLUMN IF NOT EXISTS sol_date date;
