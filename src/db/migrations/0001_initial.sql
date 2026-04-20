-- ============================================================================
-- Migration 0001 — initial schema
-- ============================================================================
-- Creates every Ch0 table and every Ch1-shaped empty table, plus the ADALL
-- default organization row.
--
-- This file is the source of truth for what is in Postgres. Drizzle schema
-- in src/db/schema.ts mirrors it for type-safe queries.
--
-- Note on updated_at maintenance: we do NOT use a plpgsql trigger. Instead
-- Drizzle maintains updated_at in application code via .$onUpdate(() => new Date()).
-- Rationale: the Neon MCP migration tool can't parse plpgsql function bodies
-- cleanly, and keeping updated_at logic in app code eliminates one Postgres
-- dependency. Direct SQL updates (which should be rare) set updated_at
-- explicitly.
--
-- Ref: docs/ARCHITECTURE.md §3
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS vector;     -- for future RAG; unused in Ch0

-- ============================================================================
-- CORE TABLES (Ch0)
-- ============================================================================

-- ─── organizations ──────────────────────────────────────────────────────────
CREATE TABLE organizations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_code            text NOT NULL UNIQUE,
  display_name        text NOT NULL,
  logo_url            text,
  primary_color       text,
  secondary_color     text,
  welcome_message     text,
  disclaimers         text,
  ada_intro_prompt    text,
  custom_domain       text,
  status              text NOT NULL DEFAULT 'active',
  is_default          boolean NOT NULL DEFAULT false,
  clerk_org_id        text UNIQUE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX one_default_org
  ON organizations (is_default)
  WHERE is_default = true;

-- ─── users ──────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id       text NOT NULL UNIQUE,
  email               text,
  display_name        text,
  role                text NOT NULL DEFAULT 'user',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── org_memberships ────────────────────────────────────────────────────────
