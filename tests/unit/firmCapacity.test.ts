/**
 * Routing capacity.
 *
 * THE BUG THIS CLOSES. `attorneys.accepting_referrals`, `routing_paused` and
 * `max_active_cases` shipped in migration 0023. The profile screen writes them.
 * The API reads them back. The schema comment states the router uses them "to
 * stop pushing to a full or paused attorney." It never did — `isFirmEligible`
 * checked only that the firm was active and paying. An attorney could flip
 * "I'm full" and keep receiving work.
 *
 * WHY IT MATTERED MORE THAN IT LOOKS. This lane is EXCLUSIVE. A lead routed to
 * a paused firm is not extra work in a shared queue that someone else can pick
 * up — it is invisible to every other firm, sitting unworked while the
 * claimant waits and believes a lawyer has their case.
 *
 * THE FAIL-OPEN RULE. A firm with no attorney rows counts as available. These
 * flags exist so a person can opt OUT; an empty roster is not an opt-out.
 * Failing closed would silently stop routing to any firm whose people had not
 * been entered yet, turning a data-entry gap into an outage.
 */

import { describe, it, expect } from 'vitest';
import {
  isAttorneyAvailable,
  firmHasRoutingCapacity,
  type AttorneyCapacity,
} from '@/engine/routing/firmCapacity';

function attorney(over: Partial<AttorneyCapacity> = {}): AttorneyCapacity {
  return {
    acceptingReferrals: true,
    routingPaused: false,
    maxActiveCases: null,
    activeCaseCount: 0,
    ...over,
  };
}

describe('one attorney"s availability', () => {
  it('is available by default', () => {
    expect(isAttorneyAvailable(attorney())).toBe(true);
  });

  it('is unavailable when not accepting referrals', () => {
    expect(isAttorneyAvailable(attorney({ acceptingReferrals: false }))).toBe(false);
  });

  it('is unavailable when routing is paused', () => {
    expect(isAttorneyAvailable(attorney({ routingPaused: true }))).toBe(false);
  });

  it('pause overrides accepting referrals', () => {
    // Both switches exist; the harder one wins.
    expect(
      isAttorneyAvailable(attorney({ acceptingReferrals: true, routingPaused: true })),
    ).toBe(false);
  });
});

describe('the caseload ceiling', () => {
  it('has room below the ceiling', () => {
    expect(isAttorneyAvailable(attorney({ maxActiveCases: 5, activeCaseCount: 4 }))).toBe(true);
  });

  it('is full AT the ceiling, not one past it', () => {
    // The off-by-one that would hand a "max 5" attorney a sixth case.
    expect(isAttorneyAvailable(attorney({ maxActiveCases: 5, activeCaseCount: 5 }))).toBe(false);
  });

  it('is full above the ceiling', () => {
    expect(isAttorneyAvailable(attorney({ maxActiveCases: 5, activeCaseCount: 9 }))).toBe(false);
  });

  it('treats a null ceiling as no ceiling', () => {
    expect(isAttorneyAvailable(attorney({ maxActiveCases: null, activeCaseCount: 999 }))).toBe(
      true,
    );
  });

  it('treats a zero ceiling as closed', () => {
    // Distinct from null. Someone setting 0 means "none right now".
    expect(isAttorneyAvailable(attorney({ maxActiveCases: 0, activeCaseCount: 0 }))).toBe(false);
  });
});

describe('firm capacity from its people', () => {
  it('is open when any attorney is available', () => {
    // Two of three paused does not close a firm.
    expect(
      firmHasRoutingCapacity([
        attorney({ routingPaused: true }),
        attorney({ acceptingReferrals: false }),
        attorney(),
      ]),
    ).toBe(true);
  });

  it('is closed only when every attorney is unavailable', () => {
    expect(
      firmHasRoutingCapacity([
        attorney({ routingPaused: true }),
        attorney({ maxActiveCases: 3, activeCaseCount: 3 }),
      ]),
    ).toBe(false);
  });

  it('is open for a firm with no attorney rows', () => {
    // Fail-open, deliberately. An empty roster is not an opt-out, and failing
    // closed would stop routing to every firm not yet fully set up.
    expect(firmHasRoutingCapacity([])).toBe(true);
  });
});

describe('the router actually consults capacity', () => {
  it('will not route to an eligible firm whose attorneys are all full', async () => {
    // The end-to-end version of the bug: eligibility passes, capacity does
    // not, and the exclusive lane must decline to hand over the case.
    const { makeInMemoryClients } = await import('@/engine/clients/inMemoryClients');
    const { resolveEligibleRoutingFirm } = await import(
      '@/engine/routing/createCaseForSession'
    );

    const clients = makeInMemoryClients();
    const db = clients.db as unknown as {
      lawFirms: Array<Record<string, unknown>>;
      adminLitigation: Array<Record<string, unknown>>;
      litigationFirmAssignments: Array<Record<string, unknown>>;
      setFirmCapacity: (id: string, rows: AttorneyCapacity[]) => void;
    };

    const FIRM = 'firm-1';
    const LIT = 'lit-1';
    db.lawFirms.push({ id: FIRM, status: 'active', isPilot: true, stripeCustomerId: null });
    db.adminLitigation.push({ id: LIT, leadFirmId: FIRM });
    db.litigationFirmAssignments.push({
      litigationListingId: LIT,
      lawFirmId: FIRM,
      receivesMatches: true,
    });

    // Roster present and every one of them closed.
    db.setFirmCapacity(FIRM, [attorney({ routingPaused: true })]);
    expect(await resolveEligibleRoutingFirm(clients, LIT)).toBeNull();

    // Same firm, one attorney free.
    db.setFirmCapacity(FIRM, [attorney({ routingPaused: true }), attorney()]);
    expect(await resolveEligibleRoutingFirm(clients, LIT)).toBe(FIRM);
  });
});
