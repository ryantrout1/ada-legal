/**
 * M2 Phase 3 — landing link integrity (AC-5).
 *
 * The ported landing carries ~45 internal links written in Base44's flat
 * `/PageName` form. They resolve through b44PageToRoute. Hand-checking
 * them is exactly the kind of job that gets done once and then rots, so
 * every href the landing can render is walked here against the real route
 * table. A link that would 404 in production fails the build instead.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { b44PageToRoute, isB44PageRef } from '../../src/app/components/standards/landing/b44PageToRoute.js';
import { readCode } from '../support/sourceText.js';
import { GUIDE_LOADERS, ALL_GUIDES } from '../../src/app/routes/public/standardsGuideIndex.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const LANDING_DIR = resolve(root, 'src/app/components/standards/landing');

const read = (f: string) => readFileSync(resolve(LANDING_DIR, f), 'utf8');

/** Every `href: '...'` in the resource data. */
function hrefsFrom(source: string): string[] {
  return [...source.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]);
}

describe('AC-5: every landing link resolves', () => {
  const sections = read('ResourceSections.jsx');
  const hrefs = hrefsFrom(sections);

  it('finds the full set of resource links', () => {
    // Guards the extraction itself: if a refactor changes the data shape,
    // this test would otherwise silently pass by checking nothing.
    expect(hrefs.length).toBeGreaterThanOrEqual(40);
  });

  it('resolves every internal resource link to a real route', () => {
    const broken: string[] = [];
    for (const href of hrefs) {
      if (!isB44PageRef(href)) continue; // external URL — not ours to resolve
      const route = b44PageToRoute(href);
      if (!route) broken.push(href);
    }
    expect(broken, 'these landing links resolve to nothing and would 404').toEqual([]);
  });

  it('points every guide link at a slug the router can actually load', () => {
    const unloadable: string[] = [];
    for (const href of hrefs) {
      if (!isB44PageRef(href)) continue;
      const route = b44PageToRoute(href);
      if (!route?.startsWith('/standards-guide/guide/')) continue;
      const slug = route.split('/').pop()!;
      if (!(slug in GUIDE_LOADERS)) unloadable.push(`${href} → ${slug}`);
    }
    expect(unloadable, 'route resolves but no lazy loader is registered').toEqual([]);
  });
});

