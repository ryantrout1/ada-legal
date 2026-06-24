/**
 * Phase 5 — build-time guarantees for the ADA standards catalog.
 *
 * These tests make completeness and consistency a CI gate so a hole can
 * never silently return:
 *
 *   1. COMPLETENESS (p5-1): every numbered section in the 2010 ADA
 *      Standards table of contents has a catalog row. A deliberately
 *      removed section makes this fail.
 *   2. SLUG INTEGRITY (Phase 4 lock-in): every guide_slug resolves to a
 *      guide page that actually exists (imported live from GUIDE_LOADERS)
 *      or is '' (chapter-URL fallback). Catches the Phase-2 class of bug
 *      where slugs pointed at pages that were never built.
 *   3. DRIFT GUARD (Phase 4 lock-in): the catalog and standardsIndex can
 *      never point the same section at two different guide pages.
 *   4. CURB REGRESSION (p5-2): the deterministic scaffolding that makes a
 *      shower curb a *gating* barrier and surfaces it FIRST. This pins the
 *      prompt-level guarantee; the live model behavior (the curb photo
 *      actually producing a critical finding) is verified manually in the
 *      photo-review admin — that is p5-3, which a test cannot run because
 *      it requires the deployed Anthropic endpoint.
 *
 * Source of record for the section list: the 2010 ADA Standards for
 * Accessible Design, chapters 1–10 (U.S. Access Board). When folding in a
 * future amendment, update ADA_CATALOG and the EXPECTED_SECTION_RANGES
 * oracle below together — see docs/CATALOG_VERSIONING.md.
 */

import { describe, it, expect } from 'vitest';
import {
  ADA_CATALOG,
  renderCatalogForPrompt,
  guideUrlForSection,
} from '@/lib/adaCatalog';
import { STANDARDS_TOPICS, guideUrlForTopic } from '@/lib/standardsIndex';
import { GUIDE_LOADERS } from '@/app/routes/public/standardsGuideIndex';
import photoAnalysisSystemPrompt from '@content/prompts/photo-analysis.js';

/** Every 3-digit section in the 2010 Standards TOC, by chapter. */
const EXPECTED_SECTION_RANGES: ReadonlyArray<readonly [number, number]> = [
  [101, 106], // Ch1 Application & Administration
  [201, 243], // Ch2 Scoping
  [301, 309], // Ch3 Building Blocks
  [401, 410], // Ch4 Accessible Routes
  [501, 505], // Ch5 General Site & Building Elements
  [601, 612], // Ch6 Plumbing Elements & Facilities
  [701, 708], // Ch7 Communication Elements & Features
  [801, 811], // Ch8 Special Rooms, Spaces & Elements
  [901, 904], // Ch9 Built-in Elements
  [1001, 1010], // Ch10 Recreation Facilities
];

function expectedSections(): number[] {
  const out: number[] = [];
  for (const [start, end] of EXPECTED_SECTION_RANGES) {
    for (let n = start; n <= end; n++) out.push(n);
  }
  return out;
}

/** The 3-digit base of a catalog section, e.g. "§604.3" -> 604. */
function baseSectionNumber(section: string): number | null {
  const m = /^§(\d{3,4})/.exec(section);
  return m ? Number(m[1]) : null;
}

describe('adaCatalog — completeness (p5-1)', () => {
  it('covers every numbered section in the 2010 Standards TOC (118 sections)', () => {
    const expected = expectedSections();
    expect(expected.length).toBe(118);

    const covered = new Set<number>();
    for (const row of ADA_CATALOG) {
      const base = baseSectionNumber(row.section);
      if (base !== null) covered.add(base);
    }

    const missing = expected.filter((n) => !covered.has(n));
    expect(missing).toEqual([]);
  });

  it('introduces no sections outside the known TOC ranges', () => {
    const expected = new Set(expectedSections());
    const unexpected = [
      ...new Set(
        ADA_CATALOG.map((r) => baseSectionNumber(r.section)).filter(
          (n): n is number => n !== null,
        ),
      ),
    ].filter((n) => !expected.has(n));
    expect(unexpected).toEqual([]);
  });

  it('every row carries the full set of fields', () => {
    for (const row of ADA_CATALOG) {
      expect(row.section).toMatch(/^§\d{3,4}/);
      expect(typeof row.title).toBe('string');
      expect(row.title.length).toBeGreaterThan(0);
      expect(typeof row.rule).toBe('string');
      expect(row.rule.length).toBeGreaterThan(0);
      expect(['gating', 'component', 'scoping', 'reference']).toContain(
        row.access_role,
      );
      expect(typeof row.photo_assessable).toBe('boolean');
      expect(row.chapter).toBeGreaterThanOrEqual(1);
      expect(row.chapter).toBeLessThanOrEqual(10);
    }
  });
});

describe('adaCatalog — guide_slug integrity (Phase 4 lock-in)', () => {
  it('every guide_slug is a real guide page or the empty fallback', () => {
    const realSlugs = new Set(Object.keys(GUIDE_LOADERS));
    const broken = [
      ...new Set(
        ADA_CATALOG.map((r) => r.guide_slug).filter(
          (s) => s !== '' && !realSlugs.has(s),
        ),
      ),
    ];
    expect(broken).toEqual([]);
  });
});

