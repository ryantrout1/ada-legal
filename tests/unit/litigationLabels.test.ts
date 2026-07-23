/**
 * M3 Phase 2 — litigation label helpers + reading-level text selection.
 *
 * Both are straight ports of Base44 modules
 * (src/components/litigation/litigationLabels.jsx and readingLevelText.jsx
 * @ 6b1e9ac) with one seam change each:
 *
 *   - the payload is camelCase here, not snake_case, so the reading-level
 *     variant keys derive as `${base}Simple` / `${base}Professional`
 *   - the public status vocabulary is the four surface-visible statuses;
 *     `closed` keeps a label (a stale link could still carry one) but is
 *     not an offered filter option (resolved decision 1)
 *
 * Ref: /plan M3 Phase 2, AC2.
 */

import { describe, it, expect } from 'vitest';
import {
  KIND_ORDER,
  PUBLIC_STATUS_ORDER,
  NATIONWIDE_SENTINEL,
  kindLabel,
  statusLabel,
  statesList,
  statesLabel,
} from '@/app/lib/litigationLabels';
import { pickReadingLevelText } from '@/app/lib/readingLevelText';

describe('litigation labels', () => {
  it('carries B44\u2019s five kinds in B44\u2019s order', () => {
    expect(KIND_ORDER).toEqual([
      'class',
      'consent_decree',
      'enforcement_action',
      'pattern_of_practice',
      'regulatory_challenge',
    ]);
  });

  it('offers only the four public statuses as filter options', () => {
    expect(PUBLIC_STATUS_ORDER).toEqual([
      'active',
      'investigating',
      'compliance',
      'tracking',
    ]);
    expect(PUBLIC_STATUS_ORDER).not.toContain('closed');
    expect(PUBLIC_STATUS_ORDER).not.toContain('draft');
    expect(PUBLIC_STATUS_ORDER).not.toContain('archived');
  });

  it('renders B44\u2019s friendly labels verbatim', () => {
    expect(kindLabel('class')).toBe('Class action');
    expect(kindLabel('consent_decree')).toBe('Consent decree');
    expect(kindLabel('pattern_of_practice')).toBe('Pattern of practice');
    expect(statusLabel('active')).toBe('Active');
    expect(statusLabel('investigating')).toBe('Under investigation');
    expect(statusLabel('compliance')).toBe('In compliance/monitoring');
    expect(statusLabel('tracking')).toBe('Tracking');
  });

  it('falls back to the raw value rather than rendering blank', () => {
    expect(kindLabel('something_new')).toBe('something_new');
    expect(statusLabel('')).toBe('');
    expect(kindLabel(undefined)).toBe('');
  });
});

describe('affected-states display', () => {
  it('strips the nationwide sentinel', () => {
    expect(NATIONWIDE_SENTINEL).toBe('__nationwide__');
    expect(statesList([NATIONWIDE_SENTINEL])).toEqual([]);
    expect(statesList(['AZ', NATIONWIDE_SENTINEL])).toEqual(['AZ']);
  });

  it('labels an empty or sentinel-only list as Nationwide', () => {
    expect(statesLabel([])).toBe('Nationwide');
    expect(statesLabel([NATIONWIDE_SENTINEL])).toBe('Nationwide');
    expect(statesLabel(null)).toBe('Nationwide');
  });

  it('joins real state codes', () => {
    expect(statesLabel(['AZ', 'NV'])).toBe('AZ, NV');
  });
});

describe('pickReadingLevelText', () => {
  const row = {
    shortDescription: 'standard text',
    shortDescriptionSimple: 'simple text',
    shortDescriptionProfessional: 'professional text',
  };

  it('picks the variant matching the reading level', () => {
    expect(pickReadingLevelText(row, 'shortDescription', 'simple')).toBe('simple text');
    expect(pickReadingLevelText(row, 'shortDescription', 'standard')).toBe('standard text');
    expect(pickReadingLevelText(row, 'shortDescription', 'professional')).toBe(
      'professional text',
    );
  });

  it('falls back to the base field when a variant is missing or blank', () => {
    const sparse = {
      shortDescription: 'standard text',
      shortDescriptionSimple: '   ',
      shortDescriptionProfessional: null,
    };
    expect(pickReadingLevelText(sparse, 'shortDescription', 'simple')).toBe('standard text');
    expect(pickReadingLevelText(sparse, 'shortDescription', 'professional')).toBe(
      'standard text',
    );
  });

  it('never returns null or undefined — blank is an empty string', () => {
    expect(pickReadingLevelText({}, 'shortDescription', 'simple')).toBe('');
    expect(pickReadingLevelText(null, 'shortDescription', 'standard')).toBe('');
  });
});
