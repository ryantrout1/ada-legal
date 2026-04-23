/**
 * Tests for the package module.
 *
 * Covers: slug, labels, narrative/summary extraction, demand letter
 * generation, full assemble().
 *
 * Ref: Step 18, Commit 3.
 */

import { describe, it, expect } from 'vitest';
import { generatePackageSlug, isValidPackageSlug } from '../../src/engine/package/slug.js';
import { labelFor } from '../../src/engine/package/labels.js';
import { extractNarrative, buildSummary } from '../../src/engine/package/extract.js';
import { buildDemandLetter } from '../../src/engine/package/demandLetter.js';
import { assemblePackage, PACKAGE_DISCLAIMER } from '../../src/engine/package/assemble.js';
import type { AdaSessionState } from '../../src/engine/types.js';
import type { ExtractedFields, Classification, Message } from '../../src/types/db.js';
import type { KnowledgeChunkHit } from '../../src/engine/clients/types.js';

// ─── slug ─────────────────────────────────────────────────────────────────────

describe('package slug', () => {
  it('generates slugs of the expected shape', () => {
    const s = generatePackageSlug();
    expect(s).toMatch(/^s-[0-9a-hjkmnp-tv-z]{12}$/);
  });

  it('generates different slugs each call', () => {
    const set = new Set<string>();
    for (let i = 0; i < 50; i++) set.add(generatePackageSlug());
    expect(set.size).toBe(50);
  });

  it('validates its own generated slugs', () => {
    for (let i = 0; i < 10; i++) {
      expect(isValidPackageSlug(generatePackageSlug())).toBe(true);
    }
  });

  it('rejects slugs without the prefix', () => {
    expect(isValidPackageSlug('3a7fk9pq2n8w')).toBe(false);
  });

  it('rejects slugs with wrong body length', () => {
    expect(isValidPackageSlug('s-abc')).toBe(false);
    expect(isValidPackageSlug('s-' + 'a'.repeat(20))).toBe(false);
  });

  it('rejects slugs with ambiguous characters', () => {
    // Crockford base32 excludes I, L, O, U.
    expect(isValidPackageSlug('s-aaaiaaaaaaaa')).toBe(false);
    expect(isValidPackageSlug('s-aaaoaaaaaaaa')).toBe(false);
  });

  it('accepts case-insensitive slugs for public sharing', () => {
    // Users may paste lowercased or uppercased slugs from chat apps.
    const s = generatePackageSlug();
    expect(isValidPackageSlug(s.toUpperCase())).toBe(true);
  });

  it('rejects non-string input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidPackageSlug(null as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidPackageSlug(undefined as any)).toBe(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isValidPackageSlug(42 as any)).toBe(false);
  });
});

// ─── labels ───────────────────────────────────────────────────────────────────

describe('classification labels', () => {
  it('produces plain-language labels for all classifications', () => {
    for (const title of ['I', 'II', 'III', 'class_action', 'out_of_scope', 'none'] as const) {
      const lbl = labelFor(title);
      expect(lbl.shortLabel).toBeTruthy();
      expect(lbl.shortLabel.length).toBeLessThanOrEqual(40);
      expect(lbl.plainDescription).toBeTruthy();
      expect(lbl.plainDescription.length).toBeGreaterThan(0);
      // No HTML in any label content.
      expect(lbl.shortLabel + lbl.plainDescription).not.toMatch(/<[a-z]/i);
    }
  });

  it('does NOT put "Title I/II/III" in the short label', () => {
    // shortLabel is the user-facing headline; lead with what it IS,
    // not the legal code. The technical label carries the code.
    expect(labelFor('I').shortLabel).not.toMatch(/Title/);
    expect(labelFor('II').shortLabel).not.toMatch(/Title/);
    expect(labelFor('III').shortLabel).not.toMatch(/Title/);
  });

  it('surfaces the technical label separately', () => {
    expect(labelFor('I').technicalLabel).toBe('Title I of the ADA');
    expect(labelFor('II').technicalLabel).toBe('Title II of the ADA');
    expect(labelFor('III').technicalLabel).toBe('Title III of the ADA');
  });
});

// ─── narrative extraction ────────────────────────────────────────────────────

