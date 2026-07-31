/**
 * Saving a review and reading it back.
 *
 * This test could not be written honestly until today. `upsertPhotoReview`
 * was an empty method on the fake database, so a test could save a review,
 * assert the call resolved, pass, and prove nothing had been stored. The
 * whole photo-review surface — six endpoints, two pages, 57 analyses and 29
 * real reviews — had no test of any kind, and that was why.
 *
 * The property that matters most here is one row per analysis per reviewer.
 * Peter, Gina and Ryan review the same photo; the endpoint promises none of
 * them overwrites another, and the real table enforces it with a unique
 * index on (photo_analysis_id, reviewer). A fake that let a second save
 * clobber the first would make that promise untestable.
 *
 * Ref: /triage — the photo-review surface has no tests.
 */

import { describe, it, expect } from 'vitest';
import {
  InMemoryDbClient,
  makeInMemoryClients,
} from '@/engine/clients/inMemoryClients';
import { createSession } from '@/engine/session/sessionRepo';
import type { PhotoFinding } from '@/types/db';

// No cast. A cast in a test is how you get one that compiles and lies —
// the first draft of this file asserted against a shape PhotoFinding does
// not have, passed at runtime, and only the typecheck caught it.
const FINDINGS: PhotoFinding[] = [
  {
    title_standard: 'No van-accessible space marked',
    finding_standard: 'The accessible space has no adjacent access aisle marked for a van.',
    severity: 'major',
    standard: '2010 ADA Standards 502.2',
    confidence: 0.9,
    confirmable: true,
  },
];

/**
 * Analyses on this surface always belong to a field-test session — that is
 * the scope both photo-review reads enforce. This fixture used to seed an
 * analysis against a session id that was never written, which passed only
 * while `getPhotoAnalysisForReview` looked the analysis up by id alone.
 * Closing that (Phase 1) made the omission visible.
 */
async function seedSession(db: InMemoryDbClient, sessionId: string) {
  const state = createSession(makeInMemoryClients(), {
    orgId: '00000000-0000-4000-8000-000000000001',
    sessionType: 'public_ada',
    anonSessionId: '00000000-0000-4000-8000-000000000abc',
    userId: null,
    isTest: true,
  });
  // createSession mints its own id; these tests name theirs.
  await db.writeSession({ state: { ...state, sessionId } });
}

async function seedAnalysis(db: InMemoryDbClient, sessionId = 'sess-1') {
  await seedSession(db, sessionId);
  return db.savePhotoAnalysis({
    sessionId,
    orgId: 'org-1',
    photoUrl: 'https://blob/lot.jpg',
    photoBlobKey: 'photos/lot.jpg',
    findings: FINDINGS,
    scene: { standard: 'A parking lot with one marked accessible space.' },
    summary: { standard: 'One concern found.' },
    overallRisk: 'medium',
    positiveFindings: { standard: [] },
    modelVersion: 'opus-5',
  });
}

