-- Cases foundation — Phase 0 schema (additive, replayable).
--
-- The worked-case data model the router (Phase 1) and the lawyer workspace
-- (Phase 2) build on. Everything here is additive: CREATE TABLE / SEQUENCE /
-- INDEX IF NOT EXISTS, ADD COLUMN IF NOT EXISTS. No destructive ALTERs. Safe
-- to replay.
--
-- Why these tables:
--   - cases            — the canonical worked entity. An ada_session (the
--                        intake) becomes a case once routed. `lane` records
--                        the routing destination; `status` is the work
--                        lifecycle, mutated only via the case state machine
--                        (src/engine/cases/caseStateMachine.ts), the same
--                        discipline DO_NOT_TOUCH rule 2 imposes on
--                        ada_sessions.status. A case is never driven through
--                        ada_sessions.status.
--   - contacts         — org-scoped people (claimant, witness, opposing
--                        counsel). Reused across cases.
--   - case_people      — case ↔ contact with a role.
--   - case_activity    — append-only case timeline (routing, accept/decline,
--                        contact logged, notes, reclaim, resolution). No
--                        conversation content here (DO_NOT_TOUCH rule 8).
--   - case_documents   — files (Vercel Blob storage_url). Wired in Phase 2.
--   - case_tasks       — checklist items. Table now; UI in Phase 4.
--   - attorneys.*      — capacity / routing throttle the Phase 1 router reads:
--                        accepting_referrals, routing_paused, max_active_cases.
--
-- FK note: org_id / users / ada_sessions / litigation_listings / attorneys all
-- live in schema-core.ts; law_firms lives in schema-ch1.ts. Following the
-- existing pattern (attorneys.law_firm_id, litigation_listings.lead_firm_id),
-- firm_id is a plain uuid whose FK is declared here in SQL.
--
-- Ref: /plan Phase 0 (Lawyer Workspace foundations).

-- ─── case_number sequence ────────────────────────────────────────────────────
-- Global monotonic sequence behind the human-facing CASE-NNNN label.
-- Per-org / per-firm numbering is deferred (see /plan open decisions).

CREATE SEQUENCE IF NOT EXISTS case_number_seq START 1;

