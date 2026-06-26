/**
 * Layer 1 tests — pipeline analytics math (Phase 4c).
 *
 * computePipelineStats turns the firm's cases + their transition activity into a
 * funnel (how many reached each stage) and median time-in-stage. Pure, so the
 * neon / in-memory methods just feed it rows.
 */

import { describe, it, expect } from 'vitest';
import { computePipelineStats } from '@/engine/cases/pipelineStats';

const H = 3600_000; // ms per hour
const base = Date.parse('2026-06-01T00:00:00Z');
const at = (hours: number) => new Date(base + hours * H).toISOString();

describe('computePipelineStats', () => {
  it('counts the funnel: everyone is new, accept/send_demand/resolve narrow it', () => {
    const cases = [
      { id: 'c1', createdAt: at(0) },
      { id: 'c2', createdAt: at(0) },
      { id: 'c3', createdAt: at(0) },
    ];
    const events = [
      { caseId: 'c1', eventType: 'ACCEPT', createdAt: at(2) },
      { caseId: 'c1', eventType: 'SEND_DEMAND', createdAt: at(5) },
      { caseId: 'c1', eventType: 'RESOLVE', createdAt: at(15) },
      { caseId: 'c2', eventType: 'ACCEPT', createdAt: at(4) },
    ];
    const s = computePipelineStats(cases, events);
    expect(s.stageCounts).toEqual({ new: 3, accepted: 2, working: 1, resolved: 1 });
  });

  it('computes median time-in-stage per stage from consecutive transitions', () => {
    const cases = [
      { id: 'a', createdAt: at(0) },
      { id: 'b', createdAt: at(0) },
    ];
    const events = [
      // a: new→accepted in 2h, accepted→working in 4h
      { caseId: 'a', eventType: 'ACCEPT', createdAt: at(2) },
      { caseId: 'a', eventType: 'SEND_DEMAND', createdAt: at(6) },
      // b: new→accepted in 4h
      { caseId: 'b', eventType: 'ACCEPT', createdAt: at(4) },
    ];
    const s = computePipelineStats(cases, events);
    const newStage = s.timeInStage.find((t) => t.stage === 'new')!;
    expect(newStage.medianHours).toBe(3); // median of [2, 4]
    expect(newStage.n).toBe(2);
    const acceptedStage = s.timeInStage.find((t) => t.stage === 'accepted')!;
    expect(acceptedStage.medianHours).toBe(4); // only a
    expect(acceptedStage.n).toBe(1);
  });

  it('uses the earliest event of a type and ignores duplicates', () => {
    const cases = [{ id: 'a', createdAt: at(0) }];
    const events = [
      { caseId: 'a', eventType: 'ACCEPT', createdAt: at(3) },
      { caseId: 'a', eventType: 'ACCEPT', createdAt: at(9) },
    ];
    const s = computePipelineStats(cases, events);
    expect(s.stageCounts.accepted).toBe(1);
    expect(s.timeInStage.find((t) => t.stage === 'new')!.medianHours).toBe(3);
  });

  it('returns zeroed stats for an empty firm', () => {
    const s = computePipelineStats([], []);
    expect(s.stageCounts).toEqual({ new: 0, accepted: 0, working: 0, resolved: 0 });
    expect(s.timeInStage.every((t) => t.n === 0)).toBe(true);
    expect(s.acceptedThisWeek).toBe(0);
  });

  it('counts acceptedThisWeek by first-ACCEPT inside the trailing 7 days', () => {
    const now = base + 100 * 24 * H; // a fixed "now" well after base
    const cases = [
      { id: 'recent', createdAt: at(0) }, // accepted 2 days ago → counts
      { id: 'old', createdAt: at(0) }, // accepted 20 days ago → excluded
      { id: 'edge', createdAt: at(0) }, // accepted exactly 7 days ago → counts (inclusive)
      { id: 'never', createdAt: at(0) }, // never accepted → excluded
    ];
    const events = [
      { caseId: 'recent', eventType: 'ACCEPT', createdAt: new Date(now - 2 * 24 * H).toISOString() },
      { caseId: 'old', eventType: 'ACCEPT', createdAt: new Date(now - 20 * 24 * H).toISOString() },
      { caseId: 'edge', eventType: 'ACCEPT', createdAt: new Date(now - 7 * 24 * H).toISOString() },
    ];
    const s = computePipelineStats(cases, events, now);
    expect(s.acceptedThisWeek).toBe(2);
  });
});

import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import type { AdaSessionState } from '@/engine/types';

const ORG = 'org-1';
function sess(id: string): AdaSessionState {
  return {
    sessionId: id, orgId: ORG, sessionType: 'public_ada', status: 'completed',
    litigationListingId: null, extractedFields: {}, classification: null, metadata: {},
    accessibilitySettings: {}, isTest: true,
  } as unknown as AdaSessionState;
}
async function seedCase(db: InMemoryDbClient, sid: string, firmId: string, consent: boolean) {
  await db.writeLawFirm({
    id: firmId, orgId: ORG, name: firmId, primaryContact: null, email: null, phone: null,
    stripeCustomerId: null, status: 'active', isPilot: true,
  });
  await db.writeSession({ state: sess(sid) });
  const { caseRow } = await db.createCase({
    orgId: ORG, adaSessionId: sid, litigationListingId: null, lane: 'routed_firm', firmId,
    classificationTitle: 'III', classificationStandard: null, matchConfidence: null,
    jurisdictionState: 'AZ', routedAt: null, firstContactDue: null, routingReason: 't',
  });
  if (consent) await db.recordCaseConsent({ sessionId: sid, scope: 'matched_firm' });
  return caseRow;
}

describe('getFirmPipelineStats (in-memory wiring)', () => {
  it('counts only the firm consented cases and routes ACCEPT through the funnel', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, 's1', 'firm-1', true);
    await db.appendCaseActivity({ caseId: c.id, actorType: 'user', eventType: 'ACCEPT', summary: 'accepted', metadata: {} });
    // unconsented case in the same firm — excluded
    await seedCase(db, 's2', 'firm-1', false);
    // other firm — excluded
    const other = await seedCase(db, 's3', 'firm-2', true);
    await db.appendCaseActivity({ caseId: other.id, actorType: 'user', eventType: 'ACCEPT', summary: 'accepted', metadata: {} });

    const stats = await db.getFirmPipelineStats('firm-1');
    expect(stats.stageCounts.new).toBe(1);
    expect(stats.stageCounts.accepted).toBe(1);
    expect(stats.stageCounts.working).toBe(0);
  });
});
