/**
 * Reusable portal form controls for jurisdictions + practice scope, shared by
 * the firm editor and the attorney profile so both configure these by
 * clicking — not by typing comma-separated text. Mirrors the canonical
 * taxonomy Ada matches on (specialty tags + practice areas) and the US-state
 * list. Portal-scoped (.lawyer-workspace), AAA: 44px targets, visible focus,
 * aria-pressed toggles, grouped controls.
 */

import { useState } from 'react';
import { X, Plus } from 'lucide-react';

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
] as const;

/** Canonical taxonomy Ada matches referrals against. */
export const CANONICAL_SPECIALTY_TAGS: { slug: string; label: string }[] = [
  { slug: 'title_i', label: 'Title I — Employment' },
  { slug: 'title_ii', label: 'Title II — Government' },
  { slug: 'title_iii', label: 'Title III — Public accommodation' },
  { slug: 'class_action', label: 'Class action experience' },
  { slug: 'mass_action', label: 'Mass action experience' },
];

/** Suggested practice areas — click to add, not exhaustive. */
export const SUGGESTED_PRACTICE_AREAS = [
  'Title I – Employment',
  'Title II – Government',
  'Title III – Public Accommodations',
  'Web & Digital Accessibility',
  'Fair Housing',
  'Education / Section 504',
  'Service Animals',
  'Effective Communication',
  'Transportation',
  'Civil Rights',
  'Disability Rights',
];

const PILL =
  'inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-full border text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const PILL_ON = 'border-accent-500 bg-accent-500 text-white';
const PILL_OFF = 'border-control-border bg-white text-ink-700 hover:bg-surface-100';

/** Single primary-state dropdown. Keeps the field id for go-live focus jumps. */
export function StateSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full sm:w-56 min-h-[44px] rounded-lg border border-control-border bg-white px-3 text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <option value="">— Select a state —</option>
      {US_STATES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}

/** Click-to-toggle grid of states (multi-select). */
export function StateGrid({
  label,
  hint,
  selected,
  exclude,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  selected: string[];
  exclude?: string;
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (s: string) =>
    selected.includes(s)
      ? onChange(selected.filter((x) => x !== s))
      : onChange([...selected, s].sort());

  return (
    <div>
      <p className="block text-sm font-medium text-ink-700 mb-1">{label}</p>
      {hint && <p className="text-xs text-ink-500 mb-2">{hint}</p>}
      <div
        role="group"
        aria-label={label}
        className={`flex flex-wrap gap-1.5 ${disabled ? 'opacity-50' : ''}`}
      >
        {US_STATES.filter((s) => s !== exclude).map((s) => {
          const active = selected.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => toggle(s)}
              className={`${PILL} min-w-[44px] ${active ? PILL_ON : PILL_OFF} disabled:cursor-not-allowed`}
            >
              {s}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** The five canonical specialty tags as a checkbox group. */
export function SpecialtyChecklist({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (slug: string) =>
    selected.includes(slug)
      ? onChange(selected.filter((x) => x !== slug))
      : onChange([...selected, slug]);

  return (
    <div role="group" aria-label="Specialty tags" className="flex flex-col gap-0.5">
      {CANONICAL_SPECIALTY_TAGS.map((t) => {
        const active = selected.includes(t.slug);
        return (
          <label
            key={t.slug}
            className="flex items-center gap-2.5 min-h-[44px] -mx-2 px-2 rounded-md cursor-pointer hover:bg-surface-100"
          >
            <input
              type="checkbox"
              checked={active}
              onChange={() => toggle(t.slug)}
              className="h-5 w-5 shrink-0 rounded border border-control-border accent-accent-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            />
            <span className="text-sm text-ink-900">{t.label}</span>
          </label>
        );
      })}
    </div>
  );
}

/** Selectable suggestion chips + add-your-own; selected render as removable chips. */
export function TagPicker({
  label,
  hint,
  inputId,
  selected,
  suggestions,
  onChange,
}: {
  label: string;
  hint?: string;
  inputId: string;
  selected: string[];
  suggestions: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const v = raw.trim().replace(/,+$/, '').trim();
    if (!v) return;
    if (!selected.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...selected, v]);
    setDraft('');
  };
  const remove = (v: string) => onChange(selected.filter((x) => x !== v));
  const open = suggestions.filter((s) => !selected.some((x) => x.toLowerCase() === s.toLowerCase()));

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-700 mb-1">
        {label}
      </label>
      {hint && <p className="text-xs text-ink-500 mb-2">{hint}</p>}

      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((a) => (
            <li key={a}>
              <button
                type="button"
                onClick={() => remove(a)}
                aria-label={`Remove ${a}`}
                className={`${PILL} ${PILL_ON}`}
              >
                {a}
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {open.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mb-2">
          {open.map((a) => (
            <li key={a}>
              <button type="button" onClick={() => add(a)} className={`${PILL} ${PILL_OFF}`}>
                <Plus size={14} aria-hidden="true" />
                {a}
              </button>
            </li>
          ))}
        </ul>
      )}

      <input
        id={inputId}
        type="text"
        value={draft}
        placeholder="Add your own…"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          }
        }}
        onBlur={() => add(draft)}
        className="w-full min-h-[44px] rounded-lg border border-control-border bg-white px-3 text-ink-900 placeholder:text-ink-500/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      />
    </div>
  );
}
