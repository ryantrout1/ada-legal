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

  it('places KNOWLEDGE between ORG CONTEXT and LISTING CONTEXT', () => {
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
    const orgIdx = out.indexOf('# ORG CONTEXT');
    const kbIdx = out.indexOf('# KNOWLEDGE');
    const listingIdx = out.indexOf('# LISTING CONTEXT');
    expect(orgIdx).toBeLessThan(kbIdx);
    expect(kbIdx).toBeLessThan(listingIdx);
  });
});
