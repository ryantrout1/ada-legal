/**
 * Go-live readiness (portal Account, /plan Phase 2).
 *
 * An attorney is ready to go live when their profile + firm carry the minimum
 * a matched claimant relies on: a name, a contact email, a bar number, at
 * least one licensed state (home OR additional), and a firm with a name +
 * email. This is observation only — "live" itself is the admin's status flip
 * (pending -> approved), which the admin approve-gate blocks until ready.
 *
 * Pure + loosely-typed so both AttorneyAdminRow and merged projections (the
 * admin gate computes readiness on existing+patch) can be passed in.
 */

export interface ReadinessAttorney {
  name?: string | null;
  email?: string | null;
  barNumber?: string | null;
  locationState?: string | null;
  additionalStates?: string[] | null;
}

export interface ReadinessFirm {
  name?: string | null;
  email?: string | null;
}

export interface ReadinessItem {
  key: string;
  label: string;
}

export interface Readiness {
  ready: boolean;
  missing: ReadinessItem[];
}

function blank(v: string | null | undefined): boolean {
  return v == null || v.trim().length === 0;
}

export function computeReadiness(
  attorney: ReadinessAttorney,
  firm: ReadinessFirm | null,
): Readiness {
  const missing: ReadinessItem[] = [];

  if (blank(attorney.name)) missing.push({ key: 'name', label: 'Your name' });
  if (blank(attorney.email)) missing.push({ key: 'email', label: 'Your email' });
  if (blank(attorney.barNumber)) missing.push({ key: 'bar_number', label: 'Bar number' });

  const hasState =
    !blank(attorney.locationState) ||
    (Array.isArray(attorney.additionalStates) && attorney.additionalStates.length > 0);
  if (!hasState) missing.push({ key: 'licensed_state', label: 'At least one licensed state' });

  if (!firm || blank(firm.name)) missing.push({ key: 'firm_name', label: 'Firm name' });
  if (!firm || blank(firm.email)) missing.push({ key: 'firm_email', label: 'Firm email' });

  return { ready: missing.length === 0, missing };
}

/**
 * Whether a PATCH that sets status to `nextStatus` must pass the go-live
 * readiness gate. Only a transition INTO approved is gated — re-saving a
 * row that is ALREADY approved (even an incomplete one) must be allowed,
 * so an admin editing an already-approved attorney isn't locked out of
 * unrelated edits by the gate. Genuine approvals (pending/rejected/
 * archived -> approved) still run the gate.
 */
export function shouldEnforceApprovalGate(
  existingStatus: string,
  nextStatus: string,
): boolean {
  return nextStatus === 'approved' && existingStatus !== 'approved';
}
