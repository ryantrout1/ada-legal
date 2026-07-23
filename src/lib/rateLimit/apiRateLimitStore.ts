/**
 * Postgres store for the public API rate limiter.
 *
 * Kept separate from the decision logic so the rules stay pure and
 * testable, and so an endpoint can inject a different store (or a stub)
 * without a database.
 *
 * The hot path is one counting query against `api_rate_limit_lookup`
 * (bucket, rate_limit_key, created_at) — an index range scan over a single
 * key's recent rows — plus one insert. Both are cheap enough at this
 * volume that reaching for Redis or Edge Config would be adding a failure
 * mode to save nothing.
 */

import { and, count, eq, gte, lt } from 'drizzle-orm';
import { makeDb, type Database } from '../../db/client.js';
import { apiRateLimits } from '../../db/schema-core.js';
import type { RateLimitStore } from './apiRateLimit.js';

function requireDatabaseUrlOrThrow(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return url;
}

export function makeApiRateLimitStore(
  db: Database = makeDb(requireDatabaseUrlOrThrow()),
): RateLimitStore {
  return {
    async countSince(bucket, key, since) {
      const rows = await db
        .select({ n: count() })
        .from(apiRateLimits)
        .where(
          and(
            eq(apiRateLimits.bucket, bucket),
            eq(apiRateLimits.rateLimitKey, key),
            gte(apiRateLimits.createdAt, since),
          ),
        );
      return Number(rows[0]?.n ?? 0);
    },

    async record(row) {
      await db.insert(apiRateLimits).values({
        bucket: row.bucket,
        rateLimitKey: row.key,
        ipHash: row.ipHash ?? null,
      });
    },

    async prune(before) {
      const deleted = await db
        .delete(apiRateLimits)
        .where(lt(apiRateLimits.createdAt, before))
        .returning({ id: apiRateLimits.id });
      return deleted.length;
    },
  };
}
