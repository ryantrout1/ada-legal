/**
 * Tests for the Ch1 tools: match_listing and finalize_intake.
 *
 * Step 20. These tools are the most state-mutating in the Ada tool
 * surface so far — match_listing one-way-promotes a session to a
 * listing, and finalize_intake closes it out with an outcome. Each
 * tool has several hard gates; every rejection path has its own test
 * because failing open at any of them would route a user incorrectly
 * (into a wrong case, or to a firm without the required facts).
 *
 * Ref: Step 20, Commit 1.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { matchListingTool } from '@/engine/tools/impls/matchListing';
import { finalizeIntakeTool } from '@/engine/tools/impls/finalizeIntake';
import type { AdaClients } from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';

const ORG_ID   = '00000000-0000-4000-8000-000000000001';
const FIRM_ID  = '00000000-0000-4000-8000-000000000a01';
const LIST_ID  = '00000000-0000-4000-8000-000000000a02';
const CFG_ID   = '00000000-0000-4000-8000-000000000a03';
const SUB_ID   = '00000000-0000-4000-8000-000000000a04';

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
    conversationHistory: [],
    extractedFields: {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
    ...overrides,
  };
}

/** Seed a firm + listing + active subscription so match_listing will find it. */
async function seedActiveListing(clients: AdaClients): Promise<void> {
  await clients.db.writeLawFirm({
    id: FIRM_ID,
    orgId: ORG_ID,
    name: 'Acme ADA Law',
    primaryContact: null,
    email: 'counsel@example.com',
    phone: null,
    stripeCustomerId: null,
    isPilot: false,
    status: 'active',
  });
  await clients.db.writeListing({
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
  });
  await clients.db.writeSubscription({
    id: SUB_ID,
    lawFirmId: FIRM_ID,
    listingId: LIST_ID,
    stripeSubscriptionId: 'sub_test',
    tier: 'basic',
    status: 'active',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });
}

// ─── match_listing ────────────────────────────────────────────────────────────

