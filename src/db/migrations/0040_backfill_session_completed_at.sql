-- 0040: backfill ada_sessions.completed_at for pre-fix completed sessions.
--
-- completed_at was declared in 0001 but never written by any code path
-- (see the commit that added it to writeSession). Every completed session
-- before that fix has completed_at IS NULL, leaving a permanent hole in
-- any time-to-complete metric.
--
-- updated_at is used as the source. It is a PROXY, not an exact record —
-- but a faithful one: a session's status is terminal once completed
-- (state machine: completed/abandoned have no transitions out) and
-- /api/ada/turn rejects any further turn on a non-active session, so the
-- last write to a completed row IS the completing turn. Measured on the
-- affected rows, updated_at lands 0.0-0.9s after the final message
-- timestamp in conversation_history.
--
-- Anything read off these backfilled rows should be treated as
-- second-accurate, not millisecond-accurate. Rows completed after the
-- writeSession fix carry a true now() from the completing transaction.
--
-- Idempotent: the IS NULL guard means a re-run is a no-op, and it can
-- never touch a row that already has a real timestamp.

UPDATE ada_sessions
SET completed_at = updated_at
WHERE status = 'completed'
  AND completed_at IS NULL;
