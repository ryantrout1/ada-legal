/**
 * Phase A4 — Ada engine discovery vocabulary swap.
 *
 * In `public_ada` mode, Ada's prompt discovery vocabulary is the
 * active litigation index (and any focused-litigation block from a
 * litigation_id deep-link), NOT the legacy Ch1 listings index.
 *
 * Before A4, `processAdaTurn.fetchListingContext` called
 * `clients.db.listActiveListings()` for every `public_ada` turn and
 * passed the results to the prompt assembler as `discoveryListings`,
 * which rendered a "class-action cases currently active on this
 * platform" block. That index was the Ch1 surface — at most 6 rows
 * even at peak. After A1/A2/A3, the canonical discovery surface is
 * `litigation_listings` (38 rows). Loading the Ch1 listings adds a
 * round-trip and a competing vocabulary to Ada's prompt.
 *
 * What MUST still work (regression guards in this file):
 *   - `class_action_intake` sessions still load `boundListing` —
 *     these are the listing_slug-bound sessions; that flow is
 *     untouched.
 *   - The active litigation index still appears in `public_ada`
 *     prompts (renderActiveLitigationIndex output).
 *   - Empty data (no listings, no litigation) does not crash and
 *     does not render either section.
 *
 * Ref: /plan Phase A4.
 */

import { describe, it, expect } from 'vitest';
import { processAdaTurn } from '@/engine/processAdaTurn';
import { createSession } from '@/engine/session/sessionRepo';
import {
  makeInMemoryClients,
  type InMemoryAdaClients,
} from '@/engine/clients/inMemoryClients';
import type {
  AiStreamChunk,
  CreateLitigationInput,
  LawFirmRow,
  ListingRow,
  ListingConfigRow,
} from '@/engine/clients/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const ANON_ID = '00000000-0000-4000-8000-000000000abc';
const FIRM_ID = '00000000-0000-4000-8000-00000000aa01';
const LIST_ID = '00000000-0000-4000-8000-00000000aa02';

function textOnlyTurn(text: string): AiStreamChunk[] {
  return [{ type: 'text_delta', content: text }, { type: 'message_stop' }];
}

function newPublicAdaSession(clients: InMemoryAdaClients) {
  return createSession(clients, {
    orgId: ORG_ID,
    sessionType: 'public_ada',
    anonSessionId: ANON_ID,
    userId: null,
  });
}

function seedCh1Listing(clients: InMemoryAdaClients) {
  const firm: LawFirmRow = {
    id: FIRM_ID,
    orgId: ORG_ID,
    name: 'Test Firm',
    primaryContact: null,
    email: null,
    phone: null,
    stripeCustomerId: null,
    status: 'active',
    isPilot: true,
  };
  const listing: ListingRow = {
    id: LIST_ID,
    lawFirmId: FIRM_ID,
    title: 'Old Hotel Fraud Listing',
    slug: 'hotel-fraud',
    category: 'ada_title_iii',
    shortDescription: 'Marker — should not appear in public_ada prompts',
    fullDescription: null,
    eligibilitySummary: null,
    status: 'published',
    tier: 'basic',
  };
  const config: ListingConfigRow = {
    id: '00000000-0000-4000-8000-00000000aa03',
    listingId: LIST_ID,
    caseDescription: 'Case description for the bound listing test fixture.',
    eligibilityCriteria: [],
    requiredFields: [],
    disqualifyingConditions: [],
    adaPromptOverride: null,
  };
  return Promise.all([
    clients.db.writeLawFirm(firm),
    clients.db.writeListing(listing),
    clients.db.writeListingConfig(config),
  ]);
}

function litigationInput(
  slug: string,
  caseName: string,
  shortDescription: string,
  overrides: Partial<CreateLitigationInput> = {},
): CreateLitigationInput {
  return {
    orgId: ORG_ID,
    kind: 'class',
    caseName,
    slug,
    status: 'active',
    shortDescription,
    ...overrides,
  };
}

