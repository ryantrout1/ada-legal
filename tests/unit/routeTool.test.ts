/**
 * Tests for the `route` tool.
 *
 * The route tool has three destinations with different rules:
 *   - external: hop token, transition completed, hard gates
 *   - attorney_directory: soft route, keeps session open
 *   - end_conversation: hard close
 *
 * We test each destination's happy path and each rejection path.
 *
 * Ref: Step 22.
 */

import { describe, it, expect } from 'vitest';
import { routeTool } from '@/engine/tools/impls/route';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { AdaClients } from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';
import type { RoutingMatch } from '@/engine/routing/evaluate';

const STRONG_SECRET = 'x'.repeat(32);
const ORG_ADALL = '00000000-0000-4000-8000-000000000001';
const ORG_AZ = '00000000-0000-4000-8000-000000000002';
const ORG_CA = '00000000-0000-4000-8000-000000000003';

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

function clientsWithSecret(): AdaClients {
  const clients = makeInMemoryClients();
  (clients as AdaClients & { hopSecret?: string }).hopSecret = STRONG_SECRET;
  return clients;
}

function match(overrides: Partial<RoutingMatch> = {}): RoutingMatch {
  return {
    ruleId: 'rule-1',
    targetOrgId: ORG_AZ,
    targetOrgCode: 'az-ag',
    targetOrgDisplayName: 'Arizona Attorney General',
    priority: 100,
    ...overrides,
  };
}

// ─── validateInput ────────────────────────────────────────────────────────────

describe('route — validateInput', () => {
  it('accepts external destination with valid target_org_id', () => {
    const out = routeTool.validateInput({
      destination: 'external',
      target_org_id: ORG_AZ,
      user_agreed: true,
    });
    expect(out.destination).toBe('external');
    expect(out.target_org_id).toBe(ORG_AZ);
  });

  it('accepts attorney_directory without target_org_id', () => {
    const out = routeTool.validateInput({
      destination: 'attorney_directory',
      user_agreed: true,
    });
    expect(out.destination).toBe('attorney_directory');
    expect(out.target_org_id).toBeNull();
  });

  it('accepts end_conversation', () => {
    const out = routeTool.validateInput({
      destination: 'end_conversation',
      user_agreed: false,
    });
    expect(out.destination).toBe('end_conversation');
  });

  it('rejects an unknown destination', () => {
    expect(() =>
      routeTool.validateInput({
        destination: 'somewhere_else',
        user_agreed: true,
      }),
    ).toThrow(/destination must be/);
  });

  it('rejects a non-UUID target_org_id', () => {
    expect(() =>
      routeTool.validateInput({
        destination: 'external',
        target_org_id: 'not-a-uuid',
        user_agreed: true,
      }),
    ).toThrow(/UUID/);
  });

  it('rejects external without a target_org_id', () => {
    expect(() =>
      routeTool.validateInput({
        destination: 'external',
        user_agreed: true,
      }),
    ).toThrow(/target_org_id is required/);
  });

  it('rejects non-boolean user_agreed', () => {
    expect(() =>
      routeTool.validateInput({
        destination: 'end_conversation',
        user_agreed: 'yes',
      }),
    ).toThrow(/user_agreed must be a boolean/);
  });
});

// ─── end_conversation ─────────────────────────────────────────────────────────

describe('route — end_conversation', () => {
  it('transitions the session to completed with ended_by_ada outcome', async () => {
    const clients = clientsWithSecret();
    const result = await routeTool.execute(
      { clients, state: baseState() },
      { destination: 'end_conversation', target_org_id: null, user_agreed: false },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stateChanges?.sessionTransition).toBe('complete');
    expect(result.stateChanges?.metadataPatch?.outcome).toBe('ended_by_ada');
  });

  it('rejects on a non-active session', async () => {
    const clients = clientsWithSecret();
    const result = await routeTool.execute(
      { clients, state: baseState({ status: 'completed' }) },
      { destination: 'end_conversation', target_org_id: null, user_agreed: false },
    );
    expect(result.ok).toBe(false);
  });
});

