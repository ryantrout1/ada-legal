/**
 * Account-page field boundary (portal self-serve, /plan Phase 1).
 *
 * The owner/attorney edits their OWN profile + their firm's display fields.
 * Sensitive fields (trust state, verification, billing, identity links, ids)
 * are NEVER editable here — those stay admin-only. This is the server-side
 * gate; the client is never trusted to hide a field.
 *
 * Contract:
 *   - Body shape: { attorney?: {...}, firm?: {...} } (snake_case keys).
 *   - Any SENSITIVE key present in either sub-object => reject (caller 400s)
 *     with the offending keys listed. Nothing is written.
 *   - Allowed keys are mapped + coerced into typed patches.
 *   - Unknown/not-exposed keys (e.g. attorney firm_name, timestamps) are
 *     ignored silently — only the explicitly sensitive set is rejected.
 *
 * Pure + dependency-light so it's unit-testable in isolation (AC3).
 */

import type { UpdateAttorneyInput } from '../clients/types.js';

/** Firm display fields an owner may edit. CamelCase to match LawFirmRow. */
export interface FirmDisplayPatch {
  name?: string;
  primaryContact?: string | null;
  email?: string | null;
  phone?: string | null;
}

export type AccountPatchResult =
  | { ok: true; attorneyPatch: UpdateAttorneyInput; firmPatch: FirmDisplayPatch }
  | { ok: false; forbidden: string[] };

/** Attorney fields that must never be set via the Account page. */
const ATTORNEY_SENSITIVE = new Set([
  'status',
  'approved_by',
  'approved_at',
  'user_id',
  'law_firm_id',
  'org_id',
  'id',
]);

/** Firm fields that must never be set via the Account page. */
const FIRM_SENSITIVE = new Set([
  'status',
  'is_pilot',
  'stripe_customer_id',
  'org_id',
  'id',
]);

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

/** Trim to a non-empty string, or null. Mirrors the admin endpoint's coercion. */
function stringOrNull(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function stringArray(v: unknown, upper = false): string[] {
  if (!Array.isArray(v)) return [];
  const out = v.filter((x): x is string => typeof x === 'string').map((s) => s.trim());
  return upper ? out.map((s) => s.toUpperCase()) : out;
}

export function filterAccountPatch(body: unknown): AccountPatchResult {
  const root = asRecord(body);
  const attorneyIn = asRecord(root.attorney);
  const firmIn = asRecord(root.firm);

  const forbidden: string[] = [];
  for (const k of Object.keys(attorneyIn)) {
    if (ATTORNEY_SENSITIVE.has(k)) forbidden.push(`attorney.${k}`);
  }
  for (const k of Object.keys(firmIn)) {
    if (FIRM_SENSITIVE.has(k)) forbidden.push(`firm.${k}`);
  }
  if (forbidden.length) return { ok: false, forbidden };

  const attorneyPatch: UpdateAttorneyInput = {};
  if (typeof attorneyIn.name === 'string' && attorneyIn.name.trim()) {
    attorneyPatch.name = attorneyIn.name.trim();
  }
  if ('location_city' in attorneyIn) attorneyPatch.locationCity = stringOrNull(attorneyIn.location_city);
  if ('location_state' in attorneyIn) {
    attorneyPatch.locationState = stringOrNull(attorneyIn.location_state)?.toUpperCase() ?? null;
  }
  if ('email' in attorneyIn) attorneyPatch.email = stringOrNull(attorneyIn.email);
  if ('phone' in attorneyIn) attorneyPatch.phone = stringOrNull(attorneyIn.phone);
  if ('website_url' in attorneyIn) attorneyPatch.websiteUrl = stringOrNull(attorneyIn.website_url);
  if ('bio' in attorneyIn) attorneyPatch.bio = stringOrNull(attorneyIn.bio);
  if ('photo_url' in attorneyIn) attorneyPatch.photoUrl = stringOrNull(attorneyIn.photo_url);
  if ('bar_number' in attorneyIn) attorneyPatch.barNumber = stringOrNull(attorneyIn.bar_number);
  if (Array.isArray(attorneyIn.practice_areas)) attorneyPatch.practiceAreas = stringArray(attorneyIn.practice_areas);
  if (Array.isArray(attorneyIn.additional_states)) attorneyPatch.additionalStates = stringArray(attorneyIn.additional_states, true);
  if (Array.isArray(attorneyIn.specialty_tags)) attorneyPatch.specialtyTags = stringArray(attorneyIn.specialty_tags);
  if (typeof attorneyIn.accepting_referrals === 'boolean') attorneyPatch.acceptingReferrals = attorneyIn.accepting_referrals;
  if (typeof attorneyIn.routing_paused === 'boolean') attorneyPatch.routingPaused = attorneyIn.routing_paused;
  if ('max_active_cases' in attorneyIn) {
    const n = attorneyIn.max_active_cases;
    attorneyPatch.maxActiveCases =
      n == null || n === '' ? null : Number.isFinite(Number(n)) ? Math.trunc(Number(n)) : null;
  }

  const firmPatch: FirmDisplayPatch = {};
  if (typeof firmIn.name === 'string' && firmIn.name.trim()) firmPatch.name = firmIn.name.trim();
  if ('primary_contact' in firmIn) firmPatch.primaryContact = stringOrNull(firmIn.primary_contact);
  if ('email' in firmIn) firmPatch.email = stringOrNull(firmIn.email);
  if ('phone' in firmIn) firmPatch.phone = stringOrNull(firmIn.phone);

  return { ok: true, attorneyPatch, firmPatch };
}
