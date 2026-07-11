/**
 * Integration test — case routing at session completion (Phase 1a).
 *
 * Exercises createCaseForSession against the in-memory DB client: lane
 * selection per the router, idempotency on ada_session_id, the ROUTED
 * activity row, the audit entry, and the never-throw safety guarantee.
 *
 * Encodes /plan Phase 1a acceptance criteria 1-6.
 */

import { describe, it, expect } from 'vitest';
import {
  InMemoryDbClient,
  InMemoryClock,
  InMemoryAuditClient,
} from '@/engine/clients/inMemoryClients';
import { createCaseForSession } from '@/engine/routing/createCaseForSession';
import type { AdaSessionState } from '@/engine/types';
import type { AdaTitle } from '@/types/db';

const ORG = 'org-1';

function makeState(partial: {
  sessionId?: string;
  title?: AdaTitle | null;
  litigationListingId?: string | null;
}): AdaSessionState {
  return {
    sessionId: partial.sessionId ?? 'sess-1',
    orgId: ORG,
    sessionType: 'public_ada',
    status: 'completed',
    litigationListingId: partial.litigationListingId ?? null,
    extractedFields: {},
    classification:
      partial.title === undefined
        ? { title: 'III', tier: 'high', reasoning: 'r', standard: '§201' }
        : partial.title === null
          ? null
          : { title: partial.title, tier: 'medium', reasoning: 'r', standard: '§201' },
  } as unknown as AdaSessionState;
}

function clients() {
  return {
    db: new InMemoryDbClient(),
    clock: new InMemoryClock(),
    audit: new InMemoryAuditClient(),
  };
}

/** Seed an assignment + firm row. eligible = active pilot firm; optedIn flips receives_matches. */
function seedFirm(
  c: ReturnType<typeof clients>,
  opts: { litId: string; firmId: string; optedIn: boolean; eligible: boolean },
) {
  c.db.litigationFirmAssignments.push({
    id: `a-${opts.firmId}`,
    litigationListingId: opts.litId,
    lawFirmId: opts.firmId,
    assignedByUserId: null,
    receivesMatches: opts.optedIn,
    optedInAt: opts.optedIn ? new Date(0).toISOString() : null,
    createdAt: new Date(0).toISOString(),
  });
  c.db.lawFirms.push({
    id: opts.firmId,
    name: 'Firm',
    status: opts.eligible ? 'active' : 'suspended',
    isPilot: true,
    stripeCustomerId: null,
  } as unknown as import('@/engine/clients/types').LawFirmRow);
}

describe('createCaseForSession — lane selection', () => {
  it('matched litigation + eligible, opted-in firm → routed_firm (AC1)', async () => {
    const c = clients();
    seedFirm(c, { litId: 'lit-1', firmId: 'firm-1', optedIn: true, eligible: true });

    const row = await createCaseForSession(c, makeState({ litigationListingId: 'lit-1' }));

    expect(row).not.toBeNull();
    expect(row!.lane).toBe('routed_firm');
    expect(row!.firmId).toBe('firm-1');
    expect(c.db.cases).toHaveLength(1);
    const stored = c.db.cases[0]!;
    expect(stored.caseNumber).toMatch(/^CASE-\d{4,}$/);
    expect(stored.consentToShare).toBe(false);
  });

  it('matched litigation + firm NOT opted in → matched_self_referral, firm_id null (the Hilton case)', async () => {
    const c = clients();
    seedFirm(c, { litId: 'lit-1', firmId: 'firm-1', optedIn: false, eligible: true });

    const row = await createCaseForSession(c, makeState({ litigationListingId: 'lit-1' }));

    expect(row!.lane).toBe('matched_self_referral');
    expect(row!.firmId).toBeNull();
    // No admin routing notification fires for a self-referral case.
    expect(c.db.caseActivity.filter((a) => a.eventType === 'NOTIFIED')).toHaveLength(0);
  });

  it('matched litigation + opted-in but INELIGIBLE firm → matched_self_referral', async () => {
    const c = clients();
    seedFirm(c, { litId: 'lit-1', firmId: 'firm-1', optedIn: true, eligible: false });

    const row = await createCaseForSession(c, makeState({ litigationListingId: 'lit-1' }));

    expect(row!.lane).toBe('matched_self_referral');
    expect(row!.firmId).toBeNull();
  });

  it('matched litigation WITHOUT any firm → sourcing (AC2)', async () => {
    const c = clients();
    const row = await createCaseForSession(c, makeState({ litigationListingId: 'lit-2' }));
    expect(row!.lane).toBe('sourcing');
    expect(row!.firmId).toBeNull();
  });

  it('no litigation + actionable title → pool (AC3)', async () => {
    const c = clients();
    const row = await createCaseForSession(c, makeState({ title: 'III' }));
    expect(row!.lane).toBe('pool');
  });

  it('no litigation + out_of_scope → no_action (AC3)', async () => {
    const c = clients();
    const row = await createCaseForSession(c, makeState({ title: 'out_of_scope' }));
    expect(row!.lane).toBe('no_action');
  });
});

describe('createCaseForSession — side effects', () => {
  it('writes a ROUTED case_activity row and a case.routed audit entry', async () => {
    const c = clients();
    const row = await createCaseForSession(c, makeState({ title: 'III' }));
    const activity = c.db.caseActivity.filter((a) => a.caseId === row!.id);
    expect(activity).toHaveLength(1);
    expect(activity[0]!.eventType).toBe('ROUTED');
    const audit = c.audit.entries.filter((e) => e.action === 'case.routed');
    expect(audit).toHaveLength(1);
    expect(audit[0]!.resourceId).toBe(row!.id);
  });
});

describe('createCaseForSession — idempotency (AC4)', () => {
  it('re-running for the same session creates exactly one case + one audit', async () => {
    const c = clients();
    const state = makeState({ sessionId: 'sess-dup', title: 'III' });
    const first = await createCaseForSession(c, state);
    const second = await createCaseForSession(c, state);
    expect(c.db.cases).toHaveLength(1);
    expect(second!.id).toBe(first!.id);
    // No duplicate audit / activity on the second (no-op) call.
    expect(c.audit.entries.filter((e) => e.action === 'case.routed')).toHaveLength(1);
    expect(c.db.caseActivity).toHaveLength(1);
  });
});

describe('createCaseForSession — never throws (AC6)', () => {
  it('returns null instead of throwing when the DB layer fails', async () => {
    const c = clients();
    // Force createCase to reject; createCaseForSession must swallow it.
    c.db.createCase = async () => {
      throw new Error('db down');
    };
    const row = await createCaseForSession(c, makeState({ title: 'III' }));
    expect(row).toBeNull();
  });
});
