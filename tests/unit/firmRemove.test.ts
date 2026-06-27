import { describe, it, expect } from 'vitest';
import { canRemoveAttorney } from '@/engine/portal/firmOwnership';

const roster = [
  { id: 'ryan', firmRole: 'owner' },
  { id: 'kelley', firmRole: 'member' },
  { id: 'josh', firmRole: 'member' },
];

describe('canRemoveAttorney', () => {
  it('allows removing a member', () => {
    expect(canRemoveAttorney(roster, 'kelley')).toBe(true);
  });
  it('blocks removing the last owner', () => {
    expect(canRemoveAttorney(roster, 'ryan')).toBe(false);
  });
  it('allows removing an owner while another owner remains', () => {
    const two = [...roster, { id: 'k2', firmRole: 'owner' }];
    expect(canRemoveAttorney(two, 'ryan')).toBe(true);
  });
});
