/**
 * Business-address standardization orchestrator (v1a).
 *
 * Thin, testable seam between finalizeTurn and the PlacesClient — same
 * shape as maybeSendSelfHelpEmail. Decides whether to standardize the
 * captured business address, calls the client, soft-fails into an
 * auditable session-metadata receipt, and returns the standardized
 * address (or null) for the letter to use.
 *
 * Gating — all must hold, or it's a no-op (returns null):
 *   - a PlacesClient is configured (GOOGLE_MAPS_API_KEY set)
 *   - the session is public_ada (self-help, not class-action intake)
 *   - the classification produces a letter (Title III / class_action)
 *   - a business name was captured (the search anchor)
 *
 * When it runs but finds no match (or errors), it returns null and the
 * letter falls back to the conversationally-captured address — never a
 * thrown error, never a blocked completion.
 *
 * Scope: standardizes the business's own address only. No owner /
 * registered-agent resolution.
 */

import type { Classification, ExtractedFields } from '../../types/db.js';
import type {
  PlacesClient,
  DbClient,
  ResolvedBusinessAddress,
} from '../clients/types.js';
import type { AdaSessionState } from '../types.js';

export interface BusinessAddressReceipt {
  matched: boolean;
  placeId: string | null;
  formattedAddress: string | null;
  error: string | null;
  resolvedAt: string;
}

export async function maybeResolveBusinessAddress(
  deps: { places?: PlacesClient; db: DbClient },
  state: AdaSessionState,
): Promise<ResolvedBusinessAddress | null> {
  if (!deps.places) return null;
  if (state.sessionType !== 'public_ada') return null;
  if (!letterApplies(state.classification)) return null;

  const businessName = fieldString(state.extractedFields, 'business_name');
  if (!businessName) return null;

  let resolved: ResolvedBusinessAddress | null = null;
  let receipt: BusinessAddressReceipt;
  try {
    resolved = await deps.places.resolveBusinessAddress({
      businessName,
      street: fieldString(state.extractedFields, 'business_address'),
      city: fieldString(state.extractedFields, 'location_city'),
      state: fieldString(state.extractedFields, 'location_state'),
    });
    receipt = {
      matched: resolved !== null,
      placeId: resolved?.placeId ?? null,
      formattedAddress: resolved?.formattedAddress ?? null,
      error: null,
      resolvedAt: new Date().toISOString(),
    };
  } catch (err) {
    receipt = {
      matched: false,
      placeId: null,
      formattedAddress: null,
      error: err instanceof Error ? err.message : String(err),
      resolvedAt: new Date().toISOString(),
    };
  }

  (state.metadata as Record<string, unknown>).business_address_lookup = receipt;
  await deps.db.writeSession({ state });

  return resolved;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function letterApplies(c: Classification | null): boolean {
  return !!c && (c.title === 'III' || c.title === 'class_action');
}

function fieldString(facts: ExtractedFields, key: string): string | null {
  const f = facts[key];
  if (!f || typeof f.value !== 'string') return null;
  const t = f.value.trim();
  return t.length > 0 ? t : null;
}
