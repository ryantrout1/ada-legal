-- 0043_case_engaged_at.sql
--
-- The engagement marker: when a firm actually signs the client.
--
-- Fee agreements happen off-platform (paper, e-sign, however the firm works)
-- and we deliberately do not touch that. But nothing in the system knew it had
-- happened, so a case sat in `investigating` forever and there was no way to
-- tell a firm that took the case last month from one sitting on it doing
-- nothing. It is also the only number that says whether the platform works:
-- how many intakes became actual representation.
--
-- A nullable timestamp rather than a status. Engagement is orthogonal to the
-- pipeline stage — a matter can be engaged while investigating, or reach
-- demand_sent without a signed agreement — so folding it into the status enum
-- would force a false ordering onto two independent facts.
--
-- Partial index: the interesting query is "engaged matters", never "all the
-- nulls".

ALTER TABLE cases ADD COLUMN IF NOT EXISTS engaged_at timestamptz;

CREATE INDEX IF NOT EXISTS cases_engaged
  ON cases (firm_id, engaged_at)
  WHERE engaged_at IS NOT NULL;
