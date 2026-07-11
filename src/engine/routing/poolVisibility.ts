/**
 * Pool jurisdiction visibility (routing rebuild R4).
 *
 * A firm sees a pool case only when it covers the case's jurisdiction. Coverage
 * is: the firm serves nationwide, OR the case state is the firm's home state
 * (locationState), OR it is one of its additionalStates. A case with no
 * jurisdiction snapshot (null/blank state) is visible to everyone — we can't
 * filter it, so we don't hide it.
 *
 * Pure + case-insensitive on the two-letter/we-store-as-given state value.
 *
 * Ref: /plan "Self-select pool (R4)", Phase 1 (D2: jurisdiction filter on).
 */

import type { LawFirmRow } from '../clients/types.js';

export function firmCoversState(firm: LawFirmRow, caseState: string | null): boolean {
  if (firm.servesNationwide === true) return true;
  const state = (caseState ?? '').trim();
  if (state === '') return true; // no jurisdiction to filter on → visible to all

  const norm = (s: string) => s.trim().toLowerCase();
  const target = norm(state);
  if (firm.locationState && norm(firm.locationState) === target) return true;
  return (firm.additionalStates ?? []).some((s) => norm(s) === target);
}
