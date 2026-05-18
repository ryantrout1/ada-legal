-- Phase 1 of /plan ADALL Admin: extend attorneys with multi-state +
-- structured specialty tagging so Ada's matching can reflect the new
-- product taxonomy (Title I/II/III, class action, mass action).
--
-- Two new columns, both jsonb arrays of strings:
--   additional_states — secondary practice states, e.g. ['CA','NV']
--                       (location_state remains primary)
--   specialty_tags    — canonical taxonomy: title_i, title_ii, title_iii,
--                       class_action, mass_action. Free-form
--                       practice_areas stays in place for backward-compat
--                       and as a sandbox for new tag candidates.
--
-- Defaults are empty jsonb arrays so existing 9 rows get safe values.
-- The migration is fast on the current table (9 rows, milliseconds).
--
-- Index strategy: GIN over (status, specialty_tags) accelerates the
-- common matching pattern: "approved AND specialty_tags overlaps X".
-- Multi-state matches (?-operator on additional_states) benefit from
-- a separate small GIN index — built CONCURRENTLY at this size is
-- unnecessary but kept simple.

ALTER TABLE attorneys
  ADD COLUMN IF NOT EXISTS additional_states jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specialty_tags    jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS attorneys_specialty_tags_gin
  ON attorneys USING gin (specialty_tags);

CREATE INDEX IF NOT EXISTS attorneys_additional_states_gin
  ON attorneys USING gin (additional_states);
