/**
 * Spot sessions list — what it derives and what it must not expose.
 *
 * `delivery` is computed in SQL because no single stored column is honest
 * about it. A session reaching `delivered` means a reviewer approved the
 * report; `spot_report.sent_at` means the mail left. Reading either alone
 * produces a list that says reports were delivered when nobody received
 * them — the failure this whole surface was built to expose, reintroduced
 * one layer up.
 *
 * The precedence in that CASE is load-bearing and easy to "tidy" into
 * something wrong:
 *
 *   sent      first, so a delivered report never reads as anything else.
 *   no_email  before the report states, because an address that does not
 *             exist outranks a report that does — the report cannot go
 *             anywhere no matter what the reviewer did.
 *
 * Ref: /plan Spot admin, Phase 2.
 */

import { describe, it, expect } from 'vitest';
import { readCode } from '../support/sourceText.js';

const ENDPOINT = readCode('api/admin/spot/sessions.ts');
const sql = ENDPOINT.replace(/\s+/g, ' ');

describe('spot sessions — delivery is derived, not assumed', () => {
  it('treats sent_at as the proof the mail left', () => {
    expect(sql).toMatch(/WHEN r\.sent_at IS NOT NULL\s*THEN 'sent'/);
  });

  it('checks sent before anything else', () => {
    const sent = sql.indexOf("THEN 'sent'");
    const others = ["THEN 'no_email'", "THEN 'unsent'", "THEN 'in_review'"];
    for (const other of others) {
      expect(sent, `'sent' must be evaluated before ${other}`).toBeLessThan(sql.indexOf(other));
    }
  });

  it('ranks a missing address above the report state', () => {
    // A released report with no address is not "released, not emailed" —
    // it is unfulfillable, and calling it unsent invites a pointless retry.
    expect(sql.indexOf("THEN 'no_email'")).toBeLessThan(sql.indexOf("THEN 'unsent'"));
  });

  it('never reads delivery from the session status', () => {
    expect(sql, "session.status = 'delivered' is a review decision, not a delivery").not.toMatch(
      /s\.status = 'delivered'/,
    );
  });
});

