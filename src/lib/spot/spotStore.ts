/**
 * Ada Spot — free-tier data access.
 *
 * A thin store over the shared Drizzle handle (src/db/client.ts) scoped to the
 * spot_read + spot_rate_limit tables. Firewalled: it lives outside src/engine/
 * (so it may import db/client, unlike the engine) and never touches
 * photo_analyses / photo_reviews or the AdaClients interface.
 *
 * The `db` handle is injectable so callers/tests can pass a fixture; the
 * default constructs the production neon-http handle from DATABASE_URL.
 */

import { and, asc, count, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import { makeDb, type Database } from '../../db/client.js';
import { spotReads, spotRateLimits, spotSessions, spotPhotos, spotReports } from '../../db/schema-spot.js';
import type { SpotTier } from './rateLimitDecision.js';
import { canTransition, type SpotSessionStatus } from './spotSessionStatus.js';

export interface SpotReadRow {
  rateLimitKey: string;
  result: unknown;
  photoCount: number;
  modelVersion: string;
  email?: string | null;
}

export interface SpotRateLimitRow {
  rateLimitKey: string;
  ipHash?: string | null;
  outcome: SpotTier;
}

export interface SpotSessionRow {
  id: string;
  status: SpotSessionStatus;
  stripeCheckoutSessionId: string | null;
  buyerEmail: string | null;
  amountCents: number | null;
}

export interface SpotStore {
  countReadsSince(rateLimitKey: string, since: Date): Promise<number>;
  insertRead(row: SpotReadRow): Promise<void>;
  insertRateLimit(row: SpotRateLimitRow): Promise<void>;
  /** Create a pending_payment session; returns its id. */
  createSession(input: { amountCents: number }): Promise<string>;
  getSession(id: string): Promise<SpotSessionRow | null>;
  setCheckoutSessionId(id: string, stripeCheckoutSessionId: string): Promise<void>;
  /**
   * Flip pending_payment → paid. Conditional on the current status, so a
   * replayed webhook is a safe no-op. Returns true iff this call transitioned.
   */
  markPaid(input: {
    spotSessionId: string;
    paymentIntentId?: string;
    email?: string;
    amountCents?: number;
  }): Promise<boolean>;
  /** Record one uploaded paid photo (session-parented; read_id stays null). */
  insertPhoto(input: { sessionId: string; blobKey: string; blobUrl: string }): Promise<void>;
  /** Count live (non-deleted) photos for a session — drives the 10-photo cap. */
  countPhotos(sessionId: string): Promise<number>;
  /** Flip paid → uploaded (conditional; idempotent). Returns true iff transitioned. */
  markUploaded(input: { spotSessionId: string; photoCount: number }): Promise<boolean>;
  /** Oldest session still awaiting report generation (status 'uploaded'). */
  nextUploadedSession(): Promise<{ id: string } | null>;
  /** Live (non-deleted) photo URLs for a session, in insertion order. */
  listSessionPhotos(sessionId: string): Promise<{ blobUrl: string }[]>;
  /** The report for a session, if one exists (idempotency guard). */
  getReportBySession(sessionId: string): Promise<{ slug: string } | null>;
  insertReport(input: {
    sessionId: string;
    slug: string;
    content: unknown;
    modelVersion: string;
  }): Promise<void>;
  /** Flip uploaded → in_review (conditional; idempotent). Returns true iff transitioned. */
  markInReview(sessionId: string): Promise<boolean>;
  /** Recent reports for the admin preview list. */
  listReports(limit: number): Promise<
    Array<{ id: string; sessionId: string; slug: string; modelVersion: string | null; hitlStatus: string; sentAt: Date | null; createdAt: Date }>
  >;
  /** A single report's full content + metadata, by slug. */
  getReportBySlug(slug: string): Promise<
    | { id: string; sessionId: string; slug: string; content: unknown; modelVersion: string | null; hitlStatus: string; createdAt: Date }
    | null
  >;
  /** Public readout: content ONLY if the report is released (else null). */
  getReleasedReportBySlug(slug: string): Promise<{ content: unknown } | null>;
  /** Release a pending report (guarded, idempotent). Returns the session + buyer for delivery, or null. */
  releaseReport(input: { slug: string; reviewedBy: string }): Promise<{ sessionId: string; buyerEmail: string | null } | null>;
  /** Mark a released report's email as sent. */
  markReportSent(slug: string): Promise<void>;
  /** Reject a pending report (guarded). Returns true iff transitioned. */
  rejectReport(input: { slug: string; reviewedBy: string }): Promise<boolean>;
  /** Flip in_review → delivered (conditional; idempotent). */
  markDelivered(sessionId: string): Promise<boolean>;
  /** Live photos past their retention window (delete_after), for the 90-day sweep. */
  photosToSweep(now: Date, limit: number): Promise<Array<{ id: string; blobUrl: string }>>;
  /** Mark a photo's blob deleted (soft-delete the row; keeps metadata). */
  markPhotoDeleted(id: string): Promise<void>;
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set in environment');
  return url;
}

export function makeSpotStore(db: Database = makeDb(requireDatabaseUrl())): SpotStore {
  return {
    async countReadsSince(rateLimitKey, since) {
      const rows = await db
        .select({ n: count() })
        .from(spotReads)
        .where(and(eq(spotReads.rateLimitKey, rateLimitKey), gte(spotReads.createdAt, since)));
      return Number(rows[0]?.n ?? 0);
    },
    async insertRead(row) {
      await db.insert(spotReads).values({
        rateLimitKey: row.rateLimitKey,
        result: row.result,
        photoCount: row.photoCount,
        modelVersion: row.modelVersion,
        email: row.email ?? null,
      });
    },
    async insertRateLimit(row) {
      await db.insert(spotRateLimits).values({
        rateLimitKey: row.rateLimitKey,
        ipHash: row.ipHash ?? null,
        outcome: row.outcome,
      });
    },
    async createSession(input) {
      const rows = await db
        .insert(spotSessions)
        .values({ status: 'pending_payment', amountCents: input.amountCents })
        .returning({ id: spotSessions.id });
      return rows[0].id;
    },
    async getSession(id) {
      const rows = await db
        .select({
          id: spotSessions.id,
          status: spotSessions.status,
          stripeCheckoutSessionId: spotSessions.stripeCheckoutSessionId,
          buyerEmail: spotSessions.buyerEmail,
          amountCents: spotSessions.amountCents,
        })
        .from(spotSessions)
        .where(eq(spotSessions.id, id))
        .limit(1);
      return rows[0] ?? null;
    },
    async setCheckoutSessionId(id, stripeCheckoutSessionId) {
      await db
        .update(spotSessions)
        .set({ stripeCheckoutSessionId, updatedAt: new Date() })
        .where(eq(spotSessions.id, id));
    },
    async markPaid(input) {
      // Guard against illegal transitions at the type level, then let the DB
      // enforce idempotency: the conditional WHERE only matches a still-pending
      // row, so a replayed webhook updates 0 rows and returns false.
      if (!canTransition('pending_payment', 'paid')) return false;
      const rows = await db
        .update(spotSessions)
        .set({
          status: 'paid',
          paidAt: new Date(),
          stripePaymentIntentId: input.paymentIntentId ?? null,
          buyerEmail: input.email ?? null,
          updatedAt: new Date(),
          ...(typeof input.amountCents === 'number' ? { amountCents: input.amountCents } : {}),
        })
        .where(and(eq(spotSessions.id, input.spotSessionId), eq(spotSessions.status, 'pending_payment')))
        .returning({ id: spotSessions.id });
      return rows.length > 0;
    },
    async insertPhoto(input) {
      await db.insert(spotPhotos).values({
        sessionId: input.sessionId,
        blobKey: input.blobKey,
        blobUrl: input.blobUrl,
      });
    },
    async countPhotos(sessionId) {
      const rows = await db
        .select({ n: count() })
        .from(spotPhotos)
        .where(and(eq(spotPhotos.sessionId, sessionId), isNull(spotPhotos.deletedAt)));
      return Number(rows[0]?.n ?? 0);
    },
    async markUploaded(input) {
      if (!canTransition('paid', 'uploaded')) return false;
      const rows = await db
        .update(spotSessions)
        .set({
          status: 'uploaded',
          uploadedAt: new Date(),
          photoCount: input.photoCount,
          updatedAt: new Date(),
        })
        .where(and(eq(spotSessions.id, input.spotSessionId), eq(spotSessions.status, 'paid')))
        .returning({ id: spotSessions.id });
      return rows.length > 0;
    },
    async nextUploadedSession() {
      const rows = await db
        .select({ id: spotSessions.id })
        .from(spotSessions)
        .where(eq(spotSessions.status, 'uploaded'))
        .orderBy(asc(spotSessions.uploadedAt))
        .limit(1);
      return rows[0] ?? null;
    },
    async listSessionPhotos(sessionId) {
      const rows = await db
        .select({ blobUrl: spotPhotos.blobUrl })
        .from(spotPhotos)
        .where(and(eq(spotPhotos.sessionId, sessionId), isNull(spotPhotos.deletedAt)))
        .orderBy(asc(spotPhotos.createdAt));
      return rows
        .filter((r): r is { blobUrl: string } => typeof r.blobUrl === 'string' && r.blobUrl.length > 0);
    },
    async getReportBySession(sessionId) {
      const rows = await db
        .select({ slug: spotReports.slug })
        .from(spotReports)
        .where(eq(spotReports.sessionId, sessionId))
        .limit(1);
      return rows[0] ?? null;
    },
    async insertReport(input) {
      await db.insert(spotReports).values({
        sessionId: input.sessionId,
        slug: input.slug,
        content: input.content,
        modelVersion: input.modelVersion,
      });
    },
    async markInReview(sessionId) {
      if (!canTransition('uploaded', 'in_review')) return false;
      const rows = await db
        .update(spotSessions)
        .set({ status: 'in_review', updatedAt: new Date() })
        .where(and(eq(spotSessions.id, sessionId), eq(spotSessions.status, 'uploaded')))
        .returning({ id: spotSessions.id });
      return rows.length > 0;
    },
    async listReports(limit) {
      return db
        .select({
          id: spotReports.id,
          sessionId: spotReports.sessionId,
          slug: spotReports.slug,
          modelVersion: spotReports.modelVersion,
          hitlStatus: spotReports.hitlStatus,
          sentAt: spotReports.sentAt,
          createdAt: spotReports.createdAt,
        })
        .from(spotReports)
        .orderBy(desc(spotReports.createdAt))
        .limit(limit);
    },
    async getReportBySlug(slug) {
      const rows = await db
        .select({
          id: spotReports.id,
          sessionId: spotReports.sessionId,
          slug: spotReports.slug,
          content: spotReports.content,
          modelVersion: spotReports.modelVersion,
          hitlStatus: spotReports.hitlStatus,
          createdAt: spotReports.createdAt,
        })
        .from(spotReports)
        .where(eq(spotReports.slug, slug))
        .limit(1);
      return rows[0] ?? null;
    },
    async getReleasedReportBySlug(slug) {
      const rows = await db
        .select({ content: spotReports.content })
        .from(spotReports)
        .where(and(eq(spotReports.slug, slug), eq(spotReports.hitlStatus, 'released')))
        .limit(1);
      return rows[0] ?? null;
    },
    async releaseReport(input) {
      // Guarded: only a pending report releases, so a re-release is a no-op
      // (returns null) and never re-sends.
      const released = await db
        .update(spotReports)
        .set({ hitlStatus: 'released', reviewedBy: input.reviewedBy, reviewedAt: new Date() })
        .where(and(eq(spotReports.slug, input.slug), eq(spotReports.hitlStatus, 'pending_review')))
        .returning({ sessionId: spotReports.sessionId });
      const row = released[0];
      if (!row) return null;
      const sess = await db
        .select({ buyerEmail: spotSessions.buyerEmail })
        .from(spotSessions)
        .where(eq(spotSessions.id, row.sessionId))
        .limit(1);
      return { sessionId: row.sessionId, buyerEmail: sess[0]?.buyerEmail ?? null };
    },
    async markReportSent(slug) {
      await db.update(spotReports).set({ sentAt: new Date() }).where(eq(spotReports.slug, slug));
    },
    async rejectReport(input) {
      const rows = await db
        .update(spotReports)
        .set({ hitlStatus: 'rejected', reviewedBy: input.reviewedBy, reviewedAt: new Date() })
        .where(and(eq(spotReports.slug, input.slug), eq(spotReports.hitlStatus, 'pending_review')))
        .returning({ id: spotReports.id });
      return rows.length > 0;
    },
    async markDelivered(sessionId) {
      if (!canTransition('in_review', 'delivered')) return false;
      const rows = await db
        .update(spotSessions)
        .set({ status: 'delivered', updatedAt: new Date() })
        .where(and(eq(spotSessions.id, sessionId), eq(spotSessions.status, 'in_review')))
        .returning({ id: spotSessions.id });
      return rows.length > 0;
    },
    async photosToSweep(now, limit) {
      const rows = await db
        .select({ id: spotPhotos.id, blobUrl: spotPhotos.blobUrl })
        .from(spotPhotos)
        .where(and(lte(spotPhotos.deleteAfter, now), isNull(spotPhotos.deletedAt)))
        .limit(limit);
      return rows.filter((r): r is { id: string; blobUrl: string } => typeof r.blobUrl === 'string' && r.blobUrl.length > 0);
    },
    async markPhotoDeleted(id) {
      await db
        .update(spotPhotos)
        .set({ deletedAt: new Date() })
        .where(and(eq(spotPhotos.id, id), isNull(spotPhotos.deletedAt)));
    },
  };
}
