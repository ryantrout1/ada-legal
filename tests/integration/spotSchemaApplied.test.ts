/**
 * Integration test — migration 0036 (Ada Spot foundations) applied to the
 * live database.
 *
 * Scans information_schema / pg_catalog and confirms the five spot_* tables,
 * their columns, the status / hitl / outcome / one-parent constraints, and the
 * 90-day retention default landed as authored — plus the FIREWALL: that the
 * migration left photo_analyses and photo_reviews (the test bench) untouched.
 *
 * Applied to Neon ancient-star-00703098 main and verified during /shipit; this
 * is the automated equivalent (same pattern as casesSchemaApplied.test.ts).
 *
 * Gated on DATABASE_URL — skips when no live connection is configured (the
 * default for local/CI without secrets).
 *
 * Ref: /plan Phase 0 (Ada Spot foundations & schema).
 */

import { describe, it, expect } from 'vitest';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('migration 0036 — Ada Spot schema applied (live DB)', () => {
  const getSql = () => neon(DATABASE_URL!);

  it('the five spot_* tables exist', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'spot_%'
    `) as Array<{ table_name: string }>;
    expect(rows.map((r) => r.table_name).sort()).toEqual([
      'spot_photo',
      'spot_rate_limit',
      'spot_read',
      'spot_report',
      'spot_session',
    ]);
  });

  it('spot_session has the payment / lifecycle / timestamp columns', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'spot_session'
    `) as Array<{ column_name: string }>;
    const cols = new Set(rows.map((r) => r.column_name));
    for (const c of [
      'status',
      'stripe_checkout_session_id',
      'stripe_payment_intent_id',
      'buyer_email',
      'amount_cents',
      'photo_count',
      'paid_at',
      'uploaded_at',
      'delivered_at',
      'refunded_at',
    ]) {
      expect(cols.has(c)).toBe(true);
    }
  });

  it('the status / hitl / outcome CHECK constraints exist as authored', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE contype = 'c'
        AND conrelid IN (
          'spot_session'::regclass, 'spot_report'::regclass, 'spot_rate_limit'::regclass
        )
    `) as Array<{ conname: string; def: string }>;
    const byName = Object.fromEntries(rows.map((r) => [r.conname, r.def]));
    expect(byName['spot_session_status_check']).toContain('pending_payment');
    expect(byName['spot_session_status_check']).toContain('refunded');
    expect(byName['spot_report_hitl_status_check']).toContain('pending_review');
    expect(byName['spot_rate_limit_outcome_check']).toContain('soft_gated');
  });

  it('spot_photo enforces exactly-one-parent (XOR) and a 90-day retention default', async () => {
    const sql = getSql();
    const checks = (await sql`
      SELECT pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conname = 'spot_photo_one_parent' AND conrelid = 'spot_photo'::regclass
    `) as Array<{ def: string }>;
    expect(checks).toHaveLength(1);
    expect(checks[0].def).toContain('<>'); // session xor read

    const def = (await sql`
      SELECT column_default FROM information_schema.columns
      WHERE table_name = 'spot_photo' AND column_name = 'delete_after'
    `) as Array<{ column_default: string }>;
    expect(def[0].column_default).toContain("90 days");
  });

  it('the partial sweep index exists (delete_after WHERE deleted_at IS NULL)', async () => {
    const sql = getSql();
    const rows = (await sql`
      SELECT indexdef FROM pg_indexes
      WHERE tablename = 'spot_photo' AND indexname = 'spot_photo_sweep'
    `) as Array<{ indexdef: string }>;
    expect(rows).toHaveLength(1);
    expect(rows[0].indexdef).toContain('deleted_at IS NULL');
  });

  it('FIREWALL — the test bench is untouched: photo_analyses / photo_reviews column-sets unchanged', async () => {
    const sql = getSql();
    const analyses = (await sql`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'photo_analyses'
    `) as Array<{ column_name: string }>;
    expect(analyses.map((r) => r.column_name).sort()).toEqual(
      [
        'analyzed_at',
        'case_id',
        'created_at',
        'findings',
        'id',
        'model_version',
        'org_id',
        'overall_risk',
        'photo_blob_key',
        'photo_url',
        'positive_findings',
        'scene',
        'session_id',
        'source',
        'summary',
        'tester_comment',
      ].sort(),
    );

    const reviews = (await sql`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'photo_reviews'
    `) as Array<{ column_name: string }>;
    expect(reviews.map((r) => r.column_name).sort()).toEqual(
      [
        'created_at',
        'finding_labels',
        'id',
        'missed_findings',
        'model_version',
        'overall_verdict',
        'photo_analysis_id',
        'reviewed_at',
        'reviewer',
        'reviewer_email',
        'reviewer_notes',
        'status',
        'updated_at',
      ].sort(),
    );
  });
});
