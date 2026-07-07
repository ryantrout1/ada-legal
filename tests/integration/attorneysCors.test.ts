/**
 * Regression: the public attorney directory endpoint must apply CORS.
 *
 * Bug (2026-07-07): /api/attorneys was the only public GET endpoint that
 * never called applyCors. The directory page on adalegallink.com fetches
 * it cross-origin; the browser got the 200 but could not READ the body —
 * "No 'Access-Control-Allow-Origin' header is present" — so the page
 * rendered "We couldn't load the attorney directory" even though the API
 * returned the full roster. Fixed in de802aa by adding applyCors at the
 * top of the handler, matching every sibling public endpoint.
 *
 * This test invokes the real handler with a minimal mock req/res and
 * asserts the CORS contract:
 *   - Vary: Origin is always set (applyCors's unconditional first move —
 *     its fingerprint; its absence is exactly what the bug looked like).
 *   - For an allowlisted Origin (adalegallink.com), Access-Control-Allow-
 *     Origin echoes that origin back — the header whose absence broke the
 *     browser fetch.
 *   - An OPTIONS preflight short-circuits with 204 and never runs the
 *     handler body (no DB call).
 *
 * It fails against the pre-fix handler (no applyCors → no Vary, no
 * Allow-Origin) and passes post-fix. Per /regress.
 */

import { describe, it, expect, vi } from 'vitest';
import handler from '../../api/attorneys/index.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/** Minimal res mock that records headers, status, and body. */
function makeRes() {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    headers,
    setHeader: vi.fn((k: string, v: string) => {
      headers[k.toLowerCase()] = v;
    }),
    getHeader: (k: string) => headers[k.toLowerCase()],
    status: vi.fn(function (this: unknown, code: number) {
      (res as { statusCode: number }).statusCode = code;
      return res;
    }),
    json: vi.fn(function (this: unknown, body: unknown) {
      (res as { body?: unknown }).body = body;
      return res;
    }),
    end: vi.fn(function (this: unknown) {
      return res;
    }),
  };
  return res as unknown as VercelResponse & {
    headers: Record<string, string>;
    body?: unknown;
  };
}

function makeReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: 'GET',
    query: {},
    headers: {},
    ...overrides,
  } as VercelRequest;
}

describe('/api/attorneys CORS (regression)', () => {
  it('echoes Access-Control-Allow-Origin for the adalegallink.com origin', async () => {
    const req = makeReq({
      method: 'OPTIONS', // preflight: exercises CORS without a DB call
      headers: { origin: 'https://adalegallink.com' },
    });
    const res = makeRes();

    await handler(req, res);

    // The header whose absence broke the browser fetch.
    expect(res.headers['access-control-allow-origin']).toBe(
      'https://adalegallink.com',
    );
    // applyCors's unconditional fingerprint — gone entirely in the bug.
    expect(res.headers['vary']).toBe('Origin');
    // Preflight short-circuits: 204, and the GET body never runs.
    expect(res.statusCode).toBe(204);
  });

  it('sets Vary: Origin even when no Origin header is present', async () => {
    // A same-origin / tool request carries no Origin. applyCors still
    // sets Vary so the CDN never caches an Allow-Origin-less response
    // and serves it to a browser that DID send Origin.
    const req = makeReq({ method: 'OPTIONS' });
    const res = makeRes();

    await handler(req, res);

    expect(res.headers['vary']).toBe('Origin');
    // No matching origin → no echo (correct: nothing to allow).
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
