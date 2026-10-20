/**
 * Civil rights complaint page: admin list, CSV export, delete, retention.
 *
 * Encodes /plan "State civil rights complaint page" Phase 4 (AC9 + retention):
 * admins get a list and a CSV; non-admins get nothing; formula cells are
 * neutralized; every export is audited first (no audit, no export);
 * submissions older than 24 months are pruned.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  csvCell,
  toCsv,
  exportWithAudit,
  listView,
  CSV_COLUMNS,
  RETENTION_MONTHS,
  type AdminSubmission,
} from '../../src/lib/civilRights/adminCore.js';

const requireAdmin = vi.fn();
const list = vi.fn();
const remove = vi.fn();
const auditLog = vi.fn();
const makeStore = vi.fn(() => ({ list, get: vi.fn(), remove, pruneExpired: vi.fn() }));

vi.mock('../../api/_admin.js', () => ({ requireAdmin: (...a: unknown[]) => requireAdmin(...a) }));
vi.mock('../../src/lib/civilRights/store.js', () => ({ makeCivilRightsAdminStore: () => makeStore() }));
vi.mock('../../api/_shared.js', () => ({ makeClientsFromEnv: () => ({ audit: { log: auditLog } }) }));

const { default: listHandler } = await import('../../api/admin/civil-rights/index.js');
const { default: idHandler } = await import('../../api/admin/civil-rights/[id].js');

function row(over: Partial<AdminSubmission> = {}): AdminSubmission {
  return {
    id: '3f1c2b8e-5d4a-4c7b-9a1e-2b3c4d5e6f70',
    createdAt: '2026-10-19T20:00:00.000Z',
    stateCode: 'az',
    formVersion: '2024',
    area: 'public_accommodation',
    basis: 'disability',
    complainantName: 'Jordan Rivera',
    email: 'jordan@example.com',
    phone: '602-555-0142',
    address1: '100 W Main St',
    address2: null,
    city: 'Mesa',
    state: 'AZ',
    zip: '85201',
    altContactName: null,
    altContactPhone: null,
    respondentName: 'Desert Grill',
    respondentCompany: null,
    respondentAddress1: null,
    respondentAddress2: null,
    respondentCity: 'Mesa',
    respondentState: 'AZ',
    respondentZip: null,
    whatHappened: 'Three steps, no ramp, "no way in".',
    witnesses: null,
    firstIncidentDate: null,
    lastIncidentDate: '2026-09-14',
    ongoing: 'yes',
    hasAttorney: 'no',
    attorneyNameAddress: null,
    legalActionPending: 'no',
    otherAgencies: null,
    additionalComments: null,
    summaryText: 'x',
    copyVersion: 'draft',
    utmSource: 'facebook',
    utmMedium: null,
    utmCampaign: null,
    consents: [
      { kind: 'updates', granted: true, wording: 'w1', wordingVersion: 'v', recordedAt: 't' },
      { kind: 'contact', granted: false, wording: 'w2', wordingVersion: 'v', recordedAt: 't' },
    ],
    ...over,
  };
}

function makeRes() {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(k: string, v: string) {
      res.headers[k.toLowerCase()] = v;
    },
    getHeader(k: string) {
      return res.headers[k.toLowerCase()];
    },
    status(c: number) {
      res.statusCode = c;
      return res;
    },
    json(b: unknown) {
      res.body = b;
      return res;
    },
    send(b: unknown) {
      res.body = b;
      return res;
    },
    end() {
      return res;
    },
  };
  return res;
}

const req = (over: Partial<VercelRequest> = {}) =>
  ({ method: 'GET', query: {}, headers: {}, ...over }) as VercelRequest;

beforeEach(() => {
  requireAdmin.mockReset();
  list.mockReset();
  remove.mockReset();
  auditLog.mockReset();
  makeStore.mockClear();
});

describe('CSV', () => {
  it('neutralizes cells a spreadsheet would run as a formula', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+1 602')).toBe("'+1 602");
    expect(csvCell('-5')).toBe("'-5");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvCell('\tx')).toBe("'\tx");
  });

  it('quotes commas, quotes and line breaks', () => {
    expect(csvCell('a, b')).toBe('"a, b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('line1\nline2')).toBe('"line1\nline2"');
    expect(csvCell(null)).toBe('');
  });

  it('has a BOM, a header and one line per row, with both consents', () => {
    const csv = toCsv([row()]);
    expect(csv.startsWith('﻿submitted_at,id,state,')).toBe(true);
    const lines = csv.trim().split('\r\n');
    expect(lines).toHaveLength(2);
    const header = lines[0].replace('﻿', '').split(',');
    expect(header).toContain('consent_updates');
    expect(header).toContain('consent_contact');
    expect(header).toHaveLength(CSV_COLUMNS.length);
    expect(lines[1]).toContain(',yes,no,facebook,');
  });

  it('list view marks admin-preview rows', () => {
    expect(listView(row({ utmSource: 'admin-preview' })).preview).toBe(true);
    expect(listView(row()).consentUpdates).toBe('yes');
  });
});

describe('exportWithAudit', () => {
  it('audits before building the file', async () => {
    const calls: string[] = [];
    const csv = await exportWithAudit([row(), row()], async (n) => {
      calls.push(`audit:${n}`);
    });
    expect(calls).toEqual(['audit:2']);
    expect(csv).toContain('Jordan Rivera');
  });

  it('no audit, no export', async () => {
    await expect(
      exportWithAudit([row()], async () => {
        throw new Error('audit down');
      }),
    ).rejects.toThrow('audit down');
  });
});

describe('/api/admin/civil-rights (AC9)', () => {
  it('a non-admin gets 401 and no data is read', async () => {
    requireAdmin.mockImplementation(async (_q: unknown, res: ReturnType<typeof makeRes>) => {
      res.status(401).json({ error: 'Unauthorized' });
      return null;
    });
    const res = makeRes();
    await listHandler(req(), res as unknown as VercelResponse);
    expect(res.statusCode).toBe(401);
    expect(makeStore).not.toHaveBeenCalled();

    const res2 = makeRes();
    await idHandler(req({ method: 'DELETE', query: { id: row().id } }), res2 as unknown as VercelResponse);
    expect(res2.statusCode).toBe(401);
    expect(remove).not.toHaveBeenCalled();
  });

  it('an admin gets the list', async () => {
    requireAdmin.mockResolvedValue({ userId: 'user_1', email: 'a@b.c', via: 'clerk' });
    list.mockResolvedValue([row()]);
    const res = makeRes();
    await listHandler(req(), res as unknown as VercelResponse);
    expect(res.statusCode).toBe(200);
    expect((res.body as { rows: unknown[] }).rows).toHaveLength(1);
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('CSV export writes an audit row, then sends the file', async () => {
    requireAdmin.mockResolvedValue({ userId: 'user_1', email: 'a@b.c', via: 'clerk' });
    list.mockResolvedValue([row()]);
    auditLog.mockResolvedValue(undefined);
    const res = makeRes();
    await listHandler(req({ query: { format: 'csv' } }), res as unknown as VercelResponse);
    expect(res.statusCode).toBe(200);
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'civil_rights.export', metadata: expect.objectContaining({ count: 1 }) }),
    );
    expect(res.headers['content-type']).toContain('text/csv');
    expect(String(res.body)).toContain('Jordan Rivera');
  });

  it('CSV export fails closed when the audit write fails', async () => {
    requireAdmin.mockResolvedValue({ userId: 'user_1', email: 'a@b.c', via: 'clerk' });
    list.mockResolvedValue([row()]);
    auditLog.mockRejectedValue(new Error('audit down'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = makeRes();
    await listHandler(req({ query: { format: 'csv' } }), res as unknown as VercelResponse);
    spy.mockRestore();
    expect(res.statusCode).toBe(500);
    expect(String(JSON.stringify(res.body))).not.toContain('Jordan');
  });

  it('delete is audited', async () => {
    requireAdmin.mockResolvedValue({ userId: 'user_1', email: 'a@b.c', via: 'clerk' });
    remove.mockResolvedValue(true);
    const res = makeRes();
    await idHandler(req({ method: 'DELETE', query: { id: row().id } }), res as unknown as VercelResponse);
    expect(res.statusCode).toBe(200);
    expect(auditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'civil_rights.delete' }));
  });
});

describe('retention', () => {
  it('is 24 months, pruned daily by a CRON_SECRET-gated cron', () => {
    expect(RETENTION_MONTHS).toBe(24);
    const store = readFileSync('src/lib/civilRights/store.ts', 'utf8');
    expect(store).toContain('make_interval(months => ${RETENTION_MONTHS})');
    const cron = readFileSync('api/cron/prune-civil-rights.ts', 'utf8');
    expect(cron).toMatch(/if \(!secret \|\| authHeader !== `Bearer \$\{secret\}`\)/);
    const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as { crons: { path: string }[] };
    expect(vercel.crons.map((c) => c.path)).toContain('/api/cron/prune-civil-rights');
  });

  it('deleting a submission deletes its consents', () => {
    const sql = readFileSync('src/db/migrations/0050_civil_rights_submissions.sql', 'utf8');
    expect(sql).toContain('REFERENCES civil_rights_submissions(id) ON DELETE CASCADE');
  });
});
