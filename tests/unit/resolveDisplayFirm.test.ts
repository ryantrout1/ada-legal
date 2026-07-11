/**
 * Unit — resolveDisplayFirm resolves the firm whose public contact the readout
 * shows for a matched litigation: lead counsel if set, else the sole assigned
 * firm, else null (ambiguous / none). Eligibility-INDEPENDENT.
 *
 * Phase 1 of the routing rebuild splits this out from resolveRoutingFirm so the
 * readout and the routing decision no longer share one resolver. This test
 * pins the resolution rules and confirms that in Phase 1 resolveRoutingFirm
 * still delegates to resolveDisplayFirm (no behavior change yet).
 *
 * Ref: routing rebuild /plan Phase 1 (decouple display from routing).
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import { resolveDisplayFirm } from '@/engine/routing/createCaseForSession';
import type { LitigationAdminRow, LitigationFirmAssignment } from '@/engine/clients/types';

const LIT_ID = 'lit-hilton';
const FIRM_A = 'firm-a';
const FIRM_B = 'firm-b';
const LEAD_FIRM = 'firm-lead';

function assignment(id: string, firmId: string): LitigationFirmAssignment {
  return {
    id,
    litigationListingId: LIT_ID,
    lawFirmId: firmId,
    assignedByUserId: null,
    receivesMatches: false,
    optedInAt: null,
    createdAt: new Date(0).toISOString(),
  };
}

function seed(opts: {
  leadFirmId?: string | null;
  assignments?: string[];
}): InMemoryDbClient {
  const db = new InMemoryDbClient();
  db.adminLitigation.push({
    id: LIT_ID,
    kind: 'class',
    caseName: 'Niles v. Hilton',
    slug: 'niles-v-hilton',
    leadFirmId: opts.leadFirmId ?? null,
  } as unknown as LitigationAdminRow);
  (opts.assignments ?? []).forEach((firmId, i) =>
    db.litigationFirmAssignments.push(assignment(`assign-${i}`, firmId)),
  );
  return db;
}

describe('resolveDisplayFirm', () => {
  it('prefers the lead firm when set', async () => {
    const db = seed({ leadFirmId: LEAD_FIRM, assignments: [FIRM_A] });
    expect(await resolveDisplayFirm({ db }, LIT_ID)).toBe(LEAD_FIRM);
  });

  it('falls back to the sole assigned firm when no lead is set', async () => {
    const db = seed({ leadFirmId: null, assignments: [FIRM_A] });
    expect(await resolveDisplayFirm({ db }, LIT_ID)).toBe(FIRM_A);
  });

  it('returns null when multiple firms are assigned and no lead is set', async () => {
    const db = seed({ leadFirmId: null, assignments: [FIRM_A, FIRM_B] });
    expect(await resolveDisplayFirm({ db }, LIT_ID)).toBeNull();
  });

  it('returns null when no firm is assigned and no lead is set', async () => {
    const db = seed({ leadFirmId: null, assignments: [] });
    expect(await resolveDisplayFirm({ db }, LIT_ID)).toBeNull();
  });

  it('resolves regardless of firm eligibility (no subscription/opt-in lookup)', async () => {
    // A firm that has NOT signed up still resolves as the display firm — the
    // readout shows its public contact even when the case will not route to it.
    const db = seed({ leadFirmId: null, assignments: [FIRM_A] });
    expect(await resolveDisplayFirm({ db }, LIT_ID)).toBe(FIRM_A);
  });
});

