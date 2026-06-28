/**
 * Layer 1 test — reassign a matter's owner (Phase 2).
 *
 * setCaseOwnerForFirm sets cases.assigned_lawyer_id to another attorney IN THE
 * SAME FIRM, writes an OWNER_CHANGED activity row, and is firm-scoped both ways:
 * the case must be the firm's, and the target attorney must belong to the firm
 * (an out-of-firm target is rejected with null and changes nothing).
 *
 * Encodes /plan Phase 2 acceptance criterion 6.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import type { AdaSessionState } from '@/engine/types';

const ORG = 'org-1';

function baseState(sessionId: string): AdaSessionState {
  return {
    sessionId,
    orgId: ORG,
    sessionType: 'public_ada',
    status: 'completed',
    litigationListingId: null,
    extractedFields: {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
  } as unknown as AdaSessionState;
}

async function seedAcceptedCase(db: InMemoryDbClient, firmId: string, ownerId: string) {
  const sessionId = `s-${Math.random()}`;
  await db.writeSession({ state: baseState(sessionId) });
  const { caseRow } = await db.createCase({
    orgId: ORG, adaSessionId: sessionId, litigationListingId: null, lane: 'routed_firm',
    firmId, classificationTitle: 'III', classificationStandard: null, matchConfidence: null,
    jurisdictionState: 'AZ', routedAt: null, firstContactDue: null, routingReason: 'test',
  });
  await db.recordCaseConsent({ sessionId, scope: 'matched_firm' });
  await db.transitionCaseForFirm({ caseId: caseRow.id, lawFirmId: firmId, transition: 'accept', assignedLawyerId: ownerId });
  return caseRow;
}

async function makeAttorney(db: InMemoryDbClient, firmId: string, name: string) {
  return db.createAttorney({ orgId: ORG, name, practiceAreas: [], lawFirmId: firmId });
}

describe('setCaseOwnerForFirm', () => {
  it('reassigns to another firm attorney and writes an OWNER_CHANGED activity', async () => {
    const db = new InMemoryDbClient();
    const a1 = await makeAttorney(db, 'firm-1', 'Kelley');
    const a2 = await makeAttorney(db, 'firm-1', 'Josh');
    const c = await seedAcceptedCase(db, 'firm-1', a1.id);

    const res = await db.setCaseOwnerForFirm({ caseId: c.id, lawFirmId: 'firm-1', attorneyId: a2.id });
    expect(res!.caseRow.assignedLawyerId).toBe(a2.id);
    expect(db.caseActivity.some((act) => act.caseId === c.id && act.eventType === 'OWNER_CHANGED')).toBe(true);
  });

  it('rejects a target attorney outside the firm (null, owner unchanged)', async () => {
    const db = new InMemoryDbClient();
    const a1 = await makeAttorney(db, 'firm-1', 'Kelley');
    const outsider = await makeAttorney(db, 'firm-2', 'Stranger');
    const c = await seedAcceptedCase(db, 'firm-1', a1.id);

    const res = await db.setCaseOwnerForFirm({ caseId: c.id, lawFirmId: 'firm-1', attorneyId: outsider.id });
    expect(res).toBeNull();
    // owner unchanged
    const list = await db.listCasesForFirm('firm-1');
    const row = [...list.groups.new, ...list.groups.working, ...list.groups.resolved].find((r) => r.caseId === c.id)!;
    expect(row.assignedLawyerId).toBe(a1.id);
    expect(db.caseActivity.some((act) => act.caseId === c.id && act.eventType === 'OWNER_CHANGED')).toBe(false);
  });

  it('returns null for a case owned by another firm', async () => {
    const db = new InMemoryDbClient();
    const a1 = await makeAttorney(db, 'firm-1', 'Kelley');
    const c = await seedAcceptedCase(db, 'firm-1', a1.id);
    const otherFirmAttorney = await makeAttorney(db, 'firm-2', 'Other');
    expect(
      await db.setCaseOwnerForFirm({ caseId: c.id, lawFirmId: 'firm-2', attorneyId: otherFirmAttorney.id }),
    ).toBeNull();
  });
});
