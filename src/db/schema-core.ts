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
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  check,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type {
  Message,
  ExtractedFields,
  Classification,
  SessionMetadata,
  AccessibilitySnapshot,
  PhotoFinding,
  QualityCheckFailure,
  QualityCheckWarning,
  AuditMetadata,
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
    modelVersion: text('model_version').notNull(),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('photo_analyses_session').on(t.sessionId)],
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
    email: text('email'),
    phone: text('phone'),
    websiteUrl: text('website_url'),
    bio: text('bio'),
    photoUrl: text('photo_url'),
    status: text('status').notNull().default('pending'),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index('attorneys_status_state').on(t.status, t.locationState)],
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
