/**
 * Tests for the attorney hard-delete contract.
 *
 * Two-stage attorney removal:
 *   1. Archive (existing — DELETE /api/admin/attorneys/[id], no query
 *      param). Soft, reversible. Sets status='archived'.
 *   2. Hard delete (new — DELETE /api/admin/attorneys/[id]?hard=true).
 *      Permanent. Writes an audit_log row, then deletes the attorney.
 *      Server-side gate: target MUST be already-archived; otherwise the
 *      DB method returns null and the endpoint surfaces 400. This
 *      prevents skipping the archive step via curl/automation/UI bug.
 *
 * litigation_listings.lead_attorney_id is ON DELETE SET NULL at the
 * schema level (migration 0009). These tests cover the contract; the
 * SET NULL cascade is a schema property, exercised in the Neon
 * integration test (not here).
 *
 * Ref: /plan ADALL Admin: Archive → Delete, Phase 1.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type {
  AttorneyAdminRow,
  CreateAttorneyInput,
} from '@/engine/clients/types';

const ORG_ID = '00000000-0000-4000-8000-000000000001';

function makeCreate(overrides: Partial<CreateAttorneyInput> = {}): CreateAttorneyInput {
  return {
    orgId: ORG_ID,
    name: 'Test Attorney',
    firmName: 'Test Firm LLC',
    locationCity: 'Phoenix',
    locationState: 'AZ',
    practiceAreas: ['accessibility'],
    additionalStates: [],
    specialtyTags: [],
    email: 'test@example.com',
    phone: null,
    websiteUrl: null,
    bio: null,
    photoUrl: null,
    status: 'approved',
    ...overrides,
  };
}

async function seed(
  status: AttorneyAdminRow['status'],
): Promise<{ clients: ReturnType<typeof makeInMemoryClients>; attorneyId: string }> {
  const clients = makeInMemoryClients();
  const created = await clients.db.createAttorney(makeCreate({ status }));
  return { clients, attorneyId: created.id };
}

describe('hardDeleteAttorney', () => {
  it('deletes an archived attorney and returns true', async () => {
    const { clients, attorneyId } = await seed('archived');

    const deleted = await clients.db.hardDeleteAttorney(attorneyId, {
      actorEmail: 'admin@example.com',
      actorUserId: null,
    });

    expect(deleted).toBe(true);
    expect(await clients.db.getAttorneyById(attorneyId)).toBeNull();
  });

  it('refuses to delete an approved attorney (status gate)', async () => {
    const { clients, attorneyId } = await seed('approved');

    const deleted = await clients.db.hardDeleteAttorney(attorneyId, {
      actorEmail: 'admin@example.com',
      actorUserId: null,
    });

    expect(deleted).toBe(false);
    // Row still present.
    expect(await clients.db.getAttorneyById(attorneyId)).not.toBeNull();
  });

  it('refuses to delete a pending attorney (status gate)', async () => {
    const { clients, attorneyId } = await seed('pending');

    const deleted = await clients.db.hardDeleteAttorney(attorneyId, {
      actorEmail: 'admin@example.com',
      actorUserId: null,
    });

    expect(deleted).toBe(false);
    expect(await clients.db.getAttorneyById(attorneyId)).not.toBeNull();
  });

  it('refuses to delete a rejected attorney (status gate)', async () => {
    const { clients, attorneyId } = await seed('rejected');

    const deleted = await clients.db.hardDeleteAttorney(attorneyId, {
      actorEmail: 'admin@example.com',
      actorUserId: null,
    });

    expect(deleted).toBe(false);
    expect(await clients.db.getAttorneyById(attorneyId)).not.toBeNull();
  });

  it('returns false for an unknown id', async () => {
    const clients = makeInMemoryClients();
    const deleted = await clients.db.hardDeleteAttorney(
      '99999999-9999-4999-8999-999999999999',
      { actorEmail: 'admin@example.com', actorUserId: null },
    );
    expect(deleted).toBe(false);
  });

  it('writes an audit_log row capturing the before-state', async () => {
    const { clients, attorneyId } = await seed('archived');
    // Snapshot what the row looked like before delete — used to verify
    // the audit metadata.before payload below.
    const before = await clients.db.getAttorneyById(attorneyId);
    expect(before).not.toBeNull();

    await clients.db.hardDeleteAttorney(attorneyId, {
      actorEmail: 'admin@example.com',
      actorUserId: 'user_123',
    });

    // The in-memory client exposes its audit log buffer for testing.
    // Real Neon client writes to the audit_log table inside a tx.
    const entries = clients.db.__testAuditLog ?? [];
    const entry = entries.find(
      (e) =>
        e.action === 'attorney.hard_delete' && e.resourceId === attorneyId,
    );
    expect(entry).toBeDefined();
    expect(entry?.actorType).toBe('staff');
    expect(entry?.actorId).toBe('user_123');
    expect(entry?.resourceType).toBe('attorney');
    expect(entry?.metadata.before).toBeDefined();
    // Spot-check key fields — exact snapshot equality would be brittle.
    const beforeMeta = entry?.metadata.before as { name: string; firm_name: string | null; status: string };
    expect(beforeMeta.name).toBe(before?.name);
    expect(beforeMeta.firm_name).toBe(before?.firmName);
    expect(beforeMeta.status).toBe('archived');
    expect(entry?.metadata.actor_email).toBe('admin@example.com');
  });

  it('does NOT write an audit row when status gate rejects the delete', async () => {
    const { clients, attorneyId } = await seed('approved');

    await clients.db.hardDeleteAttorney(attorneyId, {
      actorEmail: 'admin@example.com',
      actorUserId: null,
    });

    const entries = clients.db.__testAuditLog ?? [];
    const entry = entries.find(
      (e) => e.resourceId === attorneyId && e.action === 'attorney.hard_delete',
    );
    expect(entry).toBeUndefined();
  });

  it('handles a null actor_user_id (bridge auth path with email only)', async () => {
    const { clients, attorneyId } = await seed('archived');

    const deleted = await clients.db.hardDeleteAttorney(attorneyId, {
      actorEmail: 'admin@example.com',
      actorUserId: null,
    });

    expect(deleted).toBe(true);
    const entries = clients.db.__testAuditLog ?? [];
    const entry = entries.find(
      (e) => e.resourceId === attorneyId && e.action === 'attorney.hard_delete',
    );
    expect(entry?.actorId).toBeNull();
    expect(entry?.metadata.actor_email).toBe('admin@example.com');
  });
});
