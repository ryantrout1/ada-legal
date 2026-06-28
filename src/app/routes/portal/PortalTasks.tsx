/**
 * PortalTasks — the firm's open tasks across all matters (Phase 4b), bucketed
 * Overdue / Today / This week / Later by due date.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchFirmTasks, type PortalFirmTask } from '../../data/portalClient.js';
import { bucketForDueDate, TASK_BUCKETS, type TaskBucket } from '../../../engine/cases/taskBuckets.js';

const PRIORITY_LABEL: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low' };

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function PortalTasks() {
  const [tasks, setTasks] = useState<PortalFirmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await fetchFirmTasks());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const buckets = useMemo(() => {
    const today = todayStr();
    const map: Record<TaskBucket, PortalFirmTask[]> = { overdue: [], today: [], this_week: [], later: [] };
    for (const t of tasks) map[bucketForDueDate(t.due_date, today)].push(t);
    return map;
  }, [tasks]);

  return (
    <section>
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Tasks</h1>
        <p className="text-ink-500 text-sm">Open tasks across all your matters.</p>
      </header>

      {error && (
        <div role="alert" className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500">
          {error}{' '}
          <button type="button" onClick={() => void load()} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink-500">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-ink-500">No open tasks. Nice and clear.</p>
      ) : (
        <div className="flex flex-col gap-6 max-w-2xl">
          {TASK_BUCKETS.map(({ key, label }) => {
            const items = buckets[key];
            if (items.length === 0) return null;
            return (
              <section key={key} aria-labelledby={`bucket-${key}`}>
                <h2
                  id={`bucket-${key}`}
                  className={`font-display text-sm uppercase tracking-wide mb-2 ${
                    key === 'overdue' ? 'text-danger-500' : 'text-ink-700'
                  }`}
                >
                  {label} <span className="font-mono text-xs text-ink-500">({items.length})</span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {items.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-control-border bg-white px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-ink-900">{t.title}</p>
                        <p className="text-xs text-ink-500 mt-0.5">
                          <Link
                            to={`/portal/cases/${t.case_id}`}
                            state={{ from: '/portal/tasks' }}
                            className="underline hover:text-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
                          >
                            {t.claimant_name ?? t.case_number}
                          </Link>{' '}
                          · {PRIORITY_LABEL[t.priority] ?? t.priority}
                        </p>
                      </div>
                      <span className="text-xs text-ink-500 whitespace-nowrap shrink-0">
                        {t.due_date ?? 'No date'}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
