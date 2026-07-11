/**
 * Layer 1 tests for assemblePrompt.
 *
 * Tests target observable properties of the output string, not exact byte
 * equality. The underlying content is in .md files authored by humans —
 * those files will evolve, and brittle full-string asserts would lock the
 * assembler into specific prose.
 *
 * What we DO assert:
 *   - The six sections appear in the correct order
 *   - Reading-level-specific copy is included for each level
 *   - Tool catalog contains all registered tool names
 *   - Extracted fields + classification are rendered when present
 *   - Empty sections (no listing, no org overlay) don't produce empty
 *     headers
 */

import { describe, it, expect } from 'vitest';
import { assemblePrompt } from '@/engine/prompt/assemble';
import { CH0_TOOLS } from '@/engine/tools/registry';
import type { AdaSessionState } from '@/engine/types';

function baseState(overrides: Partial<AdaSessionState> = {}): AdaSessionState {
  return {
    sessionId: '00000000-0000-4000-8000-000000000001',
    orgId: '00000000-0000-4000-8000-000000000011',
    sessionType: 'public_ada',
    status: 'active',
    readingLevel: 'standard',
    anonSessionId: '00000000-0000-4000-8000-000000000022',
    userId: null,
    listingId: null,
    litigationListingId: null,
    conversationHistory: [],
    extractedFields: {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
    ...overrides,
  };
}

describe('assemblePrompt — structure', () => {
  it('emits the six sections in order', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    const expectedOrder = [
      '# IDENTITY',
      '# ORG CONTEXT',
      '# READING LEVEL',
      '# TOOLS',
      '# CURRENT SESSION',
    ];
    let cursor = 0;
    for (const header of expectedOrder) {
      const idx = out.indexOf(header, cursor);
      expect(idx).toBeGreaterThan(-1);
      cursor = idx;
    }
  });

  it('omits the listing section when no override is supplied', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).not.toContain('# LISTING CONTEXT');
  });

  it('includes the listing section when override is supplied', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
      listingAdaPromptOverride: 'This listing is about workplace access at Acme Corp.',
    });
    expect(out).toContain('# LISTING CONTEXT');
    expect(out).toContain('Acme Corp');
  });

  it('omits orgAdaIntroPrompt when it is null or empty', () => {
    const a = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    const b = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: '   ',
    });
    expect(a).not.toContain('(override)');
    expect(b).not.toContain('(override)');
  });

  it('is deterministic: same inputs → same output', () => {
    const a = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    const b = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(a).toBe(b);
  });
});

