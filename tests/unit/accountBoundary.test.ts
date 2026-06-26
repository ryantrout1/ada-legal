/**
 * Unit — account field boundary (filterAccountPatch).
 *
 * Encodes /plan Phase 1 AC3: sensitive fields are rejected (not dropped),
 * allowed fields are mapped/coerced, unknown keys are ignored.
 */

import { describe, it, expect } from 'vitest';
import { filterAccountPatch } from '@/engine/portal/accountBoundary';

describe('filterAccountPatch — allowed fields', () => {
  it('maps + coerces allowed attorney and firm fields', () => {
    const r = filterAccountPatch({
      attorney: {
        name: '  Kelley Simoneaux  ',
        location_state: 'az',
        additional_states: ['nv', 'ca'],
        practice_areas: ['ada', 'employment'],
        specialty_tags: ['spinal'],
        email: 'k@firm.com',
        bio: 'Trial lawyer.',
        accepting_referrals: false,
        routing_paused: true,
        max_active_cases: '25',
      },
      firm: { name: '  The Firm  ', primary_contact: 'Kelley', email: 'firm@firm.com' },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.attorneyPatch.name).toBe('Kelley Simoneaux');
    expect(r.attorneyPatch.locationState).toBe('AZ');
    expect(r.attorneyPatch.additionalStates).toEqual(['NV', 'CA']);
    expect(r.attorneyPatch.practiceAreas).toEqual(['ada', 'employment']);
    expect(r.attorneyPatch.specialtyTags).toEqual(['spinal']);
    expect(r.attorneyPatch.acceptingReferrals).toBe(false);
    expect(r.attorneyPatch.routingPaused).toBe(true);
    expect(r.attorneyPatch.maxActiveCases).toBe(25);
    expect(r.firmPatch.name).toBe('The Firm');
    expect(r.firmPatch.primaryContact).toBe('Kelley');
    expect(r.firmPatch.email).toBe('firm@firm.com');
  });

  it('treats blank max_active_cases as null (no limit)', () => {
    const r = filterAccountPatch({ attorney: { max_active_cases: '' } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.attorneyPatch.maxActiveCases).toBeNull();
  });

  it('ignores unknown / not-exposed keys without failing', () => {
    const r = filterAccountPatch({
      attorney: { firm_name: 'legacy', created_at: 'x', name: 'Jo' },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.attorneyPatch.name).toBe('Jo');
    expect('firmName' in r.attorneyPatch).toBe(false);
  });
});

describe('filterAccountPatch — sensitive fields are rejected', () => {
  it.each([
    ['status', { attorney: { status: 'approved' } }, 'attorney.status'],
    ['approved_by', { attorney: { approved_by: 'x' } }, 'attorney.approved_by'],
    ['user_id', { attorney: { user_id: 'x' } }, 'attorney.user_id'],
    ['law_firm_id', { attorney: { law_firm_id: 'x' } }, 'attorney.law_firm_id'],
    ['org_id', { attorney: { org_id: 'x' } }, 'attorney.org_id'],
    ['firm.status', { firm: { status: 'suspended' } }, 'firm.status'],
    ['firm.is_pilot', { firm: { is_pilot: true } }, 'firm.is_pilot'],
    ['firm.stripe', { firm: { stripe_customer_id: 'cus_1' } }, 'firm.stripe_customer_id'],
  ])('rejects %s', (_label, body, key) => {
    const r = filterAccountPatch(body);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.forbidden).toContain(key);
  });

  it('rejects the whole patch when a sensitive field rides alongside allowed ones (no partial write)', () => {
    const r = filterAccountPatch({
      attorney: { name: 'Legit', status: 'approved' },
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.forbidden).toContain('attorney.status');
  });
});
