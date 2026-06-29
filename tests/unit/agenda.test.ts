/**
 * Unit tests for buildAgenda (Needs attention, build-list #2).
 * Encodes the /plan acceptance criteria 1-6 + the sort rules. Pure, no DB.
 */

import { describe, it, expect } from 'vitest';
import {
  buildAgenda,
  type AgendaMatterInput,
  type AgendaTaskInput,
} from '@/engine/cases/agenda';

const TODAY = '2026-06-28';

function matter(over: Partial<AgendaMatterInput> = {}): AgendaMatterInput {
  return {
    caseId: 'c1',
    caseNumber: 'CASE-0001',
    clientName: 'Pat Plaintiff',
    solDate: null,
    status: 'investigating',
    firstContactDue: null,
    lastActivityAt: `${TODAY}T12:00:00Z`,
    ...over,
  };
}
function task(over: Partial<AgendaTaskInput> = {}): AgendaTaskInput {
  return { id: 't1', caseId: 'c1', title: 'File response', dueDate: null, priority: 'medium', ...over };
}
const build = (matters: AgendaMatterInput[], tasks: AgendaTaskInput[] = []) =>
  buildAgenda({ matters, tasks, today: TODAY, staleDays: 14 });

describe('buildAgenda — key dates (SOL)', () => {
  it('AC1: a SOL date 5 days out lands in this_week as a statute-of-limitations item linking the matter', () => {
    const { keyDates } = build([matter({ solDate: '2026-07-03' })]);
    expect(keyDates).toHaveLength(1);
    expect(keyDates[0]).toMatchObject({
      kind: 'sol',
      caseId: 'c1',
      title: 'Statute of limitations',
      dueDate: '2026-07-03',
      bucket: 'this_week',
      priority: null,
      taskId: null,
    });
  });

  it('AC1: a past SOL date lands in overdue', () => {
    expect(build([matter({ solDate: '2026-06-20' })]).keyDates[0]!.bucket).toBe('overdue');
  });

  it('a SOL date of today lands in today', () => {
    expect(build([matter({ solDate: TODAY })]).keyDates[0]!.bucket).toBe('today');
  });

  it('AC2: a matter with no SOL date produces no deadline (nothing computed)', () => {
    expect(build([matter({ solDate: null })]).keyDates).toHaveLength(0);
  });

  it('a resolved matter with a SOL date does not appear (only active matters)', () => {
    expect(build([matter({ status: 'resolved', solDate: '2026-07-03' })]).keyDates).toHaveLength(0);
  });
});

describe('buildAgenda — key dates (tasks)', () => {
  it('AC3: an open task is bucketed by its own due date and carries kind=task + priority', () => {
    const { keyDates } = build([matter()], [task({ dueDate: '2026-06-28', priority: 'high' })]);
    expect(keyDates).toHaveLength(1);
    expect(keyDates[0]).toMatchObject({ kind: 'task', taskId: 't1', bucket: 'today', priority: 'high' });
  });

  it('a task with no due date falls into later', () => {
    expect(build([matter()], [task({ dueDate: null })]).keyDates[0]!.bucket).toBe('later');
  });

  it('a task on a resolved matter does not appear', () => {
    const { keyDates } = build([matter({ status: 'resolved' })], [task({ dueDate: '2026-06-28' })]);
    expect(keyDates).toHaveLength(0);
  });

  it('AC4: a task shows the matter’s client name even though the task row carries none', () => {
    const { keyDates } = build(
      [matter({ clientName: 'Direct Client' })],
      [task({ dueDate: '2026-06-30' })],
    );
    expect(keyDates[0]!.clientName).toBe('Direct Client');
  });

  it('SOL and task on the same matter are both present and distinguished by kind', () => {
    const { keyDates } = build(
      [matter({ solDate: '2026-06-29' })],
      [task({ dueDate: '2026-06-30' })],
    );
    expect(keyDates.map((k) => k.kind).sort()).toEqual(['sol', 'task']);
  });

  it('sorts overdue ahead of this_week', () => {
    const { keyDates } = build(
      [matter({ solDate: '2026-07-03' })],
      [task({ dueDate: '2026-06-20' })],
    );
    expect(keyDates[0]!.bucket).toBe('overdue');
    expect(keyDates[1]!.bucket).toBe('this_week');
  });
});

describe('buildAgenda — follow up', () => {
  it('AC5: an active matter with no activity for ≥14 days is flagged no_activity with the day count', () => {
    const { followUp } = build([matter({ lastActivityAt: '2026-06-08T12:00:00Z' })]);
    expect(followUp).toHaveLength(1);
    expect(followUp[0]).toMatchObject({ reason: 'no_activity', daysSinceActivity: 20 });
  });

  it('a matter active within 14 days is not flagged', () => {
    expect(build([matter({ lastActivityAt: '2026-06-25T12:00:00Z' })]).followUp).toHaveLength(0);
  });

  it('AC5: a resolved matter is never in follow up, however stale', () => {
    expect(build([matter({ status: 'resolved', lastActivityAt: '2020-01-01T00:00:00Z' })]).followUp).toHaveLength(0);
  });

  it('AC6: a new matter past its first-contact deadline is flagged first_contact_overdue', () => {
    const { followUp } = build([matter({ status: 'new', firstContactDue: '2026-06-26T00:00:00Z' })]);
    expect(followUp).toHaveLength(1);
    expect(followUp[0]).toMatchObject({ reason: 'first_contact_overdue', daysSinceActivity: null });
  });

  it('a new matter whose first-contact deadline is still in the future is not flagged', () => {
    expect(build([matter({ status: 'new', firstContactDue: '2026-07-01T00:00:00Z' })]).followUp).toHaveLength(0);
  });

  it('awaiting-response sorts ahead of stale-by-days', () => {
    const { followUp } = build([
      matter({ caseId: 'c1', caseNumber: 'CASE-0001', status: 'investigating', lastActivityAt: '2026-06-08T12:00:00Z' }),
      matter({ caseId: 'c2', caseNumber: 'CASE-0002', status: 'new', firstContactDue: '2026-06-26T00:00:00Z' }),
    ]);
    expect(followUp[0]!.reason).toBe('first_contact_overdue');
    expect(followUp[1]!.reason).toBe('no_activity');
  });
});
