/**
 * Ch1-shaped tables.
 *
 * These are created as empty tables in the Ch0 migration so Ch1 can populate
 * them without schema changes later. Ch0 code must not write to these. See
 * docs/DO_NOT_TOUCH.md rule 10.
 */

import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { organizations } from './schema-core';
import type {
  EligibilityCriterion,
  FieldSpec,
  RoutingJurisdiction,
} from '@/types/db';

// ─── law_firms ────────────────────────────────────────────────────────────────

export const lawFirms = pgTable('law_firms', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id),
  name: text('name').notNull(),
  primaryContact: text('primary_contact'),
  email: text('email'),
  phone: text('phone'),
  stripeCustomerId: text('stripe_customer_id'),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── listings ─────────────────────────────────────────────────────────────────

export const listings = pgTable('listings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  lawFirmId: uuid('law_firm_id')
    .notNull()
    .references(() => lawFirms.id),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull(),
  shortDescription: text('short_description'),
  fullDescription: text('full_description'),
  eligibilitySummary: text('eligibility_summary'),
  status: text('status').notNull().default('draft'),
  tier: text('tier').notNull().default('basic'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── listing_configs ──────────────────────────────────────────────────────────

export const listingConfigs = pgTable('listing_configs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  listingId: uuid('listing_id')
    .notNull()
    .unique()
    .references(() => listings.id, { onDelete: 'cascade' }),
  caseDescription: text('case_description').notNull(),
  eligibilityCriteria: jsonb('eligibility_criteria')
    .$type<EligibilityCriterion[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  requiredFields: jsonb('required_fields').$type<FieldSpec[]>().notNull().default(sql`'[]'::jsonb`),
  disqualifyingConditions: jsonb('disqualifying_conditions')
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  adaPromptOverride: text('ada_prompt_override'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── routing_rules ────────────────────────────────────────────────────────────

export const routingRules = pgTable(
  'routing_rules',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    targetOrgId: uuid('target_org_id')
      .notNull()
      .references(() => organizations.id),
    complaintTypes: jsonb('complaint_types').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    jurisdictions: jsonb('jurisdictions')
      .$type<RoutingJurisdiction[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    active: boolean('active').notNull().default(true),
    priority: integer('priority').notNull().default(100),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index('routing_rules_active').on(t.active, t.priority).where(sql`${t.active} = true`)],
);

// ─── subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  lawFirmId: uuid('law_firm_id')
    .notNull()
    .references(() => lawFirms.id),
  listingId: uuid('listing_id').references(() => listings.id),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  tier: text('tier').notNull(),
  status: text('status').notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ─── stripe_webhook_events ────────────────────────────────────────────────────

export const stripeWebhookEvents = pgTable('stripe_webhook_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  stripeEventId: text('stripe_event_id').notNull().unique(),
  type: text('type').notNull(),
  payload: jsonb('payload').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
