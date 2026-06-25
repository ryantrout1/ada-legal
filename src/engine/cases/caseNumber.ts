/**
 * Case-number formatter.
 *
 * A case carries a human-facing `case_number` of the form `CASE-NNNN`. The
 * numeric part comes from the Postgres sequence `case_number_seq` (created in
 * migration 0023) so allocation is atomic and gap-tolerant under concurrency.
 * This module is the pure formatting half: the DB hands us `nextval`, we turn
 * it into the label.
 *
 * v1 is a single global sequence (per-org / per-firm numbering is deferred —
 * see /plan Phase 0 open decisions). The numeric part is left-padded to four
 * digits and grows naturally past 9999 (no truncation).
 *
 * Ref: /plan Phase 0.
 */

/** Format a monotonic sequence value as `CASE-NNNN`. Throws on non-positive-integer input. */
export function formatCaseNumber(seq: number): string {
  if (!Number.isInteger(seq) || seq < 1) {
    throw new Error(`Invalid case sequence value: ${seq}. Expected a positive integer.`);
  }
  return `CASE-${String(seq).padStart(4, '0')}`;
}
