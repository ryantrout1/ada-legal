-- Migration 0030: attorney firm role (owner vs member) — /plan Phase 3.1.
--
-- firm_role gates the owner-only "Lawyers in my firm" view + firm editing.
-- Default 'member' (constant default => metadata-only, no table rewrite, no
-- long lock). Multi-owner-ready: an owner is any row with firm_role='owner'
-- in the firm. Existing rows become members until explicitly promoted.

ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS firm_role text NOT NULL DEFAULT 'member';