describe('b44PageToRoute', () => {
  it('maps chapter pages to the nested chapter route', () => {
    expect(b44PageToRoute('StandardsCh1')).toBe('/standards-guide/chapter/1');
    expect(b44PageToRoute('StandardsCh10')).toBe('/standards-guide/chapter/10');
  });

  it('rejects chapter numbers outside the real range', () => {
    expect(b44PageToRoute('StandardsCh11')).toBeNull();
    expect(b44PageToRoute('StandardsCh0')).toBeNull();
  });

  it('kebab-cases guide names to their SEO-stable slugs', () => {
    expect(b44PageToRoute('GuideAdaCoordinators')).toBe(
      '/standards-guide/guide/ada-coordinators',
    );
    expect(b44PageToRoute('/GuideRamps')).toBe('/standards-guide/guide/ramps');
  });

  it('routes Base44 surfaces this app never built to where the job now lives', () => {
    // Intake and RightsPathway were form-based; Ada is the front door here.
    expect(b44PageToRoute('Intake')).toBe('/ada');
    expect(b44PageToRoute('RightsPathway')).toBe('/ada');
    expect(b44PageToRoute('HomeV2')).toBe('/');
  });

  it('returns null rather than guessing for unknown pages', () => {
    // A silent fallback to '/' turns a broken link into a wrong link, which
    // is harder to spot and worse for the reader.
    expect(b44PageToRoute('GuideDoesNotExist')).toBeNull();
    expect(b44PageToRoute('SomeOldPage')).toBeNull();
    expect(b44PageToRoute('')).toBeNull();
  });

  it('covers every guide in the index', () => {
    const unreachable = ALL_GUIDES.filter(
      (g) => !b44PageToRoute(`Guide${g.slug.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('')}`),
    );
    expect(unreachable.map((g) => g.slug)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// AAA — the landing's category colours (WCAG 1.4.11, non-text 3:1)
// ---------------------------------------------------------------------------

describe('resource category colours clear 3:1 in every display mode', () => {
  const css = readFileSync(resolve(root, 'src/app.css'), 'utf8');

  /**
   * Find the rule block for `selector` that actually declares `must`.
   * Several selectors appear more than once in app.css — e.g. each display
   * mode has a small color-scheme block as well as its token block — so
   * taking the first match silently resolves against the wrong rule.
   */
  function blockFor(selector: string, must = ''): string {
    let from = 0;
    for (;;) {
      const i = css.indexOf(selector, from);
      if (i === -1) throw new Error(`${selector} declaring ${must || '(any)'} not found`);
      const block = css.slice(i, css.indexOf('}', i));
      if (!must || block.includes(must)) return block;
      from = i + selector.length;
    }
  }
  function luminance(hex: string): number {
    const h = hex.replace('#', '');
    const ch = [0, 2, 4].map((i) => {
      const c = parseInt(h.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  function contrast(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  }
  const TOKENS = [
    '--sg-cat-rights',
    '--sg-cat-business',
    '--sg-cat-design',
    '--sg-cat-web',
    '--sg-cat-gov',
  ];

  // [label, selector carrying the mode's tokens, selector carrying its card tier]
  const CASES: Array<[string, string, string]> = [
    ['default', ':root {', '@theme'],
    ['dark', ':root[data-display="dark"]', ':root[data-display="dark"]'],
    ['contrast', ':root[data-display="contrast"]', ':root[data-display="contrast"]'],
    ['low-vision', ':root[data-display="low-vision"]', ':root[data-display="low-vision"]'],
  ];

  it.each(CASES)('%s mode: every category dot is visible on its card', (_label, tokenSel, cardSel) => {
    const tokens = blockFor(tokenSel, '--sg-cat-rights');
    const cardBlock = blockFor(cardSel, '--color-surface-0');
    const card = (cardBlock.match(/--color-surface-0:\s*(#[0-9A-Fa-f]{6})/) ?? [])[1] ?? '#FFFFFF';
    const failing: string[] = [];
    for (const t of TOKENS) {
      const m = tokens.match(new RegExp(`${t}:\\s*(#[0-9A-Fa-f]{6})`));
      if (!m) {
        failing.push(`${t}: undeclared`);
        continue;
      }
      const r = contrast(m[1], card);
      if (r < 3) failing.push(`${t} ${m[1]} on ${card} = ${r.toFixed(2)}:1`);
    }
    expect(failing, 'category dots below the 1.4.11 non-text floor').toEqual([]);
  });

  it('the landing ships no hardcoded hex colours', () => {
    const files = ['ResourceSections.jsx', 'ResourceCard.jsx', 'StandardsSidebar.jsx', 'ChapterNavigator.jsx'];
    const offenders: string[] = [];
    for (const f of files) {
      const src = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
      const hits = src.match(/#[0-9A-Fa-f]{6}/g);
      if (hits) offenders.push(`${f}: ${hits.join(', ')}`);
    }
    expect(offenders, 'design tokens only — see policy.md').toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Hero search index (ADAAssistant) — same link contract as the resource cards
// ---------------------------------------------------------------------------

describe('hero search index resolves', () => {
  const src = read('ADAAssistant.jsx');
  const pages = [...new Set([...src.matchAll(/page:\s*"([A-Za-z0-9]+)"/g)].map((m) => m[1]))];

  it('finds the full index', () => {
    // Guards the extraction: a data-shape change must not make this vacuous.
    expect(pages.length).toBeGreaterThanOrEqual(50);
  });

  it('routes every indexed page somewhere real', () => {
    const broken = pages.filter((p) => !b44PageToRoute(p));
    expect(broken, 'search results that would 404').toEqual([]);
  });

  it('renders in the hero rather than being deferred', () => {
    // The component was briefly omitted on the assumption it shared the AI
    // helper's backend. It makes no network call at all.
    const hero = read('StandardsHero.jsx');
    expect(hero).toMatch(/<ADAAssistant\s*\/>/);
    expect(readCode(resolve(LANDING_DIR, 'ADAAssistant.jsx')))
      .not.toMatch(/InvokeLLM|base44|useUniversalCta/);
  });
});
