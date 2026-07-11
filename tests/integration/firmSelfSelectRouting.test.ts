/**
 * Integration — firm self-select drives routing.
 *
 * Proves the product behavior: a firm opting into a litigation (via the same
 * addFirmAssignment the portal toggle calls) is what makes a matched intake
 * route to that firm. And the safety valve — two firms on the same litigation
 * with no lead counsel fall to sourcing rather than the router guessing.
 *
 * This is the end-to-end claim behind the self-select screen.
 */

import { describe, it, expect } from 'vitest';
import {
  InMemoryDbClient,
  InMemoryClock,
  InMemoryAuditClient,
} from '@/engine/clients/inMemoryClients';
import { createCaseForSession } from '@/engine/routing/createCaseForSession';
import type { AdaSessionState } from '@/engine/types';

const LIT = 'lit-selfselect';

function clients() {
  return {
    db: new InMemoryDbClient(),
    clock: new InMemoryClock(),
    audit: new InMemoryAuditClient(),
  };
}

function matchedState(sessionId: string): AdaSessionState {
  return {
    sessionId,
    orgId: 'org-1',
    sessionType: 'public_ada',
    status: 'completed',
    litigationListingId: LIT,
    extractedFields: {},
    classification: { title: 'III', tier: 'high', reasoning: 'r', standard: '§201' },
  } as unknown as AdaSessionState;
}

describe('firm self-select → routing', () => {
  it('a single firm opting in (eligible) → that matched intake routes to the firm', async () => {
    const c = clients();
    c.db.lawFirms.push({
      id: 'firm-solo',
      name: 'Solo',
      status: 'active',
      isPilot: true,
      stripeCustomerId: null,
    } as unknown as import('@/engine/clients/types').LawFirmRow);
    await c.db.addFirmAssignment({
      litigationListingId: LIT,
      lawFirmId: 'firm-solo',
      receivesMatches: true,
    });

    const row = await createCaseForSession(c, matchedState('sess-solo'));
    expect(row!.lane).toBe('routed_firm');
    expect(row!.firmId).toBe('firm-solo');
  });

  it('a firm assigned but NOT opted in → matched_self_referral (contact info only)', async () => {
    const c = clients();
    c.db.lawFirms.push({
      id: 'firm-solo',
      name: 'Solo',
      status: 'active',
      isPilot: true,
      stripeCustomerId: null,
    } as unknown as import('@/engine/clients/types').LawFirmRow);
    await c.db.addFirmAssignment({ litigationListingId: LIT, lawFirmId: 'firm-solo' });

    const row = await createCaseForSession(c, matchedState('sess-noopt'));
    expect(row!.lane).toBe('matched_self_referral');
    expect(row!.firmId).toBeNull();
  });

  it('two firms opting in with no lead → sourcing (safety valve, no guess)', async () => {
    const c = clients();
    await c.db.addFirmAssignment({
      litigationListingId: LIT,
      lawFirmId: 'firm-1',
      receivesMatches: true,
    });
    await c.db.addFirmAssignment({
      litigationListingId: LIT,
      lawFirmId: 'firm-2',
      receivesMatches: true,
    });

    const row = await createCaseForSession(c, matchedState('sess-multi'));
    expect(row!.lane).toBe('sourcing');
    expect(row!.firmId).toBeNull();
  });

  it('opting out drops the firm back out of routing → sourcing', async () => {
    const c = clients();
    await c.db.addFirmAssignment({ litigationListingId: LIT, lawFirmId: 'firm-solo' });
    await c.db.removeFirmAssignment(LIT, 'firm-solo');

    const row = await createCaseForSession(c, matchedState('sess-opted-out'));
    expect(row!.lane).toBe('sourcing');
    expect(row!.firmId).toBeNull();
  });
});
