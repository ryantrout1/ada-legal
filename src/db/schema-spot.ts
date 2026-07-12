/**
 * Ada Spot tables (migration 0036). Business-facing accessibility *screening*
 * product — firewalled by design from the photo-analyzer test bench: nothing
 * here references photo_analyses / photo_reviews.
 *
 * Conventions match schema-core: uuid ids via gen_random_uuid(), timestamptz
 * everywhere, created_at/updated_at defaulted for direct inserts. These tables
 * are intentionally NOT org-scoped — Ada Spot is public/anonymous and throttled
 * by rate-limit identity, not by Clerk/org membership.
 */

import { pgTable, uuid, text, integer, timestamp, jsonb, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type { SpotSessionStatus } from '@/lib/spot/spotSessionStatus';

type SpotHitlStatus = 'pending_review' | 'released' | 'rejected';
type SpotRateLimitOutcome = 'allowed' | 'soft_gated' | 'blocked';

// ─── spot_session — the paid-report spine (Stripe → upload → report) ─────────
export const spotSessions = pgTable(
  'spot_session',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    status: text('status').$type<SpotSessionStatus>().notNull().default('pending_payment'),
    stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    buyerEmail: text('buyer_email'),
    buyerName: text('buyer_name'),
    amountCents: integer('amount_cents'),
    photoCount: integer('photo_count'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('spot_session_status').on(t.status),
    index('spot_session_buyer_email').on(t.buyerEmail),
  ],
);

// ─── spot_read — free-tier reads (2 photos): scoped result + soft email gate ─
export const spotReads = pgTable(
  'spot_read',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    rateLimitKey: text('rate_limit_key').notNull(),
    result: jsonb('result').$type<unknown>(),
    photoCount: integer('photo_count').notNull().default(0),
    modelVersion: text('model_version'),
    email: text('email'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('spot_read_rate_limit').on(t.rateLimitKey, t.createdAt)],
);

// ─── spot_report — delivered artifact (hosted readout), retained post-purge ──
export const spotReports = pgTable(
  'spot_report',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => spotSessions.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    content: jsonb('content').$type<unknown>(),
    modelVersion: text('model_version'),
    hitlStatus: text('hitl_status').$type<SpotHitlStatus>().notNull().default('pending_review'),
    reviewedBy: text('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('spot_report_session').on(t.sessionId),
    index('spot_report_hitl_status').on(t.hitlStatus),
  ],
);

// ─── spot_photo — retention-tracked uploads (free + paid), one parent each ───
export const spotPhotos = pgTable(
  'spot_photo',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sessionId: uuid('session_id').references(() => spotSessions.id, { onDelete: 'cascade' }),
    readId: uuid('read_id').references(() => spotReads.id, { onDelete: 'cascade' }),
    blobKey: text('blob_key').notNull(),
    blobUrl: text('blob_url'),
    deleteAfter: timestamp('delete_after', { withTimezone: true })
      .notNull()
      .default(sql`now() + interval '90 days'`),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('spot_photo_one_parent', sql`(session_id IS NOT NULL) <> (read_id IS NOT NULL)`),
    index('spot_photo_sweep').on(t.deleteAfter).where(sql`deleted_at IS NULL`),
    index('spot_photo_session').on(t.sessionId),
    index('spot_photo_read').on(t.readId),
  ],
);

// ─── spot_rate_limit — free-tier throttle accounting (row per attempt) ───────
export const spotRateLimits = pgTable(
  'spot_rate_limit',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    rateLimitKey: text('rate_limit_key').notNull(),
    ipHash: text('ip_hash'),
    outcome: text('outcome').$type<SpotRateLimitOutcome>().notNull().default('allowed'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('spot_rate_limit_key').on(t.rateLimitKey, t.createdAt)],
);
