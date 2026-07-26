/**
 * Regression guards for the PUT /api/admin/litigation/[id]/firms 500 that
 * deleted Niles' only firm assignment and wrote nothing back.
 *
 * Two independent defects, both pinned here:
 *
 *   1. assigned_by_user_id is uuid REFERENCES users(id), but requireAdmin
 *      hands back a CLERK id (`user_…`). The B44 bridge — this endpoint's
 *      only caller for fourteen months — always passed null, so the
 *      mismatch stayed latent until the Vercel admin UI called it with a
 *      real session.
 *
 *   2. The replace was a bare delete-then-insert. When the insert threw,
 *      the delete had already committed, so a FAILED save destroyed the
 *      existing assignments. It is one data-modifying CTE now.
 *
 * Atomicity itself is a Postgres property and is not unit-testable against
 * the in-memory client; it is covered by the EXPLAIN in /fixit and the
 * runtime verification recipe. What IS testable — and what nearly shipped
 * broken a second time — is the raw-row mapping the CTE forced: execute()
 * bypasses drizzle's column mapping, so keys arrive snake_case and
 * timestamps as strings rather than the camelCase/Date shape the drizzle
 * mapper takes. The first draft cast instead of mapping, which compiled
 * cleanly and would have returned a row of undefineds.
 *
 * Ref: /triage 'PUT /firms 500' → /fixit.
 */

import { describe, expect, it } from 'vitest';

import { fromRawFirmAssignmentRow } from '../../src/engine/clients/neonDbClient.js';
import { InMemoryDbClient } from '../../src/engine/clients/inMemoryClients.js';

describe('fromRawFirmAssignmentRow', () => {
  const raw = {
    id: 'e30a118a-c878-412d-a1bf-3ce18b18e6e1',
    litigation_listing_id: '3bb10e4e-8654-45e7-ba1f-cea12e9cecfc',
    law_firm_id: '3f10aa3b-3633-45dc-97a1-216cc719dfff',
    assigned_by_user_id: null,
    receives_matches: true,
    opted_in_at: '2026-07-26T18:04:00.074Z',
    created_at: '2026-05-21T03:17:02.539Z',
  };

  it('maps snake_case keys onto the camelCase contract', () => {
    const out = fromRawFirmAssignmentRow(raw);
    expect(out.litigationListingId).toBe(raw.litigation_listing_id);
    expect(out.lawFirmId).toBe(raw.law_firm_id);
    expect(out.receivesMatches).toBe(true);
  });

  it('never returns undefined for a populated column', () => {
    // The exact failure a cast would have produced.
    const out = fromRawFirmAssignmentRow(raw);
    for (const [key, value] of Object.entries(out)) {
      if (key === 'assignedByUserId') continue; // legitimately null here
      expect(value, `${key} was undefined`).toBeDefined();
    }
  });

  it('normalizes string timestamps to ISO without throwing', () => {
    // neon-http returns strings; `.toISOString()` on a string throws.
    const out = fromRawFirmAssignmentRow(raw);
    expect(out.createdAt).toBe('2026-05-21T03:17:02.539Z');
    expect(out.optedInAt).toBe('2026-07-26T18:04:00.074Z');
  });

  it('accepts Date timestamps from non-http drivers', () => {
    const out = fromRawFirmAssignmentRow({
      ...raw,
      opted_in_at: new Date('2026-07-26T18:04:00.074Z'),
      created_at: new Date('2026-05-21T03:17:02.539Z'),
    });
    expect(out.createdAt).toBe('2026-05-21T03:17:02.539Z');
    expect(out.optedInAt).toBe('2026-07-26T18:04:00.074Z');
  });

  it('carries a null opt-in through as null, not epoch', () => {
    const out = fromRawFirmAssignmentRow({
      ...raw,
      receives_matches: false,
      opted_in_at: null,
    });
    expect(out.optedInAt).toBeNull();
    expect(out.receivesMatches).toBe(false);
  });
});

describe('resolveUserIdByClerkUserId', () => {
  it('resolves a Clerk id to the internal users.id uuid', async () => {
    const db = new InMemoryDbClient();
    db.users.set('user_3Ch66BRAi667x6XndV3sKjRMMRr', {
      userId: 'a8ac00dd-0000-4000-8000-000000000001',
      email: 'ryan@adalegallink.com',
      displayName: 'Ryan Trout',
    });
    await expect(
      db.resolveUserIdByClerkUserId('user_3Ch66BRAi667x6XndV3sKjRMMRr'),
    ).resolves.toBe('a8ac00dd-0000-4000-8000-000000000001');
  });

  it('returns null for an unpaired Clerk id rather than echoing it back', async () => {
    // Echoing the Clerk id back is the original bug: it reaches a uuid
    // column and Postgres raises 22P02 mid-write.
    const db = new InMemoryDbClient();
    await expect(db.resolveUserIdByClerkUserId('user_unpaired')).resolves.toBeNull();
  });
});
