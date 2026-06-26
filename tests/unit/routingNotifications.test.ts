/**
 * Layer 1 tests — routing notification orchestrators (Phase 1c).
 *
 * sendConsentNotifications (firm + user, on consent) and
 * sendAdminRoutingNotification (admin, on routing). Tested against the
 * in-memory DB with a capturing / throwing email client — the same double the
 * self-help email tests use. Asserts recipients, the NOTIFIED receipt,
 * missing-recipient skips, lane guarding, and soft-fail (never throws).
 *
 * Encodes /plan Phase 1c acceptance criteria 1-4 (+ the boundary of 5).
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import type { EmailClient, EmailSendOptions } from '@/engine/clients/types';
import {
  sendConsentNotifications,
  sendPlacementNotification,
  sendAdminRoutingNotification,
} from '@/engine/notifications/routingNotifications';
import type { AdaSessionState } from '@/engine/types';

class CapturingEmail implements EmailClient {
  sent: EmailSendOptions[] = [];
  async send(o: EmailSendOptions): Promise<{ id: string }> {
    this.sent.push(o);
    return { id: 're_test_123' };
  }
}
class ThrowingEmail implements EmailClient {
  async send(): Promise<{ id: string }> {
    throw new Error('Resend down');
  }
}

function field(value: unknown) {
  return { value, confidence: 0.9, extracted_at: '2026-04-22T00:00:00.000Z' };
}

function baseState(overrides: Partial<AdaSessionState> = {}): AdaSessionState {
  return {
    sessionId: 'sess-1',
    orgId: 'org-1',
    sessionType: 'public_ada',
    status: 'completed',
    litigationListingId: null,
    extractedFields: {},
    classification: null,
    metadata: {},
    accessibilitySettings: {},
    isTest: true,
    ...overrides,
  } as unknown as AdaSessionState;
}

async function seed(
  db: InMemoryDbClient,
  opts: { firmEmail?: string | null; userEmail?: string | null; lane?: 'routed_firm' | 'sourcing' } = {},
) {
  const firmEmail = opts.firmEmail === undefined ? 'firm@x.com' : opts.firmEmail;
  const userEmail = opts.userEmail === undefined ? 'user@y.com' : opts.userEmail;
  const lane = opts.lane ?? 'routed_firm';

  await db.writeLawFirm({
    id: 'firm-1',
    orgId: 'org-1',
    name: 'Test Firm',
    primaryContact: null,
    email: firmEmail,
    phone: null,
    stripeCustomerId: null,
    status: 'active',
    isPilot: true,
  });
  await db.writeSession({
    state: baseState({
      extractedFields: userEmail
        ? { contact_email: field(userEmail), claimant_name: field('Jane Doe') }
        : {},
    }),
  });
  const { caseRow } = await db.createCase({
    orgId: 'org-1',
    adaSessionId: 'sess-1',
    litigationListingId: null,
    lane,
    firmId: lane === 'routed_firm' ? 'firm-1' : null,
    classificationTitle: 'III',
    classificationStandard: null,
    matchConfidence: null,
    jurisdictionState: null,
    routedAt: null,
    firstContactDue: null,
    routingReason: 'test',
  });
  return caseRow;
}

const URL = 'https://ada.adalegallink.com/s/s-abcdefghjkmn';

describe('sendConsentNotifications', () => {
  it('emails both the firm and the user, and writes a NOTIFIED receipt', async () => {
    const db = new InMemoryDbClient();
    const email = new CapturingEmail();
    const caseRow = await seed(db);

    await sendConsentNotifications({ email, db }, caseRow, URL);

    expect(email.sent.map((s) => s.to).sort()).toEqual(['firm@x.com', 'user@y.com']);
    const notified = db.caseActivity.filter((a) => a.eventType === 'NOTIFIED');
    expect(notified).toHaveLength(1);
    expect((notified[0]!.metadata as { recipients: string[] }).recipients).toHaveLength(2);
  });

  it('skips the firm when it has no email, still notifies the user', async () => {
    const db = new InMemoryDbClient();
    const email = new CapturingEmail();
    const caseRow = await seed(db, { firmEmail: null });

    await sendConsentNotifications({ email, db }, caseRow, URL);

    expect(email.sent.map((s) => s.to)).toEqual(['user@y.com']);
    const notified = db.caseActivity.find((a) => a.eventType === 'NOTIFIED')!;
    expect((notified.metadata as { skipped: string[] }).skipped).toContain('firm:no_email');
  });

  it('skips the user when no contact email was captured', async () => {
    const db = new InMemoryDbClient();
    const email = new CapturingEmail();
    const caseRow = await seed(db, { userEmail: null });

    await sendConsentNotifications({ email, db }, caseRow, URL);

    expect(email.sent.map((s) => s.to)).toEqual(['firm@x.com']);
    const notified = db.caseActivity.find((a) => a.eventType === 'NOTIFIED')!;
    expect((notified.metadata as { skipped: string[] }).skipped).toContain('user:no_email');
  });

  it('soft-fails when the email client throws — no exception, receipt notes failure', async () => {
    const db = new InMemoryDbClient();
    const caseRow = await seed(db);

    await expect(
      sendConsentNotifications({ email: new ThrowingEmail(), db }, caseRow, URL),
    ).resolves.toBeUndefined();

    const notified = db.caseActivity.find((a) => a.eventType === 'NOTIFIED')!;
    expect((notified.metadata as { skipped: string[] }).skipped.join(',')).toContain('send_failed');
  });
});

describe('sendAdminRoutingNotification', () => {
  it('emails the admin for a sourcing case and writes a receipt', async () => {
    const db = new InMemoryDbClient();
    const email = new CapturingEmail();
    const caseRow = await seed(db, { lane: 'sourcing' });

    await sendAdminRoutingNotification({ email, db, adminEmail: 'admin@adalegallink.com' }, caseRow);

    expect(email.sent.map((s) => s.to)).toEqual(['admin@adalegallink.com']);
    expect(db.caseActivity.some((a) => a.eventType === 'NOTIFIED')).toBe(true);
  });

  it('does nothing for a routed_firm case (wrong lane)', async () => {
    const db = new InMemoryDbClient();
    const email = new CapturingEmail();
    const caseRow = await seed(db, { lane: 'routed_firm' });

    await sendAdminRoutingNotification({ email, db, adminEmail: 'admin@adalegallink.com' }, caseRow);

    expect(email.sent).toHaveLength(0);
  });

  it('skips (no throw) when no admin recipient is configured', async () => {
    const db = new InMemoryDbClient();
    const email = new CapturingEmail();
    const caseRow = await seed(db, { lane: 'sourcing' });

    await expect(
      sendAdminRoutingNotification({ email, db, adminEmail: null }, caseRow),
    ).resolves.toBeUndefined();
    expect(email.sent).toHaveLength(0);
    const notified = db.caseActivity.find((a) => a.eventType === 'NOTIFIED')!;
    expect((notified.metadata as { skipped: string[] }).skipped).toContain('admin:no_recipient');
  });
});

describe('sendPlacementNotification', () => {
  it('emails the firm (matched email) when the placed case is consented', async () => {
    const db = new InMemoryDbClient();
    const email = new CapturingEmail();
    await seed(db, { lane: 'routed_firm' });
    await db.recordCaseConsent({ sessionId: 'sess-1', scope: 'matched_firm' });
    const caseRow = (await db.getCaseBySessionId('sess-1'))!;

    await sendPlacementNotification({ email, db }, caseRow);

    expect(email.sent.map((s) => s.to)).toEqual(['firm@x.com']);
    const notified = db.caseActivity.find((a) => a.eventType === 'NOTIFIED')!;
    expect((notified.metadata as { recipients: string[] }).recipients).toEqual(['firm:firm@x.com']);
  });

  it('no-ops (no email, no receipt) when the case is not yet consented', async () => {
    const db = new InMemoryDbClient();
    const email = new CapturingEmail();
    const caseRow = await seed(db, { lane: 'routed_firm' }); // consent not recorded

    await sendPlacementNotification({ email, db }, caseRow);

    expect(email.sent).toHaveLength(0);
    expect(db.caseActivity.some((a) => a.eventType === 'NOTIFIED')).toBe(false);
  });

  it('records a firm:no_email skip when the firm has no address', async () => {
    const db = new InMemoryDbClient();
    const email = new CapturingEmail();
    await seed(db, { lane: 'routed_firm', firmEmail: null });
    await db.recordCaseConsent({ sessionId: 'sess-1', scope: 'matched_firm' });
    const caseRow = (await db.getCaseBySessionId('sess-1'))!;

    await sendPlacementNotification({ email, db }, caseRow);

    expect(email.sent).toHaveLength(0);
    const notified = db.caseActivity.find((a) => a.eventType === 'NOTIFIED')!;
    expect((notified.metadata as { skipped: string[] }).skipped).toContain('firm:no_email');
  });

  it('soft-fails (no throw) when the email client throws', async () => {
    const db = new InMemoryDbClient();
    await seed(db, { lane: 'routed_firm' });
    await db.recordCaseConsent({ sessionId: 'sess-1', scope: 'matched_firm' });
    const caseRow = (await db.getCaseBySessionId('sess-1'))!;

    await expect(
      sendPlacementNotification({ email: new ThrowingEmail(), db }, caseRow),
    ).resolves.toBeUndefined();
    const notified = db.caseActivity.find((a) => a.eventType === 'NOTIFIED')!;
    expect((notified.metadata as { skipped: string[] }).skipped).toContain('firm:send_failed');
  });
});
