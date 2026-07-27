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
