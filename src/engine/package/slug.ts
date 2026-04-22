/**
 * Package slug generator.
 *
 * Slugs are URL identifiers for shareable package pages (/s/{slug}).
 * They must be:
 *
 *   - UNGUESSABLE. Anyone with the slug can view the package. Slugs
 *     from different sessions must be cryptographically independent,
 *     so an attacker can't enumerate packages. We use crypto.randomBytes.
 *
 *   - URL-SAFE. No characters that require percent-encoding in URLs,
 *     no characters that break copy-paste from chat apps (auto-linkers
 *     often stop at punctuation), no visual ambiguity (0/O, 1/l/I).
 *     Crockford base32 excludes those.
 *
 *   - SHORT. The slug is shared verbally, texted, emailed. It shouldn't
 *     be unwieldy. 12 characters of base32 ≈ 60 bits of entropy ≈
 *     1 collision per 10^9 sessions. Good enough for Step 18.
 *
 *   - PREFIX-TAGGED. A leading "s-" makes the slug self-identifying
 *     in logs and makes URL-parsing unambiguous ("s-3a7fk..." is
 *     clearly a session package, not some other kind of resource).
 *
 * Format: "s-" + 12 Crockford base32 chars. Example: "s-3a7fk9pq2n8w"
 *
 * Ref: Step 18 plan, Commit 3.
 */

import { randomBytes } from 'node:crypto';

// Crockford base32: excludes I, L, O, U to reduce ambiguity.
const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const SLUG_BODY_LENGTH = 12;
const SLUG_PREFIX = 's-';

/**
 * Generate a new random package slug. Not deterministic — each call
 * returns a fresh value.
 *
 * @returns slug of the form "s-XXXXXXXXXXXX" (14 chars total)
 */
export function generatePackageSlug(): string {
  // 12 base32 chars = 60 bits. Read 8 bytes (64 bits) from crypto
  // randomness, bitmask to 60, then encode in base32. We process
  // 5 bits at a time (base32 is 2^5).
  const bytes = randomBytes(8);
  let value = 0n;
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8n) | BigInt(bytes[i]!);
  }
  // Keep low 60 bits.
  value = value & ((1n << 60n) - 1n);

  const chars: string[] = [];
  for (let i = 0; i < SLUG_BODY_LENGTH; i++) {
    const idx = Number(value & 31n);
    chars.push(CROCKFORD_ALPHABET[idx]!);
    value >>= 5n;
  }
  return SLUG_PREFIX + chars.reverse().join('').toLowerCase();
}

/**
 * Validate a slug's shape. Does NOT check that a package with this
 * slug actually exists — that's the DB layer's job.
 *
 * Tolerant of case (public URLs are often lowercased by chat
 * auto-linkers; some users retype them from memory).
 */
export function isValidPackageSlug(slug: string): boolean {
  if (typeof slug !== 'string') return false;
  // Normalize case before checking prefix — public URLs get lowercased
  // by chat auto-linkers, or uppercased by handwriting/typing.
  const normalized = slug.toLowerCase();
  if (!normalized.startsWith(SLUG_PREFIX)) return false;
  const body = normalized.slice(SLUG_PREFIX.length);
  if (body.length !== SLUG_BODY_LENGTH) return false;
  const upper = body.toUpperCase();
  for (const ch of upper) {
    if (!CROCKFORD_ALPHABET.includes(ch)) return false;
  }
  return true;
}