describe('match_listing', () => {
  const tool = matchListingTool;

  describe('validateInput', () => {
    it('accepts a well-formed input', () => {
      const result = tool.validateInput({
        listing_id: LIST_ID,
        confidence: 0.9,
        user_confirmed: true,
      });
      expect(result.listing_id).toBe(LIST_ID);
      expect(result.confidence).toBe(0.9);
      expect(result.user_confirmed).toBe(true);
    });

    it('rejects a non-UUID listing_id', () => {
      expect(() =>
        tool.validateInput({ listing_id: 'abc', confidence: 0.5, user_confirmed: true }),
      ).toThrow(/listing_id must be a UUID/);
    });

    it('rejects a confidence out of [0,1]', () => {
      expect(() =>
        tool.validateInput({
          listing_id: LIST_ID,
          confidence: 1.5,
          user_confirmed: true,
        }),
      ).toThrow(/confidence must be a number in \[0, 1\]/);
    });

    it('rejects a non-boolean user_confirmed', () => {
      expect(() =>
        tool.validateInput({
          listing_id: LIST_ID,
          confidence: 0.5,
          user_confirmed: 'yes',
        }),
      ).toThrow(/user_confirmed must be a boolean/);
    });
  });

  describe('execute', () => {
    it('happy path: binds listing and promotes session type', async () => {
      const clients = makeInMemoryClients();
      await seedActiveListing(clients);
      const result = await tool.execute(
        { clients, state: baseState() },
        { listing_id: LIST_ID, confidence: 0.9, user_confirmed: true },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return; // narrows
      expect(result.stateChanges?.listingId).toBe(LIST_ID);
      expect(result.stateChanges?.sessionTypeChange).toBe('class_action_intake');
      const content = result.content as Record<string, unknown>;
      expect(content.matched).toBe(true);
      expect(content.listing_title).toBe('Hotel booking fraud class action');
      expect(content.law_firm_name).toBe('Acme ADA Law');
    });

    it('rejects when user_confirmed is false', async () => {
      const clients = makeInMemoryClients();
      await seedActiveListing(clients);
      const result = await tool.execute(
        { clients, state: baseState() },
        { listing_id: LIST_ID, confidence: 0.9, user_confirmed: false },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/user_confirmed=true/);
    });

    it('rejects a second call on an already-bound session', async () => {
      const clients = makeInMemoryClients();
      await seedActiveListing(clients);
      const result = await tool.execute(
        { clients, state: baseState({ listingId: LIST_ID }) },
        { listing_id: LIST_ID, confidence: 0.9, user_confirmed: true },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/already bound to a listing/);
    });

    it('rejects when session type is not public_ada', async () => {
      const clients = makeInMemoryClients();
      await seedActiveListing(clients);
      const result = await tool.execute(
        { clients, state: baseState({ sessionType: 'class_action_intake' }) },
        { listing_id: LIST_ID, confidence: 0.9, user_confirmed: true },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/public_ada session/);
    });

    it('rejects when listing does not exist', async () => {
      const clients = makeInMemoryClients();
      // No seed — listActiveListings returns empty.
      const result = await tool.execute(
        { clients, state: baseState() },
        { listing_id: LIST_ID, confidence: 0.9, user_confirmed: true },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/not currently live/);
    });

    it('rejects when listing is in draft', async () => {
      const clients = makeInMemoryClients();
      await seedActiveListing(clients);
      // Downgrade the listing to draft.
      await clients.db.writeListing({
        id: LIST_ID,
        lawFirmId: FIRM_ID,
        title: 'Hotel booking fraud class action',
        slug: 'hotel-booking-fraud',
        category: 'ada_title_iii',
        shortDescription: null,
        fullDescription: null,
        eligibilitySummary: null,
        status: 'draft',
        tier: 'basic',
      });
      const result = await tool.execute(
        { clients, state: baseState() },
        { listing_id: LIST_ID, confidence: 0.9, user_confirmed: true },
      );
      expect(result.ok).toBe(false);
    });

    it('rejects when firm is suspended', async () => {
      const clients = makeInMemoryClients();
      await seedActiveListing(clients);
      await clients.db.writeLawFirm({
        id: FIRM_ID,
        orgId: ORG_ID,
        name: 'Acme ADA Law',
        primaryContact: null,
        email: 'counsel@example.com',
        phone: null,
        stripeCustomerId: null,
    isPilot: false,
        status: 'suspended',
      });
      const result = await tool.execute(
        { clients, state: baseState() },
        { listing_id: LIST_ID, confidence: 0.9, user_confirmed: true },
      );
      expect(result.ok).toBe(false);
    });

    it('rejects when subscription has expired', async () => {
      const clients = makeInMemoryClients();
      await seedActiveListing(clients);
      await clients.db.writeSubscription({
        id: SUB_ID,
        lawFirmId: FIRM_ID,
        listingId: LIST_ID,
        stripeSubscriptionId: 'sub_test',
        tier: 'basic',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() - 3_600_000).toISOString(),
        cancelAtPeriodEnd: false,
      });
      const result = await tool.execute(
        { clients, state: baseState() },
        { listing_id: LIST_ID, confidence: 0.9, user_confirmed: true },
      );
      expect(result.ok).toBe(false);
    });
  });
});

// ─── finalize_intake ──────────────────────────────────────────────────────────

