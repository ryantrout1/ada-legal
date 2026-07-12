import { describe, it, expect } from 'vitest';
import {
  rateLimitDecision,
  FREE_ALLOWED_READS,
  SOFT_GATE_READS,
} from '@/lib/spot/rateLimitDecision';

describe('rateLimitDecision', () => {
  it('exposes the tunable thresholds (2 free, soft gate at the 3rd)', () => {
    expect(FREE_ALLOWED_READS).toBe(2);
    expect(SOFT_GATE_READS).toBe(3);
  });

  it('allows the first two reads (0 or 1 prior)', () => {
    expect(rateLimitDecision(0)).toBe('allowed');
    expect(rateLimitDecision(1)).toBe('allowed');
  });

  it('soft-gates the third read (2 prior) — still analyzes, prompts email', () => {
    expect(rateLimitDecision(2)).toBe('soft_gated');
  });

  it('blocks the fourth read onward (3+ prior) — CTA only, no model call', () => {
    expect(rateLimitDecision(3)).toBe('blocked');
    expect(rateLimitDecision(10)).toBe('blocked');
  });
});
