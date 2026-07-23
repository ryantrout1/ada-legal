/**
 * M5 Phase 2 — the four consumer-write endpoints.
 *
 * These are public, unauthenticated writes, which makes the failure
 * modes different from the rest of the API: nobody is logged in to
 * blame, nothing retries, and a 500 lands in front of someone who was
 * trying to tell us something was broken.
 *
 * Pinned here:
 *   - validation rejects empty payloads before touching the database
 *   - the waitlist treats a duplicate address as SUCCESS, not conflict
 *   - analytics ingest is fire-and-forget: 202 even when the write
 *     throws, because a page must not degrade over telemetry
 *   - is_internal is not settable by the client
 *   - the vote tally degrades to empty rather than 500
 *
 * Ref: /plan M5 Phase 2, AC2.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const calls = {
  feedback: [] as unknown[],
  waitlist: [] as unknown[],
  vote: [] as unknown[],
  event: [] as unknown[],
};
const shouldThrow = { current: false };
const tallies = { current: {} as Record<string, number> };

vi.mock('../../src/lib/entities/entityStore.js', () => ({
  COMMUNITY_POLL_ID: 'community_voices',
  makeEntityStore: () => ({
    async recordFeedback(i: unknown) {
      if (shouldThrow.current) throw new Error('db down');
      calls.feedback.push(i);
    },
    async recordWaitlistSignup(i: unknown) {
      if (shouldThrow.current) throw new Error('db down');
      calls.waitlist.push(i);
    },
    async recordVote(i: unknown) {
      if (shouldThrow.current) throw new Error('db down');
      calls.vote.push(i);
    },
    async tallyVotes() {
      if (shouldThrow.current) throw new Error('db down');
      return tallies.current;
    },
    async recordEvent(i: unknown) {
      if (shouldThrow.current) throw new Error('db down');
      calls.event.push(i);
    },
  }),
}));

const { default: feedbackHandler } = await import('../../api/public/feedback.js');
const { default: waitlistHandler } = await import('../../api/public/waitlist.js');
const { default: votesHandler } = await import('../../api/public/votes.js');
const { default: eventsHandler } = await import('../../api/public/events.js');

function makeRes() {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    headers,
    body: undefined as unknown,
    setHeader(k: string, v: string) {
      headers[k.toLowerCase()] = v;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(b: unknown) {
      res.body = b;
      return res;
    },
    end() {
      return res;
    },
  };
  return res as unknown as VercelResponse & {
    statusCode: number;
    headers: Record<string, string>;
    body: { ok?: boolean; error?: string; tallies?: Record<string, number> };
  };
}

function makeReq(method: string, body: unknown = {}): VercelRequest {
  return { method, body, query: {}, headers: {} } as VercelRequest;
}

beforeEach(() => {
  calls.feedback = [];
  calls.waitlist = [];
  calls.vote = [];
  calls.event = [];
  shouldThrow.current = false;
  tallies.current = {};
});

describe('POST /api/public/feedback', () => {
  it('records a message', async () => {
    const res = makeRes();
    await feedbackHandler(makeReq('POST', { message: 'The filter was unreadable' }), res);
    expect(res.statusCode).toBe(201);
    expect(calls.feedback).toHaveLength(1);
  });

  it('rejects an empty message before touching the database', async () => {
    const res = makeRes();
    await feedbackHandler(makeReq('POST', { message: '   ' }), res);
    expect(res.statusCode).toBe(400);
    expect(calls.feedback).toHaveLength(0);
  });

  it('rejects non-POST', async () => {
    const res = makeRes();
    await feedbackHandler(makeReq('GET'), res);
    expect(res.statusCode).toBe(405);
  });
});

describe('POST /api/public/waitlist', () => {
  it('accepts a valid address', async () => {
    const res = makeRes();
    await waitlistHandler(makeReq('POST', { email: 'someone@example.com' }), res);
    expect(res.statusCode).toBe(201);
    expect(calls.waitlist).toHaveLength(1);
  });

  it('rejects an invalid address', async () => {
    for (const email of ['', 'not-an-email', 'a@b']) {
      const res = makeRes();
      await waitlistHandler(makeReq('POST', { email }), res);
      expect(res.statusCode, `should reject ${email}`).toBe(400);
    }
    expect(calls.waitlist).toHaveLength(0);
  });

  it('treats a duplicate signup as success', async () => {
    // The store swallows the conflict; the handler must not invent an
    // error for someone who clicked the banner twice.
    const res1 = makeRes();
    const res2 = makeRes();
    await waitlistHandler(makeReq('POST', { email: 'dupe@example.com' }), res1);
    await waitlistHandler(makeReq('POST', { email: 'dupe@example.com' }), res2);
    expect(res1.statusCode).toBe(201);
    expect(res2.statusCode).toBe(201);
  });
});

describe('/api/public/votes', () => {
  it('returns tallies on GET', async () => {
    tallies.current = { rights: 3, access: 1 };
    const res = makeRes();
    await votesHandler(makeReq('GET'), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.tallies).toEqual({ rights: 3, access: 1 });
  });

  it('degrades to empty tallies rather than 500', async () => {
    // A broken poll section is worse than a poll with no counts.
    shouldThrow.current = true;
    const res = makeRes();
    await votesHandler(makeReq('GET'), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.tallies).toEqual({});
  });

  it('records a vote', async () => {
    const res = makeRes();
    await votesHandler(makeReq('POST', { option_id: 'rights' }), res);
    expect(res.statusCode).toBe(201);
    expect(calls.vote).toHaveLength(1);
  });

  it('rejects a vote with no option', async () => {
    const res = makeRes();
    await votesHandler(makeReq('POST', {}), res);
    expect(res.statusCode).toBe(400);
  });
});

describe('POST /api/public/events', () => {
  it('accepts an event', async () => {
    const res = makeRes();
    await eventsHandler(makeReq('POST', { event_name: 'cta_clicked', page: 'Home' }), res);
    expect(res.statusCode).toBe(202);
    expect(calls.event).toHaveLength(1);
  });

  it('returns 202 even when the write throws — telemetry never breaks a page', async () => {
    shouldThrow.current = true;
    const res = makeRes();
    await eventsHandler(makeReq('POST', { event_name: 'cta_clicked' }), res);
    expect(res.statusCode).toBe(202);
  });

  it('rejects an event with no name', async () => {
    const res = makeRes();
    await eventsHandler(makeReq('POST', {}), res);
    expect(res.statusCode).toBe(400);
  });

  it('drops oversized properties rather than rejecting the event', async () => {
    const huge = { blob: 'x'.repeat(5000) };
    const res = makeRes();
    await eventsHandler(makeReq('POST', { event_name: 'big', properties: huge }), res);
    expect(res.statusCode).toBe(202);
    expect((calls.event[0] as { properties: unknown }).properties).toEqual({});
  });

  it('ignores a client-supplied is_internal', async () => {
    // Spoofable client control over this flag would corrupt the exact
    // number it exists to protect.
    const res = makeRes();
    await eventsHandler(
      makeReq('POST', { event_name: 'spoof', is_internal: false, isInternal: false }),
      res,
    );
    expect(res.statusCode).toBe(202);
    const recorded = calls.event[0] as Record<string, unknown>;
    expect(recorded).not.toHaveProperty('isInternal');
    expect(recorded).not.toHaveProperty('is_internal');
  });
});
