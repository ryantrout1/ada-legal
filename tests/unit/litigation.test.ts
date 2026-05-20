/**
 * Tests for Phase 6a — public litigation browse + Ada context-passing.
 *
 * Covers:
 *   1. listActiveLitigation `search` filter (case-insensitive, matches
 *      case_name + eligibility + short_description)
 *   2. readActiveLitigationBySlug (happy / miss / non-active)
 *   3. renderFocusedLitigation prompt block
 *   4. buildLitigationSection with focused row — focused appears, doesn't
 *      duplicate in the index
 *
 * Ref: /plan Phase 6a
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { renderActiveLitigationIndex, renderFocusedLitigation } from '@/engine/prompt/litigationContext';
import type { LitigationRow } from '@/engine/clients/types';

const ATTORNEY_ID = '10000000-0000-4000-8000-00000000a001';

function makeRow(overrides: Partial<LitigationRow> = {}): LitigationRow {
  return {
    id: '20000000-0000-4000-8000-000000000001',
    kind: 'class',
    caseName: 'Smith v. Acme Corp',
    slug: 'smith-v-acme-corp',
    legalTheory: null,
    shortDescription: 'Rideshare denied wheelchair-using passengers across multiple cities.',
    shortDescriptionSimple: null,
    shortDescriptionProfessional: null,
    fullDescription:
      'Detailed allegations that Acme rideshare drivers refused to transport wheelchair-using passengers and charged improper cleaning fees.',
    fullDescriptionSimple: null,
    fullDescriptionProfessional: null,
    eligibility:
      'Anyone who used Acme rideshare between 2023 and 2025 and was denied service or charged a fee related to a wheelchair.',
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
    defendants: ['Acme Corp', 'Acme Rideshare LLC'],
    court: 'N.D. Cal.',
    docketNumber: '3:24-cv-01234',
    affectedStates: ['CA', 'AZ', 'NV'],
    filingDate: '2024-03-15',
    keyDates: {},
    relatedListingIds: [],
    adaQualifyingQuestions: {},
    leadAttorneyId: ATTORNEY_ID,
    leadFirmId: null,
    ...overrides,
  };
}

describe('listActiveLitigation — search filter (Phase 6a)', () => {
  it('matches case_name case-insensitively', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'class',
      caseName: 'Smith v. Acme Corp',
      slug: 'smith-v-acme-corp',
      eligibility: 'Riders who used the service.',
      status: 'active',
    });
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'class',
      caseName: 'Jones v. Beta Inc',
      slug: 'jones-v-beta-inc',
      eligibility: 'Customers harmed by the product.',
      status: 'active',
    });

    const rows = await c.db.listActiveLitigation({ search: 'acme' });
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe('smith-v-acme-corp');

    // Case-insensitive — uppercase query hits same row.
    const upperRows = await c.db.listActiveLitigation({ search: 'ACME' });
    expect(upperRows).toHaveLength(1);
  });

  it('matches eligibility text', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'class',
      caseName: 'Smith v. Acme Corp',
      slug: 'smith-v-acme-corp',
      eligibility: 'Anyone who used a wheelchair and was denied service.',
      status: 'active',
    });
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'class',
      caseName: 'Jones v. Beta Inc',
      slug: 'jones-v-beta-inc',
      eligibility: 'Customers harmed by a defective product.',
      status: 'active',
    });

    const rows = await c.db.listActiveLitigation({ search: 'wheelchair' });
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe('smith-v-acme-corp');
  });

  it('matches short_description text', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'class',
      caseName: 'Foo v. Bar',
      slug: 'foo-v-bar',
      shortDescription: 'Hotels failed to provide accessible rooms.',
      eligibility: 'Stayed at affected hotels.',
      status: 'active',
    });
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'class',
      caseName: 'Baz v. Qux',
      slug: 'baz-v-qux',
      shortDescription: 'Restaurants charged improper fees.',
      eligibility: 'Dined at affected restaurants.',
      status: 'active',
    });

    const rows = await c.db.listActiveLitigation({ search: 'hotel' });
    expect(rows).toHaveLength(1);
    expect(rows[0].slug).toBe('foo-v-bar');
  });

  it('returns empty array when search matches nothing', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'class',
      caseName: 'Smith v. Acme Corp',
      slug: 'smith-v-acme-corp',
      eligibility: 'Riders who used the service.',
      status: 'active',
    });
    const rows = await c.db.listActiveLitigation({ search: 'nonexistent-zzz' });
    expect(rows).toHaveLength(0);
  });

  it('search composes with kind filter', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'class',
      caseName: 'Acme Class Action',
      slug: 'acme-class',
      eligibility: 'Riders.',
      status: 'active',
    });
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'enforcement_action',
      caseName: 'Acme Mass Action',
      slug: 'acme-mass',
      eligibility: 'Riders.',
      status: 'active',
    });

    const classOnly = await c.db.listActiveLitigation({
      search: 'acme',
      kind: 'class',
    });
    expect(classOnly).toHaveLength(1);
    expect(classOnly[0].slug).toBe('acme-class');
  });
});

describe('readActiveLitigationBySlug (Phase 6a)', () => {
  it('returns row + leadAttorneyName when active and slug matches', async () => {
    const c = makeInMemoryClients();
    const attorney = await c.db.createAttorney({
      orgId: 'unused',
      name: 'Jane Roe, Esq.',
      practiceAreas: ['ADA'],
      status: 'approved',
    });
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'class',
      caseName: 'Smith v. Acme Corp',
      slug: 'smith-v-acme-corp',
      eligibility: 'Riders.',
      leadAttorneyId: attorney.id,
      status: 'active',
    });

    const result = await c.db.readActiveLitigationBySlug({
      orgId: 'unused',
      slug: 'smith-v-acme-corp',
    });
    expect(result).not.toBeNull();
    expect(result!.slug).toBe('smith-v-acme-corp');
    expect(result!.caseName).toBe('Smith v. Acme Corp');
    expect(result!.leadAttorneyName).toBe('Jane Roe, Esq.');
  });

  it('returns leadAttorneyName=null when leadAttorneyId is unset', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'enforcement_action',
      caseName: 'Foo v. Bar',
      slug: 'foo-v-bar',
      eligibility: 'Affected parties.',
      status: 'active',
    });
    const result = await c.db.readActiveLitigationBySlug({
      orgId: 'unused',
      slug: 'foo-v-bar',
    });
    expect(result).not.toBeNull();
    expect(result!.leadAttorneyName).toBeNull();
  });

  it('returns null when slug does not exist', async () => {
    const c = makeInMemoryClients();
    const result = await c.db.readActiveLitigationBySlug({
      orgId: 'unused',
      slug: 'does-not-exist',
    });
    expect(result).toBeNull();
  });

  it('returns null when matching row is not active (draft/settled/closed/archived)', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'class',
      caseName: 'Draft Case',
      slug: 'draft-case',
      eligibility: 'TBD.',
      status: 'draft',
    });
    await c.db.createLitigation({
      orgId: 'unused',
      kind: 'class',
      caseName: 'Closed Case',
      slug: 'closed-case',
      eligibility: 'Past.',
      status: 'closed',
    });
    expect(
      await c.db.readActiveLitigationBySlug({ orgId: 'unused', slug: 'draft-case' }),
    ).toBeNull();
    expect(
      await c.db.readActiveLitigationBySlug({ orgId: 'unused', slug: 'closed-case' }),
    ).toBeNull();
  });
});

describe('renderFocusedLitigation (Phase 6a)', () => {
  it('emits a focused intro block mentioning the case name and kind', () => {
    const row = makeRow();
    const out = renderFocusedLitigation(row);
    expect(out).toContain('Smith v. Acme Corp');
    expect(out).toContain('class action');
    // Should indicate the user came in already interested in this case.
    expect(out.toLowerCase()).toMatch(/already interested|came in about|starting point/);
  });

  it('renders enforcement_action kind label as "DOJ enforcement"', () => {
    const row = makeRow({
      caseName: 'United States v. PharmaCo',
      kind: 'enforcement_action',
      slug: 'us-v-pharmaco',
    });
    const out = renderFocusedLitigation(row);
    expect(out).toContain('DOJ enforcement');
    expect(out).not.toContain('class action');
    // Phase C3b-i: 'mass action' is the stale binary label — must be gone.
    expect(out).not.toContain('mass action');
  });

  // Phase C3b-i: every kind in the LitigationKind enum gets a stable,
  // human-readable label in the focused block. The pre-C3b renderer used
  // a 'class' ? 'class action' : 'mass action' ternary that mislabeled
  // every non-class row.
  it('renders all 5 kinds with the correct labels', () => {
    const cases: Array<[LitigationRow['kind'], string]> = [
      ['class', 'class action'],
      ['enforcement_action', 'DOJ enforcement'],
      ['consent_decree', 'consent decree'],
      ['pattern_of_practice', 'pattern of practice'],
      ['regulatory_challenge', 'regulatory challenge'],
    ];
    for (const [kind, label] of cases) {
      const row = makeRow({ kind });
      const out = renderFocusedLitigation(row);
      expect(
        out,
        `kind=${kind} should produce label "${label}"`,
      ).toContain(label);
    }
  });

  it('includes eligibility and defendants when present', () => {
    const row = makeRow();
    const out = renderFocusedLitigation(row);
    expect(out).toContain('Acme Corp');
    expect(out.toLowerCase()).toContain('wheelchair');
  });

  it('gracefully omits missing fields', () => {
    const row = makeRow({
      eligibility: null,
      defendants: [],
      court: null,
      docketNumber: null,
      affectedStates: [],
      filingDate: null,
    });
    const out = renderFocusedLitigation(row);
    // Should still produce a usable block — at minimum the case name lead.
    expect(out).toContain('Smith v. Acme Corp');
    expect(out.length).toBeGreaterThan(50);
  });
});

/**
 * Phase C3b-i — renderActiveLitigationIndex kind-label coverage.
 *
 * The pre-C3b implementation used a `kind === 'class' ? 'class action'
 * : 'mass action'` ternary, which mislabeled every non-class row.
 * Phase C3b-i replaces it with a 5-way map matching the LitigationKind
 * enum (class | enforcement_action | consent_decree |
 * pattern_of_practice | regulatory_challenge).
 *
 * Ref: /plan Plan C, Phase C3b-i, acceptance criterion 2.
 */
