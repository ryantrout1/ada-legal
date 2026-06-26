/**
 * Unit test — Inbox formatting helpers (Phase 5 §7.2).
 */

import { describe, it, expect } from 'vitest';
import { priorityForSla, relativeAge, formatHours } from '@/app/utils/inboxFormat';

const H = 3600_000;
const NOW = Date.parse('2026-06-26T12:00:00Z');

describe('priorityForSla', () => {
  it('flags an overdue SLA as high', () => {
    expect(priorityForSla(new Date(NOW - H).toISOString(), NOW)).toBe('high');
  });
  it('flags a due-within-6h SLA as medium', () => {
    expect(priorityForSla(new Date(NOW + 3 * H).toISOString(), NOW)).toBe('medium');
  });
  it('leaves a far-off SLA unflagged', () => {
    expect(priorityForSla(new Date(NOW + 48 * H).toISOString(), NOW)).toBe('none');
  });
  it('returns none for a missing or unparseable due date', () => {
    expect(priorityForSla(null, NOW)).toBe('none');
    expect(priorityForSla('not-a-date', NOW)).toBe('none');
  });
});

describe('relativeAge', () => {
  it('formats minutes, hours, and days', () => {
    expect(relativeAge(new Date(NOW - 5 * 60000).toISOString(), NOW)).toBe('5m ago');
    expect(relativeAge(new Date(NOW - 3 * H).toISOString(), NOW)).toBe('3h ago');
    expect(relativeAge(new Date(NOW - 2 * 24 * H).toISOString(), NOW)).toBe('2d ago');
  });
  it('says "just now" under a minute and dashes a null', () => {
    expect(relativeAge(new Date(NOW - 10_000).toISOString(), NOW)).toBe('just now');
    expect(relativeAge(null, NOW)).toBe('—');
  });
});

describe('formatHours', () => {
  it('formats hours and days, dashing null/zero', () => {
    expect(formatHours(6)).toBe('6h');
    expect(formatHours(36)).toBe('2d');
    expect(formatHours(0)).toBe('—');
    expect(formatHours(null)).toBe('—');
  });
});
