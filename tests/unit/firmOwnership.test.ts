/**
 * Unit — firm ownership guards (test-first, /plan Phase 3.2, AC6).
 *
 * The last-owner guard: a firm must never be left with zero owners, so an
 * owner can only step down while another owner remains.
 */

import { describe, it, expect } from 'vitest';
import { ownerIds, canStepDown } from '@/engine/portal/firmOwnership';

const roster = [
  { id: 'a', firmRole: 'owner' },
  { id: 'b', firmRole: 'member' },
  { id: 'c', firmRole: 'member' },
];

describe('firm ownership guards', () => {
  it('ownerIds returns only owner rows', () => {
    expect(ownerIds(roster)).toEqual(['a']);
    expect(ownerIds([{ id: 'x' }, { id: 'y', firmRole: 'owner' }])).toEqual(['y']);
  });

  it('the sole owner cannot step down', () => {
    expect(canStepDown(roster, 'a')).toBe(false);
  });

  it('an owner can step down when another owner remains', () => {
    const two = [
      { id: 'a', firmRole: 'owner' },
      { id: 'b', firmRole: 'owner' },
    ];
    expect(canStepDown(two, 'a')).toBe(true);
  });

  it('a non-owner cannot step down', () => {
    expect(canStepDown(roster, 'b')).toBe(false);
  });
});
