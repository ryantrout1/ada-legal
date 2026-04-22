/**
 * Tests for the session_packages DbClient methods.
 *
 * These run against InMemoryDbClient (the seam). NeonDbClient has its
 * own Drizzle + Postgres implementation that mirrors the same interface;
 * when we touch those methods again we rely on this test suite to catch
 * regressions at the interface level.
 *
 * Ref: Step 18, Commit 4.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';

const SESSION_A = '00000000-0000-4000-8000-000000000aaa';
const SESSION_B = '00000000-0000-4000-8000-000000000bbb';

describe('DbClient.writeSessionPackage / readSessionPackageBySlug', () => {
  it('round-trips a package through slug lookup', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeSessionPackage({
      slug: 's-abcdefghjkmn',
      sessionId: SESSION_A,
      payload: { hello: 'world', slug: 's-abcdefghjkmn' },
      classificationTitle: 'III',
      generatedAt: '2026-04-22T12:00:00.000Z',
      expiresAt: null,
    });

    const read = await clients.db.readSessionPackageBySlug('s-abcdefghjkmn');
    expect(read).not.toBeNull();
    expect(read!.slug).toBe('s-abcdefghjkmn');
    expect(read!.sessionId).toBe(SESSION_A);
    expect(read!.classificationTitle).toBe('III');
    expect(read!.expiresAt).toBeNull();
    expect(read!.payload).toEqual({ hello: 'world', slug: 's-abcdefghjkmn' });
  });

  it('returns null for unknown slugs', async () => {
    const clients = makeInMemoryClients();
    expect(await clients.db.readSessionPackageBySlug('s-doesnotexist')).toBeNull();
  });

  it('returns null for expired packages', async () => {
    const clients = makeInMemoryClients();
    // expired an hour ago
    const pastIso = new Date(Date.now() - 3_600_000).toISOString();
    await clients.db.writeSessionPackage({
      slug: 's-expiredpkg01',
      sessionId: SESSION_A,
      payload: {},
      classificationTitle: null,
      generatedAt: pastIso,
      expiresAt: pastIso,
    });
    expect(await clients.db.readSessionPackageBySlug('s-expiredpkg01')).toBeNull();
  });

  it('does NOT expire packages without an expiry', async () => {
    const clients = makeInMemoryClients();
    const pastIso = new Date(Date.now() - 1_000_000_000).toISOString();
    await clients.db.writeSessionPackage({
      slug: 's-permanentpk',
      sessionId: SESSION_A,
      payload: { note: 'retain forever' },
      classificationTitle: 'III',
      generatedAt: pastIso,
      expiresAt: null,
    });
    const read = await clients.db.readSessionPackageBySlug('s-permanentpk');
    expect(read).not.toBeNull();
  });
});

describe('DbClient.readLatestSessionPackageForSession', () => {
  it('returns null when the session has no packages', async () => {
    const clients = makeInMemoryClients();
    expect(
      await clients.db.readLatestSessionPackageForSession(SESSION_A),
    ).toBeNull();
  });

  it('returns the only package when one exists', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeSessionPackage({
      slug: 's-onlyone0123',
      sessionId: SESSION_A,
      payload: {},
      classificationTitle: 'III',
      generatedAt: '2026-04-22T12:00:00.000Z',
      expiresAt: null,
    });
    const r = await clients.db.readLatestSessionPackageForSession(SESSION_A);
    expect(r?.slug).toBe('s-onlyone0123');
  });

  it('returns the most recent when multiple exist for the same session', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeSessionPackage({
      slug: 's-older0000001',
      sessionId: SESSION_A,
      payload: {},
      classificationTitle: 'III',
      generatedAt: '2026-04-22T10:00:00.000Z',
      expiresAt: null,
    });
    await clients.db.writeSessionPackage({
      slug: 's-newer0000001',
      sessionId: SESSION_A,
      payload: {},
      classificationTitle: 'III',
      generatedAt: '2026-04-22T14:00:00.000Z',
      expiresAt: null,
    });
    const r = await clients.db.readLatestSessionPackageForSession(SESSION_A);
    expect(r?.slug).toBe('s-newer0000001');
  });

  it('does not confuse packages across sessions', async () => {
    const clients = makeInMemoryClients();
    await clients.db.writeSessionPackage({
      slug: 's-session1pkg',
      sessionId: SESSION_A,
      payload: {},
      classificationTitle: 'III',
      generatedAt: '2026-04-22T10:00:00.000Z',
      expiresAt: null,
    });
    await clients.db.writeSessionPackage({
      slug: 's-session2pkg',
      sessionId: SESSION_B,
      payload: {},
      classificationTitle: 'I',
      generatedAt: '2026-04-22T14:00:00.000Z',
      expiresAt: null,
    });
    const a = await clients.db.readLatestSessionPackageForSession(SESSION_A);
    const b = await clients.db.readLatestSessionPackageForSession(SESSION_B);
    expect(a?.slug).toBe('s-session1pkg');
    expect(b?.slug).toBe('s-session2pkg');
  });
});
