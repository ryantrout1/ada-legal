/**
 * Pure mapping for the portal litigation detail view.
 *
 * Lawyers read the *professional* copy variant; we fall back to simple, then to
 * the un-suffixed standard field where one exists, then null (the page omits
 * empty sections — honest empty, no fabrication). Kept HTTP/env-free so the
 * variant-fallback rules are unit-testable.
 */

import type { LitigationAdminRow } from '../clients/types.js';

export interface PortalLitigationDetail {
  id: string;
  kind: string;
  case_name: string;
  slug: string;
  legal_theory: string | null;
  full_description: string | null;
  eligibility: string | null;
  documentation_required: string | null;
  no_documentation_path: string | null;
  evidence_guidance: string | null;
  what_this_is_not: string | null;
  defendants: string[];
  affected_states: string[];
  court: string | null;
  docket_number: string | null;
  filing_date: string | null;
  key_dates: Record<string, string>;
  accepted: boolean;
}

/** First non-empty string in preference order, else null. */
function pick(...candidates: (string | null | undefined)[]): string | null {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) return c;
  }
  return null;
}

export function toPortalLitigationDetail(
  lit: LitigationAdminRow,
  accepted: boolean,
): PortalLitigationDetail {
  return {
    id: lit.id,
    kind: lit.kind,
    case_name: lit.caseName,
    slug: lit.slug,
    legal_theory: pick(lit.legalTheory),
    full_description: pick(
      lit.fullDescriptionProfessional,
      lit.fullDescriptionSimple,
      lit.fullDescription,
    ),
    eligibility: pick(lit.eligibilityProfessional, lit.eligibilitySimple, lit.eligibility),
    documentation_required: pick(
      lit.documentationRequiredProfessional,
      lit.documentationRequiredSimple,
    ),
    no_documentation_path: pick(
      lit.noDocumentationPathProfessional,
      lit.noDocumentationPathSimple,
    ),
    evidence_guidance: pick(lit.evidenceGuidanceProfessional, lit.evidenceGuidanceSimple),
    what_this_is_not: pick(lit.whatThisIsNotProfessional, lit.whatThisIsNotSimple),
    defendants: lit.defendants,
    affected_states: lit.affectedStates,
    court: pick(lit.court),
    docket_number: pick(lit.docketNumber),
    filing_date: lit.filingDate,
    key_dates: lit.keyDates,
    accepted,
  };
}
