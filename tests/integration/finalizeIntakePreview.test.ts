/**
 * Integration test for finalize_intake's is_test short-circuit.
 *
 * The preview flow (Step 25 Commit 5) runs Ada against a real listing
 * inside an is_test=true session. finalize_intake must NOT fire any
 * real side effects (no email, no PDF, no blob upload) when is_test
 * is true — otherwise firms would get test emails and Resend would
 * eat billable calls on every preview.
 *
 * What we verify:
 *   1. is_test + qualified: session completes, no emails sent, no
 *      blobs uploaded, receipt marked is_test=true.
 *   2. is_test + disqualified: same, with outcome=disqualified.
 *   3. is_test short-circuits Gate 1 (no listingId): still completes
 *      successfully rather than returning a gate-violation error. The
 *      invariant is 'no external calls when is_test', which holds
 *      regardless of gates.
 *   4. is_test short-circuits Gate 2 (missing required fields):
 *      completes successfully; admin doesn't need to satisfy all
 *      fields to exercise finalize in preview.
 *
 * Ref: Step 25, Commit 5.
 */

import { describe, it, expect } from 'vitest';
import { finalizeIntakeTool } from '@/engine/tools/impls/finalizeIntake';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { AdaClients, EmailSendOptions } from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const FIRM_ID = '00000000-0000-4000-8000-000000000b01';
const LIST_ID = '00000000-0000-4000-8000-000000000b02';
const CFG_ID = '00000000-0000-4000-8000-000000000b03';
const SESSION_ID = '00000000-0000-4000-8000-000000000222';

interface TestHarness {
  clients: AdaClients;
  emailsSent: EmailSendOptions[];
  blobsUploaded: { key: string }[];
}

async function setupHarness(): Promise<TestHarness> {
  const clients = makeInMemoryClients();
  const emailsSent: EmailSendOptions[] = [];
  const blobsUploaded: { key: string }[] = [];

  const origSend = clients.email.send.bind(clients.email);
  clients.email.send = async (opts: EmailSendOptions) => {
    emailsSent.push(opts);
    return origSend(opts);
  };

  const origUpload = clients.blob.upload.bind(clients.blob);
  clients.blob.upload = async (opts) => {
    blobsUploaded.push({ key: opts.key });
    return origUpload(opts);
  };

  await clients.db.writeLawFirm({
    id: FIRM_ID,
    orgId: ORG_ID,
    name: 'Preview Test Firm',
    primaryContact: null,
    email: 'intake@example.com',
    phone: null,
    stripeCustomerId: null,
    isPilot: true,
    status: 'active',
  });
  await clients.db.writeListing({
    id: LIST_ID,
    lawFirmId: FIRM_ID,
    title: 'Preview Test Listing',
    slug: 'preview-test-listing',
    category: 'ada_title_iii',
    shortDescription: null,
    fullDescription: null,
    eligibilitySummary: null,
    status: 'published',
    tier: 'basic',
  });
  await clients.db.writeListingConfig({
    id: CFG_ID,
    listingId: LIST_ID,
    caseDescription: 'Test',
    eligibilityCriteria: [],
    requiredFields: [
      {
        name: 'hotel_name',
        description: 'Hotel',
        required: true,
        type: 'string',
      },
    ],
    disqualifyingConditions: [],
    adaPromptOverride: null,
  });

  return { clients, emailsSent, blobsUploaded };
}

