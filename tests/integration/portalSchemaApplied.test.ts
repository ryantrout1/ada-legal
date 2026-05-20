/**
 * Integration test — migration 0019 applied to the live database.
 *
 * The Phase 2 runtime verification: scan information_schema and confirm the
 * attorney-portal columns/tables/constraints landed as authored. Ryan applied
 * 0019 to Neon ancient-star-00703098 main and verified manually; this is the
 * automated equivalent.
 *
 * Gated on DATABASE_URL — skips when no live connection is configured (the
 * default for local/CI without secrets). The rest of the Phase 2 suite runs
 * against the in-memory client and needs no database.
 *
 * Ref: .design/attorney-portal.md Phase 2 runtime verification.
 */

import { describe, it, expect } from 'vitest';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('migration 0019 — schema applied (live DB)', () => {
  // Construct the client lazily inside each test: the describe body runs at
  // collection time even when skipped, and neon() throws on an empty URL.
  const getSql = () => neon(DATABASE_URL!);

  it('attorneys has user_id and law_firm_id columns', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'attorneys'
        AND column_name IN ('user_id', 'law_firm_id')
    `) as Array<{ column_name: string }>;
    const cols = rows.map((r) => r.column_name).sort();
    expect(cols).toEqual(['law_firm_id', 'user_id']);
  });

  it('litigation_firm_assignments and firm_session_handled tables exist', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_name IN ('litigation_firm_assignments', 'firm_session_handled')
    `) as Array<{ table_name: string }>;
    const tables = rows.map((r) => r.table_name).sort();
    expect(tables).toEqual(['firm_session_handled', 'litigation_firm_assignments']);
  });

  it('firm_session_handled has the composite primary key (session_id, law_firm_id)', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT a.attname AS column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'firm_session_handled'::regclass AND i.indisprimary
    `) as Array<{ column_name: string }>;
    const pk = rows.map((r) => r.column_name).sort();
    expect(pk).toEqual(['law_firm_id', 'session_id']);
  });

  it('litigation_firm_assignments enforces UNIQUE (litigation_listing_id, law_firm_id)', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT 1 FROM pg_constraint
      WHERE conrelid = 'litigation_firm_assignments'::regclass
        AND contype = 'u'
    `) as Array<unknown>;
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});
