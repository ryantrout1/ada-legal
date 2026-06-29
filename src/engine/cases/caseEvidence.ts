/**
 * Case evidence (build-list #3): the photos on a matter and their structured
 * accessibility analyses, for the attorney workspace.
 *
 * buildCaseEvidence joins a matter's photos to their stored analyses (pure).
 * analyzeCaseEvidencePhoto runs the analyzer on a photo already on the matter
 * (claimant photos from intake); analyzeAttorneyPhoto runs it on a photo the
 * attorney just uploaded (any matter, including direct). Both fill the
 * professional reading level and persist linked to the matter. Firm-scope +
 * consent come from getCaseEvidenceForFirm; this module never bypasses it.
 */

import type { PhotoAnalysisOutput } from '../../types/db.js';
import type { DbClient, PhotoAnalysisClient } from '../clients/types.js';

export type EvidencePhotoSource = 'claimant' | 'attorney';

export interface EvidencePhoto {
  url: string;
  uploadedAt: string;
  source: EvidencePhotoSource;
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
  photos: { url: string; uploadedAt: string; source: EvidencePhotoSource }[];
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
        source: p.source,
        analysis: a?.analysis ?? null,
        analyzedAt: a?.analyzedAt ?? null,
      };
    }),
  };
}

export type AnalyzeCasePhotoResult =
  | { ok: true; analysis: PhotoAnalysisOutput }
  | { ok: false; status: number; error: string };

/** Run the analyzer on one photo, fill professional, persist linked to the matter. */
async function runAndStoreAnalysis(
  clients: { db: DbClient; photo: PhotoAnalysisClient },
  opts: {
    caseId: string;
    orgId: string;
    sessionId: string | null;
    source: EvidencePhotoSource;
    photoUrl: string;
  },
): Promise<PhotoAnalysisOutput> {
  const result = await clients.photo.analyze({ blobKeys: [opts.photoUrl] });
  // Attorneys get the most technical phrasing: fill professional from standard.
  const filled = await clients.photo.rewriteToLevel(result.output, 'professional');
  await clients.db.savePhotoAnalysis({
    sessionId: opts.sessionId,
    caseId: opts.caseId,
    source: opts.source,
    orgId: opts.orgId,
    photoUrl: opts.photoUrl,
    photoBlobKey: opts.photoUrl,
    findings: filled.findings,
    scene: filled.scene,
    summary: filled.summary,
    overallRisk: filled.overall_risk,
    positiveFindings: filled.positive_findings,
    modelVersion: result.modelVersion,
  });
  return filled;
}

/**
 * Analyze a photo already on the matter (a claimant photo from intake). The
 * photo must be one the matter already has.
 */
export async function analyzeCaseEvidencePhoto(
  clients: { db: DbClient; photo: PhotoAnalysisClient },
  opts: { caseId: string; lawFirmId: string; photoUrl: string },
): Promise<AnalyzeCasePhotoResult> {
  const evidence = await clients.db.getCaseEvidenceForFirm(opts.caseId, opts.lawFirmId);
  if (!evidence) return { ok: false, status: 404, error: 'Case not found' };
  const photo = evidence.photos.find((p) => p.url === opts.photoUrl);
  if (!photo) return { ok: false, status: 404, error: 'Photo not found on this matter' };

  // Claimant photos carry their origin session; attorney photos do not.
  const sessionId = photo.source === 'claimant' ? evidence.adaSessionId : null;
  if (photo.source === 'claimant' && !sessionId) {
    return { ok: false, status: 400, error: 'This matter has no analyzable photos' };
  }

  const analysis = await runAndStoreAnalysis(clients, {
    caseId: opts.caseId,
    orgId: evidence.orgId,
    sessionId,
    source: photo.source,
    photoUrl: opts.photoUrl,
  });
  return { ok: true, analysis };
}

/**
 * Analyze a photo the attorney just uploaded to the matter (any matter,
 * including a direct one with no claimant session). Stored with source
 * 'attorney' and a null origin session.
 */
export async function analyzeAttorneyPhoto(
  clients: { db: DbClient; photo: PhotoAnalysisClient },
  opts: { caseId: string; lawFirmId: string; photoUrl: string },
): Promise<AnalyzeCasePhotoResult> {
  const evidence = await clients.db.getCaseEvidenceForFirm(opts.caseId, opts.lawFirmId);
  if (!evidence) return { ok: false, status: 404, error: 'Case not found' };

  const analysis = await runAndStoreAnalysis(clients, {
    caseId: opts.caseId,
    orgId: evidence.orgId,
    sessionId: null,
    source: 'attorney',
    photoUrl: opts.photoUrl,
  });
  return { ok: true, analysis };
}
