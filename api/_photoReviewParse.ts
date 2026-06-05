/**
 * Shared validation for photo-review submission bodies. Used by both the
 * admin endpoint (Clerk-authed) and the public endpoint (self-identified),
 * so the two paths can never drift in how they validate verdicts, labels,
 * and missed findings.
 */

import type {
  PhotoFindingLabel,
  MissedFinding,
  FindingVerdict,
  ReviewOverallVerdict,
  ReviewStatus,
} from '../src/types/db.js';

export const FINDING_VERDICTS: FindingVerdict[] = [
  'correct',
  'over_flagged',
  'partial',
  'wrong_cite',
];
export const OVERALL_VERDICTS: ReviewOverallVerdict[] = [
  'accurate',
  'missed',
  'over_flagged',
  'wrong',
  'mixed',
];
export const REVIEW_STATUSES: ReviewStatus[] = ['reviewed', 'addressed'];

export function parseStatus(raw: unknown): ReviewStatus {
  return REVIEW_STATUSES.includes(raw as ReviewStatus)
    ? (raw as ReviewStatus)
    : 'reviewed';
}

export function parseOverallVerdict(raw: unknown): ReviewOverallVerdict | null {
  return OVERALL_VERDICTS.includes(raw as ReviewOverallVerdict)
    ? (raw as ReviewOverallVerdict)
    : null;
}

export function parseFindingLabels(raw: unknown): PhotoFindingLabel[] {
  if (!Array.isArray(raw)) return [];
  const out: PhotoFindingLabel[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    if (typeof r.finding_index !== 'number') continue;
    if (!FINDING_VERDICTS.includes(r.verdict as FindingVerdict)) continue;
    out.push({
      finding_index: r.finding_index,
      verdict: r.verdict as FindingVerdict,
      reason: typeof r.reason === 'string' ? r.reason : '',
    });
  }
  return out;
}

export function parseMissedFindings(raw: unknown): MissedFinding[] {
  if (!Array.isArray(raw)) return [];
  const out: MissedFinding[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    if (typeof r.description !== 'string' || r.description.trim() === '') continue;
    out.push({
      description: r.description,
      standard: typeof r.standard === 'string' ? r.standard : undefined,
      severity:
        r.severity === 'critical' ||
        r.severity === 'major' ||
        r.severity === 'minor' ||
        r.severity === 'advisory'
          ? r.severity
          : undefined,
    });
  }
  return out;
}
