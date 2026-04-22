/**
 * Tests for assembleAttorneyPackage.
 *
 * Pure function, no DB. Build a session + listing + config directly,
 * call the assembler, assert the package shape.
 *
 * This is the first half of Step 24 - the package shape that emails,
 * PDFs, and audit records will all consume. Tests cover every path
 * in the assembler because mistakes here propagate to every firm
 * handoff.
 *
 * Ref: Step 24, Commit 1.
 */

import { describe, it, expect } from 'vitest';
import {
  assembleAttorneyPackage,
  type AttorneyPackage,
} from '@/engine/handoff/attorneyPackage';
import type { AdaSessionState } from '@/engine/types';
import type {
  ListingRow,
  ListingConfigRow,
  LawFirmRow,
} from '@/engine/clients/types';
import type { Classification, Message } from '@/types/db';

const SESSION_ID = '00000000-0000-4000-8000-000000000111';
const ORG_ID = '00000000-0000-4000-8000-000000000001';
const FIRM_ID = '00000000-0000-4000-8000-000000000a01';
const LIST_ID = '00000000-0000-4000-8000-000000000a02';
const CFG_ID = '00000000-0000-4000-8000-000000000a03';
const FROZEN_TIME = '2026-04-22T18:00:00.000Z';

function baseState(overrides: Partial<AdaSessionState> = {}): AdaSessionState {
  return {
    sessionId: SESSION_ID,
    orgId: ORG_ID,
    sessionType: 'class_action_intake',
    status: 'active',
    readingLevel: 'standard',
    anonSessionId: null,
    userId: null,
    listingId: LIST_ID,
    conversationHistory: [],
    extractedFields: {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
    ...overrides,
  };
}

function fieldEntry(value: unknown, confidence = 0.9): import('@/types/db').ExtractedField {
  return {
    value,
    confidence,
    extracted_at: FROZEN_TIME,
  };
}

function makeListing(): ListingRow {
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
  };
}

function makeLawFirm(): LawFirmRow {
  return {
    id: FIRM_ID,
    orgId: ORG_ID,
    name: 'Acme ADA Law',
    primaryContact: 'Jane Partner',
    email: 'intake@acme-ada.example',
    phone: '+1-555-000-0000',
    stripeCustomerId: null,
    isPilot: false,
    status: 'active',
  };
}

function makeConfig(
  overrides: Partial<ListingConfigRow> = {},
): ListingConfigRow {
  return {
    id: CFG_ID,
    listingId: LIST_ID,
    caseDescription: 'Test case',
    eligibilityCriteria: [],
    requiredFields: [
      { name: 'hotel_name', description: 'Hotel name', required: true, type: 'string' },
      { name: 'incident_date', description: 'Incident date', required: true, type: 'date' },
      { name: 'was_refunded', description: 'Refund status', required: false, type: 'yes_no' },
    ],
    disqualifyingConditions: [],
    adaPromptOverride: null,
    ...overrides,
  };
}

function makeClassification(): Classification {
  return {
    title: 'III',
    tier: 'high',
    reasoning: 'Discrimination in a public accommodation',
    standard: 'ADA Title III',
    class_action_candidate: null,
  };
}

// ─── happy path: qualified ────────────────────────────────────────────────────

