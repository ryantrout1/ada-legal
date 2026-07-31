/**
 * The public review detail read is scoped to field-test photos.
 *
 * `listPhotoAnalysesForReview` has always joined ada_sessions and required
 * is_test — the queue at /review genuinely only ever showed field-test
 * captures, and its header comment says so: "real claimants' analyses never
 * appear here."
 *
 * `getPhotoAnalysisForReview` did not. It selected on the analysis id alone.
 * Since /api/photo-review/[id] is unauthenticated, that made every photo
 * analysis in the table readable — and writable, via the POST on the same
 * path — to anyone holding an id. The list was the thing everyone looked at,
 * so the promise on the list was mistaken for a promise about the surface.
 *
 * The two clients disagreeing about the same question is the shape that hid
 * it, so this pins the fake and the real client is changed in the same
 * commit.
 *
 * Ref: /plan close the ungated reviewer surface, Phase 1, criterion 1.
 */

import { describe, it, expect } from 'vitest';
import { createSession } from '@/engine/session/sessionRepo';
import {
  makeInMemoryClients,
  type InMemoryAdaClients,
} from '@/engine/clients/inMemoryClients';
import type { PhotoFinding } from '@/types/db';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const ANON_ID = '00000000-0000-4000-8000-000000000abc';

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

/** A session plus one analysis on it. isTest decides which kind of session. */
async function seed(clients: InMemoryAdaClients, isTest: boolean): Promise<string> {
  const state = createSession(clients, {
    orgId: ORG_ID,
    sessionType: 'public_ada',
    anonSessionId: ANON_ID,
    userId: null,
    isTest,
  });
  await clients.db.writeSession({ state });
  return clients.db.savePhotoAnalysis({
    sessionId: state.sessionId,
    orgId: ORG_ID,
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

describe('getPhotoAnalysisForReview — field-test photos only', () => {
  it('returns an analysis captured on a field-test session', async () => {
    const clients = makeInMemoryClients();
    const id = await seed(clients, true);

    const detail = await clients.db.getPhotoAnalysisForReview(id);

    expect(detail).not.toBeNull();
    expect(detail!.photoAnalysisId).toBe(id);
  });

  it('refuses an analysis captured on a real claimant session', async () => {
    const clients = makeInMemoryClients();
    const id = await seed(clients, false);

    const detail = await clients.db.getPhotoAnalysisForReview(id);

    // Null, not a redacted shape. The endpoint turns null into a 404, so a
    // caller cannot tell a real claimant's analysis from an id that was
    // never real — which is the point.
    expect(detail).toBeNull();
  });

  it('refuses an analysis whose session is gone', async () => {
    // The real client reaches is_test through an inner join, so an analysis
    // with no surviving session row drops out. The fake has to agree, or a
    // test could pass here and the deployed endpoint still serve the row.
    const clients = makeInMemoryClients();
    const id = await clients.db.savePhotoAnalysis({
      sessionId: '00000000-0000-4000-8000-0000000000ff',
      orgId: ORG_ID,
      photoUrl: 'https://blob/orphan.jpg',
      photoBlobKey: 'photos/orphan.jpg',
      findings: FINDINGS,
      scene: { standard: 'An orphaned capture.' },
      summary: { standard: 'One concern found.' },
      overallRisk: 'medium',
      positiveFindings: { standard: [] },
      modelVersion: 'opus-5',
    });

    expect(await clients.db.getPhotoAnalysisForReview(id)).toBeNull();
  });
});
