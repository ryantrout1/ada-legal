/**
 * Integration test — Ada Spot paid photo lifecycle against the live DB.
 *
 * create -> pay -> insert 2 photos -> count -> finish(uploaded), then verify
 * markUploaded idempotency. Self-cleaning (deletes its photos + session).
 * DOES NOT RUN under `npm run test`. Nothing in this repo sets DATABASE_URL
 * for a test run — there is no CI, and vitest loads no env file — so this
 * skipped on every run from the day it was written until 2026-07-28. Run it
 * with `npm run test:live`. It writes, so it also needs
 * SPOT_TEST_ALLOW_WRITES=1 and a Neon branch — not main.
 *
 * Ref: /plan Phase 2b (Ada Spot upload).
 */

import { describe, it, expect } from 'vitest';
import { eq } from 'drizzle-orm';
import { makeDb } from '@/db/client';
import { spotSessions, spotPhotos } from '@/db/schema-spot';
import { makeSpotStore } from '@/lib/spot/spotStore';

const DATABASE_URL = process.env.DATABASE_URL;
// This file writes. Requiring a second variable means an exported
// DATABASE_URL alone cannot reach it — `npm run test` stays read-only.
const ALLOW_WRITES = process.env.SPOT_TEST_ALLOW_WRITES === '1';

describe.skipIf(!DATABASE_URL || !ALLOW_WRITES)('spotStore photo lifecycle — live DB', () => {
  it('pay -> insert photos -> count -> markUploaded (idempotent)', async () => {
    const db = makeDb(DATABASE_URL!);
    const store = makeSpotStore(db);
    const id = await store.createSession({ amountCents: 7900 });
    try {
      await store.markPaid({ spotSessionId: id, amountCents: 7900 });

      await store.insertPhoto({ sessionId: id, blobKey: 'spot/a.jpg', blobUrl: 'https://blob/a.jpg' });
      await store.insertPhoto({ sessionId: id, blobKey: 'spot/b.jpg', blobUrl: 'https://blob/b.jpg' });
      expect(await store.countPhotos(id)).toBe(2);

      const first = await store.markUploaded({ spotSessionId: id, photoCount: 2 });
      expect(first).toBe(true);
      const replay = await store.markUploaded({ spotSessionId: id, photoCount: 2 });
      expect(replay).toBe(false); // already uploaded → no-op

      const session = await store.getSession(id);
      expect(session?.status).toBe('uploaded');
    } finally {
      await db.delete(spotPhotos).where(eq(spotPhotos.sessionId, id));
      await db.delete(spotSessions).where(eq(spotSessions.id, id));
    }
  });
});
