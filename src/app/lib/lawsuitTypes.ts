/**
 * The public lawsuit row as `/api/public/litigation` returns it.
 *
 * Declared once here rather than inline in each component so the browse
 * page, the card, and (in Phase 3) the detail page cannot drift from
 * each other. Only the fields the public surfaces actually render are
 * listed — the payload carries more (see the note below).
 *
 * NOT DECLARED, DELIBERATELY: `adaQualifyingQuestions`, `leadAttorneyId`,
 * and `leadFirmId`. The endpoint returns them and the additive-only rule
 * bars removing them before cutover, but no public surface renders them
 * — B44's own page comments say the same. Leaving them off this type
 * makes rendering one a compile error rather than an oversight.
 */

export interface PublicLawsuitRow {
  id: string;
  kind: string;
  status: string;
  caseName: string;
  slug: string;
  legalTheory: string | null;
  shortDescription: string | null;
  shortDescriptionSimple: string | null;
  shortDescriptionProfessional: string | null;
  defendants: string[];
  court: string | null;
  docketNumber: string | null;
  affectedStates: string[];
  filingDate: string | null;
}

export interface PublicLitigationListResponse {
  litigation: PublicLawsuitRow[];
  total_count: number;
}

/**
 * The detail payload from /api/public/litigation/:slug.
 *
 * Extends the list row with the prose blocks, the resolved lead
 * attorney name, and the inlined related cases. The four
 * `*Simple` / `*Professional` guidance pairs have NO standard column —
 * they are Neon-only fields with no Base44 counterpart, preserved
 * through the M0 reconciliation and rendered via pickSimpleProText.
 */
export interface PublicLawsuitDetailRow extends PublicLawsuitRow {
  fullDescription: string | null;
  fullDescriptionSimple: string | null;
  fullDescriptionProfessional: string | null;
  eligibility: string | null;
  eligibilitySimple: string | null;
  eligibilityProfessional: string | null;
  documentationRequiredSimple: string | null;
  documentationRequiredProfessional: string | null;
  noDocumentationPathSimple: string | null;
  noDocumentationPathProfessional: string | null;
  evidenceGuidanceSimple: string | null;
  evidenceGuidanceProfessional: string | null;
  whatThisIsNotSimple: string | null;
  whatThisIsNotProfessional: string | null;
  keyDates: Record<string, string>;
  leadAttorneyName: string | null;
  relatedCases: RelatedLawsuit[];
}

export interface RelatedLawsuit {
  id: string;
  slug: string;
  caseName: string;
  kind: string;
  status: string;
}

export interface PublicLitigationDetailResponse {
  litigation: PublicLawsuitDetailRow;
}
