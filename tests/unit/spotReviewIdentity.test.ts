/**
 * Who is this report for?
 *
 * /admin/spot-review is where a person decides to release someone's paid
 * report, and until now the row said: a model name, a status, a timestamp,
 * and eight characters of slug. Nothing about the buyer. `/admin/spot`
 * already answers this — it selects s.buyer_email and renders it with a "No
 * email on file" fallback — but the review queue, which is the screen where
 * the decision actually gets made, did not.
 *
 * The exposure half is copied from spotSessionsList.test.ts, which guards the
 * same question on the other admin list. A join written to fetch two columns
 * is one careless `select()` from dragging a hundred report bodies into a
 * hundred-row response.
 *
 * Encodes acceptance criteria 3 and 4 from /plan capture the buyer's name,
 * phase 2.
 */

import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readCode } from '../support/sourceText.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/** Just the listReports implementation, so assertions cannot match a
 *  neighbouring query that legitimately selects content. */
function listReportsBody(): string {
  const src = readCode(resolve(root, 'src/lib/spot/spotStore.ts'));
  const start = src.indexOf('async listReports(');
  expect(start, 'listReports not found in spotStore').toBeGreaterThan(-1);
  const next = src.indexOf('async ', start + 10);
  return src.slice(start, next === -1 ? undefined : next);
}

describe('listReports tells you whose report it is', () => {
  const body = listReportsBody();

  it('joins the session the report belongs to', () => {
    expect(body).toMatch(/[Jj]oin\(\s*spotSessions/);
  });

  it('selects the buyer', () => {
    expect(body).toMatch(/buyerName:\s*spotSessions\.buyerName/);
    expect(body).toMatch(/buyerEmail:\s*spotSessions\.buyerEmail/);
  });

  it('uses a left join, so a report with no session row still lists', () => {
    // An inner join would make a report vanish from the queue rather than
    // appear without a buyer — a report nobody can see is worse than one
    // nobody can attribute.
    expect(body).toMatch(/leftJoin/);
  });
});

describe('listReports still refuses to carry what it should not', () => {
  const body = listReportsBody();

  it('does not select report bodies', () => {
    // A hundred rows, each dragging a full report, on a page that renders
    // one at a time.
    expect(body).not.toMatch(/content:\s*spotReports\.content/);
  });

  it('does not select photos', () => {
    expect(body).not.toMatch(/spotPhotos/);
  });

  it('does not select payment identifiers', () => {
    expect(body).not.toMatch(/stripe/i);
    expect(body).not.toMatch(/amountCents/);
  });
});

describe('the review row renders the buyer', () => {
  // The row type moved to the hook both spot-review pages share; the
  // rendering stayed on the list.
  const hook = readCode(resolve(root, 'src/app/hooks/useAdminSpotReports.ts'));
  const src = readCode(resolve(root, 'src/app/routes/admin/AdminSpotReview.tsx'));

  it('carries the buyer on its row type', () => {
    expect(hook).toMatch(/buyerName:\s*string \| null/);
    expect(hook).toMatch(/buyerEmail:\s*string \| null/);
  });

  it('renders both', () => {
    expect(src).toMatch(/\.buyerName/);
    expect(src).toMatch(/\.buyerEmail/);
  });

  it('says so when there is no buyer on file', () => {
    // A blank space reads as "nobody looked". This state is also the signal
    // that the report can never be delivered, which is worth seeing before
    // pressing Release.
    expect(src).toMatch(/[Nn]o buyer on file/);
  });
});
