/**
 * Ada Spot — free-read request parser (pure).
 *
 * The free read accepts 1–2 photos as base64 `data:image/*` URLs (the client
 * downscales + encodes; the analyzer accepts data URLs directly, so the free
 * tier never writes to Vercel Blob). Enforced here at the edge:
 *   - exactly 1–2 photos,
 *   - each a base64 image data URL (png/jpeg/webp) — NOT a remote https URL
 *     (which the analyzer would fetch server-side; free reads must not be a
 *     server-side-fetch smuggling vector),
 *   - each under a size cap (guards the Vercel request-body limit).
 *
 * Unit-testable without a req/res harness (the repo tests pure helpers).
 */

export const MAX_FREE_PHOTOS = 1;
/** Per-photo base64 char cap (~6MB decoded) — keeps the total body under Vercel's limit. */
export const MAX_PHOTO_CHARS = 8_000_000;

const IMAGE_DATA_URL_PREFIX = /^data:image\/(png|jpe?g|webp);base64,/i;

export interface SpotAnalyzeBody {
  photos?: unknown;
}

export type ParsedSpotAnalyzeBody =
  | { ok: true; photos: string[] }
  | { ok: false; status: number; error: string };

export function parseSpotAnalyzeBody(body: SpotAnalyzeBody): ParsedSpotAnalyzeBody {
  const photos = body?.photos;
  if (!Array.isArray(photos) || photos.length === 0) {
    return { ok: false, status: 400, error: 'photos must be a non-empty array' };
  }
  if (photos.length > MAX_FREE_PHOTOS) {
    return { ok: false, status: 400, error: `the free read accepts up to ${MAX_FREE_PHOTOS} photos` };
  }
  for (const p of photos) {
    if (typeof p !== 'string' || !IMAGE_DATA_URL_PREFIX.test(p)) {
      return { ok: false, status: 400, error: 'each photo must be a base64 image data URL' };
    }
    if (p.length > MAX_PHOTO_CHARS) {
      return { ok: false, status: 413, error: 'a photo is too large' };
    }
  }
  return { ok: true, photos: photos as string[] };
}
