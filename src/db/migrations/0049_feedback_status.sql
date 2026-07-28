-- Feedback needs a way to be dealt with. Additive, replayable.
--
-- The inbox reads every row ever submitted, newest first, capped at 500,
-- and there is no way to mark one handled. At zero rows that is fine. At
-- fifty the tenth message buries the first and nobody can tell what has
-- been read, which on a product about accessibility is the wrong thing
-- to be bad at.
--
-- THREE STATES, NOT A BOOLEAN. A `handled` flag cannot tell "read it,
-- nothing to do" from "this is junk", and that is the distinction that
-- makes triage worth doing at all.
--
-- ARCHIVED IS NOT DELETED. Nothing here removes a row. Feedback on an
-- accessibility product is evidence about the product; archiving takes a
-- message out of the daily view and the filter can always reach it
-- again.
--
-- The default backfills every existing row to 'new'. There are zero rows
-- today so that is free. On a busy table the same statement would want
-- its own backfill step and a NOT NULL added afterwards.
--
-- Ref: /plan finish feedback on Vercel, Phase 1.

ALTER TABLE feedback
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';

ALTER TABLE feedback
  DROP CONSTRAINT IF EXISTS feedback_status_check;
ALTER TABLE feedback
  ADD CONSTRAINT feedback_status_check
  CHECK (status IN ('new', 'reviewed', 'archived'));

-- The only way this table is ever read: one status, newest first.
CREATE INDEX IF NOT EXISTS feedback_status_created_idx
  ON feedback (status, created_at DESC);
