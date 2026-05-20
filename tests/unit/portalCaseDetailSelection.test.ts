/**
 * Data-logic test — portal case detail selection (criterion 3).
 *
 * Mirrors the in-memory-client pattern (tests/unit/adminFirmList.test.ts):
 * seed `makeInMemoryClients`, exercise `getPortalCaseForFirm`, and assert the
 * full case-package shape plus the firm-scoped access boundary. No React
 * rendering — the rendered DOM is covered by the Playwright persona.
 *
 * SHELL (Phase 1): `it.todo` placeholders only. `getPortalCaseForFirm` and the
 * new-table in-memory mirrors do not exist until Phase 2; the live `portalSeed`
 * body also lands in Phase 2. Phase 2 fills these bodies in.
 *
 * Ref: .design/attorney-portal.md Phase 1 (test infra) → Phase 2 (data infra).
 */

import { describe, it } from 'vitest';

describe('getPortalCaseForFirm', () => {
  it.todo('returns the matched case name from the bound litigation_listings row');
  it.todo('returns contact info (claimant_name, claimant_email, optional claimant_phone) from extracted_fields');
  it.todo('returns the qualifying-question answers parsed per the litigation row ada_qualifying_questions shape');
  it.todo('returns a transcript reference for the session');
  it.todo('rejects access when the firm has no assignment for the case litigation row');
  it.todo('rejects access for a session not bound to any litigation row');
});
