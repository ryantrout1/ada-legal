/**
 * Google Places client — business address standardization (v1a).
 *
 * Calls the Places API (New) Text Search endpoint over fetch, field-
 * masked to just the place id, formatted address, display name, and
 * address components (keeps the request in a cheaper SKU tier). Given a
 * business name plus whatever location the user mentioned, it returns
 * the business's canonical address so the demand letter is addressed to
 * a clean, complete street/city/state/ZIP instead of whatever the user
 * typed.
 *
 * This is the server-side "v1a" path: Ada still asks for the address
 * conversationally (no autocomplete widget, no browser-exposed key); the
 * captured value is cleaned up here before it lands in the letter.
 *
 * Scope line: this resolves the *business's own* address. It does NOT
 * look up the property owner or a registered agent — those are separate,
 * deferred capabilities.
 *
 * Retry policy mirrors ResendEmailClient: one retry on network error or
 * 5xx, no retry on 4xx (those are our bugs — bad key, bad request).
 * Returns null for "no usable match"; throws for transport/auth failure
 * so the orchestrator can record it. Enabled only when GOOGLE_MAPS_API_KEY
 * is configured.
 */

import type {
  PlacesClient,
  ResolveBusinessAddressRequest,
  ResolvedBusinessAddress,
} from './types.js';

const SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK =
  'places.id,places.formattedAddress,places.addressComponents,places.displayName';

interface PlacesAddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

interface PlacesSearchResult {
  id?: string;
  formattedAddress?: string;
  displayName?: { text?: string };
  addressComponents?: PlacesAddressComponent[];
}

interface PlacesSearchResponse {
  places?: PlacesSearchResult[];
}

/** Marks a non-retryable failure (4xx — bad key/request). */
class PlacesRequestError extends Error {}

export class GooglePlacesClient implements PlacesClient {
  constructor(private readonly apiKey: string) {}

  async resolveBusinessAddress(
    req: ResolveBusinessAddressRequest,
  ): Promise<ResolvedBusinessAddress | null> {
    const textQuery = [req.businessName, req.street, req.city, req.state]
      .filter((p): p is string => !!p && p.trim().length > 0)
      .map((p) => p.trim())
      .join(', ');
    if (!textQuery) return null;

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(SEARCH_TEXT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': FIELD_MASK,
          },
          body: JSON.stringify({ textQuery, maxResultCount: 1 }),
        });
        if (res.ok) {
          const json = (await res.json()) as PlacesSearchResponse;
          const place = json.places?.[0];
          if (!place?.id || !place.formattedAddress) return null;
          return normalizePlace(place);
        }
        // Don't retry 4xx — those are caller bugs (bad key, bad request).
        if (res.status >= 400 && res.status < 500) {
          throw new PlacesRequestError(
            `Places searchText failed: HTTP ${res.status}`,
          );
        }
        // 5xx — record and let the loop retry once.
        lastError = new Error(`Places searchText failed: HTTP ${res.status}`);
      } catch (err) {
        if (err instanceof PlacesRequestError) throw err;
        lastError = err;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error('Places searchText failed');
  }
}

function normalizePlace(place: PlacesSearchResult): ResolvedBusinessAddress {
  const comps = place.addressComponents ?? [];
  const get = (type: string, short = false): string | null => {
    const c = comps.find((x) => (x.types ?? []).includes(type));
    if (!c) return null;
    const v = short ? c.shortText : c.longText;
    return v && v.trim().length > 0 ? v.trim() : null;
  };
  const streetNumber = get('street_number');
  const route = get('route');
  const street =
    streetNumber && route
      ? `${streetNumber} ${route}`
      : (route ?? streetNumber ?? null);

  return {
    businessName: place.displayName?.text?.trim() || null,
    street,
    city: get('locality') ?? get('postal_town') ?? get('sublocality'),
    // Two-letter state code (shortText) reads better on a US letter.
    state: get('administrative_area_level_1', true),
    postalCode: get('postal_code'),
    placeId: place.id as string,
    formattedAddress: place.formattedAddress as string,
  };
}