CREATE TABLE org_memberships (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role                text NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

-- ─── anon_sessions ──────────────────────────────────────────────────────────
CREATE TABLE anon_sessions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash          text NOT NULL UNIQUE,
  first_seen_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at        timestamptz NOT NULL DEFAULT now(),
  linked_user_id      uuid REFERENCES users(id),
  user_agent          text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX anon_sessions_last_seen ON anon_sessions (last_seen_at);

-- ─── ada_sessions ───────────────────────────────────────────────────────────
CREATE TABLE ada_sessions (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                      uuid NOT NULL REFERENCES organizations(id),
  session_type                text NOT NULL,
  status                      text NOT NULL DEFAULT 'active',

  anon_session_id             uuid REFERENCES anon_sessions(id),
  user_id                     uuid REFERENCES users(id),

  listing_id                  uuid,  -- FK added below after listings is created
  complaint_id                uuid,  -- FK deferred to Ch2

  conversation_history        jsonb NOT NULL DEFAULT '[]'::jsonb,
  extracted_fields            jsonb NOT NULL DEFAULT '{}'::jsonb,
  classification              jsonb,
  structured_output           jsonb,
  confidence_tier             text,

  reading_level               text NOT NULL DEFAULT 'standard',

  redirected_from_session_id  uuid REFERENCES ada_sessions(id),

  metadata                    jsonb NOT NULL DEFAULT '{}'::jsonb,
  accessibility_settings      jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_test                     boolean NOT NULL DEFAULT false,

  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  completed_at                timestamptz,

  CONSTRAINT ada_sessions_reading_level
    CHECK (reading_level IN ('simple', 'standard', 'professional')),
  CONSTRAINT ada_sessions_status_enum
    CHECK (status IN ('active', 'completed', 'abandoned')),
  CONSTRAINT session_identity_exclusive
    CHECK ((anon_session_id IS NOT NULL)::int + (user_id IS NOT NULL)::int = 1)
);

CREATE INDEX ada_sessions_org ON ada_sessions (org_id, created_at DESC);
CREATE INDEX ada_sessions_anon ON ada_sessions (anon_session_id)
  WHERE anon_session_id IS NOT NULL;
CREATE INDEX ada_sessions_user ON ada_sessions (user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX ada_sessions_status ON ada_sessions (status, updated_at DESC);
CREATE INDEX ada_sessions_listing ON ada_sessions (listing_id)
  WHERE listing_id IS NOT NULL;

-- ─── photo_analyses ─────────────────────────────────────────────────────────
CREATE TABLE photo_analyses (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid NOT NULL REFERENCES ada_sessions(id) ON DELETE CASCADE,
  org_id              uuid NOT NULL REFERENCES organizations(id),
  photo_url           text NOT NULL,
  photo_blob_key      text NOT NULL,
  findings            jsonb NOT NULL DEFAULT '[]'::jsonb,
  model_version       text NOT NULL,
  analyzed_at         timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX photo_analyses_session ON photo_analyses (session_id);

-- ─── attorneys ──────────────────────────────────────────────────────────────
CREATE TABLE attorneys (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(id),
  name                text NOT NULL,
  firm_name           text,
  location_city       text,
  location_state      text,
  practice_areas      jsonb NOT NULL DEFAULT '[]'::jsonb,
  email               text,
  phone               text,
  website_url         text,
  bio                 text,
  photo_url           text,
  status              text NOT NULL DEFAULT 'pending',
  approved_by         uuid REFERENCES users(id),
  approved_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX attorneys_status_state ON attorneys (status, location_state);

-- ─── ada_knowledge_chunks ───────────────────────────────────────────────────
CREATE TABLE ada_knowledge_chunks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic               text NOT NULL,
  title               text NOT NULL,
  content             text NOT NULL,
  standard_refs       jsonb NOT NULL DEFAULT '[]'::jsonb,
  embedding           vector(1536),
  source              text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ada_knowledge_topic ON ada_knowledge_chunks (topic);

-- ─── audit_log (append-only) ────────────────────────────────────────────────
CREATE TABLE audit_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid REFERENCES organizations(id),
  actor_type          text NOT NULL,
  actor_id            text,
  action              text NOT NULL,
  resource_type       text,
  resource_id         text,
  metadata            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_org_time ON audit_log (org_id, created_at DESC);
CREATE INDEX audit_log_resource ON audit_log (resource_type, resource_id);

-- ─── session_quality_checks ─────────────────────────────────────────────────
CREATE TABLE session_quality_checks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          uuid NOT NULL UNIQUE REFERENCES ada_sessions(id) ON DELETE CASCADE,
  passed              boolean NOT NULL,
  failures            jsonb NOT NULL DEFAULT '[]'::jsonb,
  warnings            jsonb NOT NULL DEFAULT '[]'::jsonb,
  checked_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── system_settings (singleton key-value store for admin toggles) ──────────
CREATE TABLE system_settings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key                 text NOT NULL UNIQUE,
  value               jsonb NOT NULL,
  updated_by          uuid REFERENCES users(id),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- CH1-SHAPED TABLES (created empty; populated in Ch1)
-- ============================================================================

CREATE TABLE law_firms (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(id),
  name                text NOT NULL,
  primary_contact     text,
  email               text,
  phone               text,
  stripe_customer_id  text,
  status              text NOT NULL DEFAULT 'active',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE listings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  law_firm_id         uuid NOT NULL REFERENCES law_firms(id),
  title               text NOT NULL,
  slug                text NOT NULL UNIQUE,
  category            text NOT NULL,
  short_description   text,
  full_description    text,
  eligibility_summary text,
  status              text NOT NULL DEFAULT 'draft',
  tier                text NOT NULL DEFAULT 'basic',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ada_sessions
  ADD CONSTRAINT ada_sessions_listing_fk
  FOREIGN KEY (listing_id) REFERENCES listings(id);

CREATE TABLE listing_configs (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id                uuid NOT NULL UNIQUE REFERENCES listings(id) ON DELETE CASCADE,
  case_description          text NOT NULL,
  eligibility_criteria      jsonb NOT NULL DEFAULT '[]'::jsonb,
  required_fields           jsonb NOT NULL DEFAULT '[]'::jsonb,
  disqualifying_conditions  jsonb NOT NULL DEFAULT '[]'::jsonb,
  ada_prompt_override       text,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE routing_rules (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_org_id       uuid NOT NULL REFERENCES organizations(id),
  complaint_types     jsonb NOT NULL DEFAULT '[]'::jsonb,
  jurisdictions       jsonb NOT NULL DEFAULT '[]'::jsonb,
  active              boolean NOT NULL DEFAULT true,
  priority            integer NOT NULL DEFAULT 100,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX routing_rules_active ON routing_rules (active, priority)
  WHERE active = true;

CREATE TABLE subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  law_firm_id             uuid NOT NULL REFERENCES law_firms(id),
  listing_id              uuid REFERENCES listings(id),
  stripe_subscription_id  text UNIQUE,
  tier                    text NOT NULL,
  status                  text NOT NULL,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stripe_webhook_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id     text NOT NULL UNIQUE,
  type                text NOT NULL,
  payload             jsonb NOT NULL,
  processed_at        timestamptz,
  error               text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- SEED: ADALL default organization
-- ============================================================================

INSERT INTO organizations (
  org_code,
  display_name,
  status,
  is_default,
  clerk_org_id
) VALUES (
  'adall',
  'ADA Legal Link',
  'active',
  true,
  NULL
);

-- ============================================================================
-- Migration tracking row
-- ============================================================================

CREATE TABLE IF NOT EXISTS _migrations (
  id          serial PRIMARY KEY,
  filename    text NOT NULL UNIQUE,
  applied_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO _migrations (filename) VALUES ('0001_initial.sql');
