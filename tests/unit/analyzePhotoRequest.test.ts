/**
 * Tests for the pure request helpers behind POST /api/ada/analyze-photo.
 *
 * The endpoint is the field-test path that runs the structured analyzer
 * and persists a photo_analyses row for the admin review queue. These
 * cover the two safety-critical decisions:
 *   - parseAnalyzePhotoBody: required fields + Vercel-Blob URL allowlist
 *   - gateAnalyzePhotoSession: field-test sessions only (403 otherwise)
 *
 * Ref: /triage field-test photos never reach the review queue.
 */

import { describe, it, expect } from 'vitest';
import {
  parseAnalyzePhotoBody,
  gateAnalyzePhotoSession,
  MAX_PHOTO_URL_CHARS,
} from '@/lib/analyzePhotoRequest';

const VALID_URL =
  'https://6rojtjcyu498fe5h.public.blob.vercel-storage.com/photos/abc/123.jpg';

describe('parseAnalyzePhotoBody', () => {
  it('accepts a valid Vercel Blob URL and trims fields', () => {
    const r = parseAnalyzePhotoBody({
      session_id: '  sess-1  ',
      photo_url: VALID_URL,
      context_hint: '  doorway width  ',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.sessionId).toBe('sess-1');
      expect(r.photoUrl).toBe(VALID_URL);
      expect(r.contextHint).toBe('doorway width');
    }
  });

  it('treats an empty/whitespace context_hint as undefined', () => {
    const r = parseAnalyzePhotoBody({ session_id: 's', photo_url: VALID_URL, context_hint: '   ' });
    expect(r.ok && r.contextHint).toBeUndefined();
  });

  it('rejects a missing session_id (400)', () => {
    const r = parseAnalyzePhotoBody({ photo_url: VALID_URL });
    expect(r).toEqual({ ok: false, status: 400, error: 'session_id is required' });
  });

  it('rejects a missing photo_url (400)', () => {
    const r = parseAnalyzePhotoBody({ session_id: 's' });
    expect(r).toEqual({ ok: false, status: 400, error: 'photo_url is required' });
  });

  it('rejects a non-Vercel-Blob URL (400)', () => {
    const r = parseAnalyzePhotoBody({ session_id: 's', photo_url: 'https://evil.example.com/x.jpg' });
    expect(r).toEqual({ ok: false, status: 400, error: 'photo_url must be a Vercel Blob URL' });
  });

  it('rejects a data: URI (only blob URLs allowed at the edge)', () => {
    const r = parseAnalyzePhotoBody({ session_id: 's', photo_url: 'data:image/jpeg;base64,/9j/4AAQ' });
    expect(r.ok).toBe(false);
  });

  it('rejects an over-long photo_url (400)', () => {
    const longUrl =
      'https://x.public.blob.vercel-storage.com/' + 'a'.repeat(MAX_PHOTO_URL_CHARS);
    const r = parseAnalyzePhotoBody({ session_id: 's', photo_url: longUrl });
    expect(r).toEqual({ ok: false, status: 400, error: 'photo_url is too long' });
  });
});

describe('gateAnalyzePhotoSession', () => {
  it('404s a missing session', () => {
    expect(gateAnalyzePhotoSession(null)).toEqual({
      ok: false,
      status: 404,
      error: 'Session not found',
    });
  });

  it('403s a non-test (real claimant) session — never analyzes/persists', () => {
    expect(gateAnalyzePhotoSession({ isTest: false })).toEqual({
      ok: false,
      status: 403,
      error: 'analyze-photo is restricted to field-test sessions',
    });
  });

  it('allows a field-test session', () => {
    expect(gateAnalyzePhotoSession({ isTest: true })).toEqual({ ok: true });
  });
});
