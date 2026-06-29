/**
 * Case evidence (build-list #3): the photos on a matter and their structured
 * accessibility analyses, for the attorney workspace.
 *
 * buildCaseEvidence joins a matter's photos to their stored analyses (pure).
 * analyzeCaseEvidencePhoto runs the structured analyzer on one matter photo,
 * fills the professional reading level, and persists it linked to the matter.
 * Firm-scope + consent are enforced by getCaseEvidenceForFirm (the read this
 * builds on); this module never bypasses that gate.
 */

import type { AttachedPhoto, PhotoAnalysisOutput } from '../../types/db.js';
import type { DbClient, PhotoAnalysisClient } from '../clients/types.js';

export interface EvidencePhoto {
  url: string;
  uploadedAt: string;
  /** The stored structured analysis for this photo, or null if not yet run. */
  analysis: PhotoAnalysisOutput | null;
  analyzedAt: string | null;
}

/** Firm-scoped evidence for one matter. Internal shape; the API maps to snake_case. */
export interface CaseEvidence {
  caseId: string;
  orgId: string;
  adaSessionId: string | null;
  photos: EvidencePhoto[];
}

/**
 * Join a matter's photos to their analyses. A photo with no analysis carries
 * analysis: null. If a photo was analyzed more than once, the most recent
 * analysis wins.
 */
export function buildCaseEvidence(input: {
  caseId: string;
  orgId: string;
  adaSessionId: string | null;
  photos: AttachedPhoto[];
  analyses: { photoUrl: string; analysis: PhotoAnalysisOutput; analyzedAt: string }[];
}): CaseEvidence {
  const byUrl = new Map<string, { analysis: PhotoAnalysisOutput; analyzedAt: string }>();
  // Ascending by analyzedAt so the latest analysis overwrites an earlier one.
  for (const a of [...input.analyses].sort((x, y) => (x.analyzedAt < y.analyzedAt ? -1 : 1))) {
    byUrl.set(a.photoUrl, { analysis: a.analysis, analyzedAt: a.analyzedAt });
  }
  return {
    caseId: input.caseId,
    orgId: input.orgId,
    adaSessionId: input.adaSessionId,
    photos: input.photos.map((p) => {
      const a = byUrl.get(p.url);
      return {
        url: p.url,
        uploadedAt: p.uploadedAt,
        analysis: a?.analysis ?? null,
        analyzedAt: a?.analyzedAt ?? null,
      };
    }),
  };
}

export type AnalyzeCasePhotoResult =
  | { ok: true; analysis: PhotoAnalysisOutput }
  | { ok: false; status: number; error: string };

/**
 * Run the structured analyzer on one of a matter's photos for the attorney,
 * fill the professional reading level, and persist it linked to the matter.
 * Firm-scope + consent come from getCaseEvidenceForFirm; the photo must be one
 * the matter already has (claimant photos in Phase 1).
 */
export async function analyzeCaseEvidencePhoto(
  clients: { db: DbClient; photo: PhotoAnalysisClient },
  opts: { caseId: string; lawFirmId: string; photoUrl: string },
): Promise<AnalyzeCasePhotoResult> {
  const evidence = await clients.db.getCaseEvidenceForFirm(opts.caseId, opts.lawFirmId);
  if (!evidence) return { ok: false, status: 404, error: 'Case not found' };
  if (!evidence.photos.some((p) => p.url === opts.photoUrl)) {
    return { ok: false, status: 404, error: 'Photo not found on this matter' };
  }
  if (!evidence.adaSessionId) {
    return { ok: false, status: 400, error: 'This matter has no analyzable photos' };
  }

  const result = await clients.photo.analyze({ blobKeys: [opts.photoUrl] });
  // Attorneys get the most technical phrasing: fill professional from standard.
  const filled = await clients.photo.rewriteToLevel(result.output, 'professional');

  await clients.db.savePhotoAnalysis({
    sessionId: evidence.adaSessionId,
    caseId: opts.caseId,
    orgId: evidence.orgId,
    photoUrl: opts.photoUrl,
    photoBlobKey: opts.photoUrl,
    findings: filled.findings,
    scene: filled.scene,
    summary: filled.summary,
    overallRisk: filled.overall_risk,
    positiveFindings: filled.positive_findings,
    modelVersion: result.modelVersion,
  });

  return { ok: true, analysis: filled };
}
