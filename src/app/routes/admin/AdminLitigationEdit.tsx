/**
 * AdminLitigationEdit — create and edit a `litigation_listings` row, and
 * configure the routing that decides where its matched claimants go.
 *
 * The routing half matters more than the form half. `LitigationRoutingPanel`
 * has existed as complete, working, unreferenced code — the only UI for
 * `litigation_firm_assignments.receives_matches`, which
 * `resolveEligibleRoutingFirm` requires before it will route a matched
 * claimant to a firm. With no UI, every assignment sat at false and every
 * matched case fell to the sourcing queue. Mounting the panel here is what
 * turns Lane A on.
 *
 * LEAD FIRM SEAM. The panel owns firm assignment + opt-in and saves those
 * itself via PUT /firms. Lead firm is a *litigation* column, so the panel
 * raises it to this component and it persists with the main form's PATCH.
 * The UI says so, because a control that looks saved but isn't is worse
 * than one that says "save the form."
 *
 * NATIONWIDE. Empty affected_states means nationwide (the legacy
 * `__nationwide__` sentinel means the same thing and is normalized away on
 * read). The checkbox below writes the empty-array convention; it never
 * writes the sentinel back.
 *
 * Ref: /plan Gate A Phase 1.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LitigationRoutingPanel from './components/LitigationRoutingPanel.js';
import { KIND_LABEL, STATUS_LABEL, normalizeStates } from './AdminLitigation.js';
import LitigationContactsPanel from './components/LitigationContactsPanel.js';
import {
  BARRIER_CLUSTER_ORDER,
  BARRIER_CLUSTER_LABELS,
  CATEGORIES_BY_CLUSTER,
  barrierCategoryLabel,
  type BarrierCategoryStored,
} from '../../lib/barrierCategories.js';
import type { IntakeStatus } from '../../../engine/clients/types.js';

/**
 * Written as sentences rather than the stored tokens. "mechanism" means
 * nothing to a reader; what it actually encodes is that there is no intake
 * but a live way to raise the problem — a city 311 line, a hospital's own
 * complaint process.
 */
const INTAKE_STATUS_LABEL: Record<IntakeStatus, string> = {
  open: 'Someone can join or be represented now',
  mechanism: 'No intake, but there is a live way to raise it',
  none: 'Nothing a person can do here directly',
};

type Kind = keyof typeof KIND_LABEL;
type Status = keyof typeof STATUS_LABEL;

interface AttorneyOption {
  id: string;
  name: string;
}

interface FormState {
  kind: Kind;
  barrierCategory: BarrierCategoryStored;
  intakeStatus: IntakeStatus;
  caseName: string;
  slug: string;
  status: Status;
  shortDescription: string;
  fullDescription: string;
  eligibility: string;
  defendants: string;
  court: string;
  docketNumber: string;
  affectedStates: string;
  nationwide: boolean;
  filingDate: string;
  leadAttorneyId: string;
}

