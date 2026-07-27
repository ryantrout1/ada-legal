/**
 * Phase A1 — Litigation schema v2 contract tests.
 *
 * These tests encode the acceptance criteria for /plan Phase A1: the
 * `litigation_listings` schema and the in-memory + Neon DB clients must
 * support the new kind values, status values, reading-level prose
 * variants, documentation-gating fields, key_dates, related_listing_ids,
 * lead_firm_id, ada_qualifying_questions, and the new `litigation_listing_id`
 * column on ada_sessions.
 *
 * Strategy: assert against the in-memory client (round-trip create →
 * read). The Neon client mirrors the contract; the SQL migration itself
 * is verified by the runtime recipe in the /plan after deploy.
 *
 * Acceptance criteria covered:
 *   1. Schema columns exist for: documentation_required_simple/professional,
 *      no_documentation_path_simple/professional, evidence_guidance_*,
 *      what_this_is_not_*, key_dates jsonb, related_listing_ids jsonb,
 *      ada_qualifying_questions jsonb, lead_firm_id uuid, legal_theory,
 *      reading-level variants of short/full/eligibility.
 *   2. `kind` enum accepts: class, enforcement_action, consent_decree,
 *      pattern_of_practice, regulatory_challenge. Does NOT accept 'mass'.
 *   3. `status` enum accepts: draft, active, investigating, compliance,
 *      tracking, closed, archived. Does NOT accept 'settled'.
 *   4. `ada_sessions.litigation_listing_id` round-trips through
 *      writeSession / readSession.
 *
 * Ref: /plan Phase A1.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type {
  CreateLitigationInput,
  IntakeStatus,
  LitigationKind,
  LitigationStatus,
} from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const ATTORNEY_ID = '10000000-0000-4000-8000-00000000a001';
const FIRM_ID = '10000000-0000-4000-8000-00000000f001';

function fullCreateInput(
  overrides: Partial<CreateLitigationInput> = {},
): CreateLitigationInput {
  return {
    orgId: ORG_ID,
    kind: 'class',
    caseName: 'Doe v. HotelCo',
    slug: 'doe-v-hotelco',
    shortDescription: 'Hotels failed to provide accessible rooms.',
    fullDescription: 'Detailed allegations.',
    eligibility: 'Anyone who booked an accessible room and was denied.',
    defendants: ['HotelCo'],
    court: 'D. Ariz.',
    docketNumber: '2:24-cv-99999',
    affectedStates: ['AZ'],
    filingDate: '2024-06-01',
    leadAttorneyId: ATTORNEY_ID,
    status: 'active',
    // Phase A1 new fields:
    legalTheory: 'ADA Title III',
    shortDescriptionSimple: 'Hotels did not give accessible rooms.',
    shortDescriptionProfessional: 'Title III public accommodation violations.',
    fullDescriptionSimple: 'A long simple explanation.',
    fullDescriptionProfessional: 'A long professional explanation.',
    eligibilitySimple: 'You booked an accessible room and they did not give one.',
    eligibilityProfessional: 'Plaintiffs who reserved ADA-accessible accommodations.',
    documentationRequiredSimple: 'Your booking confirmation.',
    documentationRequiredProfessional: 'Reservation records and correspondence.',
    noDocumentationPathSimple: 'If you do not have records, we can still talk.',
    noDocumentationPathProfessional: 'Absent documentation, intake proceeds to evidentiary triage.',
    evidenceGuidanceSimple: 'Save your emails.',
    evidenceGuidanceProfessional: 'Preserve all written communications.',
    whatThisIsNotSimple: 'This is not about parking.',
    whatThisIsNotProfessional: 'Scope excludes parking-facility ADA claims.',
    keyDates: { filingDeadline: '2026-12-31', certificationHearing: '2026-09-15' },
    relatedListingIds: [],
    adaQualifyingQuestions: {
      documentationGateFirst: true,
      qualifyingQuestions: [{ q: 'Did you book?', a: 'yes' }],
    },
    leadFirmId: FIRM_ID,
    ...overrides,
  };
}

describe('Phase A1 — litigation_listings schema v2', () => {
  describe('AC1 — new fields round-trip', () => {
    it('persists and reads all new prose, doc-gating, and structured fields', async () => {
      const c = makeInMemoryClients();
      const created = await c.db.createLitigation(fullCreateInput());

      const read = await c.db.getLitigationById(created.id);
      expect(read).not.toBeNull();

      // Reading-level prose variants
      expect(read!.shortDescriptionSimple).toBe('Hotels did not give accessible rooms.');
      expect(read!.shortDescriptionProfessional).toBe('Title III public accommodation violations.');
      expect(read!.fullDescriptionSimple).toBe('A long simple explanation.');
      expect(read!.fullDescriptionProfessional).toBe('A long professional explanation.');
      expect(read!.eligibilitySimple).toBe('You booked an accessible room and they did not give one.');
      expect(read!.eligibilityProfessional).toBe('Plaintiffs who reserved ADA-accessible accommodations.');

      // Documentation gating
      expect(read!.documentationRequiredSimple).toBe('Your booking confirmation.');
      expect(read!.documentationRequiredProfessional).toBe('Reservation records and correspondence.');
      expect(read!.noDocumentationPathSimple).toBe('If you do not have records, we can still talk.');
      expect(read!.noDocumentationPathProfessional).toBe(
        'Absent documentation, intake proceeds to evidentiary triage.',
      );

      // Evidence guidance + scope
      expect(read!.evidenceGuidanceSimple).toBe('Save your emails.');
      expect(read!.evidenceGuidanceProfessional).toBe('Preserve all written communications.');
      expect(read!.whatThisIsNotSimple).toBe('This is not about parking.');
      expect(read!.whatThisIsNotProfessional).toBe('Scope excludes parking-facility ADA claims.');

      // Structured
      expect(read!.legalTheory).toBe('ADA Title III');
      expect(read!.keyDates).toEqual({
        filingDeadline: '2026-12-31',
        certificationHearing: '2026-09-15',
      });
      expect(read!.relatedListingIds).toEqual([]);
      expect(read!.adaQualifyingQuestions).toEqual({
        documentationGateFirst: true,
        qualifyingQuestions: [{ q: 'Did you book?', a: 'yes' }],
      });
      expect(read!.leadFirmId).toBe(FIRM_ID);
    });

    it('defaults all new fields to null/empty when not supplied', async () => {
      const c = makeInMemoryClients();
      const minimal: CreateLitigationInput = {
        orgId: ORG_ID,
        kind: 'class',
        caseName: 'Min v. Imal',
        slug: 'min-v-imal',
      };
      const created = await c.db.createLitigation(minimal);
      const read = await c.db.getLitigationById(created.id);

      expect(read!.legalTheory).toBeNull();
      expect(read!.shortDescriptionSimple).toBeNull();
      expect(read!.shortDescriptionProfessional).toBeNull();
      expect(read!.fullDescriptionSimple).toBeNull();
      expect(read!.fullDescriptionProfessional).toBeNull();
      expect(read!.eligibilitySimple).toBeNull();
      expect(read!.eligibilityProfessional).toBeNull();
      expect(read!.documentationRequiredSimple).toBeNull();
      expect(read!.documentationRequiredProfessional).toBeNull();
      expect(read!.noDocumentationPathSimple).toBeNull();
      expect(read!.noDocumentationPathProfessional).toBeNull();
      expect(read!.evidenceGuidanceSimple).toBeNull();
      expect(read!.evidenceGuidanceProfessional).toBeNull();
      expect(read!.whatThisIsNotSimple).toBeNull();
      expect(read!.whatThisIsNotProfessional).toBeNull();
      expect(read!.keyDates).toEqual({});
      expect(read!.relatedListingIds).toEqual([]);
      expect(read!.adaQualifyingQuestions).toEqual({});
      expect(read!.leadFirmId).toBeNull();
    });
  });

  describe('AC2 — kind enum', () => {
    const validKinds: LitigationKind[] = [
      'class',
      'enforcement_action',
      'consent_decree',
      'pattern_of_practice',
      'regulatory_challenge',
    ];

    for (const kind of validKinds) {
      it(`accepts kind="${kind}"`, async () => {
        const c = makeInMemoryClients();
        const created = await c.db.createLitigation(
          fullCreateInput({ kind, slug: `slug-${kind}` }),
        );
        expect(created.kind).toBe(kind);
      });
    }

    it('accepts kind="mass" — re-added by migration 0024', async () => {
      // Phase A1 removed 'mass' from the union. Migration 0024 put it
      // back in the DB CHECK for the router's mass-action lane, but the
      // TypeScript union, both front-end label maps, and Ada's prompt
      // label map were never updated to match — a contract/shape
      // mismatch that would render a raw enum to claimants the first
      // time a mass row was inserted. Taxonomy Phase 1 closes it.
      const c = makeInMemoryClients();
      const created = await c.db.createLitigation(
        fullCreateInput({ kind: 'mass', slug: 'slug-mass' }),
      );
      expect(created.kind).toBe('mass');
    });

    it('TypeScript: "settled" is still not assignable to LitigationKind', () => {
      // The union stays closed. If someone widens it to `string` this
      // directive becomes unused and the test fails.
      // @ts-expect-error 'settled' is a status, never a kind
      const bad: LitigationKind = 'settled';
      // Use bad to silence noUnusedLocals.
      expect(typeof bad).toBe('string');
    });
  });

  describe('AC3 — status enum', () => {
    const validStatuses: LitigationStatus[] = [
      'draft',
      'active',
      'investigating',
      'compliance',
      'tracking',
      'closed',
      'archived',
    ];

    for (const status of validStatuses) {
      it(`accepts status="${status}"`, async () => {
        const c = makeInMemoryClients();
        const created = await c.db.createLitigation(
          fullCreateInput({ status, slug: `slug-status-${status}` }),
        );
        expect(created.status).toBe(status);
      });
    }

    it('TypeScript: "settled" is not assignable to LitigationStatus', () => {
      // @ts-expect-error 'settled' was removed from LitigationStatus in Phase A1
      const bad: LitigationStatus = 'settled';
      expect(typeof bad).toBe('string');
    });
  });

  describe('AC4 — ada_sessions.litigation_listing_id round-trips', () => {
    it('writes and reads litigationListingId through the session repo', async () => {
      const c = makeInMemoryClients();
      const sessionId = '30000000-0000-4000-8000-00000000fff1';
      const litigationListingId = '20000000-0000-4000-8000-00000000ABCD';

      const state: AdaSessionState = {
        sessionId,
        orgId: ORG_ID,
        sessionType: 'public_ada',
        status: 'active',
        readingLevel: 'standard',
        anonSessionId: '00000000-0000-4000-8000-0000000000aa',
        userId: null,
        listingId: null,
        litigationListingId,
        conversationHistory: [],
        extractedFields: {},
        classification: null,
        metadata: {},
        accessibilitySettings: {},
        isTest: true,
      };

      await c.db.writeSession({ state });
      const loaded = await c.db.readSession({ sessionId });

      expect(loaded).not.toBeNull();
      expect(loaded!.litigationListingId).toBe(litigationListingId);
      // listingId still null — the two are separate channels.
      expect(loaded!.listingId).toBeNull();
    });

    it('defaults litigationListingId to null when not supplied', async () => {
      const c = makeInMemoryClients();
      const sessionId = '30000000-0000-4000-8000-00000000fff2';

      const state: AdaSessionState = {
        sessionId,
        orgId: ORG_ID,
        sessionType: 'public_ada',
        status: 'active',
        readingLevel: 'standard',
        anonSessionId: '00000000-0000-4000-8000-0000000000bb',
        userId: null,
        listingId: null,
        litigationListingId: null,
        conversationHistory: [],
        extractedFields: {},
        classification: null,
        metadata: {},
        accessibilitySettings: {},
        isTest: true,
      };

      await c.db.writeSession({ state });
      const loaded = await c.db.readSession({ sessionId });

      expect(loaded!.litigationListingId).toBeNull();
    });
  });
});

// ─── Attorney portal (migration 0019) — new tables round-trip ─────────────────

describe('Attorney portal schema (migration 0019)', () => {
  const LIT_ID = '20000000-0000-4000-8000-00000000a001';
  const FIRM_1 = '10000000-0000-4000-8000-00000000f101';
  const FIRM_2 = '10000000-0000-4000-8000-00000000f102';

  it('litigation_firm_assignments: replace + list round-trips (many firms per litigation)', async () => {
    const c = makeInMemoryClients();
    const created = await c.db.replaceFirmAssignmentsForLitigation(LIT_ID, [FIRM_1, FIRM_2]);
    expect(created).toHaveLength(2);

    const listed = await c.db.listFirmAssignmentsForLitigation(LIT_ID);
    expect(listed.map((a) => a.lawFirmId).sort()).toEqual([FIRM_1, FIRM_2].sort());

    // Replace semantics: a new set fully replaces the old one.
    const replaced = await c.db.replaceFirmAssignmentsForLitigation(LIT_ID, [FIRM_1]);
    expect(replaced).toHaveLength(1);
    const afterReplace = await c.db.listFirmAssignmentsForLitigation(LIT_ID);
    expect(afterReplace.map((a) => a.lawFirmId)).toEqual([FIRM_1]);
  });

  it('resolveAttorneyByClerkUserId returns null when no attorney is paired', async () => {
    const c = makeInMemoryClients();
    const resolved = await c.db.resolveAttorneyByClerkUserId('clerk_unknown');
    expect(resolved).toBeNull();
  });
});

// ─── Taxonomy Phase 1 (migration 0045) — barrier_category + intake_status ─────

/**
 * Two new axes on litigation_listings.
 *
 * `barrier_category` is the "where did this happen to me" dimension the
 * public directory navigates by. `kind` (the legal instrument) stays
 * exactly where it is — it is the admin's field, not the claimant's.
 *
 * `intake_status` is deliberately narrow. `status` already carries the
 * lifecycle (active / investigating / compliance / tracking / closed),
 * and `compliance` already means "settled, obligations live". What
 * `status` cannot express is whether a person can actually DO anything:
 * `active` covers a case accepting members, a case merely being
 * litigated, a case whose claim window has closed, and a
 * pattern-of-practice row that is not a case at all. Three values close
 * that gap without duplicating `status`.
 *
 * Ref: /plan litigation-taxonomy-and-contacts, Phase 1, AC1 + AC2.
 */
