/**
 * PortalAgenda — "Needs attention" (build-list #2). One screen for what needs a
 * move: key dates (SOL deadlines + task due dates, bucketed Overdue / Today /
 * This week / Later) and matters that have gone quiet (no recent activity, or
 * new past first-contact). An accessible list, not a calendar grid — kind and
 * reason are carried in text, never by colour alone.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchAgenda,
  type PortalAgenda as PortalAgendaData,
  type PortalAgendaDate,
  type PortalAgendaFollowUp,
} from '../../data/portalClient.js';
import { TASK_BUCKETS, type TaskBucket } from '../../../engine/cases/taskBuckets.js';

const PRIORITY_LABEL: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low' };
const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  investigating: 'Investigating',
  demand_sent: 'Demand sent',
  negotiating: 'Negotiating',
};

function followUpReason(f: PortalAgendaFollowUp): string {
  if (f.reason === 'first_contact_overdue') return 'Awaiting your first response';
  const n = f.days_since_activity ?? 0;
  return `No activity in ${n} ${n === 1 ? 'day' : 'days'}`;
}

const EMPTY: PortalAgendaData = { key_dates: [], follow_up: [] };

export default function PortalAgenda() {
  const [agenda, setAgenda] = useState<PortalAgendaData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAgenda(await fetchAgenda());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load what needs attention');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const buckets = useMemo(() => {
    const map: Record<TaskBucket, PortalAgendaDate[]> = {
      overdue: [],
      today: [],
      this_week: [],
      later: [],
    };
    for (const k of agenda.key_dates) map[k.bucket].push(k);
    return map;
  }, [agenda]);

  const nothing = agenda.key_dates.length === 0 && agenda.follow_up.length === 0;

  return (
    <section>
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Needs attention</h1>
        <p className="text-ink-500 text-sm">Deadlines and matters that need a move from you.</p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}{' '}
          <button type="button" onClick={() => void load()} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : nothing ? (
        <p className="text-sm text-ink-500">
          You’re all caught up. Nothing needs attention right now.
        </p>
      ) : (
        <div className="flex flex-col gap-8 max-w-2xl">
          <section aria-labelledby="agenda-key-dates">
            <h2 id="agenda-key-dates" className="font-display text-lg text-ink-900 mb-3">
              Key dates
            </h2>
            {agenda.key_dates.length === 0 ? (
              <p className="text-sm text-ink-500">No deadlines coming up.</p>
            ) : (
              <div className="flex flex-col gap-6">
                {TASK_BUCKETS.map(({ key, label }) => {
                  const items = buckets[key];
                  if (items.length === 0) return null;
                  return (
                    <section key={key} aria-labelledby={`agenda-bucket-${key}`}>
                      <h3
                        id={`agenda-bucket-${key}`}
                        className={`font-display text-sm uppercase tracking-wide mb-2 ${
                          key === 'overdue' ? 'text-danger-500' : 'text-ink-700'
                        }`}
                      >
                        {label}{' '}
                        <span className="font-mono text-xs text-ink-500">({items.length})</span>
                      </h3>
                      <ul className="flex flex-col gap-2">
                        {items.map((k) => (
                          <li
                            key={k.task_id ?? `sol-${k.case_id}`}
                            className="flex items-start justify-between gap-3 rounded-md border border-control-border bg-white px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="text-ink-900">{k.title}</p>
                              <p className="text-xs text-ink-500 mt-0.5">
                                <span className="font-semibold text-ink-700">
                                  {k.kind === 'sol' ? 'SOL' : 'Task'}
                                </span>{' '}
                                ·{' '}
                                <Link
                                  to={`/portal/cases/${k.case_id}`}
                                  state={{ from: '/portal/agenda' }}
                                  className="underline hover:text-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
                                >
                                  {k.client_name ?? k.case_number}
                                </Link>
                                {k.kind === 'task' && k.priority
                                  ? ` · ${PRIORITY_LABEL[k.priority] ?? k.priority}`
                                  : ''}
                              </p>
                            </div>
                            <span className="text-xs text-ink-500 whitespace-nowrap shrink-0">
                              {k.due_date ?? 'No date'}
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

          <section aria-labelledby="agenda-follow-up">
            <h2 id="agenda-follow-up" className="font-display text-lg text-ink-900 mb-3">
              Needs follow-up
            </h2>
            {agenda.follow_up.length === 0 ? (
              <p className="text-sm text-ink-500">Every active matter has recent activity.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {agenda.follow_up.map((f) => (
                  <li
                    key={f.case_id}
                    className="flex items-start justify-between gap-3 rounded-md border border-control-border bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-ink-900">
                        <Link
                          to={`/portal/cases/${f.case_id}`}
                          state={{ from: '/portal/agenda' }}
                          className="underline hover:text-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-sm"
                        >
                          {f.client_name ?? f.case_number}
                        </Link>
                      </p>
                      <p className="text-xs text-ink-500 mt-0.5">{followUpReason(f)}</p>
                    </div>
                    <span className="text-xs text-ink-500 whitespace-nowrap shrink-0">
                      {STATUS_LABEL[f.status] ?? f.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
