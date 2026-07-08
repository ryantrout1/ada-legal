/**
 * Unit — NeonAuditClient.log writes an audit_log row instead of throwing.
 *
 * Regression: the client shipped as a stub that threw "not yet implemented
 * (Phase A Step 6)". Any unguarded caller (the consent endpoint, admin
 * place) 500'd, and consent even recorded-but-skipped-its-emails because the
 * throw fired before the notifications. This asserts log() maps the
 * AuditEntry onto the insert and does not throw.
 *
 * Ref: /triage — consent 500, NeonAuditClient.log unimplemented stub.
 */

import { describe, it, expect } from 'vitest';
import { NeonAuditClient } from '@/engine/clients/adaClients';
import type { Database } from '@/db/client';
import type { AuditEntry } from '@/engine/clients/types';

function fakeDb() {
  const inserted: unknown[] = [];
  const db = {
    insert: () => ({
      values: async (row: unknown) => {
        inserted.push(row);
      },
    }),
  } as unknown as Database;
  return { db, inserted };
}

const entry: AuditEntry = {
  orgId: 'org-1',
  actorType: 'system',
  actorId: null,
  action: 'case.consent',
  resourceType: 'case',
  resourceId: 'case-1',
  metadata: { scope: 'matched_firm', sessionId: 'sess-1' },
};

describe('NeonAuditClient.log', () => {
  it('writes the entry to audit_log without throwing', async () => {
    const { db, inserted } = fakeDb();
    const audit = new NeonAuditClient(db);

    await expect(audit.log(entry)).resolves.toBeUndefined();

    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      orgId: 'org-1',
      actorType: 'system',
      actorId: null,
      action: 'case.consent',
      resourceType: 'case',
      resourceId: 'case-1',
      metadata: { scope: 'matched_firm', sessionId: 'sess-1' },
    });
  });
});
