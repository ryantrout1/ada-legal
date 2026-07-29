/**
 * Links that leave the building must name the public site.
 *
 * Eleven files hardcoded `https://ada.adalegallink.com`. That was right
 * while it was the whole product and the apex belonged to Base44, and
 * wrong the moment the apex became ours — but nothing would have said so.
 * An email carrying the old address still works, so the mistake is
 * invisible until somebody notices every readout link advertising a
 * domain that was meant to be internal.
 *
 * The four canonical tags were the dangerous ones. Served from the apex
 * they would have told search engines the real version of each page is at
 * a host whose robots.txt says `Disallow: /` — pointing crawlers at a URL
 * they are forbidden to fetch, on the standards guide, which is the
 * reason people find this site at all.
 *
 * Three places are allowed to keep naming it, and each is checked here so
 * the exception stays deliberate rather than becoming a hole.
 *
 * Ref: apex cutover prep.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PUBLIC_ORIGIN, publicUrl } from '@/lib/publicOrigin';

const ENGINE = 'ada.adalegallink.com';

/**
 * Files that may still name the engine host, and why.
 *
 * robots.ts   — ENGINE_HOST is the whole point: it marks the host that
 *               must never be indexed, on whichever host serves.
 * _cors.ts    — both origins are allowed callers. Removing it would break
 *               the engine host the day before it stops being used.
 * publicOrigin — explains all of this in its own header.
 */
const ALLOWED = new Set(['api/robots.ts', 'api/_cors.ts', 'src/lib/publicOrigin.ts']);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Comments may mention the host freely — only live code is the problem. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

describe('outgoing links name the public site', () => {
  const offenders = walk('src')
    .concat(walk('api'))
    .filter((f) => !ALLOWED.has(f.replace(/\\/g, '/')))
    .filter((f) => stripComments(readFileSync(f, 'utf8')).includes(ENGINE));

  it('no file builds a URL from the engine host', () => {
    // .jsx and .js are walked too. A search that only covered .ts and
    // .tsx missed three live components earlier today, twice.
    expect(offenders, `these still hardcode ${ENGINE}`).toEqual([]);
  });

  it('the exceptions are all still there and still needed', () => {
    for (const f of ALLOWED) {
      expect(readFileSync(f, 'utf8'), `${f} no longer mentions the engine host`).toContain(ENGINE);
    }
  });
});

describe('the public origin itself', () => {
  it('is the apex', () => {
    expect(PUBLIC_ORIGIN).toBe('https://adalegallink.com');
  });

  it('has no trailing slash, so joining a path never doubles up', () => {
    expect(PUBLIC_ORIGIN.endsWith('/')).toBe(false);
    expect(publicUrl('/s/abc')).toBe('https://adalegallink.com/s/abc');
    expect(publicUrl('s/abc')).toBe('https://adalegallink.com/s/abc');
  });
});
