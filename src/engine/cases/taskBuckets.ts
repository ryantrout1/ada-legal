/**
 * Pure due-date bucketing for the cross-matter Tasks screen (Phase 4b).
 *
 * Buckets an open task by its due date relative to "today": past → overdue,
 * same day → today, within the next 7 days → this_week, beyond (or no date) →
 * later. "today" is passed in (YYYY-MM-DD) so the function stays deterministic.
 */

export type TaskBucket = 'overdue' | 'today' | 'this_week' | 'later';

export const TASK_BUCKETS: ReadonlyArray<{ key: TaskBucket; label: string }> = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'this_week', label: 'This week' },
  { key: 'later', label: 'Later' },
];

export function bucketForDueDate(due: string | null, today: string): TaskBucket {
  if (!due) return 'later';
  const d = Date.parse(`${due}T00:00:00Z`);
  const t = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(d) || Number.isNaN(t)) return 'later';
  const days = Math.round((d - t) / 86_400_000);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 7) return 'this_week';
  return 'later';
}
