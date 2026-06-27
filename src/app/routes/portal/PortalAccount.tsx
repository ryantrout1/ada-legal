/**
 * Account — the attorney's profile + firm settings, designed as a guided
 * "set up your practice" experience rather than a flat form.
 *
 * - Profile header (avatar + name + live status)
 * - Go-live progress card: progress bar + interactive checklist that jumps
 *   to the field that still needs filling
 * - Fields grouped by intent (You / Public profile / Capacity / Firm), with
 *   "Required to go live" chips on the gating fields
 * - One sticky save bar with unsaved-change tracking (replaces per-section saves)
 *
 * Portal-scoped (.lawyer-workspace), AAA: 44px targets, visible focus,
 * role=alert/status, labelled controls, role=switch toggles, progressbar.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  User,
  IdCard,
  Megaphone,
  SlidersHorizontal,
  Building2,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react';
import {
  fetchAccount,
  saveAccount,
  PortalApiError,
  type PortalAccount,
  type PortalAccountAttorney,
  type PortalAccountFirm,
  type AccountPatch,
} from '../../data/portalClient.js';

type AttorneyForm = {
  name: string;
  location_city: string;
  location_state: string;
  bar_number: string;
  email: string;
  phone: string;
  website_url: string;
  bio: string;
  photo_url: string;
  practice_areas: string;
  additional_states: string;
  specialty_tags: string;
  accepting_referrals: boolean;
  routing_paused: boolean;
  max_active_cases: string;
};
type FirmForm = { name: string; primary_contact: string; email: string; phone: string };

const INPUT =
  'w-full min-h-[44px] rounded-lg border border-control-border bg-white px-3.5 text-ink-900 placeholder:text-ink-500/60 transition-colors hover:border-ink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500';
const TEXTAREA =
  'w-full rounded-lg border border-control-border bg-white px-3.5 py-2.5 text-ink-900 placeholder:text-ink-500/60 transition-colors hover:border-ink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-500';

const STATUS: Record<string, { label: string; cls: string }> = {
  approved: { label: 'Active', cls: 'border-success-500 bg-success-50 text-success-500' },
  pending: { label: 'Pending review', cls: 'border-control-border bg-surface-100 text-ink-700' },
  rejected: { label: 'Not approved', cls: 'border-danger-500 bg-danger-50 text-danger-500' },
  archived: { label: 'Archived', cls: 'border-control-border bg-surface-100 text-ink-500' },
};

function attorneyToForm(a: PortalAccountAttorney): AttorneyForm {
  return {
    name: a.name ?? '',
    location_city: a.location_city ?? '',
    location_state: a.location_state ?? '',
    bar_number: a.bar_number ?? '',
    email: a.email ?? '',
    phone: a.phone ?? '',
    website_url: a.website_url ?? '',
    bio: a.bio ?? '',
    photo_url: a.photo_url ?? '',
    practice_areas: (a.practice_areas ?? []).join(', '),
    additional_states: (a.additional_states ?? []).join(', '),
    specialty_tags: (a.specialty_tags ?? []).join(', '),
    accepting_referrals: a.accepting_referrals,
    routing_paused: a.routing_paused,
    max_active_cases: a.max_active_cases == null ? '' : String(a.max_active_cases),
  };
}
function firmToForm(f: PortalAccountFirm | null): FirmForm {
  return { name: f?.name ?? '', primary_contact: f?.primary_contact ?? '', email: f?.email ?? '', phone: f?.phone ?? '' };
}
function splitList(s: string): string[] {
  return s.split(',').map((x) => x.trim()).filter(Boolean);
}
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function focusField(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => el.focus({ preventScroll: true }), 250);
}

export default function PortalAccount() {
  const [account, setAccount] = useState<PortalAccount | null>(null);
  const [attorney, setAttorney] = useState<AttorneyForm | null>(null);
  const [firm, setFirm] = useState<FirmForm | null>(null);
  const [initial, setInitial] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const sync = useCallback((acc: PortalAccount) => {
    const a = attorneyToForm(acc.attorney);
    const f = firmToForm(acc.firm);
    setAccount(acc);
    setAttorney(a);
    setFirm(f);
    setInitial(JSON.stringify({ a, f }));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      sync(await fetchAccount());
    } catch (err) {
      setLoadError(err instanceof PortalApiError ? err.message : 'Could not load your account.');
    } finally {
      setLoading(false);
    }
  }, [sync]);

  useEffect(() => {
    void load();
  }, [load]);

  const isOwner = account?.attorney.firm_role === 'owner';
  const dirty = useMemo(
    () => !!attorney && JSON.stringify({ a: attorney, f: firm }) !== initial,
    [attorney, firm, initial],
  );

  const saveAll = useCallback(async () => {
    if (!attorney) return;
    setSaving(true);
    setSaveError(null);
    setJustSaved(false);
    const patch: AccountPatch = {
      attorney: {
        name: attorney.name,
        location_city: attorney.location_city,
        location_state: attorney.location_state,
        bar_number: attorney.bar_number,
        email: attorney.email,
        phone: attorney.phone,
        website_url: attorney.website_url,
        bio: attorney.bio,
        photo_url: attorney.photo_url,
        practice_areas: splitList(attorney.practice_areas),
        additional_states: splitList(attorney.additional_states),
        specialty_tags: splitList(attorney.specialty_tags),
        accepting_referrals: attorney.accepting_referrals,
        routing_paused: attorney.routing_paused,
        max_active_cases: attorney.max_active_cases.trim() === '' ? null : Number(attorney.max_active_cases),
      },
      ...(isOwner && firm
        ? { firm: { name: firm.name, primary_contact: firm.primary_contact, email: firm.email, phone: firm.phone } }
        : {}),
    };
    try {
      sync(await saveAccount(patch));
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof PortalApiError ? err.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }, [attorney, firm, isOwner, sync]);

  if (loading) return <p className="text-sm text-ink-500">Loading your account…</p>;

  if (loadError || !attorney || !account) {
    return (
      <div role="alert" className="rounded-lg border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500">
        {loadError ?? 'Could not load your account.'}{' '}
        <button type="button" onClick={() => void load()} className="underline font-medium">
          Retry
        </button>
      </div>
    );
  }

  const set = (patch: Partial<AttorneyForm>) => setAttorney((p) => (p ? { ...p, ...patch } : p));
  const setF = (patch: Partial<FirmForm>) => setFirm((p) => (p ? { ...p, ...patch } : p));
  const status = STATUS[account.attorney.status] ?? STATUS.pending;

  return (
    <div className="max-w-3xl pb-28">
      {/* Profile header */}
      <header className="mb-6 flex items-center gap-4">
        {attorney.photo_url.trim() ? (
          <img src={attorney.photo_url} alt="" className="h-16 w-16 rounded-full object-cover border border-surface-200" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-accent-50 text-accent-500 grid place-items-center font-display text-2xl" aria-hidden="true">
            {initials(attorney.name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-ink-500 mb-0.5">Your account</p>
          <h1 className="font-display text-2xl sm:text-3xl text-ink-900 truncate">{attorney.name || 'Your profile'}</h1>
          {account.firm?.name && <p className="text-sm text-ink-500 truncate">{account.firm.name}</p>}
        </div>
        <span className={`ml-auto shrink-0 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${status.cls}`}>
          {status.label}
        </span>
      </header>

      <GoLiveCard account={account} isOwner={!!isOwner} />

      {/* You */}
      <Card icon={<User size={18} aria-hidden="true" />} title="You" subtitle="Your name and how we reach you.">
        <Grid>
          <Field label="Name" htmlFor="a-name">
            <input id="a-name" className={INPUT} value={attorney.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Email" htmlFor="a-email" required>
            <input id="a-email" type="email" className={INPUT} value={attorney.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Phone" htmlFor="a-phone">
            <input id="a-phone" className={INPUT} value={attorney.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="City" htmlFor="a-city">
            <input id="a-city" className={INPUT} value={attorney.location_city} onChange={(e) => set({ location_city: e.target.value })} />
          </Field>
        </Grid>
      </Card>

      {/* Credentials */}
      <Card icon={<IdCard size={18} aria-hidden="true" />} title="Credentials" subtitle="The bar and jurisdictions you can take cases in.">
        <Grid>
          <Field label="Bar number" htmlFor="a-bar" required>
            <input id="a-bar" className={INPUT} value={attorney.bar_number} onChange={(e) => set({ bar_number: e.target.value })} />
          </Field>
          <Field label="Home state" htmlFor="a-state" required hint="Two-letter code, e.g. AZ.">
            <input id="a-state" className={INPUT} value={attorney.location_state} onChange={(e) => set({ location_state: e.target.value })} />
          </Field>
        </Grid>
        <Field label="Other licensed states" htmlFor="a-states" hint="Comma-separated, e.g. NV, CA.">
          <input id="a-states" className={INPUT} value={attorney.additional_states} onChange={(e) => set({ additional_states: e.target.value })} />
        </Field>
      </Card>

      {/* Public profile */}
      <Card icon={<Megaphone size={18} aria-hidden="true" />} title="Public profile" subtitle="What a claimant sees when you’re matched to their case.">
        <Grid>
          <Field label="Photo URL" htmlFor="a-photo" hint="Link to a headshot (upload coming later).">
            <input id="a-photo" className={INPUT} placeholder="https://" value={attorney.photo_url} onChange={(e) => set({ photo_url: e.target.value })} />
          </Field>
          <Field label="Website" htmlFor="a-web">
            <input id="a-web" className={INPUT} placeholder="https://" value={attorney.website_url} onChange={(e) => set({ website_url: e.target.value })} />
          </Field>
          <Field label="Practice areas" htmlFor="a-areas" hint="Comma-separated, e.g. ada, employment.">
            <input id="a-areas" className={INPUT} value={attorney.practice_areas} onChange={(e) => set({ practice_areas: e.target.value })} />
          </Field>
          <Field label="Specialty tags" htmlFor="a-tags" hint="Comma-separated.">
            <input id="a-tags" className={INPUT} value={attorney.specialty_tags} onChange={(e) => set({ specialty_tags: e.target.value })} />
          </Field>
        </Grid>
        <Field label="Bio" htmlFor="a-bio" hint="A short intro claimants will read.">
          <textarea id="a-bio" rows={4} className={TEXTAREA} value={attorney.bio} onChange={(e) => set({ bio: e.target.value })} />
        </Field>
      </Card>

      {/* Capacity */}
      <Card icon={<SlidersHorizontal size={18} aria-hidden="true" />} title="Capacity & matching" subtitle="Control how many new cases route to you.">
        <div className="divide-y divide-surface-200">
          <Toggle
            label="Accepting new referrals"
            description="Turn off to stop new matches entirely."
            checked={attorney.accepting_referrals}
            onChange={(v) => set({ accepting_referrals: v })}
          />
          <Toggle
            label="Pause routing"
            description="I’m full right now — hold new matches without leaving."
            checked={attorney.routing_paused}
            onChange={(v) => set({ routing_paused: v })}
          />
        </div>
        <Field label="Max active cases" htmlFor="a-max" hint="Leave blank for no limit.">
          <input id="a-max" type="number" min={0} className={`${INPUT} sm:max-w-[12rem]`} value={attorney.max_active_cases} onChange={(e) => set({ max_active_cases: e.target.value })} />
        </Field>
      </Card>

      {/* Firm (owners only) */}
      {isOwner && firm && (
        <Card icon={<Building2 size={18} aria-hidden="true" />} title="Firm" subtitle="Your firm’s public details.">
          <Grid>
            <Field label="Firm name" htmlFor="f-name" required>
              <input id="f-name" className={INPUT} value={firm.name} onChange={(e) => setF({ name: e.target.value })} />
            </Field>
            <Field label="Primary contact" htmlFor="f-contact">
              <input id="f-contact" className={INPUT} value={firm.primary_contact} onChange={(e) => setF({ primary_contact: e.target.value })} />
            </Field>
            <Field label="Firm email" htmlFor="f-email" required>
              <input id="f-email" type="email" className={INPUT} value={firm.email} onChange={(e) => setF({ email: e.target.value })} />
            </Field>
            <Field label="Firm phone" htmlFor="f-phone">
              <input id="f-phone" className={INPUT} value={firm.phone} onChange={(e) => setF({ phone: e.target.value })} />
            </Field>
          </Grid>
        </Card>
      )}

      {/* Sticky save bar */}
      {(dirty || justSaved || saveError) && (
        <div className="sticky bottom-0 z-10 -mx-4 mt-2 border-t border-surface-200 bg-white/95 backdrop-blur px-4 py-3">
          <div className="max-w-3xl flex items-center gap-3">
            {saveError ? (
              <p role="alert" className="text-sm text-danger-500 font-medium">{saveError}</p>
            ) : justSaved ? (
              <p role="status" className="flex items-center gap-1.5 text-sm text-success-500 font-medium">
                <CheckCircle2 size={16} aria-hidden="true" /> Saved
              </p>
            ) : (
              <p className="text-sm text-ink-700">You have unsaved changes.</p>
            )}
            <div className="ml-auto flex items-center gap-2">
              {dirty && (
                <button
                  type="button"
                  onClick={() => account && sync(account)}
                  disabled={saving}
                  className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg text-sm font-semibold border border-control-border bg-white text-ink-900 hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
                >
                  Discard
                </button>
              )}
              <button
                type="button"
                onClick={() => void saveAll()}
                disabled={saving || !dirty}
                className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg text-sm font-semibold border border-accent-500 bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Go-live progress ─────────────────────────────────────────────────────── */

function GoLiveCard({ account, isOwner }: { account: PortalAccount; isOwner: boolean }) {
  const missing = new Set(account.readiness.missing.map((m) => m.key));
  const items: { key: string; label: string; field: string }[] = [
    { key: 'name', label: 'Add your name', field: 'a-name' },
    { key: 'email', label: 'Add your email', field: 'a-email' },
    { key: 'bar_number', label: 'Add your bar number', field: 'a-bar' },
    { key: 'licensed_state', label: 'Add at least one licensed state', field: 'a-state' },
    ...(isOwner && account.firm
      ? [
          { key: 'firm_name', label: 'Add your firm name', field: 'f-name' },
          { key: 'firm_email', label: 'Add your firm email', field: 'f-email' },
        ]
      : []),
  ];
  const done = items.filter((i) => !missing.has(i.key)).length;
  const total = items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const ready = account.readiness.ready;

  if (ready) {
    return (
      <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-success-500 bg-success-50 p-5">
        <CheckCircle2 size={22} aria-hidden="true" className="shrink-0 text-success-500 mt-0.5" />
        <div>
          <p className="font-display text-lg text-ink-900">You’re ready to go live</p>
          <p className="text-sm text-ink-700">Your profile has everything we need to match you to cases.</p>
        </div>
      </div>
    );
  }

  return (
    <section aria-labelledby="golive-h" className="mb-6 rounded-xl border border-accent-500/30 bg-accent-50 p-5">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h2 id="golive-h" className="font-display text-lg text-ink-900">Finish setting up to go live</h2>
        <span className="text-sm font-semibold text-ink-700 tabular-nums">{done} of {total}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Profile completeness"
        className="h-2 rounded-full bg-white/70 overflow-hidden mb-4"
      >
        <div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="flex flex-col gap-1">
        {items.map((item) => {
          const complete = !missing.has(item.key);
          return (
            <li key={item.key}>
              {complete ? (
                <span className="flex items-center gap-2.5 min-h-[40px] px-2 text-sm text-ink-500">
                  <CheckCircle2 size={18} aria-hidden="true" className="text-success-500 shrink-0" />
                  <span className="line-through">{item.label.replace(/^Add /, '')}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => focusField(item.field)}
                  className="group w-full flex items-center gap-2.5 min-h-[44px] px-2 rounded-lg text-left text-sm text-ink-900 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <Circle size={18} aria-hidden="true" className="text-ink-500 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  <ArrowRight size={15} aria-hidden="true" className="ml-auto text-ink-500 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ── Building blocks ──────────────────────────────────────────────────────── */

function Card({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-surface-200 bg-white p-5 sm:p-6 mb-4 shadow-sm">
      <header className="mb-4">
        <h2 className="flex items-center gap-2 font-display text-lg text-ink-900">
          <span className="grid place-items-center h-7 w-7 rounded-lg bg-surface-100 text-ink-700">{icon}</span>
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700">
          {label}
        </label>
        {required && (
          <span className="inline-flex items-center rounded-full border border-control-border bg-surface-100 px-1.5 py-0.5 text-[11px] font-semibold text-ink-700">
            Required to go live
          </span>
        )}
      </div>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-900">{label}</span>
        {description && <span className="block text-xs text-ink-500">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="shrink-0 grid place-items-center h-11 w-12 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <span
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? 'bg-accent-500' : 'bg-surface-300'}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </span>
      </button>
    </div>
  );
}
