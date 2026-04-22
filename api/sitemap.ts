/**
 * GET /api/sitemap
 *
 * Dynamically generated sitemap.xml listing every public page the
 * site wants search engines to index. Rewritten from /sitemap.xml
 * via vercel.json so the canonical URL still reads correctly.
 *
 * Includes:
 *   - Static public pages (/, /chat, /class-actions, /attorneys, etc.)
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

const SITE_URL = 'https://ada.adalegallink.com';

interface UrlEntry {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method not allowed');
  }

  try {
    const clients = makeClientsFromEnv();
    const listings = await clients.db.listActiveListings();

    // Dedupe listings by listingId (v_active_listings can emit
    // multiple rows per listing when multiple subscriptions exist).
    const seen = new Set<string>();
    const uniqueListings = listings.filter((l) => {
      if (seen.has(l.listingId)) return false;
      seen.add(l.listingId);
      return true;
    });

    // Static public pages. Ordered by likely priority for the site.
    const entries: UrlEntry[] = [
      { loc: `${SITE_URL}/`, changefreq: 'weekly', priority: '1.0' },
      { loc: `${SITE_URL}/chat`, changefreq: 'weekly', priority: '0.9' },
      {
        loc: `${SITE_URL}/class-actions`,
        changefreq: 'daily',
        priority: '0.9',
      },
      { loc: `${SITE_URL}/attorneys`, changefreq: 'weekly', priority: '0.7' },
      {
        loc: `${SITE_URL}/accessibility`,
        changefreq: 'monthly',
        priority: '0.5',
      },
      { loc: `${SITE_URL}/privacy`, changefreq: 'monthly', priority: '0.4' },
      { loc: `${SITE_URL}/terms`, changefreq: 'monthly', priority: '0.4' },
    ];

    for (const l of uniqueListings) {
      entries.push({
        loc: `${SITE_URL}/class-actions/${encodeURIComponent(l.slug)}`,
        lastmod: l.currentPeriodEnd ?? undefined,
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
