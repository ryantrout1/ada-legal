/**
 * Shared client-IP derivation (/plan Ada rate limits, Phase 1).
 *
 * This helper existed as two byte-identical private copies in
 * api/public/guide-assistant.ts and api/spot/analyze.ts. Ada's four public
 * endpoints would have made it five. These tests pin the behavior BEFORE
 * the extraction so the move is provably behavior-neutral.
 *
 * AC-5 (supporting): the limiter identity must never embed a raw IP
 * downstream — that is deriveRateLimitKey's job, but this helper is the
 * input to it, so its contract matters.
 */

import { describe, it, expect } from 'vitest';
import { clientIp } from '../../src/lib/rateLimit/clientIp.js';

/** Minimal stand-in for the VercelRequest shape the helper reads. */
function req(headers: Record<string, string | string[] | undefined>) {
  return { headers } as unknown as Parameters<typeof clientIp>[0];
}

describe('clientIp', () => {
  it('reads a single x-forwarded-for value', () => {
    expect(clientIp(req({ 'x-forwarded-for': '203.0.113.7' }))).toBe('203.0.113.7');
  });

  it('takes the first hop when the header is a comma list', () => {
    // Vercel appends proxy hops; the client is leftmost.
    expect(
      clientIp(req({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178' })),
    ).toBe('203.0.113.7');
  });

  it('takes the first entry when the header arrives as an array', () => {
    expect(clientIp(req({ 'x-forwarded-for': ['203.0.113.7', '198.51.100.2'] }))).toBe(
      '203.0.113.7',
    );
  });

  it('trims surrounding whitespace', () => {
    expect(clientIp(req({ 'x-forwarded-for': '  203.0.113.7  , 70.41.3.18' }))).toBe(
      '203.0.113.7',
    );
  });

  it('falls back to 0.0.0.0 when the header is absent', () => {
    // Every caller behind no proxy collapses to one identity. That is the
    // pre-existing behavior and is deliberate: it fails toward throttling
    // an unidentifiable caller rather than exempting them.
    expect(clientIp(req({}))).toBe('0.0.0.0');
  });

  it('falls back to 0.0.0.0 when the header is empty or blank', () => {
    expect(clientIp(req({ 'x-forwarded-for': '' }))).toBe('0.0.0.0');
    expect(clientIp(req({ 'x-forwarded-for': '   ' }))).toBe('0.0.0.0');
  });

  it('falls back to 0.0.0.0 when an array header is empty', () => {
    expect(clientIp(req({ 'x-forwarded-for': [] }))).toBe('0.0.0.0');
  });
});
