/**
 * M6 Phase 1 — admin authorization.
 *
 * WHAT THIS CLOSES: until M6, requireAdmin admitted any authenticated
 * Clerk user. Clerk is the ATTORNEY PORTAL's auth provider, not a
 * separate admin directory, so every pilot attorney with a portal login
 * could call all 25 /api/admin/* endpoints — reading sessions, intakes
 * and firms across every firm boundary. That is a cross-firm
 * confidentiality exposure on a legal platform.
 *
 * The two properties that matter here, and the reason each is a test
 * rather than a comment:
 *
 *   1. FAILS CLOSED. An unset or empty ADMIN_EMAILS must deny every
 *      Clerk caller. The tempting shortcut — "no list configured means
 *      don't enforce yet" — reintroduces the exact bug being fixed, and
 *      would do it silently on any environment where the variable was
 *      forgotten.
 *
 *   2. THE BRIDGE PATH IS UNTOUCHED. It authenticates Gina's live
 *      Base44 admin until S10. If the allowlist leaked into that branch,
 *      her working tools would break the moment this deployed — and the
 *      failure would look like an unrelated outage.
 *
 * Ref: /plan M6 Phase 1, AC1.
 */

import { describe, it, expect } from 'vitest';
import { parseAdminAllowlist, isAllowlistedAdmin } from '../../api/_admin.js';
import { readCode } from '../support/sourceText.js';

describe('parseAdminAllowlist', () => {
  it('splits, trims and lowercases', () => {
    const set = parseAdminAllowlist(' Ryan@AdaLegalLink.com , gina@adalegallink.com ');
    expect([...set].sort()).toEqual(['gina@adalegallink.com', 'ryan@adalegallink.com']);
  });

  it('returns an empty set for nothing usable', () => {
    expect(parseAdminAllowlist(undefined).size).toBe(0);
    expect(parseAdminAllowlist('').size).toBe(0);
    expect(parseAdminAllowlist('   ').size).toBe(0);
    expect(parseAdminAllowlist(',,,').size).toBe(0);
  });
});

describe('isAllowlistedAdmin — fails closed', () => {
  it('denies everyone when the list is unset', () => {
    expect(isAllowlistedAdmin('ryan@adalegallink.com', undefined)).toBe(false);
  });

  it('denies everyone when the list is empty or whitespace', () => {
    expect(isAllowlistedAdmin('ryan@adalegallink.com', '')).toBe(false);
    expect(isAllowlistedAdmin('ryan@adalegallink.com', '  ,  ')).toBe(false);
  });

  it('denies a caller with no email even when a list exists', () => {
    // If Clerk cannot tell us who this is, they are not an admin.
    expect(isAllowlistedAdmin(null, 'ryan@adalegallink.com')).toBe(false);
    expect(isAllowlistedAdmin('', 'ryan@adalegallink.com')).toBe(false);
  });
});

describe('isAllowlistedAdmin — admits only the list', () => {
  const LIST = 'ryan@adalegallink.com,gina@adalegallink.com';

  it('admits a listed address', () => {
    expect(isAllowlistedAdmin('ryan@adalegallink.com', LIST)).toBe(true);
    expect(isAllowlistedAdmin('gina@adalegallink.com', LIST)).toBe(true);
  });

  it('is case- and whitespace-insensitive', () => {
    expect(isAllowlistedAdmin('  RYAN@AdaLegalLink.COM ', LIST)).toBe(true);
  });

  it('denies a pilot attorney — the whole point of the change', () => {
    // These are real portal accounts. Before M6 every one of them
    // passed requireAdmin.
    for (const attorney of [
      'kelley@spinalcordinjurylawyers.com',
      'josh@spinalcordinjurylawyers.com',
      'alex@spinalcordinjurylawyers.com',
    ]) {
      expect(isAllowlistedAdmin(attorney, LIST), `${attorney} must be denied`).toBe(false);
    }
  });

  it('does not match on substring or domain', () => {
    expect(isAllowlistedAdmin('ryan@adalegallink.com.evil.test', LIST)).toBe(false);
    expect(isAllowlistedAdmin('notryan@adalegallink.com', LIST)).toBe(false);
    expect(isAllowlistedAdmin('adalegallink.com', LIST)).toBe(false);
  });
});

describe('the bridge path is unchanged', () => {
  const code = readCode('api/_admin.ts');

  it('still authorizes on the bridge secret alone', () => {
    // Gina's live Base44 admin authenticates this way until S10.
    expect(code).toContain('ADALL_BRIDGE_SECRET');
    expect(code).toContain("via: 'bridge'");
    expect(code).toContain('constantTimeEquals');
  });

  it('does not apply the allowlist to the bridge branch', () => {
    // The allowlist check must appear only after the bridge branch has
    // already returned.
    const bridgeReturn = code.indexOf("via: 'bridge'");
    const allowlistCheck = code.indexOf('isAllowlistedAdmin(email)');
    expect(bridgeReturn).toBeGreaterThan(-1);
    expect(allowlistCheck).toBeGreaterThan(-1);
    expect(
      allowlistCheck,
      'the allowlist must not gate the bridge path',
    ).toBeGreaterThan(bridgeReturn);
  });

  it('rejects a non-allowlisted signed-in caller with 403, not 401', () => {
    // They are authenticated; they are not authorized. A 401 bounces
    // them to a sign-in page they are already past.
    expect(code).toContain("res.status(403).json({ error: 'Forbidden' })");
  });
});

describe('the admin sign-up route is gone', () => {
  it('no longer registers a public admin sign-up page', () => {
    const app = readCode('src/app/App.tsx');
    expect(app, 'self-service admin registration must not exist').not.toContain(
      'AdminSignUp',
    );
  });

  it('leaves the portal sign-up alone', () => {
    const app = readCode('src/app/App.tsx');
    expect(app).toContain('PortalSignUp');
  });
});

describe('the client gate asks the server', () => {
  const gate = readCode('src/app/components/RequireAdmin.tsx');

  it('checks /api/admin/me rather than duplicating the list', () => {
    expect(gate).toContain('/api/admin/me');
  });

  it('fails closed when the check itself fails', () => {
    expect(gate).toContain("setStatus('denied')");
  });

  it('does not read the allowlist from a client-visible env var', () => {
    expect(gate).not.toContain('ADMIN_EMAILS');
    expect(gate).not.toContain('VITE_ADMIN');
  });
});
