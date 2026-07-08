/**
 * Regression: /api/ada/session/current must apply CORS.
 *
 * Bug (2026-07-08): this endpoint was the session-resume/readout hydrate
 * call, but it never ran applyCors — unlike every sibling (session.ts,
 * turn.ts). The B44 chat on adalegallink.com fetches it cross-origin at
 * the end of an intake to render the readout; the browser blocked the
 * response ("No 'Access-Control-Allow-Origin' header is present") and the
 * report step crashed. Fixed by adding applyCors as the handler's first
 * line, matching the sibling pattern.
 *
 * Fails against the pre-fix handler (no Vary, no Allow-Origin), passes
 * post-fix. Mirrors tests/integration/attorneysCors.test.ts.
 */

import { describe, it, expect, vi } from 'vitest';
import handler from '../../api/ada/session/current.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

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

describe('/api/ada/session/current CORS (regression)', () => {
  it('echoes Access-Control-Allow-Origin for the adalegallink.com origin', async () => {
    const req = makeReq({
      method: 'OPTIONS', // preflight: exercises CORS without a DB call
      headers: { origin: 'https://adalegallink.com' },
    });
    const res = makeRes();

    await handler(req, res);

    expect(res.headers['access-control-allow-origin']).toBe('https://adalegallink.com');
    expect(res.headers['vary']).toBe('Origin');
    expect(res.statusCode).toBe(204);
  });

  it('sets Vary: Origin even when no Origin header is present', async () => {
    const req = makeReq({ method: 'OPTIONS' });
    const res = makeRes();

    await handler(req, res);

    expect(res.headers['vary']).toBe('Origin');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});
