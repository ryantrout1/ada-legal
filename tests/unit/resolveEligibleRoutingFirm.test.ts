/**
 * Unit — the routing eligibility gate (routing rebuild Phase 2).
 *
 * isFirmEligible: the firm-level floor (active + subscribed/pilot).
 * resolveEligibleRoutingFirm: a matched litigation routes to a firm only when
 * that firm is opted in (receives_matches) AND eligible; lead-firm precedence;
 * ambiguity → null.
 *
 * Ref: /plan "Gate exclusive routing behind firm eligibility", Phase 2.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import { isFirmEligible } from '@/engine/routing/firmEligibility';
import { resolveEligibleRoutingFirm } from '@/engine/routing/createCaseForSession';
import type {
  LawFirmRow,
  LitigationAdminRow,
  LitigationFirmAssignment,
} from '@/engine/clients/types';

const LIT = 'lit-1';

function firm(id: string, over: Partial<LawFirmRow> = {}): LawFirmRow {
  return {
    id,
    name: id,
    status: 'active',
    isPilot: true,
    stripeCustomerId: null,
    ...over,
  } as unknown as LawFirmRow;
}

function assign(firmId: string, optedIn: boolean): LitigationFirmAssignment {
  return {
    id: `a-${firmId}`,
    litigationListingId: LIT,
    lawFirmId: firmId,
    assignedByUserId: null,
    receivesMatches: optedIn,
    optedInAt: optedIn ? new Date(0).toISOString() : null,
    createdAt: new Date(0).toISOString(),
  };
}

function seed(opts: {
  leadFirmId?: string | null;
  firms?: LawFirmRow[];
  assignments?: LitigationFirmAssignment[];
}): InMemoryDbClient {
  const db = new InMemoryDbClient();
  db.adminLitigation.push({
    id: LIT,
    kind: 'class',
    caseName: 'Niles v. Hilton',
    slug: 'niles-v-hilton',
    leadFirmId: opts.leadFirmId ?? null,
  } as unknown as LitigationAdminRow);
  (opts.firms ?? []).forEach((f) => db.lawFirms.push(f));
  (opts.assignments ?? []).forEach((a) => db.litigationFirmAssignments.push(a));
  return db;
}

describe('isFirmEligible', () => {
  it('active + pilot → eligible (comped)', () => {
    expect(isFirmEligible(firm('f', { isPilot: true, stripeCustomerId: null }))).toBe(true);
  });
  it('active + stripe customer → eligible (paying)', () => {
    expect(isFirmEligible(firm('f', { isPilot: false, stripeCustomerId: 'cus_1' }))).toBe(true);
  });
  it('active but neither pilot nor stripe → ineligible', () => {
    expect(isFirmEligible(firm('f', { isPilot: false, stripeCustomerId: null }))).toBe(false);
  });
  it('suspended → ineligible even when pilot', () => {
    expect(isFirmEligible(firm('f', { status: 'suspended', isPilot: true }))).toBe(false);
  });
  it('churned → ineligible even with stripe', () => {
    expect(isFirmEligible(firm('f', { status: 'churned', stripeCustomerId: 'cus_1' }))).toBe(false);
  });
});

describe('resolveEligibleRoutingFirm', () => {
  it('sole opted-in + eligible firm → routes to it', async () => {
    const db = seed({ firms: [firm('f1')], assignments: [assign('f1', true)] });
    expect(await resolveEligibleRoutingFirm({ db }, LIT)).toBe('f1');
  });

  it('assigned but NOT opted in → null (the Hilton default)', async () => {
    const db = seed({ firms: [firm('f1')], assignments: [assign('f1', false)] });
    expect(await resolveEligibleRoutingFirm({ db }, LIT)).toBeNull();
  });

  it('opted in but INELIGIBLE (suspended) → null', async () => {
    const db = seed({
      firms: [firm('f1', { status: 'suspended' })],
      assignments: [assign('f1', true)],
    });
    expect(await resolveEligibleRoutingFirm({ db }, LIT)).toBeNull();
  });

  it('lead firm opted in + eligible → routes to the lead', async () => {
    const db = seed({
      leadFirmId: 'lead',
      firms: [firm('lead'), firm('other')],
      assignments: [assign('lead', true), assign('other', true)],
    });
    expect(await resolveEligibleRoutingFirm({ db }, LIT)).toBe('lead');
  });

  it('lead firm set but NOT opted in → null, never routes behind the lead', async () => {
    const db = seed({
      leadFirmId: 'lead',
      firms: [firm('lead'), firm('other')],
      assignments: [assign('lead', false), assign('other', true)],
    });
    expect(await resolveEligibleRoutingFirm({ db }, LIT)).toBeNull();
  });

  it('no lead + two opted-in eligible firms → null (ambiguous, do not guess)', async () => {
    const db = seed({
      firms: [firm('f1'), firm('f2')],
      assignments: [assign('f1', true), assign('f2', true)],
    });
    expect(await resolveEligibleRoutingFirm({ db }, LIT)).toBeNull();
  });

  it('no assignments → null', async () => {
    const db = seed({ firms: [], assignments: [] });
    expect(await resolveEligibleRoutingFirm({ db }, LIT)).toBeNull();
  });
});
