/**
 * AdminListingEdit — create + edit form for listings.
 *
 * Routed as /admin/listings/new (create) and /admin/listings/:id (edit).
 * The firm picker is required; the slug auto-generates from the title
 * when the user hasn't manually touched the slug field.
 *
 * The ListingConfig (eligibility_criteria, required_fields, etc.) is
 * intentionally NOT edited here. That's a separate, heavier form with
 * structured-JSON editors that lands in Step 25 Commit 4.
 *
 * Ref: Step 25, Commit 3.
 */

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

type Status = 'draft' | 'published' | 'archived';

interface FirmOption {
  id: string;
  name: string;
}

interface FormState {
  law_firm_id: string;
  title: string;
  slug: string;
  slug_touched: boolean;
  category: string;
  short_description: string;
  full_description: string;
  eligibility_summary: string;
  status: Status;
  tier: string;
}

const EMPTY: FormState = {
  law_firm_id: '',
  title: '',
  slug: '',
  slug_touched: false,
  category: 'ada_title_iii',
  short_description: '',
  full_description: '',
  eligibility_summary: '',
  status: 'draft',
  tier: 'basic',
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export default function AdminListingEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new' || !id;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [firms, setFirms] = useState<FirmOption[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load firms for the picker
  useEffect(() => {
    void (async () => {
      try {
        const resp = await fetch('/api/admin/firms?page_size=100', {
          credentials: 'include',
        });
        if (!resp.ok) return;
        const data = (await resp.json()) as { firms: FirmOption[] };
        setFirms(data.firms);
      } catch {
        // non-fatal
      }
    })();
  }, []);

  // Load existing listing when editing
  useEffect(() => {
    if (isNew) return;
    void (async () => {
      try {
        const resp = await fetch(`/api/admin/listings/${encodeURIComponent(id!)}`, {
          credentials: 'include',
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = (await resp.json()) as {
          listing: {
            lawFirmId: string;
            title: string;
            slug: string;
            category: string;
            shortDescription: string | null;
            fullDescription: string | null;
            eligibilitySummary: string | null;
            status: Status;
            tier: string;
          };
        };
        setForm({
          law_firm_id: data.listing.lawFirmId,
          title: data.listing.title,
          slug: data.listing.slug,
          slug_touched: true, // existing slugs are always "touched"
          category: data.listing.category,
          short_description: data.listing.shortDescription ?? '',
          full_description: data.listing.fullDescription ?? '',
          eligibility_summary: data.listing.eligibilitySummary ?? '',
          status: data.listing.status,
          tier: data.listing.tier,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  // Auto-update slug from title when the user hasn't manually edited it
  function handleTitleChange(value: string) {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug_touched ? prev.slug : slugify(value),
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        law_firm_id: form.law_firm_id,
        title: form.title.trim(),
        slug: form.slug.trim(),
        category: form.category,
        short_description: form.short_description.trim() || null,
        full_description: form.full_description.trim() || null,
        eligibility_summary: form.eligibility_summary.trim() || null,
        status: form.status,
        tier: form.tier,
      };

      const url = isNew
        ? '/api/admin/listings'
        : `/api/admin/listings/${encodeURIComponent(id!)}`;
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
      navigate('/admin/listings');
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
        to="/admin/listings"
        className="text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
      >
        ← Listings
      </Link>
      <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mt-2 mb-6">
        {isNew ? 'Add listing' : 'Edit listing'}
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
        <Field label="Firm" required>
          <select
            required
            value={form.law_firm_id}
            onChange={(e) => setForm({ ...form, law_firm_id: e.target.value })}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          >
            <option value="">Select a firm…</option>
            {firms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Title" required>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          />
        </Field>

        <Field
          label="Slug"
          required
          hint="URL-safe identifier, lowercase letters/numbers/hyphens. Auto-generated from title until you edit it."
        >
          <input
            type="text"
            required
            value={form.slug}
            onChange={(e) =>
              setForm({ ...form, slug: e.target.value, slug_touched: true })
            }
            pattern="^[a-z0-9][a-z0-9-]{2,}$"
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 font-mono text-sm"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Category" required>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
            >
              <option value="ada_title_i">Title I (employment)</option>
              <option value="ada_title_ii">Title II (government)</option>
              <option value="ada_title_iii">Title III (public accommodation)</option>
            </select>
          </Field>

          <Field label="Tier">
            <select
              value={form.tier}
              onChange={(e) => setForm({ ...form, tier: e.target.value })}
              className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </Field>
        </div>

        <Field
          label="Short description"
          hint="One sentence that appears in the discovery feed. Plain language, no legalese."
        >
          <textarea
            rows={2}
            value={form.short_description}
            onChange={(e) => setForm({ ...form, short_description: e.target.value })}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          />
        </Field>

        <Field
          label="Full description"
          hint="Longer case summary with citations. Shown to users who ask for more detail."
        >
          <textarea
            rows={5}
            value={form.full_description}
            onChange={(e) => setForm({ ...form, full_description: e.target.value })}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          />
        </Field>

        <Field
          label="Eligibility summary"
          hint="One-line plain-language note about who may qualify."
        >
          <textarea
            rows={2}
            value={form.eligibility_summary}
            onChange={(e) => setForm({ ...form, eligibility_summary: e.target.value })}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          />
        </Field>

        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          >
            <option value="draft">Draft (hidden from users)</option>
            <option value="published">Published (visible in discovery)</option>
            <option value="archived">Archived (hidden, history kept)</option>
          </select>
        </Field>

        {!isNew && (
          <div className="rounded-md border border-surface-200 bg-surface-50 p-3 text-sm text-ink-700 flex items-center justify-between gap-3">
            <div>
              <strong className="text-ink-900">Listing configuration</strong>
              <p className="text-xs text-ink-500 mt-1">
                Edit case description, eligibility criteria, required fields,
                and disqualifying conditions.
              </p>
            </div>
            <Link
              to={`/admin/listings/${id}/config`}
              className="px-4 py-2 rounded-md border border-accent-500 text-accent-500 text-sm font-medium hover:bg-accent-50 whitespace-nowrap"
            >
              Edit config →
            </Link>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !form.law_firm_id || !form.title.trim() || !form.slug.trim()}
            className="px-5 py-2 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : isNew ? 'Create listing' : 'Save changes'}
          </button>
          <Link
            to="/admin/listings"
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
