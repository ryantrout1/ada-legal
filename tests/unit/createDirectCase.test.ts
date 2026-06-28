/**
 * Layer 1 test — createDirectCase (self-originated / attorney-created matters).
 *
 * An attorney brings their own matter into the portal (no ada_session). It
 * lands in the 'direct' lane, is born 'investigating' and owned by its creator,
 * and is consent-true by construction (there is no claimant handoff to gate).
 * The client is captured as a case person and an initial CREATED activity is
 * written. Non-idempotent: each call is a distinct matter.
 *
 * Encodes /plan "Add a matter" Phase 1 — acceptance criteria 1, 2, 4.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';

const ORG = 'org-1';
const FIRM = 'firm-1';
const ATTORNEY = 'attorney-1';
const USER = 'user-1';

const baseOpts = () => ({
  orgId: ORG,
  firmId: FIRM,
  assignedLawyerId: ATTORNEY,
  createdBy: USER,
  classificationTitle: 'Title III — entrance access',
  jurisdictionState: 'AZ',
  defendant: { name: 'Acme Diner' },
  client: { name: 'Jane Roe', email: 'jane@example.com', phone: '555-0100' },
  openingNote: 'Intake call scheduled for Thursday.',
});

describe('createDirectCase', () => {
  it('creates a direct-lane matter, born investigating, owned by its creator, consent-true', async () => {
    const db = new InMemoryDbClient();
    const row = await db.createDirectCase(baseOpts());

    expect(row.lane).toBe('direct');
    expect(row.status).toBe('investigating');
    expect(row.firmId).toBe(FIRM);
    expect(row.assignedLawyerId).toBe(ATTORNEY);
    expect(row.consentToShare).toBe(true);
    expect(row.adaSessionId).toBeNull();
    expect(row.caseNumber).toMatch(/^CASE-\d{4}$/);
  });

  it('captures the client as a case person and writes a CREATED activity', async () => {
    const db = new InMemoryDbClient();
    const row = await db.createDirectCase(baseOpts());

    const people = await db.listCasePeople(row.id, FIRM);
    const client = people.find((p) => p.role === 'client');
    expect(client?.name).toBe('Jane Roe');
    expect(client?.email).toBe('jane@example.com');

    const detail = await db.getCaseDetailForFirm(row.id, FIRM);
    expect(detail!.activity.some((a) => a.eventType === 'CREATED')).toBe(true);
  });

  it('appears in the firm working queue with the client name (no session join)', async () => {
    const db = new InMemoryDbClient();
    const row = await db.createDirectCase(baseOpts());

    const queue = await db.listCasesForFirm(FIRM);
    expect(queue.counts).toEqual({ new: 0, working: 1, resolved: 0 });
    expect(queue.groups.working[0]!.caseId).toBe(row.id);
    expect(queue.groups.working[0]!.claimantName).toBe('Jane Roe');
    expect(queue.groups.working[0]!.lane).toBe('direct');
  });

  it('is firm-scoped — another firm cannot read it (the 404 boundary)', async () => {
    const db = new InMemoryDbClient();
    const row = await db.createDirectCase(baseOpts());
    expect(await db.getCaseDetailForFirm(row.id, 'other-firm')).toBeNull();
  });

  it('is non-idempotent — two creates make two distinct matters', async () => {
    const db = new InMemoryDbClient();
    const a = await db.createDirectCase(baseOpts());
    const b = await db.createDirectCase(baseOpts());
    expect(a.id).not.toBe(b.id);
    expect(a.caseNumber).not.toBe(b.caseNumber);
    expect((await db.listCasesForFirm(FIRM)).counts.working).toBe(2);
  });
});
