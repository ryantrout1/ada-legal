-- 0039: one report per spot session, enforced.
--
-- The report pipeline gains a second trigger (inline at finish-upload,
-- alongside the cron sweeper). Both run the same idempotent runner, but
-- a concurrent pair could otherwise double-insert into spot_report for
-- one session — the recovery path (getReportBySession → markInReview)
-- already assumes at-most-one. Replace the plain session index with a
-- unique one; the second concurrent insert now fails and is caught,
-- and the session recovers on the next tick.
--
-- Verified before applying: no session_id has more than one row.

DROP INDEX IF EXISTS spot_report_session;
CREATE UNIQUE INDEX spot_report_session ON spot_report (session_id);
