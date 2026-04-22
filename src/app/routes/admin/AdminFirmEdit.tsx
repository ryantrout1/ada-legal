/**
 * AdminFirmEdit — create + edit form for law firms.
 *
 * Routed as /admin/firms/new (create) and /admin/firms/:id (edit).
 * The same form serves both modes; on mount we fetch if :id exists,
 * otherwise start with blank values.
 *
 * The pilot flag is a first-class control here because flipping it is
 * the entire onboarding and offboarding story. Pilot on: listings go
 * live without a subscription. Pilot off + start a Stripe sub: paid.
 *
 * Ref: Step 25, Commit 1.
 */

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

type Status = 'active' | 'suspended' | 'churned';

interface FormState {
  name: string;
  primary_contact: string;
  email: string;
  phone: string;
  stripe_customer_id: string;
  status: Status;
  is_pilot: boolean;
}

const EMPTY: FormState = {
  name: '',
  primary_contact: '',
  email: '',
  phone: '',
  stripe_customer_id: '',
  status: 'active',
  is_pilot: true,
};

export default function AdminFirmEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new' || !id;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    void (async () => {
      try {
        const resp = await fetch(`/api/admin/firms/${encodeURIComponent(id!)}`, {
          credentials: 'include',
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = (await resp.json()) as {
          firm: {
            name: string;
            primaryContact: string | null;
            email: string | null;
            phone: string | null;
            stripeCustomerId: string | null;
            status: Status;
            isPilot: boolean;
          };
        };
        setForm({
          name: data.firm.name,
          primary_contact: data.firm.primaryContact ?? '',
          email: data.firm.email ?? '',
          phone: data.firm.phone ?? '',
          stripe_customer_id: data.firm.stripeCustomerId ?? '',
          status: data.firm.status,
          is_pilot: data.firm.isPilot,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load firm');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name.trim(),
        primary_contact: form.primary_contact.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        stripe_customer_id: form.stripe_customer_id.trim() || null,
        status: form.status,
        is_pilot: form.is_pilot,
      };

      const url = isNew
        ? '/api/admin/firms'
        : `/api/admin/firms/${encodeURIComponent(id!)}`;
      const method = isNew ? 'POST' : 'PATCH';
      const resp = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      // After save, go back to where the user started. New firm goes
      // to the detail page of the newly-created firm; edit goes back
      // to the detail page of the one just edited.
      if (isNew) {
        const created = (await resp.json().catch(() => ({}))) as {
          firm?: { id?: string };
        };
        if (created.firm?.id) {
          navigate(`/admin/firms/${created.firm.id}`);
        } else {
          navigate('/admin/firms');
        }
      } else {
        navigate(`/admin/firms/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-500 italic">Loading…</p>;

  const backTo = isNew ? '/admin/firms' : `/admin/firms/${id}`;
  const backLabel = isNew ? '← Firms' : '← Back to firm';

  return (
    <section>
      <Link
        to={backTo}
        className="text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
      >
        {backLabel}
      </Link>
      <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mt-2 mb-6">
        {isNew ? 'Add firm' : 'Edit firm'}
      </h1>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <Field label="Firm name" required>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          />
        </Field>

        <Field label="Primary contact">
          <input
            type="text"
            value={form.primary_contact}
            onChange={(e) => setForm({ ...form, primary_contact: e.target.value })}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
            />
          </Field>

          <Field label="Phone">
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
            />
          </Field>
        </div>

        <Field
          label="Stripe customer id"
          hint="Required before starting a paid subscription. Leave blank while in pilot mode."
        >
          <input
            type="text"
            value={form.stripe_customer_id}
            onChange={(e) => setForm({ ...form, stripe_customer_id: e.target.value })}
            placeholder="cus_..."
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 font-mono text-sm"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Status">
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="churned">Churned</option>
            </select>
          </Field>

          <Field
            label="Mode"
            hint="Pilot: listings go live without a Stripe subscription. Turn off when transitioning to paid billing."
          >
            <label className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={form.is_pilot}
                onChange={(e) => setForm({ ...form, is_pilot: e.target.checked })}
                className="w-4 h-4 rounded border-surface-200 text-accent-500 focus:ring-accent-500"
              />
              <span className="text-sm text-ink-900">
                Pilot mode {form.is_pilot ? '(on)' : '(off)'}
              </span>
            </label>
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="px-5 py-2 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : isNew ? 'Create firm' : 'Save changes'}
          </button>
          <Link
            to={backTo}
            className="px-5 py-2 rounded-md border border-surface-200 text-ink-700 hover:bg-surface-100"
          >
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-ink-700 mb-1">
        {label}
        {required && <span className="text-danger-500 ml-1">*</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-ink-500 mt-1">{hint}</span>}
    </label>
  );
}
