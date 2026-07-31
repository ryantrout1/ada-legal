/**
 * Persisting the photo behind a free read.
 *
 * The free read used to keep nothing — the photo arrived as a data URL, was
 * analyzed in memory, and vanished. This pins the change that keeps it: the
 * bytes land in Blob and a spot_photo row is written parented to the read
 * (read_id, session_id null), so it can be used to improve the analyzer and
 * is swept after 90 days like a paid photo.
 *
 * The store here is a small fake and the blob client is the in-memory one, so
 * the property under test is the orchestration — decode, upload, insert with
 * the right parent — not the live DB (spot_photo lifecycle is covered against
 * a real branch in spotPhotoLifecycle.test.ts).
 *
 * Ref: /plan store free-read photos for model training, Phase 1, criteria 1,
 * 2, 4.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryBlobClient } from '@/engine/clients/inMemoryClients';
import {
  storeFreeReadPhoto,
  decodeImageDataUrl,
  type FreeReadPhotoStore,
} from '@/lib/spot/storeFreeReadPhoto';

// A 1x1 PNG, the smallest valid image; the bytes only have to round-trip.
const PNG_1X1 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

interface PhotoRow {
  sessionId?: string;
  readId?: string;
  blobKey: string;
  blobUrl: string;
}

function fakeStore(): FreeReadPhotoStore & { rows: PhotoRow[] } {
  const rows: PhotoRow[] = [];
  return {
    rows,
    async insertPhoto(input) {
      rows.push(input);
    },
  };
}

describe('storeFreeReadPhoto', () => {
  it('uploads the photo and writes a read-parented row', async () => {
    const store = fakeStore();
    const blob = new InMemoryBlobClient();

    const ok = await storeFreeReadPhoto({ store, blob, readId: 'read-1', dataUrl: PNG_1X1 });

    expect(ok).toBe(true);
    expect(store.rows).toHaveLength(1);
    const row = store.rows[0]!;
    // Parented to the read, never the session — the DB check allows one.
    expect(row.readId).toBe('read-1');
    expect(row.sessionId).toBeUndefined();
    expect(row.blobKey).toBe('spot/free/read-1.png');
    // The bytes actually reached the blob store under that key.
    expect(blob.blobs.has('spot/free/read-1.png')).toBe(true);
  });

  it('keeps N reads to N rows, each on its own read', async () => {
    const store = fakeStore();
    const blob = new InMemoryBlobClient();

    await storeFreeReadPhoto({ store, blob, readId: 'read-a', dataUrl: PNG_1X1 });
    await storeFreeReadPhoto({ store, blob, readId: 'read-b', dataUrl: PNG_1X1 });

    expect(store.rows.map((r) => r.readId).sort()).toEqual(['read-a', 'read-b']);
    // No cross-linking: each row's key names its own read.
    expect(store.rows.find((r) => r.readId === 'read-a')!.blobKey).toBe('spot/free/read-a.png');
    expect(store.rows.find((r) => r.readId === 'read-b')!.blobKey).toBe('spot/free/read-b.png');
  });

  it('is best-effort: a blob failure writes no row and does not throw', async () => {
    const store = fakeStore();
    const blob: InMemoryBlobClient = new InMemoryBlobClient();
    // Make the upload reject, standing in for a real Blob outage.
    blob.upload = async () => {
      throw new Error('blob down');
    };

    const ok = await storeFreeReadPhoto({ store, blob, readId: 'read-1', dataUrl: PNG_1X1 });

    expect(ok).toBe(false);
    expect(store.rows).toHaveLength(0);
  });

  it('skips a body that is not a valid image data URL', async () => {
    const store = fakeStore();
    const blob = new InMemoryBlobClient();

    const ok = await storeFreeReadPhoto({
      store,
      blob,
      readId: 'read-1',
      dataUrl: 'not-a-data-url',
    });

    expect(ok).toBe(false);
    expect(store.rows).toHaveLength(0);
  });
});

describe('decodeImageDataUrl', () => {
  it('pulls content type and non-empty bytes from a valid data URL', () => {
    const decoded = decodeImageDataUrl(PNG_1X1);
    expect(decoded).not.toBeNull();
    expect(decoded!.contentType).toBe('image/png');
    expect(decoded!.bytes.length).toBeGreaterThan(0);
  });

  it('rejects a non-image or malformed data URL', () => {
    expect(decodeImageDataUrl('data:text/plain;base64,aGk=')).toBeNull();
    expect(decodeImageDataUrl('data:image/png;base64,')).toBeNull();
    expect(decodeImageDataUrl('nonsense')).toBeNull();
  });
});