function testState(overrides: Partial<AdaSessionState> = {}): AdaSessionState {
  return {
    sessionId: SESSION_ID,
    orgId: ORG_ID,
    sessionType: 'class_action_intake',
    status: 'active',
    readingLevel: 'standard',
    anonSessionId: '00000000-0000-4000-8000-000000000333',
    userId: null,
    listingId: LIST_ID,
    conversationHistory: [],
    extractedFields: {
      claimant_name: {
        value: 'Preview User',
        confidence: 0.95,
        extracted_at: '2026-04-22T20:00:00.000Z',
      },
      claimant_email: {
        value: 'preview@example.com',
        confidence: 0.95,
        extracted_at: '2026-04-22T20:00:00.000Z',
      },
      hotel_name: {
        value: 'Test Hotel',
        confidence: 0.9,
        extracted_at: '2026-04-22T20:00:00.000Z',
      },
    },
    classification: {
      title: 'III',
      tier: 'high',
      reasoning: 'Test',
      standard: 'ADA Title III',
      class_action_candidate: null,
    },
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
    ...overrides,
  };
}

// ─── Happy path: is_test qualified ──────────────────────────────────────────

describe('finalize_intake is_test short-circuit', () => {
  it('qualified: completes without side effects', async () => {
    const h = await setupHarness();
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state: testState() },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const content = result.content as Record<string, unknown>;
    expect(content.finalized).toBe(true);
    expect(content.is_test).toBe(true);
    expect(content.outcome).toBe('qualified');
    expect(content.firm_email_sent).toBe(false);
    expect(content.user_email_sent).toBe(false);
    expect(content.transcript_generated).toBe(false);
    expect(result.stateChanges?.sessionTransition).toBe('complete');
    expect(h.emailsSent).toHaveLength(0);
    expect(h.blobsUploaded).toHaveLength(0);
  });

  it('disqualified: completes without side effects, outcome=disqualified', async () => {
    const h = await setupHarness();
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state: testState() },
      { qualified: false, disqualifying_reason: 'incident outside the US' },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const content = result.content as Record<string, unknown>;
    expect(content.outcome).toBe('disqualified');
    expect(content.disqualifying_reason).toBe('incident outside the US');
    expect(h.emailsSent).toHaveLength(0);
    expect(h.blobsUploaded).toHaveLength(0);
  });

  it('handoff receipt in metadata marks is_test and skips email/transcript', async () => {
    const h = await setupHarness();
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state: testState() },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const patch = result.stateChanges?.metadataPatch as Record<string, unknown>;
    const handoff = patch.handoff as Record<string, unknown>;
    expect(handoff.is_test).toBe(true);
    expect(handoff.firm_email_id).toBeNull();
    expect(handoff.user_email_id).toBeNull();
    expect(handoff.transcript_url).toBeNull();
    expect(handoff.firm_email_error).toMatch(/is_test/);
    expect(handoff.user_email_error).toMatch(/is_test/);
    expect(handoff.transcript_error).toMatch(/is_test/);
  });
});

// ─── Short-circuit bypasses gates ───────────────────────────────────────────

describe('finalize_intake is_test short-circuit — gates', () => {
  it('completes even when session has no listingId (Gate 1 bypass)', async () => {
    const h = await setupHarness();
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state: testState({ listingId: null }) },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((result.content as Record<string, unknown>).is_test).toBe(true);
    expect(h.emailsSent).toHaveLength(0);
  });

  it('completes when sessionType is not class_action_intake (Gate 1 bypass)', async () => {
    const h = await setupHarness();
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state: testState({ sessionType: 'public_ada' }) },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((result.content as Record<string, unknown>).is_test).toBe(true);
  });

  it('completes when required fields are missing (Gate 2 bypass)', async () => {
    const h = await setupHarness();
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state: testState({ extractedFields: {} }) },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect((result.content as Record<string, unknown>).is_test).toBe(true);
    expect(h.emailsSent).toHaveLength(0);
  });
});

// ─── is_test does not affect non-test sessions ──────────────────────────────

describe('finalize_intake: non-test sessions still gate normally', () => {
  it('non-test session with no listingId returns an error (no bypass)', async () => {
    const h = await setupHarness();
    const result = await finalizeIntakeTool.execute(
      {
        clients: h.clients,
        state: testState({ isTest: false, listingId: null }),
      },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/listing/i);
  });
});
