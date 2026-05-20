/**
 * Integration test — litigation_match contact capture (criterion 5).
 *
 * Runtime check that, after a scripted litigation_match conversation, the
 * session's extracted_fields carry claimant_name (collected early) and
 * claimant_email (collected at the end of qualifying questions), with
 * claimant_phone optional. Follows the existing DB-inspection pattern
 * (tests/integration/finalizeIntakeHandoff.test.ts).
 *
 * The "name was collected early" assertion compares the claimant_name
 * extracted_at timestamp against when match_litigation's tool result landed
 * in conversation_history (see .design verification recipe for criterion 5).
 *
 * SHELL (Phase 1): `it.todo` placeholders only. The name-early prompt block
 * lands in Phase 5; this body fills in then as the ATDD anchor.
 *
 * Ref: .design/attorney-portal.md Phase 1 (test infra) → Phase 5 (prompt).
 */

import { describe, it } from 'vitest';

describe('litigation_match contact capture', () => {
  it.todo('stores claimant_name in extracted_fields after the early name-collection turn');
  it.todo('claimant_name.extracted_at precedes the match_litigation tool result timestamp (name collected early)');
  it.todo('stores claimant_email in extracted_fields after the final qualifying question');
  it.todo('stores claimant_phone when the user provides it (optional field)');
  it.todo('leaves claimant_phone absent when the user declines to provide it');
});
