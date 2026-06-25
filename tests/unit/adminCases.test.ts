/**
 * Layer 1 tests — admin cases queue + placement (Phase 3a/3b).
 *
 * listCasesForAdmin: org-scoped case list with lane / unplaced filtering and
 * claimant/litigation/firm joins. placeCaseToFirm: assign a firm to an unplaced
 * case (sets firm_id + lane=routed_firm + SLA + PLACED activity), then the firm
 * workspace surfaces it (loop closure) when consented.
 *
 * Encodes /plan Phase 3 acceptance criteria 1-4.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import type { AdaSessionState } from '@/engine/types';
import type { CaseLane } from '@/engine/cases/caseStateMachine';

const ORG = 'org-1';
const field = (v: unknown) => ({ value: v, confidence: 0.9, extracted_at: '2026-01-01T00:00:00.000Z' });

function sess(id: string, claimant: string): AdaSessionState {
  return {
    sessionId: id, orgId: ORG, sessionType: 'public_ada', status: 'completed',
    litigationListingId: null, extractedFields: { claimant_name: field(claimant) },
    classification: null, metadata: {}, accessibilitySettings: {}, isTest: true,
  } as unknown as AdaSessionState;
}

async function seedCase(
  db: InMemoryDbClient,
  opts: { sid: string; lane: CaseLane; firmId: string | null; consent?: boolean; claimant?: string },
) {
  await db.writeSession({ state: sess(opts.sid, opts.claimant ?? 'Claimant') });
  const { caseRow } = await db.createCase({
    orgId: ORG, adaSessionId: opts.sid, litigationListingId: null, lane: opts.lane,
    firmId: opts.firmId, classificationTitle: 'III', classificationStandard: null,
    matchConfidence: null, jurisdictionState: 'AZ', routedAt: null, firstContactDue: null,
    routingReason: 'test',
  });
  if (opts.consent) await db.recordCaseConsent({ sessionId: opts.sid, scope: 'sourcing' });
  return caseRow;
}

async function seedFirm(db: InMemoryDbClient, id: string, org = ORG) {
  await db.writeLawFirm({
    id, orgId: org, name: `Firm ${id}`, primaryContact: null, email: `${id}@x.com`,
    phone: null, stripeCustomerId: null, status: 'active', isPilot: true,
  });
}

describe('listCasesForAdmin', () => {
  it('lists all org cases and filters by lane and by unplaced', async () => {
    const db = new InMemoryDbClient();
    await seedFirm(db, 'firm-1');
    await seedCase(db, { sid: 'a', lane: 'routed_firm', firmId: 'firm-1' });
    await seedCase(db, { sid: 'b', lane: 'sourcing', firmId: null });
    await seedCase(db, { sid: 'c', lane: 'general_queue', firmId: null });
    await seedCase(db, { sid: 'd', lane: 'no_action', firmId: null });

    expect((await db.listCasesForAdmin(ORG)).cases).toHaveLength(4);
    expect((await db.listCasesForAdmin(ORG, { lane: 'sourcing' })).cases.map((c) => c.lane)).toEqual(['sourcing']);
    const unplaced = (await db.listCasesForAdmin(ORG, { lane: 'unplaced' })).cases;
    expect(unplaced.map((c) => c.adaSessionId).sort()).toEqual(['b', 'c']);
  });

  it('joins claimant + firm name onto the row', async () => {
    const db = new InMemoryDbClient();
    await seedFirm(db, 'firm-1');
    await seedCase(db, { sid: 'a', lane: 'routed_firm', firmId: 'firm-1', claimant: 'Jane Doe' });
    const row = (await db.listCasesForAdmin(ORG)).cases[0]!;
    expect(row.claimantName).toBe('Jane Doe');
    expect(row.firmName).toBe('Firm firm-1');
  });
});

describe('placeCaseToFirm', () => {
  it('places an unplaced consented case to a firm and the firm queue surfaces it', async () => {
    const db = new InMemoryDbClient();
    await seedFirm(db, 'firm-1');
    const c = await seedCase(db, { sid: 's1', lane: 'sourcing', firmId: null, consent: true });

    const res = await db.placeCaseToFirm({ caseId: c.id, orgId: ORG, firmId: 'firm-1' });
    expect(res!.caseRow.lane).toBe('routed_firm');
    expect(res!.caseRow.firmId).toBe('firm-1');
    expect(db.caseActivity.some((a) => a.caseId === c.id && a.eventType === 'PLACED')).toBe(true);

    // Loop closure: consented + placed → appears in the firm's workspace queue.
    const q = await db.listCasesForFirm('firm-1');
    expect(q.groups.new.map((r) => r.caseId)).toContain(c.id);
  });

  it('returns null for a firm outside the org', async () => {
    const db = new InMemoryDbClient();
    await seedFirm(db, 'firm-x', 'other-org');
    const c = await seedCase(db, { sid: 's1', lane: 'sourcing', firmId: null, consent: true });
    expect(await db.placeCaseToFirm({ caseId: c.id, orgId: ORG, firmId: 'firm-x' })).toBeNull();
  });
});
