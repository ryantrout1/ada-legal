-- 0028_case_documents_storage_kind.sql
--
-- Phase 5 §7.5 (native upload): distinguish how a document is stored.
--   'reference' — storage_url is an external http(s) link the attorney pasted
--                 (their DMS/Drive). Opened directly in the browser.
--   'blob'      — storage_url is a PRIVATE Vercel Blob URL in the ada-legal-docs
--                 store. Never opened directly; streamed through an authenticated,
--                 firm-scoped download Function.
--
-- Existing rows are all reference-attach, so 'reference' is the correct backfill.

ALTER TABLE case_documents
  ADD COLUMN storage_kind text NOT NULL DEFAULT 'reference'
  CHECK (storage_kind IN ('reference', 'blob'));
