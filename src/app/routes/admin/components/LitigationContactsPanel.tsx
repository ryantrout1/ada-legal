/**
 * Contacts for one litigation — list, add, remove.
 *
 * Saves independently of the form above it. The litigation PATCH sends a
 * flat set of scalars in one request; contacts are a variable-length list,
 * and holding unsaved rows in memory against that save means a partial
 * failure leaves the two out of step. Adding a contact here is its own
 * request that either works or does not.
 *
 * The scope note is the field that matters. It is what renders next to the
 * phone number on the public page, and the database will not store a
 * contact without one — so the label says what it is for, and a blank one
 * comes back as a sentence from the server rather than a constraint error.
 *
 * No edit-in-place. An edit is a remove and an add, the rows are few, and
 * the alternative roughly doubles the surface for a list averaging one or
 * two entries.
 *
 * Accessibility: every control has a bound label and a 44px target. Remove
 * buttons name the organisation they remove, so they are distinguishable
 * out of context. Errors land in a role="alert" region.
 */

import { useCallback, useEffect, useState, type CSSProperties } from 'react';

interface Contact {
  id: string;
  contactKind: string;
  orgName: string;
  personName: string | null;
  phone: string | null;
  tty: string | null;
  email: string | null;
  url: string | null;
  address: string | null;
  scopeNote: string;
  intakeOpen: boolean;
  displayOrder: number;
}

const KIND_LABEL: Record<string, string> = {
  class_counsel: 'Lawyers on this case',
  settlement_administrator: 'Settlement administrator',
  government_agency: 'Government agency',
  state_pa: 'Disability rights agency',
  referral_firm: 'Law firm (not counsel of record)',
  defendant_process: "The settlement's own complaint route",
};

const EMPTY = {
  contact_kind: 'class_counsel',
  org_name: '',
  person_name: '',
  phone: '',
  tty: '',
  email: '',
  url: '',
  address: '',
  scope_note: '',
  intake_open: false,
  display_order: '0',
};

const labelClass = 'block text-xs font-medium text-ink-700 mb-1';
const inputClass =
  'w-full min-h-[44px] rounded border border-[var(--color-control-border)] px-3 py-2 text-sm';
const cardStyle: CSSProperties = {
  border: '1px solid var(--color-control-border)',
  borderRadius: 8,
  padding: '0.85rem 1rem',
  marginBottom: '0.6rem',
};