describe('extractNarrative', () => {
  const ts = '2026-04-22T12:00:00.000Z';

  it('returns null for empty history', () => {
    expect(extractNarrative([])).toBeNull();
  });

  it('returns the first substantive user message', () => {
    const history: Message[] = [
      { role: 'user', content: 'hi', timestamp: ts },
      {
        role: 'assistant',
        content: 'How can I help?',
        timestamp: ts,
      },
      {
        role: 'user',
        content:
          'I tried to get into a restaurant with my wheelchair and they told me to use the back door.',
        timestamp: ts,
      },
    ];
    const narr = extractNarrative(history);
    expect(narr).toContain('restaurant');
    expect(narr).toContain('wheelchair');
  });

  it('concatenates short messages as fallback', () => {
    const history: Message[] = [
      { role: 'user', content: 'yes', timestamp: ts },
      { role: 'user', content: 'no', timestamp: ts },
    ];
    const narr = extractNarrative(history);
    // Fallback returns something non-null when there's any user content
    expect(narr).toBe('yes no');
  });

  it('ignores assistant messages entirely', () => {
    const history: Message[] = [
      {
        role: 'assistant',
        content: "This is the assistant explaining things at length. Not the user's words.",
        timestamp: ts,
      },
    ];
    expect(extractNarrative(history)).toBeNull();
  });

  it("preserves the user's exact words (no rewriting)", () => {
    const userWords =
      "I'm blind and they wouldn't let my guide dog in the restaurant even though that's illegal.";
    const history: Message[] = [
      { role: 'user', content: userWords, timestamp: ts },
    ];
    expect(extractNarrative(history)).toBe(userWords);
  });
});

// ─── summary builder ─────────────────────────────────────────────────────────

