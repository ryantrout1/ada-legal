/**
 * Account — the attorney's self-serve profile + firm settings (/plan Phase 1).
 *
 * Three sections: Your profile, Capacity & matching, Firm. Every field the
 * attorney fills in here is what we display elsewhere (queue, future
 * claimant-facing match). Sensitive fields (verification status, billing) are
 * shown read-only — they're the platform's call, enforced server-side.
 *
 * Portal-scoped (.lawyer-workspace), AAA: 44px targets, visible focus,
 * role="alert"/role="status" for save feedback, labelled controls.
 */

import { useCallback, useEffect, useState } from 'react';
import { User, SlidersHorizontal, Building2 } from 'lucide-react';
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

type Section = 'profile' | 'capacity' | 'firm';

const INPUT =
  'w-full min-h-[44px] rounded-md border border-control-border bg-white px-3 text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const TEXTAREA =
  'w-full rounded-md border border-control-border bg-white px-3 py-2 text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const BTN =
  'inline-flex items-center justify-center min-h-[44px] px-4 rounded-md text-sm font-semibold border border-accent-500 bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60';

function attorneyToForm(a: PortalAccountAttorney): AttorneyForm {
  return {
    name: a.name ?? '',
    location_city: a.location_city ?? '',
    location_state: a.location_state ?? '',
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
  return {
    name: f?.name ?? '',
    primary_contact: f?.primary_contact ?? '',
    email: f?.email ?? '',
    phone: f?.phone ?? '',
  };
}

function splitList(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function PortalAccount() {
  const [account, setAccount] = useState<PortalAccount | null>(null);
  const [attorney, setAttorney] = useState<AttorneyForm | null>(null);
  const [firm, setFirm] = useState<FirmForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState<Section | null>(null);
  const [saved, setSaved] = useState<Section | null>(null);
  const [saveError, setSaveError] = useState<{ section: Section; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const acc = await fetchAccount();
      setAccount(acc);
      setAttorney(attorneyToForm(acc.attorney));
      setFirm(firmToForm(acc.firm));
    } catch (err) {
      setLoadError(err instanceof PortalApiError ? err.message : 'Could not load your account.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(
    async (section: Section, patch: AccountPatch) => {
      setSaving(section);
      setSaved(null);
      setSaveError(null);
      try {
        const acc = await saveAccount(patch);
        setAccount(acc);
        setAttorney(attorneyToForm(acc.attorney));
        setFirm(firmToForm(acc.firm));
        setSaved(section);
      } catch (err) {
        setSaveError({
          section,
          message: err instanceof PortalApiError ? err.message : 'Could not save. Try again.',
        });
      } finally {
        setSaving(null);
      }
    },
    [],
  );

  if (loading) {
    return <p className="text-sm text-ink-500">Loading your account…</p>;
  }

  if (loadError || !attorney) {
    return (
      <div role="alert" className="rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500">
        {loadError ?? 'Could not load your account.'}{' '}
        <button type="button" onClick={() => void load()} className="underline font-medium">
          Retry
        </button>
      </div>
    );
  }

  const set = (patch: Partial<AttorneyForm>) => setAttorney((p) => (p ? { ...p, ...patch } : p));
  const setF = (patch: Partial<FirmForm>) => setFirm((p) => (p ? { ...p, ...patch } : p));

  const saveProfile = () =>
    void save('profile', {
      attorney: {
        name: attorney.name,
        location_city: attorney.location_city,
        location_state: attorney.location_state,
        email: attorney.email,
        phone: attorney.phone,
        website_url: attorney.website_url,
        bio: attorney.bio,
        photo_url: attorney.photo_url,
        practice_areas: splitList(attorney.practice_areas),
        additional_states: splitList(attorney.additional_states),
        specialty_tags: splitList(attorney.specialty_tags),
      },
    });

  const saveCapacity = () =>
    void save('capacity', {
      attorney: {
        accepting_referrals: attorney.accepting_referrals,
        routing_paused: attorney.routing_paused,
        max_active_cases: attorney.max_active_cases.trim() === '' ? null : Number(attorney.max_active_cases),
      },
    });

  const saveFirm = () =>
    firm &&
    void save('firm', {
      firm: {
        name: firm.name,
        primary_contact: firm.primary_contact,
        email: firm.email,
        phone: firm.phone,
      },
    });

  const statusLabel: Record<string, string> = {
    approved: 'Active',
    pending: 'Pending review',
    rejected: 'Not approved',
    archived: 'Archived',
  };
  const status = account?.attorney.status ?? 'pending';

  return (
    <div className="max-w-3xl">
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Account</h1>
        <p className="text-sm text-ink-500">
          Your profile and firm details. Everything you add here is what we show when you&rsquo;re matched.
        </p>
      </header>

      {/* Your profile */}
      <Section
        icon={<User size={18} aria-hidden="true" />}
        title="Your profile"
        rightSlot={
          <span className="lw-pill purple" title="Set by ADA Legal Link">
            {statusLabel[status] ?? status}
          </span>
        }
        saving={saving === 'profile'}
        saved={saved === 'profile'}
        error={saveError?.section === 'profile' ? saveError.message : null}
        onSave={saveProfile}
        saveLabel="Save profile"
      >
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" htmlFor="a-name">
            <input id="a-name" className={INPUT} value={attorney.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Photo URL" htmlFor="a-photo" hint="Paste a link to a headshot (upload coming later).">
            <input id="a-photo" className={INPUT} placeholder="https://" value={attorney.photo_url} onChange={(e) => set({ photo_url: e.target.value })} />
          </Field>
          <Field label="City" htmlFor="a-city">
            <input id="a-city" className={INPUT} value={attorney.location_city} onChange={(e) => set({ location_city: e.target.value })} />
          </Field>
          <Field label="Home state" htmlFor="a-state" hint="Two-letter code, e.g. AZ.">
            <input id="a-state" className={INPUT} value={attorney.location_state} onChange={(e) => set({ location_state: e.target.value })} />
          </Field>
          <Field label="Email" htmlFor="a-email">
            <input id="a-email" type="email" className={INPUT} value={attorney.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="Phone" htmlFor="a-phone">
            <input id="a-phone" className={INPUT} value={attorney.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
        </div>
        <Field label="Website" htmlFor="a-web">
          <input id="a-web" className={INPUT} placeholder="https://" value={attorney.website_url} onChange={(e) => set({ website_url: e.target.value })} />
        </Field>
        <Field label="Other licensed states" htmlFor="a-states" hint="Comma-separated, e.g. NV, CA.">
          <input id="a-states" className={INPUT} value={attorney.additional_states} onChange={(e) => set({ additional_states: e.target.value })} />
        </Field>
        <Field label="Practice areas" htmlFor="a-areas" hint="Comma-separated, e.g. ada, employment.">
          <input id="a-areas" className={INPUT} value={attorney.practice_areas} onChange={(e) => set({ practice_areas: e.target.value })} />
        </Field>
        <Field label="Specialty tags" htmlFor="a-tags" hint="Comma-separated.">
          <input id="a-tags" className={INPUT} value={attorney.specialty_tags} onChange={(e) => set({ specialty_tags: e.target.value })} />
        </Field>
        <Field label="Bio" htmlFor="a-bio">
          <textarea id="a-bio" rows={4} className={TEXTAREA} value={attorney.bio} onChange={(e) => set({ bio: e.target.value })} />
        </Field>
      </Section>

      {/* Capacity & matching */}
      <Section
        icon={<SlidersHorizontal size={18} aria-hidden="true" />}
        title="Capacity & matching"
        saving={saving === 'capacity'}
        saved={saved === 'capacity'}
        error={saveError?.section === 'capacity' ? saveError.message : null}
        onSave={saveCapacity}
        saveLabel="Save capacity"
      >
        <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            className="h-5 w-5 accent-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            checked={attorney.accepting_referrals}
            onChange={(e) => set({ accepting_referrals: e.target.checked })}
          />
          <span className="text-sm text-ink-900">Accepting new referrals</span>
        </label>
        <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            className="h-5 w-5 accent-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            checked={attorney.routing_paused}
            onChange={(e) => set({ routing_paused: e.target.checked })}
          />
          <span className="text-sm text-ink-900">Pause routing &mdash; I&rsquo;m full right now</span>
        </label>
        <Field label="Max active cases" htmlFor="a-max" hint="Leave blank for no limit.">
          <input
            id="a-max"
            type="number"
            min={0}
            className={`${INPUT} sm:max-w-[12rem]`}
            value={attorney.max_active_cases}
            onChange={(e) => set({ max_active_cases: e.target.value })}
          />
        </Field>
      </Section>

      {/* Firm */}
      <Section
        icon={<Building2 size={18} aria-hidden="true" />}
        title="Firm"
        saving={saving === 'firm'}
        saved={saved === 'firm'}
        error={saveError?.section === 'firm' ? saveError.message : null}
        onSave={saveFirm}
        saveLabel="Save firm"
      >
        {firm ? (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Firm name" htmlFor="f-name">
              <input id="f-name" className={INPUT} value={firm.name} onChange={(e) => setF({ name: e.target.value })} />
            </Field>
            <Field label="Primary contact" htmlFor="f-contact">
              <input id="f-contact" className={INPUT} value={firm.primary_contact} onChange={(e) => setF({ primary_contact: e.target.value })} />
            </Field>
            <Field label="Firm email" htmlFor="f-email">
              <input id="f-email" type="email" className={INPUT} value={firm.email} onChange={(e) => setF({ email: e.target.value })} />
            </Field>
            <Field label="Firm phone" htmlFor="f-phone">
              <input id="f-phone" className={INPUT} value={firm.phone} onChange={(e) => setF({ phone: e.target.value })} />
            </Field>
          </div>
        ) : (
          <p className="text-sm text-ink-500">No firm is linked to your account yet.</p>
        )}
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  rightSlot,
  children,
  saving,
  saved,
  error,
  onSave,
  saveLabel,
}: {
  icon: React.ReactNode;
  title: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <section className="rounded-lg border border-control-border bg-white p-5 sm:p-6 mb-5">
      <header className="flex items-center justify-between gap-3 mb-4">
        <h2 className="flex items-center gap-2 font-display text-lg text-ink-900">
          <span className="text-ink-500">{icon}</span>
          {title}
        </h2>
        {rightSlot}
      </header>

      <div className="flex flex-col gap-4">{children}</div>

      {error && (
        <div role="alert" className="mt-4 rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-500">
          {error}
        </div>
      )}

      <div className="mt-5 flex items-center gap-3">
        <button type="button" className={BTN} disabled={saving} onClick={onSave}>
          {saving ? 'Saving…' : saveLabel}
        </button>
        {saved && !error && (
          <span role="status" className="text-sm text-success-500 font-medium">
            Saved
          </span>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-700 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
