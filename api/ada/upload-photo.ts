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
import { hashAnonToken, parseAnonCookie } from '../../src/lib/anonCookie.js';
import { makeClientsFromEnv } from '../_shared.js';

const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB

// @vercel/blob/client body discriminator. The same endpoint serves
// both the browser-driven token-gen call AND the Vercel-Blob-driven
// upload-completed callback; we only auth-gate the former. The latter
// is HMAC-signed by Vercel Blob and verified inside handleUpload().
const BLOB_EVENT_GENERATE_TOKEN = 'blob.generate-client-token';

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

    // Auth gate (A2). Two distinct paths land on this handler:
    //
    //   1. Browser → us: body.type === 'blob.generate-client-token'.
    //      Carries the user's `ada_anon` cookie via same-origin fetch.
    //      We require a valid cookie that resolves to an anon_sessions
    //      row before minting an upload token. Without this gate,
    //      anyone on the internet can mint a 10MB token.
    //
    //   2. Vercel Blob → us: body.type === 'blob.upload-completed'.
    //      Server-to-server callback. No user cookie. Vercel Blob
    //      signs the request body with the read-write token; the
    //      handleUpload() call below verifies that signature and
    //      throws on mismatch. We skip the cookie check on this
    //      branch — it's not abusable.
    let resolvedAnonSessionId: string | null = null;
    if (body?.type === BLOB_EVENT_GENERATE_TOKEN) {
      const cookieHeader = req.headers['cookie'] ?? null;
      const anonToken = parseAnonCookie(cookieHeader);
      if (!anonToken) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const tokenHash = await hashAnonToken(anonToken);
      const clients = makeClientsFromEnv();
      const anonSessionId = await clients.db.findAnonSessionByHash(tokenHash);
      if (!anonSessionId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      resolvedAnonSessionId = anonSessionId;
    }

    const jsonResponse = await handleUpload({
      body,
      request: webRequest,
      onBeforeGenerateToken: async (pathname, _clientPayload) => {
        // Auth already enforced above (the request reached this
        // callback only when the cookie resolved to a real anon
        // session). pathname is browser-supplied — we keep the
        // existing 'photos/<sessionId>/...' namespacing for
        // moderation/cleanup prefix matches, and let Vercel Blob
        // append a random suffix so two same-millisecond uploads
        // can't overwrite each other. The browser already uses
        // result.url from upload(), so the canonical URL is
        // returned correctly even with the random suffix.
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          addRandomSuffix: true,
          maximumSizeInBytes: MAX_PHOTO_BYTES,
          tokenPayload: JSON.stringify({
            pathname,
            anonSessionId: resolvedAnonSessionId,
          }),
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
