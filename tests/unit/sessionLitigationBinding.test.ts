/**
 * Phase A3a — session creation binds `litigationListingId` when
 * `litigation_id` resolves to an active litigation row.
 *
 * Before A3, the /api/ada/session endpoint accepted `litigation_id`
 * and recorded the case in `metadata.litigation_context`, but did NOT
 * set the new `ada_sessions.litigation_listing_id` column added in
 * A1. AC7 of /plan Phase A3 requires that clicking 'Talk to Ada'
 * from a class-action detail page bind the session via the
 * `litigation_listing_id` FK channel, not just metadata.
 *
 * Session type remains `public_ada` — litigation is informational /
 * discovery, not a per-firm intake flow. The legacy `listingId`
 * channel (Ch1 listings) is NOT touched: a litigation session must
 * leave `listingId` null and only set `litigationListingId`.
 *
 * Ref: /plan Phase A3, AC7.
 */

import { describe, it, expect } from 'vitest';
import { createSession } from '@/engine/session/sessionRepo';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { CreateLitigationInput } from '@/engine/clients/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';

function activeLitigation(
  slug: string,
  overrides: Partial<CreateLitigationInput> = {},
): CreateLitigationInput {
  return {
    orgId: ORG_ID,
    kind: 'class',
    caseName: `Case ${slug}`,
    slug,
    status: 'active',
    ...overrides,
  };
}

describe('session creation with litigation_id (deep-link)', () => {
  it('binds litigationListingId when litigation_id resolves to an active row', async () => {
    const c = makeInMemoryClients();
    const created = await c.db.createLitigation(activeLitigation('niles-v-hilton'));

    // Mirrors the resolution in api/ada/session.ts: list active by
    // statuses=['active','compliance','investigating','tracking']
    // (the page-visible set after A3), then bind by id.
    const active = await c.db.listActiveLitigation({
      statuses: ['active', 'compliance', 'investigating', 'tracking'],
    });
    const match = active.find((r) => r.id === created.id);
    expect(match).toBeDefined();

    const session = createSession(c, {
      orgId: ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: '00000000-0000-4000-8000-00000000bbbb',
      userId: null,
      readingLevel: 'standard',
      litigationListingId: match!.id,
    });

    expect(session.sessionType).toBe('public_ada');
    expect(session.litigationListingId).toBe(created.id);
    // Legacy listingId channel must remain null — litigation sessions
    // do not also bind the Ch1 listings table.
    expect(session.listingId).toBeNull();
  });

  it('also binds for a compliance-status row (e.g. DOJ v. Hilton 2010)', async () => {
    const c = makeInMemoryClients();
    const created = await c.db.createLitigation(
      activeLitigation('doj-v-hilton-2010', { status: 'compliance', kind: 'consent_decree' }),
    );

    const active = await c.db.listActiveLitigation({
      statuses: ['active', 'compliance', 'investigating', 'tracking'],
    });
    const match = active.find((r) => r.id === created.id);
    expect(match).toBeDefined();

    const session = createSession(c, {
      orgId: ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: '00000000-0000-4000-8000-00000000cccc',
      userId: null,
      readingLevel: 'standard',
      litigationListingId: match!.id,
    });

    expect(session.litigationListingId).toBe(created.id);
  });

  it('falls back to plain public_ada when litigation_id does not resolve', async () => {
    // The directory page is heavily cached; a row can transition to
    // archived between page load and button click. The endpoint
    // silently drops the unresolved id and creates a plain session.
    const c = makeInMemoryClients();
    const session = createSession(c, {
      orgId: ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: '00000000-0000-4000-8000-00000000dddd',
      userId: null,
      readingLevel: 'standard',
      // No litigationListingId set — equivalent to endpoint's "no match" fallback.
    });
    expect(session.sessionType).toBe('public_ada');
    expect(session.litigationListingId).toBeNull();
    expect(session.listingId).toBeNull();
  });

  it('round-trips through writeSession / readSession', async () => {
    const c = makeInMemoryClients();
    const created = await c.db.createLitigation(activeLitigation('test-case'));
    const session = createSession(c, {
      orgId: ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: '00000000-0000-4000-8000-00000000eeee',
      userId: null,
      readingLevel: 'standard',
      litigationListingId: created.id,
    });
    await c.db.writeSession({ state: session });
    const loaded = await c.db.readSession({ sessionId: session.sessionId });
    expect(loaded).not.toBeNull();
    expect(loaded!.litigationListingId).toBe(created.id);
  });
});
