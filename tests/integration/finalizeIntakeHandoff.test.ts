/**
 * Integration test for finalize_intake's Step 24 handoff behavior.
 *
 * Not a Layer 3 persona (no LLM in the loop) — this tests the
 * tool executor directly, which is the piece Step 24 extends.
 * Layer 3 personas come in a later commit when the full real-LLM
 * scripted-conversation harness is ready.
 *
 * What we verify:
 *   1. Qualified path: all required fields present → session
 *      completes, firm email sent, user email sent, transcript URL
 *      attached, structured_output-equivalent metadata written.
 *   2. Disqualified path: user email sent with reason, NO firm
 *      email, NO transcript, session completes.
 *   3. Idempotency: a second call on a completed session is a
 *      no-op; no emails re-sent.
 *   4. Soft-failure for email outages: if the EmailClient throws,
 *      the session still completes and the error is recorded in
 *      metadata.handoff.
 *
 * Ref: Step 24, Commit 4.
 */

import { describe, it, expect } from 'vitest';
import { finalizeIntakeTool } from '@/engine/tools/impls/finalizeIntake';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { AdaClients, EmailSendOptions } from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const FIRM_ID = '00000000-0000-4000-8000-000000000a01';
const LIST_ID = '00000000-0000-4000-8000-000000000a02';
const CFG_ID = '00000000-0000-4000-8000-000000000a03';
const SESSION_ID = '00000000-0000-4000-8000-000000000111';

interface TestHarness {
  clients: AdaClients;
  emailsSent: EmailSendOptions[];
  blobsUploaded: { key: string; contentType: string }[];
}

async function setupHarness(
  opts: { failEmails?: boolean; failBlob?: boolean; noFirmEmail?: boolean } = {},
): Promise<TestHarness> {
  const clients = makeInMemoryClients();
  const emailsSent: EmailSendOptions[] = [];
  const blobsUploaded: { key: string; contentType: string }[] = [];

  // Intercept email sends
  const originalEmailSend = clients.email.send.bind(clients.email);
  clients.email.send = async (opts2: EmailSendOptions) => {
    emailsSent.push(opts2);
    if (opts.failEmails) throw new Error('Resend outage simulated');
    return originalEmailSend(opts2);
  };

  // Intercept blob uploads
  const originalBlobUpload = clients.blob.upload.bind(clients.blob);
  clients.blob.upload = async (uploadOpts) => {
    blobsUploaded.push({ key: uploadOpts.key, contentType: uploadOpts.contentType });
    if (opts.failBlob) throw new Error('Blob outage simulated');
    return originalBlobUpload(uploadOpts);
  };

  // Seed law_firm + listing + config
  await clients.db.writeLawFirm({
    id: FIRM_ID,
    orgId: ORG_ID,
    name: 'Acme ADA Law',
    primaryContact: 'Jane Partner',
    email: opts.noFirmEmail ? null : 'intake@acme-ada.example',
    phone: '+1-555-000-0000',
    stripeCustomerId: null,
    status: 'active',
  });
  await clients.db.writeListing({
    id: LIST_ID,
    lawFirmId: FIRM_ID,
    title: 'Hotel booking fraud class action',
    slug: 'hotel-booking-fraud',
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
    caseDescription: 'Test case',
    eligibilityCriteria: [],
    requiredFields: [
      { name: 'hotel_name', description: 'Hotel', required: true, type: 'string' },
      { name: 'incident_date', description: 'Date', required: true, type: 'date' },
    ],
    disqualifyingConditions: [],
    adaPromptOverride: null,
  });

  return { clients, emailsSent, blobsUploaded };
}

