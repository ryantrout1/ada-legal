/**
 * Tests for the self-help confirmation email (/plan ADALL #2, Phase 2).
 *
 * Pure renderer + soft-fail send orchestrator, tested against the
 * in-memory client (same pattern as resolveAttorneyContext): the email
 * client is captured, the receipt persist is read back from the session.
 *
 * Ref: /plan ADALL #2, Phase 2.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import {
  extractContactEmail,
  renderSelfHelpUserEmail,
  maybeSendSelfHelpEmail,
} from '@/engine/handoff/selfHelpEmail';
import type { AdaSessionState } from '@/engine/types';
import type { EmailClient, EmailSendOptions } from '@/engine/clients/types';

const SESSION = '00000000-0000-4000-8000-000000000abc';
const PKG_URL = 'https://ada.adalegallink.com/s/s-abcdefghjkmn';

function field(value: unknown) {
  return { value, confidence: 0.9, extracted_at: '2026-04-22T00:00:00.000Z' };
}

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
    extractedFields: {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
    ...overrides,
  };
}

const PKG = {
  summary: 'Title III access barrier at a restaurant.',
  demandLetter: 'Dear business, please fix the entrance...',
};
const PKG_NO_LETTER = { summary: 'Employment (Title I) issue.', demandLetter: null };

class CapturingEmail implements EmailClient {
  sent: EmailSendOptions[] = [];
  async send(opts: EmailSendOptions): Promise<{ id: string }> {
    this.sent.push(opts);
    return { id: 're_test_123' };
  }
}

class ThrowingEmail implements EmailClient {
  async send(): Promise<{ id: string }> {
    throw new Error('Resend down');
  }
}

describe('extractContactEmail', () => {
  it('returns contact_email when present and valid', () => {
    expect(extractContactEmail({ contact_email: field('a@b.com') })).toBe('a@b.com');
  });
  it('reads claimant_email — the field Ada actually writes during intake', () => {
    // Regression: Ada captures the address as claimant_email; the extractor
    // used to miss it, so the user/self-help emails silently never sent.
    expect(extractContactEmail({ claimant_email: field('ryan@adalegallink.com') })).toBe(
      'ryan@adalegallink.com',
    );
  });
  it('falls back to email / user_email', () => {
    expect(extractContactEmail({ email: field('x@y.org') })).toBe('x@y.org');
    expect(extractContactEmail({ user_email: field('z@w.net') })).toBe('z@w.net');
  });
  it('prefers contact_email over the fallbacks', () => {
    expect(
      extractContactEmail({ contact_email: field('first@x.com'), email: field('second@x.com') }),
    ).toBe('first@x.com');
  });
  it('returns null when absent', () => {
    expect(extractContactEmail({})).toBeNull();
  });
  it('returns null for a value that is not an email', () => {
    expect(extractContactEmail({ contact_email: field('not-an-email') })).toBeNull();
  });
});

describe('renderSelfHelpUserEmail', () => {
  it('puts the package URL in both html and text', () => {
    const r = renderSelfHelpUserEmail({
      packageUrl: PKG_URL,
      readingLevel: 'standard',
      summary: PKG.summary,
      hasLetter: true,
    });
    expect(r.html).toContain(PKG_URL);
    expect(r.text).toContain(PKG_URL);
  });
  it('mentions the sample letter only when one exists', () => {
    const withLetter = renderSelfHelpUserEmail({
      packageUrl: PKG_URL,
      readingLevel: 'standard',
      summary: PKG.summary,
      hasLetter: true,
    });
    const without = renderSelfHelpUserEmail({
      packageUrl: PKG_URL,
      readingLevel: 'standard',
      summary: PKG.summary,
      hasLetter: false,
    });
    expect(withLetter.text).toContain('sample letter');
    expect(without.text).not.toContain('sample letter');
  });
  it('adapts the subject to reading level', () => {
    const pro = renderSelfHelpUserEmail({
      packageUrl: PKG_URL,
      readingLevel: 'professional',
      summary: PKG.summary,
      hasLetter: false,
    });
    const simple = renderSelfHelpUserEmail({
      packageUrl: PKG_URL,
      readingLevel: 'simple',
      summary: PKG.summary,
      hasLetter: false,
    });
    expect(pro.subject).not.toBe(simple.subject);
  });
});

describe('maybeSendSelfHelpEmail', () => {
  it('sends to the captured email and records the receipt in metadata', async () => {
    const clients = makeInMemoryClients();
    const email = new CapturingEmail();
    const state = baseState({ extractedFields: { contact_email: field('user@example.com') } });
    await clients.db.writeSession({ state });

    const receipt = await maybeSendSelfHelpEmail({ email, db: clients.db }, state, PKG, PKG_URL);

    expect(receipt).not.toBeNull();
    expect(receipt!.id).toBe('re_test_123');
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]!.to).toBe('user@example.com');
    expect(email.sent[0]!.html).toContain(PKG_URL);

    const stored = await clients.db.readSession({ sessionId: SESSION });
    const meta = stored!.metadata as { self_help_email?: { id?: string } };
    expect(meta.self_help_email?.id).toBe('re_test_123');
  });

  it('does nothing (no send, no error) when no email was captured', async () => {
    const clients = makeInMemoryClients();
    const email = new CapturingEmail();
    const state = baseState();
    await clients.db.writeSession({ state });

    const receipt = await maybeSendSelfHelpEmail({ email, db: clients.db }, state, PKG, PKG_URL);

    expect(receipt).toBeNull();
    expect(email.sent).toHaveLength(0);
  });

  it('records an error receipt without throwing when the send fails', async () => {
    const clients = makeInMemoryClients();
    const state = baseState({ extractedFields: { contact_email: field('user@example.com') } });
    await clients.db.writeSession({ state });

    const receipt = await maybeSendSelfHelpEmail(
      { email: new ThrowingEmail(), db: clients.db },
      state,
      PKG_NO_LETTER,
      PKG_URL,
    );

    expect(receipt).not.toBeNull();
    expect(receipt!.id).toBeNull();
    expect(receipt!.error).toMatch(/Resend down/);

    const stored = await clients.db.readSession({ sessionId: SESSION });
    const meta = stored!.metadata as { self_help_email?: { error?: string } };
    expect(meta.self_help_email?.error).toMatch(/Resend down/);
  });
});
