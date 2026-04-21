/**
 * POST /api/ada/upload-photo
 *
 * Receives a photo from the frontend, stores it in Vercel Blob under
 * a session-scoped key, returns the public URL. The frontend then
 * sends the URL as a short token in the next /api/ada/turn call
 * (the analyze_photo tool accepts http(s) URLs per Step 10 contract).
 *
 * Request body (JSON):
 *   {
 *     "session_id": "<uuid>",                       // for key namespacing
 *     "content_type": "image/jpeg",                 // or image/png, image/webp, image/gif
 *     "data": "<base64-encoded-bytes-only>"          // NO "data:...;base64," prefix
 *   }
 *
 * Response:
 *   200 OK
 *   {
 *     "url": "https://...blob.vercel-storage.com/...",
 *     "key": "photos/<session_id>/<timestamp>.<ext>"
 *   }
 *
 * Errors:
 *   400 — missing/invalid body, unsupported content type, photo too large
 *   405 — method not POST
 *   500 — blob upload failure or BLOB_READ_WRITE_TOKEN not configured
 *
 * Size limit: 10 MB of raw photo bytes (body-parser accepts ~14 MB of
 * base64 which decodes to ~10 MB — the lambda gets 15 MB headroom).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { makeClientsFromEnv, readJsonBody } from '../_shared.js';

interface Body {
  session_id?: string;
  content_type?: string;
  data?: string;
}

// A photo is large; the lambda needs headroom for base64 overhead.
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb',
    },
  },
};

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const EXT_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = readJsonBody<Body>(req);

    if (typeof body.session_id !== 'string' || !body.session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }
    if (typeof body.content_type !== 'string' || !body.content_type) {
      return res.status(400).json({ error: 'content_type is required' });
    }
    if (!ALLOWED_CONTENT_TYPES.has(body.content_type)) {
      return res.status(400).json({
        error: `unsupported content_type; allowed: ${Array.from(
          ALLOWED_CONTENT_TYPES,
        ).join(', ')}`,
      });
    }
    if (typeof body.data !== 'string' || !body.data) {
      return res.status(400).json({ error: 'data (base64) is required' });
    }

    // Decode base64 and enforce a hard byte limit.
    let bytes: Uint8Array;
    try {
      const buf = Buffer.from(body.data, 'base64');
      bytes = new Uint8Array(buf);
    } catch {
      return res.status(400).json({ error: 'data is not valid base64' });
    }
    if (bytes.length === 0) {
      return res.status(400).json({ error: 'data is empty' });
    }
    if (bytes.length > MAX_PHOTO_BYTES) {
      return res.status(400).json({
        error: `photo too large: ${bytes.length} bytes (max ${MAX_PHOTO_BYTES})`,
      });
    }

    // Key namespaces photos by session and timestamp. Keeps blobs
    // discoverable for moderation review and makes cleanup per-session
    // straightforward.
    const ext = EXT_BY_CONTENT_TYPE[body.content_type];
    const key = `photos/${body.session_id}/${Date.now()}.${ext}`;

    const clients = makeClientsFromEnv();
    const result = await clients.blob.upload({
      key,
      contentType: body.content_type,
      body: bytes,
    });

    return res.status(200).json({ url: result.url, key: result.key });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[upload-photo] failed:', message);
    return res.status(500).json({ error: message });
  }
}
