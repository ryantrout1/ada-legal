/**
 * AdminLitigation — admin list view over `litigation_listings`.
 *
 * This is the screen the platform never had. `/admin/listings` reads the
 * `listings` table (per-firm marketing listings, 6 rows) and the nav has
 * been calling it "Class & Mass Actions" — but the actual class and mass
 * actions are `litigation_listings` (39 rows), and the only editor that
 * ever pointed at them lived in Base44. When B44 is decommissioned that
 * editor goes with it, and routing configuration becomes SQL-only.
 *
 * Rows link to AdminLitigationEdit, which carries the form AND the
 * routing panel (firm assignment + receives_matches opt-in + lead firm).
 *
 * NATIONWIDE. `affected_states` has two encodings for the same meaning:
 * a legacy `__nationwide__` sentinel (17 rows) and the empty-array
 * convention the write path normalizes to. `normalizeStates` collapses
 * both so the sentinel never renders as if it were a state code.
 *
 * Ref: /plan Gate A Phase 1.
 */

import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NATIONWIDE_SENTINEL = '__nationwide__';

type Kind =
  | 'class'
  | 'enforcement_action'
  | 'consent_decree'
  | 'pattern_of_practice'
  | 'regulatory_challenge';

type Status =
  | 'draft'
  | 'active'
  | 'investigating'
  | 'compliance'
  | 'tracking'
  | 'closed'
  | 'archived';

interface LitigationRow {
  id: string;
  kind: Kind;
  caseName: string;
  slug: string;
  status: Status;
  court: string | null;
  docketNumber: string | null;
  affectedStates: string[];
  filingDate: string | null;
  leadFirmId: string | null;
}

export const KIND_LABEL: Record<Kind, string> = {
  class: 'Class action',
  enforcement_action: 'Enforcement action',
  consent_decree: 'Consent decree',
  pattern_of_practice: 'Pattern or practice',
  regulatory_challenge: 'Regulatory challenge',
};

export const STATUS_LABEL: Record<Status, string> = {
  draft: 'Draft',
  active: 'Active',
  investigating: 'Investigating',
  compliance: 'Compliance',
  tracking: 'Tracking',
  closed: 'Closed',
  archived: 'Archived',
};

/** Drop the legacy sentinel so it never renders as a state code. */
export function normalizeStates(states: string[] | null | undefined): string[] {
  if (!Array.isArray(states)) return [];
  return states.filter((s) => s.toLowerCase() !== NATIONWIDE_SENTINEL);
}

/** Empty after normalize means nationwide — both encodings agree on that. */
function statesLabel(states: string[] | null | undefined): string {
  const normalized = normalizeStates(states);
  if (normalized.length === 0) return 'Nationwide';
  if (normalized.length <= 4) return normalized.join(', ');
  return `${normalized.slice(0, 4).join(', ')} +${normalized.length - 4}`;
}

export default function AdminLitigation() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LitigationRow[]>([]);
  const [total, setTotal] = useState(0);
  const [kind, setKind] = useState<string>('');
  const [status, setStatus] = useState<Status | ''>('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauth, setUnauth] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (kind) params.set('kind', kind);
      if (status) params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      params.set('page_size', '100');
      const resp = await fetch(`/api/admin/litigation?${params.toString()}`, {
        credentials: 'include',
      });
      if (resp.status === 401) {
        setUnauth(true);
        return;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as {
        litigation: LitigationRow[];
        total_count: number;
      };
      setRows(data.litigation);
      setTotal(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [kind, status, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);

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
            Class &amp; Mass Actions
          </h1>
          <p className="text-sm text-ink-500">
            The litigation Ada matches claimants against. Firm assignment and
            match routing are configured on each record.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/litigation/new')}
          className="min-h-[44px] px-4 rounded-md bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors"
        >
          + Add litigation
        </button>
      </header>

      <fieldset className="mb-5 rounded-md border border-surface-200 bg-surface-100 p-3 sm:p-4">
        <legend className="sr-only">Filter litigation</legend>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Kind</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="min-h-[44px] rounded-md border border-control-border bg-white px-3 text-ink-900"
            >
              <option value="">All</option>
              <option value="class">Class actions</option>
              <option value="mass">Mass actions (all non-class)</option>
              <option value="enforcement_action">Enforcement action</option>
              <option value="consent_decree">Consent decree</option>
              <option value="pattern_of_practice">Pattern or practice</option>
              <option value="regulatory_challenge">Regulatory challenge</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-ink-700 font-medium">Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status | '')}
              className="min-h-[44px] rounded-md border border-control-border bg-white px-3 text-ink-900"
            >
              <option value="">All</option>
              {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-ink-700 font-medium">Search</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Case name or slug"
              className="min-h-[44px] flex-1 rounded-md border border-control-border bg-white px-3 text-ink-900 placeholder-ink-500"
            />
          </label>

          <span className="ml-auto text-xs text-ink-500 font-mono">
            {loading ? 'Loading…' : `${total} total`}
          </span>
        </div>
      </fieldset>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-surface-200 bg-white">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Litigation records with kind, status, court and affected states
          </caption>
          <thead className="bg-surface-100 text-left text-xs uppercase tracking-wider font-mono text-ink-500">
            <tr>
              <th scope="col" className="px-3 py-2">Case</th>
              <th scope="col" className="px-3 py-2">Kind</th>
              <th scope="col" className="px-3 py-2">Status</th>
              <th scope="col" className="px-3 py-2">Court</th>
              <th scope="col" className="px-3 py-2">States</th>
              <th scope="col" className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-ink-500">
                  No litigation matches the current filters.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-surface-200">
                <td className="px-3 py-2">
                  <Link
                    to={`/admin/litigation/${row.id}`}
                    className="text-accent-600 underline underline-offset-2"
                  >
                    {row.caseName}
                  </Link>
                  <span className="block text-xs text-ink-500 font-mono">
                    {row.slug}
                  </span>
                </td>
                <td className="px-3 py-2 text-ink-700">{KIND_LABEL[row.kind] ?? row.kind}</td>
                <td className="px-3 py-2 text-ink-700">
                  {STATUS_LABEL[row.status] ?? row.status}
                </td>
                <td className="px-3 py-2 text-ink-700">{row.court ?? '—'}</td>
                <td className="px-3 py-2 text-ink-700">{statesLabel(row.affectedStates)}</td>
                <td className="px-3 py-2 text-right">
                  <Link
                    to={`/admin/litigation/${row.id}`}
                    className="inline-flex items-center min-h-[44px] px-2 text-accent-600 underline underline-offset-2"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
