/**
 * AdminCivilRightsDetail: one finished civil rights form, with the exact
 * consent wording the person saw and when it was recorded. Delete is for
 * deletion requests and admin-preview test forms; it asks first and is
 * written to the audit log.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { AdminSubmission } from '../../../lib/civilRights/adminCore.js';
import { usDate } from '../../../lib/civilRights/summary.js';

const BUTTON =
  'inline-flex min-h-[44px] items-center rounded-md border border-control-border bg-surface-0 px-4 text-sm font-semibold text-ink-900 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2';

export default function AdminCivilRightsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState<AdminSubmission | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(`/api/admin/civil-rights/${id}`, { credentials: 'include' });
        if (resp.status === 404 || resp.status === 400) {
          if (!cancelled) setState('missing');
          return;
        }
        if (!resp.ok) throw new Error(String(resp.status));
        const body = (await resp.json()) as { submission: AdminSubmission };
        if (!cancelled) {
          setRow(body.submission);
          setState('ok');
        }
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function remove() {
    setBusy(true);
    setActionError(null);
    try {
      const resp = await fetch(`/api/admin/civil-rights/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      navigate('/admin/civil-rights');
    } catch (err) {
      setActionError(err instanceof Error ? `Could not delete (${err.message}).` : 'Could not delete.');
      setBusy(false);
    }
  }

  const back = (
    <Link className="text-sm underline text-ink-700" to="/admin/civil-rights">
      All civil rights forms
    </Link>
  );

  if (state !== 'ok' || !row) {
    return (
      <div>
        {back}
        <h1 className="font-display text-2xl text-ink-900 mt-3">Civil rights form</h1>
        <p className="text-sm text-ink-700">
          {state === 'loading' ? 'Loading' : state === 'missing' ? 'This form does not exist or was deleted.' : 'Couldn’t load this form.'}
        </p>
      </div>
    );
  }

  const item = (label: string, value: string | null) => (
    <div className="mb-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-500">{label}</dt>
      <dd className="m-0 text-sm text-ink-900 whitespace-pre-wrap break-words">{value || 'Not given'}</dd>
    </div>
  );
  const yn = (v: string) => (v === 'yes' ? 'Yes' : 'No');

  return (
    <div className="max-w-3xl">
      {back}
      <h1 className="font-display text-2xl text-ink-900 mt-3 mb-1">{row.complainantName}</h1>
      <p className="text-sm text-ink-700 mb-6">
        {row.stateCode.toUpperCase()} · submitted {usDate(row.createdAt.slice(0, 10))} · form edition {row.formVersion}
        {row.utmSource ? ` · source ${row.utmSource}` : ''}
      </p>

      <h2 className="font-display text-xl text-ink-900 mb-2">Person</h2>
      <dl className="mb-6">
        {item('Phone', row.phone)}
        {item('Email', row.email)}
        {item('Address', [row.address1, row.address2, `${row.city}, ${row.state} ${row.zip}`].filter(Boolean).join('\n'))}
        {item('Alternate contact', [row.altContactName, row.altContactPhone].filter(Boolean).join(', '))}
      </dl>

      <h2 className="font-display text-xl text-ink-900 mb-2">Business</h2>
      <dl className="mb-6">
        {item('Name', row.respondentCompany ? `${row.respondentName} (${row.respondentCompany})` : row.respondentName)}
        {item(
          'Address',
          [row.respondentAddress1, row.respondentAddress2, `${row.respondentCity}, ${row.respondentState} ${row.respondentZip ?? ''}`]
            .filter(Boolean)
            .join('\n'),
        )}
      </dl>

      <h2 className="font-display text-xl text-ink-900 mb-2">What happened</h2>
      <dl className="mb-6">
        {item('In their words', row.whatHappened)}
        {item('Witnesses', row.witnesses)}
        {item('First time', row.firstIncidentDate ? usDate(row.firstIncidentDate) : null)}
        {item('Last time', usDate(row.lastIncidentDate))}
        {item('Still happening', yn(row.ongoing))}
        {item('Has a lawyer', row.hasAttorney === 'yes' ? `Yes. ${row.attorneyNameAddress ?? ''}` : 'No')}
        {item('Legal action pending', yn(row.legalActionPending))}
        {item('Other agencies', row.otherAgencies)}
        {item('Additional comments', row.additionalComments)}
      </dl>

      <h2 className="font-display text-xl text-ink-900 mb-2">Consents</h2>
      <ul className="mb-6 list-none p-0">
        {row.consents.map((c) => (
          <li key={c.kind} className="mb-3 rounded-md border border-surface-200 p-3 text-sm">
            <p className="m-0 font-semibold text-ink-900">{c.granted ? 'Checked' : 'Not checked'}</p>
            <p className="m-0 text-ink-700">&ldquo;{c.wording}&rdquo;</p>
            <p className="m-0 text-xs text-ink-500">
              Wording version {c.wordingVersion} · recorded {c.recordedAt}
            </p>
          </li>
        ))}
      </ul>

      <h2 className="font-display text-xl text-ink-900 mb-2">Narrative on their form</h2>
      <pre className="mb-8 whitespace-pre-wrap rounded-md border border-surface-200 p-3 text-sm text-ink-900 font-sans">
        {row.summaryText}
      </pre>

      {actionError && (
        <div role="alert" className="mb-3 rounded-md border border-danger-500 px-4 py-3 text-sm text-danger-500">
          {actionError}
        </div>
      )}
      {confirming ? (
        <div role="group" aria-label="Confirm delete" className="flex flex-wrap items-center gap-2">
          <p className="m-0 text-sm text-ink-900">Delete this form for good? This cannot be undone.</p>
          <button type="button" className={`${BUTTON} border-danger-500 text-danger-500`} onClick={() => void remove()} disabled={busy}>
            {busy ? 'Deleting' : 'Yes, delete it'}
          </button>
          <button type="button" className={BUTTON} onClick={() => setConfirming(false)} disabled={busy}>
            Keep it
          </button>
        </div>
      ) : (
        <button type="button" className={BUTTON} onClick={() => setConfirming(true)}>
          Delete this form
        </button>
      )}
    </div>
  );
}
