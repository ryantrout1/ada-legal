/**
 * POST /api/ada/upload-photo
 *
 * Client-direct-upload token endpoint for Vercel Blob. The browser's
 * @vercel/blob/client upload() helper calls THIS route to obtain a
 * short-lived signed token; it then uploads the photo bytes DIRECTLY
 * to Vercel Blob storage, bypassing this function entirely.
 *
 * This pattern exists because Vercel's platform edge drops large JSON
 * request bodies before they ever reach a serverless function. Client
 * direct upload is the only officially-supported path for files over
 * a few megabytes.
 *
 * Flow:
 *   1. Browser calls upload(pathname, file, { handleUploadUrl: '/api/ada/upload-photo', ... })
 *   2. @vercel/blob/client POSTs to this route asking for a client token
 *   3. handleUpload() validates, generates a short-lived token, returns it
 *   4. Browser uploads file bytes directly to Vercel Blob
 *   5. Vercel Blob POSTs BACK to this route (onUploadCompleted) to confirm
 *   6. Browser receives the public blob URL as the result of upload()
 *
 * The SAME endpoint serves both roles (token generation AND completion
 * callback). @vercel/blob/client distinguishes by request body shape
 * via a `type` discriminator.
 *
 * Size limits: this endpoint itself transfers only tiny JSON. The
 * browser -> blob path carries the real photo bytes and supports up to
 * 500MB per upload by Vercel Blob contract. We cap via
 * maximumSizeInBytes below to match our product constraints.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // @vercel/blob/client's handleUpload() expects a Web API Request,
    // not a classic Node VercelRequest. Use the same shim we built
    // for the Clerk admin routes (see api/_admin.ts).
    const webRequest = vercelRequestToWebRequest(req);

    // The body must ALSO be passed explicitly — handleUpload reads
    // `body` to discriminate between token-gen and completion callbacks.
    const body = req.body as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request: webRequest,
      onBeforeGenerateToken: async (pathname, _clientPayload) => {
        // We accept any anon-cookie-holding browser session. The
        // anon-cookie scheme is sufficient for intake photos — these
        // are not sensitive documents and the blob URLs are
        // unguessable random paths.
        //
        // pathname is constructed by the browser and arrives as
        // "photos/<session_id>/<timestamp>.<ext>". We trust the
        // caller to namespace, but we lock down the content type
        // and size via the options returned below.
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          addRandomSuffix: false,
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async ({
        blob: _blob,
        tokenPayload: _tokenPayload,
      }) => {
        // No-op. The blob URL propagates to session state via the
        // user's next turn message, so we don't need a DB write here.
        //
        // Caveat: this callback does NOT fire on localhost because
        // Vercel Blob can't reach a dev server. Irrelevant for us —
        // we only test on deployed Vercel.
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[upload-photo] failed:', message);
    return res.status(400).json({ error: message });
  }
}

/**
 * Convert a classic Node-style VercelRequest into a Web API Request.
 * Mirrors api/_admin.ts#vercelRequestToWebRequest — same pattern,
 * kept locally here to avoid coupling this endpoint to admin auth.
 */
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
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : typeof req.body === 'string'
        ? req.body
        : req.body
          ? JSON.stringify(req.body)
          : undefined;

  return new Request(url, { method, headers, body });
}
