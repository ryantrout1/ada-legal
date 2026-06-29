/**
 * Integration test — the case-evidence seam (build-list #3).
 *
 * getCaseEvidenceForFirm (firm-scope + consent) → analyzeCaseEvidencePhoto
 * (runs the analyzer, fills professional, stores linked to the matter) →
 * read again. Confirms the consent gate, the firm boundary, the hedge
 * (confirmable:false) surviving round-trip, and that a photo not on the
 * matter is rejected. In-memory clients; no live DB.
 *
 * Encodes /plan "Evidence + full photo analysis" acceptance criteria 1–4.
 */

import { describe, it, expect } from 'vitest';
import {
  makeInMemoryClients,
  InMemoryDbClient,
  InMemoryPhotoAnalysisClient,
} from '@/engine/clients/inMemoryClients';
import { analyzeCaseEvidencePhoto, analyzeAttorneyPhoto } from '@/engine/cases/caseEvidence';
import { resolveAttorneyContext } from '../../api/_attorney';
import { seedPortalFixture } from '../fixtures/portalSeed';
import type { AdaSessionState } from '@/engine/types';
import type { PhotoAnalysisResult } from '@/engine/clients/types';
import type { PhotoFinding } from '@/types/db';

const PHOTO_URL = 'https://acme.public.blob.vercel-storage.com/ramp.jpg';
const OFF_MATTER_URL = 'https://acme.public.blob.vercel-storage.com/elsewhere.jpg';

function finding(): PhotoFinding {
  return {
    title_standard: 'Ramp slope may exceed maximum',
    finding_standard: 'The ramp looks steeper than 1:12; confirm with a level on site.',
    severity: 'major',
    standard: '§405.2',
    confidence: 0.8,
    confirmable: false,
  };
}

function analysisResult(): PhotoAnalysisResult {
  return {
    output: {
      scene: { standard: 'A concrete ramp at a storefront entrance.' },
      summary: { standard: 'One slope concern; handrail present.' },
      overall_risk: 'medium',
      positive_findings: { standard: ['Handrail present on the ramp'] },
      findings: [finding()],
    },
    modelVersion: 'test-analyzer-v1',
  };
}

async function setup() {
  const clients = makeInMemoryClients();
  await seedPortalFixture(clients);
  const ctxA = await resolveAttorneyContext(clients.db, 'clerk_user_a', null);
  const ctxB = await resolveAttorneyContext(clients.db, 'clerk_user_b', null);
  const firmA = await clients.db.readLawFirmById(ctxA!.lawFirmId);

  // A claimant session that attached one photo during intake.
  const state = {
    sessionId: 'sess-evidence',
    orgId: firmA!.orgId,
    sessionType: 'public_ada',
    status: 'completed',
    extractedFields: {},
    conversationHistory: [],
    metadata: { photos: [{ url: PHOTO_URL, uploadedAt: '2026-06-01T00:00:00Z' }] },
  } as unknown as AdaSessionState;
  await clients.db.writeSession({ state });

  // A matter routed to firm A off that session.
  const { caseRow } = await clients.db.createCase({
    orgId: firmA!.orgId,
    adaSessionId: state.sessionId,
    litigationListingId: null,
    lane: 'routed_firm',
    firmId: ctxA!.lawFirmId,
    classificationTitle: 'Title III — entrance access',
    classificationStandard: '§405.2',
    matchConfidence: null,
    jurisdictionState: 'AZ',
    routedAt: '2026-06-01T00:00:00Z',
    firstContactDue: '2026-06-03T00:00:00Z',
    routingReason: 'test seed',
  });

  return { clients, ctxA: ctxA!, ctxB: ctxB!, caseId: caseRow.id };
}

