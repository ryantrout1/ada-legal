/**
 * Firm — owner-only roster of the firm's lawyers + a read-only view of each
 * lawyer's profile and go-live readiness. Owners can also invite a lawyer by
 * email and hand off / share ownership (/plan Phase 3.1-3.2).
 *
 * Portal-scoped (.lawyer-workspace), AAA.
 */

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle2, AlertCircle, UserPlus } from 'lucide-react';
import {
  fetchFirmLawyers,
  fetchFirmLawyer,
  addFirmLawyer,
  promoteOwner,
  transferOwnership,
  PortalApiError,
  type PortalFirmLawyerSummary,
  type PortalLawyerDetail,
} from '../../data/portalClient.js';

const STATUS_LABEL: Record<string, string> = {
  approved: 'Active',
  pending: 'Pending review',
  rejected: 'Not approved',
  archived: 'Archived',
};

const INPUT =
  'w-full min-h-[44px] rounded-md border border-control-border bg-white px-3 text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-md text-sm font-semibold border border-accent-500 bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60';
const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-md text-sm font-semibold border border-control-border bg-white text-ink-900 hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60';

export default function PortalFirmLawyers() {
  const [lawyers, setLawyers] = useState<PortalFirmLawyerSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PortalFirmLawyerSummary | null>(null);

  const loadRoster = useCallback(async () => {
    setError(null);
    try {
      setLawyers(await fetchFirmLawyers());
    } catch (err) {
      setError(err instanceof PortalApiError ? err.message : 'Could not load your firm.');
    }
  }, []);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  if (error) {
    return (
      <div role="alert" className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500">
        {error}{' '}
        <button type="button" onClick={() => void loadRoster()} className="underline font-medium">
          Retry
        </button>
      </div>
    );
  }

  if (selected) {
    return (
      <LawyerDetail
        summary={selected}
        onBack={() => setSelected(null)}
        onChanged={() => {
          setSelected(null);
          void loadRoster();
        }}
      />
    );
  }

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Lawyers in your firm</h1>
        <p className="text-sm text-ink-500">Everyone on your firm and where they stand on going live.</p>
      </header>

      <AddLawyer onAdded={() => void loadRoster()} />

      {!lawyers ? (
        <p className="text-sm text-ink-500">Loading…</p>
      ) : lawyers.length === 0 ? (
        <p className="text-sm text-ink-500">No lawyers in your firm yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lawyers.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => setSelected(l)}
                className="w-full min-h-[44px] flex items-center justify-between gap-3 rounded-lg border border-control-border bg-white px-4 py-3 text-left hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-ink-900 truncate">{l.name}</span>
                    {l.is_self && <span className="lw-pill">You</span>}
                    {l.firm_role === 'owner' && <span className="lw-pill purple">Owner</span>}
                  </span>
                  <span className="block text-sm text-ink-500 truncate">{l.email ?? 'No email on file'}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-ink-700">{STATUS_LABEL[l.status] ?? l.status}</span>
                  {l.ready ? (
                    <span className="lw-pill text-success-500">Ready</span>
                  ) : (
                    <span className="lw-pill">{l.missing_count} to go</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddLawyer({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setDone(null);
    if (!name.trim() || !email.trim()) {
      setErr('Add a name and an email.');
      return;
    }
    setBusy(true);
    try {
      const added = await addFirmLawyer(name.trim(), email.trim());
      setDone(`Invited ${added.name}. They’ll be linked when they sign up with ${added.email}.`);
      setName('');
      setEmail('');
      onAdded();
    } catch (e) {
      setErr(e instanceof PortalApiError ? e.message : 'Could not add the lawyer.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-6 rounded-lg border border-control-border bg-white p-5">
      <h2 className="flex items-center gap-2 font-display text-lg text-ink-900 mb-3">
        <UserPlus size={18} aria-hidden="true" className="text-ink-500" /> Add a lawyer
      </h2>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="add-name" className="block text-sm font-medium text-ink-700 mb-1">
            Name
          </label>
          <input id="add-name" className={INPUT} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="add-email" className="block text-sm font-medium text-ink-700 mb-1">
            Email
          </label>
          <input id="add-email" type="email" className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      {err && (
        <div role="alert" className="mt-3 rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-500">
          {err}
        </div>
      )}
      {done && (
        <p role="status" className="mt-3 text-sm text-success-500 font-medium">
          {done}
        </p>
      )}
      <div className="mt-4">
        <button type="button" className={BTN} disabled={busy} onClick={() => void submit()}>
          {busy ? 'Adding…' : 'Add lawyer'}
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-500">
        They’ll appear as “pending” until they sign up with this email.
      </p>
    </section>
  );
}

function LawyerDetail({
  summary,
  onBack,
  onChanged,
}: {
  summary: PortalFirmLawyerSummary;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<PortalLawyerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    setError(null);
    setNotFound(false);
    fetchFirmLawyer(summary.id)
      .then((d) => {
        if (!alive) return;
        if (d === null) setNotFound(true);
        else setDetail(d);
      })
      .catch((err) => {
        if (alive) setError(err instanceof PortalApiError ? err.message : 'Could not load this lawyer.');
      });
    return () => {
      alive = false;
    };
  }, [summary.id]);

  const runAction = async (fn: () => Promise<void>) => {
    setActionErr(null);
    setBusy(true);
    try {
      await fn();
      onChanged();
    } catch (e) {
      setActionErr(e instanceof PortalApiError ? e.message : 'That action did not go through.');
    } finally {
      setBusy(false);
    }
  };

  const canManage = !summary.is_self && summary.firm_role === 'member';

  return (
    <div className="max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 min-h-[44px] text-sm text-ink-700 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <ChevronLeft size={16} aria-hidden="true" /> All lawyers
      </button>

      {error && (
        <div role="alert" className="mt-2 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500">
          {error}
        </div>
      )}
      {notFound && <p className="mt-2 text-sm text-ink-500">This lawyer isn’t in your firm.</p>}

      {detail && (
        <div className="mt-2">
          <header className="mb-4">
            <h1 className="font-display text-2xl text-ink-900">{detail.attorney.name}</h1>
            <p className="text-sm text-ink-500">
              {STATUS_LABEL[detail.attorney.status] ?? detail.attorney.status}
              {detail.attorney.firm_role === 'owner' && ' · Owner'}
            </p>
          </header>

          {detail.readiness.ready ? (
            <div role="status" className="mb-5 flex items-center gap-2 rounded-lg border border-success-500 bg-success-50 px-4 py-3 text-sm text-success-500">
              <CheckCircle2 size={18} aria-hidden="true" />
              <span className="font-medium">Ready to go live.</span>
            </div>
          ) : (
            <div role="status" className="mb-5 rounded-lg border border-control-border bg-surface-100 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-medium text-ink-900">
                <AlertCircle size={18} aria-hidden="true" className="text-ink-500" />
                Not ready to go live
              </p>
              <ul className="mt-2 ml-7 list-disc text-sm text-ink-700">
                {detail.readiness.missing.map((m) => (
                  <li key={m.key}>{m.label}</li>
                ))}
              </ul>
            </div>
          )}

          <dl className="rounded-lg border border-control-border bg-white divide-y divide-control-border">
            <Row label="Email" value={detail.attorney.email} />
            <Row label="Phone" value={detail.attorney.phone} />
            <Row label="Bar number" value={detail.attorney.bar_number} />
            <Row label="Home state" value={detail.attorney.location_state} />
            <Row label="City" value={detail.attorney.location_city} />
            <Row label="Other licensed states" value={detail.attorney.additional_states.join(', ') || null} />
            <Row label="Practice areas" value={detail.attorney.practice_areas.join(', ') || null} />
            <Row label="Specialty tags" value={detail.attorney.specialty_tags.join(', ') || null} />
            <Row label="Website" value={detail.attorney.website_url} />
            <Row label="Bio" value={detail.attorney.bio} />
            <Row
              label="Accepting referrals"
              value={detail.attorney.routing_paused ? 'Paused' : detail.attorney.accepting_referrals ? 'Yes' : 'No'}
            />
          </dl>
          <p className="mt-3 text-xs text-ink-500">
            Read-only. Lawyers edit their own profile; an admin can edit anyone.
          </p>

          {canManage && (
            <section className="mt-6 rounded-lg border border-control-border bg-white p-5">
              <h2 className="font-display text-lg text-ink-900 mb-1">Ownership</h2>
              <p className="text-sm text-ink-500 mb-4">
                Owners can manage the firm and its lawyers.
              </p>
              {actionErr && (
                <div role="alert" className="mb-3 rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-500">
                  {actionErr}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={BTN_SECONDARY}
                  disabled={busy}
                  onClick={() => void runAction(() => promoteOwner(summary.id))}
                >
                  Make co-owner
                </button>
                {summary.bound && (
                  <button
                    type="button"
                    className={BTN}
                    disabled={busy}
                    onClick={() => void runAction(() => transferOwnership(summary.id))}
                  >
                    Transfer ownership
                  </button>
                )}
              </div>
              {!summary.bound && (
                <p className="mt-2 text-xs text-ink-500">
                  Transfer becomes available once this lawyer has signed in.
                </p>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-4 px-4 py-3">
      <dt className="w-44 shrink-0 text-sm text-ink-500">{label}</dt>
      <dd className="text-sm text-ink-900">{value && value.trim() ? value : '—'}</dd>
    </div>
  );
}
