/**
 * POST /api/public/civil-rights/submit - the save path.
 *
 * Encodes /plan "State civil rights complaint page" Phase 1:
 *   AC4 one submission row + one consent row per checkbox (checked or not,
 *       exact wording shown, version); same id twice = still one row
 *   AC8 honeypot filled -> 201 and nothing stored; over the limit -> 429
 */

import { describe, it, expect, vi } from 'vitest';
import {
  handleSubmit,
  type CivilRightsStore,
  type SubmissionRecord,
  type ConsentRecord,
} from '../../src/lib/civilRights/submitCore.js';
import { CONSENTS } from '../../src/lib/civilRights/copy.js';
import type { RateLimitStore } from '../../src/lib/rateLimit/apiRateLimit.js';
import { CIVIL_RIGHTS_SUBMIT_BUCKET, RATE_LIMITS } from '../../src/lib/rateLimit/apiRateLimit.js';
import { validAz } from '../support/civilRightsFixture.js';

const ID = '3f1c2b8e-5d4a-4c7b-9a1e-2b3c4d5e6f70';

function memoryStore() {
  const submissions = new Map<string, SubmissionRecord>();
  const consents: ConsentRecord[] = [];
  const store: CivilRightsStore = {
    async saveSubmission(row, rows) {
      if (submissions.has(row.id)) return 'duplicate';
      submissions.set(row.id, row);
      consents.push(...rows);
      return 'created';
    },
  };
  return { store, submissions, consents };
}

function memoryLimiter(): RateLimitStore & { rows: number } {
  const s = {
    rows: 0,
    async countSince() {
      return s.rows;
    },
    async record() {
      s.rows += 1;
    },
    async prune() {
      return 0;
    },
  };
  return s;
}

function body(over: Record<string, unknown> = {}) {
  return {
    id: ID,
    state: 'arizona',
    answers: validAz(),
    consents: CONSENTS.map((c) => ({ kind: c.kind, granted: false, wordingVersion: c.version })),
    website: '',
    utm: { source: 'facebook', medium: 'social', campaign: 'az-launch' },
    ...over,
  };
}

function deps(over: Partial<Parameters<typeof handleSubmit>[1]> = {}) {
  const mem = memoryStore();
  const limiter = memoryLimiter();
  return {
    mem,
    limiter,
    d: { store: mem.store, rateLimitStore: limiter, rateKey: 'k'.repeat(64), ...over },
  };
}

