/**
 * Unit — mergeFirmPatch (edit-every-detail firm PATCH).
 *
 * The invariants:
 *   1. Every editable field is accepted and applied (core + public face).
 *   2. undefined-means-keep: an unrelated PATCH must NOT wipe the
 *      public-face fields — the regression this seam exists to prevent
 *      (the handler used to spread `...existing` where optional fields
 *      could be undefined and later coalesce to null on write).
 *   3. null / '' clears nullable fields.
 *   4. Malformed values are rejected with a 400-able error, not silently
 *      dropped.
 */

import { describe, it, expect } from 'vitest';
import { mergeFirmPatch } from '@/engine/firmPatch';
import type { LawFirmRow } from '@/engine/clients/types';

const FULL: LawFirmRow = {
  id: '00000000-0000-4000-8000-00000000ff01',
  orgId: '00000000-0000-4000-8000-0000000000a1',
  name: 'The Spinal Cord Injury Law Firm',
  primaryContact: 'Kelley Brooks Simoneaux',
  email: 'info@example.com',
  phone: '1-877-000-0000',
  stripeCustomerId: 'cus_123',
  status: 'active',
  isPilot: true,
  websiteUrl: 'https://example.com',
  description: 'A firm.',
  logoUrl: 'https://example.com/logo.png',
  locationCity: 'Washington',
  locationState: 'DC',
  practiceAreas: ['ADA'],
  additionalStates: ['MD', 'VA'],
  servesNationwide: true,
};

describe('mergeFirmPatch', () => {
  it('applies every editable field (core + public face)', () => {
    const r = mergeFirmPatch(FULL, {
      name: '  New Name  ',
      primary_contact: 'New Contact',
      email: 'new@example.com',
      phone: '555-1234',
      stripe_customer_id: 'cus_456',
      status: 'suspended',
      is_pilot: false,
      website_url: 'https://new.example.com',
      description: 'Updated.',
      logo_url: 'https://new.example.com/logo.svg',
      location_city: 'Phoenix',
      location_state: 'AZ',
      practice_areas: ['ADA', 'Civil Rights'],
      additional_states: ['NM'],
      serves_nationwide: false,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.updated).toMatchObject({
      name: 'New Name', // trimmed
      primaryContact: 'New Contact',
      email: 'new@example.com',
      phone: '555-1234',
      stripeCustomerId: 'cus_456',
      status: 'suspended',
      isPilot: false,
      websiteUrl: 'https://new.example.com',
      description: 'Updated.',
      logoUrl: 'https://new.example.com/logo.svg',
      locationCity: 'Phoenix',
      locationState: 'AZ',
      practiceAreas: ['ADA', 'Civil Rights'],
      additionalStates: ['NM'],
      servesNationwide: false,
    });
    // Identity is never patchable.
    expect(r.updated.id).toBe(FULL.id);
    expect(r.updated.orgId).toBe(FULL.orgId);
  });

  it('undefined-means-keep: an unrelated patch preserves the public face', () => {
    const r = mergeFirmPatch(FULL, { status: 'churned' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.updated.status).toBe('churned');
    // Nothing else moved — especially not the public-face fields.
    expect(r.updated.websiteUrl).toBe(FULL.websiteUrl);
    expect(r.updated.description).toBe(FULL.description);
    expect(r.updated.logoUrl).toBe(FULL.logoUrl);
    expect(r.updated.locationCity).toBe(FULL.locationCity);
    expect(r.updated.locationState).toBe(FULL.locationState);
    expect(r.updated.practiceAreas).toEqual(FULL.practiceAreas);
    expect(r.updated.additionalStates).toEqual(FULL.additionalStates);
    expect(r.updated.servesNationwide).toBe(FULL.servesNationwide);
    expect(r.updated.name).toBe(FULL.name);
    expect(r.updated.isPilot).toBe(FULL.isPilot);
  });

  it('defaults optional public-face fields sanely when existing omits them', () => {
    // A row read from an older codepath may omit the optional fields;
    // an unrelated patch must produce concrete values, not undefined.
    const minimal: LawFirmRow = {
      id: FULL.id,
      orgId: FULL.orgId,
      name: 'Minimal Firm',
      primaryContact: null,
      email: null,
      phone: null,
      stripeCustomerId: null,
      status: 'active',
      isPilot: false,
    };
    const r = mergeFirmPatch(minimal, { phone: '555-0000' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.updated.phone).toBe('555-0000');
    expect(r.updated.websiteUrl).toBeNull();
    expect(r.updated.description).toBeNull();
    expect(r.updated.logoUrl).toBeNull();
    expect(r.updated.locationCity).toBeNull();
    expect(r.updated.locationState).toBeNull();
    expect(r.updated.practiceAreas).toEqual([]);
    expect(r.updated.additionalStates).toEqual([]);
    expect(r.updated.servesNationwide).toBe(false);
  });

  it('null clears nullable fields', () => {
    const r = mergeFirmPatch(FULL, {
      website_url: null,
      description: null,
      logo_url: null,
      location_city: null,
      location_state: null,
      primary_contact: null,
      stripe_customer_id: null,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.updated.websiteUrl).toBeNull();
    expect(r.updated.description).toBeNull();
    expect(r.updated.logoUrl).toBeNull();
    expect(r.updated.locationCity).toBeNull();
    expect(r.updated.locationState).toBeNull();
    expect(r.updated.primaryContact).toBeNull();
    expect(r.updated.stripeCustomerId).toBeNull();
  });

  it('rejects malformed values instead of silently keeping old ones', () => {
    expect(mergeFirmPatch(FULL, { status: 'closed' }).ok).toBe(false);
    expect(mergeFirmPatch(FULL, { is_pilot: 'yes' }).ok).toBe(false);
    expect(mergeFirmPatch(FULL, { serves_nationwide: 'yes' }).ok).toBe(false);
    expect(mergeFirmPatch(FULL, { practice_areas: 'ADA' }).ok).toBe(false);
    expect(mergeFirmPatch(FULL, { practice_areas: [1, 2] }).ok).toBe(false);
    expect(mergeFirmPatch(FULL, { additional_states: 'MD' }).ok).toBe(false);
    expect(mergeFirmPatch(FULL, { name: '   ' }).ok).toBe(false);
    expect(mergeFirmPatch(FULL, { name: 7 }).ok).toBe(false);
  });
});
