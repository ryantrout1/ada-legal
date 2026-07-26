/**
 * GET /api/robots — served at /robots.txt via a vercel.json rewrite.
 *
 * Host-aware on purpose. Two domains will serve this same deployment and
 * they want opposite answers:
 *
 *   ada.adalegallink.com   the engine/platform domain. Never a public
 *                          destination, never indexable — not before the
 *                          Base44 cutover and not after it. The surfaces
 *                          reachable here are internal tools, the
 *                          Clerk-gated portal, and unguessable /s/<slug>
 *                          consent readouts.
 *
 *   adalegallink.com       the public site. Indexable, minus the private
 *                          paths listed below.
 *
 * A static public/robots.txt cannot make that distinction — one file, one
 * body, whichever host asked. Serving it from a function is what lets the
 * apex become indexable the moment DNS moves, with no edit on the day and
 * no window where the engine domain is crawlable.
 *
 * This matters more than it looks: without it, lifting the blanket noindex
 * ahead of cutover would get ada.adalegallink.com indexed, and after
 * cutover both hosts would serve identical content with no canonical
 * signal between them.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Paths that are never indexable, on any host. */
export const PRIVATE_PATHS = [
  '/admin',
  '/portal',
  '/photo',
  '/review',
  '/s/',
  '/spot/r/',
  '/api/',
];

/** The engine domain. Anything else is treated as a public host. */
export const ENGINE_HOST = 'ada.adalegallink.com';

export function isEngineHost(host: string | undefined): boolean {
  if (!host) return true; // Unknown host → assume engine, fail closed.
  return host.split(':')[0]!.toLowerCase() === ENGINE_HOST;
}

export function robotsBody(host: string | undefined): string {
  if (isEngineHost(host)) {
    return [
      '# Engine/platform domain — not a public destination.',
      '# The public site is https://adalegallink.com',
      'User-agent: *',
      'Disallow: /',
      '',
    ].join('\n');
  }

  return [
    'User-agent: *',
    ...PRIVATE_PATHS.map((p) => `Disallow: ${p}`),
    '',
    'Sitemap: https://adalegallink.com/sitemap.xml',
    '',
  ].join('\n');
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).send('Method not allowed');
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return res.status(200).send(robotsBody(req.headers.host));
}
