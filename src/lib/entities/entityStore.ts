/**
 * Consumer-write entity store (M5).
 *
 * The four public write surfaces — feedback, waitlist, community votes,
 * analytics — behind one injectable seam, following the same shape as
 * spotStore and apiRateLimitStore: a factory taking a Database with a
 * production default, so handlers stay thin and tests inject a stub
 * rather than reaching for a live connection.
 *
 * Every write here is anonymous and unauthenticated by design. None of
 * them takes a user id, and `is_internal` on analytics is deliberately
 * NOT settable through this interface — it is set only by the M0 history
 * import, where the author was known. A client-settable flag would be
 * trivially spoofable and would corrupt the one number it exists to
 * protect.
 */

import { sql } from 'drizzle-orm';
import { makeDb, type Database } from '../../db/client.js';
import {
  feedback,
  waitlistSignups,
  communityVotes,
  analyticsEvents,
} from '../../db/schema-core.js';

export const COMMUNITY_POLL_ID = 'community_voices';

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return url;
}

export interface FeedbackInput {
  message: string;
  rating?: string | null;
  email?: string | null;
  page?: string | null;
  userAgent?: string | null;
}

export interface WaitlistInput {
  email: string;
  source?: string | null;
  interest?: string | null;
}

export interface VoteInput {
  optionId: string;
  voterKey?: string | null;
}

export interface AnalyticsEventInput {
  eventName: string;
  page?: string | null;
  properties?: Record<string, unknown>;
  sessionId?: string | null;
}

export interface EntityStore {
  recordFeedback(input: FeedbackInput): Promise<void>;
  recordWaitlistSignup(input: WaitlistInput): Promise<void>;
  recordVote(input: VoteInput): Promise<void>;
  tallyVotes(): Promise<Record<string, number>>;
  recordEvent(input: AnalyticsEventInput): Promise<void>;
}

export function makeEntityStore(
  db: Database = makeDb(requireDatabaseUrl()),
): EntityStore {
  return {
    async recordFeedback(input) {
      await db.insert(feedback).values({
        message: input.message,
        rating: input.rating ?? null,
        email: input.email ?? null,
        page: input.page ?? null,
        userAgent: input.userAgent ?? null,
      });
    },

    async recordWaitlistSignup(input) {
      // Re-submitting the same address is a success, not a conflict.
      // Someone clicking the banner twice is one person, and an error
      // would read as "we lost your signup". Idempotent at the unique
      // index rather than in a race-prone read-then-write.
      await db
        .insert(waitlistSignups)
        .values({
          email: input.email,
          source: input.source ?? null,
          interest: input.interest ?? null,
        })
        .onConflictDoNothing();
    },

    async recordVote(input) {
      await db.insert(communityVotes).values({
        optionId: input.optionId,
        pollId: COMMUNITY_POLL_ID,
        voterKey: input.voterKey ?? null,
      });
    },

    async tallyVotes() {
      const rows = await db
        .select({
          optionId: communityVotes.optionId,
          n: sql<number>`count(*)::int`,
        })
        .from(communityVotes)
        .where(sql`${communityVotes.pollId} = ${COMMUNITY_POLL_ID}`)
        .groupBy(communityVotes.optionId);
      return Object.fromEntries(rows.map((r) => [r.optionId, Number(r.n)]));
    },

    async recordEvent(input) {
      await db.insert(analyticsEvents).values({
        eventName: input.eventName,
        page: input.page ?? null,
        properties: input.properties ?? {},
        sessionId: input.sessionId ?? null,
      });
    },
  };
}
