/**
 * Ada Spot — uploaded-photo retention.
 *
 * Uploaded photos (free reads and paid reports alike) auto-delete after a
 * fixed window; the generated report/output is retained independently. The
 * authoritative default lives in SQL (spot_photo.delete_after DEFAULT
 * now() + interval '90 days'); this helper is the app-side twin for cases
 * that compute the value before insert (and is unit-tested to agree).
 *
 * Pure + deterministic. Does not mutate its input.
 */

export const SPOT_PHOTO_RETENTION_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Instant a photo captured at `from` becomes eligible for deletion. */
export function computeDeleteAfter(from: Date, days: number = SPOT_PHOTO_RETENTION_DAYS): Date {
  return new Date(from.getTime() + days * DAY_MS);
}
