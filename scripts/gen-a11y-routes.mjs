/**
 * gen-a11y-routes.mjs — generate the AAA audit route set from the router.
 *
 * Reads src/app/App.tsx, extracts every public top-level route, drops the
 * Clerk-gated /admin/* and /portal/* subtrees and the unlinked reviewer
 * tools, resolves each dynamic route (:slug / :num / :id) to ONE concrete
 * fixture, and writes tests/a11y/routes.generated.json.
 *
 * Dynamic-route fixtures are sourced from real data so the audited detail
 * pages actually render. Slugs that change rarely are inlined here with a
 * comment on where they came from; refresh them by re-running against Neon
 * / the standards index when the underlying rows change:
 *
 *   lawsuit slug   → litigation_listings.slug (Neon), newest public row
 *   guide slug     → src/lib/standardsIndex.ts guideSlug
 *   chapter num    → src/app/routes/public/chapterMeta.ts (1..N)
 *
 * Usage: node scripts/gen-a11y-routes.mjs
 * The output JSON is committed; CI does not regenerate (no DB at test time).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('..', import.meta.url);
const APP_TSX = fileURLToPath(new URL('src/app/App.tsx', ROOT));
const OUT = fileURLToPath(new URL('tests/a11y/routes.generated.json', ROOT));

// --- Dynamic-route fixtures (real, current data) ---------------------------
// Refresh when the underlying rows change. Verified 2026-07-31.
const FIXTURES = {
  '/lawsuits/:slug': { path: '/lawsuits/niles-v-hilton-bed-heights', name: 'lawsuit detail' },
  '/standards-guide/guide/:slug': {
    path: '/standards-guide/guide/turning-handrails',
    name: 'standards guide detail',
  },
  '/standards-guide/chapter/:num': {
    path: '/standards-guide/chapter/1',
    name: 'standards chapter',
  },
};

// Routes that exist in the router but are deliberately NOT in the public
// contrast sweep: Clerk-gated subtrees, unlinked reviewer tools, and
// slug-guarded readouts that need a live paid/intake session to render.
const EXCLUDE_EXACT = new Set([
  '/photo',
  '/review',
  '/review/:id',
  '/spot-review',
  '/s/:slug', // needs a live intake session slug
  '/spot/r/:slug', // needs a live released report slug
]);

// Friendly names for known static routes (fallback derives from the path).
const NAMES = {
  '/': 'homepage',
  '/ada': 'chat',
  '/lawsuits': 'class-actions directory',
  '/attorneys': 'attorneys directory',
  '/for-attorneys': 'for-attorneys page',
  '/accessibility': 'accessibility statement',
  '/about-ada': 'about Ada',
  '/privacy': 'privacy policy',
  '/terms': 'terms of service',
  '/glossary': 'glossary',
  '/standards-guide': 'standards guide landing',
  '/spot': 'Spot landing',
};

function nameFor(path) {
  if (NAMES[path]) return NAMES[path];
  return path.replace(/^\//, '').replace(/\//g, ' ') || 'root';
}

function main() {
  const src = readFileSync(APP_TSX, 'utf8');
  const all = [...src.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);

  const routes = [];
  const seen = new Set();

  for (const p of all) {
    if (!p.startsWith('/')) continue; // nested relative admin/portal paths
    if (p.startsWith('/admin') || p.startsWith('/portal')) continue;
    if (EXCLUDE_EXACT.has(p)) continue;

    if (p.includes(':')) {
      const fx = FIXTURES[p];
      if (!fx) {
        console.warn(`[gen-a11y-routes] no fixture for dynamic route ${p} — skipping`);
        continue;
      }
      if (seen.has(fx.path)) continue;
      seen.add(fx.path);
      routes.push(fx);
    } else {
      if (seen.has(p)) continue;
      seen.add(p);
      routes.push({ path: p, name: nameFor(p) });
    }
  }

  routes.sort((a, b) => a.path.localeCompare(b.path));
  writeFileSync(OUT, JSON.stringify(routes, null, 2) + '\n');
  console.log(`[gen-a11y-routes] wrote ${routes.length} routes to ${OUT}`);
}

main();
