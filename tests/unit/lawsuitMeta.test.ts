import { describe, expect, it } from 'vitest';
import { lawsuitTitle, TITLE_MAX } from '../../src/lib/seo/lawsuitMeta.js';

describe('lawsuitTitle', () => {
  it('adds the brand when the name leaves room', () => {
    expect(lawsuitTitle('Kiosk accessibility')).toBe('Kiosk accessibility | ADA Legal Link');
  });

  it('drops the brand before it cuts the name', () => {
    const name = 'Pharmacy and retail self-service kiosk inaccessibility'; // 54
    expect(lawsuitTitle(name)).toBe(name);
  });

  it('cuts a long name at a word boundary and never exceeds the limit', () => {
    const name =
      'National Federation of the Blind of California v. Uber Technologies, Inc.';
    const title = lawsuitTitle(name);
    expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
    expect(title.endsWith('…')).toBe(true);
    expect(name.startsWith(title.slice(0, -1))).toBe(true);
  });

  it('keeps every real-world length within the limit', () => {
    for (let n = 1; n <= 120; n += 1) {
      const name = Array.from({ length: n }, (_, i) => (i % 6 === 5 ? ' ' : 'a')).join('');
      expect(lawsuitTitle(name).length).toBeLessThanOrEqual(TITLE_MAX);
    }
  });
});
