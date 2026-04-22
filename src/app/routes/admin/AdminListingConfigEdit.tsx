/**
 * AdminListingConfigEdit — structured editor for a listing's config.
 *
 * The config drives Ada's behavior during a class_action_intake
 * session for this listing. The backend validates every field in
 * every row, so the UI exists mainly to make editing less painful
 * than hand-writing JSON.
 *
 * Three structured sections:
 *  - Eligibility criteria: rows of (description, kind)
 *  - Required fields: rows of (name, description, required, type, enum_values?)
 *  - Disqualifying conditions: list of plain strings
 *
 * Plus free-text case_description and optional ada_prompt_override.
 *
 * Ref: Step 25, Commit 4.
 */

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

type CriterionKind = 'required' | 'preferred' | 'disqualifying';
type FieldType =
  | 'date'
  | 'string'
  | 'enum'
  | 'number'
  | 'yes_no'
  | 'free_text';

interface Criterion {
  description: string;
  kind: CriterionKind;
}

interface FieldRow {
  name: string;
  description: string;
  required: boolean;
  type: FieldType;
  enum_values: string[];
  validation_hint: string;
}

interface FormState {
  case_description: string;
  criteria: Criterion[];
  fields: FieldRow[];
  disqualifying: string[];
  ada_prompt_override: string;
}

const EMPTY_FORM: FormState = {
  case_description: '',
  criteria: [],
  fields: [],
  disqualifying: [],
  ada_prompt_override: '',
};

function emptyCriterion(): Criterion {
  return { description: '', kind: 'required' };
}

function emptyField(): FieldRow {
  return {
    name: '',
    description: '',
    required: true,
    type: 'string',
    enum_values: [],
    validation_hint: '',
  };
}

