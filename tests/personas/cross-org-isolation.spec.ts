/**
 * Persona #17 — Cross-org isolation
 * Step 28, Commit 7.
 *
 * Tags: @harness-b @cross-cutting @security @tenancy
 *
 * Security regression: a listing that belongs to a DIFFERENT
 * organization must not surface in the discovery index (public
 * listings API, class-actions directory, Ada's discovery logic)
 * for a user scoped to this org.
 *
 * Today the platform runs a single pilot org ('adall'). The
 * v_active_listings view enforces org scope at the query level —
 * every public endpoint reads the listings through the adall org
 * automatically. If a second org onboards and its listings leak
 * into the adall discovery index, that's a data-leakage bug with
 * serious implications.
 *
 * Why this persona exists BEFORE there's a second org:
 *   1. The bug surface we're guarding against is in the view
 *      definition + the endpoint's org scoping. Those surfaces
 *      exist today even though there's no data to exercise them.
 *   2. When a second org onboards, this persona should ACTIVATE
 *      on first run — not be written-and-forgotten.
 *   3. The pre-flight skip path gives operators a clear signal
 *      of what state the test is in.
 *
 * Ideal behavior (when multiple orgs exist):
 *   Each org has a public listings endpoint scoped to its own
 *   active listings. A user hitting adall's /api/public/listings
 *   must not see listings owned by any other org.
 *
 *   Exercising this without admin access requires knowing a
 *   listing slug owned by a DIFFERENT org. The persona takes an
 *   OTHER_ORG_LISTING_SLUG env var — when set, the persona
 *   attempts to GET /api/public/listings and GET
 *   /api/public/listings/<that-slug>, and asserts both produce
 *   NOT-FOUND or the other-org listing is absent from the list.
 *
 * Pass criteria (when applicable):
 *   1. OTHER_ORG_LISTING_SLUG env var set to a known cross-org slug
 *   2. /api/public/listings does not include that slug
 *   3. /api/public/listings/<that-slug> returns 404
 *   4. /class-actions/<that-slug> page does not render listing
 *      details (either a 404 or a not-found message)
 *
 * Pre-flight skip: if OTHER_ORG_LISTING_SLUG is not set, persona
 * skips with a message explaining what to set to activate.
 */

import { test, throwIfAssertionsFailed } from './harness/personaHarness.js';

test.describe.configure({ mode: 'serial' });

test(
  'cross-org-isolation',
  {
    tag: ['@harness-b', '@cross-cutting', '@security', '@tenancy'],
  },
  async ({ page, recorder }) => {
    test.skip(
      process.env.PLAYWRIGHT_TARGET !== 'preview' &&
        process.env.PLAYWRIGHT_TARGET !== 'prod',
      'Persona tests require PLAYWRIGHT_TARGET=preview or prod.',
    );

    const otherSlug = process.env.OTHER_ORG_LISTING_SLUG;
    if (!otherSlug) {
      recorder.step('skipping-no-other-org-slug', {
        hint: 'Set OTHER_ORG_LISTING_SLUG to a listing slug owned by ' +
          'a different org to exercise cross-org isolation.',
      });
      test.skip(
        true,
        'OTHER_ORG_LISTING_SLUG not set. When a second org onboards, ' +
          'set this env var to that org\'s listing slug to activate ' +
          'this persona.',
      );
      return;
    }

    page.on('pageerror', (err) => {
      recorder.step('console-error', { message: err.message });
    });

    // ── API check 1: /api/public/listings must not include that slug ─
    const listResp = await page.request.get('/api/public/listings');
    recorder.step('fetched-public-listings', { status: listResp.status() });
    if (!listResp.ok()) {
      throw new Error(
        `GET /api/public/listings returned ${listResp.status()}`,
      );
    }
    const listBody = (await listResp.json()) as {
      listings: Array<{ slug: string }>;
    };
    const slugs = (listBody.listings ?? []).map((l) => l.slug);
    recorder.assertion(
      'other-org-slug-absent-from-list',
      !slugs.includes(otherSlug),
      slugs.includes(otherSlug)
        ? `LEAK: ${otherSlug} present in adall's public listings`
        : 'clean',
    );

    // ── API check 2: direct detail fetch must 404 ───────────────────
    const detailResp = await page.request.get(
      `/api/public/listings/${otherSlug}`,
    );
    recorder.step('fetched-detail', { status: detailResp.status() });
    recorder.assertion(
      'other-org-slug-detail-not-found',
      detailResp.status() === 404,
      `GET /api/public/listings/${otherSlug} returned ${detailResp.status()} ` +
        `(expected 404)`,
    );

    // ── UI check: /class-actions/<that-slug> shows not-found ────────
    await page.goto(`/class-actions/${otherSlug}`);
    recorder.navigate(`/class-actions/${otherSlug}`);

    // Look for a not-found indicator. The route should either 404 or
    // render a "not found" message. A real listing detail would show
    // the CTA button and title heading; the absence of those in favor
    // of an error state is the right signal.
    const notFoundIndicator = page.getByText(
      /not found|can't find|could not find|no longer available/i,
    );
    const ctaButton = page.getByRole('button', {
      name: /Talk to Ada about this/i,
    });

    // Race: either a not-found message or a CTA button appears.
    // If the CTA appears, the listing leaked.
    await Promise.race([
      notFoundIndicator
        .waitFor({ state: 'visible', timeout: 10_000 })
        .catch(() => {}),
      ctaButton
        .waitFor({ state: 'visible', timeout: 10_000 })
        .catch(() => {}),
    ]);

    const ctaVisible = await ctaButton.isVisible().catch(() => false);
    recorder.assertion(
      'other-org-detail-page-does-not-render-cta',
      !ctaVisible,
      ctaVisible
        ? 'LEAK: detail page rendered CTA for cross-org listing'
        : 'clean',
    );

    const errors = recorder.trace.events.filter(
      (e) => e.kind === 'error' || e.name === 'console-error',
    );
    recorder.assertion(
      'no-console-errors',
      errors.length === 0,
      errors.length > 0 ? `${errors.length} errors` : 'clean',
    );

    throwIfAssertionsFailed(recorder);
  },
);
