/**
 * Search titles and descriptions the Miloe engine sets, applied over routeMeta.ts.
 *
 * The engine commits content/seo-meta.json ({ "/path": { title, description } })
 * and then checks the live page for the new title. This module is the site's
 * half of that contract: every reader of page titles (RouteSeo, GuidePage and
 * the prerender via entry-server) imports from here, not from routeMeta.ts.
 *
 * An entry is applied only when it would pass the table's own rules (title 60
 * characters or fewer, description 155 or fewer, neither used by another
 * route). Anything else is skipped and the page keeps its current copy, so a
 * bad entry can never fail the prerender and block a deploy.
 *
 * Kept out of routeMeta.ts on purpose: api/sitemap.ts imports routeMeta.ts at
 * function runtime and needs only paths, so it never loads this JSON.
 */

import { ROUTE_META as BASE, type RouteMeta } from './routeMeta.js';
import engineFile from '../../../content/seo-meta.json';

export const MAX_TITLE = 60;
export const MAX_DESCRIPTION = 155;

type Entry = { title?: unknown; description?: unknown };

const one = (s: string) => s.replace(/\s+/g, ' ').trim();

/** The routes with every acceptable entry from `file` applied. Pure, exported for tests. */
export function applySeoMeta(base: RouteMeta[], file: Record<string, Entry>): RouteMeta[] {
  const out = base.map((r) => ({ ...r }));
  for (const [path, e] of Object.entries(file ?? {})) {
    const i = out.findIndex((r) => r.path === path);
    if (i < 0 || !e || typeof e.title !== 'string' || typeof e.description !== 'string') continue;
    const title = one(e.title);
    const description = one(e.description);
    if (!title || title.length > MAX_TITLE) continue;
    if (!description || description.length > MAX_DESCRIPTION) continue;
    const clash = out.some((r, j) => j !== i && (r.title === title || r.description === description));
    if (clash) continue;
    out[i] = { ...out[i], title, description };
  }
  return out;
}

/** Every prerendered route, with the engine's search copy where it applies. */
export const ROUTE_META: RouteMeta[] = applySeoMeta(BASE, engineFile as Record<string, Entry>);

const BY_PATH = new Map(ROUTE_META.map((r) => [r.path, r]));

/** Look up a route's SEO copy. Accepts a trailing slash. */
export function routeMeta(pathname: string): RouteMeta | undefined {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return BY_PATH.get(p);
}
