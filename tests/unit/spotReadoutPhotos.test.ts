/**
 * Spot readout photos — joined at read time, honest when they are gone.
 *
 * THE CONSTRAINT. The readout is a permanent artifact pointing at temporary
 * assets. spot_photo.delete_after defaults to 90 days and the sweep deletes
 * the blob then soft-deletes the row, while the release email promises the
 * report stays available. So the page must survive its own images
 * disappearing — and must not pretend they were never there.
 *
 * That is why the join happens in the endpoint rather than in composeReport.
 * Writing blob URLs into the stored content would leave dead links inside a
 * permanent record the first time the sweep ran, and stored JSON cannot be
 * un-rotted.
 *
 * `purged` carries the distinction the reader needs: a session that HAD
 * photos and lost them to retention is not the same as one that never had
 * any. Only the first gets an explanation; the second says nothing, because
 * there is nothing to explain.
 *
 * Ref: /triage missing photos in the Spot readout.
 */

import { describe, it, expect } from 'vitest';
import { readCode } from '../support/sourceText.js';

const PUBLIC_ENDPOINT = readCode('api/spot/report.ts');
const ADMIN_ENDPOINT = readCode('api/spot/admin/report.ts');
const STORE = readCode('src/lib/spot/spotStore.ts');
const VIEW = readCode('src/app/routes/public/spot/SpotReportView.tsx');
const COMPOSE = readCode('src/lib/spot/composeReport.ts');

describe('photos are joined at read time, not composed in', () => {
  it('the public readout joins them', () => {
    expect(PUBLIC_ENDPOINT).toContain('sessionPhotoState');
    expect(PUBLIC_ENDPOINT).toMatch(/photos: photos\.urls/);
  });

  it('composeReport never touches blob URLs', () => {
    // The stored artifact stays pure text. This is the assertion that keeps
    // dead links out of a permanent record.
    expect(COMPOSE).not.toContain('blobUrl');
    expect(COMPOSE).not.toContain('blob_url');
    expect(COMPOSE).not.toContain('photos');
  });

  it('the readout lookup returns the session id to join on', () => {
    expect(STORE).toMatch(
      /getReleasedReportBySlug\(slug: string\): Promise<\{ content: unknown; sessionId: string \}/,
    );
  });
});

describe('sessionPhotoState — distinguishes swept from never-had', () => {
  it('counts a session with rows but no survivors as purged', () => {
    const start = STORE.indexOf('async sessionPhotoState');
    const body = STORE.slice(start, STORE.indexOf('async getReportBySession', start));
    expect(body).toMatch(/purged: urls\.length === 0 && rows\.length > 0/);
  });

  it('only treats undeleted rows as live', () => {
    const start = STORE.indexOf('async sessionPhotoState');
    const body = STORE.slice(start, STORE.indexOf('async getReportBySession', start));
    expect(body).toContain('r.deletedAt === null');
  });
});

describe('the view renders honestly in both states', () => {
  it('shows the photos when they exist', () => {
    expect(VIEW).toMatch(/photos\.map\(/);
    expect(VIEW).toContain('screened in this report');
  });

  it('explains the absence only when they were swept', () => {
    // A report that never had photos should say nothing at all.
    expect(VIEW).toMatch(/photos\.length === 0 && photosPurged/);
    expect(VIEW).toMatch(/removed after 90\s*\n?\s*days|removed after 90 days/);
  });

  it('defaults to no photos rather than requiring them', () => {
    // Existing callers that pass only content must keep working.
    expect(VIEW).toMatch(/photos = \[\]/);
    expect(VIEW).toMatch(/photosPurged = false/);
  });
});

describe('the reviewer sees what the buyer sees', () => {
  it('the admin preview joins photos too', () => {
    expect(ADMIN_ENDPOINT).toContain('sessionPhotoState');
  });
});
