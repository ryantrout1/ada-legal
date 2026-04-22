/**
 * Tests for the routing destinations registry.
 *
 * These tests codify the routing decisions made in destinations.ts.
 * When routing rules change, update the tests first so the intent is
 * captured, then change the implementation.
 *
 * Ref: Step 18, Commit 2.
 */

import { describe, it, expect } from 'vitest';
import {
  routeFor,
  EEOC_TITLE_I,
  DOJ_TITLE_II,
  DOJ_TITLE_III,
  TITLE_III_DEMAND_LETTER,
  TITLE_III_ATTORNEY,
  ADA_INFO_LINE,
  REGIONAL_ADA_CENTERS,
  STATE_CIVIL_RIGHTS_OFFICES,
  SOURCES_LAST_VERIFIED,
} from '../../src/engine/routing/destinations.js';

describe('routing: Title I (employment)', () => {
  it('primary is EEOC, regardless of state', () => {
    expect(routeFor({ title: 'I' }).primary.id).toBe(EEOC_TITLE_I.id);
    expect(routeFor({ title: 'I', state: 'AZ' }).primary.id).toBe(EEOC_TITLE_I.id);
  });

  it('adds state civil-rights office as an alternate when state has one', () => {
    const route = routeFor({ title: 'I', state: 'AZ' });
    expect(route.alternates.map((d) => d.id)).toContain('az_civil_rights');
  });

  it('omits state alternate when state is unknown', () => {
    const route = routeFor({ title: 'I' });
    expect(route.alternates).toHaveLength(0);
  });

  it('omits state alternate when state has no registered office', () => {
    const route = routeFor({ title: 'I', state: 'WY' });
    expect(route.alternates).toHaveLength(0);
  });

  it('info always includes the ADA Information Line', () => {
    const route = routeFor({ title: 'I' });
    expect(route.info.map((d) => d.id)).toContain(ADA_INFO_LINE.id);
  });
});

describe('routing: Title II (government)', () => {
  it('primary is DOJ', () => {
    expect(routeFor({ title: 'II' }).primary.id).toBe(DOJ_TITLE_II.id);
  });

  it('info includes both info line and regional centers', () => {
    const route = routeFor({ title: 'II' });
    expect(route.info.map((d) => d.id)).toEqual(
      expect.arrayContaining([ADA_INFO_LINE.id, REGIONAL_ADA_CENTERS.id]),
    );
  });
});

describe('routing: Title III (public accommodation)', () => {
  describe('with a matched attorney', () => {
    it('primary is the attorney handoff', () => {
      const route = routeFor({ title: 'III', attorneyMatched: true });
      expect(route.primary.id).toBe(TITLE_III_ATTORNEY.id);
    });

    it('alternates include demand letter and DOJ (in that order)', () => {
      const route = routeFor({ title: 'III', attorneyMatched: true });
      const altIds = route.alternates.map((d) => d.id);
      expect(altIds[0]).toBe(TITLE_III_DEMAND_LETTER.id);
      expect(altIds[1]).toBe(DOJ_TITLE_III.id);
    });

    it('state civil-rights office appended after DOJ when state has one', () => {
      const route = routeFor({ title: 'III', state: 'AZ', attorneyMatched: true });
      const altIds = route.alternates.map((d) => d.id);
      expect(altIds).toContain('az_civil_rights');
      // az_civil_rights should come after DOJ
      expect(altIds.indexOf('az_civil_rights')).toBeGreaterThan(altIds.indexOf(DOJ_TITLE_III.id));
    });
  });

  describe('without a matched attorney', () => {
    it('primary is the demand letter, NOT the DOJ', () => {
      // This is the core Title III design decision: a demand letter
      // resolves many cases; the DOJ pursues few. Giving the user
      // the demand letter as primary is leverage.
      const route = routeFor({ title: 'III' });
      expect(route.primary.id).toBe(TITLE_III_DEMAND_LETTER.id);
    });

    it('DOJ is an alternate', () => {
      const route = routeFor({ title: 'III' });
      expect(route.alternates.map((d) => d.id)).toContain(DOJ_TITLE_III.id);
    });

    it('attorney handoff is NOT surfaced when no attorney matched', () => {
      const route = routeFor({ title: 'III' });
      const allIds = [
        route.primary.id,
        ...route.alternates.map((d) => d.id),
        ...route.info.map((d) => d.id),
      ];
      expect(allIds).not.toContain(TITLE_III_ATTORNEY.id);
    });
  });
});

