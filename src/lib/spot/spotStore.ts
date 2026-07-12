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

import { and, count, eq, gte } from 'drizzle-orm';
import { makeDb, type Database } from '../../db/client.js';
import { spotReads, spotRateLimits } from '../../db/schema-spot.js';
import type { SpotTier } from './rateLimitDecision.js';

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

export interface SpotStore {
  countReadsSince(rateLimitKey: string, since: Date): Promise<number>;
  insertRead(row: SpotReadRow): Promise<void>;
  insertRateLimit(row: SpotRateLimitRow): Promise<void>;
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
  };
}