export default function LitigationContactsPanel({ litigationId }: { litigationId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState({ ...EMPTY });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const resp = await fetch(`/api/admin/litigation/${litigationId}/contacts`, {
        credentials: 'include',
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const body = (await resp.json()) as { contacts?: Contact[] };
      setContacts(Array.isArray(body.contacts) ? body.contacts : []);
    } catch {
      setError('Could not load the contacts for this case.');
    }
  }, [litigationId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const resp = await fetch(`/api/admin/litigation/${litigationId}/contacts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, display_order: Number(form.display_order) || 0 }),
      });
      if (!resp.ok) {
        // The server's message names the field. Show it rather than a
        // generic failure — it is the only thing that tells an admin what
        // to do next.
        const body = (await resp.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? 'Could not add the contact.');
        return;
      }
      setForm({ ...EMPTY });
      setNotice('Contact added.');
      await load();
    } catch {
      setError('Could not add the contact.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(contact: Contact) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const resp = await fetch(
        `/api/admin/litigation/${litigationId}/contacts/${contact.id}`,
        { method: 'DELETE', credentials: 'include' },
      );
      if (!resp.ok && resp.status !== 204) {
        setError(`Could not remove ${contact.orgName}.`);
        return;
      }
      setNotice(`Removed ${contact.orgName}.`);
      await load();
    } catch {
      setError(`Could not remove ${contact.orgName}.`);
    } finally {
      setBusy(false);
    }
  }

  function set(key: keyof typeof EMPTY, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <section aria-labelledby="contacts-heading" className="mt-8">
      <h2 id="contacts-heading" className="text-lg font-semibold text-ink-900 mb-1">
        Who to contact
      </h2>
      <p className="text-sm text-ink-700 mb-4">
        Shown on the public page for this case. Where there are none, the page falls back
        to the government agency for its barrier category.
      </p>

      {error && (
        <p role="alert" className="text-sm text-ink-900 mb-3">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-ink-700 mb-3">
          {notice}
        </p>
      )}

      {contacts.length === 0 ? (
        <p className="text-sm text-ink-700 mb-4">
          No contacts yet. The public page is showing the government route for this
          category.
        </p>
      ) : (
        <ul className="list-none p-0 m-0 mb-6">
          {contacts.map((c) => (
            <li key={c.id} style={cardStyle}>
              <p className="text-xs uppercase tracking-wide text-ink-700 mb-1">
                {KIND_LABEL[c.contactKind] ?? c.contactKind}
                {c.intakeOpen ? ' · taking enquiries' : ''}
              </p>
              <p className="font-semibold text-ink-900">{c.orgName}</p>
              {c.personName && <p className="text-sm text-ink-700">{c.personName}</p>}
              <p className="text-sm text-ink-700">
                {[c.phone, c.tty, c.email, c.url].filter(Boolean).join(' · ')}
              </p>
              <p className="text-sm text-ink-900 mt-2">{c.scopeNote}</p>
              <button
                type="button"
                onClick={() => void remove(c)}
                disabled={busy}
                className="mt-3 min-h-[44px] px-4 rounded border border-[var(--color-control-border)] text-sm"
              >
                Remove {c.orgName}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className="text-base font-semibold text-ink-900 mb-3">Add a contact</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="contact-kind">What kind of contact</label>
          <select
            id="contact-kind"
            className={inputClass}
            value={form.contact_kind}
            onChange={(e) => set('contact_kind', e.target.value)}
          >
            {Object.keys(KIND_LABEL).map((k) => (
              <option key={k} value={k}>{KIND_LABEL[k]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="contact-org">Organisation</label>
          <input
            id="contact-org"
            className={inputClass}
            value={form.org_name}
            onChange={(e) => set('org_name', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="contact-person">Person (optional)</label>
          <input
            id="contact-person"
            className={inputClass}
            value={form.person_name}
            onChange={(e) => set('person_name', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="contact-phone">Phone</label>
          <input
            id="contact-phone"
            className={inputClass}
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="contact-tty">TTY</label>
          <input
            id="contact-tty"
            className={inputClass}
            value={form.tty}
            onChange={(e) => set('tty', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            className={inputClass}
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="contact-url">Website</label>
          <input
            id="contact-url"
            className={inputClass}
            value={form.url}
            onChange={(e) => set('url', e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="contact-address">Address</label>
          <input
            id="contact-address"
            className={inputClass}
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="contact-scope">
            Who can this contact help? Required — it shows next to the phone number
          </label>
          <textarea
            id="contact-scope"
            className={inputClass}
            rows={3}
            value={form.scope_note}
            onChange={(e) => set('scope_note', e.target.value)}
            placeholder="e.g. For people who live in or visit the City of Seattle. If you are outside Seattle this line cannot help."
          />
        </div>

        <div>
          <label className={labelClass} htmlFor="contact-order">Order on the page</label>
          <input
            id="contact-order"
            className={inputClass}
            type="number"
            value={form.display_order}
            onChange={(e) => set('display_order', e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 min-h-[44px] text-sm text-ink-900">
            <input
              type="checkbox"
              checked={form.intake_open}
              onChange={(e) => set('intake_open', e.target.checked)}
              className="w-5 h-5"
            />
            They are taking enquiries about this case
          </label>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void add()}
        disabled={busy}
        className="mt-4 min-h-[44px] px-5 rounded bg-[var(--color-accent-500)] text-white text-sm font-medium"
      >
        {busy ? 'Saving…' : 'Add contact'}
      </button>
    </section>
  );
}
