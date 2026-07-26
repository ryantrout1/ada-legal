/**
 * The whole point of serving robots.txt from a function is that two hosts
 * serve this same deployment and want opposite answers. A static file
 * cannot do that, and getting it backwards is expensive in both
 * directions: an indexable engine domain splits the site's ranking across
 * two hostnames, and a disallowed apex deletes it from search entirely.
 *
 * Ref: B44 decommission, Gate C.
 */

import { describe, expect, it } from 'vitest';

import { isEngineHost, robotsBody, PRIVATE_PATHS } from '../../api/robots.js';

describe('isEngineHost', () => {
  it('recognises the engine domain', () => {
    expect(isEngineHost('ada.adalegallink.com')).toBe(true);
  });

  it('ignores a port and casing', () => {
    expect(isEngineHost('ADA.AdaLegalLink.com:443')).toBe(true);
  });

  it('treats the public apex and www as public', () => {
    expect(isEngineHost('adalegallink.com')).toBe(false);
    expect(isEngineHost('www.adalegallink.com')).toBe(false);
  });

  it('fails closed on an unknown host', () => {
    // A missing Host header must not accidentally open indexing.
    expect(isEngineHost(undefined)).toBe(true);
    expect(isEngineHost('')).toBe(true);
  });
});

describe('robotsBody', () => {
  it('disallows everything on the engine domain', () => {
    const body = robotsBody('ada.adalegallink.com');
    expect(body).toContain('Disallow: /\n');
    expect(body).not.toContain('Sitemap:');
  });

  it('does not disallow the whole site on the public apex', () => {
    const body = robotsBody('adalegallink.com');
    const lines = body.split('\n').map((l) => l.trim());
    expect(lines).not.toContain('Disallow: /');
  });

  it('still disallows every private path on the public apex', () => {
    const body = robotsBody('adalegallink.com');
    for (const p of PRIVATE_PATHS) {
      expect(body, `${p} was not disallowed`).toContain(`Disallow: ${p}`);
    }
  });

  it('advertises the sitemap on the apex, at the apex', () => {
    const body = robotsBody('adalegallink.com');
    expect(body).toContain('Sitemap: https://adalegallink.com/sitemap.xml');
    // Never point crawlers at the engine host.
    expect(body).not.toContain('ada.adalegallink.com');
  });

  it('fails closed for an unknown host', () => {
    expect(robotsBody(undefined)).toContain('Disallow: /');
  });
});
