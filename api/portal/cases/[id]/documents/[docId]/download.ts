/**
 * GET /api/portal/cases/[id]/documents/[docId]/download
 *
 * Streams a PRIVATE matter document from the ada-legal-docs Blob store to an
 * authorized attorney. Private blobs have no publicly-fetchable URL — this
 * Function is the only way to read them, and it re-runs the firm-scope check on
 * every request.
 *
 * Gate: requireAttorney + getCaseDocument (firm-scoped; returns null when the
 * case isn't this firm's or the doc isn't on it → 404). Only 'blob' documents
 * are streamed; 'reference' documents are external links the client opens
 * directly and must not come through here.
 *
 * The blob is fetched with DOCS_BLOB_READ_WRITE_TOKEN (never the photos token)
 * and served with Cache-Control: private, no-store — Vercel's recommendation for
 * PII, so nothing is cached on disk and the auth check runs every time.
 *
 * Ref: Phase 5 §7.5 (native upload).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { get } from '@vercel/blob';
import { requireAttorney } from '../../../../../_attorney.js';
import { applyCors } from '../../../../../_cors.js';
import { makeClientsFromEnv } from '../../../../../_shared.js';

function q(req: VercelRequest, key: string): string | null {
  const v = req.query[key];
  return typeof v === 'string' ? v : Array.isArray(v) ? v[0] ?? null : null;
}

/** Strip characters that could break the Content-Disposition header. */
function safeFilename(name: string): string {
  return name.replace(/[\r\n"\\]/g, '_').slice(0, 200) || 'document';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  const caseId = q(req, 'id');
  const docId = q(req, 'docId');
  if (!caseId || !docId) return res.status(400).json({ error: 'id and docId are required' });

  const docsToken = process.env.DOCS_BLOB_READ_WRITE_TOKEN;
  if (!docsToken) return res.status(503).json({ error: 'Document storage is not configured' });

  try {
    const clients = makeClientsFromEnv();
    const doc = await clients.db.getCaseDocument(caseId, auth.lawFirmId, docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.storageKind !== 'blob') {
      return res.status(400).json({ error: 'Document is an external reference, not a stored file' });
    }

    const result = await get(doc.url, { access: 'private', token: docsToken });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return res.status(404).json({ error: 'File not found in storage' });
    }

    // Buffer the private blob and send. Pilot documents are modest in size; if
    // large files become common, switch to a streamed pipe.
    const bytes = Buffer.from(await new Response(result.stream).arrayBuffer());

    // Defense-in-depth: never serve active content inline from our origin. The
    // upload allow-list already excludes text/html and image/svg+xml; if one
    // ever slips through, neutralize the type and force a download.
    const ct = result.blob.contentType || 'application/octet-stream';
    const dangerous = ct.startsWith('text/html') || ct === 'image/svg+xml' || ct.includes('xhtml');
    const inlineSafe =
      !dangerous &&
      (ct === 'application/pdf' || ct === 'text/plain' || (ct.startsWith('image/') && ct !== 'image/svg+xml'));

    res.setHeader('Content-Type', dangerous ? 'application/octet-stream' : ct);
    res.setHeader('Content-Disposition', `${inlineSafe ? 'inline' : 'attachment'}; filename="${safeFilename(doc.filename)}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(bytes);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[portal documents download] failed:', message);
    return res.status(500).json({ error: message });
  }
}