describe('assemblePrompt — reading levels', () => {
  it('simple level includes plain-language COGA-conformant copy', () => {
    const out = assemblePrompt({
      state: baseState({ readingLevel: 'simple' }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('Reading level: simple');
    expect(out).toContain('COGA');
    expect(out).toContain('Never use legal terms');
    expect(out).not.toContain('assume legal literacy');
  });

  it('standard level includes standard-level copy', () => {
    const out = assemblePrompt({
      state: baseState({ readingLevel: 'standard' }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('Reading level: standard');
    expect(out).toContain('8th grade');
  });

  it('professional level includes professional-level copy', () => {
    const out = assemblePrompt({
      state: baseState({ readingLevel: 'professional' }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('Reading level: professional');
    expect(out).toContain('legal literacy');
    expect(out).not.toContain('COGA');
  });
});

describe('assemblePrompt — tools section', () => {
  it('lists every tool name in CH0_TOOLS', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    for (const tool of CH0_TOOLS) {
      expect(out).toContain(`### ${tool.name}`);
    }
  });

  it('includes each tool input schema as JSON', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    // set_classification requires 'title' — that word should appear in the
    // JSON schema block for that tool.
    expect(out).toContain('"title"');
    // extract_field takes a confidence number — that schema key should show up too.
    expect(out).toContain('"confidence"');
  });

  it('custom tool list overrides the default', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
      tools: [],
    });
    expect(out).toContain('No tools available this turn');
    expect(out).not.toContain('### set_classification');
  });
});

describe('assemblePrompt — session context', () => {
  it('tells Ada no classification is set when state.classification is null', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('No classification set yet');
  });

  it('tells Ada not to re-classify when state.classification is set', () => {
    const out = assemblePrompt({
      state: baseState({
        classification: {
          title: 'III',
          tier: 'high',
          reasoning: 'restaurant refused service dog',
          standard: '28 CFR §36.302(c)',
        },
      }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('Title III');
    expect(out).toContain('tier **high**');
    expect(out).toContain('Do not call `set_classification` again');
  });

  it('lists already-extracted fields', () => {
    const out = assemblePrompt({
      state: baseState({
        extractedFields: {
          location_state: {
            value: 'AZ',
            confidence: 0.95,
            extracted_at: '2026-04-20T12:00:00Z',
          },
          business_name: {
            value: "Joe's Diner",
            confidence: 0.9,
            extracted_at: '2026-04-20T12:00:01Z',
          },
        },
      }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('location_state="AZ"');
    expect(out).toContain('business_name="Joe\'s Diner"');
    expect(out).toContain("Don't re-ask");
  });

  it('says no fields extracted when extractedFields is empty', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('No fields extracted yet');
  });

  it('includes the closing-loop protocol for public_ada sessions', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('CLOSING THE LOOP');
    expect(out).toContain('Call `end_session`');
  });

  it('promises a sample letter when classified Title III', () => {
    const out = assemblePrompt({
      state: baseState({
        classification: {
          title: 'III',
          tier: 'high',
          reasoning: 'store has no accessible entrance',
          standard: '28 CFR §36.304',
        },
      }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('sample letter');
  });

  it('does not promise a sample letter for Title I (none is generated)', () => {
    const out = assemblePrompt({
      state: baseState({
        classification: {
          title: 'I',
          tier: 'high',
          reasoning: 'employer denied a reasonable accommodation',
          standard: '42 U.S.C. §12112',
        },
      }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('CLOSING THE LOOP');
    expect(out).not.toContain('sample letter');
  });

  it('omits the closing-loop protocol for class-action intake sessions', () => {
    const out = assemblePrompt({
      state: baseState({ sessionType: 'class_action_intake' }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).not.toContain('CLOSING THE LOOP');
  });

  it('tells Ada she can optionally email a copy (public_ada)', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('emailing a copy');
    expect(out).toContain('contact_email');
  });

  it('omits the email-copy guidance for class-action intake sessions', () => {
    const out = assemblePrompt({
      state: baseState({ sessionType: 'class_action_intake' }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).not.toContain('emailing a copy');
  });

  it('tells Ada to capture the business address when a letter applies (Title III)', () => {
    const out = assemblePrompt({
      state: baseState({
        classification: {
          title: 'III',
          tier: 'high',
          reasoning: 'no accessible entrance',
          standard: '28 CFR §36.304',
        },
      }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('business_address');
    expect(out).toContain('business_postal_code');
  });

  it('does not ask for the business address when no letter applies (Title I)', () => {
    const out = assemblePrompt({
      state: baseState({
        classification: {
          title: 'I',
          tier: 'high',
          reasoning: 'employer denied accommodation',
          standard: '42 U.S.C. §12112',
        },
      }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).not.toContain('business_address');
  });
});

describe('assemblePrompt — org context', () => {
  it('includes the org display name', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('**ADA Legal Link**');
  });

  it('appends the org intro prompt when set', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'Arizona AG',
      orgAdaIntroPrompt: 'Arizona Attorney General intake — follow AZ-specific reporting rules.',
    });
    expect(out).toContain('Arizona AG');
    expect(out).toContain('AZ-specific reporting rules');
  });
});

describe('assemblePrompt — knowledge section (Step 10.5)', () => {
  it('omits the KNOWLEDGE section entirely when no chunks are provided', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).not.toContain('# KNOWLEDGE');
  });

  it('omits the KNOWLEDGE section when the chunks array is empty', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
      knowledgeChunks: [],
    });
    expect(out).not.toContain('# KNOWLEDGE');
  });

  it('renders retrieved chunks with title, source, and content', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
      knowledgeChunks: [
        {
          id: 'chunk-1',
          topic: 'service_animals',
          title: '§36.302(c)(1) — Service animals — general rule',
          content: 'Generally, a public accommodation shall modify policies.',
          standardRefs: ['36.302(c)(1)', '36.302(c)', '36.302', '36'],
          source: '28 CFR §36 (ADA Title III regulations)',
          similarity: 0.89,
          matchType: 'vector',
        },
      ],
    });
    expect(out).toContain('# KNOWLEDGE');
    expect(out).toContain('§36.302(c)(1) — Service animals — general rule');
    expect(out).toContain('28 CFR §36 (ADA Title III regulations)');
    expect(out).toContain('Generally, a public accommodation shall modify policies.');
  });

  it('instructs Ada to cite by section number when using retrieved text', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
      knowledgeChunks: [
        {
          id: 'chunk-1',
          topic: 'service_animals',
          title: '§36.302(c)(1) — Service animals — general rule',
          content: 'body',
          standardRefs: ['36.302(c)(1)'],
          source: '28 CFR §36',
          similarity: 0.89,
          matchType: 'vector',
        },
      ],
    });
    expect(out.toLowerCase()).toContain('cite the section number');
    expect(out).toContain('§36.302(c)(6)'); // example in the instructions
  });

  it('warns Ada not to invent citations', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
      knowledgeChunks: [
        {
          id: 'chunk-1',
          topic: 'general',
          title: '§36.201 — General',
          content: 'body',
          standardRefs: ['36.201'],
          source: '28 CFR §36',
          similarity: 0.7,
          matchType: 'vector',
        },
      ],
    });
    expect(out.toLowerCase()).toContain('never invent citations');
  });

  it('renders multiple chunks in the order given', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
      knowledgeChunks: [
        {
          id: 'a',
          topic: 'service_animals',
          title: '§36.302(c)(1) — first',
          content: 'first-body',
          standardRefs: ['36.302(c)(1)'],
          source: '28 CFR §36',
          similarity: null,
          matchType: 'citation',
        },
        {
          id: 'b',
          topic: 'service_animals',
          title: '§36.302(c)(6) — second',
          content: 'second-body',
          standardRefs: ['36.302(c)(6)'],
          source: '28 CFR §36',
          similarity: 0.8,
          matchType: 'vector',
        },
      ],
    });
    const firstIdx = out.indexOf('first-body');
    const secondIdx = out.indexOf('second-body');
    expect(firstIdx).toBeGreaterThan(-1);
    expect(secondIdx).toBeGreaterThan(-1);
    expect(firstIdx).toBeLessThan(secondIdx);
  });

  it('places KNOWLEDGE in the volatile suffix after the cached prefix', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
      listingAdaPromptOverride: 'Per-listing overlay.',
      knowledgeChunks: [
        {
          id: 'chunk-1',
          topic: 'service_animals',
          title: '§36.302(c)(1) — title',
          content: 'body',
          standardRefs: ['36.302(c)(1)'],
          source: '28 CFR §36',
          similarity: 0.9,
          matchType: 'vector',
        },
      ],
    });
    // Cached prefix: IDENTITY, ORG, LISTING, READING LEVEL, TOOLS.
    // Volatile suffix: TIME, PAGE, KNOWLEDGE, ROUTING, SESSION.
    // KNOWLEDGE must come after the prefix sections.
    const orgIdx = out.indexOf('# ORG CONTEXT');
    const listingIdx = out.indexOf('# LISTING CONTEXT');
    const readingIdx = out.indexOf('# READING LEVEL');
    const toolsIdx = out.indexOf('# TOOLS');
    const kbIdx = out.indexOf('# KNOWLEDGE');
    expect(orgIdx).toBeLessThan(listingIdx);
    expect(listingIdx).toBeLessThan(readingIdx);
    expect(readingIdx).toBeLessThan(toolsIdx);
    expect(toolsIdx).toBeLessThan(kbIdx);
  });
});

