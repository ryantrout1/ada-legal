import { describe, it, expect } from 'vitest';
import {
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
