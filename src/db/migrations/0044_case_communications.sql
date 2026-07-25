-- 0044_case_communications.sql
--
-- A typed contact log for a matter: calls, emails, letters, meetings.
--
-- WHY NOT JUST NOTES. Notes are free prose and have carried this so far, but
-- the questions a firm actually asks of a contact history are structural —
-- when did we last reach them, have they ever replied, how many attempts
-- before this. A note saying "called, no answer" cannot answer any of those
-- without someone reading every note.
--
-- WHY NOT case_activity. That table is the audit trail: system events and
-- transitions, append-only, never edited. A communication is a human record
-- of something that happened OFF the platform, entered after the fact and
-- correctable. Mixing them would put editable rows in an audit log.
--
-- `direction` matters more than it looks: outbound-with-no-inbound-reply is
-- exactly the unresponsive-claimant pattern the SLA work cares about.
--
-- `occurred_at` is separate from `created_at` because a call on Tuesday might
-- be logged on Thursday, and the contact history has to read in the order
-- things happened, not the order someone typed them.

CREATE TABLE IF NOT EXISTS case_communications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  channel       text NOT NULL,
  direction     text NOT NULL,
  occurred_at   timestamptz NOT NULL DEFAULT now(),
  subject       text,
  body          text,
  logged_by     uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT case_communications_channel_enum
    CHECK (channel IN ('call', 'email', 'letter', 'meeting', 'text', 'other')),
  CONSTRAINT case_communications_direction_enum
    CHECK (direction IN ('outbound', 'inbound'))
);

-- The only read is "this matter's history, newest first".
CREATE INDEX IF NOT EXISTS case_communications_case_time
  ON case_communications (case_id, occurred_at DESC);
