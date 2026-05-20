/**
 * Tests for the match_litigation tool (Phase C3b-ii).
 *
 * Sibling to match_listing but for the litigation channel: when the
 * user comes in cold on /Ada (no deep-link binding) and Ada recognizes
 * a match against an active litigation row in the catalog, she calls
 * match_litigation to bind the session. From the next turn forward,
 * the focused-block resolution path picks up litigationListingId and
 * renders the case with its qualifying-question sub-block.
 *
 * Hard gates (mirroring match_listing's discipline):
 *   1. user_confirmed must be true — Ada presents candidate(s) and only
 *      fires once the user explicitly picks one.
 *   2. One-time binding — if litigationListingId is already set, the
 *      call fails. Users can't switch litigation mid-conversation.
 *   3. The litigation must be surface-visible (status in active /
 *      compliance / investigating / tracking — same set the catalog
 *      surfaces).
 *   4. session_type must be 'public_ada'. Ch1 listing sessions
 *      (class_action_intake) have their own match_listing path.
 *
 * Side effects on success:
 *   - state.litigationListingId is set via stateChanges.litigationListingId
 *   - session_type stays 'public_ada' (litigation is discovery, not
 *     a per-firm intake flow — same rule as session-creation binding,
 *     see sessionLitigationBinding.test.ts)
 *
 * Ref: /plan Plan C, Phase C3b-ii, acceptance criterion 5.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { matchLitigationTool } from '@/engine/tools/impls/matchLitigation';
import type { AdaClients, CreateLitigationInput } from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';

function baseState(overrides: Partial<AdaSessionState> = {}): AdaSessionState {
  return {
    sessionId: '00000000-0000-4000-8000-000000000111',
    orgId: ORG_ID,
    sessionType: 'public_ada',
    status: 'active',
    readingLevel: 'standard',
    anonSessionId: '00000000-0000-4000-8000-000000000222',
    userId: null,
    listingId: null,
    litigationListingId: null,
    conversationHistory: [],
    extractedFields: {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: false,
    ...overrides,
  };
}

function activeLitigation(
  slug: string,
  overrides: Partial<CreateLitigationInput> = {},
): CreateLitigationInput {
  return {
    orgId: ORG_ID,
    kind: 'class',
    caseName: `Case ${slug}`,
    slug,
    status: 'active',
    ...overrides,
  };
}

async function seedLitigation(
  c: AdaClients,
  input: CreateLitigationInput,
): Promise<string> {
  const created = await c.db.createLitigation(input);
  return created.id;
}

describe('match_litigation — success path', () => {
  it('binds litigationListingId when the row is active and user_confirmed', async () => {
    const c = makeInMemoryClients();
    const id = await seedLitigation(c, activeLitigation('niles-v-hilton'));

    const result = await matchLitigationTool.execute(
      { clients: c, state: baseState() },
      {
        litigation_id: id,
        confidence: 0.9,
        user_confirmed: true,
      },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return; // narrowing
    expect(result.stateChanges?.litigationListingId).toBe(id);
    // sessionType stays public_ada — litigation binding does NOT promote
    // to class_action_intake. That promotion is reserved for Ch1 listings.
    expect(result.stateChanges?.sessionTypeChange).toBeUndefined();
    expect(result.content).toMatchObject({
      matched: true,
      litigation_id: id,
      confidence: 0.9,
    });
  });

  it('binds rows in compliance / investigating / tracking status (surface-visible set)', async () => {
    const c = makeInMemoryClients();
    const id = await seedLitigation(
      c,
      activeLitigation('hilton-2010-consent', { status: 'compliance' }),
    );

    const result = await matchLitigationTool.execute(
      { clients: c, state: baseState() },
      { litigation_id: id, confidence: 0.85, user_confirmed: true },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stateChanges?.litigationListingId).toBe(id);
  });
});

describe('match_litigation — failure gates', () => {
  it('rejects when user_confirmed is false', async () => {
    const c = makeInMemoryClients();
    const id = await seedLitigation(c, activeLitigation('niles-v-hilton'));

    const result = await matchLitigationTool.execute(
      { clients: c, state: baseState() },
      { litigation_id: id, confidence: 0.95, user_confirmed: false },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/user_confirmed/);
  });

  it('rejects when the session is already bound to a litigation', async () => {
    const c = makeInMemoryClients();
    const id1 = await seedLitigation(c, activeLitigation('first-case'));
    const id2 = await seedLitigation(c, activeLitigation('second-case'));

    const result = await matchLitigationTool.execute(
      { clients: c, state: baseState({ litigationListingId: id1 }) },
      { litigation_id: id2, confidence: 0.9, user_confirmed: true },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/already bound/i);
  });

  it('rejects when the session is not public_ada', async () => {
    const c = makeInMemoryClients();
    const id = await seedLitigation(c, activeLitigation('niles-v-hilton'));

    const result = await matchLitigationTool.execute(
      { clients: c, state: baseState({ sessionType: 'class_action_intake' }) },
      { litigation_id: id, confidence: 0.9, user_confirmed: true },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/public_ada/);
  });

  it('rejects when the litigation row does not exist', async () => {
    const c = makeInMemoryClients();
    const ghostId = '20000000-0000-4000-8000-00000000dead';

    const result = await matchLitigationTool.execute(
      { clients: c, state: baseState() },
      { litigation_id: ghostId, confidence: 0.9, user_confirmed: true },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not.*surface-visible|not found/i);
  });

  it('rejects when the litigation row is draft / closed / archived (not surface-visible)', async () => {
    const c = makeInMemoryClients();
    const id = await seedLitigation(
      c,
      activeLitigation('closed-case', { status: 'closed' }),
    );

    const result = await matchLitigationTool.execute(
      { clients: c, state: baseState() },
      { litigation_id: id, confidence: 0.9, user_confirmed: true },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not.*surface-visible|status/i);
  });
});

describe('match_litigation — input validation', () => {
  it('rejects non-UUID litigation_id at validateInput', () => {
    expect(() =>
      matchLitigationTool.validateInput({
        litigation_id: 'not-a-uuid',
        confidence: 0.9,
        user_confirmed: true,
      }),
    ).toThrow(/UUID/);
  });

  it('rejects confidence outside [0, 1]', () => {
    expect(() =>
      matchLitigationTool.validateInput({
        litigation_id: '20000000-0000-4000-8000-000000000001',
        confidence: 1.5,
        user_confirmed: true,
      }),
    ).toThrow(/confidence/);
  });

  it('rejects non-boolean user_confirmed', () => {
    expect(() =>
      matchLitigationTool.validateInput({
        litigation_id: '20000000-0000-4000-8000-000000000001',
        confidence: 0.9,
        user_confirmed: 'yes',
      }),
    ).toThrow(/user_confirmed/);
  });

  it('rejects non-object input', () => {
    expect(() => matchLitigationTool.validateInput(null)).toThrow();
    expect(() => matchLitigationTool.validateInput('string')).toThrow();
  });
});

describe('match_litigation — registry presence', () => {
  it('tool exports the expected name and is registered in CH0_TOOLS', async () => {
    expect(matchLitigationTool.name).toBe('match_litigation');
    // Import here to avoid a circular import at module-load time.
    const { CH0_TOOLS } = await import('@/engine/tools/registry');
    const names = CH0_TOOLS.map((t) => t.name);
    expect(names).toContain('match_litigation');
  });
});
