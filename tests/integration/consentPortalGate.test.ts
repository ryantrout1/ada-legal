/**
 * Integration test — portal queue consent gate (Phase 1b).
 *
 * A matched session is hidden from the firm queue once it has an *unconsented*
 * case, and reappears on consent. The gate is intentionally soft: a session
 * with NO case (legacy / pre-routing fixtures) is unaffected — every real
 * post-Phase-1a session has a case, so consent is enforced in practice. Phase 2
 * tightens this to "consent required" when the portal reads cases as its source.
 *
 * Encodes /plan Phase 1b acceptance criterion 3.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import { seedPortalFixture } from '../fixtures/portalSeed';

describe('portal queue — consent gate', () => {
  it('hides a matched session with an unconsented case, reveals it on consent', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const firmA = fx.firms.firmA.id;
    const [s1] = [...fx.sessions.sessionIds];

    // Baseline: both fixture sessions show (no cases yet → not gated).
    expect((await clients.db.listPortalQueueForFirm(firmA)).cases).toHaveLength(2);

    // An unconsented case for s1 hides it.
    await clients.db.createCase({
      orgId: fx.firms.firmA.orgId,
      adaSessionId: s1,
      litigationListingId: null,
      lane: 'routed_firm',
      firmId: firmA,
      classificationTitle: 'III',
      classificationStandard: null,
      matchConfidence: null,
      jurisdictionState: null,
      routedAt: null,
      firstContactDue: null,
      routingReason: 'test',
    });
    const gated = await clients.db.listPortalQueueForFirm(firmA);
    expect(gated.cases.map((c) => c.sessionId)).not.toContain(s1);

    // Consent reveals it.
    await clients.db.recordCaseConsent({ sessionId: s1, scope: 'matched_firm' });
    const after = await clients.db.listPortalQueueForFirm(firmA);
    expect(after.cases.map((c) => c.sessionId)).toContain(s1);
  });

  it('a matched_self_referral case (firm_id null) never enters a firm queue', async () => {
    const clients = makeInMemoryClients();
    const fx = await seedPortalFixture(clients);
    const firmA = fx.firms.firmA.id;
    const [, s2] = [...fx.sessions.sessionIds];

    await clients.db.createCase({
      orgId: fx.firms.firmA.orgId,
      adaSessionId: s2,
      litigationListingId: null,
      lane: 'matched_self_referral',
      firmId: null,
      classificationTitle: 'class_action',
      classificationStandard: null,
      matchConfidence: null,
      jurisdictionState: null,
      routedAt: null,
      firstContactDue: null,
      routingReason: 'firm not opted in — contact info only',
    });

    // No firm owns it (firm_id null), so it is absent from firmA's queue —
    // there is no handoff to gate. Consent never applies.
    const queue = await clients.db.listPortalQueueForFirm(firmA);
    expect(queue.cases.map((c) => c.sessionId)).not.toContain(s2);
  });
});
