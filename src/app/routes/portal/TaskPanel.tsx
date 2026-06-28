/**
 * TaskPanel — tasks for a single case, shown on the case detail (Phase 4b).
 * Add a task (title + optional due date + priority), list open and completed
 * tasks, and mark open ones done.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  fetchCaseTasks,
  addCaseTask,
  completeCaseTask,
  type PortalTask,
} from '../../data/portalClient.js';
import { useAnnounce } from '../../portal/announcer.js';

const PRIORITY_LABEL: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low' };

const FIELD =
  'min-h-[44px] rounded-md border border-control-border bg-white px-3 text-ink-900 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

export default function TaskPanel({ caseId }: { caseId: string }) {
  const [tasks, setTasks] = useState<PortalTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [busy, setBusy] = useState(false);
  const announce = useAnnounce();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTasks(await fetchCaseTasks(caseId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tasks');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    const t = title.trim();
    if (!t) return;
    setBusy(true);
    setError(null);
    try {
      await addCaseTask(caseId, { title: t, dueDate: dueDate || undefined, priority });
      setTitle('');
      setDueDate('');
      setPriority('medium');
      await load();
      announce('Task added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the task');
    } finally {
      setBusy(false);
    }
  };

  const complete = async (taskId: string) => {
    setError(null);
    try {
      await completeCaseTask(caseId, taskId);
      await load();
      announce('Task completed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the task');
    }
  };

  const open = tasks.filter((t) => !t.completed_at);
  const done = tasks.filter((t) => t.completed_at);

  return (
    <section aria-labelledby="tasks-h" className="mb-8">
      <h2 id="tasks-h" className="font-display text-lg text-ink-900 mb-2">
        Tasks
      </h2>

      {error && (
        <p role="alert" className="text-danger-500 text-sm mb-2">
          {error}
        </p>
      )}

      {!loading && open.length > 0 && (
        <ul className="flex flex-col gap-2 mb-3">
          {open.map((t) => (
            <li
              key={t.id}
              className="flex items-start gap-3 rounded-md border border-control-border bg-white px-4 py-3"
            >
              <button
                type="button"
                onClick={() => void complete(t.id)}
                aria-label={`Mark "${t.title}" complete`}
                className="-m-2.5 p-2.5 shrink-0 inline-flex items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="h-6 w-6 rounded border-2 border-control-border hover:border-accent-500" />
              </button>
              <div className="min-w-0">
                <p className="text-ink-900">{t.title}</p>
                <p className="text-xs text-ink-500 mt-0.5">
                  {t.due_date ? `Due ${t.due_date}` : 'No due date'} · {PRIORITY_LABEL[t.priority] ?? t.priority}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && done.length > 0 && (
        <details className="mb-3">
          <summary className="text-sm text-ink-500 cursor-pointer min-h-[44px] inline-flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
            Completed ({done.length})
          </summary>
          <ul className="flex flex-col gap-1.5 mt-2">
            {done.map((t) => (
              <li key={t.id} className="text-sm text-ink-500 line-through px-1">
                {t.title}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="rounded-md border border-control-border bg-surface-100 p-3 max-w-lg">
        <label htmlFor="task-title" className="block text-sm font-medium text-ink-700 mb-1">
          New task
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          className={`${FIELD} w-full mb-2`}
        />
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="task-due" className="block text-xs text-ink-500 mb-1">
              Due date
            </label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor="task-priority" className="block text-xs text-ink-500 mb-1">
              Priority
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={FIELD}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <button
            type="button"
            disabled={busy || title.trim() === ''}
            onClick={() => void add()}
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-md bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
          >
            Add task
          </button>
        </div>
      </div>
    </section>
  );
}
