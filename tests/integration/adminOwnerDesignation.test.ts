/**
 * Integration — admin owner designation guard (/plan Phase 3, AC#4).
 *
 * The admin firm-detail roster can promote a member to owner and demote an
 * owner back to member. The invariant: a firm is never left with zero LIVE
 * owners. The handler builds the roster (listAttorneysForFirm), filters out
 * archived rows, then applies canStepDown before demoting.
 *
 * canStepDown's pure logic and setAttorneyFirmRole's audit are covered
 * elsewhere; this proves the admin composition and — the bit nothing else
 * covers — that an archived owner does NOT count as a live owner.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { canStepDown } from '@/engine/portal/firmOwnership';
import type { LawFirmRow, AttorneyAdminRow } from '@/engine/clients/types';

const ORG = '00000000-0000-4000-8000-0000000000c1';
const FIRM = '00000000-0000-4000-8000-00000000cc01';
const ACTOR = { actorUserId: null, actorEmail: 'admin@adalegallink.com' };

function firm(): LawFirmRow {
  return {
    id: FIRM,
    orgId: ORG,
    name: 'Test Firm',
    primaryContact: null,
    email: null,
    phone: null,
    stripeCustomerId: null,
    status: 'active',
    isPilot: true,
  };
}

/** The roster the handler feeds to the guard: firm-scoped, archived removed. */
async function liveRoster(
  clients: ReturnType<typeof makeInMemoryClients>,
): Promise<AttorneyAdminRow[]> {
  const roster = await clients.db.listAttorneysForFirm(FIRM);
  return roster.filter((a) => a.status !== 'archived');
}

describe('admin owner designation guard', () => {
  it('blocks demoting the sole owner, allows it once a co-owner exists', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm());
    const owner = await clients.db.createAttorney({
      orgId: ORG, name: 'Sole Owner', lawFirmId: FIRM, firmRole: 'owner',
      status: 'approved', practiceAreas: [],
    });
    const member = await clients.db.createAttorney({
      orgId: ORG, name: 'A Member', lawFirmId: FIRM, firmRole: 'member',
      status: 'approved', practiceAreas: [],
    });

    // Sole owner → demote blocked.
    expect(canStepDown(await liveRoster(clients), owner.id)).toBe(false);

    // Promote the member → co-owner now exists (audited via setAttorneyFirmRole).
    await clients.db.setAttorneyFirmRole(member.id, 'owner', ACTOR);
    expect(canStepDown(await liveRoster(clients), owner.id)).toBe(true);

    // Now the original owner can be demoted.
    const demoted = await clients.db.setAttorneyFirmRole(owner.id, 'member', ACTOR);
    expect(demoted?.firmRole).toBe('member');

    const audit = clients.db.__testAuditLog ?? [];
    expect(audit.filter((e) => e.action === 'attorney.firm_role_changed').length).toBe(2);
  });

  it('an archived owner does not count as a live owner', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm());
    const liveOwner = await clients.db.createAttorney({
      orgId: ORG, name: 'Live Owner', lawFirmId: FIRM, firmRole: 'owner',
      status: 'approved', practiceAreas: [],
    });
    await clients.db.createAttorney({
      orgId: ORG, name: 'Archived Owner', lawFirmId: FIRM, firmRole: 'owner',
      status: 'archived', practiceAreas: [],
    });

    // Two 'owner' rows exist, but one is archived — the live owner is still the
    // only real owner, so demoting them must be blocked.
    expect(canStepDown(await liveRoster(clients), liveOwner.id)).toBe(false);
  });
});
