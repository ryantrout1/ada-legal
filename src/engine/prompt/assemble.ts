/**
 * Prompt assembler.
 *
 * Given a session context, returns the system prompt text for that turn.
 * Pure, deterministic, no I/O. Tests call it directly with hand-built
 * contexts and assert on the returned string.
 *
 * Full assembly logic lands in Phase A Step 8. This shell pins the
 * signature so engine code that needs to reference it can do so now.
 *
 * The base prompt text itself migrates verbatim from the Base44 Ada intake
 * prompt (see /content-migration/prompts/ once Step 4 loads content).
 *
 * Ref: docs/ARCHITECTURE.md §8
 */

import type { AdaSessionState } from '../types';

export interface AssemblePromptContext {
  state: AdaSessionState;
  /** Org-level customization, supplied by the caller from the organizations row. */
  orgDisplayName: string;
  orgAdaIntroPrompt: string | null;
  /** Ch1: listing-specific overlay. Null for public Ch0 sessions. */
  listingAdaPromptOverride?: string | null;
}

export function assemblePrompt(_ctx: AssemblePromptContext): string {
  throw new Error(
    'assemblePrompt: not yet implemented (Phase A Step 8).',
  );
}
