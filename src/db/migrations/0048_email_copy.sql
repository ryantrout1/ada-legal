-- Edited email copy. Additive, replayable.
--
-- Seven emails go out today and every string in them lives in code, so
-- changing a sentence a claimant reads takes a developer, a commit and a
-- deploy. The standing rule is that Gina reviews all claimant- and
-- attorney-facing copy; today that review can only happen through a push.
-- This table is where the review gate stops depending on one.
--
-- ONE ROW PER SLOT PER READING LEVEL. The unique index is the whole
-- point. `claimant_handoff.summary_heading` exists three times — simple,
-- standard, professional — because those are how someone who finds dense
-- text hard reads their own case. Editing one must not touch the others,
-- and the index is what makes an upsert land on exactly the row it meant.
--
-- Flat slots store `standard` and nothing else, rather than NULL. A
-- nullable column in a unique index treats every NULL as distinct in
-- Postgres, which would let the same flat slot be inserted over and over
-- with no complaint — the index would be there and enforce nothing.
--
-- EMPTY MEANS UNTOUCHED. Nothing seeds this table. The defaults live in
-- src/engine/email/copySlots.ts and the resolver falls back to them, so
-- an absent row means nobody has edited that slot. Seeding would erase
-- the difference between "never touched" and "edited back to the
-- original", and would give the code default and the row two places to
-- disagree.
--
-- value is NOT NULL plus a CHECK rejecting whitespace, for the same
-- reason litigation_contacts.scope_note is: an empty string here renders
-- as a missing sentence in a claimant's inbox, and "no row" already has
-- a meaning that is not "blank".
--
-- Ref: /plan editable email copy — Phase 1, split. Phase 1c.

CREATE TABLE IF NOT EXISTS email_copy (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id),
  template_key  text NOT NULL,
  slot_key      text NOT NULL,
  -- 'simple' | 'standard' | 'professional'. Flat slots use 'standard'.
  reading_level text NOT NULL DEFAULT 'standard',
  value         text NOT NULL,
  updated_by    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_copy
  DROP CONSTRAINT IF EXISTS email_copy_reading_level_check;
ALTER TABLE email_copy
  ADD CONSTRAINT email_copy_reading_level_check
  CHECK (reading_level IN ('simple', 'standard', 'professional'));

ALTER TABLE email_copy
  DROP CONSTRAINT IF EXISTS email_copy_value_check;
ALTER TABLE email_copy
  ADD CONSTRAINT email_copy_value_check
  CHECK (length(btrim(value)) > 0);

-- The row identity. Scoped by org because every other table here is, and
-- there is exactly one org today — this keeps that true by construction
-- rather than by nobody having tried a second one.
CREATE UNIQUE INDEX IF NOT EXISTS email_copy_slot_key
  ON email_copy (org_id, template_key, slot_key, reading_level);

-- The read path is always "everything for one template", so the index
-- above already covers it on its leading columns. No second index.
