/**
 * GET /api/sitemap
 *
 * Dynamically generated sitemap.xml listing every public page the
 * site wants search engines to index. Rewritten from /sitemap.xml
 * via vercel.json so the canonical URL still reads correctly.
 *
 * Includes:
 *   - Static public pages (/, /ada, /lawsuits, /attorneys, etc.)
 *   - One <url> entry per active class-action listing, with lastmod
 *     set to the listing row's current_period_end (a cheap proxy for
 *     "the subscription last rolled," acceptable freshness hint for
 *     crawlers even though it isn't the literal updated_at)
 *
 * Cache: 15 min browser / 1h CDN / 24h SWR. Listings change rarely
 * and crawlers re-fetch sitemaps slowly; this is more than fresh enough.
 *
 * Ref: Step 26, Commit 3.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from './_shared.js';
import { GUIDE_META } from '../src/lib/seo/routeMeta.js';
import { CHAPTER_META } from '../src/app/routes/public/chapterMeta.js';

/**
 * Every <loc> is the PUBLIC apex, regardless of which host served the
 * request. A sitemap advertising ada.adalegallink.com would invite
 * crawlers onto the engine domain — the one thing robots.ts exists to
 * prevent — and after the Base44 cutover would split the same content
 * across two hostnames with no canonical signal between them.
 */
const SITE_URL = 'https://adalegallink.com';

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

/**
 * Every static public page, as a path.
 *
 * Exported so a test can assert each one is a real route in App.tsx.
 * That guard exists because this list carried `/chat` at priority 0.9 —
 * the second-highest URL on the site — for as long as the sitemap has
 * existed. There is no /chat route; it 301s to /ada. A sitemap should
 * list canonical destinations, not redirects, and the actual front door
 * was missing entirely while a redirect stood in for it.
 *
 * Anything reachable and public belongs here. Anything gated, private,
 * or slug-guarded does not — see PRIVATE_PATHS in robots.ts.
 */
export const STATIC_PAGES: {
  path: string;
  changefreq: string;
  priority: string;
}[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/ada', changefreq: 'weekly', priority: '0.9' },
  { path: '/lawsuits', changefreq: 'daily', priority: '0.9' },
  { path: '/standards-guide', changefreq: 'weekly', priority: '0.9' },
  { path: '/spot', changefreq: 'weekly', priority: '0.8' },
  { path: '/attorneys', changefreq: 'weekly', priority: '0.7' },
  { path: '/for-attorneys', changefreq: 'monthly', priority: '0.6' },
  { path: '/glossary', changefreq: 'monthly', priority: '0.5' },
  { path: '/accessibility', changefreq: 'monthly', priority: '0.5' },
  { path: '/about-ada', changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy', changefreq: 'monthly', priority: '0.4' },
  { path: '/terms', changefreq: 'monthly', priority: '0.4' },
];

/**
 * The prerendered pages: every static page, every Standards Guide chapter
 * and every guide. Built from the same tables that drive the prerender
 * (src/lib/seo/routeMeta.ts, chapterMeta.ts), so a page cannot be
 * prerendered without being listed here. tests/unit/routeMeta.test.ts
 * checks the two stay equal.
 */
export function prerenderedEntries(): UrlEntry[] {
  const entries: UrlEntry[] = STATIC_PAGES.map((p) => ({
    loc: `${SITE_URL}${p.path}`,
    changefreq: p.changefreq,
    priority: p.priority,
  }));
  for (const c of CHAPTER_META) {
    entries.push({
      loc: `${SITE_URL}/standards-guide/chapter/${c.num}`,
      changefreq: 'monthly',
      priority: '0.8',
    });
  }
  for (const g of GUIDE_META) {
    entries.push({
      loc: `${SITE_URL}/standards-guide/guide/${g.slug}`,
      changefreq: 'monthly',
      priority: '0.7',
    });
  }
  return entries;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method not allowed');
  }

  try {
    const clients = makeClientsFromEnv();

    // Lawsuit URLs come from litigation_listings — the same source and
    // the same four statuses the public /lawsuits pages render, so the
    // sitemap can only ever advertise a URL that resolves.
    //
    // This used to call listActiveListings(), which reads the unrelated
    // `listings` table (6 legacy firm-marketing rows). Five of the six
    // slugs it emitted had no litigation row at all, so the sitemap was
    // pointing crawlers at five soft 404s while omitting all 36 real
    // lawsuit pages.
    const litigation = await clients.db.listActiveLitigation({
      statuses: ['active', 'compliance', 'investigating', 'tracking'],
      limit: 500,
    });

    // Defensive dedupe: slugs are unique in the table, but a duplicate
    // here would put the same <loc> in twice, which crawlers flag.
    const seen = new Set<string>();
    const uniqueLitigation = litigation.filter((l) => {
      if (!l.slug || seen.has(l.slug)) return false;
      seen.add(l.slug);
      return true;
    });

    // Every prerendered page: static pages, 10 chapters, every guide.
    const entries: UrlEntry[] = prerenderedEntries();

    for (const l of uniqueLitigation) {
      entries.push({
        loc: `${SITE_URL}/lawsuits/${encodeURIComponent(l.slug)}`,
        // No lastmod. LitigationRow carries no updated_at, and the old
        // code substituted a subscription's currentPeriodEnd — a billing
        // date describing when money moved, not when the page changed.
        // An absent hint is honest; a wrong one teaches crawlers to
        // ignore the field.
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      entries
        .map((e) => {
          const lines = [`  <url>`, `    <loc>${escapeXml(e.loc)}</loc>`];
          if (e.lastmod) lines.push(`    <lastmod>${escapeXml(e.lastmod)}</lastmod>`);
          if (e.changefreq)
            lines.push(`    <changefreq>${escapeXml(e.changefreq)}</changefreq>`);
          if (e.priority)
            lines.push(`    <priority>${escapeXml(e.priority)}</priority>`);
          lines.push(`  </url>`);
          return lines.join('\n');
        })
        .join('\n') +
      '\n</urlset>\n';

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, max-age=900, s-maxage=3600, stale-while-revalidate=86400',
    );
    return res.status(200).send(xml);
  } catch (err) {
    console.error('[sitemap.xml GET] failed:', err);
    return res.status(500).end('Sitemap generation failed');
  }
}

/** Minimal XML escape for loc/lastmod/etc. Values are trusted (slugs + ISO
 *  dates), but an ampersand in any future change shouldn't break the feed. */
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
