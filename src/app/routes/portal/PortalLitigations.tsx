/**
 * Litigations — firm self-select (Phase 5.x).
 *
 * Any firm member browses every litigation Ada can route and toggles which the
 * firm accepts. Accepting is what makes Ada route matching intakes to the firm
 * (sole-assignment resolution in the router). No admin in the loop; live on
 * toggle.
 *
 * Presented as the two buckets the firm thinks in — Class actions and Mass
 * actions (everything non-class). Deliberately simple: no search, no filter
 * chrome — fewer focus stops for switch / sip-puff scanning.
 *
 * Accessibility (AAA + Josh, C4 complete SCI on voice / head-pointer / eye-gaze
 * / sip-puff switch): one large, clearly-LABELLED toggle button per row — a
 * visible "Accept" / "Accepting" word is directly speakable for Voice Control
 * and a big target for head/eye pointing; the case name rides along as sr-only
 * text so screen readers know which row without overriding the spoken label.
 * State is shown by text + icon, never colour alone. Visible focus throughout.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Scale, MapPin, Check, Plus, ChevronRight } from 'lucide-react';
import {
  fetchPortalLitigations,
  acceptLitigation,
  unacceptLitigation,
  PortalApiError,
  type PortalLitigation,
} from '../../data/portalClient.js';

const NATIONWIDE_SENTINEL = '__nationwide__';

function statesLabel(states: string[]): string {
  if (states.length === 0 || states.includes(NATIONWIDE_SENTINEL)) return 'Nationwide';
  if (states.length <= 4) return states.join(', ');
  return `${states.slice(0, 4).join(', ')} +${states.length - 4} more`;
}

function AcceptButton({
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
      aria-pressed={accepted}
      disabled={pending}
      onClick={onToggle}
      className={
        accepted
          ? 'inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[120px] px-4 rounded-md text-sm font-semibold border border-accent-500 bg-accent-500 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60'
          : 'inline-flex items-center justify-center gap-2 min-h-[44px] min-w-[120px] px-4 rounded-md text-sm font-semibold border border-control-border bg-white text-ink-900 hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60'
      }
    >
      {accepted ? (
        <Check className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
      ) : (
        <Plus className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />
      )}
      <span>{accepted ? 'Accepting' : 'Accept'}</span>
      <span className="sr-only">{caseName}</span>
    </button>
  );
}

function LitigationRow({
  lit,
  pending,
  onToggle,
}: {
  lit: PortalLitigation;
  pending: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-start justify-between gap-4 rounded-lg border border-control-border bg-white p-4">
      <div className="min-w-0">
        <Link
          to={`/portal/litigations/${encodeURIComponent(lit.id)}`}
          className="group inline-flex items-center gap-1 text-base font-semibold text-ink-900 hover:text-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span className="underline-offset-2 group-hover:underline">{lit.case_name}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
        </Link>
        {lit.legal_theory && <p className="text-sm text-ink-700">{lit.legal_theory}</p>}
        {lit.short_description && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-500">{lit.short_description}</p>
        )}
        <p className="mt-2 flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {statesLabel(lit.affected_states)}
            {lit.defendants.length > 0 && ` · ${lit.defendants.join(', ')}`}
          </span>
        </p>
      </div>
      <AcceptButton
        accepted={lit.accepted}
        pending={pending}
        caseName={lit.case_name}
        onToggle={onToggle}
      />
    </li>
  );
}

export default function PortalLitigations() {
  const [litigations, setLitigations] = useState<PortalLitigation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const { classActions, massActions, acceptedCount } = useMemo(() => {
    const all = litigations ?? [];
    return {
      classActions: all.filter((l) => l.kind === 'class'),
      massActions: all.filter((l) => l.kind !== 'class'),
      acceptedCount: all.filter((l) => l.accepted).length,
    };
  }, [litigations]);

  const toggle = useCallback(async (lit: PortalLitigation) => {
    const next = !lit.accepted;
    setLitigations((prev) =>
      (prev ?? []).map((l) => (l.id === lit.id ? { ...l, accepted: next } : l)),
    );
    setPendingIds((prev) => new Set(prev).add(lit.id));
    setError(null);
    try {
      if (next) await acceptLitigation(lit.id);
      else await unacceptLitigation(lit.id);
    } catch (err) {
      setLitigations((prev) =>
        (prev ?? []).map((l) => (l.id === lit.id ? { ...l, accepted: !next } : l)),
      );
      setError(err instanceof PortalApiError ? err.message : 'Could not update that litigation.');
    } finally {
      setPendingIds((prev) => {
        const n = new Set(prev);
        n.delete(lit.id);
        return n;
      });
    }
  }, []);

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

      {litigations === null && !error && (
        <p className="py-12 text-center text-sm text-ink-500">Loading litigations…</p>
      )}

      {litigations !== null && litigations.length === 0 && (
        <p className="py-12 text-center text-sm text-ink-500">
          No litigations are available right now.
        </p>
      )}

      {classActions.length > 0 && (
        <section className="mb-8" aria-labelledby="lw-class-h">
          <h2 id="lw-class-h" className="mb-3 text-lg font-bold text-ink-900">
            Class actions{' '}
            <span className="font-normal text-ink-500">({classActions.length})</span>
          </h2>
          <ul className="space-y-3">
            {classActions.map((lit) => (
              <LitigationRow
                key={lit.id}
                lit={lit}
                pending={pendingIds.has(lit.id)}
                onToggle={() => void toggle(lit)}
              />
            ))}
          </ul>
        </section>
      )}

      {massActions.length > 0 && (
        <section aria-labelledby="lw-mass-h">
          <h2 id="lw-mass-h" className="mb-3 text-lg font-bold text-ink-900">
            Mass actions{' '}
            <span className="font-normal text-ink-500">({massActions.length})</span>
          </h2>
          <ul className="space-y-3">
            {massActions.map((lit) => (
              <LitigationRow
                key={lit.id}
                lit={lit}
                pending={pendingIds.has(lit.id)}
                onToggle={() => void toggle(lit)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
