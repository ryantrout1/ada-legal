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

import { and, count, eq, gte, isNull } from 'drizzle-orm';
import { makeDb, type Database } from '../../db/client.js';
import { spotReads, spotRateLimits, spotSessions, spotPhotos } from '../../db/schema-spot.js';
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
  };
}
