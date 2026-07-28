/**
 * Every old URL has to land somewhere real, and the two spellings of a
 * URL have to land in the same place.
 *
 * The redirect verifier checks that a request gets a 308 and ends up
 * where vercel.json says. It cannot tell you that vercel.json says the
 * wrong thing. Four entries did: `/adminclassactions` and
 * `/adminmassactions` pointed at `/admin/listings`, which is the six-row
 * firm-marketing table, while their capitalised twins correctly pointed
 * at `/admin/litigation`, the thirty-nine class and mass actions. Same
 * conflation the admin nav had. `/AdminSubscribers` went to the
 * dashboard even though `/admin/subscriptions` exists.
 *
 * All four verified clean for months, because a redirect to the wrong
 * real page is still a working redirect.
 *
 * Two rules here catch that shape:
 *
 *   1. Every destination resolves to a route the app actually declares.
 *      A redirect to a page that does not exist is a 404 with extra
 *      steps.
 *   2. `/Foo` and `/foo` agree. Base44 URLs were case-insensitive, so
 *      the pair exists for every page; a disagreement means somebody
 *      edited one and missed the other.
 *
 * Ref: /plan turn Base44 off, Phase 2.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

interface Redirect {
  source: string;
  destination: string;
  permanent?: boolean;
  /** Host or query conditions. Two entries for the same URL are only
   *  comparable when these match — /LawsuitDetail legitimately goes to
   *  the index or to a specific case depending on its query string. */
  has?: Array<Record<string, string>>;
}

const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as { redirects: Redirect[] };
const app = readFileSync('src/app/App.tsx', 'utf8');

/** Route paths declared in App.tsx, both absolute and nested. */
const declared = new Set(
  [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1].replace(/^\//, '')),
);

/** Strip the query and any :param or numeric tail so it can be matched. */
function pagePath(destination: string): string {
  return destination.split('?')[0].replace(/^\//, '');
}

/**
 * Does the app serve this path? Handles the nested admin/portal routes,
 * which App.tsx declares as bare segments under a parent.
 */
function isServed(path: string): boolean {
  if (path === '') return true; // the home route
  if (declared.has(path)) return true;
  const segments = path.split('/');
  // `admin/litigation` is declared as `litigation` inside the admin shell.
  if (segments.length > 1 && declared.has(segments.slice(1).join('/'))) return true;
  // `standards-guide/chapter/3` is declared as `/standards-guide/chapter/:num`.
  for (const d of declared) {
    const pattern = new RegExp(
      '^' + d.replace(/^\//, '').replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*') + '$',
    );
    if (pattern.test(path)) return true;
  }
  return false;
}

describe('redirect destinations', () => {
  it.each(config.redirects.map((r) => [r.source, r.destination] as const))(
    '%s lands on a page that exists',
    (source, destination) => {
      expect(isServed(pagePath(destination)), `${source} → ${destination} is not a route`).toBe(
        true,
      );
    },
  );
});

describe('the two spellings of a URL agree', () => {
  it('every case-pair points at the same place', () => {
    // Keyed by URL AND conditions: /LawsuitDetail with a slug in the
    // query goes to that case, without one it goes to the index. Those
    // are different rules, not a disagreement.
    const byLower = new Map<string, Map<string, string[]>>();
    for (const r of config.redirects) {
      const key = `${r.source.toLowerCase()}|${JSON.stringify(r.has ?? [])}`;
      if (!byLower.has(key)) byLower.set(key, new Map());
      const dests = byLower.get(key)!;
      if (!dests.has(r.destination)) dests.set(r.destination, []);
      dests.get(r.destination)!.push(r.source);
    }

    const disagreements: string[] = [];
    for (const [lower, dests] of byLower) {
      if (dests.size > 1) {
        const detail = [...dests.entries()]
          .map(([d, sources]) => `${sources.join(' and ')} → ${d}`)
          .join('; ');
        disagreements.push(`${lower}: ${detail}`);
      }
    }
    expect(disagreements, 'a URL sends people to two different pages').toEqual([]);
  });
});

describe('the redirect table is intact', () => {
  it('still holds all 188', () => {
    // The count is pinned so a bulk edit that drops entries is visible.
    expect(config.redirects).toHaveLength(188);
  });

  it('is permanent everywhere a page actually moved', () => {
    // Host-conditioned rules are the exception and should stay temporary:
    // portal.adalegallink.com/ → /portal is routing, not a page that
    // moved, and a permanent redirect there would be cached by every
    // browser that ever hit it.
    for (const r of config.redirects) {
      if (r.has?.some((h) => h.type === 'host')) continue;
      expect(r.permanent, `${r.source} is a temporary redirect`).toBe(true);
    }
  });
});
