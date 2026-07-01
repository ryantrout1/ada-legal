/**
 * Integration — attorney ↔ firm linkage persistence (/plan Phase 2, AC#2/#3).
 *
 * The admin write paths let an attorney be linked to a firm entity by
 * law_firm_id (not just free-text firm_name). This exercises the db-client
 * contract those handlers depend on:
 *   - createAttorney with a law_firm_id persists the link and the attorney
 *     shows up in that firm's roster (AC#2)
 *   - updateAttorney can move an attorney between firms, and unlink to solo,
 *     with the roster following (AC#3)
 *
 * The handler-level sync-on-write rule (firm_name mirrors the firm) is unit-
 * tested separately in tests/unit/attorneyFirmLink.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { LawFirmRow } from '@/engine/clients/types';

const ORG = '00000000-0000-4000-8000-0000000000b1';
const FIRM_A = '00000000-0000-4000-8000-00000000bb01';
const FIRM_B = '00000000-0000-4000-8000-00000000bb02';

function firm(id: string, name: string): LawFirmRow {
  return {
    id,
    orgId: ORG,
    name,
    primaryContact: null,
    email: null,
    phone: null,
    stripeCustomerId: null,
    status: 'active',
    isPilot: true,
  };
}

describe('attorney ↔ firm linkage', () => {
  it('createAttorney with a law_firm_id persists the link and populates the roster', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A, 'Firm A'));

    const created = await clients.db.createAttorney({
      orgId: ORG,
      name: 'Linked Attorney',
      lawFirmId: FIRM_A,
      firmName: 'Firm A', // handler would sync this; here we pass it explicitly
      practiceAreas: [],
      status: 'approved',
    });

    expect(created.lawFirmId).toBe(FIRM_A);
    const roster = await clients.db.listAttorneysForFirm(FIRM_A);
    expect(roster.map((a) => a.id)).toContain(created.id);
  });

  it('updateAttorney moves an attorney between firms, roster follows (AC#3)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A, 'Firm A'));
    await clients.db.writeLawFirm(firm(FIRM_B, 'Firm B'));

    const created = await clients.db.createAttorney({
      orgId: ORG,
      name: 'Mover',
      lawFirmId: FIRM_A,
      firmName: 'Firm A',
      practiceAreas: [],
    });

    const moved = await clients.db.updateAttorney(created.id, {
      lawFirmId: FIRM_B,
      firmName: 'Firm B',
    });
    expect(moved?.lawFirmId).toBe(FIRM_B);

    const rosterA = await clients.db.listAttorneysForFirm(FIRM_A);
    const rosterB = await clients.db.listAttorneysForFirm(FIRM_B);
    expect(rosterA.map((a) => a.id)).not.toContain(created.id);
    expect(rosterB.map((a) => a.id)).toContain(created.id);
  });

  it('updateAttorney can unlink to solo (law_firm_id → null)', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeLawFirm(firm(FIRM_A, 'Firm A'));

    const created = await clients.db.createAttorney({
      orgId: ORG,
      name: 'Going Solo',
      lawFirmId: FIRM_A,
      firmName: 'Firm A',
      practiceAreas: [],
    });

    const solo = await clients.db.updateAttorney(created.id, {
      lawFirmId: null,
      firmName: 'Going Solo, Esq.',
    });
    expect(solo?.lawFirmId ?? null).toBeNull();
    expect(solo?.firmName).toBe('Going Solo, Esq.');

    const rosterA = await clients.db.listAttorneysForFirm(FIRM_A);
    expect(rosterA.map((a) => a.id)).not.toContain(created.id);
  });
});