describe('buildSummary', () => {
  const baseClassification: Classification = {
    title: 'III',
    tier: 'high',
    reasoning: 'restaurant refused service animal',
    standard: '28 CFR §36.302(c)',
  };

  const baseFacts: ExtractedFields = {
    business_name: { value: "Joe's Diner", confidence: 0.95, extracted_at: '2026-04-22T12:00:00.000Z' },
    business_type: { value: 'Restaurant', confidence: 0.9, extracted_at: '2026-04-22T12:00:00.000Z' },
    location_city: { value: 'Phoenix', confidence: 0.9, extracted_at: '2026-04-22T12:00:00.000Z' },
    location_state: { value: 'AZ', confidence: 1.0, extracted_at: '2026-04-22T12:00:00.000Z' },
    violation_subtype: { value: 'Service Animal Denial', confidence: 0.9, extracted_at: '2026-04-22T12:00:00.000Z' },
  };

  it('starts with user-centered language', () => {
    const summary = buildSummary(baseFacts, baseClassification);
    // "You told Ada that..." — user-centered framing.
    expect(summary).toMatch(/^You /);
  });

  it('includes extracted business name and location', () => {
    const summary = buildSummary(baseFacts, baseClassification);
    expect(summary).toContain("Joe's Diner");
    expect(summary).toContain('Phoenix');
    expect(summary).toContain('AZ');
  });

  it('includes the classification label', () => {
    const summary = buildSummary(baseFacts, baseClassification);
    expect(summary.toLowerCase()).toContain('public accommodation');
  });

  it('does NOT predict outcomes', () => {
    const summary = buildSummary(baseFacts, baseClassification);
    // Guard against language that sounds predictive.
    expect(summary).not.toMatch(/you will win/i);
    expect(summary).not.toMatch(/you can recover/i);
    expect(summary).not.toMatch(/\$/);
  });

  it('adds a confidence caveat only for low tier', () => {
    const summary = buildSummary(baseFacts, baseClassification);
    expect(summary).not.toMatch(/not fully certain/i);
    const low: Classification = { ...baseClassification, tier: 'low' };
    const summaryLow = buildSummary(baseFacts, low);
    expect(summaryLow).toMatch(/not fully certain/i);
  });

  it('handles out_of_scope without being dismissive', () => {
    const oos: Classification = { ...baseClassification, title: 'out_of_scope' };
    const summary = buildSummary(baseFacts, oos);
    expect(summary.toLowerCase()).toContain('resources');
    expect(summary).not.toMatch(/can't help|cannot help|sorry/i);
  });

  it('handles empty facts gracefully', () => {
    const summary = buildSummary({}, baseClassification);
    expect(summary).toContain('shared your experience');
  });
});

// ─── demand letter ───────────────────────────────────────────────────────────

describe('buildDemandLetter', () => {
  const generatedOn = '2026-04-22T12:00:00.000Z';
  const classification: Classification = {
    title: 'III',
    tier: 'high',
    reasoning: 'restaurant refused service animal',
    standard: '28 CFR §36.302(c)',
  };

  it('returns null when there is no business name', () => {
    expect(
      buildDemandLetter({
        facts: {},
        classification,
        userNarrative: 'something happened',
        generatedOn,
      }),
    ).toBeNull();
  });

  it('generates a letter when business name is present', () => {
    const facts: ExtractedFields = {
      business_name: { value: "Joe's Diner", confidence: 0.95, extracted_at: generatedOn },
      business_type: { value: 'Restaurant', confidence: 0.9, extracted_at: generatedOn },
      location_city: { value: 'Phoenix', confidence: 0.9, extracted_at: generatedOn },
      location_state: { value: 'AZ', confidence: 1.0, extracted_at: generatedOn },
    };
    const letter = buildDemandLetter({
      facts,
      classification,
      userNarrative: 'I brought my service dog and was refused entry.',
      generatedOn,
    });
    expect(letter).not.toBeNull();
    expect(letter!).toContain("Joe's Diner");
    expect(letter!).toContain('Phoenix, AZ');
    expect(letter!).toContain('April 22, 2026');
    expect(letter!).toContain('service dog');
  });

  it('does NOT contain dollar figures or damage demands', () => {
    const facts: ExtractedFields = {
      business_name: { value: 'Bad Hotel', confidence: 1, extracted_at: generatedOn },
      business_type: { value: 'Hotel/Lodging', confidence: 1, extracted_at: generatedOn },
    };
    const letter = buildDemandLetter({
      facts,
      classification,
      userNarrative: 'Room was not accessible.',
      generatedOn,
    });
    expect(letter!).not.toMatch(/\$/);
    expect(letter!).not.toMatch(/damages/i);
  });

  it('does NOT threaten lawsuit', () => {
    const facts: ExtractedFields = {
      business_name: { value: 'Bad Hotel', confidence: 1, extracted_at: generatedOn },
      business_type: { value: 'Hotel/Lodging', confidence: 1, extracted_at: generatedOn },
    };
    const letter = buildDemandLetter({
      facts,
      classification,
      userNarrative: 'Room was not accessible.',
      generatedOn,
    });
    expect(letter!).not.toMatch(/will sue|lawsuit|file suit/i);
    // But DOES preserve rights in standard language.
    expect(letter!).toMatch(/reserve.*rights/i);
  });

  it('cites the regulation from classification.standard', () => {
    const facts: ExtractedFields = {
      business_name: { value: 'Bad Hotel', confidence: 1, extracted_at: generatedOn },
    };
    const letter = buildDemandLetter({
      facts,
      classification,
      userNarrative: 'Something.',
      generatedOn,
    });
    expect(letter!).toContain('28 CFR §36.302(c)');
  });

  it('falls back to a generic citation when standard is "n/a"', () => {
    const facts: ExtractedFields = {
      business_name: { value: 'Bad Hotel', confidence: 1, extracted_at: generatedOn },
    };
    const letter = buildDemandLetter({
      facts,
      classification: { ...classification, standard: 'n/a' },
      userNarrative: 'Something.',
      generatedOn,
    });
    expect(letter!).not.toContain('n/a');
    expect(letter!).toMatch(/28 CFR Part 36/);
  });

  it('has placeholders the user fills in before sending', () => {
    const facts: ExtractedFields = {
      business_name: { value: 'Bad Hotel', confidence: 1, extracted_at: generatedOn },
    };
    const letter = buildDemandLetter({
      facts,
      classification,
      userNarrative: 'Something.',
      generatedOn,
    });
    // The letter is a TEMPLATE — the user signs it, not Ada.
    expect(letter!).toContain('[Your name]');
    expect(letter!).toContain('[Your signature, if sending by mail]');
  });

  it('uses subtype-specific language for service animal denial', () => {
    const facts: ExtractedFields = {
      business_name: { value: 'Bad Diner', confidence: 1, extracted_at: generatedOn },
      violation_subtype: { value: 'Service Animal Denial', confidence: 1, extracted_at: generatedOn },
    };
    const letter = buildDemandLetter({
      facts,
      classification,
      userNarrative: 'Something.',
      generatedOn,
    });
    expect(letter!.toLowerCase()).toContain('service animal');
    expect(letter!.toLowerCase()).toContain('polic');
  });

  it('uses subtype-specific language for website/app', () => {
    const facts: ExtractedFields = {
      business_name: { value: 'Bad Website Inc', confidence: 1, extracted_at: generatedOn },
      violation_subtype: { value: 'Website/App', confidence: 1, extracted_at: generatedOn },
    };
    const letter = buildDemandLetter({
      facts,
      classification,
      userNarrative: 'Website was not accessible.',
      generatedOn,
    });
    expect(letter!.toLowerCase()).toContain('website');
    expect(letter!.toLowerCase()).toContain('assistive');
  });
});

// ─── assemblePackage ─────────────────────────────────────────────────────────

describe('assemblePackage', () => {
  const baseNow = '2026-04-22T12:00:00.000Z';
  const baseClassification: Classification = {
    title: 'III',
    tier: 'high',
    reasoning: 'restaurant refused service animal',
    standard: '28 CFR §36.302(c)',
    class_action_candidate: null,
  };

  function makeState(overrides: Partial<AdaSessionState> = {}): AdaSessionState {
    return {
      sessionId: 'session_abc',
      orgId: 'org_public',
      sessionType: 'public_ada',
      status: 'completed',
      readingLevel: 'standard',
      anonSessionId: 'anon_xyz',
      userId: null,
      listingId: null,
      conversationHistory: [
        {
          role: 'user',
          content:
            'I brought my service dog to the restaurant and they told me I had to leave because of the dog.',
          timestamp: baseNow,
        },
      ],
      extractedFields: {
        business_name: { value: "Joe's Diner", confidence: 0.95, extracted_at: baseNow },
        business_type: { value: 'Restaurant', confidence: 0.9, extracted_at: baseNow },
        location_city: { value: 'Phoenix', confidence: 0.9, extracted_at: baseNow },
        location_state: { value: 'AZ', confidence: 1.0, extracted_at: baseNow },
        violation_subtype: { value: 'Service Animal Denial', confidence: 0.9, extracted_at: baseNow },
      },
      classification: baseClassification,
      metadata: {
        photos: [{ url: 'https://blob.example/photo.jpg', uploadedAt: baseNow }],
      },
      accessibilitySettings: {
        display_mode: 'default',
        font_size: 'default',
        font_family: 'system',
        line_spacing: 'default',
      },
      isTest: false,
      ...overrides,
    };
  }

  it('throws if the session is not classified', () => {
    const state = makeState({ classification: null });
    expect(() => assemblePackage({ state })).toThrow(/unclassified/i);
  });

  it('produces a package with the expected top-level shape', () => {
    const pkg = assemblePackage({
      state: makeState(),
      now: baseNow,
      attorneyMatched: true,
    });
    expect(pkg.sessionId).toBe('session_abc');
    expect(pkg.generatedAt).toBe(baseNow);
    expect(pkg.slug).toMatch(/^s-/);
    expect(pkg.classification).toBe(baseClassification);
    expect(pkg.classificationLabel.shortLabel).toBe('Public Accommodation');
    expect(pkg.disclaimer).toBe(PACKAGE_DISCLAIMER);
  });

  it('preserves the user narrative verbatim', () => {
    const pkg = assemblePackage({ state: makeState(), now: baseNow });
    expect(pkg.userNarrative).toBe(
      'I brought my service dog to the restaurant and they told me I had to leave because of the dog.',
    );
  });

  it('routes Title III + attorney match to attorney primary', () => {
    const pkg = assemblePackage({
      state: makeState(),
      now: baseNow,
      attorneyMatched: true,
    });
    expect(pkg.primaryAction.id).toBe('title_iii_attorney');
  });

  it('routes Title III without attorney to demand letter primary', () => {
    const pkg = assemblePackage({
      state: makeState(),
      now: baseNow,
      attorneyMatched: false,
    });
    expect(pkg.primaryAction.id).toBe('title_iii_demand_letter');
  });

  it('generates a demand letter for Title III', () => {
    const pkg = assemblePackage({ state: makeState(), now: baseNow });
    expect(pkg.demandLetter).not.toBeNull();
    expect(pkg.demandLetter!).toContain("Joe's Diner");
  });

  it('does NOT generate a demand letter for Title I', () => {
    const state = makeState({
      classification: { ...baseClassification, title: 'I', standard: '42 USC §12112' },
    });
    const pkg = assemblePackage({ state, now: baseNow });
    expect(pkg.demandLetter).toBeNull();
  });

  it('does NOT generate a demand letter for Title II', () => {
    const state = makeState({
      classification: { ...baseClassification, title: 'II', standard: '28 CFR §35.130' },
    });
    const pkg = assemblePackage({ state, now: baseNow });
    expect(pkg.demandLetter).toBeNull();
  });

  it('sets classActionPlaceholder for class_action classification', () => {
    const state = makeState({
      classification: {
        ...baseClassification,
        title: 'class_action',
        standard: 'n/a',
      },
    });
    const pkg = assemblePackage({ state, now: baseNow });
    expect(pkg.classActionPlaceholder).toBe(true);
  });

  it('includes state-specific destination when state is known', () => {
    const pkg = assemblePackage({ state: makeState(), now: baseNow, attorneyMatched: true });
    const allIds = [
      pkg.primaryAction.id,
      ...pkg.alternateActions.map((d) => d.id),
    ];
    expect(allIds).toContain('az_civil_rights');
  });

  it('includes photos from session metadata', () => {
    const pkg = assemblePackage({ state: makeState(), now: baseNow });
    expect(pkg.photos).toHaveLength(1);
    expect(pkg.photos[0]!.url).toBe('https://blob.example/photo.jpg');
  });

  it('maps knowledge hits to cited regulations', () => {
    const hits: KnowledgeChunkHit[] = [
      {
        id: 'chunk-1',
        topic: 'service animals',
        title: '§36.302',
        content: 'A public accommodation shall make reasonable modifications in policies...',
        standardRefs: ['28 CFR §36.302'],
        source: 'cfr-36',
        similarity: 0.92,
        matchType: 'vector',
      },
      {
        id: 'chunk-2',
        topic: 'service animals',
        title: '§36.302',
        content: 'Different excerpt, same regulation.',
        standardRefs: ['28 CFR §36.302'], // duplicate — should be skipped
        source: 'cfr-36',
        similarity: 0.85,
        matchType: 'vector',
      },
      {
        id: 'chunk-3',
        topic: 'effective communication',
        title: '§36.303',
        content: 'Auxiliary aids and services must be provided...',
        standardRefs: ['28 CFR §36.303'],
        source: 'cfr-36',
        similarity: 0.81,
        matchType: 'vector',
      },
    ];
    const pkg = assemblePackage({ state: makeState(), now: baseNow, knowledgeHits: hits });
    expect(pkg.citedRegulations).toHaveLength(2); // duplicate removed
    expect(pkg.citedRegulations[0]!.citation).toBe('28 CFR §36.302');
    expect(pkg.citedRegulations[1]!.citation).toBe('28 CFR §36.303');
  });

  it('handles empty knowledge hits', () => {
    const pkg = assemblePackage({ state: makeState(), now: baseNow });
    expect(pkg.citedRegulations).toEqual([]);
  });

  it('generates a fresh slug on each call when none is provided', () => {
    const p1 = assemblePackage({ state: makeState(), now: baseNow });
    const p2 = assemblePackage({ state: makeState(), now: baseNow });
    expect(p1.slug).not.toBe(p2.slug);
  });

  it('uses a pre-supplied slug when provided', () => {
    const pkg = assemblePackage({
      state: makeState(),
      now: baseNow,
      slug: 's-abcdefghjkmn',
    });
    expect(pkg.slug).toBe('s-abcdefghjkmn');
  });

  it('disclaimer is always present and includes key claim-limits language', () => {
    const pkg = assemblePackage({ state: makeState(), now: baseNow });
    expect(pkg.disclaimer).toContain('not legal advice');
    expect(pkg.disclaimer).toContain('not a lawyer');
  });
});
