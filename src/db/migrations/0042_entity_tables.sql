-- 0042: the four consumer-write tables (M5).
--
-- These replace Base44 entities that the consumer site wrote to directly:
-- Feedback, WaitlistSignup, CommunityVote (never actually created there),
-- and AnalyticsEvent. Neon is the single source of truth after M5, so the
-- widgets write here through /api/public/* rather than through an SDK.
--
-- Design notes:
--
-- * No FKs to ada_sessions. These are anonymous public writes; a visitor
--   leaving feedback may never have started a session, and requiring one
--   would silently drop the majority of submissions.
--
-- * analytics_events.is_internal exists because 515 of the 1,647 imported
--   B44 rows were created by the founders and a test account while
--   building, and B44's own is_sample flag is false on every one of them.
--   Without this column every future traffic figure is inflated ~31%.
--
-- * analytics_events.imported_from_b44 tags the M0 backfill so the import
--   is reversible with a single DELETE.
--
-- * occurred_at is separate from created_at: imported history must keep
--   its original timestamps, or five months of activity collapses onto
--   the import date.
--
-- * community_votes stores option_id as free text rather than an enum.
--   The poll options live in content, not schema, and an enum would mean
--   a migration every time Gina edits a question.

CREATE TABLE IF NOT EXISTS feedback (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating        text,
  message       text NOT NULL,
  email         text,
  page          text,
  user_agent    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_created_at_idx ON feedback (created_at DESC);

CREATE TABLE IF NOT EXISTS waitlist_signups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  source        text,
  interest      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- One signup per address. A visitor clicking the banner twice is not two
-- people, and the waitlist is a contact list before it is a metric.
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_signups_email_key
  ON waitlist_signups (lower(email));

CREATE TABLE IF NOT EXISTS community_votes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id     text NOT NULL,
  poll_id       text NOT NULL DEFAULT 'community_voices',
  voter_key     text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS community_votes_tally_idx
  ON community_votes (poll_id, option_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name         text NOT NULL,
  page               text,
  properties         jsonb NOT NULL DEFAULT '{}'::jsonb,
  session_id         text,
  is_internal        boolean NOT NULL DEFAULT false,
  imported_from_b44  boolean NOT NULL DEFAULT false,
  occurred_at        timestamptz NOT NULL DEFAULT now(),
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_name_time_idx
  ON analytics_events (event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_public_idx
  ON analytics_events (occurred_at DESC) WHERE is_internal = false;

-- Down (manual):
--   DROP TABLE analytics_events, community_votes, waitlist_signups, feedback;