describe('adaCatalog vs standardsIndex — drift guard (Phase 4 lock-in)', () => {
  it('never points the same section at two different guide pages', () => {
    const contradictions: string[] = [];
    for (const topic of STANDARDS_TOPICS) {
      const topicUrl = guideUrlForTopic(topic);
      const topicIsPage = topicUrl.includes('/guide/');
      for (const sec of topic.sections) {
        const catalogUrl = guideUrlForSection(sec);
        if (!catalogUrl) continue;
        const catalogIsPage = catalogUrl.includes('/guide/');
        if (catalogIsPage && topicIsPage && catalogUrl !== topicUrl) {
          contradictions.push(
            `${sec}: catalog=${catalogUrl} index=${topicUrl} ("${topic.title}")`,
          );
        }
      }
    }
    expect(contradictions).toEqual([]);
  });
});

describe('adaCatalog — curb gating-first regression (p5-2)', () => {
  const checklist = renderCatalogForPrompt();

  it('the rendered checklist includes the §608.7 shower-threshold (curb) rule', () => {
    expect(checklist).toContain('608.7');
  });

  it('marks §608.7 as a GATING rule', () => {
    const line = checklist
      .split('\n')
      .find((l) => l.includes('608.7'));
    expect(line).toBeTruthy();
    expect(line).toContain('[GATING]');
  });

  it('leads the shower fixture group with a GATING rule, not a component detail', () => {
    const lines = checklist.split('\n');
    const header = lines.findIndex((l) => l.trim() === '## shower');
    expect(header).toBeGreaterThanOrEqual(0);
    const firstItem = lines
      .slice(header + 1)
      .find((l) => l.startsWith('- '));
    expect(firstItem).toBeTruthy();
    expect(firstItem).toContain('[GATING]');
  });

  it('carries the transient-lodging scoping caveat', () => {
    expect(checklist).toContain('transient lodging');
  });

  it('resolves the curb section to a real guide page', () => {
    const url = guideUrlForSection('§608.7');
    expect(url).toBe('/standards-guide/guide/restrooms');
  });

  it('the analyzer prompt keeps the gating-first instruction', () => {
    expect(photoAnalysisSystemPrompt).toContain(
      'Disqualifying barriers come first',
    );
  });
});

describe('adaCatalog — Phase 2 accuracy additions (floor urinal, dispenser, changing table)', () => {
  const checklist = renderCatalogForPrompt();

  // Criterion 2: a floor-mounted / trough urinal's rim is at the floor and is
  // NOT governed by the 17in wall-hung rim limit — so the analyzer must not
  // flag it for rim height.
  it('§605 distinguishes floor/trough urinals from the wall-hung 17in rim limit', () => {
    const row = ADA_CATALOG.find((r) => r.section === '§605');
    expect(row).toBeTruthy();
    expect(row!.rule.toLowerCase()).toContain('trough');
    const line = checklist.split('\n').find((l) => l.includes('Urinals'));
    expect(line).toBeTruthy();
    expect(line!.toLowerCase()).toContain('trough');
  });

  // Criterion 4a: the toilet-paper dispenser reach/position gap Peter flagged
  // (§604.7) now has a row, and it reaches the analyzer (photo_assessable +
  // rendered into the checklist).
  it('adds a §604.7 toilet-paper dispenser row, photo-assessable and rendered', () => {
    const row = ADA_CATALOG.find((r) => r.section === '§604.7');
    expect(row).toBeTruthy();
    expect(row!.fixture).toBe('water_closet');
    expect(row!.photo_assessable).toBe(true);
    expect(row!.rule.toLowerCase()).toMatch(/dispenser|toilet paper/);
    expect(checklist).toContain('604.7');
  });

  // Criterion 4b: a fold-down changing table that reduces the required clear
  // floor space when open — expressed on a real section (§604.3 clearance),
  // not an invented one.
  it('covers fold-down changing tables that obstruct clearance when open', () => {
    const covered = ADA_CATALOG.some((r) => /changing table/i.test(r.rule));
    expect(covered).toBe(true);
    expect(checklist.toLowerCase()).toContain('changing table');
  });
});

describe('analyzer prompt — batch-2 reasoning rules (p-batch2-1)', () => {
  it('carries the do-not-assert-absence rule and the multi-unit scan', () => {
    expect(photoAnalysisSystemPrompt).toContain('Do not assert absence you cannot see');
    expect(photoAnalysisSystemPrompt).toContain('Scan every unit before concluding');
  });

  it('exempts sensor/automatic controls from manual reach-range limits', () => {
    expect(photoAnalysisSystemPrompt).toContain('sensor-operated or automatic control');
  });

  it('keeps the push/pull approach-side nudge for door hardware', () => {
    expect(photoAnalysisSystemPrompt).toContain('flat push bar or push plate');
  });
});
