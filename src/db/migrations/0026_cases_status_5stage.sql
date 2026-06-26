-- Migration 0026: 5-stage case lifecycle (Phase 5 §7.5).
--
-- Replaces the accepted/working mid-pipeline with the mockup's three working
-- stages (investigating → demand_sent → negotiating). Existing rows are
-- remapped: accepted → investigating, working → negotiating. Bounded +
-- reversible. Order: drop the old CHECK, migrate rows, re-add the new CHECK so
-- every row conforms before the constraint is reinstated.

ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_status_enum;

UPDATE cases SET status = 'investigating' WHERE status = 'accepted';
UPDATE cases SET status = 'negotiating' WHERE status = 'working';

ALTER TABLE cases ADD CONSTRAINT cases_status_enum CHECK (
  status = ANY (ARRAY[
    'new'::text,
    'investigating'::text,
    'demand_sent'::text,
    'negotiating'::text,
    'declined'::text,
    'resolved'::text,
    'reclaimed'::text,
    'closed'::text
  ])
);
