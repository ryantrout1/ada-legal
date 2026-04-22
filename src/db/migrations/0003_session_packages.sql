-- ============================================================================
-- Migration 0003 — session_packages
-- ============================================================================
-- Step 18 (Triage & Routing) generates a "package" at the end of each Ada
-- session: summary, classification, facts, photos, cited regulations,
-- routing destinations, optional demand letter. The package is the
-- artifact the user takes away — rendered at /s/{slug} as a web page and
-- downloadable as a PDF.
--
-- This table persists packages so the /s/{slug} URL survives the session
-- ending. The session itself stays in ada_sessions; this table is a
-- projection keyed by a stable, unguessable slug.
--
-- Lifecycle:
--   - Row inserted when Ada calls end_session (via package assembler).
--   - Row is immutable after insert. If the session's understanding
--     changes, a NEW package is generated with a new slug. The old one
--     remains valid for any existing shared links.
--   - expires_at defaults to 90 days from creation; users can request
--     permanent retention in a later commit.
--
-- Security model:
--   - Slugs are ~60 bits of cryptographic randomness (Crockford base32).
--     Unguessable by enumeration; linkable only by someone with the URL.
--   - No auth required to view — the slug IS the access control.
--   - Admin can list/read regardless of slug (via session_id FK).
--
-- Ref: Step 18, Commit 4.
-- ============================================================================

CREATE TABLE session_packages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text NOT NULL UNIQUE,
  session_id       uuid NOT NULL REFERENCES ada_sessions(id) ON DELETE CASCADE,
  -- Full package JSON, assembled by src/engine/package/assemble.ts.
  -- Stored verbatim so rendering is pure data → view; no re-running the
  -- assembler at render time.
  payload          jsonb NOT NULL,
  -- Denormalized for admin list queries (so we don't have to parse payload
  -- to filter / sort).
  classification_title  text,
  generated_at     timestamp with time zone NOT NULL DEFAULT now(),
  expires_at       timestamp with time zone,
  created_at       timestamp with time zone NOT NULL DEFAULT now()
);

-- Slug lookups are the hottest query (/s/{slug} page load). Indexed via
-- UNIQUE constraint above.

-- Admin list by session.
CREATE INDEX session_packages_session_id_idx ON session_packages (session_id);

-- For expiry sweeps.
CREATE INDEX session_packages_expires_at_idx ON session_packages (expires_at)
  WHERE expires_at IS NOT NULL;

COMMENT ON TABLE session_packages IS
  'Immutable, slug-addressable packages generated at session end. Step 18 (Triage & Routing).';