describe('finalize_intake', () => {
  const tool = finalizeIntakeTool;

  /**
   * Seed a listing + config with a single required field so we can
   * exercise both the present-and-missing cases without noise.
   */
  async function seedWithRequiredField(
    clients: AdaClients,
    fieldName = 'incident_date',
  ): Promise<void> {
    await seedActiveListing(clients);
    await clients.db.writeListingConfig({
      id: CFG_ID,
      listingId: LIST_ID,
      caseDescription: 'Hotel booking fraud case.',
      eligibilityCriteria: [],
      requiredFields: [
        {
          name: fieldName,
          description: 'Date of the incident',
          required: true,
          type: 'date',
        },
      ],
      disqualifyingConditions: [],
      adaPromptOverride: null,
    });
  }

  describe('validateInput', () => {
    it('accepts qualified=true without a reason', () => {
      const result = tool.validateInput({ qualified: true });
      expect(result.qualified).toBe(true);
      expect(result.disqualifying_reason).toBeNull();
    });

    it('accepts qualified=false with a reason', () => {
      const result = tool.validateInput({
        qualified: false,
        disqualifying_reason: 'outside jurisdiction',
      });
      expect(result.qualified).toBe(false);
      expect(result.disqualifying_reason).toBe('outside jurisdiction');
    });

    it('rejects qualified=false without a reason', () => {
      expect(() => tool.validateInput({ qualified: false })).toThrow(
        /disqualifying_reason is required/,
      );
    });

    it('rejects qualified=false with an empty reason', () => {
      expect(() =>
        tool.validateInput({ qualified: false, disqualifying_reason: '   ' }),
      ).toThrow(/disqualifying_reason is required/);
    });

    it('rejects non-boolean qualified', () => {
      expect(() => tool.validateInput({ qualified: 'yes' })).toThrow(
        /qualified must be a boolean/,
      );
    });
  });

  describe('execute', () => {
    it('happy path qualified: transitions to completed with outcome', async () => {
      const clients = makeInMemoryClients();
      await seedWithRequiredField(clients);
      const state = baseState({
        listingId: LIST_ID,
        sessionType: 'class_action_intake',
        extractedFields: {
          incident_date: {
            value: '2026-03-15',
            confidence: 0.95,
            extracted_at: '2026-04-22T00:00:00.000Z',
          },
        },
      });
      const result = await tool.execute(
        { clients, state },
        { qualified: true, disqualifying_reason: null },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.stateChanges?.sessionTransition).toBe('complete');
      expect(result.stateChanges?.metadataPatch?.outcome).toBe('qualified');
    });

    it('happy path disqualified: transitions to completed with reason, skips field check', async () => {
      const clients = makeInMemoryClients();
      await seedWithRequiredField(clients);
      // Note: no extracted_fields populated — this is FINE because Ada
      // is disqualifying, not completing the intake.
      const state = baseState({
        listingId: LIST_ID,
        sessionType: 'class_action_intake',
      });
      const result = await tool.execute(
        { clients, state },
        {
          qualified: false,
          disqualifying_reason: 'outside jurisdiction',
        },
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.stateChanges?.sessionTransition).toBe('complete');
      expect(result.stateChanges?.metadataPatch?.outcome).toBe('disqualified');
    });

    it('rejects when session has no listingId', async () => {
      const clients = makeInMemoryClients();
      await seedWithRequiredField(clients);
      const result = await tool.execute(
        { clients, state: baseState() },
        { qualified: true, disqualifying_reason: null },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/Call match_listing first/);
    });

    it('rejects when sessionType is not class_action_intake', async () => {
      const clients = makeInMemoryClients();
      await seedWithRequiredField(clients);
      const state = baseState({
        listingId: LIST_ID,
        sessionType: 'public_ada', // wrong
      });
      const result = await tool.execute(
        { clients, state },
        { qualified: true, disqualifying_reason: null },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/class_action_intake/);
    });

    it('rejects qualified=true when required field missing', async () => {
      const clients = makeInMemoryClients();
      await seedWithRequiredField(clients);
      const state = baseState({
        listingId: LIST_ID,
        sessionType: 'class_action_intake',
        extractedFields: {}, // no fields
      });
      const result = await tool.execute(
        { clients, state },
        { qualified: true, disqualifying_reason: null },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/incident_date/);
      expect(result.error).toMatch(/required fields missing/);
    });

    it('rejects qualified=true when listing has no config', async () => {
      const clients = makeInMemoryClients();
      await seedActiveListing(clients); // no config written
      const state = baseState({
        listingId: LIST_ID,
        sessionType: 'class_action_intake',
      });
      const result = await tool.execute(
        { clients, state },
        { qualified: true, disqualifying_reason: null },
      );
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toMatch(/No ListingConfig found/);
    });

    it('ignores non-required fields when validating completeness', async () => {
      const clients = makeInMemoryClients();
      await seedActiveListing(clients);
      await clients.db.writeListingConfig({
        id: CFG_ID,
        listingId: LIST_ID,
        caseDescription: 'Test',
        eligibilityCriteria: [],
        requiredFields: [
          {
            name: 'incident_date',
            description: 'Incident date',
            required: true,
            type: 'date',
          },
          {
            name: 'optional_note',
            description: 'Optional note',
            required: false,
            type: 'string',
          },
        ],
        disqualifyingConditions: [],
        adaPromptOverride: null,
      });
      const state = baseState({
        listingId: LIST_ID,
        sessionType: 'class_action_intake',
        extractedFields: {
          incident_date: {
            value: '2026-03-15',
            confidence: 0.95,
            extracted_at: '2026-04-22T00:00:00.000Z',
          },
          // note: optional_note is absent — should still pass
        },
      });
      const result = await tool.execute(
        { clients, state },
        { qualified: true, disqualifying_reason: null },
      );
      expect(result.ok).toBe(true);
    });
  });
});
