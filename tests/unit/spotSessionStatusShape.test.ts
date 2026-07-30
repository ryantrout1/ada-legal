/**
 * `/api/spot/session-status` is the only way the browser can learn anything
 * about a paid session. It already reads `buyerEmail` out of the database —
 * `getSession` selects the column — and then throws it away before responding.
 * That is why the confirmation screen could never name the buyer's address:
 * `SpotUpload` declared a `buyerEmail` prop, `SpotLanding` never passed one,
 * and no caller could have supplied it even if it wanted to.
 *
 * This is a source assertion rather than a request test because the handler is
 * a Vercel function that needs a live database, and everything under
 * `tests/integration/` skips without DATABASE_URL — so a request test would
 * prove nothing on `npm test`. Same pattern as spotPriceConsistency and
 * guideShellParity: pin the contract where it can actually run.
 *
 * Encodes acceptance criterion 3 from /plan phase 1.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const src = readFileSync(resolve(root, 'api/spot/session-status.ts'), 'utf8');

describe('session-status returns the buyer email alongside the status', () => {
  it('responds with both keys', () => {
    const ok = src.match(/res\.status\(200\)\.json\(\{([^}]*)\}\)/);
    expect(ok, 'no 200 response literal found').not.toBeNull();
    const body = ok![1];
    expect(body).toMatch(/\bstatus\b/);
    expect(body).toMatch(/\bbuyerEmail\b/);
  });

  it('falls back to null rather than undefined when nothing is on file', () => {
    // undefined disappears through JSON.stringify, so the key would vanish
    // from the response and the client could not tell "no address on file"
    // apart from "this deploy predates the field".
    expect(src).toMatch(/buyerEmail:\s*[^,\n]*\?\?\s*null/);
  });

  it('still exposes nothing else about the session', () => {
    // The id is unguessable but this endpoint is unauthenticated, so the
    // response stays deliberately narrow. Stripe ids and amounts are not the
    // browser's business.
    const ok = src.match(/res\.status\(200\)\.json\(\{([^}]*)\}\)/);
    const body = ok![1];
    expect(body).not.toMatch(/stripe/i);
    expect(body).not.toMatch(/amountCents/);
    // The row carries the cardholder name now. The browser has no use for it,
    // so it stops at the server.
    expect(body).not.toMatch(/buyerName/);
  });
});
