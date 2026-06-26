/**
 * Layer 1 tests — case tasks (Phase 4b).
 *
 * Firm-scoped + consent-gated CRUD over case_tasks (add / list / complete) and
 * the cross-matter open-task list, plus the pure due-date bucketing the Tasks
 * screen uses. A task is open while completed_at is null.
 */

import { describe, it, expect } from 'vitest';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import type { AdaSessionState } from '@/engine/types';
import { bucketForDueDate } from '@/engine/cases/taskBuckets';

const ORG = 'org-1';
const field = (v: unknown) => ({ value: v, confidence: 0.9, extracted_at: '2026-01-01T00:00:00.000Z' });

function sess(id: string, claimant: string): AdaSessionState {
  return {
    sessionId: id, orgId: ORG, sessionType: 'public_ada', status: 'completed',
    litigationListingId: null, extractedFields: { claimant_name: field(claimant) },
    classification: null, metadata: {}, accessibilitySettings: {}, isTest: true,
  } as unknown as AdaSessionState;
}

async function seedCase(
  db: InMemoryDbClient,
  opts: { sid: string; firmId: string; consent?: boolean; claimant?: string },
) {
  await db.writeLawFirm({
    id: opts.firmId, orgId: ORG, name: `Firm ${opts.firmId}`, primaryContact: null,
    email: null, phone: null, stripeCustomerId: null, status: 'active', isPilot: true,
  });
  await db.writeSession({ state: sess(opts.sid, opts.claimant ?? 'Claimant') });
  const { caseRow } = await db.createCase({
    orgId: ORG, adaSessionId: opts.sid, litigationListingId: null, lane: 'routed_firm',
    firmId: opts.firmId, classificationTitle: 'III', classificationStandard: null,
    matchConfidence: null, jurisdictionState: 'AZ', routedAt: null, firstContactDue: null,
    routingReason: 'test',
  });
  if (opts.consent) await db.recordCaseConsent({ sessionId: opts.sid, scope: 'matched_firm' });
  return caseRow;
}

describe('case task CRUD', () => {
  it('adds, lists, and completes a task on a firm-owned consented case', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, { sid: 's1', firmId: 'firm-1', consent: true });

    const t = await db.addTaskForCase({ caseId: c.id, lawFirmId: 'firm-1', title: 'Call claimant', dueDate: '2026-07-01', priority: 'high' });
    expect(t).not.toBeNull();
    expect(t!.title).toBe('Call claimant');
    expect(t!.dueDate).toBe('2026-07-01');
    expect(t!.priority).toBe('high');
    expect(t!.completedAt).toBeNull();

    const list = await db.listTasksForCase(c.id, 'firm-1');
    expect(list!.map((x) => x.id)).toContain(t!.id);

    expect(await db.completeTaskForCase({ taskId: t!.id, lawFirmId: 'firm-1' })).toBe(true);
    const done = (await db.listTasksForCase(c.id, 'firm-1'))!.find((x) => x.id === t!.id)!;
    expect(done.completedAt).not.toBeNull();
  });

  it('defaults priority to medium', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, { sid: 's1', firmId: 'firm-1', consent: true });
    const t = await db.addTaskForCase({ caseId: c.id, lawFirmId: 'firm-1', title: 'No-priority task' });
    expect(t!.priority).toBe('medium');
  });

  it('is firm-scoped: another firm cannot add, list, or complete', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, { sid: 's1', firmId: 'firm-1', consent: true });
    const t = await db.addTaskForCase({ caseId: c.id, lawFirmId: 'firm-1', title: 'T' });

    expect(await db.addTaskForCase({ caseId: c.id, lawFirmId: 'firm-2', title: 'X' })).toBeNull();
    expect(await db.listTasksForCase(c.id, 'firm-2')).toBeNull();
    expect(await db.completeTaskForCase({ taskId: t!.id, lawFirmId: 'firm-2' })).toBe(false);
  });

  it('is consent-gated: no consent means no task access', async () => {
    const db = new InMemoryDbClient();
    const c = await seedCase(db, { sid: 's1', firmId: 'firm-1', consent: false });
    expect(await db.addTaskForCase({ caseId: c.id, lawFirmId: 'firm-1', title: 'X' })).toBeNull();
    expect(await db.listTasksForCase(c.id, 'firm-1')).toBeNull();
  });
});

describe('listOpenTasksForFirm', () => {
  it('returns open tasks across the firm consented cases with case context, excluding completed', async () => {
    const db = new InMemoryDbClient();
    const c1 = await seedCase(db, { sid: 's1', firmId: 'firm-1', consent: true, claimant: 'Jane Doe' });
    const c2 = await seedCase(db, { sid: 's2', firmId: 'firm-1', consent: true, claimant: 'Bob Lee' });
    const open1 = await db.addTaskForCase({ caseId: c1.id, lawFirmId: 'firm-1', title: 'Open A', dueDate: '2026-07-02' });
    const done = await db.addTaskForCase({ caseId: c2.id, lawFirmId: 'firm-1', title: 'Done B' });
    await db.completeTaskForCase({ taskId: done!.id, lawFirmId: 'firm-1' });

    const open = await db.listOpenTasksForFirm('firm-1');
    expect(open.map((t) => t.id)).toEqual([open1!.id]);
    expect(open[0]!.caseNumber).toBe(c1.caseNumber);
    expect(open[0]!.claimantName).toBe('Jane Doe');
  });

  it('excludes tasks from unconsented cases and other firms', async () => {
    const db = new InMemoryDbClient();
    const unconsented = await seedCase(db, { sid: 's1', firmId: 'firm-1', consent: false });
    await db.addTaskForCase({ caseId: unconsented.id, lawFirmId: 'firm-1', title: 'Hidden' }); // null (gated)
    const other = await seedCase(db, { sid: 's2', firmId: 'firm-2', consent: true });
    await db.addTaskForCase({ caseId: other.id, lawFirmId: 'firm-2', title: 'Other firm' });

    expect(await db.listOpenTasksForFirm('firm-1')).toEqual([]);
  });
});

describe('bucketForDueDate', () => {
  const today = '2026-06-25';
  it('buckets by due date relative to today', () => {
    expect(bucketForDueDate('2026-06-24', today)).toBe('overdue');
    expect(bucketForDueDate('2026-06-25', today)).toBe('today');
    expect(bucketForDueDate('2026-06-28', today)).toBe('this_week');
    expect(bucketForDueDate('2026-07-02', today)).toBe('this_week'); // +7
    expect(bucketForDueDate('2026-07-03', today)).toBe('later'); // +8
  });
  it('treats a task with no due date as later', () => {
    expect(bucketForDueDate(null, today)).toBe('later');
  });
});