describe('renderActiveLitigationIndex kind labels (Phase C3b-i)', () => {
  it('emits one row per litigation item with the correct kind label', () => {
    const rows: LitigationRow[] = [
      makeRow({
        id: '20000000-0000-4000-8000-00000000a001',
        kind: 'class',
        caseName: 'Class Action Case',
        slug: 'class-case',
      }),
      makeRow({
        id: '20000000-0000-4000-8000-00000000a002',
        kind: 'enforcement_action',
        caseName: 'DOJ Enforcement Case',
        slug: 'enf-case',
      }),
      makeRow({
        id: '20000000-0000-4000-8000-00000000a003',
        kind: 'consent_decree',
        caseName: 'Consent Decree Case',
        slug: 'cd-case',
      }),
      makeRow({
        id: '20000000-0000-4000-8000-00000000a004',
        kind: 'pattern_of_practice',
        caseName: 'Pattern Case',
        slug: 'pat-case',
      }),
      makeRow({
        id: '20000000-0000-4000-8000-00000000a005',
        kind: 'regulatory_challenge',
        caseName: 'Reg Challenge Case',
        slug: 'reg-case',
      }),
    ];
    const out = renderActiveLitigationIndex(rows);
    expect(out).toContain('Class Action Case');
    expect(out).toContain('(class action,');
    expect(out).toContain('DOJ Enforcement Case');
    expect(out).toContain('(DOJ enforcement,');
    expect(out).toContain('Consent Decree Case');
    expect(out).toContain('(consent decree,');
    expect(out).toContain('Pattern Case');
    expect(out).toContain('(pattern of practice,');
    expect(out).toContain('Reg Challenge Case');
    expect(out).toContain('(regulatory challenge,');
    // The stale binary label must be gone entirely.
    expect(out).not.toContain('mass action');
  });

  it('returns empty string when given no rows', () => {
    expect(renderActiveLitigationIndex([])).toBe('');
  });
});

