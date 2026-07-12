/**
 * Integration test — spotStore wired to the live spot_read schema.
 *
 * Read-only: asserts countReadsSince compiles + runs against the real table
 * and returns 0 for a fresh random key (proving the Drizzle handle + schema-spot
 * mapping are correct end-to-end). The insert path is exercised by runtime
 * verification (the preview curl inserts a real spot_read; confirmed via a Neon
 * information_schema/row check during /shipit) rather than writing test rows to
 * the shared database here.
 *
 * Gated on DATABASE_URL — skips locally/CI without a live connection.
 *
 * Ref: /plan Phase 1a (Ada Spot free-read backend).
 */

import { describe, it, expect } from 'vitest';
import { makeDb } from '@/db/client';
import { makeSpotStore } from '@/lib/spot/spotStore';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('spotStore — live schema wiring', () => {
  it('countReadsSince returns 0 for a fresh key (query + schema mapping valid)', async () => {
    const store = makeSpotStore(makeDb(DATABASE_URL!));
    const freshKey = `__test_never_written__${crypto.randomUUID()}`;
    const n = await store.countReadsSince(freshKey, new Date(0));
    expect(n).toBe(0);
  });
});
