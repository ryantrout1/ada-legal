/**
 * Unit — go-live readiness (computeReadiness). Test-first for /plan Phase 2.
 *
 * Required to go live: attorney name, email, bar number, >=1 licensed state
 * (home OR additional), plus firm name + firm email. Encodes AC4.
 */

import { describe, it, expect } from 'vitest';
import { computeReadiness, shouldEnforceApprovalGate } from '@/engine/portal/accountReadiness';

const fullAttorney = {
  name: 'Kelley Simoneaux',
  email: 'kelley@firm.com',
  barNumber: 'AZ-12345',
  locationState: 'AZ',
  additionalStates: [] as string[],
};
const fullFirm = { name: 'The Firm', email: 'firm@firm.com' };

function keys(r: { missing: { key: string }[] }) {
  return r.missing.map((m) => m.key);
}

describe('computeReadiness', () => {
  it('is ready when every required field is present', () => {
    const r = computeReadiness(fullAttorney, fullFirm);
    expect(r.ready).toBe(true);
    expect(r.missing).toHaveLength(0);
  });

  it('flags a missing bar number', () => {
    const r = computeReadiness({ ...fullAttorney, barNumber: '' }, fullFirm);
    expect(r.ready).toBe(false);
    expect(keys(r)).toContain('bar_number');
  });

  it('flags a missing email', () => {
    const r = computeReadiness({ ...fullAttorney, email: null }, fullFirm);
    expect(r.ready).toBe(false);
    expect(keys(r)).toContain('email');
  });

  it('flags a missing name', () => {
    const r = computeReadiness({ ...fullAttorney, name: '   ' }, fullFirm);
    expect(r.ready).toBe(false);
    expect(keys(r)).toContain('name');
  });

  it('accepts a licensed state from additional_states when home state is blank', () => {
    const r = computeReadiness(
      { ...fullAttorney, locationState: null, additionalStates: ['NV'] },
      fullFirm,
    );
    expect(keys(r)).not.toContain('licensed_state');
    expect(r.ready).toBe(true);
  });

  it('flags licensed_state when neither home nor additional states are set', () => {
    const r = computeReadiness(
      { ...fullAttorney, locationState: null, additionalStates: [] },
      fullFirm,
    );
    expect(r.ready).toBe(false);
    expect(keys(r)).toContain('licensed_state');
  });

  it('flags firm fields when no firm is linked', () => {
    const r = computeReadiness(fullAttorney, null);
    expect(r.ready).toBe(false);
    expect(keys(r)).toEqual(expect.arrayContaining(['firm_name', 'firm_email']));
  });

  it('flags firm email when the firm has none', () => {
    const r = computeReadiness(fullAttorney, { name: 'The Firm', email: null });
    expect(r.ready).toBe(false);
    expect(keys(r)).toContain('firm_email');
    expect(keys(r)).not.toContain('firm_name');
  });
});

describe('shouldEnforceApprovalGate — only the transition INTO approved is gated', () => {
  it('gates a genuine transition into approved', () => {
    expect(shouldEnforceApprovalGate('pending', 'approved')).toBe(true);
    expect(shouldEnforceApprovalGate('rejected', 'approved')).toBe(true);
    expect(shouldEnforceApprovalGate('archived', 'approved')).toBe(true);
  });

  it('does NOT gate re-saving an already-approved row (the bug this fixes)', () => {
    // The B44 form echoes status:'approved' on every edit of an approved
    // attorney; that must not re-trigger the readiness gate and block the save.
    expect(shouldEnforceApprovalGate('approved', 'approved')).toBe(false);
  });

  it('does not gate saves that are not setting status to approved', () => {
    expect(shouldEnforceApprovalGate('approved', 'pending')).toBe(false);
    expect(shouldEnforceApprovalGate('pending', 'rejected')).toBe(false);
  });
});
