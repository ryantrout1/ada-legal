-- Phase 2 of /plan ADALL Admin: litigation listings (class + mass actions).
--
-- One table holds both class actions and mass actions, distinguished by
-- the `kind` column. Admin UI presents them as two filtered views so
-- the product surface matches the user's mental model.
--
-- Lead attorney is a nullable FK to attorneys with ON DELETE SET NULL.
-- Deleting an attorney won't orphan the litigation row; the link
-- simply goes away. Archive is a status change, not a delete, so the
-- link survives archive.
--
-- Status pipeline:
--   draft   — being entered, not surfaced anywhere
--   active  — currently surfaced to Ada + public endpoint
--   settled — historical, kept for reference
--   closed  — historical, kept for reference
--   archived — admin-hidden
--
-- The unique constraint on (org_id, slug) prevents duplicate URLs
-- within an organization. Slug is required and admin-supplied; future
-- enhancement can auto-derive from case_name.
--
-- Three indexes:
--   (kind, status) — primary list-page query (e.g. "active class actions")
--   (lead_attorney_id) — attorney-edit-page "Linked litigation" panel
--   GIN on affected_states — Ada matching by user's state.

CREATE TABLE IF NOT EXISTS litigation_listings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(id),

  kind                text NOT NULL CHECK (kind IN ('class', 'mass')),
  case_name           text NOT NULL,
  slug                text NOT NULL,
  short_description   text,
  full_description    text,
  eligibility         text,

  defendants          jsonb NOT NULL DEFAULT '[]'::jsonb,
  court               text,
  docket_number       text,
  affected_states     jsonb NOT NULL DEFAULT '[]'::jsonb,
  filing_date         date,

  lead_attorney_id    uuid REFERENCES attorneys(id) ON DELETE SET NULL,

  status              text NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'active', 'settled', 'closed', 'archived')),

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT litigation_listings_org_slug_unique UNIQUE (org_id, slug)
);

CREATE INDEX IF NOT EXISTS litigation_kind_status
  ON litigation_listings (kind, status);

CREATE INDEX IF NOT EXISTS litigation_lead_attorney
  ON litigation_listings (lead_attorney_id);

CREATE INDEX IF NOT EXISTS litigation_affected_states_gin
  ON litigation_listings USING gin (affected_states);
