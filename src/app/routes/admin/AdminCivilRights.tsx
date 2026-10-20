/**
 * AdminCivilRights: forms people finished on /civil-rights/:state.
 *
 * Newest first, with the two consent answers on every row (who said we may
 * send updates, who said we may contact them). Full details, including
 * contact details, are on each form's own page; there is no bulk export.
 * Admin-preview test forms are marked so they are easy to delete.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdminListRow } from '../../../lib/civilRights/adminCore.js';
import { usDate } from '../../../lib/civilRights/summary.js';

const BUTTON =
  'inline-flex min-h-[44px] items-center rounded-md border border-control-border bg-surface-0 px-4 text-sm font-semibold text-ink-900 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2';

function yesNo(v: string): string {
  return v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Not recorded';
}

export default function AdminCivilRights() {
  const [rows, setRows] = useState<AdminListRow[] | null>(null);
  const [capped, setCapped] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch('/api/admin/civil-rights', { credentials: 'include' });
        if (!resp.ok) throw new Error(String(resp.status));
        const body = (await resp.json()) as { rows?: AdminListRow[]; capped?: boolean };
        if (!cancelled) {
          setRows(body.rows ?? []);
          setCapped(body.capped === true);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-900 mb-1">Civil rights forms</h1>
      <p className="text-ink-700 text-sm mb-4">
        Forms people finished on the state civil rights complaint page. Open one to see its full
        details.
      </p>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link className={BUTTON} to="/admin/civil-rights/preview/arizona">
          Preview the Arizona form
        </Link>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-surface-200 bg-white p-4 text-sm">
          Couldn&rsquo;t load civil rights forms.
        </div>
      )}
      {rows === null && !error && <p className="text-sm text-ink-700">Loading</p>}
      {rows !== null && rows.length === 0 && (
        <div className="rounded-md border border-surface-200 bg-white p-6 text-sm text-ink-700">
          No forms yet. Finished forms will show up here.
        </div>
      )}
      {capped && (
        <p className="mb-3 text-sm text-ink-700">Showing the newest {rows?.length} forms.</p>
      )}

      <ul className="list-none p-0 m-0 flex flex-col gap-3">
        {(rows ?? []).map((r) => (
          <li key={r.id} className="rounded-lg border border-surface-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-500">
                {r.stateCode.toUpperCase()}
              </span>
              {r.preview && (
                <span className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full border border-warning-500 text-ink-900">
                  Admin preview
                </span>
              )}
              <span className="text-xs text-ink-500 ml-auto">{usDate(r.createdAt.slice(0, 10))}</span>
            </div>
            <p className="m-0 text-ink-900 font-semibold">
              <Link className="underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500" to={`/admin/civil-rights/${r.id}`}>
                {r.complainantName}
              </Link>
            </p>
            <p className="m-0 text-sm text-ink-700">
              {r.respondentName}, {r.respondentCity} · last time {usDate(r.lastIncidentDate)} · still happening{' '}
              {yesNo(r.ongoing).toLowerCase()}
            </p>
            <p className="m-0 mt-1 text-xs text-ink-700">
              Updates: {yesNo(r.consentUpdates)} · May contact: {yesNo(r.consentContact)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
