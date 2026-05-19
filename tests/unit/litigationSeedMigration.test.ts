/**
 * Phase A2 — seed migration contract test.
 *
 * The seed migration (0011_seed_class_actions.sql) ships 38 rows into
 * `litigation_listings` plus a session repoint and a placeholder delete.
 * It runs against real Neon at /shipit time, not in CI — so this test
 * is a *static* contract test on the SQL file itself. It parses the
 * VALUES tuples and asserts:
 *
 *   - 38 rows total
 *   - kind/status distribution per the /plan Phase A2 spec
 *   - Niles row (slug=niles-v-hilton-bed-heights) has the correct
 *     identity fields
 *   - The rideshare pattern_of_practice slug is present (so it can
 *     serve as the session repoint target)
 *   - Smith v. Acme placeholder deletion is in the script
 *   - The 4-session repoint UPDATE is in the script
 *
 * This guards against regressions in the migration content itself.
 * Runtime verification (counting rows in Neon, joining ada_sessions →
 * litigation_listings) is done as part of the /shipit Phase A2
 * acceptance recipe — not here.
 *
 * Ref: /plan Phase A2.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATION_PATH = join(
  process.cwd(),
  'src/db/migrations/0011_seed_class_actions.sql',
);

const sql = readFileSync(MIGRATION_PATH, 'utf8');

/**
 * Parse the INSERT VALUES block. Each tuple in the spec has 12 columns:
 *   org_id, kind, status, slug, case_name, legal_theory,
 *   court, docket_number, filing_date, defendants, affected_states,
 *   short_description
 *
 * Rather than write a full SQL parser, we extract the slug + kind +
 * status from each tuple using a narrow regex against the
 * (v_org_id, 'kind', 'status', 'slug', ...) opener. The migration is
 * the source of truth for our own code; if someone rewrites the SQL in
 * a way that breaks this regex, that's the signal to update the test
 * alongside the migration.
 */
interface ParsedRow {
  kind: string;
  status: string;
  slug: string;
}

function parseRows(): ParsedRow[] {
  const rows: ParsedRow[] = [];
  // (v_org_id, 'kind', 'status', 'slug',
  const re = /\(v_org_id,\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    rows.push({ kind: m[1], status: m[2], slug: m[3] });
  }
  return rows;
}

describe('Phase A2 — seed_class_actions migration', () => {
  const rows = parseRows();

  it('inserts exactly 38 rows', () => {
    expect(rows).toHaveLength(38);
  });

  it('has the expected kind/status distribution', () => {
    // Group by kind+status
    const counts = new Map<string, number>();
    for (const r of rows) {
      const key = `${r.kind}:${r.status}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    // Per /plan A2 spec:
    //   10 active class/enforcement_action (kind=class:active + kind=enforcement_action:active)
    //   12 compliance (kind=class:compliance + kind=consent_decree:compliance + kind=enforcement_action:compliance)
    //    4 enforcement_action:investigating
    //   10 pattern_of_practice:active
    //    2 regulatory_challenge:tracking

    const activeClass = counts.get('class:active') ?? 0;
    const activeEnforcement = counts.get('enforcement_action:active') ?? 0;
    expect(activeClass + activeEnforcement).toBe(10);

    const complianceClass = counts.get('class:compliance') ?? 0;
    const complianceConsent = counts.get('consent_decree:compliance') ?? 0;
    const complianceEnforce = counts.get('enforcement_action:compliance') ?? 0;
    expect(complianceClass + complianceConsent + complianceEnforce).toBe(12);

    expect(counts.get('enforcement_action:investigating') ?? 0).toBe(4);
    expect(counts.get('pattern_of_practice:active') ?? 0).toBe(10);
    expect(counts.get('regulatory_challenge:tracking') ?? 0).toBe(2);
  });

  it('uses only valid v2 kind values', () => {
    const validKinds = new Set([
      'class',
      'enforcement_action',
      'consent_decree',
      'pattern_of_practice',
      'regulatory_challenge',
    ]);
    for (const r of rows) {
      expect(validKinds.has(r.kind), `unexpected kind: ${r.kind} on ${r.slug}`).toBe(true);
    }
  });

  it('uses only valid v2 status values', () => {
    const validStatuses = new Set([
      'draft',
      'active',
      'investigating',
      'compliance',
      'tracking',
      'closed',
      'archived',
    ]);
    for (const r of rows) {
      expect(
        validStatuses.has(r.status),
        `unexpected status: ${r.status} on ${r.slug}`,
      ).toBe(true);
    }
  });

  it('has no duplicate slugs', () => {
    const slugs = rows.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('includes the Niles v. Hilton row with the documented docket', () => {
    expect(rows.some((r) => r.slug === 'niles-v-hilton-bed-heights')).toBe(true);
    // Identity assertion: case_name + court + docket appear in the file.
    expect(sql).toContain("'Niles v. Hilton Worldwide Holdings Inc.'");
    expect(sql).toContain("'U.S. District Court, Western District of Pennsylvania'");
    expect(sql).toContain("'2:26-cv-00258'");
    expect(sql).toContain("'2026-02-12'");
  });

  it('includes the rideshare pattern_of_practice row for session repoint', () => {
    const rideshare = rows.find(
      (r) => r.slug === 'rideshare-wheelchair-service-animal-denials',
    );
    expect(rideshare).toBeDefined();
    expect(rideshare!.kind).toBe('pattern_of_practice');
    expect(rideshare!.status).toBe('active');
  });

  it('deletes the Smith v. Acme placeholder row', () => {
    // The exact placeholder UUID from the /plan recon.
    expect(sql).toContain('dcc63051-bf4f-4134-8ce4-9e3e239e17f0');
    expect(sql).toMatch(
      /DELETE\s+FROM\s+litigation_listings\s+WHERE\s+id\s*=\s*v_smith_acme_id/i,
    );
  });

  it('repoints ada_sessions whose listing_id is the legacy rideshare', () => {
    // The legacy rideshare listing uuid from the recon.
    expect(sql).toContain('6d18c0c4-47a0-41cd-9d28-8fd6f20d19d7');
    expect(sql).toMatch(
      /UPDATE\s+ada_sessions[\s\S]*?SET\s+litigation_listing_id\s*=\s*v_rideshare_id[\s\S]*?WHERE\s+listing_id\s*=\s*v_legacy_rideshare/i,
    );
    // Idempotency guard: only repoints rows still NULL.
    expect(sql).toMatch(/litigation_listing_id\s+IS\s+NULL/i);
  });

  it('is wrapped in a transactional DO block scoped to the adall org', () => {
    expect(sql).toMatch(/DO\s+\$\$/);
    expect(sql).toContain("WHERE org_code = 'adall'");
    expect(sql).toMatch(/END\s+\$\$/);
  });

  it('is idempotent: INSERT uses ON CONFLICT DO NOTHING on (org_id, slug)', () => {
    expect(sql).toMatch(/ON\s+CONFLICT\s*\(org_id,\s*slug\)\s+DO\s+NOTHING/i);
  });
});
