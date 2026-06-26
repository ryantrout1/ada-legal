/**
 * PortalPipeline — pipeline analytics for the firm (Phase 4c): the stage funnel
 * (how many cases reach each stage) and median time-in-stage.
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchPipelineStats, type PipelineStatsResponse } from '../../data/portalClient.js';
import PortalViewToggle from './PortalViewToggle.js';

const STAGES = [
  { key: 'new', label: 'New' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'working', label: 'Working' },
  { key: 'resolved', label: 'Resolved' },
] as const;

const TIMED_LABEL: Record<string, string> = {
  new: 'New → Accepted',
  accepted: 'Accepted → Working',
  working: 'Working → Resolved',
};

function pct(part: number, whole: number): string {
  if (whole === 0) return '—';
  return `${Math.round((part / whole) * 100)}%`;
}

function duration(hours: number, n: number): string {
  if (n === 0) return '—';
  if (hours >= 48) return `${(hours / 24).toFixed(1)} days`;
  return `${hours.toFixed(1)} hrs`;
}

export default function PortalPipeline() {
  const [stats, setStats] = useState<PipelineStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await fetchPipelineStats());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Pipeline stats</h1>
          <p className="text-ink-500 text-sm">How your matched cases move through the stages.</p>
        </div>
        <PortalViewToggle active="stats" />
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
        <p className="text-sm text-ink-500">Loading analytics…</p>
      ) : !stats ? null : stats.stage_counts.new === 0 ? (
        <p className="text-sm text-ink-500">No cases yet — stats will appear as cases come in.</p>
      ) : (
        <div className="flex flex-col gap-8 max-w-3xl">
          <section aria-labelledby="funnel-h">
            <h2 id="funnel-h" className="font-display text-lg text-ink-900 mb-3">
              Stage conversion
            </h2>
            <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STAGES.map((s, i) => {
                const count = stats.stage_counts[s.key];
                const prev = i === 0 ? count : stats.stage_counts[STAGES[i - 1]!.key];
                return (
                  <li key={s.key} className="rounded-md border border-control-border bg-white px-4 py-3">
                    <div className="text-ink-500 text-xs uppercase tracking-wide">{s.label}</div>
                    <div className="text-ink-900 text-3xl font-display">{count}</div>
                    {i > 0 && (
                      <div className="text-ink-500 text-xs mt-1">{pct(count, prev)} of {STAGES[i - 1]!.label}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <section aria-labelledby="time-h">
            <h2 id="time-h" className="font-display text-lg text-ink-900 mb-3">
              Median time in stage
            </h2>
            <ul className="flex flex-col gap-2">
              {stats.time_in_stage.map((t) => (
                <li
                  key={t.stage}
                  className="flex items-center justify-between rounded-md border border-control-border bg-white px-4 py-3"
                >
                  <span className="text-ink-700">{TIMED_LABEL[t.stage] ?? t.stage}</span>
                  <span className="text-ink-900 font-medium">
                    {duration(t.median_hours, t.n)}
                    <span className="text-ink-500 font-normal text-sm ml-2">
                      ({t.n} {t.n === 1 ? 'case' : 'cases'})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </section>
  );
}
