/**
 * Tests for Step 21: ListingConfig-aware prompt assembly.
 *
 * Three surfaces under test:
 *   1. renderBoundListingContext — the full LISTING CONTEXT section
 *      for a session bound to a listing.
 *   2. renderDiscoveryListingIndex — the condensed per-listing index
 *      for public_ada sessions.
 *   3. extractField tool's new schema-validation behavior when the
 *      session is bound to a listing.
 *
 * Rendering tests are "golden" in spirit: we assert on specific
 * substrings we expect to see, not byte-for-byte output, so a cosmetic
 * tweak (adding a blank line, rewording a hint) doesn't force a test
 * update. The substrings we assert on are the ones Ada's behavior
 * depends on.
 *
 * Ref: Step 21.
 */

import { describe, it, expect } from 'vitest';
import {
  renderBoundListingContext,
  renderDiscoveryListingIndex,
} from '@/engine/prompt/listingContext';
import { extractFieldTool } from '@/engine/tools/impls/extractField';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type {
  ListingRow,
  ListingConfigRow,
  ActiveListingRow,
} from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';

const LIST_ID = '00000000-0000-4000-8000-000000000a02';
const CFG_ID = '00000000-0000-4000-8000-000000000a03';
const FIRM_ID = '00000000-0000-4000-8000-000000000a01';

