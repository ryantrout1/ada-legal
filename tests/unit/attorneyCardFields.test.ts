/**
 * M4 Phase 1 — attorney card field resolution.
 *
 * WHY THIS EXISTS: the live roster is four attorneys at one firm, and
 * the data is thin — one of four has a bio, none has a website on the
 * attorney row, none has specialty tags, none has bar-licensure states.
 * B44's card has six sections. Against this data most of them are
 * empty, and an empty section that still renders its heading looks
 * broken in a way that reads as "this site doesn't work" rather than
 * "this attorney hasn't filled in their profile."
 *
 * So the render decisions live in a pure mapper and get tested against
 * the sparse shape explicitly, rather than being discovered on the
 * page.
 *
 * Ref: /plan M4 Phase 1, AC3 + AC4.
 */

import { describe, it, expect } from 'vitest';
import {
  toCardFields,
  getInitials,
  normalizeUrl,
} from '@/app/lib/attorneyCardFields';
import type { PublicAttorneyRow } from '@/app/lib/attorneyTypes';

function row(overrides: Partial<PublicAttorneyRow> = {}): PublicAttorneyRow {
  return {
    id: 'a1',
    name: 'Kelley Brooks Simoneaux',
    firm_name: 'The Spinal Cord Injury Law Firm',
    location_city: 'Washington',
    location_state: 'DC',
    practice_areas: ['ada', 'civil_rights'],
    specialty_tags: [],
    states_of_practice: [],
    bio: 'Founder of the firm.',
    email: 'kelley@example.com',
    phone: '(202) 507-9180',
    website_url: 'spinalcordinjurylawyers.com',
    ...overrides,
  };
}

describe('getInitials', () => {
  it('takes first and last initial', () => {
    expect(getInitials('Kelley Brooks Simoneaux')).toBe('KS');
    expect(getInitials('Josh Basile')).toBe('JB');
  });

  it('handles a single name', () => {
    expect(getInitials('Cher')).toBe('C');
  });

  it('never renders empty for a missing name', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials(null)).toBe('?');
    expect(getInitials('   ')).toBe('?');
  });
});

describe('normalizeUrl', () => {
  it('adds a scheme when the admin entered a bare domain', () => {
    expect(normalizeUrl('spinalcordinjurylawyers.com')).toBe(
      'https://spinalcordinjurylawyers.com',
    );
  });

  it('leaves an explicit scheme alone', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
  });

  it('returns null for nothing usable', () => {
    expect(normalizeUrl(null)).toBeNull();
    expect(normalizeUrl('')).toBeNull();
    expect(normalizeUrl('   ')).toBeNull();
  });
});

describe('toCardFields — full row', () => {
  const f = toCardFields(row());

  it('joins city and state into one location line', () => {
    expect(f.location).toBe('Washington, DC');
  });

  it('merges practice areas and specialty tags into one chip list', () => {
    const full = toCardFields(row({ specialty_tags: ['wheelchair_access'] }));
    expect(full.chips).toEqual(['ada', 'civil_rights', 'wheelchair_access']);
  });

  it('decides every optional section is renderable', () => {
    expect(f.showLocation).toBe(true);
    expect(f.showChips).toBe(true);
    expect(f.showBio).toBe(true);
    expect(f.showContact).toBe(true);
  });
});

describe('toCardFields — sparse row (the live shape)', () => {
  // Three of the four live attorneys look like this.
  const sparse = toCardFields(
    row({
      location_city: null,
      location_state: null,
      bio: null,
      phone: null,
      website_url: null,
      practice_areas: [],
      specialty_tags: [],
      states_of_practice: [],
    }),
  );

  it('suppresses the location line entirely rather than rendering a comma', () => {
    expect(sparse.location).toBe('');
    expect(sparse.showLocation).toBe(false);
  });

  it('suppresses the chip section rather than rendering an empty heading', () => {
    expect(sparse.chips).toEqual([]);
    expect(sparse.showChips).toBe(false);
  });

  it('suppresses the licensure section when no bar states are recorded', () => {
    expect(sparse.showStates).toBe(false);
  });

  it('suppresses the bio', () => {
    expect(sparse.showBio).toBe(false);
  });

  it('still renders the contact block when only email survives', () => {
    // Email is the one field every live row has. Losing the contact
    // block would make the directory useless.
    expect(sparse.showContact).toBe(true);
    expect(sparse.website).toBeNull();
  });

  it('suppresses the contact block when there is no way to make contact', () => {
    const unreachable = toCardFields(
      row({ email: null, phone: null, website_url: null }),
    );
    expect(unreachable.showContact).toBe(false);
  });

  it('drops empty strings from the chip list', () => {
    const messy = toCardFields(row({ practice_areas: ['', 'ada'], specialty_tags: [''] }));
    expect(messy.chips).toEqual(['ada']);
  });

  it('strips punctuation from the tel: href but not the label', () => {
    const f = toCardFields(row());
    expect(f.telHref).toBe('tel:2025079180');
    expect(f.phoneLabel).toBe('(202) 507-9180');
  });
});
