/**
 * Integration test — migrations 0023 + 0024 applied to the live database.
 *
 * The Phase 0 runtime verification: scan information_schema / pg_catalog and
 * confirm the cases-foundation tables, columns, constraints, and the
 * litigation 'mass' kind landed as authored. Applied to Neon
 * ancient-star-00703098 main and verified during /shipit; this is the
 * automated equivalent (the same pattern as portalSchemaApplied.test.ts).
 *
 * Gated on DATABASE_URL — skips when no live connection is configured (the
 * default for local/CI without secrets).
 *
 * Ref: /plan Phase 0 (Lawyer Workspace foundations).
 */

import { describe, it, expect } from 'vitest';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('migrations 0023 + 0024 — schema applied (live DB)', () => {
  const getSql = () => neon(DATABASE_URL!);

  it('the six cases-foundation tables exist', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_name IN ('cases', 'contacts', 'case_people', 'case_activity', 'case_documents', 'case_tasks')
    `) as Array<{ table_name: string }>;
    const tables = rows.map((r) => r.table_name).sort();
    expect(tables).toEqual([
      'case_activity',
      'case_documents',
      'case_people',
      'case_tasks',
      'cases',
      'contacts',
    ]);
  });

  it('cases has the routing / consent / SLA / resolution columns', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'cases'
        AND column_name IN (
          'lane', 'status', 'case_number', 'consent_to_share', 'consent_at',
          'first_contact_due', 'declined_at', 'reclaimed_at', 'resolution_type', 'litigation_listing_id'
        )
    `) as Array<{ column_name: string }>;
    expect(rows.length).toBe(10);
  });

  it('consent_to_share defaults to false', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT column_default FROM information_schema.columns
      WHERE table_name = 'cases' AND column_name = 'consent_to_share'
    `) as Array<{ column_default: string }>;
    expect(rows[0].column_default).toMatch(/false/);
  });

  it('attorneys has the capacity / routing-throttle columns', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'attorneys'
        AND column_name IN ('accepting_referrals', 'routing_paused', 'max_active_cases')
    `) as Array<{ column_name: string }>;
    const cols = rows.map((r) => r.column_name).sort();
    expect(cols).toEqual(['accepting_referrals', 'max_active_cases', 'routing_paused']);
  });

  it('case children cascade-delete from cases (ON DELETE CASCADE)', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT tc.constraint_name, rc.delete_rule
      FROM information_schema.referential_constraints rc
      JOIN information_schema.table_constraints tc ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = rc.unique_constraint_name
      WHERE tc.table_name IN ('case_activity', 'case_documents', 'case_people', 'case_tasks')
        AND ccu.table_name = 'cases'
    `) as Array<{ delete_rule: string }>;
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows.every((r) => r.delete_rule === 'CASCADE')).toBe(true);
  });

  it("litigation_listings.kind CHECK accepts 'mass'", async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conname = 'litigation_listings_kind_check'
    `) as Array<{ def: string }>;
    expect(rows[0].def).toContain("'mass'");
  });
});