describe('Phase A4 — public_ada uses litigation vocabulary, not Ch1 listings', () => {
  it('does NOT render the Ch1 discovery-listings index in a public_ada prompt', async () => {
    const clients = makeInMemoryClients();
    await seedCh1Listing(clients);
    await clients.db.createLitigation(
      litigationInput(
        'niles-v-hilton',
        'Niles v. Hilton Worldwide',
        'Hotel rooms designated accessible without ensuring safe wheelchair transfer.',
      ),
    );
    const state = newPublicAdaSession(clients);
    clients.ai.enqueueResponse(textOnlyTurn('Hi!'));

    await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'hello' },
    });

    expect(clients.ai.requests).toHaveLength(1);
    const sys = `${clients.ai.requests[0].systemPrompt}\n${clients.ai.requests[0].systemPromptCachePrefix ?? ''}`;

    // The Ch1 discovery-listing index header phrase must not appear.
    expect(sys).not.toContain('currently active on this platform');
    // Nor should the seeded Ch1 listing's title leak in.
    expect(sys).not.toContain('Old Hotel Fraud Listing');
    expect(sys).not.toContain('Marker — should not appear');
  });

  it('DOES render the active litigation index in a public_ada prompt', async () => {
    const clients = makeInMemoryClients();
    await clients.db.createLitigation(
      litigationInput(
        'niles-v-hilton',
        'Niles v. Hilton Worldwide',
        'Hotel rooms designated accessible without ensuring safe wheelchair transfer.',
      ),
    );
    await clients.db.createLitigation(
      litigationInput(
        'doj-v-uber',
        'United States v. Uber Technologies',
        'DOJ alleges Uber drivers deny rides to passengers with service animals.',
        { kind: 'enforcement_action' },
      ),
    );
    const state = newPublicAdaSession(clients);
    clients.ai.enqueueResponse(textOnlyTurn('Hi!'));

    await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'hello' },
    });

    const sys = `${clients.ai.requests[0].systemPrompt}\n${clients.ai.requests[0].systemPromptCachePrefix ?? ''}`;

    // Both seeded litigation rows surface by case name.
    expect(sys).toContain('Niles v. Hilton Worldwide');
    expect(sys).toContain('United States v. Uber Technologies');
  });

  it('renders nothing for either vocabulary when both stores are empty', async () => {
    const clients = makeInMemoryClients();
    const state = newPublicAdaSession(clients);
    clients.ai.enqueueResponse(textOnlyTurn('Hi!'));

    const result = await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'hello' },
    });

    // Should not crash, returns a normal assistant message.
    expect(result.assistantMessage.role).toBe('assistant');
    const sys = `${clients.ai.requests[0].systemPrompt}\n${clients.ai.requests[0].systemPromptCachePrefix ?? ''}`;
    expect(sys).not.toContain('currently active on this platform');
  });

  it('does NOT call db.listActiveListings during a public_ada turn', async () => {
    // Hard regression guard: even if a future refactor accidentally re-
    // introduces a listings discovery path, this spy will catch it.
    const clients = makeInMemoryClients();
    await seedCh1Listing(clients);
    let listActiveCalled = false;
    const original = clients.db.listActiveListings.bind(clients.db);
    clients.db.listActiveListings = async (...args: Parameters<typeof original>) => {
      listActiveCalled = true;
      return original(...args);
    };
    const state = newPublicAdaSession(clients);
    clients.ai.enqueueResponse(textOnlyTurn('Hi!'));

    await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'hello' },
    });

    expect(listActiveCalled).toBe(false);
  });

  it('class_action_intake sessions STILL load boundListing (regression guard)', async () => {
    const clients = makeInMemoryClients();
    await seedCh1Listing(clients);
    const state = createSession(clients, {
      orgId: ORG_ID,
      sessionType: 'class_action_intake',
      anonSessionId: ANON_ID,
      userId: null,
      listingId: LIST_ID,
    });
    clients.ai.enqueueResponse(textOnlyTurn('Hi!'));

    await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'hello' },
    });

    const sys = `${clients.ai.requests[0].systemPrompt}\n${clients.ai.requests[0].systemPromptCachePrefix ?? ''}`;
    // Bound listing should appear by title — the bound section is the
    // primary case context for these sessions and must survive A4.
    expect(sys).toContain('Old Hotel Fraud Listing');
  });
});
