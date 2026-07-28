/**
 * The portal's litigation list must not decide anything with a two-way
 * test on kind.
 *
 * Until 2026-07-27 it rendered `kind === 'class' ? 'Class action' : 'Mass
 * action'` and grouped with `filter(l => l.kind !== 'class')`. There are
 * six kinds, so 22 of the 23 non-class records were labelled and filed as
 * mass actions: eight DOJ enforcement actions, ten pattern-of-practice
 * records, two consent decrees, two regulatory challenges.
 *
 * It was not cosmetic. Accepting a litigation sets receivesMatches, which
 * is what makes resolveEligibleRoutingFirm hand a firm an EXCLUSIVE routed
 * lead — so a firm could opt into exclusive routing for something it
 * believed was a mass action and was actually a DOJ investigation with no
 * claimants, or a pattern-of-practice record with no court and no docket.
 *
 * This is the seventh place the kind list was written out by hand. The
 * identical ternary was fixed in Ada's prompt a month earlier and the fix
 * was scoped to that file, because nothing pointed at this one. Source
 * assertions rather than render tests: this repo has no React render
 * testing, so the file's text is what can be pinned.
 *
 * Ref: /triage portal-litigation-labels, Part 1.
 */

import { describe, it, expect } from 'vitest';
import { readCode } from '../support/sourceText.js';
import { KIND_ORDER, kindLabel } from '@/app/lib/litigationLabels';

const code = readCode('src/app/routes/portal/PortalLitigations.tsx');
const detail = readCode('src/app/routes/portal/PortalLitigationDetail.tsx');

describe('portal litigation list', () => {
  it('takes its labels from the shared map, not a ternary', () => {
    expect(code).toContain('kindLabel(');
    expect(code).not.toContain("'Class action' : 'Mass action'");
  });

  it('groups by the shared list rather than class-versus-everything', () => {
    expect(code).toContain('KIND_ORDER');
    // The two filters that produced the mislabelling.
    expect(code).not.toContain("l.kind !== 'class'");
    expect(code).not.toContain("filter((l) => l.kind !== 'class')");
  });

  it('filters on the kind asked for', () => {
    // `typeFilter === 'mass' && l.kind === 'class'` returned all 23
    // non-class records for a Mass filter.
    expect(code).not.toContain("typeFilter === 'mass'");
  });

  it('every kind it can group has a label', () => {
    // The grouping maps KIND_ORDER through kindLabel. A kind without a
    // label would render its raw slug as a section heading.
    for (const kind of KIND_ORDER) {
      const label = kindLabel(kind);
      expect(label, `${kind} would head a section with its raw slug`).toBeTruthy();
      expect(label).not.toBe(kind);
    }
  });
});

/**
 * The list page was fixed on 2026-07-27 and the detail page was not.
 *
 * Same ternary, same file tree, one directory apart. The fix was scoped to
 * the file the bug was reported against, so a lawyer who clicked through
 * from a correctly-labelled list row landed on a page that called a DOJ
 * enforcement action a mass action. The test above only ever read the list.
 *
 * Ref: audit of 2026-07-28.
 */
describe('portal litigation detail', () => {
  it('takes its label from the shared map, not a ternary', () => {
    expect(detail).toContain('kindLabel(');
    expect(detail).not.toContain("'Class action' : 'Mass action'");
  });

  it('does not keep a private copy of the states helper', () => {
    // It had its own statesLabel + NATIONWIDE_SENTINEL, which is how the
    // sentinel ends up rendered as a state code on one page and not another.
    expect(detail).not.toContain('function statesLabel');
    expect(detail).not.toContain("NATIONWIDE_SENTINEL = '__nationwide__'");
  });
});
