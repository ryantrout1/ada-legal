import { describe, it, expect } from 'vitest';
import {
  sanitizeIncomingStates,
  NATIONWIDE_SENTINEL,
  normalizeAffectedStates,
} from '@/engine/clients/litigationStates';

describe('normalizeAffectedStates', () => {
  it('collapses the [__nationwide__] sentinel to an empty array', () => {
    expect(normalizeAffectedStates([NATIONWIDE_SENTINEL])).toEqual([]);
  });

  it('leaves an already-empty array empty', () => {
    expect(normalizeAffectedStates([])).toEqual([]);
  });

  it('treats null/undefined as nationwide (empty array)', () => {
    expect(normalizeAffectedStates(null)).toEqual([]);
    expect(normalizeAffectedStates(undefined)).toEqual([]);
  });

  it('passes real state arrays through unchanged', () => {
    expect(normalizeAffectedStates(['CA', 'TX'])).toEqual(['CA', 'TX']);
  });

  it('defensively strips the sentinel but keeps real states if both appear', () => {
    expect(normalizeAffectedStates([NATIONWIDE_SENTINEL, 'CA'])).toEqual(['CA']);
  });
});

describe('sanitizeIncomingStates (admin write boundary)', () => {
  it('strips the sentinel instead of uppercasing it into corruption', () => {
    // The regression this exists for: the handlers uppercase state
    // codes; before this, ['__nationwide__'] became ['__NATIONWIDE__']
    // in Neon, which the case-sensitive read filter no longer stripped.
    expect(sanitizeIncomingStates([NATIONWIDE_SENTINEL])).toEqual([]);
  });

  it('strips an already-corrupted uppercase sentinel too', () => {
    expect(sanitizeIncomingStates(['__NATIONWIDE__'])).toEqual([]);
  });

  it('keeps and uppercases real states alongside a stripped sentinel', () => {
    expect(sanitizeIncomingStates([NATIONWIDE_SENTINEL, 'ca', 'TX'])).toEqual(['CA', 'TX']);
  });

  it('drops non-strings and handles non-array input', () => {
    expect(sanitizeIncomingStates(['az', 7, null, 'nm'])).toEqual(['AZ', 'NM']);
    expect(sanitizeIncomingStates(undefined)).toEqual([]);
    expect(sanitizeIncomingStates('CA')).toEqual([]);
  });
});
