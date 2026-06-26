-- Migration 0027: attorney-entered defendant record on cases (Phase 5 §7.5).
--
-- Free-form jsonb { name, kind?, address?, notes? } so the defendant panel can
-- grow without a migration. Nullable, no default — "Not recorded yet" until an
-- attorney enters it. Additive + non-breaking.

ALTER TABLE cases ADD COLUMN IF NOT EXISTS defendant jsonb;
