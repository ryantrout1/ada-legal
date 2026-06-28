/**
 * AdminCases — admin cases / placement queue (Phase 3a/3b).
 *
 * Lists the org's cases with a lane filter. The default "Needs placement" view
 * shows sourcing + general_queue cases with no firm; each is placed to a firm
 * via the per-row picker, which routes it into that firm's workspace queue
 * (visible to the firm once the claimant has consented).
 */

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnnounce } from '../../portal/announcer.js';

interface AdminCase {
  case_id: string;
  ada_session_id: string | null;
  case_number: string;
  lane: string;
  status: string;
  classification_title: string | null;
  jurisdiction_state: string | null;
  consent_to_share: boolean;
  claimant_name: string | null;
  claimant_email: string | null;
  case_name: string | null;
  firm_id: string | null;
  firm_name: string | null;
  created_at: string;
}

interface FirmOption {
  id: string;
  name: string;
}

const FILTERS: ReadonlyArray<{ key: string; label: string; lane?: string }> = [
  { key: 'unplaced', label: 'Needs placement', lane: 'unplaced' },
  { key: 'sourcing', label: 'Sourcing', lane: 'sourcing' },
  { key: 'general_queue', label: 'General queue', lane: 'general_queue' },
  { key: 'routed_firm', label: 'Routed to firm', lane: 'routed_firm' },
  { key: 'all', label: 'All' },
];

const LANE_LABEL: Record<string, string> = {
  routed_firm: 'Routed to firm',
  sourcing: 'Sourcing',
  general_queue: 'General queue',
  self_help: 'Self-help',
  no_action: 'No action',
};

const TAB =
  'inline-flex items-center justify-center min-h-[44px] px-4 rounded-md text-sm font-medium border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const FIELD =
  'min-h-[44px] rounded-md border border-control-border bg-white px-3 text-ink-900 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const BTN =
  'inline-flex items-center justify-center min-h-[44px] px-4 rounded-md bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60';

export default function AdminCases() {
  const [filter, setFilter] = useState<string>('unplaced');
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [firms, setFirms] = useState<FirmOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const f = FILTERS.find((x) => x.key === filter);
      const qs = f?.lane ? `?lane=${encodeURIComponent(f.lane)}` : '';
      const resp = await fetch(`/api/admin/cases${qs}`, { credentials: 'include' });
      if (!resp.ok) throw new Error(`Failed to load cases (${resp.status})`);
      const data = (await resp.json()) as { cases: AdminCase[] };
      setCases(data.cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load cases');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const resp = await fetch('/api/admin/firms', { credentials: 'include' });
        if (!resp.ok) return;
        const data = (await resp.json()) as { firms: FirmOption[] };
        setFirms(data.firms.map((x) => ({ id: x.id, name: x.name })));
      } catch {
        /* non-fatal — placement just won't have options */
      }
    })();
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Cases</h1>
        <p className="text-sm text-ink-500">
          Intake cases from Ada. Place sourcing and general-queue cases with a firm to route them
          into that firm&rsquo;s workspace.
        </p>
      </header>

      <div role="tablist" aria-label="Filter cases by lane" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.key)}
              className={`${TAB} ${
                active
                  ? 'bg-accent-500 text-white border-accent-500'
                  : 'bg-white text-ink-700 border-control-border hover:bg-surface-100'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink-500">Loading cases…</p>
      ) : cases.length === 0 ? (
        <p className="text-sm text-ink-500">No cases in this view.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-control-border bg-white">
          <table className="w-full text-sm">
            <caption className="sr-only">Intake cases</caption>
            <thead className="bg-surface-100 text-left text-xs uppercase tracking-wider font-mono text-ink-500">
              <tr>
                <th scope="col" className="px-3 py-2">Claimant</th>
                <th scope="col" className="px-3 py-2">Case</th>
                <th scope="col" className="px-3 py-2">Lane</th>
                <th scope="col" className="px-3 py-2">Claim</th>
                <th scope="col" className="px-3 py-2">Litigation</th>
                <th scope="col" className="px-3 py-2">Consent</th>
                <th scope="col" className="px-3 py-2">Firm / placement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-control-border">
              {cases.map((c) => (
                <tr key={c.case_id} className="align-top">
                  <td className="px-3 py-3 text-ink-900">{c.claimant_name ?? '—'}</td>
                  <td className="px-3 py-3 font-mono text-xs text-ink-700 whitespace-nowrap">
                    {c.case_number}
                  </td>
                  <td className="px-3 py-3 text-ink-700">{LANE_LABEL[c.lane] ?? c.lane}</td>
                  <td className="px-3 py-3 text-ink-700">
                    {c.classification_title ?? '—'}
                    {c.jurisdiction_state ? (
                      <span className="text-ink-500"> · {c.jurisdiction_state}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-ink-700">{c.case_name ?? '—'}</td>
                  <td className="px-3 py-3">
                    {c.consent_to_share ? (
                      <span className="text-success-500">Consented</span>
                    ) : (
                      <span className="text-ink-500">Not yet</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {c.firm_id ? (
                      <span className="text-ink-900">{c.firm_name ?? 'Assigned'}</span>
                    ) : (
                      <PlaceControl caseId={c.case_id} firms={firms} onPlaced={load} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-ink-500">
        <Link to="/admin/sessions" className="underline">
          Sessions
        </Link>{' '}
        hold the raw Ada conversations behind these cases.
      </p>
    </div>
  );
}

function PlaceControl({
  caseId,
  firms,
  onPlaced,
}: {
  caseId: string;
  firms: FirmOption[];
  onPlaced: () => Promise<void> | void;
}) {
  const [firmId, setFirmId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const announce = useAnnounce();
  const selectId = `place-firm-${caseId}`;

  const place = async () => {
    if (!firmId) return;
    setBusy(true);
    setError(null);
    try {
      const resp = await fetch(`/api/admin/cases/${encodeURIComponent(caseId)}/place`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firm_id: firmId }),
      });
      if (!resp.ok) throw new Error(`Placement failed (${resp.status})`);
      await onPlaced();
      const firmName = firms.find((f) => f.id === firmId)?.name;
      announce(firmName ? `Case placed with ${firmName}.` : 'Case placed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not place');
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={selectId} className="sr-only">
          Choose a firm to place this case
        </label>
        <select
          id={selectId}
          value={firmId}
          onChange={(e) => setFirmId(e.target.value)}
          className={FIELD}
        >
          <option value="">Select a firm…</option>
          {firms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy || firmId === ''}
          onClick={() => void place()}
          className={BTN}
        >
          {busy ? 'Placing…' : 'Place'}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-danger-500 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
