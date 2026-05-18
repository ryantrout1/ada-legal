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
import { renderFocusedLitigation } from '@/engine/prompt/litigationContext';
import type { LitigationRow } from '@/engine/clients/types';

const ATTORNEY_ID = '10000000-0000-4000-8000-00000000a001';

function makeRow(overrides: Partial<LitigationRow> = {}): LitigationRow {
  return {
    id: '20000000-0000-4000-8000-000000000001',
    kind: 'class',
    caseName: 'Smith v. Acme Corp',
    slug: 'smith-v-acme-corp',
    shortDescription: 'Rideshare denied wheelchair-using passengers across multiple cities.',
    fullDescription:
      'Detailed allegations that Acme rideshare drivers refused to transport wheelchair-using passengers and charged improper cleaning fees.',
    eligibility:
      'Anyone who used Acme rideshare between 2023 and 2025 and was denied service or charged a fee related to a wheelchair.',
    defendants: ['Acme Corp', 'Acme Rideshare LLC'],
    court: 'N.D. Cal.',
    docketNumber: '3:24-cv-01234',
    affectedStates: ['CA', 'AZ', 'NV'],
    filingDate: '2024-03-15',
    leadAttorneyId: ATTORNEY_ID,
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
      kind: 'mass',
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
      kind: 'mass',
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

  it('renders mass-action kind label correctly', () => {
    const row = makeRow({
      caseName: 'Doe v. PharmaCo',
      kind: 'mass',
      slug: 'doe-v-pharmaco',
    });
    const out = renderFocusedLitigation(row);
    expect(out).toContain('mass action');
    expect(out).not.toContain('class action');
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
      kind: 'mass',
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
