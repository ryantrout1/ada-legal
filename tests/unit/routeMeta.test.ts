/**
 * The SEO table behind the prerendered pages.
 *
 * Every prerendered route needs its own title and description, within the
 * lengths search results display, and the sitemap has to list exactly the
 * pages that are prerendered. scripts/prerender.mjs enforces the same rules
 * at build time against the rendered HTML; these tests catch a bad edit
 * before a build is needed.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  GUIDE_META,
  ROUTE_META,
  prerenderPaths,
  routeMeta,
} from '../../src/lib/seo/routeMeta.js';
import { GUIDE_LOADERS } from '../../src/app/routes/public/standardsGuideIndex.js';
import { CHAPTER_META } from '../../src/app/routes/public/chapterMeta.js';
import { STATIC_PAGES, prerenderedEntries } from '../../api/sitemap.js';
import { PRIVATE_PATHS } from '../../api/robots.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const appSource = readFileSync(resolve(root, 'src/app/App.tsx'), 'utf8');

describe('route meta table', () => {
  it('covers every static page, 10 chapters and every guide', () => {
    expect(ROUTE_META).toHaveLength(STATIC_PAGES.length + 10 + Object.keys(GUIDE_LOADERS).length);
  });

  it('has a title of 60 characters or fewer on every route', () => {
    const tooLong = ROUTE_META.filter((r) => r.title.length > 60).map(
      (r) => `${r.path} (${r.title.length})`,
    );
    expect(tooLong).toEqual([]);
  });

  it('has a description of 155 characters or fewer on every route', () => {
    const tooLong = ROUTE_META.filter((r) => r.description.length > 155).map(
      (r) => `${r.path} (${r.description.length})`,
    );
    expect(tooLong).toEqual([]);
  });

  it('has a real title and description on every route', () => {
    for (const r of ROUTE_META) {
      expect(r.title.trim().length, `${r.path} title`).toBeGreaterThan(10);
      expect(r.description.trim().length, `${r.path} description`).toBeGreaterThan(40);
    }
  });

  it('shares no title and no description between two routes', () => {
    const titles = ROUTE_META.map((r) => r.title);
    const descriptions = ROUTE_META.map((r) => r.description);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('lists each path once', () => {
    const paths = prerenderPaths();
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('matches the guide registry slug for slug', () => {
    expect(GUIDE_META.map((g) => g.slug).sort()).toEqual(Object.keys(GUIDE_LOADERS).sort());
  });

  it('has all ten chapters', () => {
    for (const c of CHAPTER_META) {
      expect(routeMeta(`/standards-guide/chapter/${c.num}`), `chapter ${c.num}`).toBeDefined();
    }
    expect(CHAPTER_META).toHaveLength(10);
  });

  it('only names routes App.tsx declares', () => {
    const literal = new Set(
      [...appSource.matchAll(/<Route path="(\/[^"*:]*)"/g)].map((m) => m[1]!),
    );
    for (const r of ROUTE_META) {
      if (r.path.startsWith('/standards-guide/chapter/')) {
        expect(appSource).toContain('path="/standards-guide/chapter/:num"');
      } else if (r.path.startsWith('/standards-guide/guide/')) {
        expect(appSource).toContain('path="/standards-guide/guide/:slug"');
      } else {
        expect(literal.has(r.path), `${r.path} is not a route in App.tsx`).toBe(true);
      }
    }
  });

  it('never names a path robots.txt disallows', () => {
    for (const r of ROUTE_META) {
      const blocked = PRIVATE_PATHS.some((p) => r.path === p || r.path.startsWith(p));
      expect(blocked, `${r.path} is prerendered but disallowed in robots.txt`).toBe(false);
    }
  });

  it('accepts a trailing slash when looking a route up', () => {
    expect(routeMeta('/glossary/')?.path).toBe('/glossary');
    expect(routeMeta('/')?.path).toBe('/');
    expect(routeMeta('/standards-guide/guide/not-a-guide')).toBeUndefined();
  });
});

describe('sitemap lists every prerendered page', () => {
  it('has exactly the prerendered paths, once each', () => {
    const locs = prerenderedEntries().map((e) => e.loc);
    const expected = prerenderPaths().map((p) => `https://adalegallink.com${p}`);
    expect(locs.slice().sort()).toEqual(expected.slice().sort());
    expect(new Set(locs).size).toBe(locs.length);
  });
});
