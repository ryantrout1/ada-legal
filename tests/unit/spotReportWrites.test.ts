/**
 * Spot report writes — replace on purpose, conflict by accident.
 *
 * THE BUG THIS PINS. Regenerate was written to insert a SECOND report per
 * session "so both outputs coexist for side-by-side comparison". Migration
 * 0039 then added a unique index on session_id — one report per session,
 * the invariant the inline/cron recovery path depends on. Neither change was
 * wrong; together they meant every regeneration on a session that already
 * had a report hit the unique violation and returned 500. Which is precisely
 * the set of sessions anyone would ever click Regenerate on. It stayed broken
 * because the button only fails for rows that have something to regenerate.
 *
 * THE ASYMMETRY THIS PROTECTS. Two write paths, opposite conflict handling,
 * both deliberate:
 *
 *   regenerate              a human asking for a rebuild. Replace in place.
 *   generateReportForSession  automatic, with two triggers (inline + cron
 *                           sweeper) that can race. A conflict here means
 *                           the report already exists and the second run
 *                           MUST NOT overwrite it. Plain insert, let it fail.
 *
 * Making them share one method would silently let the cron sweeper stomp a
 * report a reviewer had already released.
 *
 * WHAT REPLACE MUST NOT TOUCH. The slug is in a buyer's inbox, so it
 * survives. The review status survives too: a released report keeps serving
 * its live URL and starts showing the corrected content immediately, rather
 * than 404ing until someone re-releases it.
 *
 * Ref: /triage Spot regenerate.
 */

import { describe, it, expect } from 'vitest';
import { readCode } from '../support/sourceText.js';

const STORE = readCode('src/lib/spot/spotStore.ts');
const REGENERATE = readCode('api/spot/admin/regenerate.ts');
const PIPELINE = readCode('src/lib/spot/generateReportForSession.ts');

/** The body of a named store method, up to the next method. */
function method(name: string): string {
  const start = STORE.indexOf(`async ${name}(`);
  expect(start, `${name} not found in the store`).toBeGreaterThan(-1);
  const rest = STORE.slice(start + 1);
  const next = rest.indexOf('\n    async ');
  return next === -1 ? rest : rest.slice(0, next);
}

describe('upsertReport — replaces in place', () => {
  const body = method('upsertReport');

  it('resolves the conflict on session_id rather than throwing', () => {
    expect(body).toContain('onConflictDoUpdate');
    expect(body).toContain('target: spotReports.sessionId');
  });

  it('does not overwrite the slug', () => {
    // The URL is already in a buyer's inbox. A new slug breaks it silently.
    const set = body.slice(body.indexOf('set: {'));
    expect(set.slice(0, set.indexOf('}')), 'slug must survive a replace').not.toContain('slug');
  });

  it('does not reset the review status', () => {
    // Sending a released report back to pending would 404 the live link,
    // because the public readout serves released reports only.
    const set = body.slice(body.indexOf('set: {'));
    expect(set.slice(0, set.indexOf('}')), 'hitlStatus must survive a replace').not.toContain(
      'hitlStatus',
    );
  });

  it('returns the slug actually in effect', () => {
    expect(body).toContain('returning({ slug: spotReports.slug })');
  });
});

describe('regenerate — uses the replacing write', () => {
  it('no longer inserts a second report', () => {
    expect(REGENERATE).toContain('upsertReport');
    expect(REGENERATE, 'a plain insert here 500s on every real session').not.toContain(
      'insertReport',
    );
  });
});

describe('the pipeline — still refuses to overwrite', () => {
  it('uses the plain insert so a duplicate run fails', () => {
    // Inline trigger and cron sweeper can both fire. The unique index is
    // what stops the loser from replacing a report that may already be
    // released; an upsert here would let it.
    expect(PIPELINE).toContain('insertReport');
    expect(PIPELINE, 'the automatic path must not replace').not.toContain('upsertReport');
  });
});

describe('spot-review lives inside the Clerk branch', () => {
  const APP = readCode('src/app/App.tsx');
  const NAV = readCode('src/app/layouts/AdminLayout.tsx');

  it('is mounted as an admin route', () => {
    // ClerkProvider is scoped to /admin/* on purpose (custom frontend API
    // domain; a root provider would have broken public routes while DNS was
    // on Base44). An admin-gated page mounted outside it has no client to
    // refresh Clerk's short-lived session cookie, so it 401s permanently
    // about a minute after sign-in — which is exactly what happened.
    expect(APP).toContain('<Route path="spot-review" element={<SpotReview />} />');
  });

  it('keeps the old path working as a redirect', () => {
    expect(APP).toMatch(/path="\/spot-review" element=\{<Navigate to="\/admin\/spot-review"/);
  });

  it('is reachable from the admin nav', () => {
    expect(NAV).toContain("{ to: '/admin/spot-review', label: 'Spot Review' }");
  });
});
