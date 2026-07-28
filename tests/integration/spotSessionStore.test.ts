/**
 * Integration test — spotStore session lifecycle against the live DB.
 *
 * Verifies the idempotency contract that guards paid-state: create a pending
 * session, mark it paid once (true), replay the same webhook (false — no-op),
 * and confirm the row is paid. Self-cleaning (deletes its own row by id).
 *
 * DOES NOT RUN under `npm run test`. Nothing in this repo sets DATABASE_URL
 * for a test run — there is no CI, and vitest loads no env file — so this
 * skipped on every run from the day it was written until 2026-07-28. Run it
 * with `npm run test:live`. It writes, so it also needs
 * SPOT_TEST_ALLOW_WRITES=1 and a Neon branch — not main.
 *
 * Ref: /plan Phase 2a (Ada Spot payment).
 */

import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { makeDb } from '@/db/client';
import { spotSessions } from '@/db/schema-spot';
import { makeSpotStore } from '@/lib/spot/spotStore';

const DATABASE_URL = process.env.DATABASE_URL;
// This file writes. Requiring a second variable means an exported
// DATABASE_URL alone cannot reach it — `npm run test` stays read-only.
const ALLOW_WRITES = process.env.SPOT_TEST_ALLOW_WRITES === '1';

describe.skipIf(!DATABASE_URL || !ALLOW_WRITES)('spotStore sessions — live DB', () => {
  it('createSession -> markPaid is idempotent (a replayed webhook is a no-op)', async () => {
    const db = makeDb(DATABASE_URL!);
    const store = makeSpotStore(db);
    const id = await store.createSession({ amountCents: 7900 });
    try {
      const first = await store.markPaid({
        spotSessionId: id,
        paymentIntentId: 'pi_test',
        email: 'owner@shop.example',
        amountCents: 7900,
      });
      expect(first).toBe(true);

      const replay = await store.markPaid({ spotSessionId: id, paymentIntentId: 'pi_test' });
      expect(replay).toBe(false); // already paid → conditional UPDATE matches 0 rows

      const session = await store.getSession(id);
      expect(session?.status).toBe('paid');
      expect(session?.buyerEmail).toBe('owner@shop.example');
    } finally {
      await db.delete(spotSessions).where(eq(spotSessions.id, id));
    }
  });
});
