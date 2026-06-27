/**
 * Firm — owner-only roster of the firm's lawyers + a read-only view of each
 * lawyer's profile and go-live readiness. Owners can also invite a lawyer by
 * email and hand off / share ownership (/plan Phase 3.1-3.2).
 *
 * Portal-scoped (.lawyer-workspace), AAA.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, AlertCircle, UserPlus, Globe, MapPin, Building2, Pencil, UserMinus, Mail, Phone, User, X, Plus } from 'lucide-react';
import {
  fetchFirmLawyers,
  fetchFirmLawyer,
  addFirmLawyer,
  promoteOwner,
  transferOwnership,
  saveAccount,
  removeFirmLawyer,
  PortalApiError,
  type PortalFirmLawyerSummary,
  type PortalLawyerDetail,
  type PortalAccountFirm,
} from '../../data/portalClient.js';
import { StateSelect, StateGrid, TagPicker, SUGGESTED_PRACTICE_AREAS } from './practiceControls';

const STATUS_LABEL: Record<string, string> = {
  approved: 'Active',
  pending: 'Pending review',
  rejected: 'Not approved',
  archived: 'Archived',
};

/** 'public_accommodations' -> 'Public accommodations'; keeps known acronyms upper. */
const UPPER_SLUGS = new Set(['ada', 'eeoc', 'doj', 'hud']);
function humanizeSlug(slug: string): string {
  if (UPPER_SLUGS.has(slug)) return slug.toUpperCase();
  return slug
    .split('_')
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

const INPUT =
  'w-full min-h-[44px] rounded-md border border-control-border bg-white px-3 text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const BTN =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-md text-sm font-semibold border border-accent-500 bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60';
const BTN_SECONDARY =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-md text-sm font-semibold border border-control-border bg-white text-ink-900 hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60';
const BTN_DANGER =
  'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-md text-sm font-semibold border border-danger-500 text-danger-500 bg-white hover:bg-danger-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60';

export default function PortalFirmLawyers() {
  const [lawyers, setLawyers] = useState<PortalFirmLawyerSummary[] | null>(null);
  const [firm, setFirm] = useState<PortalAccountFirm | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PortalFirmLawyerSummary | null>(null);
  const [editingFirm, setEditingFirm] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addedMsg, setAddedMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  const isOwner = useMemo(
    () => !!lawyers?.some((l) => l.is_self && l.firm_role === 'owner'),
    [lawyers],
  );

  const loadRoster = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchFirmLawyers();
      setLawyers(data.lawyers);
      setFirm(data.firm);
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
    const ownerCount = lawyers?.filter((l) => l.firm_role === 'owner').length ?? 0;
    const canRemove = !(selected.firm_role === 'owner' && ownerCount <= 1);
    return (
      <LawyerDetail
        summary={selected}
        canRemove={canRemove}
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
      {editingFirm && firm ? (
        <FirmEditor
          firm={firm}
          onCancel={() => setEditingFirm(false)}
          onSaved={() => {
            setEditingFirm(false);
            void loadRoster();
          }}
        />
      ) : (
        <FirmRecord firm={firm} canEdit={isOwner} onEdit={() => setEditingFirm(true)} />
      )}

      {!editingFirm && (
        <>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-baseline gap-3">
              <h2 className="font-display text-xl text-ink-900">Attorneys</h2>
              {lawyers && <span className="text-sm text-ink-500">{lawyers.length} in this firm</span>}
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  setAddedMsg(null);
                  setAddOpen(true);
                }}
                className={BTN}
              >
                <UserPlus size={16} aria-hidden="true" /> Add attorney
              </button>
            )}
          </div>

          {addedMsg && (
            <div
              role="status"
              className="mb-3 flex items-start gap-2 rounded-md border border-success-500 bg-success-50 px-3 py-2 text-sm text-success-500"
            >
              <CheckCircle2 size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span className="font-medium">{addedMsg}</span>
            </div>
          )}

          {!lawyers ? (
            <p className="text-sm text-ink-500">Loading…</p>
          ) : lawyers.length === 0 ? (
            <p className="text-sm text-ink-500">No attorneys in your firm yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lawyers.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => (l.is_self ? navigate('/portal/account') : setSelected(l))}
                    className="w-full flex items-center gap-3 rounded-lg border border-control-border bg-white px-4 py-3 text-left hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    <span
                      aria-hidden="true"
                      className="grid place-items-center h-9 w-9 shrink-0 rounded-full bg-accent-50 text-accent-600 text-sm font-semibold"
                    >
                      {getInitials(l.name)}
                    </span>
                    <span className="min-w-0 flex-1">
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
        </>
      )}

      {addOpen && (
        <AddLawyerModal
          onClose={() => setAddOpen(false)}
          onAdded={(msg) => {
            setAddOpen(false);
            setAddedMsg(msg);
            void loadRoster();
          }}
        />
      )}
    </div>
  );
}