function baseState(overrides: Partial<AdaSessionState> = {}): AdaSessionState {
  return {
    sessionId: '00000000-0000-4000-8000-000000000111',
    orgId: '00000000-0000-4000-8000-000000000001',
    sessionType: 'public_ada',
    status: 'active',
    readingLevel: 'standard',
    anonSessionId: null,
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

function makeListing(overrides: Partial<ListingRow> = {}): ListingRow {
  return {
    id: LIST_ID,
    lawFirmId: FIRM_ID,
    title: 'Hotel booking fraud class action',
    slug: 'hotel-booking-fraud',
    category: 'ada_title_iii',
    shortDescription: 'Class action for misrepresented accessible rooms.',
    fullDescription: null,
    eligibilitySummary: null,
    status: 'published',
    tier: 'basic',
    ...overrides,
  };
}

function makeConfig(overrides: Partial<ListingConfigRow> = {}): ListingConfigRow {
  return {
    id: CFG_ID,
    listingId: LIST_ID,
    caseDescription:
      'This case involves hotels misrepresenting accessible rooms at booking time. ' +
      'Plaintiffs booked accessible rooms and received rooms that did not meet ADA standards.',
    eligibilityCriteria: [
      { description: 'Booked an accessible room between 2022 and 2025', kind: 'required' },
      { description: 'Have photo or written evidence of the misrepresentation', kind: 'preferred' },
      { description: 'Claim is outside Arizona, California, and New York', kind: 'disqualifying' },
    ],
    requiredFields: [
      {
        name: 'hotel_name',
        description: 'Name of the hotel where the booking was made',
        required: true,
        type: 'string',
      },
      {
        name: 'incident_date',
        description: 'Date the user arrived at the hotel',
        required: true,
        type: 'date',
      },
      {
        name: 'was_refunded',
        description: 'Whether the hotel issued a refund',
        required: false,
        type: 'yes_no',
      },
    ],
    disqualifyingConditions: ['claim_older_than_three_years'],
    adaPromptOverride: null,
    ...overrides,
  };
}

// ─── renderBoundListingContext ────────────────────────────────────────────────

describe('renderBoundListingContext', () => {
  it('includes the listing title and case description', () => {
    const out = renderBoundListingContext({
      listing: makeListing(),
      config: makeConfig(),
    });
    expect(out).toContain('Hotel booking fraud class action');
    expect(out).toContain('hotels misrepresenting accessible rooms');
  });

  it('groups eligibility criteria by kind with clear headers', () => {
    const out = renderBoundListingContext({
      listing: makeListing(),
      config: makeConfig(),
    });
    expect(out).toMatch(/Must be true:/);
    expect(out).toMatch(/Strengthens the case/);
    expect(out).toMatch(/Disqualifying/);
    expect(out).toContain('Booked an accessible room');
    expect(out).toContain('Have photo or written evidence');
    expect(out).toContain('outside Arizona, California, and New York');
  });

  it('lists hard disqualifying conditions separately', () => {
    const out = renderBoundListingContext({
      listing: makeListing(),
      config: makeConfig(),
    });
    expect(out).toContain('Immediate disqualifications');
    expect(out).toContain('claim_older_than_three_years');
  });

  it('renders each required field with type + required flag', () => {
    const out = renderBoundListingContext({
      listing: makeListing(),
      config: makeConfig(),
    });
    expect(out).toContain('`hotel_name`');
    expect(out).toContain('string');
    expect(out).toContain('required');
    expect(out).toContain('`incident_date`');
    expect(out).toContain('date');
    expect(out).toContain('`was_refunded`');
    expect(out).toContain('yes_no');
  });

  it('renders enum values inline when present', () => {
    const out = renderBoundListingContext({
      listing: makeListing(),
      config: makeConfig({
        requiredFields: [
          {
            name: 'room_type',
            description: 'Type of accessible room',
            required: true,
            type: 'enum',
            enum_values: ['mobility', 'hearing', 'visual'],
          },
        ],
      }),
    });
    expect(out).toContain('`room_type`');
    expect(out).toContain('mobility');
    expect(out).toContain('hearing');
    expect(out).toContain('visual');
  });

  it('renders validation_hint when present', () => {
    const out = renderBoundListingContext({
      listing: makeListing(),
      config: makeConfig({
        requiredFields: [
          {
            name: 'incident_date',
            description: 'Date of incident',
            required: true,
            type: 'date',
            validation_hint: 'Must be within the last 3 years.',
          },
        ],
      }),
    });
    expect(out).toContain('Must be within the last 3 years');
  });

  it('appends ada_prompt_override after structured context when set', () => {
    const out = renderBoundListingContext({
      listing: makeListing(),
      config: makeConfig({
        adaPromptOverride:
          'Always ask users whether they kept the booking confirmation email.',
      }),
    });
    expect(out).toContain('Additional guidance from the firm');
    expect(out).toContain('booking confirmation email');
    // Must appear AFTER "Fields to collect" section.
    const fieldsIdx = out.indexOf('Fields to collect');
    const guidanceIdx = out.indexOf('Additional guidance');
    expect(fieldsIdx).toBeLessThan(guidanceIdx);
  });

  it('closes with a CTA tying to finalize_intake', () => {
    const out = renderBoundListingContext({
      listing: makeListing(),
      config: makeConfig(),
    });
    expect(out).toContain('finalize_intake');
    expect(out).toContain('qualified=true');
    expect(out).toContain('qualified=false');
    expect(out).toMatch(/do NOT disqualify for missing information/i);
  });
});

// ─── renderDiscoveryListingIndex ──────────────────────────────────────────────

describe('renderDiscoveryListingIndex', () => {
  function makeActiveRow(
    overrides: Partial<ActiveListingRow> = {},
  ): ActiveListingRow {
    return {
      listingId: LIST_ID,
      slug: 'a',
      title: 'Listing A',
      category: 'ada_title_iii',
      tier: 'basic',
      shortDescription: 'Case A short desc.',
      fullDescription: null,
      eligibilitySummary: null,
      lawFirmId: FIRM_ID,
      lawFirmName: 'Acme ADA Law',
      subscriptionId: '00000000-0000-4000-8000-000000000b01',
      subscriptionTier: 'basic',
      currentPeriodEnd: null,
      isPilot: false,
      ...overrides,
    };
  }

  it('returns empty string when there are no listings', () => {
    expect(renderDiscoveryListingIndex([])).toBe('');
  });

  it('renders a one-line entry per listing', () => {
    const out = renderDiscoveryListingIndex([
      makeActiveRow({ listingId: '00000000-0000-4000-8000-000000000001', title: 'Case A' }),
      makeActiveRow({ listingId: '00000000-0000-4000-8000-000000000002', title: 'Case B', shortDescription: 'Case B short desc.' }),
    ]);
    expect(out).toContain('Case A');
    expect(out).toContain('Case B');
    expect(out).toContain('Case A short desc.');
    expect(out).toContain('Case B short desc.');
  });

  it('includes the listing_id so Ada can reference it in match_listing', () => {
    const out = renderDiscoveryListingIndex([
      makeActiveRow({ listingId: '11111111-1111-4111-8111-111111111111' }),
    ]);
    expect(out).toContain('11111111-1111-4111-8111-111111111111');
  });

  it('deduplicates by listingId when multiple subscriptions exist', () => {
    const out = renderDiscoveryListingIndex([
      makeActiveRow({ listingId: LIST_ID, subscriptionId: 's1' }),
      makeActiveRow({ listingId: LIST_ID, subscriptionId: 's2' }),
    ]);
    // The title should appear only once, not twice.
    const matches = out.match(/Listing A/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('gracefully handles missing shortDescription', () => {
    const out = renderDiscoveryListingIndex([
      makeActiveRow({ shortDescription: null }),
    ]);
    expect(out).toContain('Listing A');
    expect(out).toMatch(/no short description/i);
  });

  it('instructs Ada to only fire match_listing after explicit confirmation', () => {
    const out = renderDiscoveryListingIndex([makeActiveRow()]);
    expect(out).toMatch(/match_listing/);
    expect(out).toMatch(/confirm/i);
  });
});

// ─── extract_field ListingConfig validation ───────────────────────────────────

describe('extract_field — ListingConfig validation (Step 21)', () => {
  async function seed(clients: ReturnType<typeof makeInMemoryClients>) {
    await clients.db.writeListingConfig({
      id: CFG_ID,
      listingId: LIST_ID,
      caseDescription: 'Test case',
      eligibilityCriteria: [],
      requiredFields: [
        {
          name: 'hotel_name',
          description: 'Name of the hotel',
          required: true,
          type: 'string',
        },
        {
          name: 'incident_date',
          description: 'Date of incident',
          required: true,
          type: 'date',
        },
        {
          name: 'room_type',
          description: 'Type of accessible room',
          required: true,
          type: 'enum',
          enum_values: ['mobility', 'hearing', 'visual'],
        },
        {
          name: 'was_refunded',
          description: 'Refund status',
          required: false,
          type: 'yes_no',
        },
        {
          name: 'refund_amount',
          description: 'Amount refunded',
          required: false,
          type: 'number',
        },
      ],
      disqualifyingConditions: [],
      adaPromptOverride: null,
    });
  }

  const boundState = baseState({
    sessionType: 'class_action_intake',
    listingId: LIST_ID,
  });

  it('permissive for public_ada sessions (no schema enforcement)', async () => {
    const clients = makeInMemoryClients();
    await seed(clients);
    const result = await extractFieldTool.execute(
      { clients, state: baseState({ sessionType: 'public_ada' }) },
      { field: 'any_field_ada_invents', value: 'abc', confidence: 0.9 },
    );
    expect(result.ok).toBe(true);
  });

  it('rejects out-of-schema field name when session is bound', async () => {
    const clients = makeInMemoryClients();
    await seed(clients);
    const result = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'user_mood', value: 'frustrated', confidence: 0.9 },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/not in this listing's schema/);
    // Echoes allowed names back.
    expect(result.error).toContain('hotel_name');
    expect(result.error).toContain('incident_date');
  });

  it('accepts an in-schema string field with a string value', async () => {
    const clients = makeInMemoryClients();
    await seed(clients);
    const result = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'hotel_name', value: 'Marriott Phoenix', confidence: 0.95 },
    );
    expect(result.ok).toBe(true);
  });

  it('rejects a date field with a non-date value', async () => {
    const clients = makeInMemoryClients();
    await seed(clients);
    const result = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'incident_date', value: 'last Tuesday', confidence: 0.5 },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/ISO date/);
  });

  it('accepts an ISO date string for a date field', async () => {
    const clients = makeInMemoryClients();
    await seed(clients);
    const result = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'incident_date', value: '2026-03-15', confidence: 0.9 },
    );
    expect(result.ok).toBe(true);
  });

  it('rejects an enum field with a value outside the allowed set', async () => {
    const clients = makeInMemoryClients();
    await seed(clients);
    const result = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'room_type', value: 'penthouse', confidence: 0.8 },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/mobility.*hearing.*visual/);
  });

  it('accepts an enum field with a valid value', async () => {
    const clients = makeInMemoryClients();
    await seed(clients);
    const result = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'room_type', value: 'mobility', confidence: 0.9 },
    );
    expect(result.ok).toBe(true);
  });

  it('accepts yes_no as boolean OR common string', async () => {
    const clients = makeInMemoryClients();
    await seed(clients);
    const r1 = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'was_refunded', value: true, confidence: 1.0 },
    );
    expect(r1.ok).toBe(true);
    const r2 = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'was_refunded', value: 'yes', confidence: 1.0 },
    );
    expect(r2.ok).toBe(true);
    const r3 = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'was_refunded', value: 'maybe', confidence: 0.3 },
    );
    expect(r3.ok).toBe(false);
  });

  it('accepts number as numeric OR numeric string', async () => {
    const clients = makeInMemoryClients();
    await seed(clients);
    const r1 = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'refund_amount', value: 150, confidence: 0.9 },
    );
    expect(r1.ok).toBe(true);
    const r2 = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'refund_amount', value: '150.50', confidence: 0.9 },
    );
    expect(r2.ok).toBe(true);
    const r3 = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'refund_amount', value: 'about a hundred', confidence: 0.4 },
    );
    expect(r3.ok).toBe(false);
  });

  it('falls through permissively if bound session but no config exists', async () => {
    // Bound state but no ListingConfig written — the listing was matched
    // but the firm hasn't finished setup. Don't block Ada.
    const clients = makeInMemoryClients();
    const result = await extractFieldTool.execute(
      { clients, state: boundState },
      { field: 'anything', value: 'whatever', confidence: 0.5 },
    );
    expect(result.ok).toBe(true);
  });
});