/**
 * Phase C3b-ii — renderFocusedLitigation must surface QUALIFYING
 * QUESTIONS and VOICE GUIDANCE sub-blocks when the bound row has
 * a populated ada_qualifying_questions JSONB.
 *
 * The JSONB shape (per migrations 0012/0013) is:
 *   {
 *     questions: [{ id, prompt, kind, purpose }, ...],
 *     voice_guidance: "..."
 *   }
 *
 * Ada walks the user through these questions one at a time once a
 * session is bound to a litigation row (either at session creation
 * via litigation_id deep-link, or mid-conversation via the new
 * match_litigation tool — see matchLitigation.test.ts).
 *
 * Ref: /plan Plan C, Phase C3b-ii, acceptance criterion 4.
 */
describe('renderFocusedLitigation qualifying questions + voice guidance (Phase C3b-ii)', () => {
  it('renders a QUALIFYING QUESTIONS sub-block with each question prompt and purpose', () => {
    const row = makeRow({
      caseName: 'Niles v. Hilton',
      adaQualifyingQuestions: {
        questions: [
          {
            id: 'uses_wheelchair',
            prompt: 'Do you use a wheelchair as your main way to get around?',
            kind: 'yes_no',
            purpose: 'Class definition requires standard-wheelchair dependence.',
          },
          {
            id: 'mobility_disability',
            prompt: 'Is your wheelchair use because of a long-term disability, not a temporary injury?',
            kind: 'yes_no',
            purpose: 'ADA qualifying disability inquiry.',
          },
        ],
        voice_guidance: 'Ask questions one at a time. Confirm understanding before moving to the next.',
      },
    });
    const out = renderFocusedLitigation(row);
    expect(out).toContain('QUALIFYING QUESTIONS');
    expect(out).toContain('Do you use a wheelchair as your main way to get around?');
    expect(out).toContain('Is your wheelchair use because of a long-term disability');
    // Purpose strings should surface too so Ada knows the legal reason
    // behind each question and can frame her ask appropriately.
    expect(out).toContain('Class definition requires standard-wheelchair dependence.');
  });

  it('renders a VOICE GUIDANCE sub-block when voice_guidance is present', () => {
    const row = makeRow({
      adaQualifyingQuestions: {
        questions: [
          { id: 'q1', prompt: 'Question one?', kind: 'yes_no', purpose: 'Reason.' },
        ],
        voice_guidance:
          'Ask one at a time. Confirm understanding before moving to the next.',
      },
    });
    const out = renderFocusedLitigation(row);
    expect(out).toContain('VOICE GUIDANCE');
    expect(out).toContain('Ask one at a time. Confirm understanding before moving to the next.');
  });

  it('omits both sub-blocks when adaQualifyingQuestions is empty', () => {
    const row = makeRow({ adaQualifyingQuestions: {} });
    const out = renderFocusedLitigation(row);
    expect(out).not.toContain('QUALIFYING QUESTIONS');
    expect(out).not.toContain('VOICE GUIDANCE');
    // Case-name lead and basic fields should still be present.
    expect(out).toContain('Smith v. Acme Corp');
  });

  it('omits only VOICE GUIDANCE when questions exist but voice_guidance does not', () => {
    const row = makeRow({
      adaQualifyingQuestions: {
        questions: [
          { id: 'q1', prompt: 'Question one?', kind: 'yes_no', purpose: 'Reason.' },
        ],
      },
    });
    const out = renderFocusedLitigation(row);
    expect(out).toContain('QUALIFYING QUESTIONS');
    expect(out).toContain('Question one?');
    expect(out).not.toContain('VOICE GUIDANCE');
  });

  it('survives a malformed JSONB (non-array questions field) without throwing', () => {
    const row = makeRow({
      // Defensive: AdaQualifyingQuestions is typed Record<string, unknown>,
      // so theoretically anything can land here. Render must not throw.
      adaQualifyingQuestions: { questions: 'not an array', voice_guidance: 12345 } as Record<string, unknown>,
    });
    expect(() => renderFocusedLitigation(row)).not.toThrow();
    const out = renderFocusedLitigation(row);
    expect(out).toContain('Smith v. Acme Corp');
    expect(out).not.toContain('QUALIFYING QUESTIONS');
  });
});