-- ─── cases: the canonical worked entity ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS cases (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES organizations(id),

  -- Intake link. Nullable (admin can create a case directly); UNIQUE so a
  -- session maps to at most one case (/plan Phase 0 assumption).
  ada_session_id          uuid REFERENCES ada_sessions(id) ON DELETE SET NULL,

  -- Matched litigation (set when Ada binds one). Nullable for the
  -- general_queue / self_help / no_action lanes.
  litigation_listing_id   uuid REFERENCES litigation_listings(id) ON DELETE SET NULL,

  case_number             text NOT NULL
                            DEFAULT ('CASE-' || lpad(nextval('case_number_seq')::text, 4, '0')),

  -- Routing destination, set once by the router.
  lane                    text NOT NULL
                            CONSTRAINT cases_lane_enum CHECK (lane IN ('routed_firm', 'sourcing', 'general_queue', 'self_help', 'no_action')),

  -- Work lifecycle, mutated only via the case state machine.
  status                  text NOT NULL DEFAULT 'new'
                            CONSTRAINT cases_status_enum CHECK (status IN ('new', 'accepted', 'declined', 'working', 'resolved', 'reclaimed', 'closed')),

  -- Ownership. firm_id FK declared here (law_firms in schema-ch1.ts).
  firm_id                 uuid REFERENCES law_firms(id),
  assigned_lawyer_id      uuid REFERENCES attorneys(id) ON DELETE SET NULL,

  -- Routing snapshots for queue display without re-reading the session.
  classification_title    text,
  classification_standard text,
  match_confidence        text,
  jurisdiction_state      text,

  -- Consent: the claimant's OK to share their info with an attorney.
  -- Defaults to not-shared; the matched lanes gate on consent_to_share.
  consent_to_share        boolean NOT NULL DEFAULT false,
  consent_at              timestamptz,
  consent_scope           text,

  -- Accountability timestamps (responsiveness loop + reclaim path).
  routed_at               timestamptz,
  first_contact_due       timestamptz,
  contacted_at            timestamptz,
  declined_at             timestamptz,
  decline_reason          text,
  reclaimed_at            timestamptz,

  -- Resolution.
  resolution_type         text
                            CONSTRAINT cases_resolution_type_enum CHECK (resolution_type IN ('engaged', 'referred_out', 'not_viable', 'claimant_unresponsive', 'claimant_declined', 'admin_closed')),
  resolution_notes        text,
  outcome_amount_cents    bigint,
  resolved_at             timestamptz,

  created_by              uuid REFERENCES users(id),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  -- At most one case per session (multiple NULLs allowed for admin-created).
  CONSTRAINT cases_ada_session_unique UNIQUE (ada_session_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS cases_case_number_unique ON cases (case_number);
CREATE INDEX IF NOT EXISTS cases_org_firm_status ON cases (org_id, firm_id, status);
CREATE INDEX IF NOT EXISTS cases_litigation       ON cases (litigation_listing_id);
CREATE INDEX IF NOT EXISTS cases_lane_status      ON cases (lane, status);
CREATE INDEX IF NOT EXISTS cases_first_contact_due
  ON cases (first_contact_due) WHERE status IN ('accepted', 'working');

-- ─── contacts: org-scoped people ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id),
  name        text,
  email       text,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contacts_org ON contacts (org_id);

-- ─── case_people: case ↔ contact with a role ─────────────────────────────────

CREATE TABLE IF NOT EXISTS case_people (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     uuid NOT NULL REFERENCES cases(id)    ON DELETE CASCADE,
  contact_id  uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  role        text NOT NULL CONSTRAINT case_people_role_enum CHECK (role IN ('client', 'witness', 'opposing_counsel', 'expert', 'other')),
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT case_people_unique UNIQUE (case_id, contact_id, role)
);

CREATE INDEX IF NOT EXISTS case_people_case ON case_people (case_id);

-- ─── case_activity: append-only timeline ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS case_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  actor_type  text NOT NULL CONSTRAINT case_activity_actor_type_enum CHECK (actor_type IN ('user', 'system', 'ada', 'client')),
  actor_id    uuid,
  event_type  text NOT NULL,
  summary     text,
  body        text,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS case_activity_case_time ON case_activity (case_id, created_at DESC);

-- ─── case_documents: files (Vercel Blob) ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS case_documents (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id      uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  filename     text NOT NULL,
  mime_type    text,
  size_bytes   bigint,
  storage_url  text NOT NULL,
  tags         text[] NOT NULL DEFAULT '{}',
  uploaded_by  uuid REFERENCES users(id),
  uploaded_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS case_documents_case ON case_documents (case_id);

-- ─── case_tasks: checklist ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS case_tasks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id       uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title         text NOT NULL,
  due_date      date,
  priority      text NOT NULL DEFAULT 'medium' CONSTRAINT case_tasks_priority_enum CHECK (priority IN ('high', 'medium', 'low')),
  completed_at  timestamptz,
  created_by    uuid REFERENCES users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS case_tasks_case ON case_tasks (case_id);
CREATE INDEX IF NOT EXISTS case_tasks_open ON case_tasks (case_id, due_date) WHERE completed_at IS NULL;

-- ─── attorneys: capacity / routing throttle ──────────────────────────────────
-- The Phase 1 router reads these so it can stop pushing to a full or paused
-- attorney. The criteria-matching fields (states, practice areas) already
-- exist on attorneys.

ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS accepting_referrals boolean NOT NULL DEFAULT true;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS routing_paused      boolean NOT NULL DEFAULT false;
ALTER TABLE attorneys ADD COLUMN IF NOT EXISTS max_active_cases    integer;