describe('a review survives being saved', () => {
  it('comes back on the analysis it was written against', async () => {
    const db = new InMemoryDbClient();
    const id = await seedAnalysis(db);

    await db.upsertPhotoReview({
      photoAnalysisId: id,
      reviewer: 'Peter',
      overallVerdict: 'over_flagged',
      findingLabels: [{ finding_index: 0, verdict: 'over_flagged', reason: 'ramp is compliant' }],
      missedFindings: [],
      reviewerNotes: 'the slope reads steeper than it is',
      modelVersion: 'opus-5',
    });

    const detail = await db.getPhotoAnalysisForReview(id);
    expect(detail).not.toBeNull();
    expect(detail!.reviews).toHaveLength(1);
    expect(detail!.reviews[0].reviewer).toBe('Peter');
    expect(detail!.reviews[0].overallVerdict).toBe('over_flagged');
    expect(detail!.reviews[0].findingLabels[0].reason).toBe('ramp is compliant');
    // Unset optional fields land as null, not undefined — the columns are
    // nullable and a reader should not have to tell the two apart.
    expect(detail!.reviews[0].reviewerEmail).toBeNull();
    expect(detail!.reviews[0].status).toBe('reviewed');
  });

  it('replaces that reviewer\u2019s own row instead of adding a second', async () => {
    const db = new InMemoryDbClient();
    const id = await seedAnalysis(db);

    await db.upsertPhotoReview({
      photoAnalysisId: id,
      reviewer: 'Peter',
      overallVerdict: 'accurate',
      findingLabels: [],
      missedFindings: [],
    });
    await db.upsertPhotoReview({
      photoAnalysisId: id,
      reviewer: 'Peter',
      overallVerdict: 'missed',
      findingLabels: [],
      missedFindings: [{ description: 'no curb ramp at the crossing' }],
    });

    const detail = await db.getPhotoAnalysisForReview(id);
    expect(detail!.reviews).toHaveLength(1);
    expect(detail!.reviews[0].overallVerdict).toBe('missed');
    expect(detail!.reviews[0].missedFindings).toHaveLength(1);
  });

  it('leaves the other reviewers alone', async () => {
    const db = new InMemoryDbClient();
    const id = await seedAnalysis(db);

    for (const reviewer of ['Peter', 'Gina', 'Ryan']) {
      await db.upsertPhotoReview({
        photoAnalysisId: id,
        reviewer,
        overallVerdict: 'accurate',
        findingLabels: [],
        missedFindings: [],
      });
    }
    // Peter changes his mind. Gina and Ryan must not move.
    await db.upsertPhotoReview({
      photoAnalysisId: id,
      reviewer: 'Peter',
      overallVerdict: 'wrong',
      findingLabels: [],
      missedFindings: [],
    });

    const detail = await db.getPhotoAnalysisForReview(id);
    expect(detail!.reviews).toHaveLength(3);
    const byReviewer = Object.fromEntries(detail!.reviews.map((r) => [r.reviewer, r.overallVerdict]));
    expect(byReviewer).toEqual({ Peter: 'wrong', Gina: 'accurate', Ryan: 'accurate' });
  });

  it('keeps reviews of one analysis off another', async () => {
    const db = new InMemoryDbClient();
    const a = await seedAnalysis(db, 'sess-a');
    const b = await seedAnalysis(db, 'sess-b');

    await db.upsertPhotoReview({
      photoAnalysisId: a,
      reviewer: 'Peter',
      findingLabels: [],
      missedFindings: [],
    });

    expect((await db.getPhotoAnalysisForReview(a))!.reviews).toHaveLength(1);
    expect((await db.getPhotoAnalysisForReview(b))!.reviews).toHaveLength(0);
  });
});

describe('deleting an analysis', () => {
  it('takes its reviews with it, the way the foreign key does', async () => {
    const db = new InMemoryDbClient();
    const id = await seedAnalysis(db);
    await db.upsertPhotoReview({
      photoAnalysisId: id,
      reviewer: 'Peter',
      findingLabels: [],
      missedFindings: [],
    });

    expect(await db.deletePhotoAnalysis(id)).toBe(true);
    expect(await db.getPhotoAnalysisForReview(id)).toBeNull();
    // photo_reviews.photo_analysis_id is ON DELETE CASCADE. An orphan here
    // is a state the real database cannot produce.
    expect(db.photoReviews.filter((r) => r.photoAnalysisId === id)).toEqual([]);
  });

  it('reports false for something that was never there', async () => {
    const db = new InMemoryDbClient();
    expect(await db.deletePhotoAnalysis('no-such-analysis')).toBe(false);
  });
});

describe('the tester comment', () => {
  it('lands on the analyses for that session and reports whether it found any', async () => {
    const db = new InMemoryDbClient();
    const id = await seedAnalysis(db, 'sess-1');

    expect(await db.savePhotoTesterComment('sess-1', 'the photo was taken at an angle')).toBe(true);
    expect((await db.getPhotoAnalysisForReview(id))!.testerComment).toBe(
      'the photo was taken at an angle',
    );
    expect(await db.savePhotoTesterComment('sess-nobody', 'x')).toBe(false);
  });
});

describe('what this fake refuses to fake', () => {
  /**
   * These two are behaviour, not storage — filtering with pagination, and
   * aggregation. Copying either into a second implementation gives you two
   * versions that can disagree, which is how this repo has been bitten
   * before. They throw rather than returning an empty page or an empty
   * summary, because an empty return is something a test can assert on and
   * be wrong about.
   */
  it('says so plainly instead of returning nothing', async () => {
    const db = new InMemoryDbClient();
    await expect(db.listPhotoAnalysesForReview({})).rejects.toThrow(
      /listPhotoAnalysesForReview/,
    );
    await expect(db.getPhotoReviewEvalSummary()).rejects.toThrow(/getPhotoReviewEvalSummary/);
  });
});
