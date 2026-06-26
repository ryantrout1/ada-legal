/**
 * /api/portal/cases/[id]/documents
 *
 *   GET    → list documents attached to the matter.
 *   POST   → attach a document { filename, url, mime_type?, size_bytes? }.
 *            `url` is an http(s) reference (an attorney's DMS/Drive link or — once
 *            Vercel Blob is provisioned — an uploaded file's URL). Never fabricated.
 *   DELETE → detach a document (?document_id=…).
 *
 * Attorney-only, firm-scoped + consent-gated server-side. 404 when the case
 * isn't this firm's.
 *
 * Ref: Phase 5 §7.5.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAttorney } from '../../../_attorney.js';
import { applyCors } from '../../../_cors.js';
import { makeClientsFromEnv } from '../../../_shared.js';

function str(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

function isHttpUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const auth = await requireAttorney(req, res);
  if (!auth) return;

  const id =
    typeof req.query.id === 'string'
      ? req.query.id
      : Array.isArray(req.query.id)
      ? req.query.id[0]
      : null;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const clients = makeClientsFromEnv();

  try {
    if (req.method === 'GET') {
      const documents = await clients.db.listCaseDocuments(id, auth.lawFirmId);
      return res.status(200).json({ documents });
    }

    if (req.method === 'POST') {
      const b = (req.body ?? {}) as Record<string, unknown>;
      const filename = str(b.filename);
      const url = str(b.url);
      if (!filename) return res.status(400).json({ error: 'filename is required' });
      if (!url || !isHttpUrl(url)) return res.status(400).json({ error: 'url must be an http(s) link' });
      const size = typeof b.size_bytes === 'number' && Number.isFinite(b.size_bytes) ? b.size_bytes : null;
      const document = await clients.db.addCaseDocument({
        caseId: id,
        lawFirmId: auth.lawFirmId,
        filename,
        url,
        mimeType: str(b.mime_type),
        sizeBytes: size,
        uploadedBy: auth.userId ?? null,
      });
      if (!document) return res.status(404).json({ error: 'Case not found' });
      return res.status(200).json({ document });
    }

    if (req.method === 'DELETE') {
      const documentId =
        typeof req.query.document_id === 'string'
          ? req.query.document_id
          : str((req.body as { document_id?: unknown } | undefined)?.document_id);
      if (!documentId) return res.status(400).json({ error: 'document_id is required' });
      const ok = await clients.db.removeCaseDocument({
        caseId: id,
        lawFirmId: auth.lawFirmId,
        documentId,
      });
      if (!ok) return res.status(404).json({ error: 'Document not found' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('/api/portal/cases/[id]/documents failed', err);
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
}
