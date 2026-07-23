/**
 * One-shot import of the Base44 AnalyticsEvent history into Neon (M5).
 *
 * Source: content-migration/b44-data-snapshot/AnalyticsEvent.json — 1,647
 * records captured at M0, spanning 2026-02-25 to 2026-07-22.
 *
 * TWO THINGS THIS DOES THAT A NAIVE COPY WOULD NOT:
 *
 * 1. Tags internal traffic. 515 of the 1,647 rows were created by the
 *    founders and a test account while building the site, and Base44's
 *    own `is_sample` flag is false on every single one. Imported flat,
 *    every future traffic figure is inflated by about 31%. The authors
 *    are known, so `is_internal` is derived from `created_by` here — the
 *    only place it can be set, since the public endpoint deliberately
 *    ignores any client-supplied value.
 *
 * 2. Preserves original timestamps in `occurred_at`. Without this, five
 *    months of activity collapses onto the import date and the history
 *    is worthless for anything but a total count.
 *
 * Every row is tagged `imported_from_b44`, so the whole import reverses
 * with a single DELETE.
 *
 * Idempotent: refuses to run twice by checking for existing imported
 * rows first, rather than creating duplicates on a re-run.
 *
 * Usage: DATABASE_URL=... node scripts/import-analytics-history.mjs [--dry-run]
 */

import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

const SNAPSHOT = 'content-migration/b44-data-snapshot/AnalyticsEvent.json';

/** Accounts belonging to the team, not to the public. */
const INTERNAL_AUTHORS = new Set([
  'rttg123@gmail.com',
  'gina@adalegallink.com',
  'ryan+lawyer@miloe.ai',
]);

const dryRun = process.argv.includes('--dry-run');
const url = process.env.DATABASE_URL;
if (!url && !dryRun) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const records = JSON.parse(readFileSync(SNAPSHOT, 'utf8'));

const rows = records.map((r) => ({
  event_name: String(r.event_name ?? '').slice(0, 120) || 'unknown',
  page: r.page ? String(r.page).slice(0, 200) : null,
  properties: r.properties && typeof r.properties === 'object' ? r.properties : {},
  session_id: r.session_id ? String(r.session_id).slice(0, 100) : null,
  is_internal: INTERNAL_AUTHORS.has(String(r.created_by ?? '')),
  occurred_at: r.timestamp ?? r.created_date ?? null,
}));

const internal = rows.filter((r) => r.is_internal).length;
console.log(`parsed ${rows.length} events — ${internal} internal, ${rows.length - internal} public`);

if (dryRun) {
  const byName = {};
  for (const r of rows) byName[r.event_name] = (byName[r.event_name] ?? 0) + 1;
  console.log('by event_name:', byName);
  process.exit(0);
}

const sql = neon(url);

const [{ n }] = await sql`SELECT count(*)::int AS n FROM analytics_events WHERE imported_from_b44 = true`;
if (n > 0) {
  console.error(`refusing to run: ${n} imported rows already present.`);
  console.error('To re-import: DELETE FROM analytics_events WHERE imported_from_b44 = true;');
  process.exit(1);
}

const BATCH = 200;
let written = 0;
for (let i = 0; i < rows.length; i += BATCH) {
  const chunk = rows.slice(i, i + BATCH);
  await sql.transaction(
    chunk.map(
      (r) => sql`
        INSERT INTO analytics_events
          (event_name, page, properties, session_id, is_internal, imported_from_b44, occurred_at)
        VALUES (
          ${r.event_name}, ${r.page}, ${JSON.stringify(r.properties)}::jsonb,
          ${r.session_id}, ${r.is_internal}, true,
          ${r.occurred_at ? new Date(r.occurred_at).toISOString() : new Date().toISOString()}
        )`,
    ),
  );
  written += chunk.length;
  console.log(`  ${written}/${rows.length}`);
}

console.log(`done — ${written} events imported`);