describe('assemblePrompt — page context (Commit 29/6)', () => {
  it('omits PAGE CONTEXT when session metadata has no page_context', () => {
    const out = assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).not.toContain('# PAGE CONTEXT');
  });

  it('emits PAGE CONTEXT when session was opened from a chapter', () => {
    const out = assemblePrompt({
      state: baseState({
        metadata: {
          page_context: {
            kind: 'chapter',
            ref: '4',
            title: 'Accessible Routes',
          },
        },
      }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('# PAGE CONTEXT');
    expect(out).toContain('"Accessible Routes" chapter');
    expect(out).toContain('/standards-guide/chapter/4');
  });

  it('emits PAGE CONTEXT when session was opened from a guide', () => {
    const out = assemblePrompt({
      state: baseState({
        metadata: {
          page_context: {
            kind: 'guide',
            ref: 'ramps',
            title: 'Ramps & Slope Requirements',
          },
        },
      }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    expect(out).toContain('# PAGE CONTEXT');
    expect(out).toContain('"Ramps & Slope Requirements" deep-dive guide');
    expect(out).toContain('/standards-guide/guide/ramps');
  });

  it('includes the standards-index cheat-sheet when page_context is set', () => {
    const out = assemblePrompt({
      state: baseState({
        metadata: {
          page_context: {
            kind: 'guide',
            ref: 'ramps',
            title: 'Ramps & Slope Requirements',
          },
        },
      }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });
    // The index table header and a handful of known topics should all
    // be present once the page_context section fires.
    expect(out).toContain('| Section(s) | Topic | Guide URL |');
    expect(out).toContain('/standards-guide/guide/ramps');
    expect(out).toContain('/standards-guide/guide/restrooms');
    expect(out).toContain('§405');
  });

  it('places PAGE CONTEXT in the volatile suffix after the cached prefix', () => {
    const out = assemblePrompt({
      state: baseState({
        metadata: {
          page_context: {
            kind: 'guide',
            ref: 'ramps',
            title: 'Ramps & Slope Requirements',
          },
        },
      }),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
      discoveryListings: [],
    });
    // PAGE CONTEXT moved to volatile suffix; READING LEVEL + TOOLS
    // are in the cached prefix and precede it.
    const orgIdx = out.indexOf('# ORG CONTEXT');
    const readingIdx = out.indexOf('# READING LEVEL');
    const toolsIdx = out.indexOf('# TOOLS');
    const pageIdx = out.indexOf('# PAGE CONTEXT');
    expect(orgIdx).toBeGreaterThan(-1);
    expect(pageIdx).toBeGreaterThan(-1);
    expect(orgIdx).toBeLessThan(readingIdx);
    expect(readingIdx).toBeLessThan(toolsIdx);
    expect(toolsIdx).toBeLessThan(pageIdx);
  });
});

describe('assemblePrompt — legal-verdict + intake guardrails (triage findings 1 & 3)', () => {
  const out = () =>
    assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });

  // Finding 1: the persona no longer models a flat legal verdict, and
  // explicitly forbids declaring a named business broke the law.
  it('does not model the "a clear Title III violation" verdict exemplar', () => {
    expect(out()).not.toContain('a clear Title III violation');
  });

  it('forbids declaring that a business broke the law or violated the ADA', () => {
    expect(out()).toMatch(/do NOT declare that a business broke the law/i);
  });

  it('includes the readily-achievable nuance (no auto-violation)', () => {
    expect(out()).toMatch(/readily achievable/i);
  });

  // Finding 3: Ada must parse the opener and not re-ask facts already given.
  it('instructs Ada to read the opener before asking', () => {
    expect(out()).toContain('First, read what they already told you');
  });
});

// ─── Phase 0: barrier-context questions + no-measurement rule ──────────────────
// The identity carries a barrier-scoped experience-question module. It must
// (a) forbid asking the claimant for a measurement, (b) offer experience
// branches, and (c) register the canonical experience fields. Ada adapts the
// wording to reading level at runtime, so the module text itself must be
// jargon-free in its example questions.
describe('assemblePrompt — barrier experience-question module (Phase 0)', () => {
  const out = () =>
    assemblePrompt({
      state: baseState(),
      orgDisplayName: 'ADA Legal Link',
      orgAdaIntroPrompt: null,
    });

  it('forbids asking the claimant for a dimension or measurement', () => {
    expect(out()).toMatch(/never ask (a|the) claimant for a dimension/i);
  });

  it('routes measurements to the photo, not the claimant', () => {
    expect(out()).toMatch(/measurements are the photo's job/i);
  });

  it('registers the canonical experience fields', () => {
    const o = out();
    expect(o).toContain('facility_type');
    expect(o).toContain('could_access');
    expect(o).toContain('alternative_route_present');
    expect(o).toContain('barrier_permanence');
    expect(o).toContain('altered_since_built');
  });

  it('keeps example questions free of inspector jargon', () => {
    // The rule may NAME "rise and run" to forbid it, but the example
    // questions Ada asks must not be phrased in inspector units.
    const questionsBlock = out();
    // No claimant-facing question should demand a unit measurement.
    expect(questionsBlock).not.toMatch(/what (is|are) the (rise|run|slope|clear width)/i);
    expect(questionsBlock).not.toMatch(/how many inches/i);
  });
});
