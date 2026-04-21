/**
 * AdminAttorneyEdit — create + edit form for attorneys.
 *
 * Routed as /admin/attorneys/new (create) and /admin/attorneys/:id (edit).
 * The same form serves both modes; on mount we fetch if :id exists,
 * otherwise start with blank values.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

type Status = 'pending' | 'approved' | 'rejected' | 'archived';

interface FormState {
  name: string;
  firm_name: string;
  location_city: string;
  location_state: string;
  practice_areas: string;
  email: string;
  phone: string;
  website_url: string;
  bio: string;
  status: Status;
}

const EMPTY: FormState = {
  name: '',
  firm_name: '',
  location_city: '',
  location_state: '',
  practice_areas: '',
  email: '',
  phone: '',
  website_url: '',
  bio: '',
  status: 'pending',
};

export default function AdminAttorneyEdit() {
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
        const resp = await fetch(`/api/admin/attorneys/${encodeURIComponent(id!)}`, {
          credentials: 'include',
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = (await resp.json()) as {
          attorney: {
            name: string;
            firmName: string | null;
            locationCity: string | null;
            locationState: string | null;
            practiceAreas: string[];
            email: string | null;
            phone: string | null;
            websiteUrl: string | null;
            bio: string | null;
            status: Status;
          };
        };
        setForm({
          name: data.attorney.name,
          firm_name: data.attorney.firmName ?? '',
          location_city: data.attorney.locationCity ?? '',
          location_state: data.attorney.locationState ?? '',
          practice_areas: data.attorney.practiceAreas.join(', '),
          email: data.attorney.email ?? '',
          phone: data.attorney.phone ?? '',
          website_url: data.attorney.websiteUrl ?? '',
          bio: data.attorney.bio ?? '',
          status: data.attorney.status,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attorney');
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
        firm_name: form.firm_name.trim() || null,
        location_city: form.location_city.trim() || null,
        location_state: form.location_state.trim().toUpperCase() || null,
        practice_areas: form.practice_areas
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        website_url: form.website_url.trim() || null,
        bio: form.bio.trim() || null,
        status: form.status,
      };

      const url = isNew
        ? '/api/admin/attorneys'
        : `/api/admin/attorneys/${encodeURIComponent(id!)}`;
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
      navigate('/admin/attorneys');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-500 italic">Loading…</p>;

  return (
    <section>
      <Link
        to="/admin/attorneys"
        className="text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
      >
        ← Attorneys
      </Link>
      <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mt-2 mb-6">
        {isNew ? 'Add attorney' : 'Edit attorney'}
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
        <Field label="Name" required>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          />
        </Field>

        <Field label="Firm">
          <input
            type="text"
            value={form.firm_name}
            onChange={(e) => setForm({ ...form, firm_name: e.target.value })}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="City">
            <input
              type="text"
              value={form.location_city}
              onChange={(e) => setForm({ ...form, location_city: e.target.value })}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
            />
          </Field>
          <Field label="State" hint="Two-letter code (e.g. AZ)">
            <input
              type="text"
              value={form.location_state}
              onChange={(e) => setForm({ ...form, location_state: e.target.value })}
              maxLength={2}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 uppercase"
            />
          </Field>
        </div>

        <Field label="Practice areas" hint="Comma-separated slugs, e.g. ada, employment">
          <input
            type="text"
            value={form.practice_areas}
            onChange={(e) => setForm({ ...form, practice_areas: e.target.value })}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
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

        <Field label="Website">
          <input
            type="url"
            value={form.website_url}
            onChange={(e) => setForm({ ...form, website_url: e.target.value })}
            placeholder="https://"
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          />
        </Field>

        <Field label="Bio">
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          />
        </Field>

        <Field
          label="Status"
          hint="Only 'approved' rows show on the public directory"
        >
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </select>
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : isNew ? 'Create attorney' : 'Save changes'}
          </button>
          <Link
            to="/admin/attorneys"
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
  children: React.ReactNode;
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
