/**
 * Markers must not vanish quietly.
 *
 * A report's markers are tied to a photo by an exact text match on the photo's
 * address. That address is written when the report is generated and matched
 * again when it is displayed — two moments, two code paths, and nothing that
 * forces them to agree. When they disagree the report still renders, still
 * looks finished, and simply has no markers on it. Nobody is told.
 *
 * That already cost a full round of testing: the markers were computed
 * correctly and stored correctly, and the screen showing them passed the
 * report but not the photo, so every marker was dropped and the page looked
 * merely plain rather than broken.
 *
 * Two guards here:
 *   1. If the address does not match, fall back to position — first photo
 *      gets the first set of markers. That is how the generator pairs them
 *      anyway, so position is the truth the address was only standing in for.
 *   2. Every screen that shows a report must hand over the photo and the
 *      marker switch. Checked by reading the source, because a screen that
 *      forgets one renders perfectly and fails invisibly.
 *
 * Ref: /plan Make photo markers fail loudly, not silently, Phase 1.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { buildPinNumbering } from '@/lib/spot/pinNumbering';
import type { PhotoAnnotation } from '@/lib/spot/annotationTypes';
import type { SpotReportItem } from '@/lib/spot/reportSchema';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function item(over: Partial<SpotReportItem> = {}): SpotReportItem {
  return {
    title: 'Raised shower curb',
    concern: 'A wheelchair cannot roll over it.',
    severity: 'critical',
    confirmable: true,
    locatable: true,
    ...over,
  } as SpotReportItem;
}

function annotation(photoUrl: string, itemIndexes: number[]): PhotoAnnotation {
  return {
    photoUrl,
    pins: itemIndexes.map((itemIndex) => ({
      x: 0.5,
      y: 0.5,
      confidence: 0.9,
      label: `Pin ${itemIndex}`,
      severity: 'critical' as const,
      itemIndex,
    })),
  };
}

describe('markers survive a photo address that does not match', () => {
  it('uses the exact match when the address agrees', () => {
    const numbering = buildPinNumbering(
      [item(), item({ title: 'Bench' })],
      [annotation('https://blob/photo-a.jpg', [0]), annotation('https://blob/photo-b.jpg', [1])],
    );
    expect(numbering.pinsForPhoto('https://blob/photo-b.jpg', 1).map((p) => p.label)).toEqual([
      'Pin 1',
    ]);
  });

  it('falls back to position when the address does not match', () => {
    // Same photo, different address — a re-upload, a signed URL, a data URL
    // where a blob URL was stored. The markers still belong on it.
    const numbering = buildPinNumbering([item()], [annotation('https://blob/stored.jpg', [0])]);
    expect(numbering.pinsForPhoto('https://cdn/served-differently.jpg', 0)).toHaveLength(1);
    expect(numbering.pinsForPhoto('https://cdn/served-differently.jpg', 0)[0]!.number).toBe(1);
  });

  it('still returns nothing when there is no set of markers at that position', () => {
    const numbering = buildPinNumbering([item()], [annotation('https://blob/stored.jpg', [0])]);
    expect(numbering.pinsForPhoto('https://cdn/other.jpg', 3)).toEqual([]);
  });

  it('returns nothing when the report has no markers at all', () => {
    const numbering = buildPinNumbering([item()], []);
    expect(numbering.pinsForPhoto('https://cdn/any.jpg', 0)).toEqual([]);
  });

  it('keeps working for callers that pass no position', () => {
    const numbering = buildPinNumbering([item()], [annotation('https://blob/stored.jpg', [0])]);
    expect(numbering.pinsForPhoto('https://blob/stored.jpg')).toHaveLength(1);
    expect(numbering.pinsForPhoto('https://cdn/nomatch.jpg')).toEqual([]);
  });
});

/** Every .tsx under src, so a NEW screen is caught too, not just today's three. */
function tsxFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) tsxFiles(full, acc);
    else if (entry.endsWith('.tsx')) acc.push(full);
  }
  return acc;
}

describe('every screen that shows a report hands over the photo', () => {
  it('passes both the photo and the marker switch at every call site', () => {
    const offenders: string[] = [];

    for (const file of tsxFiles(resolve(root, 'src'))) {
      const src = readFileSync(file, 'utf8');
      let from = src.indexOf('<SpotReportView');
      while (from !== -1) {
        // The JSX element's own text, up to the tag close.
        const end = src.indexOf('>', from);
        const element = src.slice(from, end === -1 ? src.length : end);
        const rel = file.slice(root.length + 1);
        if (!element.includes('photos=')) offenders.push(`${rel}: no photos prop`);
        if (!element.includes('annotationsEnabled')) {
          offenders.push(`${rel}: no annotationsEnabled prop`);
        }
        from = src.indexOf('<SpotReportView', from + 1);
      }
    }

    // Both props default to a value that renders a clean, complete-looking
    // report with the photo and every marker missing — so omitting one is
    // silent. If this fails, the named file is dropping the visual layer.
    expect(offenders).toEqual([]);
  });

  it('finds the call sites it is supposed to be guarding', () => {
    // A guard that silently matches nothing passes forever. Pin the count so
    // a refactor that renames the component cannot disarm this test quietly.
    const count = tsxFiles(resolve(root, 'src')).filter((f) =>
      readFileSync(f, 'utf8').includes('<SpotReportView'),
    ).length;
    expect(count).toBeGreaterThanOrEqual(3);
  });
});