describe('Taxonomy Phase 1 — barrier_category + intake_status', () => {
  it('defaults to unassigned / none when the caller omits both', async () => {
    const c = makeInMemoryClients();
    const created = await c.db.createLitigation(
      fullCreateInput({ slug: 'taxonomy-defaults' }),
    );
    // NOT NULL with a default: an un-categorised row is visibly wrong,
    // never silently null.
    expect(created.barrierCategory).toBe('unassigned');
    expect(created.intakeStatus).toBe('none');
  });

  it('round-trips both fields through create → read', async () => {
    const c = makeInMemoryClients();
    const created = await c.db.createLitigation(
      fullCreateInput({
        slug: 'taxonomy-roundtrip',
        barrierCategory: 'voting_elections',
        intakeStatus: 'open',
      }),
    );
    expect(created.barrierCategory).toBe('voting_elections');
    expect(created.intakeStatus).toBe('open');

    const read = await c.db.getLitigationById(created.id);
    expect(read!.barrierCategory).toBe('voting_elections');
    expect(read!.intakeStatus).toBe('open');
  });

  it('accepts each of the three intake_status values', async () => {
    const values: IntakeStatus[] = ['open', 'mechanism', 'none'];
    for (const intakeStatus of values) {
      const c = makeInMemoryClients();
      const created = await c.db.createLitigation(
        fullCreateInput({ slug: `intake-${intakeStatus}`, intakeStatus }),
      );
      expect(created.intakeStatus).toBe(intakeStatus);
    }
  });

  it('carries barrier_category independently of kind', async () => {
    // The whole point of the new axis: two rows of different legal
    // instrument can share a category, and one kind spreads across
    // several categories. Neither field constrains the other.
    const c = makeInMemoryClients();
    const classRow = await c.db.createLitigation(
      fullCreateInput({
        slug: 'hotel-class',
        kind: 'class',
        barrierCategory: 'hotels_lodging',
      }),
    );
    const decreeRow = await c.db.createLitigation(
      fullCreateInput({
        slug: 'hotel-decree',
        kind: 'consent_decree',
        barrierCategory: 'hotels_lodging',
      }),
    );
    // Assert the concrete value, not just equality — comparing two
    // undefineds would pass before the field exists at all.
    expect(classRow.barrierCategory).toBe('hotels_lodging');
    expect(decreeRow.barrierCategory).toBe('hotels_lodging');
    expect(classRow.kind).toBe('class');
    expect(decreeRow.kind).toBe('consent_decree');
  });
});