function FirmRecord({
  firm,
  canEdit,
  onEdit,
}: {
  firm: PortalAccountFirm | null;
  canEdit: boolean;
  onEdit: () => void;
}) {
  if (!firm) {
    return (
      <header className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mb-1">Your firm</h1>
        <p className="text-sm text-ink-500">Loading…</p>
      </header>
    );
  }

  const location = [firm.location_city, firm.location_state].filter(Boolean).join(', ') || null;
  const coverage = firm.serves_nationwide
    ? ['Nationwide']
    : [firm.location_state, ...firm.additional_states].filter((s): s is string => Boolean(s));
  const practiceAreas = firm.practice_areas.map(humanizeSlug);
  const statusCls =
    firm.status === 'active'
      ? 'border-success-500 bg-success-50 text-success-500'
      : 'border-control-border bg-surface-100 text-ink-700';

  return (
    <section className="mb-8 rounded-xl border border-surface-200 bg-white shadow-sm overflow-hidden">
      {/* Header band */}
      <div className="flex items-start gap-4 p-5 sm:p-6">
        <div
          className="grid place-items-center h-12 w-12 shrink-0 rounded-lg bg-accent-50 text-accent-600"
          aria-hidden="true"
        >
          <Building2 size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Your firm</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="font-display text-2xl sm:text-3xl text-ink-900 leading-tight">{firm.name}</h1>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusCls}`}>
                  {firm.status}
                </span>
              </div>
            </div>
            {canEdit && (
              <button type="button" onClick={onEdit} className={`${BTN_SECONDARY} shrink-0`}>
                <Pencil size={15} aria-hidden="true" /> Edit firm
              </button>
            )}
          </div>

          {firm.description ? (
            <p className="mt-3 max-w-prose text-sm text-ink-700 leading-relaxed">{firm.description}</p>
          ) : (
            <p className="mt-3 text-sm text-ink-500 italic">No firm description yet.</p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="border-t border-surface-200 px-5 sm:px-6 py-5 grid gap-5">
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          <DetailItem icon={<User size={15} aria-hidden="true" />} label="Contact" value={firm.primary_contact} />
          <DetailItem
            icon={<Mail size={15} aria-hidden="true" />}
            label="Email"
            value={firm.email}
            href={firm.email ? `mailto:${firm.email}` : undefined}
          />
          <DetailItem
            icon={<Phone size={15} aria-hidden="true" />}
            label="Phone"
            value={firm.phone}
            href={firm.phone ? `tel:${firm.phone.replace(/[^\d+]/g, '')}` : undefined}
          />
          <DetailItem icon={<MapPin size={15} aria-hidden="true" />} label="Location" value={location} />
        </dl>

        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500 mb-1.5">Coverage</p>
            <Chips items={coverage} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500 mb-1.5">Practice areas</p>
            <Chips items={practiceAreas} />
          </div>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500 mb-1.5">Website</p>
          {firm.website_url ? (
            <a
              href={firm.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-accent-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <Globe size={14} aria-hidden="true" />
              {firm.website_url.replace(/^https?:\/\//, '')}
            </a>
          ) : (
            <span className="text-sm text-ink-500">No website yet</span>
          )}
        </div>
      </div>
    </section>
  );
}

function DetailItem({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-ink-500" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</dt>
        <dd className="mt-0.5 text-sm text-ink-900 break-words">
          {value ? (
            href ? (
              <a
                href={href}
                className="text-accent-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {value}
              </a>
            ) : (
              value
            )
          ) : (
            <span className="text-ink-500">—</span>
          )}
        </dd>
      </div>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-sm text-ink-500">—</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <li
          key={it}
          className="inline-flex items-center rounded-full border border-control-border bg-surface-100 px-2.5 py-1 text-xs font-medium text-ink-700"
        >
          {it}
        </li>
      ))}
    </ul>
  );
}

type FirmForm = {
  name: string;
  primary_contact: string;
  email: string;
  phone: string;
  website_url: string;
  description: string;
  practice_areas: string[];
  location_city: string;
  location_state: string;
  additional_states: string[];
  serves_nationwide: boolean;
};

function firmToForm(f: PortalAccountFirm): FirmForm {
  return {
    name: f.name ?? '',
    primary_contact: f.primary_contact ?? '',
    email: f.email ?? '',
    phone: f.phone ?? '',
    website_url: f.website_url ?? '',
    description: f.description ?? '',
    practice_areas: f.practice_areas,
    location_city: f.location_city ?? '',
    location_state: f.location_state ?? '',
    additional_states: f.additional_states,
    serves_nationwide: f.serves_nationwide,
  };
}

function FirmEditor({
  firm,
  onCancel,
  onSaved,
}: {
  firm: PortalAccountFirm;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FirmForm>(() => firmToForm(firm));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = (patch: Partial<FirmForm>) => setForm((p) => ({ ...p, ...patch }));

  const save = async () => {
    setErr(null);
    if (!form.name.trim()) {
      setErr('Firm name is required.');
      return;
    }
    setBusy(true);
    try {
      await saveAccount({
        firm: {
          name: form.name.trim(),
          primary_contact: form.primary_contact,
          email: form.email,
          phone: form.phone,
          website_url: form.website_url,
          description: form.description,
          practice_areas: form.practice_areas,
          location_city: form.location_city,
          location_state: form.location_state,
          additional_states: form.additional_states,
          serves_nationwide: form.serves_nationwide,
        },
      });
      onSaved();
    } catch (e) {
      setErr(e instanceof PortalApiError ? e.message : 'Could not save the firm. Please try again.');
      setBusy(false);
    }
  };

  return (
    <section className="mb-8 rounded-xl border border-surface-200 bg-white p-5 sm:p-6 shadow-sm" aria-labelledby="firm-edit-h">
      <h1 id="firm-edit-h" className="font-display text-2xl text-ink-900 mb-1">
        Edit firm
      </h1>
      <p className="text-sm text-ink-500 mb-5">Your firm’s public details. Required to go live is marked.</p>

      {err && (
        <div role="alert" className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-500">
          {err}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <EditField label="Firm name" id="fe-name" required>
          <input id="fe-name" className={INPUT} value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </EditField>
        <EditField label="Primary contact" id="fe-contact">
          <input id="fe-contact" className={INPUT} value={form.primary_contact} onChange={(e) => set({ primary_contact: e.target.value })} />
        </EditField>
        <EditField label="Firm email" id="fe-email">
          <input id="fe-email" type="email" className={INPUT} value={form.email} onChange={(e) => set({ email: e.target.value })} />
        </EditField>
        <EditField label="Firm phone" id="fe-phone">
          <input id="fe-phone" className={INPUT} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
        </EditField>
        <EditField label="Website" id="fe-web">
          <input id="fe-web" type="url" inputMode="url" className={INPUT} value={form.website_url} onChange={(e) => set({ website_url: e.target.value })} />
        </EditField>
        <EditField label="City" id="fe-city">
          <input id="fe-city" className={INPUT} value={form.location_city} onChange={(e) => set({ location_city: e.target.value })} />
        </EditField>
        <div>
          <label htmlFor="fe-state" className="block text-sm font-medium text-ink-700 mb-1">
            Primary state
          </label>
          <StateSelect id="fe-state" value={form.location_state} onChange={(v) => set({ location_state: v })} />
        </div>

        <div className="sm:col-span-2 rounded-md border border-control-border bg-surface-100 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="min-w-0">
              <span id="fe-nation-label" className="block text-sm font-medium text-ink-900">
                Serves nationwide
              </span>
              <span className="text-xs text-ink-500">On = matched to claimants in any state. Off = only the states below.</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={form.serves_nationwide}
              aria-labelledby="fe-nation-label"
              onClick={() => set({ serves_nationwide: !form.serves_nationwide })}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                form.serves_nationwide ? 'bg-accent-500 border-accent-500' : 'bg-white border-control-border'
              }`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${form.serves_nationwide ? 'translate-x-6' : 'translate-x-1'} border border-control-border`} />
            </button>
          </div>
          <div className="mt-4">
            <StateGrid
              label="Coverage states"
              hint="Click the states this firm serves. The primary state is always covered."
              selected={form.additional_states}
              exclude={form.location_state}
              onChange={(v) => set({ additional_states: v })}
              disabled={form.serves_nationwide}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <TagPicker
            label="Practice areas"
            inputId="fe-pa"
            hint="Click a suggestion to add it, or type your own. These help Ada match the right referrals."
            selected={form.practice_areas}
            suggestions={SUGGESTED_PRACTICE_AREAS}
            onChange={(v) => set({ practice_areas: v })}
          />
        </div>

        <div className="sm:col-span-2">
          <EditField label="Description" id="fe-desc">
            <textarea
              id="fe-desc"
              rows={4}
              className="w-full rounded-md border border-control-border bg-white px-3 py-2 text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </EditField>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={() => void save()} disabled={busy} className={BTN}>
          {busy ? 'Saving…' : 'Save firm'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-md text-sm font-semibold border border-control-border bg-white text-ink-900 hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </section>
  );
}

function EditField({
  label,
  id,
  required,
  hint,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-700 mb-1">
        {label}
        {required && <span className="text-danger-500"> (required)</span>}
        {hint && <span className="font-normal text-ink-500"> · {hint}</span>}
      </label>
      {children}
    </div>
  );
}

function AddLawyerModal({ onClose, onAdded }: { onClose: () => void; onAdded: (msg: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = 'add-lawyer-title';

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const f = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (f.length === 0) return;
        const first = f[0]!;
        const last = f[f.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  const submit = async () => {
    setErr(null);
    if (!name.trim() || !email.trim()) {
      setErr('Add a name and an email.');
      return;
    }
    setBusy(true);
    try {
      const added = await addFirmLawyer(name.trim(), email.trim());
      onAdded(`Invited ${added.name}. They’ll be linked when they sign up with ${added.email}.`);
    } catch (e) {
      setErr(e instanceof PortalApiError ? e.message : 'Could not add the attorney.');
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-lg text-ink-900">
            Add an attorney
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-2 grid h-11 w-11 place-items-center rounded-md text-ink-500 hover:bg-surface-100 hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <p className="mb-4 text-sm text-ink-500">
          They’ll show as <span className="font-medium text-ink-700">pending</span> until they sign up with this email.
        </p>

        {err && (
          <div role="alert" className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-500">
            {err}
          </div>
        )}

        <div className="grid gap-4">
          <div>
            <label htmlFor="add-name" className="block text-sm font-medium text-ink-700 mb-1">
              Full name
            </label>
            <input id="add-name" ref={firstFieldRef} className={INPUT} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="add-email" className="block text-sm font-medium text-ink-700 mb-1">
              Email
            </label>
            <input
              id="add-email"
              type="email"
              className={INPUT}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !busy) void submit();
              }}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className={BTN_SECONDARY}>
            Cancel
          </button>
          <button type="button" onClick={() => void submit()} disabled={busy} className={BTN}>
            {busy ? (
              'Adding…'
            ) : (
              <>
                <Plus size={16} aria-hidden="true" /> Add attorney
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function LawyerDetail({
  summary,
  canRemove,
  onChanged,
  onBack,
}: {
  summary: PortalFirmLawyerSummary;
  canRemove: boolean;
  onBack: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<PortalLawyerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

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
            <Row label="Specialty tags" value={detail.attorney.specialty_tags.join(', ') || null} />
            <Row label="Bio" value={detail.attorney.bio} />
            <Row
              label="Accepting referrals"
              value={detail.attorney.routing_paused ? 'Paused' : detail.attorney.accepting_referrals ? 'Yes' : 'No'}
            />
          </dl>
          <p className="mt-3 text-xs text-ink-500">
            Read-only. Lawyers edit their own profile; an admin can edit anyone.
          </p>

          {actionErr && (
            <div role="alert" className="mt-6 rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-500">
              {actionErr}
            </div>
          )}

          {canManage && (
            <section className="mt-6 rounded-lg border border-control-border bg-white p-5">
              <h2 className="font-display text-lg text-ink-900 mb-1">Ownership</h2>
              <p className="text-sm text-ink-500 mb-4">
                Owners can manage the firm and its lawyers.
              </p>
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

          {canRemove && !summary.is_self && (
            <section className="mt-6 rounded-lg border border-control-border bg-white p-5">
              <h2 className="flex items-center gap-2 font-display text-lg text-ink-900 mb-1">
                <UserMinus size={18} aria-hidden="true" className="text-ink-500" /> Remove from firm
              </h2>
              <p className="text-sm text-ink-700 mb-4">
                Archives {detail?.attorney.name ?? 'this lawyer'} and signs them out of the firm. Any cases they’re
                working return to the firm’s queue — nothing is lost, and you can re-invite them later.
              </p>
              {!confirming ? (
                <button type="button" className={BTN_DANGER} disabled={busy} onClick={() => setConfirming(true)}>
                  Remove from firm
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-ink-900">
                    Remove {detail?.attorney.name ?? 'this lawyer'}?
                  </span>
                  <button
                    type="button"
                    className={BTN_DANGER}
                    disabled={busy}
                    onClick={() => void runAction(async () => {
                      await removeFirmLawyer(summary.id);
                    })}
                  >
                    {busy ? 'Removing…' : 'Yes, remove'}
                  </button>
                  <button type="button" className={BTN_SECONDARY} disabled={busy} onClick={() => setConfirming(false)}>
                    Cancel
                  </button>
                </div>
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
