/**
 * Build-time data for the prerendered lawsuit pages.
 *
 * The lawsuit list and detail pages fetch their data in the browser. A
 * crawler that does not run JavaScript would see "Loading…", so
 * scripts/prerender.mjs fetches the cases at build time and renders the
 * real page with that data. For the browser to hydrate that HTML without a
 * mismatch, its first render has to start from the same data, so the build
 * also writes it into the page as a JSON block (id="litigation-seed").
 *
 * The seed is only honored for the path it was built for, and the page
 * still fetches fresh data as soon as it mounts, so a visitor sees current
 * data. The seed only decides what the first paint, and the crawler, see.
 */

import type { PublicLawsuitDetailRow, PublicLawsuitRow } from './lawsuitTypes.js';

export type LitigationSeed =
  | { path: string; kind: 'list'; rows: PublicLawsuitRow[] }
  | { path: string; kind: 'detail'; row: PublicLawsuitDetailRow };

export const SEED_ELEMENT_ID = 'litigation-seed';

let current: LitigationSeed | null = null;

export function setLitigationSeed(seed: LitigationSeed | null): void {
  current = seed;
}

/** Called once in the browser before hydration. */
export function readSeedFromDocument(): void {
  try {
    const el = document.getElementById(SEED_ELEMENT_ID);
    if (el?.textContent) current = JSON.parse(el.textContent) as LitigationSeed;
  } catch {
    current = null;
  }
}

export function seededList(pathname: string): PublicLawsuitRow[] | null {
  return current?.kind === 'list' && current.path === pathname ? current.rows : null;
}

export function seededDetail(pathname: string): PublicLawsuitDetailRow | null {
  return current?.kind === 'detail' && current.path === pathname ? current.row : null;
}
