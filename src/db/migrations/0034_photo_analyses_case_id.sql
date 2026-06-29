-- Migration 0034 — link photo analyses to a matter (case).
--
-- Build-list #3: attorneys run the structured analyzer on a matter's photos and
-- see the full result in the workspace. photo_analyses was keyed to a session
-- only (the field-test path that feeds the admin review queue). Adding a
-- nullable case_id lets an analysis belong to a matter directly, so the
-- firm-scoped evidence read can find it.
--
-- Additive + reversible: a new nullable FK column + its index. No existing row
-- changes (case_id stays NULL on field-test rows). session_id stays NOT NULL in
-- this phase — claimant photos always have an origin session; Phase 2 relaxes
-- it for attorney-uploaded photos on direct matters.
--
-- Ref: /plan "Evidence + full photo analysis for attorneys" Phase 1.

ALTER TABLE photo_analyses
  ADD COLUMN IF NOT EXISTS case_id uuid REFERENCES cases(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS photo_analyses_case ON photo_analyses(case_id);
