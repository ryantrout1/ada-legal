/**
 * Pure agenda builder for the "Needs attention" view (build-list #2).
 *
 * Takes the firm's active-ish matters + open tasks and produces two lists:
 *   - keyDates: SOL deadlines and task due dates, merged and bucketed by date
 *     (overdue / today / this_week / later) via the shared taskBuckets logic.
 *   - followUp: matters that have gone quiet — active matters with no activity
 *     for `staleDays`, plus routed matters still `new` past their first-contact
 *     deadline.
 *
 * SOL is read straight from the matter; it is NEVER computed here. A matter
 * with no `solDate` simply produces no deadline. `today` (YYYY-MM-DD) and
 * `staleDays` are passed in so the function stays deterministic and testable.
 */

import { bucketForDueDate, type TaskBucket } from './taskBuckets.js';

/** Raw matter row the builder reasons over (from getAgendaInputsForFirm). */
export interface AgendaMatterInput {
  caseId: string;
  caseNumber: string;
  clientName: string | null;
  /** Attorney-set statute-of-limitations date (YYYY-MM-DD) or null. Never computed. */
  solDate: string | null;
  status: string;
  /** First-contact SLA deadline (ISO) for routed matters, or null. */
  firstContactDue: string | null;
  /** Most recent activity timestamp (ISO) for the matter, or null. */
  lastActivityAt: string | null;
}

/** Raw open-task row the builder reasons over. */
export interface AgendaTaskInput {
  id: string;
  caseId: string;
  title: string;
  dueDate: string | null;
  priority: string;
}

export interface AgendaInputs {
  matters: AgendaMatterInput[];
  tasks: AgendaTaskInput[];
}

/** A dated item in the Key dates list — either a SOL deadline or a task due date. */
export interface AgendaDateItem {
  kind: 'sol' | 'task';
  caseId: string;
  caseNumber: string;
  clientName: string | null;
  title: string;
  dueDate: string | null;
  bucket: TaskBucket;
  /** Task priority; null for SOL items. */
  priority: string | null;
  /** Task id; null for SOL items. */
  taskId: string | null;
}

export type FollowUpReason = 'no_activity' | 'first_contact_overdue';

export interface FollowUpItem {
  caseId: string;
  caseNumber: string;
  clientName: string | null;
  status: string;
  reason: FollowUpReason;
  /** Whole days since the last activity; null for first-contact-overdue items. */
  daysSinceActivity: number | null;
  lastActivityAt: string | null;
}

export interface Agenda {
  keyDates: AgendaDateItem[];
  followUp: FollowUpItem[];
}

/** Statuses that count as live work — the only matters that surface here. */
const ACTIVE_STATUSES = new Set(['new', 'investigating', 'demand_sent', 'negotiating']);
/** Working statuses whose staleness is measured by inactivity (`new` uses the SLA instead). */
const WORKING_STATUSES = new Set(['investigating', 'demand_sent', 'negotiating']);

const BUCKET_ORDER: Record<TaskBucket, number> = { overdue: 0, today: 1, this_week: 2, later: 3 };

/** Date portion (YYYY-MM-DD) of an ISO timestamp or date string. */
function dateOnly(value: string): string {
  return value.slice(0, 10);
}

/** Whole days from `date` to `today`, both YYYY-MM-DD; positive when date is in the past. */
function daysSince(date: string, today: string): number {
  const d = Date.parse(`${date}T00:00:00Z`);
  const t = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(d) || Number.isNaN(t)) return 0;
  return Math.round((t - d) / 86_400_000);
}

/** Ascending date compare with nulls sorted last. */
function cmpDate(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a < b ? -1 : 1;
}

export function buildAgenda(input: {
  matters: AgendaMatterInput[];
  tasks: AgendaTaskInput[];
  today: string;
  staleDays: number;
}): Agenda {
  const { matters, tasks, today, staleDays } = input;
  const mattersById = new Map(matters.map((m) => [m.caseId, m]));

  const keyDates: AgendaDateItem[] = [];

  // SOL deadlines — active matters only, and only when a date is actually set.
  for (const m of matters) {
    if (!m.solDate || !ACTIVE_STATUSES.has(m.status)) continue;
    keyDates.push({
      kind: 'sol',
      caseId: m.caseId,
      caseNumber: m.caseNumber,
      clientName: m.clientName,
      title: 'Statute of limitations',
      dueDate: m.solDate,
      bucket: bucketForDueDate(m.solDate, today),
      priority: null,
      taskId: null,
    });
  }

  // Task due dates — tasks on active matters; name/number come from the matter.
  for (const t of tasks) {
    const m = mattersById.get(t.caseId);
    if (!m || !ACTIVE_STATUSES.has(m.status)) continue;
    keyDates.push({
      kind: 'task',
      caseId: t.caseId,
      caseNumber: m.caseNumber,
      clientName: m.clientName,
      title: t.title,
      dueDate: t.dueDate,
      bucket: bucketForDueDate(t.dueDate, today),
      priority: t.priority,
      taskId: t.id,
    });
  }

  keyDates.sort(
    (a, b) =>
      BUCKET_ORDER[a.bucket] - BUCKET_ORDER[b.bucket] ||
      cmpDate(a.dueDate, b.dueDate) ||
      a.caseNumber.localeCompare(b.caseNumber),
  );

  const followUp: FollowUpItem[] = [];
  for (const m of matters) {
    if (m.status === 'new') {
      if (m.firstContactDue && dateOnly(m.firstContactDue) < today) {
        followUp.push({
          caseId: m.caseId,
          caseNumber: m.caseNumber,
          clientName: m.clientName,
          status: m.status,
          reason: 'first_contact_overdue',
          daysSinceActivity: null,
          lastActivityAt: m.lastActivityAt,
        });
      }
      continue;
    }
    if (WORKING_STATUSES.has(m.status) && m.lastActivityAt) {
      const days = daysSince(dateOnly(m.lastActivityAt), today);
      if (days >= staleDays) {
        followUp.push({
          caseId: m.caseId,
          caseNumber: m.caseNumber,
          clientName: m.clientName,
          status: m.status,
          reason: 'no_activity',
          daysSinceActivity: days,
          lastActivityAt: m.lastActivityAt,
        });
      }
    }
  }

  // Most urgent first: awaiting-response (no SLA left) above stalest-by-days.
  const urgency = (f: FollowUpItem) =>
    f.reason === 'first_contact_overdue' ? Number.MAX_SAFE_INTEGER : (f.daysSinceActivity ?? 0);
  followUp.sort((a, b) => urgency(b) - urgency(a) || a.caseNumber.localeCompare(b.caseNumber));

  return { keyDates, followUp };
}
