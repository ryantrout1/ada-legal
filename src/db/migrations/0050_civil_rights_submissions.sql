-- 0050: state civil rights complaint page (/civil-rights/:state).
--
-- One row per finished wizard. The id comes from the browser so a retry or
-- a double tap is the same row (INSERT ... ON CONFLICT DO NOTHING).
-- Typed columns feed the admin list and CSV; `answers` keeps the full
-- cleaned answer set. No raw IP is stored here.
--
-- Consents: one row per checkbox per submission, checked or not, with the
-- exact wording shown and its version. This is the proof the plan requires
-- for any later contact or marketing email.
--
-- Retention: 24 months from created_at (pruned by cron in a later phase;
-- pending Gina's sign-off). Deleting a submission deletes its consents.

CREATE TABLE IF NOT EXISTS civil_rights_submissions (
  id                    uuid PRIMARY KEY,
  state_code            text NOT NULL,
  form_version          text NOT NULL,
  area                  text NOT NULL,
  basis                 text NOT NULL,
  complainant_name      text NOT NULL,
  email                 text,
  phone                 text NOT NULL,
  address1              text NOT NULL,
  address2              text,
  city                  text NOT NULL,
  state                 text NOT NULL,
  zip                   text NOT NULL,
  alt_contact_name      text,
  alt_contact_phone     text,
  respondent_name       text NOT NULL,
  respondent_company    text,
  respondent_address1   text,
  respondent_address2   text,
  respondent_city       text NOT NULL,
  respondent_state      text NOT NULL,
  respondent_zip        text,
  what_happened         text NOT NULL,
  witnesses             text,
  first_incident_date   date,
  last_incident_date    date NOT NULL,
  ongoing               text NOT NULL CHECK (ongoing IN ('yes', 'no')),
  has_attorney          text NOT NULL CHECK (has_attorney IN ('yes', 'no')),
  attorney_name_address text,
  legal_action_pending  text NOT NULL CHECK (legal_action_pending IN ('yes', 'no')),
  other_agencies        text,
  additional_comments   text,
  summary_text          text NOT NULL,
  copy_version          text NOT NULL,
  utm_source            text,
  utm_medium            text,
  utm_campaign          text,
  answers               jsonb NOT NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS civil_rights_submissions_created_at_idx
  ON civil_rights_submissions (created_at);
CREATE INDEX IF NOT EXISTS civil_rights_submissions_state_code_idx
  ON civil_rights_submissions (state_code);

CREATE TABLE IF NOT EXISTS civil_rights_consents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid NOT NULL REFERENCES civil_rights_submissions(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN ('updates', 'contact')),
  granted         boolean NOT NULL,
  wording         text NOT NULL,
  wording_version text NOT NULL,
  recorded_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS civil_rights_consents_submission_kind
  ON civil_rights_consents (submission_id, kind);
