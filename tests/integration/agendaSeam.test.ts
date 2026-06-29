/**
 * Integration test — the "Needs attention" data-plane seam (build-list #2).
 *
 * resolveAttorneyContext → getAgendaInputsForFirm → buildAgenda. Confirms a
 * matter's SOL date and open task surface as key dates with the client name
 * resolved (direct matter), a quiet matter surfaces as follow-up, a fresh one
 * does not, and another firm sees none of it. In-memory client; no live DB.
 *
 * Encodes /plan "Needs attention" acceptance criteria 4, 5, 7.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients, InMemoryDbClient } from '@/engine/clients/inMemoryClients';
import { buildAgenda } from '@/engine/cases/agenda';
import { resolveAttorneyContext } from '../../api/_attorney';
import { seedPortalFixture } from '../fixtures/portalSeed';

const TODAY = '2026-06-28';

function setActivityDate(db: InMemoryDbClient, caseId: string, iso: string) {
  for (const a of db.caseActivity) if (a.caseId === caseId) a.createdAt = iso;
}

describe('needs-attention seam (auth → inputs → buildAgenda)', () => {
  it('surfaces SOL + task as key dates and a quiet matter as follow-up, firm-scoped', async () => {
    const clients = makeInMemoryClients();
    await seedPortalFixture(clients);
    const mem = clients.db as InMemoryDbClient;

    const ctx = await resolveAttorneyContext(clients.db, 'clerk_user_a', null);
    const firm = await clients.db.readLawFirmById(ctx!.lawFirmId);

    // m1: active matter with a SOL date + an open task; fresh activity (not stale).
    const m1 = await clients.db.createDirectCase({
      orgId: firm!.orgId,
      firmId: ctx!.lawFirmId,
      assignedLawyerId: ctx!.attorneyId,
      createdBy: ctx!.userId,
      client: { name: 'Dottie Deadline' },
    });
    await clients.db.setCaseSolDate({ caseId: m1.id, lawFirmId: ctx!.lawFirmId, solDate: '2026-07-03' });
    await clients.db.addTaskForCase({
      caseId: m1.id,
      lawFirmId: ctx!.lawFirmId,
      title: 'File response',
      dueDate: '2026-06-30',
    });
    setActivityDate(mem, m1.id, `${TODAY}T12:00:00Z`);

    // m2: active matter gone quiet — last activity 20 days ago, nothing dated.
    const m2 = await clients.db.createDirectCase({
      orgId: firm!.orgId,
      firmId: ctx!.lawFirmId,
      assignedLawyerId: ctx!.attorneyId,
      createdBy: ctx!.userId,
      client: { name: 'Stan Stale' },
    });
    setActivityDate(mem, m2.id, '2026-06-08T12:00:00Z');

    const inputs = await clients.db.getAgendaInputsForFirm(ctx!.lawFirmId);
    const agenda = buildAgenda({ ...inputs, today: TODAY, staleDays: 14 });

    const sol = agenda.keyDates.find((k) => k.kind === 'sol' && k.caseId === m1.id);
    const taskItem = agenda.keyDates.find((k) => k.kind === 'task' && k.caseId === m1.id);
    expect(sol).toMatchObject({ dueDate: '2026-07-03', bucket: 'this_week', clientName: 'Dottie Deadline' });
    expect(taskItem).toMatchObject({ title: 'File response', bucket: 'this_week', clientName: 'Dottie Deadline' });
    expect(agenda.keyDates.some((k) => k.caseId === m2.id)).toBe(false);

    const stale = agenda.followUp.find((f) => f.caseId === m2.id);
    expect(stale).toMatchObject({ reason: 'no_activity', daysSinceActivity: 20, clientName: 'Stan Stale' });
    expect(agenda.followUp.some((f) => f.caseId === m1.id)).toBe(false);
  });

  it('AC7: another firm sees none of it', async () => {
    const clients = makeInMemoryClients();
    await seedPortalFixture(clients);
    const mem = clients.db as InMemoryDbClient;

    const ctxA = await resolveAttorneyContext(clients.db, 'clerk_user_a', null);
    const ctxB = await resolveAttorneyContext(clients.db, 'clerk_user_b', null);
    const firmA = await clients.db.readLawFirmById(ctxA!.lawFirmId);

    const m = await clients.db.createDirectCase({
      orgId: firmA!.orgId,
      firmId: ctxA!.lawFirmId,
      assignedLawyerId: ctxA!.attorneyId,
      createdBy: ctxA!.userId,
      client: { name: 'A Client' },
    });
    await clients.db.setCaseSolDate({ caseId: m.id, lawFirmId: ctxA!.lawFirmId, solDate: '2026-07-03' });
    setActivityDate(mem, m.id, `${TODAY}T12:00:00Z`);

    const inputsB = await clients.db.getAgendaInputsForFirm(ctxB!.lawFirmId);
    const agendaB = buildAgenda({ ...inputsB, today: TODAY, staleDays: 14 });
    expect(agendaB.keyDates).toHaveLength(0);
    expect(agendaB.followUp).toHaveLength(0);
  });
});
