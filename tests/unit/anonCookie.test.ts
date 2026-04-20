import { describe, it, expect } from 'vitest';
import {
  ANON_COOKIE_NAME,
  ANON_COOKIE_TTL_SECONDS,
  buildAnonCookieHeader,
  hashAnonToken,
  mintAnonToken,
  parseAnonCookie,
} from '@/lib/anonCookie';

describe('anonCookie', () => {
  describe('mintAnonToken', () => {
    it('produces a non-empty string', () => {
      const token = mintAnonToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('produces distinct tokens across calls', () => {
      const t1 = mintAnonToken();
      const t2 = mintAnonToken();
      expect(t1).not.toBe(t2);
    });

    it('uses URL-safe base64 characters only', () => {
      for (let i = 0; i < 20; i++) {
        expect(mintAnonToken()).toMatch(/^[A-Za-z0-9_-]+$/);
      }
    });
  });

  describe('hashAnonToken', () => {
    it('is deterministic for the same input', async () => {
      const h1 = await hashAnonToken('sample-token');
      const h2 = await hashAnonToken('sample-token');
      expect(h1).toBe(h2);
    });

    it('differs for different inputs', async () => {
      const h1 = await hashAnonToken('token-a');
      const h2 = await hashAnonToken('token-b');
      expect(h1).not.toBe(h2);
    });

    it('returns 64-char hex (sha-256)', async () => {
      const h = await hashAnonToken('anything');
      expect(h).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('buildAnonCookieHeader', () => {
    it('includes all required attributes for a secure cookie', () => {
      const header = buildAnonCookieHeader({ token: 'abc123', secure: true });
      expect(header).toContain('ada_anon=abc123');
      expect(header).toContain('HttpOnly');
      expect(header).toContain('SameSite=Lax');
      expect(header).toContain('Path=/');
      expect(header).toContain('Secure');
      expect(header).toContain(`Max-Age=${ANON_COOKIE_TTL_SECONDS}`);
    });

    it('omits Secure for http (localhost dev)', () => {
      const header = buildAnonCookieHeader({ token: 'abc', secure: false });
      expect(header).not.toContain('Secure');
    });

    it('adds Domain attribute when provided (cross-subdomain at cutover)', () => {
      const header = buildAnonCookieHeader({
        token: 'abc',
        secure: true,
        domain: '.adalegallink.com',
      });
      expect(header).toContain('Domain=.adalegallink.com');
    });

    it('omits Domain attribute when not provided (preview / build phase)', () => {
      const header = buildAnonCookieHeader({ token: 'abc', secure: true });
      expect(header).not.toContain('Domain=');
    });

    it('honors a custom maxAge', () => {
      const header = buildAnonCookieHeader({
        token: 'abc',
        secure: true,
        maxAgeSeconds: 60,
      });
      expect(header).toContain('Max-Age=60');
    });
  });

  describe('parseAnonCookie', () => {
    it('returns the token from a lone cookie', () => {
      expect(parseAnonCookie(`${ANON_COOKIE_NAME}=xyz`)).toBe('xyz');
    });

    it('returns the token when mixed with other cookies', () => {
      expect(parseAnonCookie(`foo=bar; ${ANON_COOKIE_NAME}=xyz; baz=qux`)).toBe('xyz');
    });

    it('returns null when the cookie is absent', () => {
      expect(parseAnonCookie('foo=bar; baz=qux')).toBeNull();
    });

    it('returns null for null/undefined/empty inputs', () => {
      expect(parseAnonCookie(null)).toBeNull();
      expect(parseAnonCookie(undefined)).toBeNull();
      expect(parseAnonCookie('')).toBeNull();
    });
  });

  describe('integration: mint → hash → parse round-trip', () => {
    it('a minted token parses correctly from its own cookie header', async () => {
      const token = mintAnonToken();
      const header = buildAnonCookieHeader({ token, secure: true });
      // Extract the `name=value` piece from Set-Cookie to feed into parse
      // (parseAnonCookie takes a Cookie header, which is just `name=value; ...`)
      const namePart = header.split(';')[0];
      expect(parseAnonCookie(namePart)).toBe(token);

      // The hash of the minted token is what we'd store in the DB
      const hash = await hashAnonToken(token);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });
});
