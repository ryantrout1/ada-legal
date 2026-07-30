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

/**
 * Delete blobs for rows about to be removed.
 *
 * The FK cascade drops spot_photo rows but Blob storage knows nothing about
 * Postgres, and the retention sweep only walks rows — so a row deleted without
 * its blob leaves a file nothing will ever collect.
 *
 * An already-missing blob counts as success, which makes a partial failure
 * safe to retry: the second pass re-deletes what it can and finishes.
 */
async function deleteBlobs(urls: Array<string | null>): Promise<boolean> {
  const { del } = await import('@vercel/blob');
  for (const url of urls) {
    if (!url) continue;
    try {
      await del(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/not found|404/i.test(message)) continue;
      console.error('spotStore: blob delete failed, leaving the row', { url, message });
      return false;
    }
  }
  return true;
}

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
  /** Cardholder name. Admin-facing only — see the note on session-status. */
  buyerName: string | null;
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
    /** Cardholder name from Stripe, when it sent one. */
    name?: string;
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
  /**
   * The review queue's list. Carries the buyer so a reviewer can see whose
   * report they are about to release — and nothing else from the session,
   * because this returns up to 100 rows and the page renders one at a time.
   */
  listReports(limit: number): Promise<
    Array<{ id: string; sessionId: string; slug: string; modelVersion: string | null; hitlStatus: string; sentAt: Date | null; createdAt: Date; buyerName: string | null; buyerEmail: string | null }>
  >;
  /** A single report's full content + metadata, by slug. */
  getReportBySlug(slug: string): Promise<
    | { id: string; sessionId: string; slug: string; content: unknown; modelVersion: string | null; hitlStatus: string; createdAt: Date }
    | null
  >;
  /**
   * Photos for a session, with the retention answer attached.
   *
   * The readout is a permanent artifact pointing at temporary assets:
   * spot_photo.delete_after defaults to 90 days and the sweep deletes the
   * blob then soft-deletes the row, while the release email promises the
   * report stays available. So a reader on day 91 gets a page with no
   * images, and the page has to be able to say WHY.
   *
   * `purged` is true when this session had photos and none survive. That is
   * different from a session that never had any, and the difference is the
   * whole point — silence would read as "there were never any photos".
   */
  sessionPhotoState(sessionId: string): Promise<{ urls: string[]; purged: boolean }>;
  /**
   * Free reads, newest first, for the admin funnel.
   *
   * A free read is a different shape from a paid session — no buyer, no
   * payment, no report, and no stored photo (spot_photo.read_id is null on
   * every row today; the free path is transient by design). What it DOES keep
   * is the analysis itself, which is the point: it is the record of what Spot
   * told someone.
   */
  listFreeReads(limit: number): Promise<
    Array<{
      id: string;
      createdAt: string;
      photoCount: number;
      modelVersion: string | null;
      email: string | null;
      findingCount: number;
      overallRisk: string | null;
    }>
  >;

  /**
   * Hard-delete a free read and its photos.
   *
   * Blobs are NOT cascaded by the FK — dropping the row alone would orphan the
   * files, and the retention sweep only sees rows, so nothing would ever
   * collect them. Blobs go first; if any deletion fails the row is left in
   * place so a retry can finish the job. Re-deleting an already-gone blob is
   * treated as success, which makes that retry safe.
   */
  deleteFreeRead(id: string): Promise<boolean>;

  /** Same contract as deleteFreeRead, for a paid session. Cascades to its
   *  report and photos once the blobs are gone. */
  deletePaidSession(id: string): Promise<boolean>;

  /** Public readout: content ONLY if the report is released (else null). */
  getReleasedReportBySlug(slug: string): Promise<{ content: unknown; sessionId: string } | null>;
  /** Release a pending report (guarded, idempotent). Returns the session + buyer for delivery, or null. */
  releaseReport(input: { slug: string; reviewedBy: string }): Promise<{ sessionId: string; buyerEmail: string | null } | null>;
  /**
   * Write the report for a session, replacing any existing one IN PLACE.
   *
   * spot_report has a unique index on session_id (migration 0039) — at most
   * one report per session, which is what the recovery path relies on when
   * the inline trigger and the cron sweeper race. Regenerate was written
   * before that index and still tried to insert a second row "so both
   * outputs coexist for side-by-side comparison", so every regeneration on a
   * session that already had a report hit the unique violation and 500'd.
   *
   * The existing slug is KEPT on replace. A released report's URL is already
   * in a buyer's inbox; minting a new slug would silently break it. Status is
   * kept too: a released report stays released so the live link keeps
   * working and immediately serves the corrected content, and a pending one
   * stays pending. Whether to re-notify is a separate decision the admin
   * makes with Send again.
   *
   * Returns the slug actually in effect — the existing one on replace, the
   * supplied one on first write.
   */
  upsertReport(input: {
    sessionId: string;
    slug: string;
    content: unknown;
    modelVersion: string;
  }): Promise<string>;
  /** Mark a released report's email as sent. */
  markReportSent(slug: string): Promise<void>;
  /**
   * Look up an ALREADY-RELEASED report so its email can be sent again.
   *
   * releaseReport deliberately matches only `pending_review`, so it is a
   * no-op on a second call and cannot re-send. That is right for the review
   * decision and wrong for delivery: a decision happens once, a send may
   * need to happen twice. This is the delivery-side lookup — no state
   * transition, just the address and whether the mail ever left.
   */
  getReleasedReport(
    slug: string,
  ): Promise<{ sessionId: string; buyerEmail: string | null; sentAt: Date | null } | null>;
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
          buyerName: spotSessions.buyerName,
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
          buyerName: input.name ?? null,
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
    async sessionPhotoState(sessionId) {
      const rows = await db
        .select({ blobUrl: spotPhotos.blobUrl, deletedAt: spotPhotos.deletedAt })
        .from(spotPhotos)
        .where(eq(spotPhotos.sessionId, sessionId))
        .orderBy(asc(spotPhotos.createdAt));
      const urls = rows
        .filter((r) => r.deletedAt === null && typeof r.blobUrl === 'string' && r.blobUrl.length > 0)
        .map((r) => r.blobUrl as string);
      return { urls, purged: urls.length === 0 && rows.length > 0 };
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
    async upsertReport(input) {
      const rows = await db
        .insert(spotReports)
        .values({
          sessionId: input.sessionId,
          slug: input.slug,
          content: input.content,
          modelVersion: input.modelVersion,
        })
        .onConflictDoUpdate({
          target: spotReports.sessionId,
          // slug and hitl_status are deliberately absent: the URL stays
          // valid and the review decision is not silently undone.
          set: {
            content: input.content,
            modelVersion: input.modelVersion,
            updatedAt: new Date(),
          },
        })
        .returning({ slug: spotReports.slug });
      return rows[0]?.slug ?? input.slug;
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
          buyerName: spotSessions.buyerName,
          buyerEmail: spotSessions.buyerEmail,
        })
        .from(spotReports)
        // leftJoin, not join: a report whose session row is missing should
        // list without a buyer, not vanish from the queue. A report nobody
        // can see is worse than one nobody can attribute.
        .leftJoin(spotSessions, eq(spotReports.sessionId, spotSessions.id))
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
    async listFreeReads(limit) {
      const rows = await db
        .select({
          id: spotReads.id,
          createdAt: spotReads.createdAt,
          photoCount: spotReads.photoCount,
          modelVersion: spotReads.modelVersion,
          email: spotReads.email,
          result: spotReads.result,
        })
        .from(spotReads)
        .orderBy(desc(spotReads.createdAt))
        .limit(limit);

      return rows.map((r) => {
        const result = (r.result ?? {}) as {
          findings?: unknown[];
          overall_risk?: unknown;
        };
        return {
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          photoCount: r.photoCount ?? 0,
          modelVersion: r.modelVersion ?? null,
          email: r.email ?? null,
          findingCount: Array.isArray(result.findings) ? result.findings.length : 0,
          overallRisk:
            typeof result.overall_risk === 'string' ? result.overall_risk : null,
        };
      });
    },

    async deleteFreeRead(id) {
      const photos = await db
        .select({ blobUrl: spotPhotos.blobUrl })
        .from(spotPhotos)
        .where(eq(spotPhotos.readId, id));
      if (!(await deleteBlobs(photos.map((p) => p.blobUrl)))) return false;
      const gone = await db.delete(spotReads).where(eq(spotReads.id, id)).returning({ id: spotReads.id });
      return gone.length > 0;
    },

    async deletePaidSession(id) {
      const photos = await db
        .select({ blobUrl: spotPhotos.blobUrl })
        .from(spotPhotos)
        .where(eq(spotPhotos.sessionId, id));
      if (!(await deleteBlobs(photos.map((p) => p.blobUrl)))) return false;
      const gone = await db
        .delete(spotSessions)
        .where(eq(spotSessions.id, id))
        .returning({ id: spotSessions.id });
      return gone.length > 0;
    },

    async getReleasedReportBySlug(slug) {
      const rows = await db
        // sessionId so the caller can join photos at READ time. Baking blob
        // URLs into the stored content at compose time would leave dead
        // links in a permanent artifact once the 90-day sweep runs.
        .select({ content: spotReports.content, sessionId: spotReports.sessionId })
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
    async getReleasedReport(slug) {
      const rows = await db
        .select({ sessionId: spotReports.sessionId, sentAt: spotReports.sentAt })
        .from(spotReports)
        .where(and(eq(spotReports.slug, slug), eq(spotReports.hitlStatus, 'released')))
        .limit(1);
      const row = rows[0];
      if (!row) return null;
      const sess = await db
        .select({ buyerEmail: spotSessions.buyerEmail })
        .from(spotSessions)
        .where(eq(spotSessions.id, row.sessionId))
        .limit(1);
      return {
        sessionId: row.sessionId,
        buyerEmail: sess[0]?.buyerEmail ?? null,
        sentAt: row.sentAt ?? null,
      };
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
