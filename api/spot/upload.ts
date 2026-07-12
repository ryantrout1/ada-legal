/**
 * POST /api/spot/upload
 *
 * Vercel Blob client-direct-upload token endpoint for paid Ada Spot photos.
 * Same dual-role shape as /api/ada/upload-photo: the browser's
 * @vercel/blob/client upload() calls this to mint a short-lived token, then
 * uploads bytes straight to Blob; Blob then calls back here (server-to-server,
 * HMAC-verified by handleUpload) on completion.
 *
 * The gate is server-side and paid-only: a token is minted only when the
 * client-supplied spot_session is actually `paid` (per the DB, advanced only
 * by the verified webhook) and under the 10-photo cap. The client is never
 * trusted for paid-state.
 *
 * Firewall: net-new endpoint over spot_* tables; the bench upload path is
 * untouched.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { applyCors } from '../_cors.js';
import { makeClientsFromEnv } from '../_shared.js';
import { readSpotEnabled } from '../../src/lib/spot/spotAvailability.js';
import { makeSpotStore } from '../../src/lib/spot/spotStore.js';
import { canAcceptSpotUpload } from '../../src/lib/spot/uploadGate.js';

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
const BLOB_EVENT_GENERATE_TOKEN = 'blob.generate-client-token';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webRequest = vercelRequestToWebRequest(req);
    const body = req.body as HandleUploadBody;

    // Kill switch — only on the token-mint branch (the completion callback is
    // server-to-server and must finish an already-authorized upload).
    if (body?.type === BLOB_EVENT_GENERATE_TOKEN) {
      const clients = makeClientsFromEnv();
      if (!(await readSpotEnabled(clients.db))) {
        res.setHeader('Retry-After', '3600');
        return res.status(503).json({ error: 'Ada Spot is currently unavailable.' });
      }
    }

    const jsonResponse = await handleUpload({
      body,
      request: webRequest,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Paid gate — throwing here makes handleUpload return an error (no token).
        let spotSessionId = '';
        try {
          spotSessionId = String(JSON.parse(clientPayload ?? '{}').spotSessionId ?? '');
        } catch {
          throw new Error('invalid client payload');
        }
        if (!spotSessionId) throw new Error('missing spotSessionId');

        const store = makeSpotStore();
        const session = await store.getSession(spotSessionId);
        const currentCount = await store.countPhotos(spotSessionId);
        const gate = canAcceptSpotUpload(session?.status, currentCount);
        if (!gate.ok) throw new Error(gate.reason);

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          tokenPayload: JSON.stringify({ spotSessionId, pathname }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Server-to-server callback (does NOT fire on localhost — only on
        // deployed Vercel). Record the photo against its paid session.
        let spotSessionId = '';
        try {
          spotSessionId = String(JSON.parse(tokenPayload ?? '{}').spotSessionId ?? '');
        } catch {
          spotSessionId = '';
        }
        if (spotSessionId) {
          await makeSpotStore().insertPhoto({
            sessionId: spotSessionId,
            blobKey: blob.pathname,
            blobUrl: blob.url,
          });
        }
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[spot/upload] failed:', message);
    return res.status(400).json({ error: message });
  }
}

/** Convert a classic Node VercelRequest into a Web API Request (mirrors upload-photo.ts). */
function vercelRequestToWebRequest(req: VercelRequest): Request {
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  const host = (req.headers['host'] as string) ?? 'localhost';
  const url = `${proto}://${host}${req.url ?? '/'}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (typeof value === 'string') {
      headers.set(key, value);
    }
  }

  const method = req.method ?? 'GET';
  const bodyInit =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body ?? {});

  return new Request(url, { method, headers, body: bodyInit });
}
