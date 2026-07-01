/**
 * mergeFirmPatch — pure merge of a partial admin PATCH body onto an
 * existing LawFirmRow (edit-every-detail).
 *
 * Semantics (matching the attorney patch conventions):
 *   - undefined      → keep the existing value
 *   - null / ''      → clear (nullable strings become null)
 *   - provided value → validated, then applied
 *
 * Why a pure function: the merge used to live inline in
 * api/admin/firms/[id].ts where it couldn't be unit-tested. The critical
 * invariant — an unrelated PATCH (say, {status}) must NOT wipe the
 * public-face fields (website, description, logo, location, states,
 * nationwide, practice areas) — needs a test, and this seam provides it.
 * The handler validates auth/scope and calls this for the body.
 *
 * Returns { ok: true, updated } or { ok: false, error } (the handler
 * maps error → 400).
 */

import type { LawFirmRow } from './clients/types.js';

export type FirmPatchResult =
  | { ok: true; updated: LawFirmRow }
  | { ok: false; error: string };

function isFirmStatus(
  value: unknown,
): value is 'active' | 'suspended' | 'churned' {
  return value === 'active' || value === 'suspended' || value === 'churned';
}

function optString(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v === 'string') return v;
  return undefined;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((s) => typeof s === 'string');
}

export function mergeFirmPatch(
  existing: LawFirmRow,
  body: Record<string, unknown>,
): FirmPatchResult {
  // Validation — reject malformed values outright rather than silently
  // keeping the old ones, so the admin UI hears about its bugs.
  if (body.status !== undefined && !isFirmStatus(body.status)) {
    return {
      ok: false,
      error: "status must be 'active', 'suspended', or 'churned'",
    };
  }
  if (body.is_pilot !== undefined && typeof body.is_pilot !== 'boolean') {
    return { ok: false, error: 'is_pilot must be a boolean' };
  }
  if (
    body.serves_nationwide !== undefined &&
    typeof body.serves_nationwide !== 'boolean'
  ) {
    return { ok: false, error: 'serves_nationwide must be a boolean' };
  }
  if (body.practice_areas !== undefined && !isStringArray(body.practice_areas)) {
    return { ok: false, error: 'practice_areas must be an array of strings' };
  }
  if (
    body.additional_states !== undefined &&
    !isStringArray(body.additional_states)
  ) {
    return { ok: false, error: 'additional_states must be an array of strings' };
  }
  if (
    body.name !== undefined &&
    (typeof body.name !== 'string' || !body.name.trim())
  ) {
    return { ok: false, error: 'name must be a non-empty string' };
  }

  const updated: LawFirmRow = {
    ...existing,
    name: typeof body.name === 'string' ? body.name.trim() : existing.name,
    primaryContact:
      body.primary_contact !== undefined
        ? (optString(body.primary_contact) ?? null)
        : existing.primaryContact,
    email:
      body.email !== undefined ? (optString(body.email) ?? null) : existing.email,
    phone:
      body.phone !== undefined ? (optString(body.phone) ?? null) : existing.phone,
    stripeCustomerId:
      body.stripe_customer_id !== undefined
        ? (optString(body.stripe_customer_id) ?? null)
        : existing.stripeCustomerId,
    status: isFirmStatus(body.status) ? body.status : existing.status,
    isPilot:
      typeof body.is_pilot === 'boolean' ? body.is_pilot : existing.isPilot,
    // Firm public face — same undefined-means-keep semantics.
    websiteUrl:
      body.website_url !== undefined
        ? (optString(body.website_url) ?? null)
        : (existing.websiteUrl ?? null),
    description:
      body.description !== undefined
        ? (optString(body.description) ?? null)
        : (existing.description ?? null),
    logoUrl:
      body.logo_url !== undefined
        ? (optString(body.logo_url) ?? null)
        : (existing.logoUrl ?? null),
    locationCity:
      body.location_city !== undefined
        ? (optString(body.location_city) ?? null)
        : (existing.locationCity ?? null),
    locationState:
      body.location_state !== undefined
        ? (optString(body.location_state) ?? null)
        : (existing.locationState ?? null),
    practiceAreas: isStringArray(body.practice_areas)
      ? body.practice_areas
      : (existing.practiceAreas ?? []),
    additionalStates: isStringArray(body.additional_states)
      ? body.additional_states
      : (existing.additionalStates ?? []),
    servesNationwide:
      typeof body.serves_nationwide === 'boolean'
        ? body.serves_nationwide
        : (existing.servesNationwide ?? false),
  };

  return { ok: true, updated };
}