describe('assembleAttorneyPackage — qualified happy path', () => {
  function assemble(): AttorneyPackage {
    return assembleAttorneyPackage({
      state: baseState({
        classification: makeClassification(),
        extractedFields: {
          claimant_name: fieldEntry('Alex Morales'),
          claimant_email: fieldEntry('alex@example.com'),
          claimant_phone: fieldEntry('+1-555-111-2222'),
          contact_preference: fieldEntry('email'),
          hotel_name: fieldEntry('Marriott Phoenix'),
          incident_date: fieldEntry('2026-03-15'),
          was_refunded: fieldEntry(false),
          conversation_summary: fieldEntry(
            'User booked accessible room at Marriott Phoenix for 2026-03-15, arrived to find room had no roll-in shower. Refund denied.',
          ),
        },
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
  }

  it('populates sessionId + listing metadata', () => {
    const pkg = assemble();
    expect(pkg.sessionId).toBe(SESSION_ID);
    expect(pkg.listing).toEqual({
      id: LIST_ID,
      title: 'Hotel booking fraud class action',
      firmName: 'Acme ADA Law',
    });
  });

  it('sets qualified=true and disqualifyingReason=null', () => {
    const pkg = assemble();
    expect(pkg.qualified).toBe(true);
    expect(pkg.disqualifyingReason).toBeNull();
  });

  it('extracts claimant info from dedicated extractedField keys', () => {
    const pkg = assemble();
    expect(pkg.claimant).toEqual({
      name: 'Alex Morales',
      email: 'alex@example.com',
      phone: '+1-555-111-2222',
      preferredContact: 'email',
    });
  });

  it('excludes claimant-identity keys and conversation_summary from fields block', () => {
    const pkg = assemble();
    expect(Object.keys(pkg.fields)).not.toContain('claimant_name');
    expect(Object.keys(pkg.fields)).not.toContain('claimant_email');
    expect(Object.keys(pkg.fields)).not.toContain('claimant_phone');
    expect(Object.keys(pkg.fields)).not.toContain('contact_preference');
    expect(Object.keys(pkg.fields)).not.toContain('conversation_summary');
  });

  it('includes case-fact fields with full ExtractedField records', () => {
    const pkg = assemble();
    expect(pkg.fields.hotel_name).toBeDefined();
    expect(pkg.fields.hotel_name!.value).toBe('Marriott Phoenix');
    expect(pkg.fields.hotel_name!.confidence).toBe(0.9);
    expect(pkg.fields.incident_date!.value).toBe('2026-03-15');
    expect(pkg.fields.was_refunded!.value).toBe(false);
  });

  it('computes missingRequiredFields (empty when all required present)', () => {
    const pkg = assemble();
    expect(pkg.missingRequiredFields).toEqual([]);
  });

  it('carries the classification through', () => {
    const pkg = assemble();
    expect(pkg.classification?.title).toBe('III');
  });

  it('uses user-approved summary when confirm_summary fired', () => {
    const pkg = assemble();
    expect(pkg.conversationSummary).toMatch(/Marriott Phoenix/);
    expect(pkg.conversationSummaryIsApproved).toBe(true);
  });

  it('leaves conversationTranscriptUrl null at pure-assembly time', () => {
    const pkg = assemble();
    expect(pkg.conversationTranscriptUrl).toBeNull();
  });

  it('stamps generatedAt from input', () => {
    const pkg = assemble();
    expect(pkg.generatedAt).toBe(FROZEN_TIME);
  });
});

// ─── unqualified path ─────────────────────────────────────────────────────────

describe('assembleAttorneyPackage — unqualified path', () => {
  it('sets qualified=false and carries disqualifyingReason', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState({
        classification: makeClassification(),
        extractedFields: {
          claimant_name: fieldEntry('Alex Morales'),
          claimant_email: fieldEntry('alex@example.com'),
          hotel_name: fieldEntry('Motel 6 Sacramento'),
          incident_date: fieldEntry('2019-03-15'),
        },
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: false,
      disqualifyingReason: 'Claim is older than three years',
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.qualified).toBe(false);
    expect(pkg.disqualifyingReason).toBe('Claim is older than three years');
  });

  it('disqualifyingReason defaults to null when unqualified but no reason given', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState(),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: false,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.qualified).toBe(false);
    expect(pkg.disqualifyingReason).toBeNull();
  });
});

// ─── claimant extraction edge cases ───────────────────────────────────────────

describe('assembleAttorneyPackage — claimant extraction', () => {
  it('returns null for each claimant field when missing', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState(),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.claimant).toEqual({
      name: null,
      email: null,
      phone: null,
      preferredContact: null,
    });
  });

  it('trims whitespace from claimant values', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState({
        extractedFields: {
          claimant_name: fieldEntry('  Alex Morales  '),
          claimant_email: fieldEntry('  alex@example.com  '),
        },
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.claimant.name).toBe('Alex Morales');
    expect(pkg.claimant.email).toBe('alex@example.com');
  });

  it('returns null for empty-string claimant values', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState({
        extractedFields: {
          claimant_name: fieldEntry(''),
          claimant_email: fieldEntry('   '),
        },
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.claimant.name).toBeNull();
    expect(pkg.claimant.email).toBeNull();
  });

  it('returns null for preferredContact when value is not email/phone', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState({
        extractedFields: {
          contact_preference: fieldEntry('carrier pigeon'),
        },
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.claimant.preferredContact).toBeNull();
  });

  it('accepts phone as preferredContact', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState({
        extractedFields: { contact_preference: fieldEntry('phone') },
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.claimant.preferredContact).toBe('phone');
  });
});

// ─── missingRequiredFields computation ────────────────────────────────────────

