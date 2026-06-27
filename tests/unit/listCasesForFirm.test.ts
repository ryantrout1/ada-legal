/**
 * Layer 1 test — cases-backed portal queue (Phase 2a).
 *
 * listCasesForFirm is the firm's intake queue read off the cases table (not
 * sessions). Firm-scoped, consent-gated HARD (only consent_to_share=true), and
 * grouped New / Working / Resolved with counts. Claimant identity is joined
 * from the routed session's extracted fields.
 *
 * Encodes /plan Phase 2a acceptance criteria 1-3.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import type { AdaSessionState } from '@/engine/types';

const ORG = 'org-1';

function field(value: unknown) {
  return { value, confidence: 0.9, extracted_at: '2026-04-22T00:00:00.000Z' };
}

function baseState(sessionId: string, claimant?: string): AdaSessionState {
  return {
    sessionId,
    orgId: ORG,
    sessionType: 'public_ada',
    status: 'completed',
    litigationListingId: null,
    extractedFields: claimant
      ? { claimant_name: field(claimant), claimant_email: field(`${claimant}@x.com`) }
      : {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
  } as unknown as AdaSessionState;
}

async function seedCase(
  db: InMemoryDbClient,
  opts: {
    sessionId: string;
    firmId: string;
    consented: boolean;
    status?: string;
    claimant?: string;
  },
) {
  await db.writeSession({ state: baseState(opts.sessionId, opts.claimant) });
  const { caseRow } = await db.createCase({
    orgId: ORG,
    adaSessionId: opts.sessionId,
    litigationListingId: null,
    lane: 'routed_firm',
    firmId: opts.firmId,
    classificationTitle: 'III',
    classificationStandard: null,
    matchConfidence: null,
    jurisdictionState: 'AZ',
    routedAt: null,
    firstContactDue: null,
    routingReason: 'test',
  });
  if (opts.consented) await db.recordCaseConsent({ sessionId: opts.sessionId, scope: 'matched_firm' });
  if (opts.status) {
    const c = db.cases.find((x) => x.id === caseRow.id)!;
    c.status = opts.status;
  }
  return caseRow;
}

describe('listCasesForFirm', () => {
  it('returns only this firm\'s consented cases, grouped New/Working/Resolved with counts', async () => {
    const db = new InMemoryDbClient();
    await seedCase(db, { sessionId: 's-new', firmId: 'firm-1', consented: true, status: 'new', claimant: 'Jane' });
    await seedCase(db, { sessionId: 's-work', firmId: 'firm-1', consented: true, status: 'negotiating' });
    await seedCase(db, { sessionId: 's-res', firmId: 'firm-1', consented: true, status: 'resolved' });
    await seedCase(db, { sessionId: 's-unconsented', firmId: 'firm-1', consented: false, status: 'new' });
    await seedCase(db, { sessionId: 's-otherfirm', firmId: 'firm-2', consented: true, status: 'new' });

    const result = await db.listCasesForFirm('firm-1');

    expect(result.counts).toEqual({ new: 1, working: 1, resolved: 1 });
    expect(result.groups.new.map((c) => c.adaSessionId ?? '')).toEqual(['s-new']);
    expect(result.groups.working).toHaveLength(1);
    expect(result.groups.resolved).toHaveLength(1);
    // claimant joined from the session
    expect(result.groups.new[0]!.claimantName).toBe('Jane');
    expect(result.groups.new[0]!.classificationTitle).toBe('III');
    expect(result.groups.new[0]!.jurisdictionState).toBe('AZ');
  });

  it('hard consent gate — an unconsented case never appears', async () => {
    const db = new InMemoryDbClient();
    await seedCase(db, { sessionId: 's1', firmId: 'firm-1', consented: false, status: 'new' });
    const result = await db.listCasesForFirm('firm-1');
    expect(result.counts).toEqual({ new: 0, working: 0, resolved: 0 });
  });

  it('groups accepted+working together and resolved+closed together', async () => {
    const db = new InMemoryDbClient();
    await seedCase(db, { sessionId: 'a', firmId: 'firm-1', consented: true, status: 'investigating' });
    await seedCase(db, { sessionId: 'w', firmId: 'firm-1', consented: true, status: 'negotiating' });
    await seedCase(db, { sessionId: 'c', firmId: 'firm-1', consented: true, status: 'closed' });
    const result = await db.listCasesForFirm('firm-1');
    expect(result.counts.working).toBe(2);
    expect(result.counts.resolved).toBe(1);
  });

  it('surfaces the matter owner (id + joined name); an unaccepted case reports null owner', async () => {
    const db = new InMemoryDbClient();
    const att = await db.createAttorney({
      orgId: ORG, name: 'Kelley Brooks', practiceAreas: [], lawFirmId: 'firm-1',
    });
    const owned = await seedCase(db, { sessionId: 's-owned', firmId: 'firm-1', consented: true });
    // accept assigns the owner (new → investigating → working group)
    await db.transitionCaseForFirm({
      caseId: owned.id, lawFirmId: 'firm-1', transition: 'accept', assignedLawyerId: att.id,
    });
    await seedCase(db, { sessionId: 's-unowned', firmId: 'firm-1', consented: true, status: 'new' });

    const result = await db.listCasesForFirm('firm-1');
    const ownedRow = result.groups.working.find((r) => r.adaSessionId === 's-owned')!;
    expect(ownedRow.assignedLawyerId).toBe(att.id);
    expect(ownedRow.assignedLawyerName).toBe('Kelley Brooks');

    const unownedRow = result.groups.new.find((r) => r.adaSessionId === 's-unowned')!;
    expect(unownedRow.assignedLawyerId).toBeNull();
    expect(unownedRow.assignedLawyerName).toBeNull();
  });
});
