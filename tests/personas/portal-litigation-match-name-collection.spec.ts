/**
 * Persona — litigation_match name-early / contact-late collection (criterion 5).
 *
 * Drives an Ada conversation down the litigation_match flow and asserts the
 * end-to-end collection ordering the portal depends on: Ada collects the
 * user's NAME early (after the first substantive turn, before qualifying
 * questions) and EMAIL + optional PHONE at the END of the qualifying
 * questions. This is the browser-level companion to the runtime Neon check
 * in tests/integration/litigationMatchContactCapture.test.ts.
 *
 * SHELL (Phase 1): authored as `test.fixme` — the name-early prompt block
 * lands in Phase 5 (content-migration/prompts/ada-identity.md). Phase 5
 * flips these to live `test(...)` and fills the conversational steps.
 *
 * Ref: .design/attorney-portal.md Phase 1 (test infra) → Phase 5 (prompt).
 */

import { test, expect } from '@playwright/test';

test.fixme('Ada asks for name early in a litigation_match conversation', async ({ page }) => {
  // TODO(Phase 5): open a deep-linked litigation listing, send the first
  // substantive turn, and assert Ada's next prompt asks for the user's name
  // BEFORE any qualifying question is posed.
  await page.goto('/chat');
  await expect(page.getByRole('textbox')).toBeVisible();
});

test.fixme('Ada collects email + optional phone at the end of qualifying questions', async ({ page }) => {
  // TODO(Phase 5): walk the full qualifying-question sequence for the matched
  // litigation row, then assert the contact-collection step (email required,
  // phone optional) fires only after the last qualifying question.
  await page.goto('/chat');
  await expect(page.getByRole('textbox')).toBeVisible();
});