export default function AdminListingConfigEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [listingTitle, setListingTitle] = useState<string>('');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        // Listing itself (for the title in the breadcrumb)
        const listResp = await fetch(
          `/api/admin/listings/${encodeURIComponent(id)}`,
          { credentials: 'include' },
        );
        if (listResp.ok) {
          const data = (await listResp.json()) as {
            listing: { title: string };
          };
          setListingTitle(data.listing.title);
        }

        // Config (may not exist yet)
        const cfgResp = await fetch(
          `/api/admin/listings/${encodeURIComponent(id)}/config`,
          { credentials: 'include' },
        );
        if (!cfgResp.ok) {
          throw new Error(`HTTP ${cfgResp.status}`);
        }
        const cfgData = (await cfgResp.json()) as {
          config: {
            caseDescription: string;
            eligibilityCriteria: unknown[];
            requiredFields: unknown[];
            disqualifyingConditions: string[];
            adaPromptOverride: string | null;
          } | null;
        };
        if (cfgData.config) {
          setForm({
            case_description: cfgData.config.caseDescription ?? '',
            criteria: (cfgData.config.eligibilityCriteria as Criterion[]) ?? [],
            fields: ((cfgData.config.requiredFields as Partial<FieldRow>[]) ?? []).map(
              (f) => ({
                name: f.name ?? '',
                description: f.description ?? '',
                required: f.required ?? true,
                type: (f.type ?? 'string') as FieldType,
                enum_values: f.enum_values ?? [],
                validation_hint: f.validation_hint ?? '',
              }),
            ),
            disqualifying: cfgData.config.disqualifyingConditions ?? [],
            ada_prompt_override: cfgData.config.adaPromptOverride ?? '',
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load config');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = {
        case_description: form.case_description,
        eligibility_criteria: form.criteria
          .filter((c) => c.description.trim())
          .map((c) => ({ description: c.description.trim(), kind: c.kind })),
        required_fields: form.fields
          .filter((f) => f.name.trim())
          .map((f) => {
            const base: Record<string, unknown> = {
              name: f.name.trim(),
              description: f.description.trim(),
              required: f.required,
              type: f.type,
            };
            if (f.type === 'enum' && f.enum_values.length > 0) {
              base.enum_values = f.enum_values.filter((v) => v.trim());
            }
            if (f.validation_hint.trim()) {
              base.validation_hint = f.validation_hint.trim();
            }
            return base;
          }),
        disqualifying_conditions: form.disqualifying.filter((d) => d.trim()),
        ada_prompt_override: form.ada_prompt_override.trim() || null,
      };

      const resp = await fetch(
        `/api/admin/listings/${encodeURIComponent(id)}/config`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!resp.ok) {
        const body = (await resp.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `HTTP ${resp.status}`);
      }
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-ink-500 italic">Loading…</p>;

  // ─── Criterion row helpers ────────────────────────────────────────────────
  function setCriterion(i: number, next: Partial<Criterion>) {
    setForm((p) => ({
      ...p,
      criteria: p.criteria.map((c, idx) => (idx === i ? { ...c, ...next } : c)),
    }));
  }
  function addCriterion() {
    setForm((p) => ({ ...p, criteria: [...p.criteria, emptyCriterion()] }));
  }
  function removeCriterion(i: number) {
    setForm((p) => ({ ...p, criteria: p.criteria.filter((_, idx) => idx !== i) }));
  }

  // ─── Field row helpers ────────────────────────────────────────────────────
  function setField(i: number, next: Partial<FieldRow>) {
    setForm((p) => ({
      ...p,
      fields: p.fields.map((f, idx) => (idx === i ? { ...f, ...next } : f)),
    }));
  }
  function addField() {
    setForm((p) => ({ ...p, fields: [...p.fields, emptyField()] }));
  }
  function removeField(i: number) {
    setForm((p) => ({ ...p, fields: p.fields.filter((_, idx) => idx !== i) }));
  }
  function setFieldEnumValues(i: number, value: string) {
    const parts = value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
    setField(i, { enum_values: parts });
  }

  // ─── Disqualifying row helpers ────────────────────────────────────────────
  function setDisqualifying(i: number, value: string) {
    setForm((p) => ({
      ...p,
      disqualifying: p.disqualifying.map((d, idx) => (idx === i ? value : d)),
    }));
  }
  function addDisqualifying() {
    setForm((p) => ({ ...p, disqualifying: [...p.disqualifying, ''] }));
  }
  function removeDisqualifying(i: number) {
    setForm((p) => ({
      ...p,
      disqualifying: p.disqualifying.filter((_, idx) => idx !== i),
    }));
  }

  return (
    <section>
      <Link
        to={`/admin/listings/${id}`}
        className="text-xs uppercase tracking-wider font-mono text-ink-500 hover:text-accent-600 underline underline-offset-2"
      >
        ← Back to listing
      </Link>
      <h1 className="font-display text-2xl sm:text-3xl text-ink-900 mt-2 mb-1">
        Listing configuration
      </h1>
      {listingTitle && (
        <p className="text-sm text-ink-500 mb-6">
          for{' '}
          <span className="text-ink-700 font-medium">{listingTitle}</span>
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-danger-500 bg-danger-50 px-4 py-3 text-sm text-danger-500"
        >
          {error}
        </div>
      )}

      {saved && (
        <div
          role="status"
          className="mb-4 rounded-md border border-success-500 bg-success-50 px-4 py-3 text-sm text-success-500"
        >
          Configuration saved.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
        {/* Case description */}
        <Section
          title="Case description"
          description="Plain-language explanation of what this class action is about. Ada will use this to frame the conversation with users. Include the statute/regulation and the specific conduct at issue."
        >
          <textarea
            rows={6}
            value={form.case_description}
            onChange={(e) =>
              setForm({ ...form, case_description: e.target.value })
            }
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900"
          />
        </Section>

        {/* Eligibility criteria */}
        <Section
          title="Eligibility criteria"
          description="Criteria Ada evaluates to decide if the user qualifies. Required criteria MUST all be true. Preferred criteria strengthen the case. Disqualifying criteria immediately exclude the user if any are true."
        >
          <div className="space-y-3">
            {form.criteria.map((c, i) => (
              <div
                key={i}
                className="rounded-md border border-surface-200 bg-surface-50 p-3"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-[240px]">
                    <label className="block text-xs uppercase tracking-wider font-mono text-ink-500 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={c.description}
                      onChange={(e) =>
                        setCriterion(i, { description: e.target.value })
                      }
                      className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-mono text-ink-500 mb-1">
                      Kind
                    </label>
                    <select
                      value={c.kind}
                      onChange={(e) =>
                        setCriterion(i, {
                          kind: e.target.value as CriterionKind,
                        })
                      }
                      className="rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 text-sm"
                    >
                      <option value="required">Required</option>
                      <option value="preferred">Preferred</option>
                      <option value="disqualifying">Disqualifying</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCriterion(i)}
                    className="self-start mt-5 text-xs text-danger-500 hover:text-danger-600 underline underline-offset-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addCriterion}
              className="text-sm text-accent-500 hover:text-accent-600 underline underline-offset-2"
            >
              + Add criterion
            </button>
          </div>
        </Section>

        {/* Required fields */}
        <Section
          title="Required fields"
          description="Facts Ada must extract from the conversation. Names are snake_case identifiers used in the tools. Descriptions guide Ada's prompting."
        >
          <div className="space-y-3">
            {form.fields.map((f, i) => (
              <div
                key={i}
                className="rounded-md border border-surface-200 bg-surface-50 p-3 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-mono text-ink-500 mb-1">
                      Name (snake_case)
                    </label>
                    <input
                      type="text"
                      value={f.name}
                      onChange={(e) =>
                        setField(i, { name: e.target.value })
                      }
                      pattern="^[a-z][a-z0-9_]*$"
                      placeholder="hotel_name"
                      className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-mono text-ink-500 mb-1">
                      Type
                    </label>
                    <select
                      value={f.type}
                      onChange={(e) =>
                        setField(i, {
                          type: e.target.value as FieldType,
                          // Clear enum values if we leave enum type
                          enum_values:
                            e.target.value === 'enum' ? f.enum_values : [],
                        })
                      }
                      className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 text-sm"
                    >
                      <option value="string">string (short text)</option>
                      <option value="free_text">free_text (longer)</option>
                      <option value="date">date</option>
                      <option value="number">number</option>
                      <option value="yes_no">yes_no</option>
                      <option value="enum">enum (pick from list)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider font-mono text-ink-500 mb-1">
                    Description (what Ada asks for)
                  </label>
                  <textarea
                    rows={2}
                    value={f.description}
                    onChange={(e) =>
                      setField(i, { description: e.target.value })
                    }
                    className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 text-sm"
                  />
                </div>

                {f.type === 'enum' && (
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-mono text-ink-500 mb-1">
                      Enum values (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={f.enum_values.join(', ')}
                      onChange={(e) => setFieldEnumValues(i, e.target.value)}
                      placeholder="yes, no, partially"
                      className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs uppercase tracking-wider font-mono text-ink-500 mb-1">
                    Validation hint (optional)
                  </label>
                  <input
                    type="text"
                    value={f.validation_hint}
                    onChange={(e) =>
                      setField(i, { validation_hint: e.target.value })
                    }
                    placeholder="US state 2-letter code preferred"
                    className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 text-sm"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-ink-700">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) =>
                        setField(i, { required: e.target.checked })
                      }
                      className="w-4 h-4 rounded border-surface-200 text-accent-500"
                    />
                    Required
                  </label>
                  <button
                    type="button"
                    onClick={() => removeField(i)}
                    className="text-xs text-danger-500 hover:text-danger-600 underline underline-offset-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addField}
              className="text-sm text-accent-500 hover:text-accent-600 underline underline-offset-2"
            >
              + Add field
            </button>
          </div>
        </Section>

        {/* Disqualifying conditions */}
        <Section
          title="Disqualifying conditions"
          description="Short statements about circumstances that immediately disqualify a user. Written for Ada to read; plain language."
        >
          <div className="space-y-2">
            {form.disqualifying.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={d}
                  onChange={(e) => setDisqualifying(i, e.target.value)}
                  className="flex-1 rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeDisqualifying(i)}
                  className="text-xs text-danger-500 hover:text-danger-600 underline underline-offset-2"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addDisqualifying}
              className="text-sm text-accent-500 hover:text-accent-600 underline underline-offset-2"
            >
              + Add condition
            </button>
          </div>
        </Section>

        {/* Ada prompt override */}
        <Section
          title="Ada prompt override (advanced)"
          description="Appended to Ada's system prompt for sessions bound to this listing. Leave empty unless you have a specific reason to deviate from the standard behavior."
        >
          <textarea
            rows={4}
            value={form.ada_prompt_override}
            onChange={(e) =>
              setForm({ ...form, ada_prompt_override: e.target.value })
            }
            className="w-full rounded-md border border-surface-200 bg-white px-3 py-2 text-ink-900 text-sm font-mono"
            placeholder="(empty)"
          />
        </Section>

        <div className="flex items-center gap-3 pt-2 border-t border-surface-200 sticky bottom-0 bg-surface-50/95 py-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving…' : 'Save configuration'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/admin/listings/${id}`)}
            className="px-5 py-2 rounded-md border border-surface-200 text-ink-700 hover:bg-surface-100"
          >
            Done
          </button>
        </div>
      </form>
    </section>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg text-ink-900 mb-1">{title}</h2>
      {description && (
        <p className="text-sm text-ink-500 mb-3">{description}</p>
      )}
      {children}
    </section>
  );
}
