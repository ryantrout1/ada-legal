/**
 * Tests for getAdminAnalytics's Phase 5 additions.
 *
 * Phase 5a extends AdminAnalyticsResult with a top-level intakesTotal
 * count (class_action_intake sessions, lifetime, scoped by include_test
 * the same way every other counter in this result is). Powers the
 * AdminDashboard tile without a separate endpoint.
 *
 * Tests target the in-memory client. The Neon client mirrors the same
 * shape; typecheck enforces the contract at the interface level.
 *
 * Ref: /plan Phase 5a
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { AdaSessionState } from '@/engine/types';

const ORG = '00000000-0000-4000-8000-000000000001';

function session(
  sessionId: string,
  overrides: Partial<AdaSessionState> = {},
): AdaSessionState {
  return {
    sessionId,
    orgId: ORG,
    sessionType: 'public_ada',
    status: 'completed',
    readingLevel: 'standard',
    anonSessionId: '00000000-0000-4000-8000-00000000cccc',
    userId: null,
    listingId: null,
    conversationHistory: [],
    extractedFields: {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: false,
    ...overrides,
  };
}

describe('getAdminAnalytics — intakesTotal (Phase 5a)', () => {
  it('counts only class_action_intake sessions, ignoring public_ada', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeSession({
      state: session('00000000-0000-4000-8000-00000000e001', {
        sessionType: 'public_ada',
      }),
    });
    await clients.db.writeSession({
      state: session('00000000-0000-4000-8000-00000000e002', {
        sessionType: 'class_action_intake',
        listingId: '00000000-0000-4000-8000-00000000e003',
      }),
    });
    await clients.db.writeSession({
      state: session('00000000-0000-4000-8000-00000000e004', {
        sessionType: 'class_action_intake',
        listingId: '00000000-0000-4000-8000-00000000e005',
      }),
    });

    const result = await clients.db.getAdminAnalytics();
    expect(result.intakesTotal).toBe(2);
  });

  it('excludes is_test sessions by default (matches the rest of the result shape)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeSession({
      state: session('00000000-0000-4000-8000-00000000e101', {
        sessionType: 'class_action_intake',
        listingId: '00000000-0000-4000-8000-00000000e102',
        isTest: false,
      }),
    });
    await clients.db.writeSession({
      state: session('00000000-0000-4000-8000-00000000e103', {
        sessionType: 'class_action_intake',
        listingId: '00000000-0000-4000-8000-00000000e104',
        isTest: true,
      }),
    });

    const defaultRun = await clients.db.getAdminAnalytics();
    expect(defaultRun.intakesTotal).toBe(1);

    const withTest = await clients.db.getAdminAnalytics({ includeTest: true });
    expect(withTest.intakesTotal).toBe(2);
  });

  it('returns 0 when no intakes exist (clean empty-state for fresh deploys)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeSession({
      state: session('00000000-0000-4000-8000-00000000e201'),
    });
    const result = await clients.db.getAdminAnalytics();
    expect(result.intakesTotal).toBe(0);
  });

  it('counts intakes regardless of status (active / completed / abandoned all count)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeSession({
      state: session('00000000-0000-4000-8000-00000000e301', {
        sessionType: 'class_action_intake',
        listingId: '00000000-0000-4000-8000-00000000e302',
        status: 'active',
      }),
    });
    await clients.db.writeSession({
      state: session('00000000-0000-4000-8000-00000000e303', {
        sessionType: 'class_action_intake',
        listingId: '00000000-0000-4000-8000-00000000e304',
        status: 'completed',
      }),
    });
    await clients.db.writeSession({
      state: session('00000000-0000-4000-8000-00000000e305', {
        sessionType: 'class_action_intake',
        listingId: '00000000-0000-4000-8000-00000000e306',
        status: 'abandoned',
      }),
    });

    const result = await clients.db.getAdminAnalytics();
    expect(result.intakesTotal).toBe(3);
  });
});
