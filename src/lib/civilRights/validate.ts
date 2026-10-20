/**
 * One validator for the civil rights wizard, used by the browser and by
 * POST /api/public/civil-rights/submit, so the two sides cannot disagree.
 *
 * Rules:
 *   - Only keys the state config knows survive; everything is trimmed.
 *   - Over-length text is rejected with a message, never silently cut.
 *   - Dates are checked as real calendar dates. The only date comparison is
 *     first <= last, two of the person's own answers. Nothing here reads
 *     the clock or judges whether a complaint is late.
 */

import type { Answers, FieldError, FieldSpec, StateConfig, ValidationResult } from './types.js';

export const US_STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN',
  'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT',
  'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'PR', 'GU', 'VI', 'AS', 'MP',
] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^\d{5}(-\d{4})?$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const PHONE_DIGITS_MIN = 7;

/** True for a real yyyy-mm-dd calendar date. No Date object, no clock. */
export function isRealIsoDate(value: string): boolean {
  const m = ISO_DATE_RE.exec(value);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (y < 1900 || mo < 1 || mo > 12 || d < 1) return false;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
  return d <= days;
}

function isRequired(field: FieldSpec, answers: Answers): boolean {
  if (field.required) return true;
  if (field.requiredWhen) return answers[field.requiredWhen.field] === field.requiredWhen.equals;
  return false;
}

function checkFormat(field: FieldSpec, v: string): string | null {
  switch (field.kind) {
    case 'email':
      return EMAIL_RE.test(v) ? null : 'Enter an email address like name@example.com.';
    case 'tel':
      return v.replace(/\D/g, '').length >= PHONE_DIGITS_MIN ? null : 'Enter a phone number with area code.';
    case 'zip':
      return ZIP_RE.test(v) ? null : 'Enter a 5-digit ZIP code.';
    case 'usState':
      return (US_STATE_CODES as readonly string[]).includes(v) ? null : 'Choose a state.';
    case 'date':
      return isRealIsoDate(v) ? null : 'Enter a real date.';
    case 'yesno':
      return v === 'yes' || v === 'no' ? null : 'Choose yes or no.';
    default:
      return null;
  }
}

function normalize(field: FieldSpec, raw: unknown): string {
  const v = typeof raw === 'string' ? raw.trim() : '';
  if (field.kind === 'usState' || field.kind === 'yesno') {
    return field.kind === 'usState' ? v.toUpperCase() : v.toLowerCase();
  }
  return v;
}

export function validateAnswers(config: StateConfig, input: unknown): ValidationResult {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const value: Answers = {};
  for (const f of config.fields) value[f.key] = normalize(f, raw[f.key]);

  const errors: FieldError[] = [];
  for (const f of config.fields) {
    const v = value[f.key];
    if (!v) {
      if (isRequired(f, value)) errors.push({ field: f.key, message: `${f.label} is needed.` });
      continue;
    }
    if (v.length > f.maxLength) {
      errors.push({ field: f.key, message: `Please keep this under ${f.maxLength} characters.` });
      continue;
    }
    const problem = checkFormat(f, v);
    if (problem) errors.push({ field: f.key, message: problem });
  }

  // First time cannot be after last time. ISO strings compare correctly.
  const first = value.first_incident_date;
  const last = value.last_incident_date;
  if (
    first &&
    last &&
    isRealIsoDate(first) &&
    isRealIsoDate(last) &&
    first > last &&
    !errors.some((e) => e.field === 'first_incident_date')
  ) {
    errors.push({
      field: 'first_incident_date',
      message: 'The first time should be on or before the last time.',
    });
  }

  // Report in form order so "the first error" is the first one on screen.
  const order = new Map(config.fields.map((f, i) => [f.key, i]));
  errors.sort((a, b) => (order.get(a.field) ?? 0) - (order.get(b.field) ?? 0));

  return errors.length ? { ok: false, errors } : { ok: true, value };
}
