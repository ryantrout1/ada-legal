/**
 * Unit — portal litigation detail mapper (variant fallback + accepted flag).
 *
 * Lawyers read the professional variant; the mapper falls back simple → standard
 * → null, and empty/whitespace strings count as absent (the page omits empty
 * sections). Also verifies the firm's accepted flag passes through untouched.
 */

import { describe, it, expect } from 'vitest';
import { toPortalLitigationDetail } from '@/engine/portal/litigationDetail';
import type { LitigationAdminRow } from '@/engine/clients/types';

function makeAdminRow(overrides: Partial<LitigationAdminRow> = {}): LitigationAdminRow {
  return {
    id: 'lit-1',
    kind: 'class',
    caseName: 'Smith v. Acme Corp',
    slug: 'smith-v-acme-corp',
    legalTheory: null,
    shortDescription: null,
    shortDescriptionSimple: null,
    shortDescriptionProfessional: null,
    fullDescription: null,
    fullDescriptionSimple: null,
    fullDescriptionProfessional: null,
    eligibility: null,
    eligibilitySimple: null,
    eligibilityProfessional: null,
    documentationRequiredSimple: null,
    documentationRequiredProfessional: null,
    noDocumentationPathSimple: null,
    noDocumentationPathProfessional: null,
    evidenceGuidanceSimple: null,
    evidenceGuidanceProfessional: null,
    whatThisIsNotSimple: null,
    whatThisIsNotProfessional: null,
    defendants: [],
    court: null,
    docketNumber: null,
    affectedStates: [],
    filingDate: null,
    keyDates: {},
    relatedListingIds: [],
    adaQualifyingQuestions: {},
    leadAttorneyId: null,
    leadFirmId: null,
    status: 'active',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  };
}

describe('toPortalLitigationDetail', () => {
  it('prefers the professional variant for full description', () => {
    const out = toPortalLitigationDetail(
      makeAdminRow({
        fullDescriptionProfessional: 'pro',
        fullDescriptionSimple: 'simple',
        fullDescription: 'standard',
      }),
      false,
    );
    expect(out.full_description).toBe('pro');
  });

  it('falls back simple → standard when professional is absent', () => {
    expect(
      toPortalLitigationDetail(
        makeAdminRow({ fullDescriptionSimple: 'simple', fullDescription: 'standard' }),
        false,
      ).full_description,
    ).toBe('simple');
    expect(
      toPortalLitigationDetail(makeAdminRow({ fullDescription: 'standard' }), false)
        .full_description,
    ).toBe('standard');
  });

  it('treats empty / whitespace strings as absent → null', () => {
    const out = toPortalLitigationDetail(
      makeAdminRow({ eligibilityProfessional: '   ', eligibilitySimple: 'real' }),
      false,
    );
    expect(out.eligibility).toBe('real');
    expect(
      toPortalLitigationDetail(makeAdminRow({ whatThisIsNotProfessional: '' }), false)
        .what_this_is_not,
    ).toBeNull();
  });

  it('documentation/evidence/what-not have no standard variant (simple is the floor)', () => {
    const out = toPortalLitigationDetail(
      makeAdminRow({
        documentationRequiredProfessional: 'doc-pro',
        evidenceGuidanceSimple: 'ev-simple',
        whatThisIsNotProfessional: 'not-pro',
      }),
      false,
    );
    expect(out.documentation_required).toBe('doc-pro');
    expect(out.evidence_guidance).toBe('ev-simple');
    expect(out.what_this_is_not).toBe('not-pro');
  });

  it('passes the firm accepted flag through and maps scalar fields', () => {
    const out = toPortalLitigationDetail(
      makeAdminRow({ caseName: 'X v. Y', defendants: ['Y'], court: 'N.D. Cal.' }),
      true,
    );
    expect(out.accepted).toBe(true);
    expect(out.case_name).toBe('X v. Y');
    expect(out.defendants).toEqual(['Y']);
    expect(out.court).toBe('N.D. Cal.');
  });
});
