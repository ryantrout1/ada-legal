/**
 * Litigation detail — the decide-to-accept view (Phase 5.x).
 *
 * A full read of one litigation so a lawyer has enough to opt in: overview,
 * who qualifies, what it is NOT, documentation required, evidence guidance,
 * key dates. Copy is the professional variant (see toPortalLitigationDetail).
 * Empty sections are omitted — honest empty, never fabricated.
 *
 * A dedicated page (not a modal) on purpose: native back, voice "go back", no
 * focus-trap — the most robust pattern for Josh (C4, voice / switch / eye-gaze)
 * and the cleanest AAA path. The Accept toggle mirrors the card's, so a lawyer
 * can opt in from here after reading.
 */

import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Gavel, Calendar, Check, Plus } from 'lucide-react';
import {
  fetchPortalLitigation,
  acceptLitigation,
  unacceptLitigation,
  PortalApiError,
  type PortalLitigationDetail,
} from '../../data/portalClient.js';

const NATIONWIDE_SENTINEL = '__nationwide__';

function statesLabel(states: string[]): string {
  if (states.length === 0 || states.includes(NATIONWIDE_SENTINEL)) return 'Nationwide';
  return states.join(', ');
}

function humanizeKey(k: string): string {
  const s = k.replace(/[_-]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Section({ title, body }: { title: string; body: string | null }) {
  if (!body) return null;
  return (
    <section className="mt-6">
      <h2 className="text-lg font-bold text-ink-900">{title}</h2>
      <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink-700">{body}</p>
    </section>
  );
}

export default function PortalLitigationDetail() {
  const { id } = useParams<{ id: string }>();
  const [lit, setLit] = useState<PortalLitigationDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const data = await fetchPortalLitigation(id);
      if (!data) setNotFound(true);
      else setLit(data);
    } catch (err) {
      setError(err instanceof PortalApiError ? err.message : 'Could not load this litigation.');
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(async () => {
    if (!lit) return;
    const next = !lit.accepted;
    setLit({ ...lit, accepted: next });
    setPending(true);
    setError(null);
    try {
      if (next) await acceptLitigation(lit.id);
      else await unacceptLitigation(lit.id);
    } catch (err) {
      setLit((prev) => (prev ? { ...prev, accepted: !next } : prev));
      setError(err instanceof PortalApiError ? err.message : 'Could not update that litigation.');
    } finally {
      setPending(false);
    }
  }, [lit]);

  const backLink = (
    <Link
      to="/portal/litigations"
      className="inline-flex items-center gap-1 min-h-[44px] text-sm font-semibold text-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      All litigations
    </Link>
  );

  if (notFound) {
    return (
      <div className="lawyer-workspace mx-auto max-w-3xl px-4 py-6">
        {backLink}
        <p className="py-12 text-center text-sm text-ink-500">
          That litigation isn’t available.
        </p>
      </div>
    );
  }

  if (!lit) {
    return (
      <div className="lawyer-workspace mx-auto max-w-3xl px-4 py-6">
        {backLink}
        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
          >
            {error}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-ink-500">Loading…</p>
        )}
      </div>
    );
  }

  const kindLabel = lit.kind === 'class' ? 'Class action' : 'Mass action';
  const keyDateEntries = Object.entries(lit.key_dates ?? {});

  return (
    <div className="lawyer-workspace mx-auto max-w-3xl px-4 py-6">
      {backLink}

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      <header className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="inline-block rounded-full bg-surface-100 px-2 py-0.5 text-xs font-semibold text-ink-700">
            {kindLabel}
          </span>
          <h1 className="mt-2 text-2xl font-bold text-ink-900">{lit.case_name}</h1>
          {lit.legal_theory && <p className="mt-1 text-sm text-ink-700">{lit.legal_theory}</p>}
        </div>
        <button
          type="button"
          aria-pressed={lit.accepted}
          disabled={pending}
          onClick={() => void toggle()}
          className={
            lit.accepted
              ? 'shrink-0 inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[128px] px-4 rounded-md text-sm font-semibold border border-accent-500 bg-accent-500 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60'
              : 'shrink-0 inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[128px] px-4 rounded-md text-sm font-semibold border border-control-border bg-white text-ink-900 hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60'
          }
        >
          {lit.accepted ? (
            <Check className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
          ) : (
            <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
          )}
          <span>{lit.accepted ? 'Accepting' : 'Accept'}</span>
          <span className="sr-only">{lit.case_name}</span>
        </button>
      </header>

      {/* Facts strip */}
      <dl className="mt-4 grid grid-cols-1 gap-2 rounded-lg border border-control-border bg-white p-4 text-sm sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
          <dt className="sr-only">Jurisdiction</dt>
          <dd className="text-ink-900">{statesLabel(lit.affected_states)}</dd>
        </div>
        {lit.defendants.length > 0 && (
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
            <dt className="sr-only">Defendant</dt>
            <dd className="text-ink-900">{lit.defendants.join(', ')}</dd>
          </div>
        )}
        {lit.court && (
          <div className="flex items-center gap-2">
            <dt className="text-ink-500">Court</dt>
            <dd className="text-ink-900">
              {lit.court}
              {lit.docket_number ? ` · ${lit.docket_number}` : ''}
            </dd>
          </div>
        )}
        {lit.filing_date && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
            <dt className="sr-only">Filed</dt>
            <dd className="text-ink-900">Filed {lit.filing_date}</dd>
          </div>
        )}
      </dl>

      <Section title="Overview" body={lit.full_description} />
      <Section title="Who qualifies" body={lit.eligibility} />
      <Section title="What this is not" body={lit.what_this_is_not} />
      <Section title="Documentation required" body={lit.documentation_required} />
      <Section title="If the claimant has no documentation" body={lit.no_documentation_path} />
      <Section title="Evidence guidance" body={lit.evidence_guidance} />

      {keyDateEntries.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-ink-900">Key dates</h2>
          <dl className="mt-1.5 space-y-1 text-sm">
            {keyDateEntries.map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <dt className="font-medium text-ink-900">{humanizeKey(k)}:</dt>
                <dd className="text-ink-700">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
