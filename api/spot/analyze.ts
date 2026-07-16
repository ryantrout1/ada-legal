/**
 * POST /api/spot/analyze
 *
 *   POST { photos: string[] }   // 1 base64 image data URL (MAX_FREE_PHOTOS)
 *
 * Ada Spot's free-tier read. Runs the shared photo analyzer (Opus 4.8) and
 * returns an honest scoped result + the $79 upsell. No Ada session, no org,
 * no Vercel Blob — free-read photos are analyzed transiently (the analyzer
 * accepts data: URLs) and never persisted.
 *
 * Two response modes, picked by the Accept header (mirrors api/ada/turn.ts):
 *
 *   1. JSON (default — any non-browser caller). One shot:
 *        { tier, result, upsell }
 *
 *   2. SSE (Accept: text/event-stream — what the browser uses):
 *        event: progress  data: { scene?, summary?, positives, items }
 *        event: done      data: { tier, result, upsell }
 *        event: error     data: { error }
 *      The analysis is identical in both modes (analyzeStream sends the same
 *      params as analyze and extracts through the same path); streaming just
 *      lets the ~15-25s of generation render as it lands instead of arriving
 *      as one block at the end. `done` carries the full result, so the client
 *      reconciles final state in one place and progress stays advisory.
 *
 * Every gate (400/413 parse, 503 kill switch, 429 blocked) runs BEFORE any
 * SSE header, so a rejection is always a clean JSON status.
 *
 * Firewall: this is a net-new endpoint. It reuses the analyzer *library*
 * (clients.photo.analyze / analyzeStream) additively; it does NOT touch
 * /api/ada/analyze-photo, photo_analyses, or photo_reviews. Availability is
 * gated by Ada Spot's own spot_enabled flag (dark by default), independent of
 * the ada flags.
 *
 * Throttle: server-side, keyed by IP + coarse UA. First reads run; the 3rd is
 * soft-gated (still analyzed, UI prompts for email); the 4th+ is blocked (CTA
 * only, no model call). The client is never trusted for the count, and a read
 * is recorded even if the caller disconnects mid-stream.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv, readJsonBody } from '../_shared.js';
import { readSpotEnabled } from '../../src/lib/spot/spotAvailability.js';
import { deriveRateLimitKey } from '../../src/lib/spot/spotRateLimitKey.js';
import { rateLimitDecision } from '../../src/lib/spot/rateLimitDecision.js';
import { parseSpotAnalyzeBody, type SpotAnalyzeBody } from '../../src/lib/spot/parseSpotAnalyzeBody.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';
import { mapSpotProgress } from '../../src/lib/spot/mapSpotProgress.js';

// The analyzer makes one blocking Opus vision call, typically 15-45s (forced
// report_findings tool, ~1-2k output tokens). 90s gives the slow tail room —
// at 60 a thorough read could be killed mid-analysis and the user, having
// already waited a minute, got an error for it.
export const config = { maxDuration: 90 };

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

function writeSseFrame(res: VercelResponse, event: string, data: unknown): void {
  // Minimal SSE, same shape as api/ada/turn.ts: event line, one
  // JSON-encoded data line, blank line to close. A write error means the
  // socket is gone — swallow it and let the close handler stop the work.
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {
    /* socket already closed */
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Response mode, picked by Accept — the browser asks for SSE so the read
  // can render as it generates; JSON stays the default for any other caller.
  const wantsSse = String(req.headers['accept'] ?? '').includes('text/event-stream');

  const parsed = parseSpotAnalyzeBody(readJsonBody<SpotAnalyzeBody>(req));
  if (!parsed.ok) return res.status(parsed.status).json({ error: parsed.error });

  try {
    const clients = makeClientsFromEnv();

    // Kill switch — dark by default (public, budgeted Opus vision call). 503 so
    // callers know it's deliberate + temporary, not a client error.
    if (!(await readSpotEnabled(clients.db))) {
      res.setHeader('Retry-After', '3600');
      return res.status(503).json({ error: 'Spot is currently unavailable.' });
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

    // Every gate above runs BEFORE any SSE header is sent, so a rejection is
    // always a clean JSON status rather than a half-open stream.
    if (wantsSse) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      if (typeof res.flushHeaders === 'function') res.flushHeaders();
    }

    let aborted = false;
    if (wantsSse) {
      req.on('close', () => {
        aborted = true;
      });
    }

    // allowed | soft_gated → run the free read on the shared analyzer.
    // Streamed and blocking paths run the identical analysis; only the
    // transport differs (see analyzeStream).
    const result = wantsSse
      ? await clients.photo.analyzeStream({ blobKeys: parsed.photos }, (snapshot) => {
          if (aborted) return;
          writeSseFrame(res, 'progress', mapSpotProgress(snapshot));
        })
      : await clients.photo.analyze({ blobKeys: parsed.photos });

    // Record the read even when the client walked away mid-stream. The
    // free-read allowance is enforced from these rows, so skipping them on
    // abort would make the rate limit evadable by killing the connection.
    await store.insertRead({
      rateLimitKey: key,
      result: result.output,
      photoCount: parsed.photos.length,
      modelVersion: result.modelVersion,
    });
    await store.insertRateLimit({ rateLimitKey: key, ipHash, outcome: tier });

    if (wantsSse) {
      if (!aborted) {
        writeSseFrame(res, 'done', { tier, result: result.output, upsell: UPSELL });
      }
      res.end();
      return;
    }
    return res.status(200).json({ tier, result: result.output, upsell: UPSELL });
  } catch (err) {
    console.error('spot/analyze failed', err);
    // Once the stream is open the status is already 200 — surface the
    // failure as an error frame instead of an unsendable status code.
    if (wantsSse && res.headersSent) {
      writeSseFrame(res, 'error', { error: 'Analysis failed. Please try again.' });
      res.end();
      return;
    }
    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}
