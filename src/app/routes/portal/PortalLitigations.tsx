/**
 * Litigations — firm self-select (Phase 5.x).
 *
 * Any firm member browses every litigation Ada can route and toggles which the
 * firm accepts. Accepting is what makes Ada route matching intakes to the firm
 * (sole-assignment resolution in the router). No admin in the loop; live on
 * toggle.
 *
 * Grouped by what each matter actually is. Until 2026-07-27 this page used
 * a `kind === 'class' ? 'Class action' : 'Mass action'` test for both the
 * badge and the grouping, so all 22 non-class records — DOJ enforcement,
 * consent decrees, pattern-of-practice, regulatory challenges — were
 * labelled and filed as mass actions. That mattered because accepting sets
 * receivesMatches, so a firm could opt into exclusive routing believing it
 * had taken on a mass action.
 *
 * Labels and groups now come from KIND_ORDER and kindLabel, the same list
 * the public directory uses.
 *
 * Was presented as the two buckets the firm thinks in — Class actions and Mass
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
import { KIND_ORDER, kindLabel } from '../../lib/litigationLabels.js';
import { Link } from 'react-router-dom';
import { Scale, MapPin, Check, Plus, ChevronRight, Calendar, Search, X } from 'lucide-react';
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
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span
            className={
              // Class and mass are the two that gather individual
              // claimants. The rest — DOJ actions, consent decrees,
              // regulatory challenges, pattern-of-practice records — are
              // matters we track, and they get the quieter treatment.
              lit.kind === 'class' || lit.kind === 'mass'
                ? 'rounded-full border border-accent-500 px-2 py-0.5 text-xs font-semibold text-accent-500'
                : 'rounded-full bg-surface-100 px-2 py-0.5 text-xs font-semibold text-ink-700'
            }
          >
            {kindLabel(lit.kind)}
          </span>
          {lit.legal_theory && (
            <span className="text-xs font-medium text-ink-500">{lit.legal_theory}</span>
          )}
        </div>
        <Link
          to={`/portal/litigations/${encodeURIComponent(lit.id)}`}
          className="group inline-flex items-center gap-1 text-base font-semibold text-ink-900 hover:text-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span className="underline-offset-2 group-hover:underline">{lit.case_name}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
        </Link>
        {lit.short_description && (
          <p className="mt-1 line-clamp-2 text-sm text-ink-500">{lit.short_description}</p>
        )}
        {lit.eligibility && (
          <p className="mt-2 line-clamp-2 text-sm text-ink-700">
            <span className="font-semibold text-ink-900">Who qualifies: </span>
            {lit.eligibility}
          </p>
        )}
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {statesLabel(lit.affected_states)}
              {lit.defendants.length > 0 && ` · ${lit.defendants.join(', ')}`}
            </span>
          </span>
          {(lit.filing_date || lit.court) && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {[lit.filing_date && `Filed ${lit.filing_date}`, lit.court]
                .filter(Boolean)
                .join(' · ')}
            </span>
          )}
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
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [acceptedOnly, setAcceptedOnly] = useState(false);

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

  const filtersActive = query.trim().length > 0 || typeFilter !== 'all' || acceptedOnly;

  const { groups, total } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (l: PortalLitigation) => {
      if (acceptedOnly && !l.accepted) return false;
      // Match the kind asked for, not "everything that is not class".
      if (typeFilter !== 'all' && l.kind !== typeFilter) return false;
      if (!q) return true;
      const hay = [l.case_name, l.legal_theory ?? '', l.short_description ?? '', l.eligibility ?? '', ...l.defendants]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    };
    const filtered = (litigations ?? []).filter(matches);
    return {
      // One group per kind, in the order the public directory uses. An
      // empty kind renders nothing rather than an empty heading.
      groups: KIND_ORDER.map((kind) => ({
        kind,
        label: kindLabel(kind),
        rows: filtered.filter((l) => l.kind === kind),
      })).filter((g) => g.rows.length > 0),
      total: filtered.length,
    };
  }, [litigations, query, typeFilter, acceptedOnly]);

  const clearFilters = useCallback(() => {
    setQuery('');
    setTypeFilter('all');
    setAcceptedOnly(false);
  }, []);

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

      {litigations !== null && litigations.length > 0 && (
        <div className="mb-5 space-y-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, defendant, or who qualifies"
              aria-label="Search litigations"
              className="w-full min-h-[44px] rounded-md border border-control-border bg-white pl-9 pr-3 text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Filter by type"
              className="inline-flex overflow-hidden rounded-md border border-control-border"
            >
              {([
                ['all', 'All'] as const,
                ...KIND_ORDER.map((k) => [k, kindLabel(k)] as const),
              ]).map(([value, label], i) => {
                const active = typeFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTypeFilter(value)}
                    className={`min-h-[44px] px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      i > 0 ? 'border-l border-control-border' : ''
                    } ${active ? 'bg-accent-500 text-white' : 'bg-white text-ink-900 hover:bg-surface-100'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              aria-pressed={acceptedOnly}
              onClick={() => setAcceptedOnly((v) => !v)}
              className={`inline-flex items-center gap-2 min-h-[44px] px-4 rounded-md border text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                acceptedOnly
                  ? 'border-accent-500 bg-accent-500 text-white'
                  : 'border-control-border bg-white text-ink-900 hover:bg-surface-100'
              }`}
            >
              {acceptedOnly && <Check className="h-4 w-4" aria-hidden="true" strokeWidth={2.5} />}
              Accepted only
            </button>

            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 min-h-[44px] px-3 rounded-md text-sm font-semibold text-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>

          {filtersActive && (
            <p className="text-sm text-ink-500" aria-live="polite">
              Showing {total} of {litigations.length}
            </p>
          )}
        </div>
      )}

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

      {litigations !== null && litigations.length > 0 && total === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-ink-500">No litigations match your search.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-2 inline-flex items-center gap-1 min-h-[44px] px-3 text-sm font-semibold text-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Clear filters
          </button>
        </div>
      )}

      {groups.map((group) => (
        <section key={group.kind} className="mb-8" aria-labelledby={`lw-${group.kind}-h`}>
          <h2 id={`lw-${group.kind}-h`} className="mb-3 text-lg font-bold text-ink-900">
            {group.label}{' '}
            <span className="font-normal text-ink-500">({group.rows.length})</span>
          </h2>
          <ul className="space-y-3">
            {group.rows.map((lit) => (
              <LitigationRow
                key={lit.id}
                lit={lit}
                pending={pendingIds.has(lit.id)}
                onToggle={() => void toggle(lit)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
