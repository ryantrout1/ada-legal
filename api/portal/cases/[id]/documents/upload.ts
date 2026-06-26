/**
 * POST /api/portal/cases/[id]/documents/upload
 *
 * Client-direct-upload token endpoint for attorney matter documents, backed by
 * the PRIVATE `ada-legal-docs` Vercel Blob store. The browser's
 * @vercel/blob/client upload() helper calls this route to obtain a short-lived
 * token, then uploads the file bytes DIRECTLY to the private store (bypassing the
 * 4.5 MB Function body limit). The file is recorded in case_documents via a
 * separate POST to ../documents once upload() resolves.
 *
 * Isolation: every Blob call here passes DOCS_BLOB_READ_WRITE_TOKEN explicitly,
 * so documents always land in ada-legal-docs and never touch the public photos
 * store (which owns the ambient BLOB_READ_WRITE_TOKEN).
 *
 * Auth: the browser→us token-generation call is gated — requireAttorney + the
 * firm must own the case. The Vercel-Blob→us completion callback carries no
 * session; handleUpload() verifies its signature with the docs token, so it's
 * not abusable and is left ungated (matches api/ada/upload-photo.ts).
 *
 * Ref: Phase 5 §7.5 (native upload).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { requireAttorney } from '../../../../_attorney.js';
import { applyCors } from '../../../../_cors.js';
import { makeClientsFromEnv } from '../../../../_shared.js';

const BLOB_EVENT_GENERATE_TOKEN = 'blob.generate-client-token';

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/tiff',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

const MAX_DOC_BYTES = 50 * 1024 * 1024; // 50 MB

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
      ? req.query.id[0]
      : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const docsToken = process.env.DOCS_BLOB_READ_WRITE_TOKEN;
  if (!docsToken) {
    return res.status(503).json({ error: 'Document storage is not configured' });
  }

  try {
    const body = req.body as HandleUploadBody;

    // Gate ONLY the browser-driven token-generation call. requireAttorney +
    // verify the signed-in attorney's firm owns this case before minting a
    // token. The completion callback (server-to-server) skips this branch.
    if (body?.type === BLOB_EVENT_GENERATE_TOKEN) {
      const auth = await requireAttorney(req, res);
      if (!auth) return; // requireAttorney already wrote 401
      const clients = makeClientsFromEnv();
      const detail = await clients.db.getCaseDetailForFirm(id, auth.lawFirmId);
      if (!detail) return res.status(403).json({ error: 'Forbidden' });
    }

    const webRequest = vercelRequestToWebRequest(req);

    const jsonResponse = await handleUpload({
      body,
      request: webRequest,
      token: docsToken, // → ada-legal-docs (private), never the photos store
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        addRandomSuffix: true,
        maximumSizeInBytes: MAX_DOC_BYTES,
      }),
      onUploadCompleted: async () => {
        // No-op. The case_documents row is written by the browser's follow-up
        // POST to ../documents (itself firm-scoped + consent-gated) once
        // upload() resolves, so we don't need a DB write in this callback.
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[portal documents upload] failed:', message);
    return res.status(400).json({ error: message });
  }
}

/** Convert a Node VercelRequest into a Web API Request (mirrors api/ada/upload-photo.ts). */
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
  const reqBody =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : typeof req.body === 'string'
        ? req.body
        : req.body
          ? JSON.stringify(req.body)
          : undefined;

  return new Request(url, { method, headers, body: reqBody });
}
