import { describe, it, expect } from 'vitest';
import { buildReleaseEmail } from '@/lib/spot/releaseEmail';
import {
  EMAIL_BUTTON_LINE_HEIGHT,
  EMAIL_BUTTON_PADDING_Y,
  EMAIL_BUTTON_TARGET_PX,
  EMAIL_PALETTE,
} from '@/engine/email/emailStyles';

describe('buildReleaseEmail', () => {
  const email = buildReleaseEmail({ slug: 'abc123xyz', baseUrl: 'https://ada.adalegallink.com' });

  it('links to the hosted readout for the slug', () => {
    expect(email.html).toContain('https://ada.adalegallink.com/spot/r/abc123xyz');
    expect(email.text).toContain('https://ada.adalegallink.com/spot/r/abc123xyz');
  });

  it('has a subject and a plain-text alternative', () => {
    expect(email.subject.length).toBeGreaterThan(0);
    expect(email.text.length).toBeGreaterThan(0);
  });

  it('states the 90-day photo retention', () => {
    expect(`${email.html} ${email.text}`.toLowerCase()).toContain('90 days');
  });

  it('uses screening language only — no certifying verbs', () => {
    const blob = `${email.subject} ${email.html} ${email.text}`.toLowerCase();
    for (const banned of ['violation', 'compliant', 'certified', 'certify', 'in compliance']) {
      expect(blob).not.toContain(banned);
    }
  });

  it('escapes the readout URL host into the href (no raw injection)', () => {
    const evil = buildReleaseEmail({ slug: 'a"b<c', baseUrl: 'https://ada.adalegallink.com' });
    expect(evil.html).not.toContain('a"b<c');
  });
});

/**
 * Phase 1 additions — /plan: Spot release email.
 *
 * The email that shipped before this was a bare URL, two paragraphs under the
 * AAA floor, and no sign that anyone had looked at the report. These pin the
 * shape of the replacement.
 */
describe('buildReleaseEmail — the readable, tappable version', () => {
  const email = buildReleaseEmail({ slug: 'abc123xyz', baseUrl: 'https://adalegallink.com' });

  it('declares its language so a screen reader pronounces it correctly', () => {
    expect(email.html).toMatch(/<html lang="en"/);
  });

  it('offers a button with words on it, not a raw URL', () => {
    // The visible text between the anchor tags must not be the href.
    const anchor = email.html.match(/<a [^>]*href="[^"]*"[^>]*>([^<]+)<\/a>/);
    expect(anchor, 'no anchor found in the html').not.toBeNull();
    expect(anchor![1]).not.toMatch(/^https?:\/\//);
    expect(anchor![1].length).toBeGreaterThan(3);
  });

  it('gives that button a 44px target', () => {
    expect(EMAIL_BUTTON_TARGET_PX).toBeGreaterThanOrEqual(44);
    expect(email.html).toContain(`padding:${EMAIL_BUTTON_PADDING_Y}px`);
    expect(email.html).toContain(`line-height:${EMAIL_BUTTON_LINE_HEIGHT}px`);
  });

  it('keeps exactly one link to the report in the html', () => {
    // A second bare URL alongside the button doubles what a screen reader
    // reads and is the shape spam filters score against.
    const hrefs = [...email.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    expect(hrefs.filter((h) => h.includes('/spot/r/'))).toHaveLength(1);
  });

  it('still puts the plain URL in the text alternative', () => {
    expect(email.text).toContain('https://adalegallink.com/spot/r/abc123xyz');
  });

  it('says a person reviewed the report', () => {
    expect(email.html).toMatch(/person/i);
    expect(email.text).toMatch(/person/i);
  });

  it('says the link does not expire and the photos do', () => {
    const blob = `${email.html} ${email.text}`.toLowerCase();
    expect(blob).toContain('90 days');
    // The failure this guards: telling people the report expires, which would
    // be false and would manufacture urgency the product does not have.
    expect(blob).not.toMatch(/link (will )?expires?|expires in|before it expires/);
  });

  it('carries the heading and intro into the text alternative too', () => {
    expect(email.text).toContain('Your screening is ready');
  });

  it('uses no colour outside the shared email palette', () => {
    // The contrast test proves the palette. This proves the renderer only
    // draws from it — otherwise a stray hex passes unmeasured.
    const used = new Set((email.html.match(/#[0-9a-f]{6}/gi) ?? []).map((h) => h.toLowerCase()));
    const allowed = new Set(EMAIL_PALETTE.map((c) => c.toLowerCase()));
    for (const hex of used) {
      expect(allowed.has(hex), `${hex} is not in the shared email palette`).toBe(true);
    }
  });
});
