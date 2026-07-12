/**
 * POST /api/spot/analyze
 *
 *   POST { photos: string[] }   // 1–2 base64 image data URLs
 *
 * Ada Spot's free-tier read. Runs the shared photo analyzer (Opus 4.8) on up
 * to two photos and returns an honest scoped result + the $79 upsell. No Ada
 * session, no org, no Vercel Blob — free-read photos are analyzed transiently
 * (the analyzer accepts data: URLs) and never persisted.
 *
 * Firewall: this is a net-new endpoint. It reuses the analyzer *library*
 * (clients.photo.analyze) additively; it does NOT touch /api/ada/analyze-photo,
 * photo_analyses, or photo_reviews. Availability is gated by Ada Spot's own
 * spot_enabled flag (dark by default), independent of the ada flags.
 *
 * Throttle: server-side, keyed by IP + coarse UA. First reads run; the 3rd is
 * soft-gated (still analyzed, UI prompts for email); the 4th+ is blocked (CTA
 * only, no model call). The client is never trusted for the count.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv, readJsonBody } from '../_shared.js';
import { readSpotEnabled } from '../../src/lib/spot/spotAvailability.js';
import { deriveRateLimitKey } from '../../src/lib/spot/spotRateLimitKey.js';
import { rateLimitDecision } from '../../src/lib/spot/rateLimitDecision.js';
import { parseSpotAnalyzeBody, type SpotAnalyzeBody } from '../../src/lib/spot/parseSpotAnalyzeBody.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';

// The analyzer makes a blocking ~10-18s Opus vision call — mirror the raised
// limit in /api/ada/analyze-photo so slow runs aren't killed mid-analysis.
export const config = { maxDuration: 60 };

// Trailing window the free-read count is measured over.
const RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const UPSELL = {
  price_usd: 79,
  max_photos: 10,
  anchor: 'A professional ADA inspection runs $1,500–$5,000; this screening is $79.',
} as const;

function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  return raw?.split(',')[0]?.trim() || '0.0.0.0';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = parseSpotAnalyzeBody(readJsonBody<SpotAnalyzeBody>(req));
  if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });

  try {
    const clients = makeClientsFromEnv();

    // Kill switch — dark by default (public, budgeted Opus vision call). 503 so
    // callers know it's deliberate + temporary, not a client error.
    if (!(await readSpotEnabled(clients.db))) {
      res.setHeader('Retry-After', '3600');
      return res.status(503).json({ error: 'Ada Spot is currently unavailable.' });
    }

    const key = deriveRateLimitKey(clientIp(req), (req.headers['user-agent'] as string) ?? '');
    const ipHash = key.slice(0, 16);
    const store = makeSpotStore();
    const priorReads = await store.countReadsSince(key, new Date(Date.now() - RATE_WINDOW_MS));
    const tier = rateLimitDecision(priorReads);

    if (tier === 'blocked') {
      await store.insertRateLimit({ rateLimitKey: key, ipHash, outcome: 'blocked' });
      return res.status(429).json({ tier, upsell: UPSELL });
    }

    // allowed | soft_gated → run the free read on the shared analyzer.
    const result = await clients.photo.analyze({ blobKeys: parsed.photos });
    await store.insertRead({
      rateLimitKey: key,
      result: result.output,
      photoCount: parsed.photos.length,
      modelVersion: result.modelVersion,
    });
    await store.insertRateLimit({ rateLimitKey: key, ipHash, outcome: tier });

    return res.status(200).json({ tier, result: result.output, upsell: UPSELL });
  } catch (err) {
    console.error('spot/analyze failed', err);
    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}