describe('buildLitigationSection with focused row — via assemble (Phase 6a)', () => {
  // We assert behavior through the public assemble entry point rather than
  // importing the private buildLitigationSection. This guarantees the
  // pipeline wires focusedLitigation through correctly.

  function makeState(): import('@/engine/types').AdaSessionState {
    return {
      sessionId: '30000000-0000-4000-8000-000000000001',
      orgId: '00000000-0000-4000-8000-000000000001',
      sessionType: 'public_ada',
      status: 'active',
      readingLevel: 'standard',
      anonSessionId: '00000000-0000-4000-8000-00000000abcd',
      userId: null,
      listingId: null,
      litigationListingId: null,
      conversationHistory: [],
      extractedFields: {},
      classification: null,
      metadata: {},
      accessibilitySettings: {},
      isTest: true,
    };
  }

  it('focused row is rendered as a focused block and filtered out of the index', async () => {
    const { assemblePrompt } = await import('@/engine/prompt/assemble');
    const focused = makeRow();
    const other = makeRow({
      id: '20000000-0000-4000-8000-000000000002',
      caseName: 'Doe v. PharmaCo',
      slug: 'doe-v-pharmaco',
      kind: 'enforcement_action',
    });

    const promptText = assemblePrompt({
      state: makeState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
      activeLitigation: [focused, other],
      focusedLitigation: focused,
    });

    // Focused intro language appears.
    expect(promptText.toLowerCase()).toMatch(/already interested|starting point|came in about/);
    // Focused case name appears.
    expect(promptText).toContain('Smith v. Acme Corp');
    // The other case still appears in the index.
    expect(promptText).toContain('Doe v. PharmaCo');
    // Focused case must NOT also appear as a bolded index line — that'd be
    // a duplicate. (The focused block uses a different formatting.)
    const indexLinePattern = /- \*\*Smith v\. Acme Corp\*\*/g;
    const matches = promptText.match(indexLinePattern) ?? [];
    expect(matches.length).toBe(0);
  });

  it('no focused row → behavior matches existing index-only render', async () => {
    const { assemblePrompt } = await import('@/engine/prompt/assemble');
    const row = makeRow();
    const promptText = assemblePrompt({
      state: makeState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
      activeLitigation: [row],
    });
    // Index entry shows up as a bolded list line.
    expect(promptText).toMatch(/- \*\*Smith v\. Acme Corp\*\*/);
    // No focused-intro language.
    expect(promptText.toLowerCase()).not.toMatch(/already interested|starting point|came in about/);
  });
});
