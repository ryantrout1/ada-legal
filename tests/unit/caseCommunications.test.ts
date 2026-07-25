/**
 * Case communications log.
 *
 * WHY IT IS NOT NOTES. Notes carried contact records until now, and free prose
 * cannot answer the questions a firm actually asks of a contact history: when
 * did we last reach them, have they ever replied, how many attempts before
 * this. Those are structural, so the log is typed.
 *
 * WHY IT IS NOT case_activity. That table is the audit trail — system events
 * and transitions, append-only. A communication is a human record of something
 * that happened OFF the platform, entered after the fact. Mixing them would
 * put editable rows in an audit log. The log DOES mirror a
 * COMMUNICATION_LOGGED row into activity so the matter timeline shows contact
 * alongside transitions; that mirror is the immutable half.
 *
 * WHY occurredAt IS SEPARATE FROM createdAt. A Tuesday call is often logged on
 * Thursday. The history has to read in the order things happened, not the
 * order someone typed them up — so ordering keys off occurredAt.
 *
 * WHY direction IS LOAD-BEARING. A run of outbound rows with no inbound reply
 * is the unresponsive-claimant pattern the SLA work cares about. Without the
 * field it is invisible.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';

const FIRM = 'firm-1';
const OTHER_FIRM = 'firm-2';

function seed() {
  const clients = makeInMemoryClients();
  const db = clients.db as unknown as {
    cases: Array<Record<string, unknown>>;
    caseActivity: Array<{ caseId: string; eventType: string }>;
    listCaseCommunications: (c: string, f: string) => Promise<Array<Record<string, unknown>>>;
    addCaseCommunication: (o: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
  };
  db.cases.push({ id: 'case-1', firmId: FIRM, status: 'investigating', consentToShare: true });
  return db;
}

const base = {
  caseId: 'case-1',
  lawFirmId: FIRM,
  channel: 'call',
  direction: 'outbound',
  occurredAt: null,
  subject: null,
  body: null,
  loggedBy: null,
};

describe('logging a contact', () => {
  it('records channel and direction', async () => {
    const db = seed();
    const out = await db.addCaseCommunication({ ...base, channel: 'email', direction: 'inbound' });
    expect(out).not.toBeNull();
    expect(out!.channel).toBe('email');
    expect(out!.direction).toBe('inbound');
  });

  it('mirrors an entry into the audit trail', async () => {
    // The log row stays editable; the activity row is the immutable record
    // that puts contact on the matter timeline beside transitions.
    const db = seed();
    await db.addCaseCommunication(base);
    expect(db.caseActivity.filter((a) => a.eventType === 'COMMUNICATION_LOGGED')).toHaveLength(1);
  });

  it('defaults the time to now when none is given', async () => {
    const db = seed();
    const out = await db.addCaseCommunication(base);
    expect(Number.isNaN(Date.parse(String(out!.occurredAt)))).toBe(false);
  });
});

describe('history order follows when things happened', () => {
  it('sorts by occurrence, not by entry order', async () => {
    // The case this protects: a call from Monday logged AFTER a Wednesday
    // email still has to appear below it.
    const db = seed();
    await db.addCaseCommunication({
      ...base,
      channel: 'email',
      occurredAt: '2026-07-22T10:00:00.000Z',
    });
    await db.addCaseCommunication({
      ...base,
      channel: 'call',
      occurredAt: '2026-07-20T10:00:00.000Z',
    });

    const rows = await db.listCaseCommunications('case-1', FIRM);
    expect(rows.map((r) => r.channel)).toEqual(['email', 'call']);
  });
});

describe('scoping', () => {
  it('refuses to log against another firm"s case', async () => {
    const db = seed();
    const out = await db.addCaseCommunication({ ...base, lawFirmId: OTHER_FIRM });
    expect(out).toBeNull();
  });

  it('reads as empty for another firm rather than revealing the case', async () => {
    // Empty, not an error: a 403 would confirm the case exists.
    const db = seed();
    await db.addCaseCommunication(base);
    expect(await db.listCaseCommunications('case-1', OTHER_FIRM)).toEqual([]);
  });
});