describe('assembleAttorneyPackage — missingRequiredFields', () => {
  it('lists required fields that are absent', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState({
        extractedFields: {
          hotel_name: fieldEntry('Marriott'),
          // incident_date missing; was_refunded not required
        },
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.missingRequiredFields).toEqual(['incident_date']);
  });

  it('ignores non-required fields', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState({
        extractedFields: {
          hotel_name: fieldEntry('Marriott'),
          incident_date: fieldEntry('2026-03-15'),
          // was_refunded is NOT required and is missing — should not flag
        },
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.missingRequiredFields).toEqual([]);
  });

  it('treats null and empty-string values as missing for required fields', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState({
        extractedFields: {
          hotel_name: fieldEntry(''),
          incident_date: fieldEntry(null),
        },
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.missingRequiredFields).toEqual(['hotel_name', 'incident_date']);
  });

  it('handles a config with no required_fields gracefully', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState(),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig({ requiredFields: [] }),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.missingRequiredFields).toEqual([]);
  });
});

// ─── conversation summary paths ───────────────────────────────────────────────

describe('assembleAttorneyPackage — conversation summary', () => {
  it('prefers user-approved summary over auto-generated', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState({
        extractedFields: {
          conversation_summary: fieldEntry('User-approved summary text.'),
        },
        conversationHistory: [
          { role: 'user', content: 'A very different first message', timestamp: FROZEN_TIME },
        ] as Message[],
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.conversationSummary).toBe('User-approved summary text.');
    expect(pkg.conversationSummaryIsApproved).toBe(true);
  });

  it('falls back to auto-generated summary when confirm_summary has not fired', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState({
        conversationHistory: [
          {
            role: 'user',
            content: 'I booked an accessible room at the Marriott and they gave me a regular room instead.',
            timestamp: FROZEN_TIME,
          },
        ] as Message[],
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.conversationSummary).toMatch(/booked an accessible room at the Marriott/);
    expect(pkg.conversationSummary).toMatch(/Hotel booking fraud class action/);
    expect(pkg.conversationSummaryIsApproved).toBe(false);
  });

  it('treats empty-string user-approved summary as not approved', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState({
        extractedFields: { conversation_summary: fieldEntry('   ') },
        conversationHistory: [
          { role: 'user', content: 'Test narrative', timestamp: FROZEN_TIME },
        ] as Message[],
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.conversationSummaryIsApproved).toBe(false);
  });

  it('truncates very long first user messages in the fallback', () => {
    const longText = 'x'.repeat(1000);
    const pkg = assembleAttorneyPackage({
      state: baseState({
        conversationHistory: [
          { role: 'user', content: longText, timestamp: FROZEN_TIME },
        ] as Message[],
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    // "Intake for ... The user described: " + 400 chars = under 500
    expect(pkg.conversationSummary.length).toBeLessThan(500);
  });

  it('handles empty conversation history gracefully', () => {
    const pkg = assembleAttorneyPackage({
      state: baseState({ conversationHistory: [] }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    });
    expect(pkg.conversationSummary).toMatch(/No narrative captured/);
    expect(pkg.conversationSummaryIsApproved).toBe(false);
  });
});

// ─── determinism ──────────────────────────────────────────────────────────────

describe('assembleAttorneyPackage — determinism', () => {
  it('same inputs produce identical output (except generatedAt)', () => {
    const input = {
      state: baseState({
        extractedFields: {
          claimant_name: fieldEntry('Test'),
          hotel_name: fieldEntry('Hotel'),
          incident_date: fieldEntry('2026-03-15'),
        },
        classification: makeClassification(),
      }),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
      generatedAt: FROZEN_TIME,
    };
    const a = assembleAttorneyPackage(input);
    const b = assembleAttorneyPackage(input);
    expect(a).toEqual(b);
  });
});

// ─── generatedAt default ──────────────────────────────────────────────────────

describe('assembleAttorneyPackage — generatedAt default', () => {
  it('uses current time when generatedAt is omitted', () => {
    const before = Date.now();
    const pkg = assembleAttorneyPackage({
      state: baseState(),
      listing: makeListing(),
      lawFirm: makeLawFirm(),
      config: makeConfig(),
      qualified: true,
    });
    const after = Date.now();
    const stamped = Date.parse(pkg.generatedAt);
    expect(stamped).toBeGreaterThanOrEqual(before);
    expect(stamped).toBeLessThanOrEqual(after);
  });
});
