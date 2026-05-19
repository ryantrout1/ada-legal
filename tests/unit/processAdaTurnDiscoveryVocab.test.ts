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

/**
 * Phase C3b-i — discovery vocabulary expands to all 4 surface-visible
 * statuses (active, compliance, investigating, tracking) and the
 * focused-block load remains stable across turns for any of them.
 *
 * Before C3b-i:
 *   - fetchActiveLitigation hardcoded limit: 20 and defaulted to
 *     statuses: ['active']. With 36 surface-visible rows in production,
 *     compliance/investigating/tracking rows were invisible to Ada.
 *   - fetchFocusedLitigation called readActiveLitigationBySlug without
 *     a statuses option, so on turn 2 of a Hilton-2010-bound session
 *     (kind=consent_decree, status=compliance) the focused block
 *     dropped — even though the session was successfully created with
 *     that binding at the API layer (api/ada/session.ts already passes
 *     the 4 statuses).
 *
 * Acceptance criteria covered: 1 (catalog completeness), 3 (focused
 * block stability), 8 (back-compat on legacy sessions).
 *
 * Ref: /plan Plan C, Phase C3b-i.
 */
describe('Phase C3b-i — expanded statuses in discovery + focused block', () => {
  it('surfaces compliance rows in the discovery index, not just active', async () => {
    const clients = makeInMemoryClients();
    await clients.db.createLitigation(
      litigationInput(
        'active-row',
        'Active Case Marker',
        'Active row that has always surfaced.',
        { status: 'active' },
      ),
    );
    await clients.db.createLitigation(
      litigationInput(
        'compliance-row',
        'Hilton 2010 Consent Decree Marker',
        'Compliance row that must now surface.',
        { kind: 'consent_decree', status: 'compliance' },
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
    expect(sys).toContain('Active Case Marker');
    expect(sys).toContain('Hilton 2010 Consent Decree Marker');
  });

  it('surfaces investigating rows in the discovery index', async () => {
    const clients = makeInMemoryClients();
    await clients.db.createLitigation(
      litigationInput(
        'doj-flixbus',
        'DOJ FlixBus Investigation Marker',
        'DOJ Title III investigation against intercity bus operator.',
        { kind: 'enforcement_action', status: 'investigating' },
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
    expect(sys).toContain('DOJ FlixBus Investigation Marker');
  });

  it('surfaces tracking rows in the discovery index', async () => {
    const clients = makeInMemoryClients();
    await clients.db.createLitigation(
      litigationInput(
        'a4a-v-dot',
        'A4A v. DOT Regulatory Challenge Marker',
        'Airline industry APA challenge to 2024 wheelchair rule.',
        { kind: 'regulatory_challenge', status: 'tracking' },
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
    expect(sys).toContain('A4A v. DOT Regulatory Challenge Marker');
  });

  it('focused block survives turn 2 for a compliance-bound session', async () => {
    const clients = makeInMemoryClients();
    // Seed a compliance row representing Hilton 2010.
    const compliance = await clients.db.createLitigation(
      litigationInput(
        'hilton-2010',
        'United States v. Hilton 2010',
        'Bed-height accessibility consent decree marker.',
        { kind: 'consent_decree', status: 'compliance' },
      ),
    );
    // Session opened from the public detail page CTA — metadata
    // carries the slug, and litigationListingId is set per the new
    // session.ts behavior (Phase A3a).
    const state = createSession(clients, {
      orgId: ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: ANON_ID,
      userId: null,
    });
    state.litigationListingId = compliance.id;
    state.metadata = {
      ...state.metadata,
      litigation_context: {
        id: compliance.id,
        slug: 'hilton-2010',
        kind: 'consent_decree',
        case_name: 'United States v. Hilton 2010',
      },
    };

    // Turn 1.
    clients.ai.enqueueResponse(textOnlyTurn('Hi!'));
    await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'hello' },
    });
    const sysTurn1 = `${clients.ai.requests[0].systemPrompt}\n${clients.ai.requests[0].systemPromptCachePrefix ?? ''}`;
    expect(
      sysTurn1,
      'turn 1 should render the focused block for a compliance-bound session',
    ).toContain('United States v. Hilton 2010');

    // Turn 2 — without C3b-i, the focused block would drop because
    // fetchFocusedLitigation re-reads with the default statuses=['active'].
    clients.ai.enqueueResponse(textOnlyTurn('Hi again!'));
    await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'tell me more' },
    });
    const sysTurn2 = `${clients.ai.requests[1].systemPrompt}\n${clients.ai.requests[1].systemPromptCachePrefix ?? ''}`;
    expect(
      sysTurn2,
      'turn 2 must STILL render the focused block — Phase C3b-i fixes the status filter on the per-turn re-load',
    ).toContain('United States v. Hilton 2010');
  });

  it('back-compat: legacy session with metadata-only litigation_context still resolves focused block', async () => {
    // Acceptance criterion 8: a pre-existing session row that has
    // metadata.litigation_context.slug set BUT no litigationListingId
    // (legacy pre-A3a sessions) must continue to work.
    const clients = makeInMemoryClients();
    const row = await clients.db.createLitigation(
      litigationInput(
        'legacy-niles',
        'Legacy Niles Marker',
        'Legacy session resolution path.',
      ),
    );
    const state = createSession(clients, {
      orgId: ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: ANON_ID,
      userId: null,
    });
    // Legacy state: metadata only, no litigationListingId.
    state.litigationListingId = null;
    state.metadata = {
      ...state.metadata,
      litigation_context: {
        id: row.id,
        slug: 'legacy-niles',
        kind: 'class',
        case_name: 'Legacy Niles Marker',
      },
    };

    clients.ai.enqueueResponse(textOnlyTurn('Hi!'));
    await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'hello' },
    });
    const sys = `${clients.ai.requests[0].systemPrompt}\n${clients.ai.requests[0].systemPromptCachePrefix ?? ''}`;
    expect(sys).toContain('Legacy Niles Marker');
  });

  it('forward path: litigationListingId-only (no metadata) also resolves focused block', async () => {
    // The new match_litigation tool (Phase C3b-ii) will set
    // litigationListingId without necessarily updating metadata in the
    // same turn. C3b-i prepares fetchFocusedLitigation to accept either
    // resolution path so C3b-ii can land cleanly on top.
    const clients = makeInMemoryClients();
    const row = await clients.db.createLitigation(
      litigationInput(
        'fwd-path-row',
        'Forward Path Marker',
        'Tests litigationListingId-only resolution.',
      ),
    );
    const state = createSession(clients, {
      orgId: ORG_ID,
      sessionType: 'public_ada',
      anonSessionId: ANON_ID,
      userId: null,
    });
    state.litigationListingId = row.id;
    // Explicitly NO metadata.litigation_context — this is the path the
    // tool-driven binding will take in C3b-ii.

    clients.ai.enqueueResponse(textOnlyTurn('Hi!'));
    await processAdaTurn({
      clients,
      state,
      input: { userMessage: 'hello' },
    });
    const sys = `${clients.ai.requests[0].systemPrompt}\n${clients.ai.requests[0].systemPromptCachePrefix ?? ''}`;
    // Specifically detect the FOCUSED block, not the index — both
    // would mention the row by name, but only the focused block uses
    // the "starting point" / "came in about" framing from
    // renderFocusedLitigation.
    expect(sys).toContain('Forward Path Marker');
    expect(sys.toLowerCase()).toMatch(/starting point|came in about|already interested/);
  });
});
