/**
 * M7 — the Base44 flat-route 301 map.
 *
 * All 91 Base44 pages are indexed. Once the apex points at this
 * project, any one of them without a redirect is a dead end for a
 * reader who arrived mid-question from search — the worst possible
 * moment to hand someone a 404.
 *
 * The map is generated from the same slug and chapter conventions
 * b44PageToRoute uses, so the redirect table and the in-app link
 * resolver cannot disagree. This test re-derives the expected set from
 * the Base44 page list and asserts every one is covered, which means a
 * page added to B44 before cutover fails here rather than silently
 * going unmapped.
 *
 * These entries are INERT until DNS moves: nothing serves /Lawsuits on
 * ada.adalegallink.com today. Shipping them early is deliberate — it
 * means the cutover itself is a DNS change and an unparking commit,
 * not a 92-entry config edit made under time pressure.
 *
 * Ref: /plan M7.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8')) as {
  redirects: Array<{
    source: string;
    destination: string;
    permanent?: boolean;
    has?: unknown;
  }>;
};

const bySource = new Map(config.redirects.map((r) => [r.source, r]));

/** A representative slice of B44's 91 pages, one per shape. */
const SAMPLES: [string, string][] = [
  // consumer surfaces
  ['/Lawsuits', '/lawsuits'],
  ['/Attorneys', '/attorneys'],
  ['/AboutAda', '/about-ada'],
  ['/StandardsGuide', '/standards-guide'],
  ['/HomeV2', '/'],
  ['/Home', '/'],
  ['/Ada', '/chat'],
  // chapters
  ['/StandardsCh1', '/standards-guide/chapter/1'],
  ['/StandardsCh4', '/standards-guide/chapter/4'],
  ['/StandardsCh10', '/standards-guide/chapter/10'],
  // guides — kebab-cased from the PascalCase page name
  ['/GuideRamps', '/standards-guide/guide/ramps'],
  ['/GuideServiceAnimals', '/standards-guide/guide/service-animals'],
  ['/GuideTitleIII', '/standards-guide/guide/title-iii'],
  ['/GuideWcagExplained', '/standards-guide/guide/wcag-explained'],
  // admin
  ['/AdminDashboard', '/admin/dashboard'],
  ['/AdminSettings', '/admin/settings'],
  ['/AdminFeedbackV2', '/admin/feedback'],
  // surfaces this app never built — must still land somewhere real
  ['/RightsPathway', '/chat'],
  ['/TitleIPathway', '/chat'],
  ['/MyCases', '/'],
  ['/Login', '/'],
];

describe('B44 flat-route 301 map', () => {
  it('covers every sampled legacy route', () => {
    const missing = SAMPLES.filter(([src]) => !bySource.has(src)).map(([s]) => s);
    expect(missing, `unmapped legacy routes: ${missing.join(', ')}`).toEqual([]);
  });

  it('sends each one to the right destination', () => {
    for (const [src, dest] of SAMPLES) {
      expect(bySource.get(src)?.destination, `${src} points at the wrong page`).toBe(dest);
    }
  });

  it('uses permanent redirects — these are indexed URLs', () => {
    for (const [src] of SAMPLES) {
      expect(bySource.get(src)?.permanent, `${src} should be a 301, not a 307`).toBe(true);
    }
  });

  it('maps roughly the whole Base44 surface, not just the easy pages', () => {
    // 91 pages plus the LawsuitDetail query-param rule.
    const legacy = config.redirects.filter((r) => /^\/[A-Z]/.test(r.source));
    expect(legacy.length).toBeGreaterThanOrEqual(91);
  });

  it('carries a slug-preserving rule for lawsuit detail links', () => {
    // /LawsuitDetail?slug=x must reach /lawsuits/x, not the index —
    // dropping someone on a list when they clicked a specific case is
    // a soft dead end.
    const rule = config.redirects.find(
      (r) => r.source === '/LawsuitDetail' && r.has !== undefined,
    );
    expect(rule, 'no query-preserving rule for /LawsuitDetail').toBeDefined();
    expect(rule?.destination).toBe('/lawsuits/:slug');
  });

  it('never redirects a legacy route back to Base44', () => {
    // The point of the map is to leave Base44, not to bounce readers
    // back into the app being decommissioned.
    for (const r of config.redirects.filter((x) => /^\/[A-Z]/.test(x.source))) {
      expect(r.destination, `${r.source} still points at Base44`).not.toContain(
        'adalegallink.com',
      );
    }
  });
});

describe('cutover safety', () => {
  it('still parks the consumer routes until DNS moves', () => {
    // Unparking is a separate, deliberate commit at cutover time. If
    // this assertion ever fails unexpectedly, the consumer site went
    // public on the engine domain while the apex still served Base44 —
    // two live copies of the same content.
    const parked = config.redirects.filter(
      (r) => Array.isArray((r as { missing?: unknown }).missing),
    );
    const sources = parked.map((r) => r.source);
    expect(sources).toContain('/');
    expect(sources).toContain('/lawsuits');
    expect(sources).toContain('/attorneys');
  });
});
