/**
 * storeFreeReadPhoto — persist the photo behind a completed free read.
 *
 * The free read receives its photo as a base64 data URL in the request body
 * and analyzes it in memory; nothing was ever stored. This keeps it: the
 * bytes go to Blob and a spot_photo row is written, parented to the read
 * (read_id, not session_id — the DB check spot_photo_one_parent allows
 * exactly one). delete_after defaults to 90 days and the nightly sweep
 * deletes by that alone, so a free-read photo gets the same retention and
 * purge as a paid one. The photo is retained to improve the analyzer.
 *
 * Best-effort by contract. The user has already been given (or is about to be
 * given) their analysis; storing the photo must never delay or fail that. Any
 * error here is logged and swallowed — a read with no stored photo is a
 * smaller loss than a read that errored because storage hiccuped.
 *
 * Guarded upstream by the spot_retain_free_photos flag; this helper is only
 * called when retention is on, so it does not re-check the flag.
 *
 * Ref: /plan store free-read photos for model training, Phase 1.
 */

import type { BlobClient } from '../../engine/clients/types.js';

/** The subset of the Spot store this helper needs. */
export interface FreeReadPhotoStore {
  insertPhoto(input: {
    sessionId?: string;
    readId?: string;
    blobKey: string;
    blobUrl: string;
  }): Promise<void>;
}

const DATA_URL_RE = /^data:(image\/(?:png|jpe?g|webp));base64,(.+)$/i;

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
};

/** Split a base64 image data URL into its content type and raw bytes. */
export function decodeImageDataUrl(
  dataUrl: string,
): { contentType: string; bytes: Uint8Array } | null {
  const m = DATA_URL_RE.exec(dataUrl);
  if (!m) return null;
  const contentType = m[1]!.toLowerCase();
  try {
    const bytes = new Uint8Array(Buffer.from(m[2]!, 'base64'));
    if (bytes.length === 0) return null;
    return { contentType, bytes };
  } catch {
    return null;
  }
}

export interface StoreFreeReadPhotoInput {
  store: FreeReadPhotoStore;
  blob: BlobClient;
  readId: string;
  /** The same data URL that was just analyzed. */
  dataUrl: string;
}

/**
 * Persist one free-read photo. Returns true if a row was written, false if it
 * was skipped or failed — either way it never throws, so the caller can await
 * it without a guard.
 */
export async function storeFreeReadPhoto(input: StoreFreeReadPhotoInput): Promise<boolean> {
  try {
    const decoded = decodeImageDataUrl(input.dataUrl);
    if (!decoded) return false;
    const ext = EXT[decoded.contentType] ?? 'bin';
    const key = `spot/free/${input.readId}.${ext}`;
    const uploaded = await input.blob.upload({
      key,
      contentType: decoded.contentType,
      body: decoded.bytes,
    });
    await input.store.insertPhoto({
      readId: input.readId,
      blobKey: uploaded.key,
      blobUrl: uploaded.url,
    });
    return true;
  } catch (err) {
    // Never surface to the user — their read already succeeded. Log so a
    // persistent blob/DB failure is visible rather than silently storing
    // zero photos.
    console.error('storeFreeReadPhoto failed', err);
    return false;
  }
}
