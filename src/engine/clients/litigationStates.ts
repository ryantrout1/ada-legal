/**
 * Affected-states normalization for litigation rows.
 *
 * Data waves 2–5 (migrations 0015–0018) encode "nationwide" as a
 * non-empty `affected_states` array carrying the `__nationwide__`
 * sentinel, so those rows pass the existing `length > 0` checks.
 * Wave 1 (e.g. migration 0012, Niles v. Hilton) uses an empty array,
 * which the public/prompt renderers already treat as nationwide.
 *
 * Nothing on the read side ever mapped the sentinel back to a label,
 * so wave 2–5 rows leaked the literal `__nationwide__` token onto the
 * public detail page and into Ada's prompt context. This collapses the
 * sentinel to the empty-array convention at the public/prompt read
 * boundary, so every nationwide row — regardless of wave — flows
 * through the same `length === 0 → "nationwide"` branch.
 *
 * Kept dependency-free (no DB imports) so it is unit-testable in
 * isolation and reusable by both the row mapper and the state filter.
 */

/** Sentinel stored in `affected_states` to mark a nationwide row. */
export const NATIONWIDE_SENTINEL = '__nationwide__';

/**
 * Strip the nationwide sentinel from an affected-states array.
 *
 * - `['__nationwide__']`        → `[]`   (nationwide, via empty-array convention)
 * - `[]` / null / undefined     → `[]`
 * - `['__nationwide__', 'CA']`  → `['CA']` (defensive: keep real states, drop sentinel)
 * - `['CA', 'TX']`              → `['CA', 'TX']` (unchanged)
 *
 * Intended for the PUBLIC and PROMPT read surfaces only. The admin/edit
 * surface must keep the raw value so editors don't lose the sentinel on
 * save.
 */
export function normalizeAffectedStates(
  states: readonly string[] | null | undefined,
): string[] {
  if (!states) return [];
  return states.filter((s) => s !== NATIONWIDE_SENTINEL);
}
