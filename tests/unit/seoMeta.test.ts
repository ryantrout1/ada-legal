/**
 * The Miloe engine's search copy (content/seo-meta.json) applied over the
 * route table. The engine checks the live page for its title, so an entry the
 * site silently ignores leaves the engine waiting forever; an entry that breaks
 * the table's rules would fail the prerender and block every deploy.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { ROUTE_META as BASE, type RouteMeta } from '../../src/lib/seo/routeMeta.js';
import {
  MAX_DESCRIPTION,
  MAX_TITLE,
  ROUTE_META,
  applySeoMeta,
  routeMeta,
} from '../../src/lib/seo/seoMeta.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const file = JSON.parse(readFileSync(resolve(root, 'content/seo-meta.json'), 'utf8')) as Record<
  string,
  { title: string; description: string }
>;

const base: RouteMeta[] = [
  { path: '/a', title: 'Page A title here', description: 'Description for page A that is long enough.', ogType: 'website' },
  { path: '/b', title: 'Page B title here', description: 'Description for page B that is long enough.', ogType: 'article' },
];

describe('applySeoMeta', () => {
  it('replaces the title and description for a known path and keeps the rest', () => {
    const out = applySeoMeta(base, { '/a': { title: 'New A title', description: 'New A description text' } });
    expect(out[0]).toEqual({ ...base[0], title: 'New A title', description: 'New A description text' });
    expect(out[1]).toEqual(base[1]);
  });

  it('ignores paths the site does not have', () => {
    expect(applySeoMeta(base, { '/nope': { title: 'x title', description: 'y description' } })).toEqual(base);
  });

  it('skips a title over the limit', () => {
    const long = 'x'.repeat(MAX_TITLE + 1);
    expect(applySeoMeta(base, { '/a': { title: long, description: 'fine description' } })[0]).toEqual(base[0]);
  });

  it('skips a description over the limit', () => {
    const long = 'x'.repeat(MAX_DESCRIPTION + 1);
    expect(applySeoMeta(base, { '/a': { title: 'fine title', description: long } })[0]).toEqual(base[0]);
  });

  it('skips an entry that would duplicate another route', () => {
    const out = applySeoMeta(base, { '/a': { title: base[1].title, description: 'unique description' } });
    expect(out[0]).toEqual(base[0]);
  });

  it('skips malformed entries and does not change the input', () => {
    const copy = structuredClone(base);
    applySeoMeta(copy, { '/a': { title: 1, description: null } as never, '/b': null as never });
    expect(copy).toEqual(base);
  });
});

describe('the committed content/seo-meta.json', () => {
  it('applies every entry that fits the rules', () => {
    for (const [path, e] of Object.entries(file)) {
      const fits = e.title.trim().length <= MAX_TITLE && e.description.trim().length <= MAX_DESCRIPTION;
      if (!fits || !BASE.some((r) => r.path === path)) continue;
      expect(routeMeta(path)?.title, path).toBe(e.title.trim());
      expect(routeMeta(path)?.description, path).toBe(e.description.trim());
    }
  });

  it('keeps the route table within its rules', () => {
    expect(ROUTE_META).toHaveLength(BASE.length);
    for (const r of ROUTE_META) {
      expect(r.title.length, r.path).toBeLessThanOrEqual(MAX_TITLE);
      expect(r.description.length, r.path).toBeLessThanOrEqual(MAX_DESCRIPTION);
    }
    expect(new Set(ROUTE_META.map((r) => r.title)).size).toBe(ROUTE_META.length);
    expect(new Set(ROUTE_META.map((r) => r.description)).size).toBe(ROUTE_META.length);
  });
});
