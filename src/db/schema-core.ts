/**
 * Ch0 core tables. See docs/ARCHITECTURE.md §3 for the source of truth.
 *
 * Conventions:
 *   - Every id is uuid, defaulted via gen_random_uuid().
 *   - Every timestamp is timestamptz.
 *   - Every table has created_at + updated_at (the latter is trigger-maintained;
 *     we set the default here for compatibility with direct inserts).
 *   - jsonb shapes are typed in @/types/db.ts and surfaced via $type<...>().
 *   - org_id is a foreign key to organizations.id on every org-scoped table.
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  index,
  check,
  foreignKey,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type {
  Message,
  ExtractedFields,
  Classification,
  SessionMetadata,
  AccessibilitySnapshot,
  PhotoFinding,
  PhotoOverallRisk,
  QualityCheckFailure,
  QualityCheckWarning,
  AuditMetadata,
  ReadingLevelStringList,
  ReadingLevelText,
  PhotoFindingLabel,
  MissedFinding,
  ReviewOverallVerdict,
  ReviewStatus,
} from '../types/db.js';

// ─── organizations ────────────────────────────────────────────────────────────

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orgCode: text('org_code').notNull().unique(),
    displayName: text('display_name').notNull(),
    logoUrl: text('logo_url'),
    primaryColor: text('primary_color'),
    secondaryColor: text('secondary_color'),
    welcomeMessage: text('welcome_message'),
    disclaimers: text('disclaimers'),
    adaIntroPrompt: text('ada_intro_prompt'),
    customDomain: text('custom_domain'),
    status: text('status').notNull().default('active'),
    isDefault: boolean('is_default').notNull().default(false),
    clerkOrgId: text('clerk_org_id').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    // Exactly one row with is_default=true (the ADALL default org).
    uniqueIndex('one_default_org').on(t.isDefault).where(sql`${t.isDefault} = true`),
  ],
);

// ─── users ────────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  email: text('email'),
  displayName: text('display_name'),
  role: text('role').notNull().default('user'), // user | admin | staff
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── org_memberships ──────────────────────────────────────────────────────────

export const orgMemberships = pgTable(
  'org_memberships',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // admin | investigator | clerk | viewer
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('org_memberships_unique').on(t.orgId, t.userId)],
);

// ─── anon_sessions ────────────────────────────────────────────────────────────

export const anonSessions = pgTable(
  'anon_sessions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    tokenHash: text('token_hash').notNull().unique(),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    linkedUserId: uuid('linked_user_id').references(() => users.id),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index('anon_sessions_last_seen').on(t.lastSeenAt)],
);

// ─── ada_sessions ─────────────────────────────────────────────────────────────

export const adaSessions = pgTable(
  'ada_sessions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),
    sessionType: text('session_type').notNull(),
    status: text('status').notNull().default('active'),

    // Identity (exactly one non-null; enforced by CHECK)
    anonSessionId: uuid('anon_session_id').references(() => anonSessions.id),
    userId: uuid('user_id').references(() => users.id),

    // Channel FKs (null in Ch0; listings FK added once listings exists)
    listingId: uuid('listing_id'),
    /**
     * Phase A1 (May 2026): binds a session to a `litigation_listings`
     * row. Separate from `listingId` (which points at the legacy Ch1
     * `listings` table); historical sessions keep their original
     * reference, new sessions populate this column. FK constraint
     * declared in migration 0010 (ON DELETE SET NULL).
     */
    litigationListingId: uuid('litigation_listing_id'),
    complaintId: uuid('complaint_id'),

    // Conversation
    conversationHistory: jsonb('conversation_history').$type<Message[]>().notNull().default(sql`'[]'::jsonb`),
    extractedFields: jsonb('extracted_fields').$type<ExtractedFields>().notNull().default(sql`'{}'::jsonb`),
    classification: jsonb('classification').$type<Classification | null>(),
    structuredOutput: jsonb('structured_output').$type<Record<string, unknown> | null>(),
    confidenceTier: text('confidence_tier'),

    // UX state
    readingLevel: text('reading_level').notNull().default('standard'),

    // Cross-channel
    redirectedFromSessionId: uuid('redirected_from_session_id'),

    // Observability
    metadata: jsonb('metadata').$type<SessionMetadata>().notNull().default(sql`'{}'::jsonb`),
    accessibilitySettings: jsonb('accessibility_settings')
      .$type<AccessibilitySnapshot>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    isTest: boolean('is_test').notNull().default(false),

    // Lifecycle
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    index('ada_sessions_org').on(t.orgId, t.createdAt),
    index('ada_sessions_anon').on(t.anonSessionId).where(sql`${t.anonSessionId} IS NOT NULL`),
    index('ada_sessions_user').on(t.userId).where(sql`${t.userId} IS NOT NULL`),
    index('ada_sessions_status').on(t.status, t.updatedAt),
    index('ada_sessions_listing').on(t.listingId).where(sql`${t.listingId} IS NOT NULL`),

    // Self-reference (redirected_from_session_id -> ada_sessions.id)
    foreignKey({
      name: 'ada_sessions_redirected_from_fk',
      columns: [t.redirectedFromSessionId],
      foreignColumns: [t.id],
    }),

    // Reading level must be one of three.
    check(
      'ada_sessions_reading_level',
      sql`${t.readingLevel} IN ('simple', 'standard', 'professional')`,
    ),

    // Status must be one of three.
    check(
      'ada_sessions_status_enum',
      sql`${t.status} IN ('active', 'completed', 'abandoned')`,
    ),

    // Identity: exactly one of anon_session_id or user_id must be set.
    check(
      'session_identity_exclusive',
      sql`(${t.anonSessionId} IS NOT NULL)::int + (${t.userId} IS NOT NULL)::int = 1`,
    ),
  ],
);

