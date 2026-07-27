/**
 * The sitemap and the route table have to agree, in both directions.
 *
 * They didn't. `/chat` sat at priority 0.9 — the second-highest URL on
 * the site — with no such route; it 301s to `/ada`. So the single most
 * important page after the homepage was advertised to crawlers as a
 * redirect, while the real front door was not listed at all. Four other
 * public pages were missing too, `/about-ada` among them.
 *
 * Nothing caught it because the sitemap was never routed until Gate C —
 * an unreachable file cannot be wrong in any way anyone notices.
 *
 * Both directions matter. A sitemap entry with no route sends crawlers
 * to a redirect or a soft 404; a public route with no entry is a page
 * nobody finds.
 *
 * Ref: B44 decommission, Gate C.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { STATIC_PAGES } from '../../api/sitemap.js';
import { PRIVATE_PATHS } from '../../api/robots.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const appSource = readFileSync(resolve(root, 'src/app/App.tsx'), 'utf8');

/** Top-level literal routes — no params, no wildcards. */
function declaredRoutes(): string[] {
  return [...appSource.matchAll(/<Route path="(\/[^"*:]*)"/g)].map((m) => m[1]!);
}

/** Branches that are gated, private, or slug-guarded. */
const NON_PUBLIC_PREFIXES = [
  '/admin',
  '/portal',
  '/review',
  '/photo',
  '/spot-review',
  '/s/',
];

function isPublicRoute(path: string): boolean {
  return !NON_PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p));
}

describe('sitemap ↔ route table', () => {
  const routes = declaredRoutes();

  it('reads a plausible route table', () => {
    // Guards the regex itself: a silent zero-match would make every
    // assertion below vacuously true.
    expect(routes.length).toBeGreaterThan(10);
    expect(routes).toContain('/');
  });

  for (const page of STATIC_PAGES) {
    it(`${page.path} is a real route`, () => {
      expect(
        routes,
        `${page.path} is in the sitemap but has no route — crawlers get a redirect or a soft 404`,
      ).toContain(page.path);
    });
  }

  it('lists every public route', () => {
    const listed = new Set(STATIC_PAGES.map((p) => p.path));
    const missing = routes
      .filter(isPublicRoute)
      .filter((r) => !listed.has(r))
      .sort();
    expect(missing, 'public routes absent from the sitemap').toEqual([]);
  });

  it('lists no private path', () => {
    // Belt and braces against robots.ts and the sitemap disagreeing.
    for (const page of STATIC_PAGES) {
      const isPrivate = PRIVATE_PATHS.some((p) => page.path.startsWith(p));
      expect(isPrivate, `${page.path} is disallowed in robots but listed in the sitemap`).toBe(
        false,
      );
    }
  });

  it('gives the front door a higher priority than the legal pages', () => {
    const ada = STATIC_PAGES.find((p) => p.path === '/ada');
    const terms = STATIC_PAGES.find((p) => p.path === '/terms');
    expect(Number(ada?.priority)).toBeGreaterThan(Number(terms?.priority));
  });
});
