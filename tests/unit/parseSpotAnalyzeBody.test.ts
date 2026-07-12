import { describe, it, expect } from 'vitest';
import {
  parseSpotAnalyzeBody,
  MAX_FREE_PHOTOS,
  MAX_PHOTO_CHARS,
} from '@/lib/spot/parseSpotAnalyzeBody';

const png = (bytes = 20) => `data:image/png;base64,${'A'.repeat(bytes)}`;

describe('parseSpotAnalyzeBody', () => {
  it('accepts one base64 image data URL', () => {
    const out = parseSpotAnalyzeBody({ photos: [png()] });
    expect(out.ok).toBe(true);
    if (out.ok) expect(out.photos).toHaveLength(1);
  });

  it('accepts two photos (the free-tier max)', () => {
    expect(MAX_FREE_PHOTOS).toBe(2);
    const out = parseSpotAnalyzeBody({ photos: [png(), `data:image/jpeg;base64,${'B'.repeat(30)}`] });
    expect(out.ok).toBe(true);
  });

  it('rejects zero photos', () => {
    expect(parseSpotAnalyzeBody({ photos: [] }).ok).toBe(false);
    expect(parseSpotAnalyzeBody({}).ok).toBe(false);
  });

  it('rejects more than two photos (free tier)', () => {
    const out = parseSpotAnalyzeBody({ photos: [png(), png(), png()] });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.status).toBe(400);
  });

  it('rejects non-image and non-data URLs (no remote fetch smuggling)', () => {
    expect(parseSpotAnalyzeBody({ photos: ['https://evil.example/x.png'] }).ok).toBe(false);
    expect(parseSpotAnalyzeBody({ photos: ['data:text/html;base64,AAAA'] }).ok).toBe(false);
    expect(parseSpotAnalyzeBody({ photos: [123] }).ok).toBe(false);
  });

  it('rejects an oversized photo (body-size guard)', () => {
    const huge = `data:image/png;base64,${'A'.repeat(MAX_PHOTO_CHARS + 1)}`;
    const out = parseSpotAnalyzeBody({ photos: [huge] });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.status).toBe(413);
  });
});
