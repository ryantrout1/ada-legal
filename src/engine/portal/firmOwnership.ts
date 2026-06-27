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
