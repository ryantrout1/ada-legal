/**
 * Spot report delivery — the decision and the send are separate paths.
 *
 * THE BUG THIS PINS. `releaseReport` matches only `hitl_status =
 * 'pending_review'`, so a second release is a no-op. That is right: a review
 * decision must happen once. But release was also the ONLY send path, so a
 * report released with a failed or skipped email could never be sent again.
 * The review screen told the admin "retry release to resend" — and retrying
 * release returned `released: false` without reaching any send code. The
 * buyer had paid, the report existed, and the only route to them was
 * regenerating it.
 *
 * A decision is idempotent. A delivery is retryable. The invariant:
 *
 *   release  → transitions state, sends once, never re-sends
 *   resend   → transitions nothing, sends any number of times
 *
 * The second failure this pins is subtler. A missing address and a failed
 * send both ended as `released, sent_at = null` and both rendered "not
 * emailed", so the admin could not tell a transient problem from an
 * unrecoverable one. Worse, the missing-address branch logged nothing at
 * all — it was an `if` with no `else`. Both now carry a reason.
 *
 * Source-text assertions, in the style of the other guards here: the failure
 * mode is someone collapsing the two endpoints back together or dropping a
 * WHERE clause, which a behavioural test would only catch with a fixture
 * holding a released-but-unsent report and a null-email session at once.
 *
 * Ref: /triage Spot report delivery.
 */

import { describe, it, expect } from 'vitest';
import { readCode } from '../support/sourceText.js';

const RESEND = readCode('api/spot/admin/resend.ts');
const RELEASE = readCode('api/spot/admin/release.ts');
const STORE = readCode('src/lib/spot/spotStore.ts');
const REVIEW = readCode('src/app/routes/review/SpotReview.tsx');

describe('resend — delivery only, never a state transition', () => {
  it('exists as its own endpoint', () => {
    expect(RESEND).toContain('getReleasedReport');
    expect(RESEND).toContain('markReportSent');
  });

  it('does not transition the session', () => {
    // The session reached `delivered` when the decision was made. If resend
    // started moving state, sending twice would mean deciding twice.
    expect(RESEND, 'resend must not mark the session delivered').not.toContain('markDelivered');
    expect(RESEND, 'resend must not re-release').not.toContain('releaseReport');
  });

  it('reports the two outstanding-send cases distinctly', () => {
    expect(RESEND).toContain("reason: 'no_buyer_email'");
    expect(RESEND).toContain("reason: 'send_failed'");
  });

  it('logs the missing-address case instead of skipping silently', () => {
    // The original code was `if (buyerEmail) { …send… }` with no else: a
    // paid report with nowhere to go produced no log line anywhere.
    expect(RESEND).toMatch(/console\.error\([^)]*no buyer email/);
  });
});

describe('getReleasedReport — reads released reports, not pending ones', () => {
  it('filters on the released status', () => {
    // If this matched pending_review it would duplicate releaseReport and
    // could send a report nobody had approved.
    const fn = STORE.slice(STORE.indexOf('async getReleasedReport'));
    const body = fn.slice(0, fn.indexOf('async markReportSent'));
    expect(body).toContain("eq(spotReports.hitlStatus, 'released')");
  });

  it('returns the address and whether the mail ever left', () => {
    const fn = STORE.slice(STORE.indexOf('async getReleasedReport'));
    const body = fn.slice(0, fn.indexOf('async markReportSent'));
    expect(body).toContain('buyerEmail');
    expect(body).toContain('sentAt');
  });
});

describe('release — still decides once', () => {
  it('remains guarded to pending_review', () => {
    const fn = STORE.slice(STORE.indexOf('async releaseReport'));
    const body = fn.slice(0, fn.indexOf('async getReleasedReport'));
    expect(body).toContain("eq(spotReports.hitlStatus, 'pending_review')");
  });

  it('carries a reason when the send did not happen', () => {
    expect(RELEASE).toContain('reason');
    expect(RELEASE).toMatch(/console\.error\([^)]*no buyer email/);
  });
});

describe('review UI — does not send the admin down a dead end', () => {
  it('no longer tells anyone to retry release to resend', () => {
    // This instruction was the visible face of the bug: it named a
    // recovery path that could not work.
    expect(REVIEW).not.toMatch(/retry release to resend/i);
  });

  it('calls the resend endpoint', () => {
    expect(REVIEW).toContain('/api/spot/admin/resend');
  });

  it('says plainly when retrying cannot help', () => {
    expect(REVIEW).toMatch(/no email address on file/i);
  });
});