function qualifiedState(): AdaSessionState {
  return {
    sessionId: SESSION_ID,
    orgId: ORG_ID,
    sessionType: 'class_action_intake',
    status: 'active',
    readingLevel: 'standard',
    anonSessionId: '00000000-0000-4000-8000-000000000222',
    userId: null,
    listingId: LIST_ID,
    conversationHistory: [
      {
        role: 'user',
        content: 'I booked an accessible room at the Marriott and they gave me a standard room.',
        timestamp: '2026-04-22T17:00:00.000Z',
      },
    ],
    extractedFields: {
      claimant_name: { value: 'Alex Morales', confidence: 0.95, extracted_at: '2026-04-22T17:00:00.000Z' },
      claimant_email: { value: 'alex@example.com', confidence: 0.95, extracted_at: '2026-04-22T17:00:00.000Z' },
      hotel_name: { value: 'Marriott Phoenix', confidence: 0.95, extracted_at: '2026-04-22T17:00:00.000Z' },
      incident_date: { value: '2026-03-15', confidence: 0.9, extracted_at: '2026-04-22T17:00:00.000Z' },
    },
    classification: {
      title: 'III',
      tier: 'high',
      reasoning: 'Public accommodation issue',
      standard: 'ADA Title III',
      class_action_candidate: null,
    },
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
  };
}

// ─── Qualified path ───────────────────────────────────────────────────────────

describe('finalize_intake handoff — qualified', () => {
  it('completes session, sends firm + user emails, attaches transcript', async () => {
    const h = await setupHarness();
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state: qualifiedState() },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stateChanges?.sessionTransition).toBe('complete');
    expect(result.stateChanges?.metadataPatch?.outcome).toBe('qualified');

    // 2 emails: firm + user
    expect(h.emailsSent).toHaveLength(2);
    const firmEmail = h.emailsSent.find((e) => e.to === 'intake@acme-ada.example');
    const userEmail = h.emailsSent.find((e) => e.to === 'alex@example.com');
    expect(firmEmail).toBeDefined();
    expect(userEmail).toBeDefined();
    expect(firmEmail!.subject).toMatch(/New qualified intake/);
    expect(userEmail!.subject).toMatch(/sent your information/);

    // 1 blob uploaded (transcript)
    expect(h.blobsUploaded).toHaveLength(1);
    expect(h.blobsUploaded[0]!.contentType).toBe('application/pdf');
    expect(h.blobsUploaded[0]!.key).toMatch(/^transcripts\//);
  });

  it('firm email includes the transcript URL', async () => {
    const h = await setupHarness();
    await finalizeIntakeTool.execute(
      { clients: h.clients, state: qualifiedState() },
      { qualified: true, disqualifying_reason: null },
    );
    const firmEmail = h.emailsSent.find((e) => e.to === 'intake@acme-ada.example');
    expect(firmEmail!.html).toMatch(/Download PDF transcript/);
  });

  it('user email does NOT include the transcript URL', async () => {
    const h = await setupHarness();
    await finalizeIntakeTool.execute(
      { clients: h.clients, state: qualifiedState() },
      { qualified: true, disqualifying_reason: null },
    );
    const userEmail = h.emailsSent.find((e) => e.to === 'alex@example.com');
    expect(userEmail!.html).not.toMatch(/transcript/i);
  });

  it('records handoff receipts (email ids, transcript url) in metadata', async () => {
    const h = await setupHarness();
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state: qualifiedState() },
      { qualified: true, disqualifying_reason: null },
    );
    if (!result.ok) return;
    const handoff = (result.stateChanges?.metadataPatch as Record<string, unknown>)
      ?.handoff as Record<string, unknown>;
    expect(handoff).toBeDefined();
    expect(handoff.firm_email_id).toBeTruthy();
    expect(handoff.user_email_id).toBeTruthy();
    expect(handoff.transcript_url).toMatch(/^(https:\/\/|memory:\/\/)/);
    expect(handoff.firm_email_error).toBeNull();
    expect(handoff.user_email_error).toBeNull();
    expect(handoff.transcript_error).toBeNull();
  });
});

// ─── Disqualified path ────────────────────────────────────────────────────────

