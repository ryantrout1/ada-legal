/**
 * gate.ts — pure exit-code logic for the verify:a11y wrapper.
 *
 * Kept separate from the wrapper script so the contract is unit-testable
 * without spawning a browser. The wrapper (scripts/verify-a11y.mjs)
 * duplicates this tiny logic in plain JS (it can't import TS at node
 * runtime); tests/unit/a11yGate.test.ts pins the TS side, and the rules
 * are simple enough that a comment keeps the two in sync.
 */

/**
 * The process exit code the gate should use, given the Playwright suite's
 * exit code. Exit with the suite's code so the gate fails iff the sweep
 * failed. A null/undefined code (crashed sweep, never produced a code) is
 * treated as a FAILURE (1) — a crashed audit must never read as green.
 */
export function finalExitCode(suiteExit: number | null | undefined): number {
  if (suiteExit === null || suiteExit === undefined) return 1;
  return suiteExit;
}

/**
 * Whether to write report v1. Always true — you want the defect list
 * exactly when the suite is red. Kept as a function so the contract is
 * explicit and testable rather than an implicit "always".
 */
export function shouldWriteReport(_suiteExit: number | null | undefined): boolean {
  return true;
}
