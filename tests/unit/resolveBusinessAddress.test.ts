/**
 * Tests for maybeResolveBusinessAddress (v1a orchestrator).
 *
 * Same pattern as the self-help email orchestrator: a stub PlacesClient
 * plus the in-memory DB. Verifies the gating (places present, public_ada,
 * letter classification, business name), that a match is returned and a
 * receipt persisted to session metadata, and that a no-match / thrown
 * error soft-fails to null while still recording a receipt.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { maybeResolveBusinessAddress } from '@/engine/package/resolveBusinessAddress';
import type { AdaSessionState } from '@/engine/types';
import type {
  Classification,
} from '@/types/db';
import type {
  PlacesClient,
  ResolvedBusinessAddress,
} from '@/engine/clients/types';

const SESSION = '00000000-0000-4000-8000-000000000d1f';

function field(value: unknown) {
  return { value, confidence: 0.9, extracted_at: '2026-04-22T00:00:00.000Z' };
}

const TITLE_III: Classification = {
  title: 'III',
  tier: 'high',
  reasoning: 'no accessible entrance',
  standard: '28 CFR §36.304',
};

const RESOLVED: ResolvedBusinessAddress = {
  businessName: "Joe's Diner",
  street: '123 East Main Street',
  city: 'Phoenix',
  state: 'AZ',
  postalCode: '85004',
  placeId: 'ChIJ_test',
  formattedAddress: '123 E Main St, Phoenix, AZ 85004, USA',
};

function baseState(overrides: Partial<AdaSessionState> = {}): AdaSessionState {
  return {
    sessionId: SESSION,
    orgId: '00000000-0000-4000-8000-000000000001',
    sessionType: 'public_ada',
    status: 'completed',
    readingLevel: 'standard',
    anonSessionId: '00000000-0000-4000-8000-0000000000a1',
    userId: null,
    listingId: null,
    litigationListingId: null,
    conversationHistory: [],
    extractedFields: { business_name: field("Joe's Diner") },
    classification: TITLE_III,
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
    ...overrides,
  };
}

class StubPlaces implements PlacesClient {
  calls = 0;
  constructor(private readonly result: ResolvedBusinessAddress | null) {}
  async resolveBusinessAddress(): Promise<ResolvedBusinessAddress | null> {
    this.calls += 1;
    return this.result;
  }
}

class ThrowingPlaces implements PlacesClient {
  async resolveBusinessAddress(): Promise<ResolvedBusinessAddress | null> {
    throw new Error('Places 403');
  }
}

describe('maybeResolveBusinessAddress', () => {
  it('returns null and does nothing when no places client is configured', async () => {
    const clients = makeInMemoryClients();
    const state = baseState();
    await clients.db.writeSession({ state });

    const out = await maybeResolveBusinessAddress({ db: clients.db }, state);

    expect(out).toBeNull();
    const stored = await clients.db.readSession({ sessionId: SESSION });
    expect(
      (stored!.metadata as Record<string, unknown>).business_address_lookup,
    ).toBeUndefined();
  });

  it('no-ops for non-public_ada sessions', async () => {
    const clients = makeInMemoryClients();
    const places = new StubPlaces(RESOLVED);
    const state = baseState({ sessionType: 'class_action_intake' });
    const out = await maybeResolveBusinessAddress({ places, db: clients.db }, state);
    expect(out).toBeNull();
    expect(places.calls).toBe(0);
  });

  it('no-ops when the classification produces no letter (Title I)', async () => {
    const clients = makeInMemoryClients();
    const places = new StubPlaces(RESOLVED);
    const state = baseState({
      classification: {
        title: 'I',
        tier: 'high',
        reasoning: 'employment',
        standard: '42 U.S.C. §12112',
      },
    });
    const out = await maybeResolveBusinessAddress({ places, db: clients.db }, state);
    expect(out).toBeNull();
    expect(places.calls).toBe(0);
  });

  it('no-ops when no business name was captured', async () => {
    const clients = makeInMemoryClients();
    const places = new StubPlaces(RESOLVED);
    const state = baseState({ extractedFields: {} });
    const out = await maybeResolveBusinessAddress({ places, db: clients.db }, state);
    expect(out).toBeNull();
    expect(places.calls).toBe(0);
  });

  it('returns the resolved address and records a matched receipt', async () => {
    const clients = makeInMemoryClients();
    const places = new StubPlaces(RESOLVED);
    const state = baseState();
    await clients.db.writeSession({ state });

    const out = await maybeResolveBusinessAddress({ places, db: clients.db }, state);

    expect(out).toEqual(RESOLVED);
    const stored = await clients.db.readSession({ sessionId: SESSION });
    const receipt = (stored!.metadata as Record<string, unknown>)
      .business_address_lookup as Record<string, unknown>;
    expect(receipt.matched).toBe(true);
    expect(receipt.placeId).toBe('ChIJ_test');
    expect(receipt.error).toBeNull();
  });

  it('soft-fails to null and records an unmatched receipt when there is no match', async () => {
    const clients = makeInMemoryClients();
    const places = new StubPlaces(null);
    const state = baseState();
    await clients.db.writeSession({ state });

    const out = await maybeResolveBusinessAddress({ places, db: clients.db }, state);

    expect(out).toBeNull();
    const stored = await clients.db.readSession({ sessionId: SESSION });
    const receipt = (stored!.metadata as Record<string, unknown>)
      .business_address_lookup as Record<string, unknown>;
    expect(receipt.matched).toBe(false);
    expect(receipt.error).toBeNull();
  });

  it('soft-fails to null and records the error when the client throws', async () => {
    const clients = makeInMemoryClients();
    const state = baseState();
    await clients.db.writeSession({ state });

    const out = await maybeResolveBusinessAddress(
      { places: new ThrowingPlaces(), db: clients.db },
      state,
    );

    expect(out).toBeNull();
    const stored = await clients.db.readSession({ sessionId: SESSION });
    const receipt = (stored!.metadata as Record<string, unknown>)
      .business_address_lookup as Record<string, unknown>;
    expect(receipt.matched).toBe(false);
    expect(receipt.error).toMatch(/Places 403/);
  });
});
