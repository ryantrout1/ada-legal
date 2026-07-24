/**
 * Admin dashboard counts — every tile's predicate is pinned here.
 *
 * WHY THIS FILE EXISTS. The M6 dashboard was built new rather than
 * ported, and four of its six counts measured something different from
 * the Base44 admin Gina uses daily. The loudest was Sessions: ours read
 * `count(*) FROM ada_sessions` and rendered 303 where production showed
 * 25, because Playwright personas run against this database constantly
 * and nothing excluded them. Nobody noticed for a milestone, because a
 * number that is merely wrong still looks like a number.
 *
 * The invariant these tests protect: A TILE'S COUNT MUST EQUAL THE ROWS
 * ON THE PAGE THE TILE LINKS TO, and no session count may include test
 * traffic.
 *
 * These are source-text assertions against the SQL, in the same style as
 * the other admin guards in this directory. That is deliberate: the
 * failure mode is someone rewriting the query and dropping a WHERE
 * clause, which a behavioural test against a fixture would not catch
 * unless the fixture happened to contain a test session, an inactive
 * firm and a draft listing all at once.
 *
 * Ref: /plan admin dashboard parity, Phase 1.
 */

import { describe, it, expect } from 'vitest';
import { readCode } from '../support/sourceText.js';

const ENDPOINT = 'api/admin/dashboard.ts';
const code = readCode(ENDPOINT);

/** Collapse whitespace so assertions survive query re-indentation. */
const sql = code.replace(/\s+/g, ' ');

describe('admin dashboard — session counts exclude test traffic', () => {
  it('counts sessions over a 30-day window, not all time', () => {
    expect(sql, 'the sessions tile lost its 30-day window').toMatch(
      /FROM ada_sessions WHERE is_test = false AND created_at > now\(\) - interval '30 days'/,
    );
  });

  it('never counts sessions without an is_test filter', () => {
    // Any subquery reading ada_sessions must constrain is_test. This is
    // the assertion that would have caught 303.
    const sessionSubqueries = sql.match(/\(SELECT count\(\*\)::int FROM ada_sessions[^)]*\)/g) ?? [];
    expect(sessionSubqueries.length, 'no ada_sessions counts found — guard is stale').toBeGreaterThan(0);
    for (const q of sessionSubqueries) {
      expect(q, `session count with no is_test filter: ${q}`).toContain('is_test = false');
    }
  });
});

describe('admin dashboard — each tile matches the page it links to', () => {
  it('counts intakes by session_type, not by completed_at', () => {
    // /api/admin/intakes lists class_action_intake sessions. Counting
    // "any session with completed_at set" made the tile disagree with
    // the page it opens.
    expect(sql).toMatch(/session_type = 'class_action_intake'/);
    expect(sql, 'intakes reverted to the completed_at proxy').not.toMatch(
      /AS intakes[\s\S]{0,10}completed_at/,
    );
  });

  it('counts only active firms', () => {
    expect(sql).toMatch(/FROM law_firms WHERE status = 'active'/);
  });

  it('counts only approved attorneys', () => {
    expect(sql).toMatch(/FROM attorneys WHERE status = 'approved'/);
  });

  it('counts only published listings', () => {
    expect(sql).toMatch(/FROM listings WHERE status = 'published'/);
  });

  it('counts only active litigation', () => {
    expect(sql).toMatch(/FROM litigation_listings WHERE status = 'active'/);
  });
});

describe('admin dashboard — response shape', () => {
  it('declares every count the query selects', () => {
    for (const key of [
      'sessions',
      'intakes',
      'cases_unplaced',
      'firms',
      'attorneys',
      'feedback_new',
      'listings_published',
      'litigation_active',
    ]) {
      expect(code, `${key} missing from the declared row type`).toContain(`${key}:`);
      expect(sql, `${key} missing from the SELECT`).toContain(`AS ${key}`);
    }
  });

  it('still requires an admin before reading anything', () => {
    expect(code).toMatch(/await requireAdmin\(req, res\)/);
  });
});
