/**
 * Tests for evaluateRoutingRules.
 *
 * Pure function, no DB. We build session states and rule arrays
 * directly, call the evaluator, assert on the returned matches.
 *
 * Every filter branch has at least one test, since any of them failing
 * open routes a user somewhere wrong.
 *
 * Ref: Step 22.
 */

import { describe, it, expect } from 'vitest';
import { evaluateRoutingRules } from '@/engine/routing/evaluate';
import type { RoutingRuleWithTarget } from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';
import type { Classification, RoutingJurisdiction } from '@/types/db';

const ORG_ADALL = '00000000-0000-4000-8000-000000000001';
const ORG_AZ_AG = '00000000-0000-4000-8000-000000000002';
const ORG_CA_DOJ = '00000000-0000-4000-8000-000000000003';
const ORG_FED_EEOC = '00000000-0000-4000-8000-000000000004';

function baseState(overrides: Partial<AdaSessionState> = {}): AdaSessionState {
  return {
    sessionId: '00000000-0000-4000-8000-000000000111',
    orgId: ORG_ADALL,
    sessionType: 'public_ada',
    status: 'active',
    readingLevel: 'standard',
    anonSessionId: '00000000-0000-4000-8000-000000000222',
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

function rule(overrides: Partial<RoutingRuleWithTarget> = {}): RoutingRuleWithTarget {
  return {
    ruleId: '00000000-0000-4000-8000-00000000a001',
    targetOrgId: ORG_AZ_AG,
    targetOrgCode: 'az-ag',
    targetOrgDisplayName: 'Arizona Attorney General',
    complaintTypes: [],
    jurisdictions: [],
    priority: 100,
    ...overrides,
  };
}

function classification(
  title: Classification['title'],
): Classification {
  return {
    title,
    tier: 'high',
    reasoning: 'test',
    standard: 'n/a',
    class_action_candidate: null,
  };
}

function fieldEntry(value: string) {
  return {
    value,
    confidence: 0.95,
    extracted_at: '2026-04-22T00:00:00.000Z',
  };
}

// ─── matching basics ──────────────────────────────────────────────────────────

describe('evaluateRoutingRules — base matching', () => {
  it('returns empty when no rules are provided', () => {
    const matches = evaluateRoutingRules({
      session: baseState({ classification: classification('I') }),
      rules: [],
    });
    expect(matches).toEqual([]);
  });

  it('matches a rule with empty complaintTypes and empty jurisdictions', () => {
    const matches = evaluateRoutingRules({
      session: baseState({ classification: classification('I') }),
      rules: [rule()],
    });
    expect(matches).toHaveLength(1);
    expect(matches[0]!.targetOrgCode).toBe('az-ag');
  });

  it('preserves the ordering of the input rules', () => {
    const matches = evaluateRoutingRules({
      session: baseState({ classification: classification('I') }),
      rules: [
        rule({ ruleId: 'r-1', priority: 200 }),
        rule({ ruleId: 'r-2', priority: 50, targetOrgId: ORG_CA_DOJ, targetOrgCode: 'ca-doj', targetOrgDisplayName: 'CA DOJ' }),
      ],
    });
    // Input order is preserved — the caller (DbClient) is responsible
    // for sorting. We just verify we didn't re-sort internally.
    expect(matches.map((m) => m.ruleId)).toEqual(['r-1', 'r-2']);
  });
});

// ─── own-org guard ────────────────────────────────────────────────────────────

describe('evaluateRoutingRules — own-org guard', () => {
  it('excludes a rule whose target is the session org', () => {
    const matches = evaluateRoutingRules({
      session: baseState({
        orgId: ORG_ADALL,
        classification: classification('II'),
      }),
      rules: [rule({ targetOrgId: ORG_ADALL })],
    });
    expect(matches).toEqual([]);
  });

  it('includes rules targeting other orgs', () => {
    const matches = evaluateRoutingRules({
      session: baseState({
        orgId: ORG_ADALL,
        classification: classification('II'),
      }),
      rules: [rule({ targetOrgId: ORG_AZ_AG })],
    });
    expect(matches).toHaveLength(1);
  });
});

// ─── complaint-type filter ────────────────────────────────────────────────────

describe('evaluateRoutingRules — complaint type', () => {
  it('matches when rule complaintTypes includes the classification title', () => {
    const matches = evaluateRoutingRules({
      session: baseState({ classification: classification('II') }),
      rules: [rule({ complaintTypes: ['II', 'III'] })],
    });
    expect(matches).toHaveLength(1);
  });

  it('skips when rule complaintTypes is non-empty and does not include classification', () => {
    const matches = evaluateRoutingRules({
      session: baseState({ classification: classification('I') }),
      rules: [rule({ complaintTypes: ['II', 'III'] })],
    });
    expect(matches).toEqual([]);
  });

  it('skips when session has no classification and rule specifies complaintTypes', () => {
    const matches = evaluateRoutingRules({
      session: baseState({ classification: null }),
      rules: [rule({ complaintTypes: ['II'] })],
    });
    expect(matches).toEqual([]);
  });

  it('matches when session has no classification but rule complaintTypes is empty', () => {
    const matches = evaluateRoutingRules({
      session: baseState({ classification: null }),
      rules: [rule({ complaintTypes: [] })],
    });
    expect(matches).toHaveLength(1);
  });
});

// ─── jurisdiction filter ──────────────────────────────────────────────────────

describe('evaluateRoutingRules — jurisdiction', () => {
  const jAZ: RoutingJurisdiction = { state: 'AZ' };
  const jAZPhoenix: RoutingJurisdiction = { state: 'AZ', city: 'Phoenix' };

  it('matches when session location_state matches rule jurisdiction', () => {
    const matches = evaluateRoutingRules({
      session: baseState({
        classification: classification('III'),
        extractedFields: { location_state: fieldEntry('AZ') },
      }),
      rules: [rule({ jurisdictions: [jAZ] })],
    });
    expect(matches).toHaveLength(1);
  });

  it('skips when session state does not match any rule jurisdiction', () => {
    const matches = evaluateRoutingRules({
      session: baseState({
        classification: classification('III'),
        extractedFields: { location_state: fieldEntry('CA') },
      }),
      rules: [rule({ jurisdictions: [jAZ] })],
    });
    expect(matches).toEqual([]);
  });

  it('state match is case-insensitive', () => {
    const matches = evaluateRoutingRules({
      session: baseState({
        classification: classification('III'),
        extractedFields: { location_state: fieldEntry('az') },
      }),
      rules: [rule({ jurisdictions: [jAZ] })],
    });
    expect(matches).toHaveLength(1);
  });

  it('matches city when rule specifies city AND session has matching city', () => {
    const matches = evaluateRoutingRules({
      session: baseState({
        classification: classification('III'),
        extractedFields: {
          location_state: fieldEntry('AZ'),
          location_city: fieldEntry('Phoenix'),
        },
      }),
      rules: [rule({ jurisdictions: [jAZPhoenix] })],
    });
    expect(matches).toHaveLength(1);
  });

  it('excludes when rule specifies city but session city differs', () => {
    const matches = evaluateRoutingRules({
      session: baseState({
        classification: classification('III'),
        extractedFields: {
          location_state: fieldEntry('AZ'),
          location_city: fieldEntry('Tucson'),
        },
      }),
      rules: [rule({ jurisdictions: [jAZPhoenix] })],
    });
    expect(matches).toEqual([]);
  });

  it('excludes when rule specifies city but session has no city', () => {
    const matches = evaluateRoutingRules({
      session: baseState({
        classification: classification('III'),
        extractedFields: { location_state: fieldEntry('AZ') },
      }),
      rules: [rule({ jurisdictions: [jAZPhoenix] })],
    });
    expect(matches).toEqual([]);
  });

  it('skips rules with jurisdictions when session has no state', () => {
    const matches = evaluateRoutingRules({
      session: baseState({ classification: classification('III') }),
      rules: [rule({ jurisdictions: [jAZ] })],
    });
    expect(matches).toEqual([]);
  });

  it('includes jurisdiction-agnostic rules (empty jurisdictions) even without session state', () => {
    const matches = evaluateRoutingRules({
      session: baseState({
        classification: classification('I'),
        // No location_state — but rule has no jurisdictions, so it matches.
      }),
      rules: [rule({ complaintTypes: ['I'], jurisdictions: [], targetOrgId: ORG_FED_EEOC, targetOrgCode: 'fed-eeoc', targetOrgDisplayName: 'Federal EEOC' })],
    });
    expect(matches).toHaveLength(1);
  });

  it('matches any of several rule jurisdictions', () => {
    const matches = evaluateRoutingRules({
      session: baseState({
        classification: classification('III'),
        extractedFields: { location_state: fieldEntry('CA') },
      }),
      rules: [
        rule({
          jurisdictions: [{ state: 'AZ' }, { state: 'CA' }, { state: 'NV' }],
        }),
      ],
    });
    expect(matches).toHaveLength(1);
  });
});

// ─── combined filters ─────────────────────────────────────────────────────────

describe('evaluateRoutingRules — combined filters', () => {
  it('all filters must pass for a rule to match', () => {
    const session = baseState({
      classification: classification('II'),
      extractedFields: { location_state: fieldEntry('AZ') },
    });
    const matches = evaluateRoutingRules({
      session,
      rules: [
        // Matches: classification II, AZ, not own org
        rule({
          ruleId: 'r-good',
          complaintTypes: ['II'],
          jurisdictions: [{ state: 'AZ' }],
        }),
        // Fails on complaintTypes
        rule({
          ruleId: 'r-bad-comp',
          complaintTypes: ['I'],
          jurisdictions: [{ state: 'AZ' }],
        }),
        // Fails on jurisdiction
        rule({
          ruleId: 'r-bad-jur',
          complaintTypes: ['II'],
          jurisdictions: [{ state: 'CA' }],
        }),
        // Fails on own-org guard
        rule({
          ruleId: 'r-bad-org',
          targetOrgId: ORG_ADALL,
          complaintTypes: ['II'],
          jurisdictions: [{ state: 'AZ' }],
        }),
      ],
    });
    expect(matches.map((m) => m.ruleId)).toEqual(['r-good']);
  });
});
