import { describe, it, expect } from 'vitest';
import { computeDeleteAfter, SPOT_PHOTO_RETENTION_DAYS } from '@/lib/spot/retention';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('computeDeleteAfter', () => {
  it('defaults to a 90-day retention window', () => {
    expect(SPOT_PHOTO_RETENTION_DAYS).toBe(90);
    const from = new Date('2026-01-01T00:00:00.000Z');
    expect(computeDeleteAfter(from).toISOString()).toBe('2026-04-01T00:00:00.000Z');
  });

  it('adds exactly N*24h for a custom window', () => {
    const from = new Date('2026-01-01T12:34:56.000Z');
    const out = computeDeleteAfter(from, 7);
    expect(out.getTime() - from.getTime()).toBe(7 * DAY_MS);
  });

  it('does not mutate the input date', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const snapshot = from.getTime();
    computeDeleteAfter(from);
    expect(from.getTime()).toBe(snapshot);
  });

  it('agrees with the SQL default (now + 90 days) for the same instant', () => {
    const from = new Date('2026-06-15T08:00:00.000Z');
    expect(computeDeleteAfter(from).getTime() - from.getTime()).toBe(
      SPOT_PHOTO_RETENTION_DAYS * DAY_MS,
    );
  });
});
