/**
 * Tests for the hop-token module.
 *
 * The token is security-sensitive: it authorizes a cross-subdomain
 * handoff. Every validation path matters. This suite covers:
 *   - Happy-path mint + verify roundtrip
 *   - Every reason code the verifier can return
 *   - Edge cases (clock skew, expired tokens, weak secrets)
 *
 * Ref: Step 22.
 */

import { describe, it, expect } from 'vitest';
import { mintHopToken, verifyHopToken } from '@/engine/routing/hopToken';

const STRONG_SECRET = 'a'.repeat(32); // 32 bytes, minimum acceptable
const OTHER_SECRET = 'b'.repeat(32);
const ANON_A = '00000000-0000-4000-8000-000000000aaa';
const USER_A = '00000000-0000-4000-8000-000000000uuu';
const SESSION_A = '00000000-0000-4000-8000-000000000sss';
const ORG_A = '00000000-0000-4000-8000-000000000ooo';

// ─── mint ─────────────────────────────────────────────────────────────────────

describe('mintHopToken', () => {
  it('throws when secret is shorter than 32 bytes', () => {
    expect(() =>
      mintHopToken({
        fromSessionId: SESSION_A,
        targetOrgId: ORG_A,
        anonSessionId: ANON_A,
        secret: 'short',
      }),
    ).toThrow(/at least 32 bytes/);
  });

  it('throws when neither anon nor user is provided', () => {
    expect(() =>
      mintHopToken({
        fromSessionId: SESSION_A,
        targetOrgId: ORG_A,
        secret: STRONG_SECRET,
      }),
    ).toThrow(/exactly one/);
  });

  it('throws when both anon and user are provided', () => {
    expect(() =>
      mintHopToken({
        fromSessionId: SESSION_A,
        targetOrgId: ORG_A,
        anonSessionId: ANON_A,
        userId: USER_A,
        secret: STRONG_SECRET,
      }),
    ).toThrow(/exactly one/);
  });

  it('produces a 3-part JWT-like token', () => {
    const token = mintHopToken({
      fromSessionId: SESSION_A,
      targetOrgId: ORG_A,
      anonSessionId: ANON_A,
      secret: STRONG_SECRET,
    });
    expect(token.split('.')).toHaveLength(3);
  });

  it('different inputs produce different tokens', () => {
    const t1 = mintHopToken({
      fromSessionId: SESSION_A,
      targetOrgId: ORG_A,
      anonSessionId: ANON_A,
      secret: STRONG_SECRET,
      nowSeconds: 1000,
    });
    const t2 = mintHopToken({
      fromSessionId: SESSION_A,
      targetOrgId: 'different-org',
      anonSessionId: ANON_A,
      secret: STRONG_SECRET,
      nowSeconds: 1000,
    });
    expect(t1).not.toBe(t2);
  });
});

// ─── verify roundtrip ─────────────────────────────────────────────────────────

describe('verifyHopToken — happy path', () => {
  it('round-trips a fresh token', () => {
    const token = mintHopToken({
      fromSessionId: SESSION_A,
      targetOrgId: ORG_A,
      anonSessionId: ANON_A,
      secret: STRONG_SECRET,
      nowSeconds: 1000,
    });
    const result = verifyHopToken({
      token,
      secret: STRONG_SECRET,
      nowSeconds: 1030, // 30s later, well within 60s TTL
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.typ).toBe('adall-hop');
    expect(result.payload.from_session).toBe(SESSION_A);
    expect(result.payload.target_org).toBe(ORG_A);
    expect(result.payload.anon).toBe(ANON_A);
    expect(result.payload.user).toBeNull();
  });

  it('round-trips a user token (no anon)', () => {
    const token = mintHopToken({
      fromSessionId: SESSION_A,
      targetOrgId: ORG_A,
      userId: USER_A,
      secret: STRONG_SECRET,
      nowSeconds: 1000,
    });
    const result = verifyHopToken({
      token,
      secret: STRONG_SECRET,
      nowSeconds: 1010,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.user).toBe(USER_A);
    expect(result.payload.anon).toBeNull();
  });
});

// ─── verify rejections ────────────────────────────────────────────────────────

describe('verifyHopToken — rejections', () => {
  it('rejects a weak secret', () => {
    const result = verifyHopToken({
      token: 'anything.anything.anything',
      secret: 'too-short',
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('secret_invalid');
  });

  it('rejects a malformed token (missing parts)', () => {
    const result = verifyHopToken({
      token: 'only.two',
      secret: STRONG_SECRET,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('malformed');
  });

  it('rejects a token signed with a different secret', () => {
    const token = mintHopToken({
      fromSessionId: SESSION_A,
      targetOrgId: ORG_A,
      anonSessionId: ANON_A,
      secret: STRONG_SECRET,
      nowSeconds: 1000,
    });
    const result = verifyHopToken({
      token,
      secret: OTHER_SECRET,
      nowSeconds: 1010,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('signature_mismatch');
  });

  it('rejects a tampered payload (modified one character)', () => {
    const token = mintHopToken({
      fromSessionId: SESSION_A,
      targetOrgId: ORG_A,
      anonSessionId: ANON_A,
      secret: STRONG_SECRET,
      nowSeconds: 1000,
    });
    // Flip one character in the middle (payload section)
    const parts = token.split('.');
    const payload = parts[1]!;
    const tampered = payload[0] === 'A' ? 'B' + payload.slice(1) : 'A' + payload.slice(1);
    const badToken = [parts[0], tampered, parts[2]].join('.');
    const result = verifyHopToken({
      token: badToken,
      secret: STRONG_SECRET,
      nowSeconds: 1010,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects an expired token', () => {
    const token = mintHopToken({
      fromSessionId: SESSION_A,
      targetOrgId: ORG_A,
      anonSessionId: ANON_A,
      secret: STRONG_SECRET,
      nowSeconds: 1000,
      ttlSeconds: 60,
    });
    const result = verifyHopToken({
      token,
      secret: STRONG_SECRET,
      nowSeconds: 1061, // 61s later, 1s past expiry
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('expired');
  });

  it('rejects a token with iat too far in the future (clock skew defense)', () => {
    // Token issued in the future (mint at 2000, verify at 1000).
    const token = mintHopToken({
      fromSessionId: SESSION_A,
      targetOrgId: ORG_A,
      anonSessionId: ANON_A,
      secret: STRONG_SECRET,
      nowSeconds: 2000,
    });
    const result = verifyHopToken({
      token,
      secret: STRONG_SECRET,
      nowSeconds: 1000, // 1000s earlier — > 10s skew allowance
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe('iat_future');
  });

  it('allows up to 10 seconds of clock skew for iat', () => {
    // Token issued 5s "in the future" relative to the verifier — should pass.
    const token = mintHopToken({
      fromSessionId: SESSION_A,
      targetOrgId: ORG_A,
      anonSessionId: ANON_A,
      secret: STRONG_SECRET,
      nowSeconds: 1005,
    });
    const result = verifyHopToken({
      token,
      secret: STRONG_SECRET,
      nowSeconds: 1000, // verifier 5s behind — within tolerance
    });
    expect(result.ok).toBe(true);
  });
});
