import { describe, it, expect } from 'vitest';
import { deriveRateLimitKey } from '@/lib/spot/spotRateLimitKey';

const UA_CHROME_A = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120.0.0.1 Safari/537.36';
const UA_CHROME_B = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120.0.6099.2 Safari/537.36';
const UA_FIREFOX = 'Mozilla/5.0 (Macintosh) Gecko/20100101 Firefox/121.0';

describe('deriveRateLimitKey', () => {
  it('is deterministic for identical inputs', () => {
    expect(deriveRateLimitKey('203.0.113.7', UA_CHROME_A)).toBe(
      deriveRateLimitKey('203.0.113.7', UA_CHROME_A),
    );
  });

  it('differs by IP', () => {
    expect(deriveRateLimitKey('203.0.113.7', UA_CHROME_A)).not.toBe(
      deriveRateLimitKey('198.51.100.9', UA_CHROME_A),
    );
  });

  it('collapses minor user-agent version noise to the same key', () => {
    // same IP + same browser family, only patch/build version differs
    expect(deriveRateLimitKey('203.0.113.7', UA_CHROME_A)).toBe(
      deriveRateLimitKey('203.0.113.7', UA_CHROME_B),
    );
  });

  it('distinguishes different browser families', () => {
    expect(deriveRateLimitKey('203.0.113.7', UA_CHROME_A)).not.toBe(
      deriveRateLimitKey('203.0.113.7', UA_FIREFOX),
    );
  });

  it('produces an opaque, non-PII-bearing key (raw IP is not embedded)', () => {
    const key = deriveRateLimitKey('203.0.113.7', UA_CHROME_A);
    expect(key).not.toContain('203.0.113.7');
    expect(key).toMatch(/^[0-9a-f]+$/); // hex digest
  });

  it('handles empty/missing UA without throwing', () => {
    expect(() => deriveRateLimitKey('203.0.113.7', '')).not.toThrow();
    expect(deriveRateLimitKey('203.0.113.7', '')).toMatch(/^[0-9a-f]+$/);
  });
});
