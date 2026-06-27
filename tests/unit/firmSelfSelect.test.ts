/**
 * Unit — firm self-select assignment methods on the DB client.
 *
 * Covers listFirmAssignmentsForFirm / addFirmAssignment / removeFirmAssignment:
 * idempotency, and the firm-scope boundary (one firm's opt-in/opt-out never
 * touches another firm's rows). The router's consumption of these rows is
 * covered separately in firmSelfSelectRouting.test.ts.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';

const FIRM_A = 'firm-a';
const FIRM_B = 'firm-b';
const LIT_1 = 'lit-1';
const LIT_2 = 'lit-2';

describe('firm self-select — assignment db methods', () => {
  it('addFirmAssignment is idempotent on (litigation, firm)', async () => {
    const db = new InMemoryDbClient();
    const first = await db.addFirmAssignment({ litigationListingId: LIT_1, lawFirmId: FIRM_A });
    const second = await db.addFirmAssignment({ litigationListingId: LIT_1, lawFirmId: FIRM_A });
    expect(second.id).toBe(first.id);
    const forFirm = await db.listFirmAssignmentsForFirm(FIRM_A);
    expect(forFirm).toHaveLength(1);
  });

  it('listFirmAssignmentsForFirm returns only that firm’s rows', async () => {
    const db = new InMemoryDbClient();
    await db.addFirmAssignment({ litigationListingId: LIT_1, lawFirmId: FIRM_A });
    await db.addFirmAssignment({ litigationListingId: LIT_2, lawFirmId: FIRM_A });
    await db.addFirmAssignment({ litigationListingId: LIT_1, lawFirmId: FIRM_B });

    const a = await db.listFirmAssignmentsForFirm(FIRM_A);
    const b = await db.listFirmAssignmentsForFirm(FIRM_B);
    expect(a.map((r) => r.litigationListingId).sort()).toEqual([LIT_1, LIT_2]);
    expect(b.map((r) => r.litigationListingId)).toEqual([LIT_1]);
  });

  it('removeFirmAssignment only removes the calling firm’s row', async () => {
    const db = new InMemoryDbClient();
    await db.addFirmAssignment({ litigationListingId: LIT_1, lawFirmId: FIRM_A });
    await db.addFirmAssignment({ litigationListingId: LIT_1, lawFirmId: FIRM_B });

    const removed = await db.removeFirmAssignment(LIT_1, FIRM_A);
    expect(removed).toBe(true);
    expect(await db.listFirmAssignmentsForFirm(FIRM_A)).toHaveLength(0);
    // Firm B's opt-in for the same litigation is untouched.
    expect(await db.listFirmAssignmentsForFirm(FIRM_B)).toHaveLength(1);
  });

  it('removeFirmAssignment is idempotent (false when nothing to remove)', async () => {
    const db = new InMemoryDbClient();
    expect(await db.removeFirmAssignment(LIT_1, FIRM_A)).toBe(false);
  });
});
