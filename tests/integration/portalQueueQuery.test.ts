/**
 * Integration test — portal queue query join + gray-out semantics (criteria 2, 4, 6).
 *
 * Exercises the data plane behind GET /api/portal/queue: the join of
 * litigation_firm_assignments ⨝ ada_sessions, scoped to a firm, with
 * firm_session_handled driving the gray-out flags. Covers the cross-firm
 * shared-case behavior (criterion 6) and the admin-assignment → queue
 * surfacing path (criterion 4) at the data layer.
 *
 * SHELL (Phase 1): `it.todo` placeholders only. The reader method, the new
 * tables/in-memory mirrors, and the live `portalSeed` body land in Phase 2;
 * the negative-path auth boundary is asserted again at the endpoint in Phase 3.
 *
 * Ref: .design/attorney-portal.md Phase 1 (test infra) → Phase 2/3.
 */

import { describe, it } from 'vitest';

describe('portal queue query (litigation_firm_assignments ⨝ ada_sessions)', () => {
  it.todo('surfaces a session in the queue of every firm assigned to its litigation row');
  it.todo('does not surface a session to a firm with no assignment for its litigation row');
  it.todo('grays out a shared case for Firm A when Firm B has a firm_session_handled row');
  it.todo('keeps the case ungrayed for the firm that has not handled it');
  it.todo('an admin assignment (litigation_firm_assignments insert) makes a bound session appear in that firm queue');
  it.todo('an attorney at Firm A cannot retrieve a session whose litigation row is assigned only to Firm B');
});
