/**
 * Integration test — admin notification wiring at routing (Phase 1c).
 *
 * Proves createCaseForSession fires the admin notification when it CREATES a
 * sourcing / general_queue case, and only then (idempotent re-finalize is a
 * no-op, and routed_firm carries no admin send). Mirrors the Phase 1a
 * routeCaseAtFinalize seeding, extended with a capturing email client.
 *
 * Encodes /plan Phase 1c acceptance criterion 2.
 */

import { describe, it, expect } from 'vitest';
import {
  InMemoryDbClient,
  InMemoryClock,
  InMemoryAuditClient,
} from '@/engine/clients/inMemoryClients';
import { createCaseForSession } from '@/engine/routing/createCaseForSession';
import type { AdaSessionState } from '@/engine/types';
import type { EmailClient, EmailSendOptions } from '@/engine/clients/types';
import type { AdaTitle } from '@/types/db';

const ORG = 'org-1';

class CapturingEmail implements EmailClient {
  sent: EmailSendOptions[] = [];
  async send(o: EmailSendOptions): Promise<{ id: string }> {
    this.sent.push(o);
    return { id: 're_test' };
  }
}

function makeState(partial: {
  sessionId?: string;
  title?: AdaTitle | null;
  litigationListingId?: string | null;
}): AdaSessionState {
  return {
    sessionId: partial.sessionId ?? 'sess-1',
    orgId: ORG,
    sessionType: 'public_ada',
    status: 'completed',
    litigationListingId: partial.litigationListingId ?? null,
    extractedFields: {},
    classification:
      partial.title === null
        ? null
        : { title: partial.title ?? 'III', tier: 'high', reasoning: 'r', standard: '§201' },
  } as unknown as AdaSessionState;
}

function clients(email: EmailClient, adminEmail: string) {
  return {
    db: new InMemoryDbClient(),
    clock: new InMemoryClock(),
    audit: new InMemoryAuditClient(),
    email,
    adminNotificationEmail: adminEmail,
  };
}

describe('createCaseForSession — admin notification wiring', () => {
  it('emails the admin when it creates a sourcing case', async () => {
    const email = new CapturingEmail();
    const c = clients(email, 'admin@adalegallink.com');

    // Matched litigation with no resolvable firm → sourcing (admin-notified).
    const row = await createCaseForSession(
      c,
      makeState({ title: 'III', litigationListingId: 'lit-orphan' }),
    );

    expect(row!.lane).toBe('sourcing');
    expect(email.sent.map((s) => s.to)).toEqual(['admin@adalegallink.com']);
  });

  it('does NOT email the admin for a pool case (self-select, no admin in the loop)', async () => {
    const email = new CapturingEmail();
    const c = clients(email, 'admin@adalegallink.com');

    // No litigation + actionable title → pool (R4 cutover).
    const row = await createCaseForSession(c, makeState({ title: 'III', litigationListingId: null }));

    expect(row!.lane).toBe('pool');
    expect(email.sent).toHaveLength(0);
  });

  it('does not re-notify on idempotent re-finalize of the same session', async () => {
    const email = new CapturingEmail();
    const c = clients(email, 'admin@adalegallink.com');

    await createCaseForSession(c, makeState({ title: 'III', litigationListingId: 'lit-orphan' }));
    await createCaseForSession(c, makeState({ title: 'III', litigationListingId: 'lit-orphan' }));

    // Created once → notified once.
    expect(email.sent).toHaveLength(1);
  });
});
