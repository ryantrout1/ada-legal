/**
 * Litigation label + state-display helpers.
 *
 * Ported from Base44 (src/components/litigation/litigationLabels.jsx
 * @ 6b1e9ac). Design authority is B44; changes are confined to the port
 * seams:
 *   - typed, and `normalizeStates` inlined rather than imported from
 *     B44's utils barrel
 *   - `PUBLIC_STATUS_ORDER` replaces B44's `STATUS_ORDER`: the public
 *     endpoint never returns draft/closed/archived, so offering `closed`
 *     as a filter option would render a choice that can never match
 *     (resolved decision, M3 Phase 2)
 *
 * `STATUS_LABELS` still carries `closed` — a stale inbound link or an
 * admin-side preview can still hand us one, and a raw enum value is a
 * worse thing to render than a friendly label.
 */

export type LitigationKindValue =
  | 'class'
  | 'consent_decree'
  | 'enforcement_action'
  | 'pattern_of_practice'
  | 'regulatory_challenge';

/** The four statuses the public endpoints can return. */
export type PublicLitigationStatus =
  | 'active'
  | 'investigating'
  | 'compliance'
  | 'tracking';

export const KIND_LABELS: Record<string, string> = {
  class: 'Class action',
  consent_decree: 'Consent decree',
  enforcement_action: 'Enforcement action',
  pattern_of_practice: 'Pattern of practice',
  regulatory_challenge: 'Regulatory challenge',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  investigating: 'Under investigation',
  compliance: 'In compliance/monitoring',
  tracking: 'Tracking',
  closed: 'Closed',
};

/** B44's kind ordering, preserved so the Type dropdown reads identically. */
export const KIND_ORDER: LitigationKindValue[] = [
  'class',
  'consent_decree',
  'enforcement_action',
  'pattern_of_practice',
  'regulatory_challenge',
];

/**
 * Status filter options. Ordered most-to-least active, matching the
 * order B44 used for the four it shares with us.
 */
export const PUBLIC_STATUS_ORDER: PublicLitigationStatus[] = [
  'active',
  'investigating',
  'compliance',
  'tracking',
];

/**
 * Sentinel stored in affected_states to mark a nationwide row. The
 * public API normalizes it away, but the front end strips it too so
 * display never depends on the API/CDN cache state — same reasoning as
 * B44's own comment on this constant.
 */
export const NATIONWIDE_SENTINEL = '__nationwide__';

export function kindLabel(kind: string | null | undefined): string {
  if (!kind) return '';
  return KIND_LABELS[kind] ?? kind;
}

export function statusLabel(status: string | null | undefined): string {
  if (!status) return '';
  return STATUS_LABELS[status] ?? status;
}

/** Affected states for display — sentinel stripped; empty means nationwide. */
export function statesList(
  rawStates: readonly string[] | null | undefined,
): string[] {
  if (!rawStates) return [];
  return rawStates.filter((s) => s !== NATIONWIDE_SENTINEL);
}

export function statesLabel(
  rawStates: readonly string[] | null | undefined,
): string {
  const list = statesList(rawStates);
  return list.length === 0 ? 'Nationwide' : list.join(', ');
}

/** True when a row covers every state (empty list or sentinel only). */
export function isNationwide(
  rawStates: readonly string[] | null | undefined,
): boolean {
  return statesList(rawStates).length === 0;
}
