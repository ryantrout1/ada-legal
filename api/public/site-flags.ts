/**
 * GET /api/public/site-flags
 *
 * Public, unauthenticated read of the front-end feature flags the
 * consumer pages need in the browser. Today that is one flag:
 * `lawsuits_ada_cta_enabled`, which decides whether the lawsuit pages
 * render the "Talk to Ada about this case" CTA.
 *
 * WHY A SEPARATE ENDPOINT rather than folding the flag into
 * /api/public/litigation: that payload is CDN-cached for 15 minutes and
 * is consumed by the live Base44 site until cutover. Welding a kill
 * switch onto it would delay every flip by up to 15 minutes and would
 * mutate a response shape we've committed to keeping additive-only.
 * This endpoint is new, so its shape is unconstrained, and it carries
 * its own 60-second cache so a Neon upsert takes effect in about a
 * minute with no redeploy.
 *
 * FAILS CLOSED. Any error resolving the flag returns 200 with the flag
 * off rather than a 500 — the front end would treat a 500 as "off"
 * anyway, and a public GET that throws on every request buys nothing
 * but Sentry noise and an uncacheable response.
 *
 * Ref: /plan M3 Phase 1, AC5.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv } from '../_shared.js';
import { applyCors } from '../_cors.js';
import {
  readLawsuitsAdaCta,
  readAdaUniversalCta,
} from '../../src/lib/site/lawsuitsAdaCta.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return; // preflight handled

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let lawsuitsAdaCtaEnabled = false;
  let adaUniversalCta = false;
  try {
    const clients = makeClientsFromEnv();
    // Both flags live in the same `admin` blob, so this is one read.
    [lawsuitsAdaCtaEnabled, adaUniversalCta] = await Promise.all([
      readLawsuitsAdaCta(clients.db),
      readAdaUniversalCta(clients.db),
    ]);
  } catch (err) {
    // Fail closed, and say so in the logs so a persistent read failure
    // is still visible rather than silently pinning the CTA off.
    console.error('[public/site-flags GET] flag read failed, serving off:', err);
    lawsuitsAdaCtaEnabled = false;
    adaUniversalCta = false;
  }

  res.setHeader(
    'Cache-Control',
    'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
  );
  return res.status(200).json({
    lawsuits_ada_cta_enabled: lawsuitsAdaCtaEnabled,
    // M5: additive. Existing consumers keep reading the field above.
    ada_universal_cta: adaUniversalCta,
  });
}
