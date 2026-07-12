/**
 * Unit — guideUrlForStandard (R5b).
 *
 * Resolves a cited ADA standard to an ADALL Standards-Guide URL: the specific
 * chapter when the citation carries a 2010-Standards section, the guide index
 * otherwise. Never mis-links a CFR regulation part to a chapter.
 */

import { describe, it, expect } from 'vitest';
import { guideUrlForStandard } from '@/engine/package/standardsGuideLink';

const BASE = 'https://ada.adalegallink.com/standards-guide';

describe('guideUrlForStandard', () => {
  it('maps a 2xx section to chapter 2', () => {
    expect(guideUrlForStandard('§206')).toBe(`${BASE}/chapter/2`);
    expect(guideUrlForStandard('ADA Standards §206.2.1 accessible routes')).toBe(`${BASE}/chapter/2`);
  });

  it('maps a 4xx section to chapter 4', () => {
    expect(guideUrlForStandard('§404 doors')).toBe(`${BASE}/chapter/4`);
  });

  it('maps a 10xx section to chapter 10', () => {
    expect(guideUrlForStandard('§1009 swimming pools')).toBe(`${BASE}/chapter/10`);
  });

  it('does NOT mis-link a CFR citation to a chapter — falls back to the index', () => {
    expect(guideUrlForStandard('28 CFR §36.304')).toBe(BASE);
    expect(guideUrlForStandard('28 CFR §35.130')).toBe(BASE);
  });

  it('falls back to the index when there is no section number', () => {
    expect(guideUrlForStandard('ADA Title III')).toBe(BASE);
    expect(guideUrlForStandard('')).toBe(BASE);
    expect(guideUrlForStandard(null)).toBe(BASE);
    expect(guideUrlForStandard(undefined)).toBe(BASE);
  });
});