describe('routing: class_action', () => {
  it('placeholder routing mirrors Title III no-attorney until Phase D', () => {
    // Step 18 does not yet have a class-action registry. Route is
    // demand letter + DOJ until the real registry ships (Phase D
    // Step 26). The package-rendering layer displays a
    // "class-action matching coming soon" note separately.
    const route = routeFor({ title: 'class_action' });
    expect(route.primary.id).toBe(TITLE_III_DEMAND_LETTER.id);
    expect(route.alternates.map((d) => d.id)).toContain(DOJ_TITLE_III.id);
  });
});

describe('routing: out_of_scope and none', () => {
  it('out_of_scope routes to Regional ADA Center as primary', () => {
    // out_of_scope is NOT a dismissal — Ada still documents and
    // refers. Regional ADA Centers route to the right regime.
    const route = routeFor({ title: 'out_of_scope' });
    expect(route.primary.id).toBe(REGIONAL_ADA_CENTERS.id);
  });

  it('none routes the same way as out_of_scope (legacy compat)', () => {
    const route = routeFor({ title: 'none' });
    expect(route.primary.id).toBe(REGIONAL_ADA_CENTERS.id);
  });

  it('out_of_scope includes state civil-rights office when available', () => {
    const route = routeFor({ title: 'out_of_scope', state: 'AZ' });
    expect(route.alternates.map((d) => d.id)).toContain('az_civil_rights');
  });
});

describe('state normalization', () => {
  it('accepts uppercase state codes', () => {
    const route = routeFor({ title: 'I', state: 'AZ' });
    expect(route.alternates.some((d) => d.id === 'az_civil_rights')).toBe(true);
  });

  it('accepts lowercase state codes', () => {
    const route = routeFor({ title: 'I', state: 'az' });
    expect(route.alternates.some((d) => d.id === 'az_civil_rights')).toBe(true);
  });

  it('accepts state codes with whitespace', () => {
    const route = routeFor({ title: 'I', state: ' az ' });
    expect(route.alternates.some((d) => d.id === 'az_civil_rights')).toBe(true);
  });

  it('ignores non-2-letter state inputs', () => {
    // "Arizona" is not a valid state code in this registry. Must be
    // the 2-letter code. We silently ignore the bad input rather
    // than throwing, because classification shouldn't be blocked
    // by a malformed state.
    const route = routeFor({ title: 'I', state: 'Arizona' });
    expect(route.alternates).toHaveLength(0);
  });
});

describe('accessibility requirements on every destination', () => {
  const allDestinations = [
    EEOC_TITLE_I,
    DOJ_TITLE_II,
    DOJ_TITLE_III,
    TITLE_III_DEMAND_LETTER,
    TITLE_III_ATTORNEY,
    ADA_INFO_LINE,
    REGIONAL_ADA_CENTERS,
    ...Object.values(STATE_CIVIL_RIGHTS_OFFICES),
  ];

  it('every destination has a non-empty label', () => {
    for (const d of allDestinations) {
      expect(d.label.trim()).not.toBe('');
      expect(d.label.length).toBeLessThanOrEqual(50);
    }
  });

  it('every destination has a plain-language description', () => {
    for (const d of allDestinations) {
      expect(d.userDescription.trim()).not.toBe('');
    }
  });

  it('user descriptions do not contain HTML', () => {
    // The description renders into a page; HTML in source would
    // either be escaped (ugly) or executed (unsafe).
    for (const d of allDestinations) {
      expect(d.userDescription).not.toMatch(/<[a-z]/i);
    }
  });

  it('federal-complaint destinations include a toll-free phone number', () => {
    // Federal options should always have a phone alternative for
    // users who cannot file online (no internet, AT that fights
    // the intake form, etc.).
    for (const d of [EEOC_TITLE_I, DOJ_TITLE_II, DOJ_TITLE_III]) {
      expect(d.phone?.voice).toBeTruthy();
    }
  });

  it('federal-complaint destinations have a TTY number', () => {
    // Deaf and hard-of-hearing users must have equivalent access
    // to contact numbers.
    for (const d of [EEOC_TITLE_I, DOJ_TITLE_II, DOJ_TITLE_III]) {
      expect(d.phone?.tty).toBeTruthy();
    }
  });
});

describe('registry metadata', () => {
  it('exports a last-verified date', () => {
    expect(SOURCES_LAST_VERIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
