/**
 * Data-logic test — portal queue selection (criterion 2).
 *
 * Mirrors the existing in-memory-client pattern (tests/unit/adminFirmList.test.ts):
 * seed `makeInMemoryClients`, exercise `listPortalQueueForFirm`, and assert the
 * summary counts + row shape. No React rendering — the rendered DOM is covered
 * by the Playwright persona (criterion 1).
 *
 * SHELL (Phase 1): `it.todo` placeholders only. `listPortalQueueForFirm` and
 * the `litigation_firm_assignments` / `firm_session_handled` in-memory mirrors
 * do not exist until Phase 2; the live `portalSeed` body also lands in Phase 2.
 * Phase 2 fills these bodies in and turns the suite green.
 *
 * Ref: .design/attorney-portal.md Phase 1 (test infra) → Phase 2 (data infra).
 */

import { describe, it } from 'vitest';

describe('listPortalQueueForFirm', () => {
  it.todo('returns only sessions whose litigation row is assigned to this firm');
  it.todo('excludes sessions assigned to other firms (firm-scoped boundary)');
  it.todo('summary.open_count counts assigned sessions with no firm_session_handled row for this firm');
  it.todo('summary.handled_count counts sessions this firm has marked handled');
  it.todo('marks handled_by_other_firm=true when another assigned firm handled the case');
  it.todo('marks handled_by_this_firm=true when this firm handled the case');
  it.todo('paginates by page / page_size and reports total_count');
  it.todo('honors the handled filter (false | true | all), defaulting to false');
});
