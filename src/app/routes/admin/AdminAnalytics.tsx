/**
 * AdminAnalytics — admin-facing analytics dashboard.
 *
 * Five at-a-glance views over all non-test sessions:
 *   1. Session volume (last 14 days, simple bar chart)
 *   2. Completion rate (big number + breakdown)
 *   3. Reading-level distribution (stacked bar)
 *   4. Classification breakdown (horizontal bars)
 *   5. Tool-use frequency (horizontal bars)
 *
 * No chart library. Everything is HTML + CSS widths. Keeps bundle
 * size down and makes accessibility trivial.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface AnalyticsData {
  session_volume: Array<{ date: string; count: number }>;
  status_counts: {
    active: number;
    completed: number;
    abandoned: number;
    total: number;
  };
  completion_rate: number | null;
  reading_level_distribution: {
    simple: number;
    standard: number;
    professional: number;
  };
  classification_breakdown: Array<{ title: string; count: number }>;
  tool_use_frequency: Array<{ tool: string; count: number }>;
}

export default function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);
  const [includeTest, setIncludeTest] = useState(false);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set('days', '14');
        if (includeTest) params.set('include_test', 'true');
        const resp = await fetch(`/api/admin/analytics?${params.toString()}`, {
          credentials: 'include',
        });
        if (resp.status === 401) {
          setUnauth(true);
          return;
        }
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const body = (await resp.json()) as AnalyticsData;
        setData(body);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [includeTest]);

  if (unauth) {
    return (
      <div
        role="alert"
        className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
      >
        Your session is not authenticated.{' '}
        <Link to="/admin/sign-in" className="underline">
          Sign in
        </Link>
        .
      </div>
    );
  }

  return (
    <section>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">
            Analytics
          </h1>
          <p className="text-sm text-ink-500">
            Operational snapshot. Real-time-ish — data is cached for 60 seconds.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeTest}
            onChange={(e) => setIncludeTest(e.target.checked)}
            className="accent-accent-500"
          />
          <span className="text-ink-700">Include QA / test sessions</span>
        </label>
      </header>

      {loading && <p className="text-ink-500 italic">Loading analytics…</p>}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Sessions — last 14 days" span={2}>
            <VolumeChart data={data.session_volume} />
          </Card>

          <Card title="Completion rate">
            <CompletionRate
              rate={data.completion_rate}
              counts={data.status_counts}
            />
          </Card>

          <Card title="Reading level">
            <ReadingLevels dist={data.reading_level_distribution} />
          </Card>

          <Card title="Classifications" span={2}>
            <HorizontalBars
              rows={data.classification_breakdown.map((r) => ({
                label: r.title,
                count: r.count,
              }))}
              emptyLabel="No classified sessions yet."
            />
          </Card>

          <Card title="Tool use frequency" span={2}>
            <HorizontalBars
              rows={data.tool_use_frequency.map((r) => ({
                label: r.tool,
                count: r.count,
              }))}
              emptyLabel="No tool calls recorded yet."
            />
          </Card>
        </div>
      )}
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({
  title,
  span = 1,
  children,
}: {
  title: string;
  span?: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        'rounded-md border border-surface-200 bg-white p-4 sm:p-5 ' +
        (span === 2 ? 'md:col-span-2' : '')
      }
    >
      <h2 className="text-xs uppercase tracking-wider font-mono text-ink-500 mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}

function VolumeChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (data.length === 0) {
    return <p className="text-sm text-ink-500">No data.</p>;
  }
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div>
      <div className="flex items-end gap-1 h-32" role="list" aria-label="Sessions per day">
        {data.map((d) => {
          const heightPct = (d.count / max) * 100;
          return (
            <div
              key={d.date}
              role="listitem"
              title={`${d.date}: ${d.count}`}
              className="flex-1 flex flex-col justify-end"
            >
              <div
                className="bg-accent-500 rounded-sm min-h-[2px] transition-colors hover:bg-accent-600"
                style={{ height: `${heightPct}%` }}
                aria-label={`${d.date}: ${d.count} sessions`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-ink-500 font-mono mt-2">
        <span>{formatShortDate(data[0].date)}</span>
        <span>{formatShortDate(data[data.length - 1].date)}</span>
      </div>
      <p className="text-xs text-ink-500 mt-1">
        {data.reduce((s, d) => s + d.count, 0)} sessions total over this window.
      </p>
    </div>
  );
}

function CompletionRate({
  rate,
  counts,
}: {
  rate: number | null;
  counts: { active: number; completed: number; abandoned: number; total: number };
}) {
  return (
    <div>
      <p className="font-display text-4xl text-ink-900 mb-1">
        {rate === null ? '—' : `${Math.round(rate * 100)}%`}
      </p>
      <p className="text-xs text-ink-500 mb-3">
        {rate === null
          ? 'No finished sessions yet.'
          : 'Of completed + abandoned sessions.'}
      </p>
      <dl className="text-sm space-y-0.5">
        <StatRow label="Completed" value={counts.completed} />
        <StatRow label="Abandoned" value={counts.abandoned} />
        <StatRow label="Active" value={counts.active} />
        <StatRow label="Total" value={counts.total} strong />
      </dl>
    </div>
  );
}

function ReadingLevels({
  dist,
}: {
  dist: { simple: number; standard: number; professional: number };
}) {
  const total = dist.simple + dist.standard + dist.professional;
  if (total === 0) {
    return <p className="text-sm text-ink-500">No sessions yet.</p>;
  }
  const pct = (n: number) => Math.round((n / total) * 100);
  return (
    <div>
      <div className="flex rounded-md overflow-hidden h-5 mb-3" role="img" aria-label="Reading level distribution">
        <div
          className="bg-success-500"
          style={{ width: `${pct(dist.simple)}%` }}
          title={`Simple: ${dist.simple}`}
        />
        <div
          className="bg-accent-500"
          style={{ width: `${pct(dist.standard)}%` }}
          title={`Standard: ${dist.standard}`}
        />
        <div
          className="bg-warning-500"
          style={{ width: `${pct(dist.professional)}%` }}
          title={`Professional: ${dist.professional}`}
        />
      </div>
      <dl className="text-sm space-y-0.5">
        <LevelRow color="bg-success-500" label="Simple" value={dist.simple} pct={pct(dist.simple)} />
        <LevelRow color="bg-accent-500" label="Standard" value={dist.standard} pct={pct(dist.standard)} />
        <LevelRow
          color="bg-warning-500"
          label="Professional"
          value={dist.professional}
          pct={pct(dist.professional)}
        />
      </dl>
    </div>
  );
}

function HorizontalBars({
  rows,
  emptyLabel,
}: {
  rows: Array<{ label: string; count: number }>;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-500">{emptyLabel}</p>;
  }
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="space-y-1.5 list-none p-0 m-0">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-center justify-between text-xs text-ink-700 mb-0.5">
            <span className="truncate pr-2">{r.label}</span>
            <span className="font-mono text-ink-500">{r.count}</span>
          </div>
          <div
            className="bg-surface-100 rounded-sm h-2 overflow-hidden"
            role="img"
            aria-label={`${r.label}: ${r.count}`}
          >
            <div
              className="bg-accent-500 h-full rounded-sm"
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: number;
  strong?: boolean;
}) {
  return (
    <div className={'flex justify-between ' + (strong ? 'border-t border-surface-200 pt-1 mt-1 font-medium text-ink-900' : 'text-ink-700')}>
      <dt>{label}</dt>
      <dd className="font-mono">{value}</dd>
    </div>
  );
}

function LevelRow({
  color,
  label,
  value,
  pct,
}: {
  color: string;
  label: string;
  value: number;
  pct: number;
}) {
  return (
    <div className="flex items-center justify-between text-ink-700">
      <div className="flex items-center gap-2">
        <span className={`inline-block w-2.5 h-2.5 rounded-sm ${color}`} />
        <span>{label}</span>
      </div>
      <span className="font-mono text-ink-500 text-xs">
        {value} <span className="text-ink-500">({pct}%)</span>
      </span>
    </div>
  );
}

function formatShortDate(iso: string): string {
  try {
    const d = new Date(`${iso}T00:00:00Z`);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return iso;
  }
}