describe('finalize_intake handoff — disqualified', () => {
  it('completes, sends user email ONLY, NO firm email, NO transcript', async () => {
    const h = await setupHarness();
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state: qualifiedState() },
      {
        qualified: false,
        disqualifying_reason: 'Claim is outside the class jurisdiction',
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stateChanges?.metadataPatch?.outcome).toBe('disqualified');

    // 1 email (user only)
    expect(h.emailsSent).toHaveLength(1);
    expect(h.emailsSent[0]!.to).toBe('alex@example.com');
    expect(h.emailsSent[0]!.subject).toMatch(/Update/);
    expect(h.emailsSent[0]!.html).toContain('Claim is outside the class jurisdiction');

    // 0 blob uploads
    expect(h.blobsUploaded).toHaveLength(0);
  });
});

// ─── Idempotency ──────────────────────────────────────────────────────────────

describe('finalize_intake handoff — idempotency', () => {
  it('second call on completed session is a no-op (no emails)', async () => {
    const h = await setupHarness();
    const result = await finalizeIntakeTool.execute(
      {
        clients: h.clients,
        state: {
          ...qualifiedState(),
          status: 'completed',
          metadata: { outcome: 'qualified' },
        },
      },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(true);
    expect(h.emailsSent).toHaveLength(0);
    expect(h.blobsUploaded).toHaveLength(0);
  });
});

// ─── Soft failure: email outage ───────────────────────────────────────────────

describe('finalize_intake handoff — email outage', () => {
  it('still completes the session and records errors', async () => {
    const h = await setupHarness({ failEmails: true });
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state: qualifiedState() },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.stateChanges?.sessionTransition).toBe('complete');

    const handoff = (result.stateChanges?.metadataPatch as Record<string, unknown>)
      ?.handoff as Record<string, unknown>;
    expect(handoff.firm_email_id).toBeNull();
    expect(handoff.user_email_id).toBeNull();
    expect(handoff.firm_email_error).toMatch(/Resend outage simulated/);
    expect(handoff.user_email_error).toMatch(/Resend outage simulated/);
  });
});

// ─── Soft failure: blob outage ────────────────────────────────────────────────

describe('finalize_intake handoff — blob outage', () => {
  it('firm email still sends (without transcript link), session completes', async () => {
    const h = await setupHarness({ failBlob: true });
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state: qualifiedState() },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Firm email fired but without transcript
    const firmEmail = h.emailsSent.find((e) => e.to === 'intake@acme-ada.example');
    expect(firmEmail).toBeDefined();
    expect(firmEmail!.html).not.toMatch(/Download PDF transcript/);

    const handoff = (result.stateChanges?.metadataPatch as Record<string, unknown>)
      ?.handoff as Record<string, unknown>;
    expect(handoff.transcript_url).toBeNull();
    expect(handoff.transcript_error).toMatch(/Blob outage simulated/);
  });
});

// ─── Firm without email address ───────────────────────────────────────────────

describe('finalize_intake handoff — firm without email', () => {
  it('completes session, records error, still sends user email', async () => {
    const h = await setupHarness({ noFirmEmail: true });
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state: qualifiedState() },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // User email fired, firm did not
    expect(h.emailsSent).toHaveLength(1);
    expect(h.emailsSent[0]!.to).toBe('alex@example.com');

    const handoff = (result.stateChanges?.metadataPatch as Record<string, unknown>)
      ?.handoff as Record<string, unknown>;
    expect(handoff.firm_email_error).toMatch(/no email address on file/);
  });
});

// ─── Existing gate coverage still works ──────────────────────────────────────

describe('finalize_intake handoff — existing gates still enforce', () => {
  it('still rejects when required fields are missing (qualified=true)', async () => {
    const h = await setupHarness();
    const state = qualifiedState();
    delete state.extractedFields.hotel_name;
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(false);
    expect(h.emailsSent).toHaveLength(0);
  });

  it('still rejects when session not bound to a listing', async () => {
    const h = await setupHarness();
    const state = { ...qualifiedState(), listingId: null };
    const result = await finalizeIntakeTool.execute(
      { clients: h.clients, state },
      { qualified: true, disqualifying_reason: null },
    );
    expect(result.ok).toBe(false);
    expect(h.emailsSent).toHaveLength(0);
  });
});
