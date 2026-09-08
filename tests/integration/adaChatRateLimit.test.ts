/**
 * Chat path rate limiting (/plan Ada rate limits, Phase 2).
 *
 * /api/ada/turn is the model spend and /api/ada/session is the front door
 * to it. Both were unlimited: no ceiling on messages, no ceiling on
 * conversation starts, no login on either.
 *
 * AC1: an over-budget caller is refused before the Anthropic call.
 * AC2: the 429 arrives as clean JSON, never a half-sent SSE stream.
 *
 * AC2 is the subtle one. runSseTurn sets Content-Type: text/event-stream
 * and calls flushHeaders() before processAdaTurn starts. A limit check
 * placed after that point could only surface as an error *frame* inside a
 * 200 stream — the client's `!resp.ok` branch would never fire, the status
 * would read as success, and a throttled user would get a chat that
 * appeared to hang. So the test asserts on Content-Type, not just status.
 *
 * Session-create rule (Ryan's call, /plan Open Decision 1): `preview: true`
 * does NOT count. Preview fires on every page load and makes no model call;
 * counting it would lock someone out before they typed a word.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const processAdaTurn = vi.fn();
const readSession = vi.fn();
const findAnonSessionByHash = vi.fn();
const getOrgByCode = vi.fn();
const getSystemSetting = vi.fn();
const upsertAnonSession = vi.fn();
const listActiveListings = vi.fn();
const listActiveLitigation = vi.fn();
const writeSession = vi.fn();
const countSince = vi.fn();
const record = vi.fn();

vi.mock('../../src/engine/processAdaTurn.js', () => ({
  processAdaTurn: (...a: unknown[]) => processAdaTurn(...a),
}));

vi.mock('../../api/_shared.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/_shared.js')>();
  return {
    ...actual,
    makeClientsFromEnv: () => ({
      db: {
        readSession,
        findAnonSessionByHash,
        getOrgByCode,
        upsertAnonSession,
        listActiveListings,
        listActiveLitigation,
        writeSession,
        getSystemSetting,
      },
      random: { uuid: () => '44444444-4444-4444-8444-444444444444' },
      clock: { now: () => new Date('2026-09-08T00:00:00.000Z') },
    }),
  };
});

vi.mock('../../src/lib/rateLimit/apiRateLimitStore.js', () => ({
  makeApiRateLimitStore: () => ({ countSince, record, prune: vi.fn() }),
}));

function makeRes() {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    headers,
    headersSent: false,
    setHeader: vi.fn((k: string, v: string) => {
      headers[k.toLowerCase()] = String(v);
    }),
    getHeader: (k: string) => headers[k.toLowerCase()],
    flushHeaders: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
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
    headers: Record<string, string>;
    body?: unknown;
  };
}

function turnReq(accept = 'text/event-stream'): VercelRequest {
  return {
    method: 'POST',
    headers: {
      accept,
      host: 'ada.adalegallink.com',
      'x-forwarded-for': '203.0.113.7',
      'user-agent': 'Mozilla/5.0 (Macintosh) Chrome/120.0.0.0',
      cookie: 'ada_anon=sometoken',
    },
    on: vi.fn(),
    body: {
      session_id: '11111111-1111-4111-8111-111111111111',
      message: 'The ramp at the pharmacy is blocked.',
    },
  } as unknown as VercelRequest;
}

describe('turn endpoint rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrgByCode.mockResolvedValue({ displayName: 'ADA Legal Link', adaIntroPrompt: null });
    readSession.mockResolvedValue({
      sessionId: '11111111-1111-4111-8111-111111111111',
      orgId: '22222222-2222-4222-8222-222222222222',
      anonSessionId: '33333333-3333-4333-8333-333333333333',
      userId: null,
      status: 'active',
      isTest: false,
    });
    findAnonSessionByHash.mockResolvedValue('33333333-3333-4333-8333-333333333333');
    record.mockResolvedValue(undefined);
  });

  it('refuses an over-budget caller before the Anthropic call (AC1)', async () => {
    countSince.mockResolvedValue(999);
    const handler = (await import('../../api/ada/turn.js')).default;
    const res = makeRes();

    await handler(turnReq(), res);

    expect(res.statusCode).toBe(429);
    expect(processAdaTurn).not.toHaveBeenCalled();
  });

  it('answers with JSON, not a half-sent SSE stream (AC2)', async () => {
    // The limiter must run BEFORE runSseTurn sets streaming headers and
    // flushes. If it ran after, a throttled caller would get a 200 with an
    // error frame and the client would treat it as success.
    countSince.mockResolvedValue(999);
    const handler = (await import('../../api/ada/turn.js')).default;
    const res = makeRes();

    await handler(turnReq('text/event-stream'), res);

    expect(res.statusCode).toBe(429);
    expect(res.headers['content-type'] ?? '').not.toContain('text/event-stream');
    expect(res.flushHeaders).not.toHaveBeenCalled();
    expect(res.headers['retry-after']).toBeDefined();
  });

  it('lets an under-budget caller reach the engine', async () => {
    countSince.mockResolvedValue(0);
    processAdaTurn.mockRejectedValue(new Error('stop here — reaching the engine is the assertion'));
    const handler = (await import('../../api/ada/turn.js')).default;
    const res = makeRes();

    await handler(turnReq(), res);

    expect(processAdaTurn).toHaveBeenCalled();
    expect(res.statusCode).not.toBe(429);
  });

  it('does not spend budget on a request rejected by an earlier gate', async () => {
    // A closed session is refused before the limiter, so someone poking a
    // dead session cannot drain the allowance of a real user on their IP.
    readSession.mockResolvedValue({
      sessionId: '11111111-1111-4111-8111-111111111111',
      anonSessionId: '33333333-3333-4333-8333-333333333333',
      userId: null,
      status: 'completed',
      isTest: false,
    });
    countSince.mockResolvedValue(0);
    const handler = (await import('../../api/ada/turn.js')).default;
    const res = makeRes();

    await handler(turnReq(), res);

    expect(res.statusCode).not.toBe(429);
    expect(record).not.toHaveBeenCalled();
  });
});

describe('session endpoint rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getOrgByCode.mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      code: 'adall',
      displayName: 'ADA Legal Link',
      adaIntroPrompt: null,
    });
    getSystemSetting.mockResolvedValue({ ada_chat_enabled: true });
    upsertAnonSession.mockResolvedValue('33333333-3333-4333-8333-333333333333');
    listActiveListings.mockResolvedValue([]);
    listActiveLitigation.mockResolvedValue([]);
    writeSession.mockResolvedValue(undefined);
    record.mockResolvedValue(undefined);
  });

  function sessionReq(body: Record<string, unknown>): VercelRequest {
    return {
      method: 'POST',
      headers: {
        host: 'ada.adalegallink.com',
        'x-forwarded-for': '203.0.113.7',
        'user-agent': 'Mozilla/5.0 (Macintosh) Chrome/120.0.0.0',
      },
      body,
      on: vi.fn(),
    } as unknown as VercelRequest;
  }

  it('does not count a preview against the budget', async () => {
    // Ryan's call (/plan Open Decision 1). previewGreeting fires on every
    // page load and makes no model call. Counting it would lock someone
    // out of starting a conversation before they typed a single word —
    // and a reader who opens Ada a few times to work up to it is exactly
    // the person this product exists for.
    countSince.mockResolvedValue(0);
    const handler = (await import('../../api/ada/session.js')).default;
    const res = makeRes();

    await handler(sessionReq({ preview: true }), res);

    expect(res.statusCode).toBe(200);
    expect(countSince).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it('refuses an over-budget real session create', async () => {
    countSince.mockResolvedValue(999);
    const handler = (await import('../../api/ada/session.js')).default;
    const res = makeRes();

    await handler(sessionReq({}), res);

    expect(res.statusCode).toBe(429);
    expect(writeSession).not.toHaveBeenCalled();
  });

  it('lets an under-budget real session create through', async () => {
    countSince.mockResolvedValue(0);
    const handler = (await import('../../api/ada/session.js')).default;
    const res = makeRes();

    await handler(sessionReq({}), res);

    expect(res.statusCode).not.toBe(429);
    expect(writeSession).toHaveBeenCalled();
  });
});
