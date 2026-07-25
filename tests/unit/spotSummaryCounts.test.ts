/**
 * Spot funnel counts — the two definitions that look wrong and aren't.
 *
 * WHY THIS FILE EXISTS. The admin dashboard already shipped one round of
 * counts that were each defensible in isolation and wrong as a set: sessions
 * counted all time including test traffic, intakes counted a different thing
 * from the page they linked to. The fix was predicates, and the guard that
 * keeps them is adminDashboardCounts. This is the same guard for Spot, and
 * Spot has two predicates that a reasonable person would "simplify" straight
 * back into a lie.
 *
 *   paid      must read paid_at IS NOT NULL, NOT status <> 'pending_payment'.
 *             Status carries forward into refunded, so counting by status
 *             leaves refunds sitting in the paid column — revenue that came
 *             back out reported as revenue that came in.
 *
 *   delivered must read spot_report.sent_at IS NOT NULL, NOT session.status
 *             = 'delivered'. Those are different by design: a session reaches
 *             `delivered` when the REVIEWER DECIDES, and sent_at is set only
 *             when mail actually leaves. Counting session status would report
 *             reports as delivered that nobody has received — which is
 *             precisely the failure this screen was built to surface. When it
 *             was first run by hand it found four reports in pending_review:
 *             every report ever generated, none delivered.
 *
 * Ref: /plan Spot admin, Phase 1.
 */

import { describe, it, expect } from 'vitest';
import { readCode } from '../support/sourceText.js';

const ENDPOINT = readCode('api/admin/spot/summary.ts');
const sql = ENDPOINT.replace(/\s+/g, ' ');

describe('spot summary — paid means money captured', () => {
  it('counts paid by paid_at, not by status', () => {
    expect(sql).toMatch(/FROM spot_session WHERE paid_at IS NOT NULL\)\s*AS paid/);
  });

  it('never defines paid as "not pending_payment"', () => {
    // The tempting simplification. It silently includes refunds.
    expect(sql, 'paid must not be derived from status').not.toMatch(
      /status <> 'pending_payment'\)\s*AS paid/,
    );
  });

  it('counts refunds separately rather than folding them in', () => {
    expect(sql).toMatch(/status = 'refunded'\)\s*AS refunded/);
  });

  it('sums revenue only over captured payments', () => {
    expect(sql).toMatch(/sum\(amount_cents\)[\s\S]{0,80}WHERE paid_at IS NOT NULL/);
  });
});

describe('spot summary — delivered means the mail left', () => {
  it('counts delivered from spot_report.sent_at', () => {
    expect(sql).toMatch(/FROM spot_report WHERE sent_at IS NOT NULL\)\s*AS delivered/);
  });

  it('never counts delivered from session status', () => {
    // session.status = 'delivered' is the review DECISION, not delivery.
    expect(sql, 'delivered must not be read from the session').not.toMatch(
      /spot_session[^)]*status = 'delivered'/,
    );
  });

  it('surfaces released-but-unsent as its own number', () => {
    expect(sql).toMatch(/hitl_status = 'released' AND sent_at IS NULL\)\s*AS released_unsent/);
  });
});

describe('spot summary — the unfulfillable purchases are counted', () => {
  it('counts paid sessions with no buyer email', () => {
    // Two of these already exist. A purchase with no address is a support
    // problem that no retry will fix, so it needs its own number.
    expect(sql).toMatch(/paid_at IS NOT NULL AND buyer_email IS NULL\)\s*AS paid_no_email/);
  });

  it('counts reports still awaiting review', () => {
    expect(sql).toMatch(/hitl_status = 'pending_review'\)\s*AS awaiting_review/);
  });
});

describe('spot summary — scope and exposure', () => {
  it('requires an admin', () => {
    expect(ENDPOINT).toMatch(/await requireAdmin\(req, res\)/);
  });

  it('returns counts only — no photos, no report content', () => {
    // Photo retention is the 90-day sweep's job. This must not become a
    // second route to the images or to report bodies.
    expect(ENDPOINT).not.toContain('blob_url');
    expect(ENDPOINT).not.toContain('blobUrl');
    expect(sql).not.toMatch(/SELECT[^;]*\bcontent\b/);
  });

  it('is never cached', () => {
    expect(ENDPOINT).toMatch(/Cache-Control['"],\s*['"]no-store/);
  });
});