describe('handleSubmit', () => {
  it('stores one submission and one consent row per checkbox', async () => {
    const { mem, d } = deps();
    const r = await handleSubmit(
      body({
        consents: [
          { kind: 'updates', granted: true, wordingVersion: CONSENTS[0].version },
          { kind: 'contact', granted: false, wordingVersion: CONSENTS[1].version },
        ],
      }),
      d,
    );
    expect(r.status).toBe(201);
    expect(mem.submissions.size).toBe(1);
    const row = mem.submissions.get(ID)!;
    expect(row.stateCode).toBe('az');
    expect(row.area).toBe('public_accommodation');
    expect(row.basis).toBe('disability');
    expect(row.complainantName).toBe('Jordan Rivera');
    expect(row.respondentName).toBe('Desert Grill');
    expect(row.lastIncidentDate).toBe('2026-09-14');
    expect(row.summaryText).toContain('What happened, in my own words:');
    expect(row.utmSource).toBe('facebook');
    expect(row.answers.what_happened).toContain('three steps');

    expect(mem.consents).toHaveLength(2);
    const updates = mem.consents.find((c) => c.kind === 'updates')!;
    expect(updates.granted).toBe(true);
    expect(updates.wording).toBe(CONSENTS[0].wording);
    expect(updates.wordingVersion).toBe(CONSENTS[0].version);
    expect(mem.consents.find((c) => c.kind === 'contact')!.granted).toBe(false);
  });

  it('consent wording is exactly what Gina and Ryan settled', () => {
    expect(CONSENTS.map((c) => c.wording)).toEqual([
      'Send me updates from ADA Legal Link.',
      'ADA Legal Link or a partner attorney may contact me about my report. I understand no one is promising to contact me or take my case.',
    ]);
  });

  it('missing consents are stored as not granted, never required', async () => {
    const { mem, d } = deps();
    const r = await handleSubmit(body({ consents: undefined }), d);
    expect(r.status).toBe(201);
    expect(mem.consents.map((c) => c.granted)).toEqual([false, false]);
  });

  it('stored wording comes from the server, not the client', async () => {
    const { mem, d } = deps();
    await handleSubmit(
      body({
        consents: [{ kind: 'updates', granted: true, wordingVersion: CONSENTS[0].version, wording: 'I agree to anything' }],
      }),
      d,
    );
    expect(mem.consents.find((c) => c.kind === 'updates')!.wording).toBe(CONSENTS[0].wording);
  });

  it('rejects a stale consent version so we never store wording we did not show', async () => {
    const { mem, d } = deps();
    const r = await handleSubmit(
      body({ consents: [{ kind: 'updates', granted: true, wordingVersion: 'old' }] }),
      d,
    );
    expect(r.status).toBe(400);
    expect(mem.submissions.size).toBe(0);
  });

  it('the same id twice is one row (retry / double tap)', async () => {
    const { mem, d } = deps();
    expect((await handleSubmit(body(), d)).status).toBe(201);
    expect((await handleSubmit(body(), d)).status).toBe(201);
    expect(mem.submissions.size).toBe(1);
    expect(mem.consents).toHaveLength(2);
  });

  it('honeypot filled -> 201, nothing stored, no rate count', async () => {
    const { mem, limiter, d } = deps();
    const r = await handleSubmit(body({ website: 'http://spam.example' }), d);
    expect(r.status).toBe(201);
    expect(mem.submissions.size).toBe(0);
    expect(limiter.rows).toBe(0);
  });

  it('over the short-window limit -> 429 with a plain message', async () => {
    const { mem, limiter, d } = deps();
    limiter.rows = RATE_LIMITS[CIVIL_RIGHTS_SUBMIT_BUCKET].short.max;
    const r = await handleSubmit(body(), d);
    expect(r.status).toBe(429);
    expect(r.retryAfterSeconds).toBeGreaterThan(0);
    expect(typeof r.body.error).toBe('string');
    expect(mem.submissions.size).toBe(0);
  });

  it('bucket allows 5 per 10 minutes and 20 per day', () => {
    expect(RATE_LIMITS[CIVIL_RIGHTS_SUBMIT_BUCKET]).toEqual({
      short: { windowMs: 10 * 60_000, max: 5 },
      long: { windowMs: 24 * 60 * 60_000, max: 20 },
    });
  });

  it('unknown state -> 404', async () => {
    const { d } = deps();
    expect((await handleSubmit(body({ state: 'california' }), d)).status).toBe(404);
  });

  it('bad id -> 400 naming the field', async () => {
    const { d } = deps();
    const r = await handleSubmit(body({ id: 'not-a-uuid' }), d);
    expect(r.status).toBe(400);
    expect(r.body.field).toBe('id');
  });

  it('invalid answers -> 400 naming the first field, nothing stored', async () => {
    const { mem, d } = deps();
    const r = await handleSubmit(body({ answers: { ...validAz(), complainant_name: '' } }), d);
    expect(r.status).toBe(400);
    expect(r.body.field).toBe('complainant_name');
    expect(mem.submissions.size).toBe(0);
  });

  it('a store failure -> 500, not a false success', async () => {
    const { d } = deps({
      store: { saveSubmission: vi.fn().mockRejectedValue(new Error('db down')) },
    });
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await handleSubmit(body(), d)).status).toBe(500);
    spy.mockRestore();
  });

  it('caps utm values and ignores non-strings', async () => {
    const { mem, d } = deps();
    await handleSubmit(body({ utm: { source: 'x'.repeat(500), medium: 7 } }), d);
    const row = mem.submissions.get(ID)!;
    expect(row.utmSource).toHaveLength(100);
    expect(row.utmMedium).toBeNull();
  });
});