// ─── photo_analyses ───────────────────────────────────────────────────────────

export const photoAnalyses = pgTable(
  'photo_analyses',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => adaSessions.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),
    photoUrl: text('photo_url').notNull(),
    photoBlobKey: text('photo_blob_key').notNull(),
    findings: jsonb('findings').$type<PhotoFinding[]>().notNull().default(sql`'[]'::jsonb`),
    /**
     * Scene description with three reading-level variants. Nullable
     * because rows written before Commit 8 don't have it. Step 30.
     */
    scene: jsonb('scene').$type<ReadingLevelText | null>(),
    /** 2-3 sentence batch assessment. Nullable for pre-Commit-8 rows. */
    summary: jsonb('summary').$type<ReadingLevelText | null>(),
    /**
     * Risk rollup across the batch. Nullable for pre-Commit-8 rows.
     * Values: 'high' | 'medium' | 'low' | 'none'.
     */
    overallRisk: text('overall_risk').$type<PhotoOverallRisk | null>(),
    /** Compliant features observed. Nullable for pre-Commit-8 rows. */
    positiveFindings: jsonb('positive_findings').$type<ReadingLevelStringList | null>(),
    /**
     * Free-text note the tester adds AFTER seeing Ada's analysis on the
     * /photo field-capture page — their reaction/feedback on what Ada
     * said. Nullable; populated by POST /api/ada/photo-feedback.
     */
    testerComment: text('tester_comment'),
    modelVersion: text('model_version').notNull(),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('photo_analyses_session').on(t.sessionId)],
);

// ─── photo_reviews (expert labeling loop) ───────────────────────────────────
//
// A reviewer's verdict on a photo analysis. One row per (analysis,
// reviewer) — Peter, Gina, and Ryan each get their own row so their
// feedback is kept separate, not overwritten. Captures both error
// directions:
// finding_labels = verdicts on emitted findings (false positives +
// confirmations); missed_findings = concerns the engine missed (false
// negatives). model_version is copied from the analysis at review time so
// the eval rollup can group accuracy by engine version.

