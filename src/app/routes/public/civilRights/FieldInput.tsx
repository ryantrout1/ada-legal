/**
 * One wizard question. Native controls only (best for screen readers,
 * voice control and phones), 16px text so iOS does not zoom, 44px targets,
 * label + hint + error wired with aria-describedby.
 */

import type { FieldSpec } from '../../../../lib/civilRights/types.js';
import { US_STATE_CODES } from '../../../../lib/civilRights/validate.js';
import { UI } from '../../../../lib/civilRights/copy.js';

export const INPUT_CLASS =
  'mt-2 block min-h-[44px] w-full rounded-md border-2 border-control-border bg-surface-50 px-3 py-2 text-base text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50';

interface Props {
  field: FieldSpec;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function fieldId(key: string): string {
  return `cr-${key}`;
}

export function FieldInput({ field, value, error, onChange }: Props) {
  const id = fieldId(field.key);
  const hintId = field.hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  const required = !!field.required;

  const hint = field.hint ? (
    <p id={hintId} className="mt-1 text-base text-ink-700">
      {field.hint}
    </p>
  ) : null;
  const err = error ? (
    <p id={errorId} className="mt-2 text-base font-medium text-danger-500">
      {error}
    </p>
  ) : null;

  if (field.kind === 'yesno') {
    return (
      <fieldset className="mb-6" aria-describedby={describedBy}>
        <legend className="text-lg font-medium text-ink-900">{field.label}</legend>
        {hint}
        <div className="mt-3 flex flex-wrap gap-3">
          {(['yes', 'no'] as const).map((opt) => (
            <label
              key={opt}
              className="inline-flex min-h-[44px] min-w-[96px] cursor-pointer items-center gap-3 rounded-md border-2 border-control-border px-4 py-2 text-lg text-ink-900 has-[:checked]:border-accent-500 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent-500 has-[:focus-visible]:ring-offset-2"
            >
              <input
                type="radio"
                id={opt === 'yes' ? id : `${id}-no`}
                name={id}
                value={opt}
                checked={value === opt}
                required={required}
                aria-invalid={error ? true : undefined}
                onChange={() => onChange(opt)}
                className="h-6 w-6 accent-[var(--color-accent-500)] focus:outline-none"
              />
              {opt === 'yes' ? UI.yes : UI.no}
            </label>
          ))}
        </div>
        {err}
      </fieldset>
    );
  }

  const common = {
    id,
    name: field.key,
    value,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    autoComplete: field.autocomplete ?? 'off',
    className: INPUT_CLASS,
  } as const;

  let control;
  if (field.kind === 'textarea') {
    control = (
      <textarea {...common} rows={field.maxLength > 1500 ? 8 : 4} maxLength={field.maxLength} onChange={(e) => onChange(e.target.value)} />
    );
  } else if (field.kind === 'usState') {
    control = (
      <select {...common} onChange={(e) => onChange(e.target.value)}>
        <option value="">{UI.chooseState}</option>
        {US_STATE_CODES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    );
  } else {
    const type =
      field.kind === 'email' ? 'email' : field.kind === 'tel' ? 'tel' : field.kind === 'date' ? 'date' : 'text';
    control = (
      <input
        {...common}
        type={type}
        inputMode={field.kind === 'zip' ? 'numeric' : undefined}
        maxLength={field.kind === 'date' ? undefined : field.maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <div className="mb-6">
      <label htmlFor={id} className="block text-lg font-medium text-ink-900">
        {field.label}
      </label>
      {hint}
      {control}
      {err}
    </div>
  );
}
