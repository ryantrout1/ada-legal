/**
 * Hop token — signed credential for cross-channel redirects.
 *
 * Step 22. When Ada routes a user from ADA Legal Link to a partner org
 * (e.g. gov.adalegallink.com/[org-code]), the user's browser navigates
 * to a URL like:
 *
 *   https://gov.adalegallink.com/[org-code]?hop=<jwt>
 *
 * The destination subdomain validates the JWT and creates a new session
 * on that side that references the originating session. This gives us:
 *
 *   1. Cross-subdomain handoff without cookie sharing across origins.
 *   2. Tamper-evident payload (targeted org, originating session).
 *   3. A short lifetime (60s) so a leaked URL is useless quickly.
 *
 * Why HS256 (symmetric) and not RS256 (asymmetric):
 *   - All our subdomains (adall, gov, client) run in the same Vercel
 *     project sharing one env. Asymmetric keys buy nothing when the
 *     verifier has the same trust boundary as the signer.
 *   - HS256 is smaller and faster. For a 60s-lifetime hop token the
 *     rotation burden of RS256 isn't worth the complexity.
 *
 * Why not store tokens in the DB:
 *   - A JWT is self-contained — the verifier needs only the secret,
 *     not a DB lookup. That keeps the destination handler under the
 *     Vercel cold-start latency budget.
 *   - We DO cross-reference the originating session server-side after
 *     verification: the destination subdomain looks up the ada_session
 *     row by from_session and reads the summary + extracted fields
 *     there. The token is an authorization credential, not the payload.
 *
 * Secret provisioning:
 *   - ADALL_HOP_SECRET is a Vercel env var set in production.
 *   - Length must be ≥32 bytes. We refuse to mint if it's shorter —
 *     better to fail loudly than to produce a weak token.
 *   - In tests, pass the secret directly to mintHopToken /
 *     verifyHopToken; don't rely on process.env.
 *
 * Ref: Step 22.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export interface HopTokenPayload {
  /** Token type, literally 'adall-hop'. */
  typ: 'adall-hop';
  /** Issued-at, unix seconds. */
  iat: number;
  /** Expiration, unix seconds (iat + 60). */
  exp: number;
  /** Anonymous session UUID from originating side (or null if user present). */
  anon: string | null;
  /** Authenticated user UUID (or null if anon). */
  user: string | null;
  /** The ada_session the user came from. */
  from_session: string;
  /** Target organization UUID. */
  target_org: string;
}

export interface MintHopTokenOptions {
  /** The ada_session uuid the user is leaving. */
  fromSessionId: string;
  /** UUID of the org they're being routed to. */
  targetOrgId: string;
  /** Either anon or user must be provided (not both, not neither). */
  anonSessionId?: string | null;
  userId?: string | null;
  /** HMAC secret. In prod, process.env.ADALL_HOP_SECRET. */
  secret: string;
  /** Override for tests. Default 60s. */
  ttlSeconds?: number;
  /** Override for tests. Default Date.now() in seconds. */
  nowSeconds?: number;
}

/** Mint a new hop token. Throws if secret is weak or identity is missing. */
export function mintHopToken(opts: MintHopTokenOptions): string {
  if (typeof opts.secret !== 'string' || opts.secret.length < 32) {
    throw new Error(
      'mintHopToken: secret must be at least 32 bytes. Set ADALL_HOP_SECRET in env.',
    );
  }
  const hasAnon = !!opts.anonSessionId;
  const hasUser = !!opts.userId;
  if (hasAnon === hasUser) {
    throw new Error(
      'mintHopToken: provide exactly one of anonSessionId or userId, not both.',
    );
  }

  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  const ttl = opts.ttlSeconds ?? 60;

  const payload: HopTokenPayload = {
    typ: 'adall-hop',
    iat: now,
    exp: now + ttl,
    anon: opts.anonSessionId ?? null,
    user: opts.userId ?? null,
    from_session: opts.fromSessionId,
    target_org: opts.targetOrgId,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = signHs256(signingInput, opts.secret);
  return `${signingInput}.${signature}`;
}

export type VerifyResult =
  | { ok: true; payload: HopTokenPayload }
  | { ok: false; reason: string };

export interface VerifyHopTokenOptions {
  token: string;
  secret: string;
  /** Override for tests. */
  nowSeconds?: number;
}

/**
 * Verify a hop token. Returns a discriminated union so callers can log
 * the reason for rejection without branching on thrown errors. Never
 * throws under normal use.
 */
export function verifyHopToken(opts: VerifyHopTokenOptions): VerifyResult {
  if (typeof opts.secret !== 'string' || opts.secret.length < 32) {
    return { ok: false, reason: 'secret_invalid' };
  }
  const parts = opts.token.split('.');
  if (parts.length !== 3) {
    return { ok: false, reason: 'malformed' };
  }
  const [encodedHeader, encodedPayload, providedSig] = parts as [
    string,
    string,
    string,
  ];

  const expectedSig = signHs256(`${encodedHeader}.${encodedPayload}`, opts.secret);
  // Timing-safe compare. Buffers must be the same length for
  // timingSafeEqual, else compare lengths first.
  if (expectedSig.length !== providedSig.length) {
    return { ok: false, reason: 'signature_mismatch' };
  }
  const a = Buffer.from(expectedSig, 'utf8');
  const b = Buffer.from(providedSig, 'utf8');
  if (!timingSafeEqual(a, b)) {
    return { ok: false, reason: 'signature_mismatch' };
  }

  // Decode + parse payload
  let payload: HopTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload)) as HopTokenPayload;
  } catch {
    return { ok: false, reason: 'payload_invalid' };
  }

  // Shape checks
  if (payload.typ !== 'adall-hop') return { ok: false, reason: 'wrong_type' };
  if (typeof payload.exp !== 'number' || typeof payload.iat !== 'number') {
    return { ok: false, reason: 'payload_invalid' };
  }
  if (typeof payload.from_session !== 'string' || payload.from_session === '') {
    return { ok: false, reason: 'payload_invalid' };
  }
  if (typeof payload.target_org !== 'string' || payload.target_org === '') {
    return { ok: false, reason: 'payload_invalid' };
  }

  // Expiry
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return { ok: false, reason: 'expired' };
  // Defense-in-depth: iat can't be in the future (allow 10s clock skew).
  if (payload.iat > now + 10) return { ok: false, reason: 'iat_future' };

  return { ok: true, payload };
}

// ─── crypto helpers ──────────────────────────────────────────────────────────

function signHs256(input: string, secret: string): string {
  return base64UrlEncodeBytes(
    createHmac('sha256', secret).update(input).digest(),
  );
}

function base64UrlEncode(s: string): string {
  return base64UrlEncodeBytes(Buffer.from(s, 'utf8'));
}

function base64UrlEncodeBytes(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(s: string): string {
  const normalized = s.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}
