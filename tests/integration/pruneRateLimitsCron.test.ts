/**
 * Rate-limit table prune cron (/plan Ada rate limits, Phase 4).
 *
 * `store.prune()` has existed since the guide assistant shipped and has
 * never been called by anything — there is no cron for it. Every allowed
 * request writes a row to api_rate_limit and nothing has ever removed one.
 * That was harmless while the only writer was a guide assistant nobody had
 * found; Phase 3 put the photo path on the same table, and Phase 2 will add
 * chat.
 *
 * AC6: rows older than the longest window plus a margin are deleted on a
 * schedule.
 *
 * The retention floor is the contract that matters. The longest window in
 * RATE_LIMITS is 24h, so pruning at 48h leaves a full day of margin. A
 * cutoff that crept under 24h would silently reset live daily budgets —
 * the limiter would keep answering, just with an emptier table, which is
 * exactly the shape of a limiter that stops limiting without saying so.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { RATE_LIMITS } from '../../src/lib/rateLimit/apiRateLimit.js';

const prune = vi.fn();

vi.mock('../../src/lib/rateLimit/apiRateLimitStore.js', () => ({
  makeApiRateLimitStore: () => ({
    countSince: vi.fn(),
    record: vi.fn(),
    prune,
  }),
}));

function makeRes() {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    headers,
    setHeader: vi.fn((k: string, v: string) => {
      headers[k.toLowerCase()] = String(v);
    }),
  } as Record<string, unknown>;
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((body: unknown) => {
    res.body = body;
    return res;
  });
  return res as unknown as VercelResponse & {
    statusCode: number;
    body?: unknown;
  };
}

function makeReq(overrides: Record<string, unknown> = {}): VercelRequest {
  return {
    method: 'POST',
    headers: { authorization: 'Bearer test-secret' },
    ...overrides,
  } as unknown as VercelRequest;
}

describe('prune-rate-limits cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
    prune.mockResolvedValue(7);
  });

  it('deletes rows and reports how many (AC6)', async () => {
    const handler = (await import('../../api/cron/prune-rate-limits.js')).default;
    const res = makeRes();

    await handler(makeReq(), res);

    expect(res.statusCode).toBe(200);
    expect(prune).toHaveBeenCalledOnce();
    expect(res.body).toMatchObject({ deleted: 7 });
  });

  it('keeps a cutoff safely older than the longest configured window', async () => {
    const handler = (await import('../../api/cron/prune-rate-limits.js')).default;
    await handler(makeReq(), makeRes());

    const cutoff = prune.mock.calls[0]![0] as Date;
    const ageMs = Date.now() - cutoff.getTime();

    const longestWindowMs = Math.max(
      ...Object.values(RATE_LIMITS).map((c) => c.long.windowMs),
    );
    // Strictly older than any live window, with real headroom — not merely
    // equal to it, which would race the boundary on a slow run.
    expect(ageMs).toBeGreaterThan(longestWindowMs);
    expect(ageMs).toBeGreaterThanOrEqual(48 * 60 * 60 * 1000 - 5_000);
  });

  it('fails closed when CRON_SECRET is unset', async () => {
    // Matches sweep-abandoned: an unset secret means every caller, including
    // the scheduled one, gets 401. A public endpoint that truncates a
    // limiter table is not something to leave open by default.
    delete process.env.CRON_SECRET;
    const handler = (await import('../../api/cron/prune-rate-limits.js')).default;
    const res = makeRes();

    await handler(makeReq(), res);

    expect(res.statusCode).toBe(401);
    expect(prune).not.toHaveBeenCalled();
  });

  it('rejects a caller with the wrong bearer token', async () => {
    const handler = (await import('../../api/cron/prune-rate-limits.js')).default;
    const res = makeRes();

    await handler(makeReq({ headers: { authorization: 'Bearer wrong' } }), res);

    expect(res.statusCode).toBe(401);
    expect(prune).not.toHaveBeenCalled();
  });

  it('rejects methods other than GET and POST', async () => {
    const handler = (await import('../../api/cron/prune-rate-limits.js')).default;
    const res = makeRes();

    await handler(makeReq({ method: 'DELETE' }), res);

    expect(res.statusCode).toBe(405);
    expect(prune).not.toHaveBeenCalled();
  });
});

describe('vercel.json cron registration', () => {
  it('schedules the prune so it actually runs (AC6)', async () => {
    // The handler existing is not the feature; the handler being *scheduled*
    // is. A cron file with no vercel.json entry is dead code that reads as
    // done.
    const { readFileSync } = await import('node:fs');
    const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
      crons: Array<{ path: string; schedule: string }>;
    };
    const entry = config.crons.find((c) => c.path === '/api/cron/prune-rate-limits');
    expect(entry, 'prune-rate-limits is not registered in vercel.json').toBeDefined();
    expect(entry!.schedule).toBeTruthy();
  });
});