export const photoReviews = pgTable(
  'photo_reviews',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    photoAnalysisId: uuid('photo_analysis_id')
      .notNull()
      .references(() => photoAnalyses.id, { onDelete: 'cascade' }),
    /** Display name of the reviewer: 'Peter' | 'Gina' | 'Ryan'. */
    reviewer: text('reviewer').notNull(),
    /** Clerk email for admin (Clerk) reviews; null for public self-identified reviews. */
    reviewerEmail: text('reviewer_email'),
    /** reviewed = Peter has labeled it; addressed = Ryan has acted on it. */
    status: text('status').$type<ReviewStatus>().notNull().default('reviewed'),
    overallVerdict: text('overall_verdict').$type<ReviewOverallVerdict | null>(),
    findingLabels: jsonb('finding_labels')
      .$type<PhotoFindingLabel[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    missedFindings: jsonb('missed_findings')
      .$type<MissedFinding[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    reviewerNotes: text('reviewer_notes'),
    modelVersion: text('model_version'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('photo_reviews_model_version').on(t.modelVersion),
    index('photo_reviews_status').on(t.status),
    // One review per person per analysis — the upsert target.
    uniqueIndex('photo_reviews_analysis_reviewer_key').on(t.photoAnalysisId, t.reviewer),
  ],
);

// ─── attorneys ────────────────────────────────────────────────────────────────

export const attorneys = pgTable(
  'attorneys',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),
    name: text('name').notNull(),
    firmName: text('firm_name'),
    locationCity: text('location_city'),
    locationState: text('location_state'),
    practiceAreas: jsonb('practice_areas').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    additionalStates: jsonb('additional_states').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    specialtyTags: jsonb('specialty_tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    email: text('email'),
    phone: text('phone'),
    websiteUrl: text('website_url'),
    bio: text('bio'),
    photoUrl: text('photo_url'),
    // Bar number (migration 0029). Required-to-go-live; feeds readiness +
    // the admin approve gate. Attorney-entered on the Account page.
    barNumber: text('bar_number'),
    status: text('status').notNull().default('pending'),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    // Attorney portal (migration 0019). law_firm_id is a plain uuid (no
    // Drizzle reference) because law_firms lives in schema-ch1.ts, which
    // depends on this file — same pattern as litigation_listings.lead_firm_id.
    // The FK constraint is declared in the SQL migration.
    userId: uuid('user_id').references(() => users.id),
    lawFirmId: uuid('law_firm_id'),
    // Capacity / routing throttle (migration 0023). The Phase 1 router reads
    // these to stop pushing to a full or paused attorney.
    acceptingReferrals: boolean('accepting_referrals').notNull().default(true),
    routingPaused: boolean('routing_paused').notNull().default(false),
    maxActiveCases: integer('max_active_cases'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index('attorneys_status_state').on(t.status, t.locationState),
    index('attorneys_user_id').on(t.userId).where(sql`${t.userId} is not null`),
    index('attorneys_law_firm_id').on(t.lawFirmId).where(sql`${t.lawFirmId} is not null`),
  ],
);

// ─── litigation_listings ──────────────────────────────────────────────────────
// Phase A1 (May 2026): expanded from class+mass to cover the full landscape
// of disability-rights litigation: class actions, DOJ enforcement actions,
// consent decrees in compliance phase, pattern-of-practice (no current
// named case — we collect intake), and regulatory challenges. CHECK
// constraints on kind + status live in migrations 0009 / 0010.
//
// lead_firm_id is a plain uuid without a Drizzle reference because
// law_firms lives in schema-ch1.ts (depends on this file). The FK
// constraint is declared in the SQL migration (0010) instead, same
// pattern as ada_sessions.listing_id.

export const litigationListings = pgTable(
  'litigation_listings',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id),
    kind: text('kind').notNull(), // see CHECK in migration 0010
    caseName: text('case_name').notNull(),
    slug: text('slug').notNull(),

    // Phase A1: short legal-theory label.
    legalTheory: text('legal_theory'),

    // Phase A1: prose triplets (standard + simple + professional). The
    // un-suffixed column is the standard variant kept for back-compat
    // with the existing public API.
    shortDescription: text('short_description'),
    shortDescriptionSimple: text('short_description_simple'),
    shortDescriptionProfessional: text('short_description_professional'),
    fullDescription: text('full_description'),
    fullDescriptionSimple: text('full_description_simple'),
    fullDescriptionProfessional: text('full_description_professional'),
    eligibility: text('eligibility'),
    eligibilitySimple: text('eligibility_simple'),
    eligibilityProfessional: text('eligibility_professional'),

    // Phase A1: documentation-gating fields. Each has simple + professional
    // variants. Ada presents these at the "do you qualify" gate.
    documentationRequiredSimple: text('documentation_required_simple'),
    documentationRequiredProfessional: text('documentation_required_professional'),
    noDocumentationPathSimple: text('no_documentation_path_simple'),
    noDocumentationPathProfessional: text('no_documentation_path_professional'),
    evidenceGuidanceSimple: text('evidence_guidance_simple'),
    evidenceGuidanceProfessional: text('evidence_guidance_professional'),
    whatThisIsNotSimple: text('what_this_is_not_simple'),
    whatThisIsNotProfessional: text('what_this_is_not_professional'),

    defendants: jsonb('defendants').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    court: text('court'),
    docketNumber: text('docket_number'),
    affectedStates: jsonb('affected_states').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    filingDate: date('filing_date'),

    // Phase A1: structured key dates. Free-form keyed JSON so admin can
    // evolve the vocabulary without schema migrations.
    keyDates: jsonb('key_dates').$type<Record<string, string>>().notNull().default(sql`'{}'::jsonb`),

    // Phase A1: companion case ids (consolidated actions, related filings).
    relatedListingIds: jsonb('related_listing_ids')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),

    // Phase A1: Ada qualifying-question structure. Permissive shape.
    adaQualifyingQuestions: jsonb('ada_qualifying_questions')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),

    leadAttorneyId: uuid('lead_attorney_id').references(() => attorneys.id, {
      onDelete: 'set null',
    }),

    // Phase A1: optional lead firm. FK declared in migration 0010
    // (ON DELETE SET NULL).
    leadFirmId: uuid('lead_firm_id'),

    status: text('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index('litigation_kind_status').on(t.kind, t.status),
    index('litigation_lead_attorney').on(t.leadAttorneyId),
  ],
);

