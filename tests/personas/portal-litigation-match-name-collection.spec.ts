/**
 * Persona — litigation_match name-early / contact-late collection (criterion 5).
 *
 * The deterministic ATDD anchor for the Phase 5 prompt change is the
 * prompt-content test (tests/integration/litigationMatchContactCapture.test.ts).
 * THIS spec drives a real Ada conversation, whose turn-by-turn behavior depends
 * on the live LLM — inherently non-deterministic, so it stays `test.fixme`. The
 * authoritative behavioral verification is the manual "Niles v. Hilton" recipe
 * check (approval note 4), run on a deployed/preview Ada before Phase 5 is
 * declared done; this spec documents the same flow for an exploratory preview
 * run.
 *
 * Ref: .design/attorney-portal.md Phase 5; DO4; approval note 4.
 */

import { test, expect } from '@playwright/test';

test.fixme('Ada asks for the name early — before the qualifying questions begin', async ({ page }) => {
  // Preview/manual: open a Hilton-accessible-room opener, confirm the case fits,
  // then assert Ada asks for the user's name BEFORE posing qualifying question 1.
  await page.goto('/ada');
  await expect(page.getByRole('textbox')).toBeVisible();
  // ...drive the litigation_match opener; assert a name prompt precedes QQ #1...
});

test.fixme('Ada collects email + optional phone after the last qualifying question', async ({ page }) => {
  // Preview/manual: walk all qualifying questions, then assert the contact-
  // collection step (email required, phone optional) fires only after the last
  // qualifying question and before the session summary.
  await page.goto('/ada');
  await expect(page.getByRole('textbox')).toBeVisible();
  // ...complete the QQ sequence; assert email/phone ask comes last...
});
