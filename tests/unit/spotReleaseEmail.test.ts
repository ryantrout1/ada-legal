import { describe, it, expect } from 'vitest';
import { buildReleaseEmail } from '@/lib/spot/releaseEmail';

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
