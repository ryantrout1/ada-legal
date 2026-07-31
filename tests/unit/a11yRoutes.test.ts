/**
 * Unit test for the a11y audit route set (Phase 1, AAA remediation).
 *
 * Pins two acceptance criteria:
 *   AC5 — the audit route list is GENERATED from the router, not hardcoded.
 *          A public route present in App.tsx must appear in the audit set,
 *          or this test fails. (This is the guard that stops new pages from
 *          silently escaping the audit — the third hole that let the
 *          screenshot defects ship.)
 *   AC6 — every dynamic route (:slug / :num / :id) resolves to a CONCRETE
 *          path in the generated set (a real fixture, no ":" left in it).
 *
 * The generated set is committed at tests/a11y/routes.generated.json and
 * produced by scripts/gen-a11y-routes.mjs. This test reads the committed
 * JSON and the router source; it does not hit the network or the DB.
 *
 * Test-first: authored before the generator + JSON exist — red until
 * Phase 1 lands.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AUDIT_ROUTES } from '../a11y/lib/routes.js';

const APP_TSX = fileURLToPath(new URL('../../src/app/App.tsx', import.meta.url));

/** Public top-level route paths declared in App.tsx (excludes /admin/* and
 *  /portal/* subtrees, which are Clerk-gated and out of scope for the
 *  public contrast sweep — see /plan section 3b). */
function publicRoutePathsFromRouter(): string[] {
  const src = readFileSync(APP_TSX, 'utf8');
  const paths = [...src.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);
  return paths.filter(
    (p) =>
      p.startsWith('/') &&
      !p.startsWith('/admin') &&
      !p.startsWith('/portal') &&
      // reviewer-only unlinked tools are audited separately; keep the
      // public marketing/content surface as the AC5 contract set.
      !['/photo', '/review', '/review/:id', '/spot-review'].includes(p),
  );
}

describe('a11y audit — route set', () => {
  it('is non-empty and every entry is a concrete path (AC6: no unresolved params)', () => {
    expect(AUDIT_ROUTES.length).toBeGreaterThan(0);
    for (const r of AUDIT_ROUTES) {
      expect(r.path.startsWith('/')).toBe(true);
      expect(r.path).not.toContain(':'); // dynamic params must be resolved to a fixture
    }
  });

  it('covers every public router route — new pages cannot escape (AC5)', () => {
    const routerStatic = publicRoutePathsFromRouter().filter((p) => !p.includes(':'));
    const audited = new Set(AUDIT_ROUTES.map((r) => r.path));
    const missing = routerStatic.filter((p) => !audited.has(p));
    expect(missing, `router routes absent from the audit set: ${missing.join(', ')}`).toEqual([]);
  });

  it('resolves each dynamic router route to a concrete fixture path', () => {
    const routerDynamic = publicRoutePathsFromRouter().filter((p) => p.includes(':'));
    const audited = AUDIT_ROUTES.map((r) => r.path);
    for (const dyn of routerDynamic) {
      // e.g. "/lawsuits/:slug" → prefix "/lawsuits/"
      const prefix = dyn.slice(0, dyn.indexOf(':'));
      const hit = audited.some((a) => a.startsWith(prefix) && a.length > prefix.length);
      expect(hit, `no fixture path for dynamic route ${dyn}`).toBe(true);
    }
  });

  it('committed routes.generated.json matches the exported AUDIT_ROUTES', () => {
    const jsonPath = fileURLToPath(
      new URL('../a11y/routes.generated.json', import.meta.url),
    );
    const onDisk = JSON.parse(readFileSync(jsonPath, 'utf8')) as { path: string; name: string }[];
    expect(onDisk.map((r) => r.path).sort()).toEqual(
      AUDIT_ROUTES.map((r) => r.path).sort(),
    );
  });
});