// ─── litigation_firm_assignments ──────────────────────────────────────────────
// Attorney portal (migration 0019): the routing fan-out. Many firms per
// litigation row. Distinct from litigation_listings.lead_firm_id (the public
// "lead counsel" surface). law_firm_id is a plain uuid (law_firms in
// schema-ch1.ts); its FK is declared in the SQL migration.

export const litigationFirmAssignments = pgTable(
  'litigation_firm_assignments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    litigationListingId: uuid('litigation_listing_id')
      .notNull()
      .references(() => litigationListings.id, { onDelete: 'cascade' }),
    lawFirmId: uuid('law_firm_id').notNull(),
    assignedByUserId: uuid('assigned_by_user_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('litigation_firm_assignments_unique').on(t.litigationListingId, t.lawFirmId),
    index('lfa_law_firm').on(t.lawFirmId),
    index('lfa_litigation').on(t.litigationListingId),
  ],
);

// ─── firm_session_handled ─────────────────────────────────────────────────────
// Attorney portal (migration 0019): sparse one-bit "handled" state. A row
// exists ONLY when a firm has marked a case handled. Composite PK on
// (session_id, law_firm_id). law_firm_id FK declared in the SQL migration.

export const firmSessionHandled = pgTable(
  'firm_session_handled',
  {
    sessionId: uuid('session_id')
      .notNull()
      .references(() => adaSessions.id, { onDelete: 'cascade' }),
    lawFirmId: uuid('law_firm_id').notNull(),
    handledByUserId: uuid('handled_by_user_id').references(() => users.id),
    handledAt: timestamp('handled_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.sessionId, t.lawFirmId] }),
    index('fsh_session').on(t.sessionId),
  ],
);

// ─── ada_knowledge_chunks ─────────────────────────────────────────────────────
// pgvector is enabled in migration 0001; the embedding column is typed as
// jsonb for now so Drizzle builds without the pgvector extension locally.
// We swap to vector(1536) via ALTER when RAG turns on (see brief §9).

export const adaKnowledgeChunks = pgTable(
  'ada_knowledge_chunks',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    topic: text('topic').notNull(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    standardRefs: jsonb('standard_refs').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    // embedding: vector(1536) — present in DB, not surfaced in Drizzle until RAG
    source: text('source'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index('ada_knowledge_topic').on(t.topic)],
);

// ─── audit_log ────────────────────────────────────────────────────────────────

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    orgId: uuid('org_id').references(() => organizations.id),
    actorType: text('actor_type').notNull(),
    actorId: text('actor_id'),
    action: text('action').notNull(),
    resourceType: text('resource_type'),
    resourceId: text('resource_id'),
    metadata: jsonb('metadata').$type<AuditMetadata>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('audit_log_org_time').on(t.orgId, t.createdAt),
    index('audit_log_resource').on(t.resourceType, t.resourceId),
  ],
);

// ─── session_quality_checks ───────────────────────────────────────────────────

export const sessionQualityChecks = pgTable('session_quality_checks', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid('session_id')
    .notNull()
    .unique()
    .references(() => adaSessions.id, { onDelete: 'cascade' }),
  passed: boolean('passed').notNull(),
  failures: jsonb('failures').$type<QualityCheckFailure[]>().notNull().default(sql`'[]'::jsonb`),
  warnings: jsonb('warnings').$type<QualityCheckWarning[]>().notNull().default(sql`'[]'::jsonb`),
  checkedAt: timestamp('checked_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── system_settings ──────────────────────────────────────────────────────────
// Singleton row for global admin toggles (data collection on/off, etc.)

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── session_packages ─────────────────────────────────────────────────────────
// Immutable, slug-addressable packages generated at session end. Step 18.
// See migration 0003_session_packages.sql.

export const sessionPackages = pgTable(
  'session_packages',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    slug: text('slug').notNull().unique(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => adaSessions.id, { onDelete: 'cascade' }),
    // Full package JSON — shape defined by src/engine/package/types.ts
    // (SessionPackage). Stored verbatim so rendering is pure data → view.
    payload: jsonb('payload').notNull(),
    classificationTitle: text('classification_title'),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('session_packages_session_id_idx').on(t.sessionId)],
);
