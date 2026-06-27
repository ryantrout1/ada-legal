/**
 * Litigations — firm self-select (Phase 5.x).
 *
 * Any firm member browses every active class/mass-action litigation the
 * platform tracks and toggles which ones the firm accepts. Accepting a
 * litigation is what makes Ada route matching intakes to the firm (sole-
 * assignment resolution in the router). No admin in the loop; live on toggle.
 *
 * Portal-scoped (.lawyer-workspace), AAA: 44px targets, role="switch" toggles,
 * visible focus, role="alert" errors, color never the sole signal.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Scale, Search, MapPin, Check } from 'lucide-react';
import {
  fetchPortalLitigations,
  acceptLitigation,
  unacceptLitigation,
  PortalApiError,
  type PortalLitigation,
} from '../../data/portalClient.js';

const KIND_LABEL: Record<string, string> = {
  class: 'Class action',
  enforcement_action: 'Enforcement action',
  consent_decree: 'Consent decree',
  pattern_of_practice: 'Pattern or practice',
  regulatory_challenge: 'Regulatory challenge',
};

function kindLabel(kind: string): string {
  return KIND_LABEL[kind] ?? kind.replace(/_/g, ' ');
}

const NATIONWIDE_SENTINEL = '__nationwide__';

function statesLabel(states: string[]): string {
  if (states.length === 0 || states.includes(NATIONWIDE_SENTINEL)) return 'Nationwide';
  if (states.length <= 4) return states.join(', ');
  return `${states.slice(0, 4).join(', ')} +${states.length - 4} more`;
}

function AcceptToggle({
  accepted,
  pending,
  caseName,
  onToggle,
}: {
  accepted: boolean;
  pending: boolean;
  caseName: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={accepted}
      aria-label={`Accept ${caseName}`}
      disabled={pending}
      onClick={onToggle}
      className="shrink-0 grid place-items-center h-11 w-12 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
    >
      <span
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${accepted ? 'bg-accent-500' : 'bg-surface-300'}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${accepted ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </span>
    </button>
  );
}

export default function PortalLitigations() {
  const [litigations, setLitigations] = useState<PortalLitigation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [acceptedOnly, setAcceptedOnly] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setError(null);
    try {
      setLitigations(await fetchPortalLitigations());
    } catch (err) {
      setError(err instanceof PortalApiError ? err.message : 'Could not load litigations.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const acceptedCount = useMemo(
    () => (litigations ?? []).filter((l) => l.accepted).length,
    [litigations],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (litigations ?? []).filter((l) => {
      if (acceptedOnly && !l.accepted) return false;
      if (!q) return true;
      const haystack = [l.case_name, l.legal_theory ?? '', l.short_description ?? '', ...l.defendants]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [litigations, query, acceptedOnly]);

  const toggle = useCallback(
    async (lit: PortalLitigation) => {
      const next = !lit.accepted;
      // Optimistic flip.
      setLitigations((prev) =>
        (prev ?? []).map((l) => (l.id === lit.id ? { ...l, accepted: next } : l)),
      );
      setPendingIds((prev) => new Set(prev).add(lit.id));
      setError(null);
      try {
        if (next) await acceptLitigation(lit.id);
        else await unacceptLitigation(lit.id);
      } catch (err) {
        // Roll back on failure.
        setLitigations((prev) =>
          (prev ?? []).map((l) => (l.id === lit.id ? { ...l, accepted: !next } : l)),
        );
        setError(
          err instanceof PortalApiError ? err.message : 'Could not update that litigation.',
        );
      } finally {
        setPendingIds((prev) => {
          const n = new Set(prev);
          n.delete(lit.id);
          return n;
        });
      }
    },
    [],
  );

  return (
    <div className="lawyer-workspace mx-auto max-w-4xl px-4 py-6">
      <header className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-ink-900">
          <Scale className="lw-icon" aria-hidden="true" strokeWidth={2} />
          Litigations we accept
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Turn on the class and mass actions your firm handles. When Ada matches a
          claimant to one you accept, that intake routes straight to your firm.
        </p>
        <p className="mt-1 text-sm font-medium text-ink-900" aria-live="polite">
          {acceptedCount} accepted
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
            aria-hidden="true"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, theory, or defendant"
            aria-label="Search litigations"
            className="w-full min-h-[44px] rounded-md border border-control-border bg-white pl-9 pr-3 text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={acceptedOnly}
          onClick={() => setAcceptedOnly((v) => !v)}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-md border border-control-border bg-white text-sm font-semibold text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {acceptedOnly && <Check className="h-4 w-4" aria-hidden="true" />}
          Accepted only
        </button>
      </div>

      {litigations === null && !error && (
        <p className="py-12 text-center text-sm text-ink-500">Loading litigations…</p>
      )}

      {litigations !== null && visible.length === 0 && (
        <p className="py-12 text-center text-sm text-ink-500">
          {acceptedOnly
            ? 'Your firm hasn’t accepted any litigations yet.'
            : query.trim()
              ? 'No litigations match your search.'
              : 'No active litigations are available right now.'}
        </p>
      )}

      <ul className="space-y-3">
        {visible.map((lit) => (
          <li
            key={lit.id}
            className="flex items-start justify-between gap-4 rounded-lg border border-control-border bg-white p-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-semibold text-ink-700">
                  {kindLabel(lit.kind)}
                </span>
                {lit.accepted && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-500">
                    <Check className="h-3 w-3" aria-hidden="true" />
                    Accepting
                  </span>
                )}
              </div>
              <h2 className="mt-1.5 truncate text-base font-semibold text-ink-900">
                {lit.case_name}
              </h2>
              {lit.legal_theory && (
                <p className="text-sm text-ink-700">{lit.legal_theory}</p>
              )}
              {lit.short_description && (
                <p className="mt-1 line-clamp-2 text-sm text-ink-500">{lit.short_description}</p>
              )}
              <p className="mt-2 flex items-center gap-1 text-xs text-ink-500">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {statesLabel(lit.affected_states)}
                {lit.defendants.length > 0 && (
                  <span className="ml-2 truncate">· {lit.defendants.join(', ')}</span>
                )}
              </p>
            </div>
            <AcceptToggle
              accepted={lit.accepted}
              pending={pendingIds.has(lit.id)}
              caseName={lit.case_name}
              onToggle={() => void toggle(lit)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
