/**
 * Firm ownership guards (/plan Phase 3.2).
 *
 * Pure helpers around the one invariant that matters: a firm must never be
 * left with zero owners. canStepDown enforces it for the step-down path.
 */

export interface RosterRole {
  id: string;
  firmRole?: string;
}

export function ownerIds(roster: RosterRole[]): string[] {
  return roster.filter((a) => (a.firmRole ?? 'member') === 'owner').map((a) => a.id);
}

/** An owner may step down only while another owner remains. */
export function canStepDown(roster: RosterRole[], callerId: string): boolean {
  const owners = ownerIds(roster);
  return owners.includes(callerId) && owners.some((id) => id !== callerId);
}

/**
 * An attorney can be removed from the firm unless doing so would leave the
 * firm with zero owners. Members are always removable; an owner is removable
 * only while another owner remains. (Archived rows must be filtered out of
 * `roster` before calling — they are not part of the live firm.)
 */
export function canRemoveAttorney(roster: RosterRole[], targetId: string): boolean {
  const owners = ownerIds(roster);
  if (owners.includes(targetId) && owners.length <= 1) return false;
  return true;
}