// ─── attorney_directory ───────────────────────────────────────────────────────

describe('route — attorney_directory', () => {
  it('keeps the session open (no transition) and records an outcome', async () => {
    const clients = clientsWithSecret();
    const result = await routeTool.execute(
      { clients, state: baseState() },
      { destination: 'attorney_directory', target_org_id: null, user_agreed: true },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stateChanges?.sessionTransition).toBeUndefined();
    expect(result.stateChanges?.metadataPatch?.outcome).toBe(
      'routed_to_attorney_directory',
    );
  });

  it('does not overwrite a pre-existing outcome', async () => {
    const clients = clientsWithSecret();
    const state = baseState({
      metadata: { outcome: 'something_else' },
    });
    const result = await routeTool.execute(
      { clients, state },
      { destination: 'attorney_directory', target_org_id: null, user_agreed: true },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stateChanges?.metadataPatch?.outcome).toBe('something_else');
  });
});

// ─── external ─────────────────────────────────────────────────────────────────

describe('route — external', () => {
  it('happy path: mints hop token and transitions to completed', async () => {
    const clients = clientsWithSecret();
    const state = baseState({
      routingMatches: [match()],
    });
    const result = await routeTool.execute(
      { clients, state },
      { destination: 'external', target_org_id: ORG_AZ, user_agreed: true },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const content = result.content as Record<string, unknown>;
    expect(content.hop_url).toMatch(/^https:\/\/gov\.adalegallink\.com\/az-ag\?hop=/);
    expect(content.target_org_code).toBe('az-ag');
    expect(result.stateChanges?.sessionTransition).toBe('complete');
    expect(result.stateChanges?.metadataPatch?.outcome).toBe('redirected_to_az-ag');
  });

  it('rejects when user_agreed is false', async () => {
    const clients = clientsWithSecret();
    const state = baseState({ routingMatches: [match()] });
    const result = await routeTool.execute(
      { clients, state },
      { destination: 'external', target_org_id: ORG_AZ, user_agreed: false },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/user_agreed must be true/);
  });

  it('rejects when target_org_id is not in routingMatches', async () => {
    const clients = clientsWithSecret();
    const state = baseState({ routingMatches: [match()] });
    const result = await routeTool.execute(
      { clients, state },
      { destination: 'external', target_org_id: ORG_CA, user_agreed: true },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not in the routing destinations/);
  });

  it('rejects when routingMatches is empty', async () => {
    const clients = clientsWithSecret();
    const state = baseState({ routingMatches: [] });
    const result = await routeTool.execute(
      { clients, state },
      { destination: 'external', target_org_id: ORG_AZ, user_agreed: true },
    );
    expect(result.ok).toBe(false);
  });

  it('rejects when hopSecret is not configured', async () => {
    const clients = makeInMemoryClients(); // no hopSecret
    const state = baseState({ routingMatches: [match()] });
    const result = await routeTool.execute(
      { clients, state },
      { destination: 'external', target_org_id: ORG_AZ, user_agreed: true },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/hop secret is not configured/);
  });

  it('rejects on a non-active session', async () => {
    const clients = clientsWithSecret();
    const state = baseState({
      status: 'completed',
      routingMatches: [match()],
    });
    const result = await routeTool.execute(
      { clients, state },
      { destination: 'external', target_org_id: ORG_AZ, user_agreed: true },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/cannot route a non-active session/);
  });

  it('URL-encodes the org code in the hop URL', async () => {
    const clients = clientsWithSecret();
    const state = baseState({
      routingMatches: [
        match({ targetOrgCode: 'weird org!' }),
      ],
    });
    const result = await routeTool.execute(
      { clients, state },
      { destination: 'external', target_org_id: ORG_AZ, user_agreed: true },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const content = result.content as Record<string, unknown>;
    expect(content.hop_url).toContain('weird%20org');
  });
});
