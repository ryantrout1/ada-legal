/**
 * Cases foundation tables (migration 0023).
 *
 * The worked-case data model: `cases` (the canonical entity an intake becomes
 * once routed) plus its children — contacts, case_people, case_activity,
 * case_documents, case_tasks.
 *
 * Conventions match schema-core.ts: uuid ids via gen_random_uuid(), timestamptz
 * everywhere, org_id FK on org-scoped tables. `firm_id` is a plain uuid (no
 * Drizzle reference) because law_firms lives in schema-ch1.ts — same pattern as
 * attorneys.law_firm_id and litigation_listings.lead_firm_id; the FK is declared
 * in the SQL migration.
 *
 * `cases.status` is mutated only via src/engine/cases/caseStateMachine.ts
 * (DO_NOT_TOUCH rule 2 discipline). Never driven through ada_sessions.status.
 *
 * Ref: /plan Phase 0.
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  bigint,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations, users, adaSessions, litigationListings, attorneys } from './schema-core.js';

// ─── cases ────────────────────────────────────────────────────────────────────

export const cases = pgTable(
  'cases',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),

    adaSessionId: uuid('ada_session_id').references(() => adaSessions.id, { onDelete: 'set null' }),
    litigationListingId: uuid('litigation_listing_id').references(() => litigationListings.id, {
      onDelete: 'set null',
    }),

    caseNumber: text('case_number')
      .notNull()
      .default(sql`('CASE-' || lpad(nextval('case_number_seq')::text, 4, '0'))`),

    lane: text('lane').notNull(),
    status: text('status').notNull().default('new'),

    // firm_id FK declared in SQL (law_firms in schema-ch1.ts).
    firmId: uuid('firm_id'),
    assignedLawyerId: uuid('assigned_lawyer_id').references(() => attorneys.id, {
      onDelete: 'set null',
    }),

    classificationTitle: text('classification_title'),
    classificationStandard: text('classification_standard'),
    matchConfidence: text('match_confidence'),
    jurisdictionState: text('jurisdiction_state'),

    // Statute of limitations — ATTORNEY-SET ONLY, never auto-computed (UPL /
    // malpractice). Null until an attorney enters it. Phase 5 §7.3.
    solDate: date('sol_date'),

    consentToShare: boolean('consent_to_share').notNull().default(false),
    consentAt: timestamp('consent_at', { withTimezone: true }),
    consentScope: text('consent_scope'),

    routedAt: timestamp('routed_at', { withTimezone: true }),
    firstContactDue: timestamp('first_contact_due', { withTimezone: true }),
    contactedAt: timestamp('contacted_at', { withTimezone: true }),
    declinedAt: timestamp('declined_at', { withTimezone: true }),
    declineReason: text('decline_reason'),
    reclaimedAt: timestamp('reclaimed_at', { withTimezone: true }),

    resolutionType: text('resolution_type'),
    resolutionNotes: text('resolution_notes'),
    outcomeAmountCents: bigint('outcome_amount_cents', { mode: 'number' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('cases_ada_session_unique').on(t.adaSessionId),
    uniqueIndex('cases_case_number_unique').on(t.caseNumber),
    index('cases_org_firm_status').on(t.orgId, t.firmId, t.status),
    index('cases_litigation').on(t.litigationListingId),
    index('cases_lane_status').on(t.lane, t.status),
    index('cases_first_contact_due')
      .on(t.firstContactDue)
      .where(sql`${t.status} IN ('accepted', 'working')`),
    check(
      'cases_lane_enum',
      sql`${t.lane} IN ('routed_firm', 'sourcing', 'general_queue', 'self_help', 'no_action')`,
    ),
    check(
      'cases_status_enum',
      sql`${t.status} IN ('new', 'accepted', 'declined', 'working', 'resolved', 'reclaimed', 'closed')`,
    ),
    check(
      'cases_resolution_type_enum',
      sql`${t.resolutionType} IS NULL OR ${t.resolutionType} IN ('engaged', 'referred_out', 'not_viable', 'claimant_unresponsive', 'claimant_declined', 'admin_closed')`,
    ),
  ],
);

// ─── contacts ─────────────────────────────────────────────────────────────────

export const contacts = pgTable(
  'contacts',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),
    name: text('name'),
    email: text('email'),
    phone: text('phone'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('contacts_org').on(t.orgId)],
);

// ─── case_people ──────────────────────────────────────────────────────────────

export const casePeople = pgTable(
  'case_people',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('case_people_unique').on(t.caseId, t.contactId, t.role),
    index('case_people_case').on(t.caseId),
    check(
      'case_people_role_enum',
      sql`${t.role} IN ('client', 'witness', 'opposing_counsel', 'expert', 'other')`,
    ),
  ],
);

// ─── case_activity ────────────────────────────────────────────────────────────

export const caseActivity = pgTable(
  'case_activity',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    actorType: text('actor_type').notNull(),
    actorId: uuid('actor_id'),
    eventType: text('event_type').notNull(),
    summary: text('summary'),
    body: text('body'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('case_activity_case_time').on(t.caseId, t.createdAt),
    check('case_activity_actor_type_enum', sql`${t.actorType} IN ('user', 'system', 'ada', 'client')`),
  ],
);

// ─── case_documents ───────────────────────────────────────────────────────────

export const caseDocuments = pgTable(
  'case_documents',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    filename: text('filename').notNull(),
    mimeType: text('mime_type'),
    sizeBytes: bigint('size_bytes', { mode: 'number' }),
    storageUrl: text('storage_url').notNull(),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    uploadedBy: uuid('uploaded_by').references(() => users.id),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('case_documents_case').on(t.caseId)],
);

// ─── case_tasks ───────────────────────────────────────────────────────────────

export const caseTasks = pgTable(
  'case_tasks',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    caseId: uuid('case_id')
      .notNull()
      .references(() => cases.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    dueDate: date('due_date'),
    priority: text('priority').notNull().default('medium'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('case_tasks_case').on(t.caseId),
    index('case_tasks_open').on(t.caseId, t.dueDate).where(sql`${t.completedAt} IS NULL`),
    check('case_tasks_priority_enum', sql`${t.priority} IN ('high', 'medium', 'low')`),
  ],
);
