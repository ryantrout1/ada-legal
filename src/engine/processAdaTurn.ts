/**
 * processAdaTurn — the engine entry point.
 *
 * Takes the current session state + a user input + an AdaClients bundle,
 * and returns the next state + assistant message.
 *
 * Pure contract (at the engine boundary):
 *   - Never throws for user-fixable errors; those surface as assistant
 *     messages with appropriate tool results.
 *   - Deterministic given fixed clients. (If you pass InMemoryClients with
 *     scripted responses, you get the same output every run.)
 *   - Does NOT touch the DB directly; it calls clients.db.
 *
 * Shell-only in Phase A Step 3. The body fills in as we build:
 *   - Step 6 — state machine + session persistence
 *   - Step 7 — tool executor
 *   - Step 8 — prompt assembler integration
 *   - Step 9 — streaming AI
 *
 * Ref: docs/ARCHITECTURE.md §6
 */

import type { AdaClients } from './clients/types';
import type { AdaSessionState, AdaTurnInput, AdaTurnResult } from './types';

export interface ProcessAdaTurnParams {
  clients: AdaClients;
  state: AdaSessionState;
  input: AdaTurnInput;
}

export async function processAdaTurn(
  _params: ProcessAdaTurnParams,
): Promise<AdaTurnResult> {
  throw new Error(
    'processAdaTurn: not yet implemented. See Phase A Steps 6-9 in ARCHITECTURE.md.',
  );
}
