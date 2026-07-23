/**
 * M3 Phase 4 — /class-actions → /lawsuits rename completeness.
 *
 * The rename reaches further than the two page files: the sitemap
 * emits absolute URLs, the session package carries a slug for a
 * link-back, a Playwright spec navigates to a detail page, and the
 * Standards Guide landing resolves ~45 links through b44PageToRoute.
 * Miss one and it 301-bounces forever — which works, but means every
 * internal link takes an extra hop, and the sitemap advertises URLs
 * that are no longer canonical.
 *
 * So this walks the actual source tree rather than trusting a
 * checklist. Comments are stripped first: several files legitimately
 * DESCRIBE the old route in a header comment explaining the rename,
 * and matching raw source would fire on the explanation rather than
 * the code — the readCode discipline established in M2.
 *
 * Ref: /plan M3 Phase 4, AC6.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, extname } from 'node:path';
import { readCode } from '../support/sourceText.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) {
      continue;
    }
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) {
      walk(full, acc);
    } else if (SOURCE_EXTENSIONS.has(extname(entry))) {
      acc.push(full);
    }
  }
  return acc;
}

const sourceFiles = [
  ...walk(resolve(root, 'src')),
  ...walk(resolve(root, 'api')),
  ...walk(resolve(root, 'tests')),
];

describe('route rename — no live /class-actions references remain', () => {
  it('finds the source tree (guard against a broken walker)', () => {
    // A walker that silently returns [] would make every assertion
    // below vacuously pass.
    expect(sourceFiles.length).toBeGreaterThan(200);
  });

  it('has no /class-actions path left in any executable code', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles) {
      // This guard file necessarily contains the string it looks for.
      if (file.endsWith('routeRename.test.ts')) continue;
      const code = readCode(file);
      if (code.includes('/class-actions')) {
        offenders.push(relative(root, file));
      }
    }
    expect(
      offenders,
      `these still route to the retired path:\n  ${offenders.join('\n  ')}`,
    ).toEqual([]);
  });

  it('no longer ships the replaced mock pages', () => {
    const names = sourceFiles.map((f) => relative(root, f));
    for (const gone of [
      'src/app/routes/public/ClassActions.tsx',
      'src/app/routes/public/ClassActionDetail.tsx',
      'src/app/routes/public/components/ClassActionsBanner.tsx',
    ]) {
      expect(names, `${gone} should have been deleted`).not.toContain(gone);
    }
  });
});

describe('route rename — the legacy path redirects', () => {
  const config = JSON.parse(
    readFileSync(resolve(root, 'vercel.json'), 'utf8'),
  ) as {
    redirects: Array<{
      source: string;
      destination: string;
      permanent?: boolean;
    }>;
  };

  it('301s both legacy shapes to their /lawsuits counterparts', () => {
    const list = config.redirects.find((r) => r.source === '/class-actions');
    const detail = config.redirects.find(
      (r) => r.source === '/class-actions/:slug',
    );

    expect(list, '/class-actions redirect missing').toBeDefined();
    expect(list?.destination).toBe('/lawsuits');
    expect(list?.permanent, 'the rename is permanent — use a 301').toBe(true);

    expect(detail, '/class-actions/:slug redirect missing').toBeDefined();
    expect(detail?.destination).toBe('/lawsuits/:slug');
    expect(detail?.permanent, 'the rename is permanent — use a 301').toBe(true);
  });

  it('orders the legacy redirect so it cannot be shadowed', () => {
    // Vercel takes the first matching redirect. If a broader parked
    // rule sat above these, /class-actions would bounce to the B44
    // apex and never reach /lawsuits.
    const sources = config.redirects.map((r) => r.source);
    const legacy = sources.indexOf('/class-actions');
    const parkedApex = sources.findIndex(
      (s, i) =>
        i < legacy &&
        (s === '/class-actions' || s === '/:path*' || s === '/(.*)'),
    );
    expect(parkedApex, 'a broader rule shadows the legacy redirect').toBe(-1);
  });
});
