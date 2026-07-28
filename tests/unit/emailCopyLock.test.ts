/**
 * Byte-for-byte lock on every email the site sends.
 *
 * WHY THIS EXISTS, AND WHY IT COMES FIRST. Phase 1 of the editable-copy
 * plan moves prose out of the renderers and into a registry. That is a
 * transcription job across seven renderers, and the plan's own risk
 * register named copy drift as the first risk — a sentence moved and
 * mistyped ships to a claimant, and nothing catches it.
 *
 * The four existing renderer test files carry 101 assertions between
 * them, but they assert on substrings and shapes. A reworded sentence
 * passes all of them. Snapshots do not care about intent: they compare
 * the whole rendered output, character for character.
 *
 * This file asserts nothing about whether the copy is good. It asserts
 * only that it does not change. Delete a snapshot deliberately when the
 * copy is meant to change; a diff you did not expect is a mistake.
 *
 * Gina reviews all claimant- and attorney-facing copy. Until the admin
 * screen exists, this file is the thing standing between an accidental
 * edit and a claimant's inbox.
 *
 * Ref: /plan editable email copy, Phase 1.
 */

import { describe, it, expect } from 'vitest';
import { renderFirmEmail, renderUserEmail } from '@/engine/handoff/emailTemplates';
import { renderSelfHelpUserEmail } from '@/engine/handoff/selfHelpEmail';
import {
  renderFirmMatchedEmail,
  renderUserConnectedEmail,
  renderAdminRoutingEmail,
} from '@/engine/notifications/routingEmailTemplates';
import { buildReleaseEmail } from '@/lib/spot/releaseEmail';
import type { AttorneyPackage } from '@/engine/handoff/attorneyPackage';
import type { CaseRow } from '@/engine/clients/types';
import type { ReadingLevel } from '@/types/db';

const LEVELS: ReadingLevel[] = ['simple', 'standard', 'professional'];

function fieldEntry(value: unknown, confidence = 0.9) {
  return { value, confidence, extracted_at: '2026-04-22T00:00:00.000Z' };
}

function basePackage(overrides: Partial<AttorneyPackage> = {}): AttorneyPackage {
  return {
    sessionId: '00000000-0000-4000-8000-000000000111',
    listing: {
      id: '00000000-0000-4000-8000-000000000a02',
      title: 'Hotel booking fraud class action',
      firmName: 'Acme ADA Law',
    },
    qualified: true,
    disqualifyingReason: null,
    claimant: {
      name: 'Alex Morales',
      email: 'alex@example.com',
      phone: '+1-555-111-2222',
      preferredContact: 'email',
    },
    fields: {
      hotel_name: fieldEntry('Marriott Phoenix', 0.95),
      incident_date: fieldEntry('2026-03-15', 0.9),
      was_refunded: fieldEntry(false, 0.7),
    },
    missingRequiredFields: [],
    classification: {
      title: 'III',
      tier: 'high',
      reasoning: 'Discrimination in a public accommodation',
      standard: 'ADA Title III',
      class_action_candidate: null,
    },
    photos: [],
    conversationSummary:
      'User booked accessible room at Marriott Phoenix for 2026-03-15, arrived to find room had no roll-in shower. Refund denied.',
    conversationSummaryIsApproved: true,
    conversationTranscriptUrl: null,
    generatedAt: '2026-04-22T18:00:00.000Z',
    ...overrides,
  };
}

const baseCase: CaseRow = {
  id: 'case-1',
  orgId: 'org-1',
  adaSessionId: 'sess-1',
  litigationListingId: null,
  caseNumber: 'CASE-0042',
  lane: 'routed_firm',
  status: 'new',
  firmId: 'firm-1',
  consentToShare: true,
  assignedLawyerId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const PKG_URL = 'https://ada.adalegallink.com/s/s-abcdefghjkmn';

describe('firm handoff email', () => {
  it('qualified', () => {
    expect(renderFirmEmail(basePackage())).toMatchSnapshot();
  });

  it('unqualified', () => {
    expect(
      renderFirmEmail(
        basePackage({ qualified: false, disqualifyingReason: 'Stayed outside the class period' }),
      ),
    ).toMatchSnapshot();
  });
});

describe('claimant handoff email', () => {
  // Three reading levels times two branches. This is the email with the
  // most copy in it and the one a claimant is most likely to read closely.
  it.each(LEVELS)('qualified — %s', (readingLevel) => {
    expect(renderUserEmail({ pkg: basePackage(), readingLevel })).toMatchSnapshot();
  });

  it.each(LEVELS)('unqualified — %s', (readingLevel) => {
    expect(
      renderUserEmail({
        pkg: basePackage({
          qualified: false,
          disqualifyingReason: 'Stayed outside the class period',
        }),
        readingLevel,
      }),
    ).toMatchSnapshot();
  });
});

describe('self-help email', () => {
  it.each(LEVELS)('with a sample letter — %s', (readingLevel) => {
    expect(
      renderSelfHelpUserEmail({
        packageUrl: PKG_URL,
        readingLevel,
        summary: 'Title III access barrier at a restaurant.',
        hasLetter: true,
      }),
    ).toMatchSnapshot();
  });

  it.each(LEVELS)('without a sample letter — %s', (readingLevel) => {
    expect(
      renderSelfHelpUserEmail({
        packageUrl: PKG_URL,
        readingLevel,
        summary: 'Title III access barrier at a restaurant.',
        hasLetter: false,
      }),
    ).toMatchSnapshot();
  });
});

describe('routing emails', () => {
  it('firm — a claimant consented', () => {
    expect(
      renderFirmMatchedEmail({
        caseRow: baseCase,
        firmName: 'Spinal Cord Injury Law Firm',
        claimantName: 'Jane Doe',
      }),
    ).toMatchSnapshot();
  });

  it('firm — claimant name withheld', () => {
    expect(
      renderFirmMatchedEmail({
        caseRow: baseCase,
        firmName: 'Spinal Cord Injury Law Firm',
        claimantName: null,
      }),
    ).toMatchSnapshot();
  });

  it('claimant — connected to a named firm', () => {
    expect(
      renderUserConnectedEmail({
        caseRow: baseCase,
        firmName: 'Spinal Cord Injury Law Firm',
        readoutUrl: PKG_URL,
      }),
    ).toMatchSnapshot();
  });

  it('claimant — connected with no firm named', () => {
    // The wording swaps to "An attorney". Snapshotted because that
    // substitution is the kind of thing a careless edit collapses.
    expect(
      renderUserConnectedEmail({ caseRow: baseCase, firmName: null, readoutUrl: PKG_URL }),
    ).toMatchSnapshot();
  });

  it('admin — sourcing lane', () => {
    expect(
      renderAdminRoutingEmail({ caseRow: { ...baseCase, lane: 'sourcing' } }),
    ).toMatchSnapshot();
  });

  it('admin — general queue lane', () => {
    expect(
      renderAdminRoutingEmail({ caseRow: { ...baseCase, lane: 'general_queue' } }),
    ).toMatchSnapshot();
  });
});

describe('spot release email', () => {
  it('released report', () => {
    expect(
      buildReleaseEmail({ slug: 'abc123xyz', baseUrl: 'https://ada.adalegallink.com' }),
    ).toMatchSnapshot();
  });
});