const EMPTY: FormState = {
  kind: 'class',
  barrierCategory: 'unassigned',
  intakeStatus: 'none',
  caseName: '',
  slug: '',
  status: 'draft',
  shortDescription: '',
  fullDescription: '',
  eligibility: '',
  defendants: '',
  court: '',
  docketNumber: '',
  affectedStates: '',
  nationwide: true,
  filingDate: '',
  leadAttorneyId: '',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminLitigationEdit() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [leadFirmId, setLeadFirmId] = useState<string | null>(null);
  const [attorneys, setAttorneys] = useState<AttorneyOption[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const resp = await fetch('/api/admin/attorneys?page_size=200', {
          credentials: 'include',
        });
        if (!resp.ok) return;
        const data = (await resp.json()) as { attorneys?: AttorneyOption[] };
        setAttorneys(data.attorneys ?? []);
      } catch {
        // Non-fatal — the lead-attorney picker just stays empty.
      }
    })();
  }, []);

  const load = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`/api/admin/litigation/${id}`, {
        credentials: 'include',
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = (await resp.json()) as { litigation?: Record<string, unknown> };
      const lit = data.litigation;
      if (!lit) throw new Error('Not found');
      const states = normalizeStates(lit.affectedStates as string[]);
      setForm({
        kind: (lit.kind as Kind) ?? 'class',
        barrierCategory: (lit.barrierCategory as BarrierCategoryStored) ?? 'unassigned',
        intakeStatus: (lit.intakeStatus as IntakeStatus) ?? 'none',
        caseName: (lit.caseName as string) ?? '',
        slug: (lit.slug as string) ?? '',
        status: (lit.status as Status) ?? 'draft',
        shortDescription: (lit.shortDescription as string) ?? '',
        fullDescription: (lit.fullDescription as string) ?? '',
        eligibility: (lit.eligibility as string) ?? '',
        defendants: ((lit.defendants as string[]) ?? []).join(', '),
        court: (lit.court as string) ?? '',
        docketNumber: (lit.docketNumber as string) ?? '',
        affectedStates: states.join(', '),
        nationwide: states.length === 0,
        filingDate: (lit.filingDate as string) ?? '',
        leadAttorneyId: (lit.leadAttorneyId as string) ?? '',
      });
      setLeadFirmId((lit.leadFirmId as string) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id, isNew]);

  useEffect(() => {
    void load();
  }, [load]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function splitList(value: string): string[] {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  async function save() {
    setError(null);
    setNotice(null);
    if (!form.caseName.trim()) {
      setError('Case name is required.');
      return;
    }
    const slug = form.slug.trim() || slugify(form.caseName);
    if (!slug) {
      setError('Slug is required.');
      return;
    }

    setSaving(true);
    const payload: Record<string, unknown> = {
      kind: form.kind,
      barrier_category: form.barrierCategory,
      intake_status: form.intakeStatus,
      case_name: form.caseName.trim(),
      slug,
      status: form.status,
      short_description: form.shortDescription,
      full_description: form.fullDescription,
      eligibility: form.eligibility,
      defendants: splitList(form.defendants),
      court: form.court,
      docket_number: form.docketNumber,
      // Nationwide is the empty-array convention. Never write the sentinel.
      affected_states: form.nationwide
        ? []
        : splitList(form.affectedStates).map((s) => s.toUpperCase()),
      filing_date: form.filingDate,
      lead_attorney_id: form.leadAttorneyId,
    };
    if (!isNew) payload.lead_firm_id = leadFirmId;

    try {
      const resp = await fetch(
        isNew ? '/api/admin/litigation' : `/api/admin/litigation/${id}`,
        {
          method: isNew ? 'POST' : 'PATCH',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!resp.ok) {
        const body = (await resp.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? `HTTP ${resp.status}`);
      }
      const data = (await resp.json()) as { litigation?: { id?: string } };
      if (isNew && data.litigation?.id) {
        navigate(`/admin/litigation/${data.litigation.id}`, { replace: true });
        return;
      }
      setNotice('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (isNew) return;
    setSaving(true);
    setError(null);
    try {
      const resp = await fetch(`/api/admin/litigation/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      navigate('/admin/litigation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archive failed');
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-ink-500">Loading litigation…</p>;
  }

  const inputClass =
    'w-full min-h-[44px] rounded-md border border-control-border bg-white px-3 text-ink-900';
  const areaClass =
    'w-full rounded-md border border-control-border bg-white px-3 py-2 text-ink-900';
  const labelClass = 'block text-sm font-medium text-ink-700 mb-1';

  return (
    <section className="max-w-4xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">
          {isNew ? 'New litigation' : form.caseName || 'Litigation'}
        </h1>
        <p className="text-sm text-ink-500">
          {isNew
            ? 'Create a class or mass action for Ada to match claimants against.'
            : 'Edit the record, then configure which firms receive its matched claimants.'}
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
      {notice && (
        <p role="status" className="mb-4 text-sm text-ink-700">
          {notice}
        </p>
      )}

      <div className="rounded-lg border border-surface-200 bg-white p-4 mb-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="case-name">Case name</label>
          <input
            id="case-name"
            className={inputClass}
            value={form.caseName}
            onChange={(e) => set('caseName', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="slug">Slug</label>
          <input
            id="slug"
            className={inputClass}
            value={form.slug}
            placeholder={slugify(form.caseName) || 'auto-generated'}
            onChange={(e) => set('slug', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="kind">Kind</label>
          <select
            id="kind"
            className={inputClass}
            value={form.kind}
            onChange={(e) => set('kind', e.target.value as Kind)}
          >
            {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
              <option key={k} value={k}>{KIND_LABEL[k]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="barrier-category">Barrier category</label>
          <select
            id="barrier-category"
            className={inputClass}
            value={form.barrierCategory}
            onChange={(e) => set('barrierCategory', e.target.value as BarrierCategoryStored)}
          >
            {/* Offered deliberately. A wrong category misleads — it puts a
                case on a page it does not belong to and names the wrong
                agency in its fallback route — so this has to be clearable,
                not only changeable. Never offered on the public side. */}
            <option value="unassigned">Not yet categorised</option>
            {BARRIER_CLUSTER_ORDER.map((cluster) => (
              <optgroup key={cluster} label={BARRIER_CLUSTER_LABELS[cluster]}>
                {CATEGORIES_BY_CLUSTER[cluster].map((c) => (
                  <option key={c} value={c}>{barrierCategoryLabel(c)}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="intake-status">Can a person act on this?</label>
          <select
            id="intake-status"
            className={inputClass}
            value={form.intakeStatus}
            onChange={(e) => set('intakeStatus', e.target.value as IntakeStatus)}
          >
            {(Object.keys(INTAKE_STATUS_LABEL) as IntakeStatus[]).map((v) => (
              <option key={v} value={v}>{INTAKE_STATUS_LABEL[v]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="status">Status</label>
          <select
            id="status"
            className={inputClass}
            value={form.status}
            onChange={(e) => set('status', e.target.value as Status)}
          >
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="lead-attorney">Lead attorney</label>
          <select
            id="lead-attorney"
            className={inputClass}
            value={form.leadAttorneyId}
            onChange={(e) => set('leadAttorneyId', e.target.value)}
          >
            <option value="">None</option>
            {attorneys.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="court">Court</label>
          <input
            id="court"
            className={inputClass}
            value={form.court}
            onChange={(e) => set('court', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="docket">Docket number</label>
          <input
            id="docket"
            className={inputClass}
            value={form.docketNumber}
            onChange={(e) => set('docketNumber', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="filing-date">Filing date</label>
          <input
            id="filing-date"
            type="date"
            className={inputClass}
            value={form.filingDate}
            onChange={(e) => set('filingDate', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="defendants">
            Defendants <span className="font-normal text-ink-500">(comma separated)</span>
          </label>
          <input
            id="defendants"
            className={inputClass}
            value={form.defendants}
            onChange={(e) => set('defendants', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <span className={labelClass}>Affected states</span>
          <label className="flex items-center gap-2 min-h-[44px] text-sm text-ink-700">
            <input
              type="checkbox"
              className="w-[22px] h-[22px]"
              checked={form.nationwide}
              onChange={(e) => set('nationwide', e.target.checked)}
            />
            Nationwide
          </label>
          {!form.nationwide && (
            <input
              aria-label="Affected state codes, comma separated"
              className={inputClass}
              value={form.affectedStates}
              placeholder="CA, NY, TX"
              onChange={(e) => set('affectedStates', e.target.value)}
            />
          )}
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="short-desc">Short description</label>
          <textarea
            id="short-desc"
            rows={2}
            className={areaClass}
            value={form.shortDescription}
            onChange={(e) => set('shortDescription', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="full-desc">Full description</label>
          <textarea
            id="full-desc"
            rows={5}
            className={areaClass}
            value={form.fullDescription}
            onChange={(e) => set('fullDescription', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="eligibility">Eligibility</label>
          <textarea
            id="eligibility"
            rows={3}
            className={areaClass}
            value={form.eligibility}
            onChange={(e) => set('eligibility', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="min-h-[44px] px-4 rounded-md bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 disabled:opacity-60"
          >
            {saving ? 'Saving…' : isNew ? 'Create litigation' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/litigation')}
            className="min-h-[44px] px-4 rounded-md border border-control-border text-ink-700 text-sm"
          >
            Cancel
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={() => void archive()}
              disabled={saving}
              className="min-h-[44px] px-4 rounded-md border border-danger-500 text-danger-500 text-sm ml-auto"
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {!isNew && id && (
        <>
          <LitigationRoutingPanel
            litigationId={id}
            leadFirmId={leadFirmId}
            onLeadFirmChange={setLeadFirmId}
          />
          <p className="text-sm text-ink-500 mt-2">
            &ldquo;Save routing&rdquo; stores firm assignment and match opt-in.
            The lead firm is part of the litigation record — use
            &ldquo;Save changes&rdquo; above to persist it.
          </p>
        </>
      )}
      {isNew && (
        <p className="text-sm text-ink-500">
          Firm assignment and match routing become available once the
          litigation is created.
        </p>
      )}

      {/* Only once the litigation exists — a contact needs something to
          belong to, and the panel saves on its own rather than with the
          form above. */}
      {!isNew && id && <LitigationContactsPanel litigationId={id} />}
    </section>
  );
}
