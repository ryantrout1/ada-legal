/**
 * M3 Phase 1 — GET /api/public/site-flags.
 *
 * The public lawsuit pages need `lawsuits_ada_cta_enabled` in the
 * browser to decide whether to render the Ada CTA. A NEW endpoint
 * carries it rather than folding it into /api/public/litigation:
 * that payload is CDN-cached for 15 minutes and consumed by the live
 * B44 site, so welding a fast-flip flag onto it would both delay the
 * flip and mutate a shared response shape pre-cutover.
 *
 * Asserted here:
 *   - CORS applies (the B44 origin fetches cross-origin today, and the
 *     apex will fetch it post-cutover)
 *   - GET returns the flag; non-GET is 405
 *   - a DB failure fails CLOSED (flag false, still 200) — a CTA that
 *     appears because a read blew up is the failure mode that matters
 *   - the cache window is short enough that a flag flip is visible
 *     without a redeploy
 *
 * Ref: /plan M3 Phase 1, AC5.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import {
  LAWSUITS_ADA_CTA_KEY,
  LAWSUITS_ADA_CTA_SETTINGS_KEY,
} from '@/lib/site/lawsuitsAdaCta';

const clientsRef: { current: ReturnType<typeof makeInMemoryClients> | null } = {
  current: null,
};
const shouldThrow = { current: false };

vi.mock('../../api/_shared.js', () => ({
  makeClientsFromEnv: () => {
    if (shouldThrow.current) throw new Error('DATABASE_URL missing');
    return clientsRef.current;
  },
}));

const { default: handler } = await import('../../api/public/site-flags.js');

function makeRes() {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    headers,
    setHeader: vi.fn((k: string, v: string) => {
      headers[k.toLowerCase()] = v;
    }),
    getHeader: (k: string) => headers[k.toLowerCase()],
    status: vi.fn(function () {
      return res;
    }),
    json: vi.fn(function () {
      return res;
    }),
    end: vi.fn(function () {
      return res;
    }),
  };
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  }) as never;
  res.json = vi.fn((body: unknown) => {
    (res as { body?: unknown }).body = body;
    return res;
  }) as never;
  return res as unknown as VercelResponse & {
    headers: Record<string, string>;
    statusCode: number;
    body?: { lawsuits_ada_cta_enabled?: boolean; error?: string };
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

beforeEach(() => {
  clientsRef.current = makeInMemoryClients();
  shouldThrow.current = false;
});

describe('GET /api/public/site-flags', () => {
  it('returns the flag false when the admin blob is empty', async () => {
    const res = makeRes();
    await handler(makeReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res.body?.lawsuits_ada_cta_enabled).toBe(false);
  });

  it('returns true once the flag is explicitly true', async () => {
    await clientsRef.current!.db.setSystemSetting(LAWSUITS_ADA_CTA_SETTINGS_KEY, {
      [LAWSUITS_ADA_CTA_KEY]: true,
    });
    const res = makeRes();
    await handler(makeReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res.body?.lawsuits_ada_cta_enabled).toBe(true);
  });

  it('fails CLOSED on a read failure — 200 with the flag off, not a 500', async () => {
    // A 500 would make the hook's error path do the right thing anyway,
    // but a public GET that throws on every request is noise in Sentry
    // and gives the CDN nothing to cache. Fail closed and stay quiet.
    shouldThrow.current = true;
    const res = makeRes();
    await handler(makeReq(), res);
    expect(res.statusCode).toBe(200);
    expect(res.body?.lawsuits_ada_cta_enabled).toBe(false);
  });

  it('applies CORS', async () => {
    const res = makeRes();
    await handler(
      makeReq({
        method: 'OPTIONS',
        headers: { origin: 'https://adalegallink.com' },
      }),
      res,
    );
    expect(res.headers['vary']).toBe('Origin');
    expect(res.headers['access-control-allow-origin']).toBe(
      'https://adalegallink.com',
    );
    expect(res.statusCode).toBe(204);
  });

  it('rejects non-GET methods', async () => {
    const res = makeRes();
    await handler(makeReq({ method: 'POST' }), res);
    expect(res.statusCode).toBe(405);
    expect(res.headers['allow']).toBe('GET');
  });

  it('caches for at most a minute so a flag flip lands without a redeploy', async () => {
    const res = makeRes();
    await handler(makeReq(), res);
    const cc = res.headers['cache-control'] ?? '';
    const sMaxAge = Number(/s-maxage=(\d+)/.exec(cc)?.[1] ?? Infinity);
    const maxAge = Number(/max-age=(\d+)/.exec(cc)?.[1] ?? Infinity);
    expect(sMaxAge, `s-maxage too long for a kill switch: ${cc}`).toBeLessThanOrEqual(60);
    expect(maxAge, `max-age too long for a kill switch: ${cc}`).toBeLessThanOrEqual(60);
  });
});