describe('case evidence seam (read → analyze → store, firm-scoped)', () => {
  it('consent gates the read; once consented the matter exposes its photos', async () => {
    const { clients, ctxA, caseId } = await setup();
    expect(await clients.db.getCaseEvidenceForFirm(caseId, ctxA.lawFirmId)).toBeNull();

    await clients.db.recordCaseConsent({ sessionId: 'sess-evidence', scope: 'attorney' });
    const ev = await clients.db.getCaseEvidenceForFirm(caseId, ctxA.lawFirmId);
    expect(ev!.photos).toHaveLength(1);
    expect(ev!.photos[0]).toMatchObject({ url: PHOTO_URL, analysis: null });
  });

  it('analyze stores a professional-filled analysis linked to the matter; the hedge survives', async () => {
    const { clients, ctxA, caseId } = await setup();
    await clients.db.recordCaseConsent({ sessionId: 'sess-evidence', scope: 'attorney' });
    (clients.photo as InMemoryPhotoAnalysisClient).enqueueResult(analysisResult());

    const res = await analyzeCaseEvidencePhoto(clients, {
      caseId,
      lawFirmId: ctxA.lawFirmId,
      photoUrl: PHOTO_URL,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      // professional filled from standard by the in-memory rewriteToLevel
      expect(res.analysis.findings[0]!.title_professional).toBeTruthy();
      expect(res.analysis.findings[0]!.finding_professional).toBeTruthy();
      expect(res.analysis.findings[0]!.confirmable).toBe(false);
    }

    // the stored row is linked to the case and returns on the next read
    const ev = await clients.db.getCaseEvidenceForFirm(caseId, ctxA.lawFirmId);
    const stored = ev!.photos[0]!.analysis;
    expect(stored).not.toBeNull();
    expect(stored!.findings[0]!.standard).toBe('§405.2');
    expect(stored!.findings[0]!.confirmable).toBe(false);
    expect(ev!.photos[0]!.analyzedAt).not.toBeNull();
  });

  it('another firm cannot read or analyze the matter (404 boundary)', async () => {
    const { clients, ctxA, ctxB, caseId } = await setup();
    await clients.db.recordCaseConsent({ sessionId: 'sess-evidence', scope: 'attorney' });

    expect(await clients.db.getCaseEvidenceForFirm(caseId, ctxB.lawFirmId)).toBeNull();

    (clients.photo as InMemoryPhotoAnalysisClient).enqueueResult(analysisResult());
    const res = await analyzeCaseEvidencePhoto(clients, {
      caseId,
      lawFirmId: ctxB.lawFirmId,
      photoUrl: PHOTO_URL,
    });
    expect(res).toMatchObject({ ok: false, status: 404 });
    // firm A's view is untouched (no row written for the rejected call)
    const ev = await clients.db.getCaseEvidenceForFirm(caseId, ctxA.lawFirmId);
    expect(ev!.photos[0]!.analysis).toBeNull();
  });

  it('a photo that is not on the matter is rejected', async () => {
    const { clients, ctxA, caseId } = await setup();
    await clients.db.recordCaseConsent({ sessionId: 'sess-evidence', scope: 'attorney' });
    (clients.photo as InMemoryPhotoAnalysisClient).enqueueResult(analysisResult());

    const res = await analyzeCaseEvidencePhoto(clients, {
      caseId,
      lawFirmId: ctxA.lawFirmId,
      photoUrl: OFF_MATTER_URL,
    });
    expect(res).toMatchObject({ ok: false, status: 404 });
  });
});

const ATTORNEY_PHOTO_URL = 'https://acme.public.blob.vercel-storage.com/site-visit.jpg';

describe('attorney-attached photos on any matter (Phase 2)', () => {
  it('an attorney photo on a direct matter (no session) analyzes and appears with source attorney', async () => {
    const clients = makeInMemoryClients();
    await seedPortalFixture(clients);
    const ctxA = (await resolveAttorneyContext(clients.db, 'clerk_user_a', null))!;
    const firmA = (await clients.db.readLawFirmById(ctxA.lawFirmId))!;

    // A self-originated matter — no claimant session, consent true at creation.
    const matter = await clients.db.createDirectCase({
      orgId: firmA.orgId,
      firmId: ctxA.lawFirmId,
      assignedLawyerId: ctxA.attorneyId,
      createdBy: ctxA.userId,
      client: { name: 'Walk-in Client' },
    });

    // No photos to start.
    const before = await clients.db.getCaseEvidenceForFirm(matter.id, ctxA.lawFirmId);
    expect(before!.photos).toHaveLength(0);

    // Attorney uploads + analyzes a photo.
    (clients.photo as InMemoryPhotoAnalysisClient).enqueueResult(analysisResult());
    const res = await analyzeAttorneyPhoto(clients, {
      caseId: matter.id,
      lawFirmId: ctxA.lawFirmId,
      photoUrl: ATTORNEY_PHOTO_URL,
    });
    expect(res.ok).toBe(true);

    const after = await clients.db.getCaseEvidenceForFirm(matter.id, ctxA.lawFirmId);
    expect(after!.photos).toHaveLength(1);
    expect(after!.photos[0]).toMatchObject({ url: ATTORNEY_PHOTO_URL, source: 'attorney' });
    expect(after!.photos[0]!.analysis!.findings[0]!.standard).toBe('§405.2');
    // stored with a null origin session
    const stored = (clients.db as InMemoryDbClient).photoAnalyses.find((a) => a.photoUrl === ATTORNEY_PHOTO_URL);
    expect(stored!.sessionId).toBeNull();
    expect(stored!.source).toBe('attorney');
  });

  it('another firm cannot attach a photo to the matter (404 boundary)', async () => {
    const clients = makeInMemoryClients();
    await seedPortalFixture(clients);
    const ctxA = (await resolveAttorneyContext(clients.db, 'clerk_user_a', null))!;
    const ctxB = (await resolveAttorneyContext(clients.db, 'clerk_user_b', null))!;
    const firmA = (await clients.db.readLawFirmById(ctxA.lawFirmId))!;

    const matter = await clients.db.createDirectCase({
      orgId: firmA.orgId,
      firmId: ctxA.lawFirmId,
      assignedLawyerId: ctxA.attorneyId,
      createdBy: ctxA.userId,
      client: { name: 'Walk-in Client' },
    });

    (clients.photo as InMemoryPhotoAnalysisClient).enqueueResult(analysisResult());
    const res = await analyzeAttorneyPhoto(clients, {
      caseId: matter.id,
      lawFirmId: ctxB.lawFirmId,
      photoUrl: ATTORNEY_PHOTO_URL,
    });
    expect(res).toMatchObject({ ok: false, status: 404 });
  });
});
