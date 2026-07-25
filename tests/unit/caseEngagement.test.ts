/**
 * Case engagement marker.
 *
 * WHAT THIS IS. When a firm actually signs the client. Fee agreements happen
 * off-platform and the system stays out of them; this records only that one
 * exists. Without it a case sat in `investigating` indefinitely and there was
 * no way to distinguish a firm that took the case from a firm sitting on it —
 * and no way to count how many intakes became representation.
 *
 * WHY IT IS NOT A STATUS. Engagement is orthogonal to the pipeline: a matter
 * can be signed while still investigating, or reach demand_sent unsigned.
 * Folding it into the status enum would impose an order on two independent
 * facts and would make "engaged" mutually exclusive with every stage.
 *
 * THE IDEMPOTENCY RULE. Re-marking an already-engaged case keeps the ORIGINAL
 * timestamp. The question it answers is "when did representation start", so a
 * second click must not silently move that date — a stale UI, a double-submit
 * or a page refresh would otherwise rewrite history.
 *
 * Ref: Phase 5 §7.5.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';

const FIRM = '11111111-1111-1111-1111-111111111111';
const OTHER_FIRM = '22222222-2222-2222-2222-222222222222';

function seed(overrides: { consentToShare?: boolean } = {}) {
  const clients = makeInMemoryClients();
  const db = clients.db as unknown as {
    cases: Array<Record<string, unknown>>;
    caseActivity: Array<{ caseId: string; eventType: string }>;
    setCaseEngaged: (o: {
      caseId: string;
      lawFirmId: string;
      engaged: boolean;
    }) => Promise<{ engagedAt: string | null } | null>;
  };
  db.cases.push({
    id: 'case-1',
    firmId: FIRM,
    status: 'investigating',
    consentToShare: overrides.consentToShare ?? true,
  });
  return db;
}

describe('engagement marker — set and clear', () => {
  it('records a timestamp when the client signs', async () => {
    const db = seed();
    const out = await db.setCaseEngaged({ caseId: 'case-1', lawFirmId: FIRM, engaged: true });
    expect(out).not.toBeNull();
    expect(out!.engagedAt).toBeTruthy();
    expect(Number.isNaN(Date.parse(out!.engagedAt!))).toBe(false);
  });

  it('clears back to null', async () => {
    const db = seed();
    await db.setCaseEngaged({ caseId: 'case-1', lawFirmId: FIRM, engaged: true });
    const out = await db.setCaseEngaged({ caseId: 'case-1', lawFirmId: FIRM, engaged: false });
    expect(out!.engagedAt).toBeNull();
  });

  it('writes an activity row for each real change', async () => {
    const db = seed();
    await db.setCaseEngaged({ caseId: 'case-1', lawFirmId: FIRM, engaged: true });
    await db.setCaseEngaged({ caseId: 'case-1', lawFirmId: FIRM, engaged: false });
    const kinds = db.caseActivity.map((a) => a.eventType);
    expect(kinds).toContain('ENGAGED');
    expect(kinds).toContain('ENGAGEMENT_CLEARED');
  });
});

describe('engagement marker — a second click cannot rewrite the date', () => {
  it('keeps the original timestamp when marked again', async () => {
    const db = seed();
    const first = await db.setCaseEngaged({ caseId: 'case-1', lawFirmId: FIRM, engaged: true });
    await new Promise((r) => setTimeout(r, 5));
    const second = await db.setCaseEngaged({ caseId: 'case-1', lawFirmId: FIRM, engaged: true });
    expect(second!.engagedAt).toBe(first!.engagedAt);
  });

  it('does not log a second ENGAGED for the repeat', async () => {
    // A double-submit should be invisible, not two rows claiming the client
    // signed twice.
    const db = seed();
    await db.setCaseEngaged({ caseId: 'case-1', lawFirmId: FIRM, engaged: true });
    await db.setCaseEngaged({ caseId: 'case-1', lawFirmId: FIRM, engaged: true });
    const engaged = db.caseActivity.filter((a) => a.eventType === 'ENGAGED');
    expect(engaged).toHaveLength(1);
  });

  it('clearing an unengaged case is a silent no-op', async () => {
    const db = seed();
    const out = await db.setCaseEngaged({ caseId: 'case-1', lawFirmId: FIRM, engaged: false });
    expect(out!.engagedAt).toBeNull();
    expect(db.caseActivity.filter((a) => a.eventType === 'ENGAGEMENT_CLEARED')).toHaveLength(0);
  });
});

describe('engagement marker — scoping', () => {
  it('refuses a case belonging to another firm', async () => {
    const db = seed();
    const out = await db.setCaseEngaged({
      caseId: 'case-1',
      lawFirmId: OTHER_FIRM,
      engaged: true,
    });
    expect(out).toBeNull();
  });

  it('refuses a case the claimant has not consented to share', async () => {
    // Same gate as every other case mutation: no consent, no firm access.
    const db = seed({ consentToShare: false });
    const out = await db.setCaseEngaged({ caseId: 'case-1', lawFirmId: FIRM, engaged: true });
    expect(out).toBeNull();
  });
});