describe('spot sessions — scope and exposure', () => {
  it('requires an admin', () => {
    expect(ENDPOINT).toMatch(/await requireAdmin\(req, res\)/);
  });

  it('does not select photos or report bodies', () => {
    // Photo retention belongs to the 90-day sweep. This is a list of
    // purchases, not a second door to the images.
    expect(ENDPOINT).not.toContain('blob_url');
    expect(ENDPOINT).not.toContain('blob_key');
    expect(sql).not.toMatch(/r\.content/);
  });

  it('selects the buyer name so the list says who each purchase is', () => {
    // The email was already here; the name is the other half of the same
    // question. Phase 3 of /plan capture the buyer's name.
    expect(sql).toMatch(/s\.buyer_name/);
  });

  it('validates the status filter against the real status set', () => {
    // Interpolating an arbitrary query string into SQL is the obvious
    // wrong version of this.
    expect(ENDPOINT).toContain('SPOT_SESSION_STATUSES');
    expect(ENDPOINT).toMatch(/STATUSES\.has\(raw\)/);
  });

  it('bounds the result set', () => {
    expect(ENDPOINT).toMatch(/LIMIT \$\{MAX_ROWS\}/);
  });

  it('is never cached', () => {
    expect(ENDPOINT).toMatch(/Cache-Control['"],\s*['"]no-store/);
  });
});

describe('spot admin page — reachable and legible', () => {
  const NAV = readCode('src/app/layouts/AdminLayout.tsx');
  const PAGE = readCode('src/app/routes/admin/AdminSpot.tsx');

  it('has a nav entry', () => {
    // The funnel existed on the dashboard for one commit and was hard to
    // find, which is the whole reason this page exists.
    expect(NAV).toContain("{ to: '/admin/spot', label: 'Spot' }");
  });

  it('links through to report review inside the admin branch', () => {
    // /spot-review used to be a standalone route outside ClerkProvider,
    // which is scoped to /admin/*. Nothing refreshed Clerk's short-lived
    // session cookie there, so every admin call 401'd a minute after
    // sign-in. Linking the bare path would send an admin back to that.
    expect(PAGE).toContain('/admin/spot-review');
  });

  it('only links the readout for released reports', () => {
    // The public readout 404s for pending_review by design. Linking it on
    // an unreleased row sent the admin to "Report not available", which
    // looks like a broken report rather than an unapproved one.
    expect(PAGE).toMatch(/const RELEASED = new Set<SessionRow\['delivery'\]>\(\['sent', 'unsent'\]\)/);
    expect(PAGE).toMatch(/s\.report_slug && RELEASED\.has\(s\.delivery\)/);
  });

  it('shows an amount only when money was captured', () => {
    // amount_cents is set at checkout creation, so a pending_payment row
    // carries $99.00 with nothing collected. Showing it made the table
    // disagree with the gross total above it.
    expect(PAGE).toMatch(/function money\(cents: number \| null, paidAt: string \| null\)/);
    expect(PAGE).toMatch(/if \(!paidAt\) return '—';/);
  });

  it('never uses colour as the only signal', () => {
    // The two attention states are worded, not just tinted.
    expect(PAGE).toContain("no_email: 'No email on file'");
    expect(PAGE).toContain("unsent: 'Released, not emailed'");
  });
});

/**
 * Free reads and deletion.
 *
 * A free read is a different record from a paid session — no buyer, no
 * payment, no report, and no stored photo, because the free path is transient
 * by design. What it keeps is the ANALYSIS, which is the reason to keep it at
 * all: it is what Spot told someone who never paid, and the only evidence of
 * how the free tier performs.
 *
 * Deletion is the part with a trap. The FK cascade drops spot_photo rows, but
 * Blob storage knows nothing about Postgres and the retention sweep only walks
 * rows — so deleting a row without its blob leaves a file that nothing will
 * ever collect. Blobs go first, and a failure leaves the row in place so a
 * retry can finish.
 */
describe('free reads', () => {
  const STORE = readCode('src/lib/spot/spotStore.ts');
  const READS = readCode('api/admin/spot/reads.ts');
  const SESSIONS = readCode('api/admin/spot/sessions.ts');
  const PAGE = readCode('src/app/routes/admin/AdminSpot.tsx');

  it('reads the analysis, not just the attempt', () => {
    expect(STORE).toContain('findingCount');
    expect(STORE).toContain('overallRisk');
  });

  it('deletes blobs before rows', () => {
    // The order is the whole point: row-first orphans the file forever.
    const fn = STORE.slice(STORE.indexOf('async deleteFreeRead'));
    const body = fn.slice(0, fn.indexOf('async deletePaidSession'));
    expect(body.indexOf('deleteBlobs')).toBeLessThan(body.indexOf('db.delete('));
  });

  it('leaves the row when a blob refuses to delete', () => {
    const fn = STORE.slice(STORE.indexOf('async deleteFreeRead'));
    const body = fn.slice(0, fn.indexOf('async deletePaidSession'));
    expect(body).toMatch(/if \(!\(await deleteBlobs[\s\S]*?return false;/);
  });

  it('treats an already-missing blob as success so a retry can finish', () => {
    expect(STORE).toMatch(/not found\|404/);
  });

  it('exposes delete on both records', () => {
    expect(READS).toContain("req.method === 'DELETE'");
    expect(SESSIONS).toContain("req.method === 'DELETE'");
  });

  it('confirms before a hard delete', () => {
    // Paid data with no undo.
    expect(PAGE).toMatch(/window\.confirm/);
    expect(PAGE).toMatch(/cannot be undone/i);
  });

  it('says the photo is kept for reads since retention was turned on', () => {
    // Was "the photo is not — the free path stores no image", true until free
    // reads began retaining their photo. The copy — and this assertion —
    // follow the behaviour.
    expect(PAGE).toMatch(/the photo too, for\s+90 days/i);
  });
});
