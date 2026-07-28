/**
 * The admin has to know every kind the database will accept.
 *
 * This shape has bitten twice. Migration 0024 re-added 'mass' to the
 * database CHECK and nothing in TypeScript learned about it, so a mass row
 * would have rendered a raw slug on the public page, dropped out of the
 * browse filter, and hit a fallback label in Ada's prompt. Taxonomy Phase 1
 * fixed those three and missed two more, both in the admin:
 *
 *   KIND_LABEL in AdminLitigation.tsx — no 'mass', so the list rendered the
 *   raw slug and the edit form's <select> had no matching <option>. A select
 *   whose value matches no option renders BLANK, so opening the Disney
 *   record showed an empty Kind field where a real value existed.
 *
 *   isKind() in api/admin/litigation/[id].ts — no 'mass', so saving that
 *   form dropped the field silently. The stored value survived, which is
 *   why nothing ever surfaced: the screen was wrong and the data was fine.
 *
 * The fix is one runtime list with the type derived from it, so a value
 * cannot exist in one place and not another. These tests assert against
 * that list rather than a hand-written copy — a seventh copy would fail
 * here rather than showing someone a blank field.
 *
 * Ref: /plan admin-editing, Phase 1, AC1.
 */

import { describe, it, expect } from 'vitest';
import { LITIGATION_KINDS } from '@/types/db';
import { KIND_LABEL } from '@/app/routes/admin/AdminLitigation';
import { isKind } from '../../api/admin/litigation/[id].js';
import { KIND_ORDER, kindLabel } from '@/app/lib/litigationLabels';
import { readCode } from '../support/sourceText.js';

describe('the admin knows every kind the database allows', () => {
  it('carries all six, mass included', () => {
    expect([...LITIGATION_KINDS].sort()).toEqual([
      'class',
      'consent_decree',
      'enforcement_action',
      'mass',
      'pattern_of_practice',
      'regulatory_challenge',
    ]);
  });

  it.each(LITIGATION_KINDS)('%s has an admin label', (kind) => {
    const label = KIND_LABEL[kind];
    expect(label, `${kind} would render blank in the Kind dropdown`).toBeTruthy();
    // A label that still looks like the slug means someone added the value
    // and forgot the human string.
    expect(label).not.toBe(kind);
  });

  it.each(LITIGATION_KINDS)('%s passes the admin write guard', (kind) => {
    expect(isKind(kind), `saving ${kind} would silently drop the field`).toBe(true);
  });

  it('offers exactly the kinds it accepts — no more, no fewer', () => {
    // The dropdown is built from Object.keys(KIND_LABEL). If that set and
    // the guard disagree, the form offers something it cannot save, or
    // refuses something it displays.
    expect(Object.keys(KIND_LABEL).sort()).toEqual([...LITIGATION_KINDS].sort());
    for (const k of Object.keys(KIND_LABEL)) expect(isKind(k)).toBe(true);
  });

  it('still rejects things that are not kinds', () => {
    // The guard has to stay closed. 'settled' and 'archived' are statuses,
    // and a typo must not reach the database CHECK.
    for (const bad of ['settled', 'archived', 'draft', '', 'clas', null, undefined, 7]) {
      expect(isKind(bad)).toBe(false);
    }
  });
});

/**
 * Two hand-written copies survived the 2026-07-27 de-duplication.
 *
 * The commit message said the list lived in one place. It lived in three:
 * LITIGATION_KINDS, the front end's own LitigationKindValue union in
 * litigationLabels.ts, and a hard-coded <option> block in AdminLitigation
 * sitting directly beneath the exhaustive KIND_LABEL map in the same file.
 * All three happened to hold the same six values, so nothing was broken —
 * which is exactly how the last one survived four phases.
 *
 * Ref: audit of 2026-07-28.
 */
describe('nobody keeps a private copy of the kind list', () => {
  it('the front-end order covers every kind and invents none', () => {
    // KIND_ORDER stays hand-ordered on purpose — 'mass' sits next to
    // 'class' because the two read as a pair. Membership is what is
    // pinned; a kind missing here drops its whole group from the portal
    // list while the total count still includes it.
    expect([...KIND_ORDER].sort()).toEqual([...LITIGATION_KINDS].sort());
  });

  it('the front-end label map covers every kind', () => {
    for (const kind of LITIGATION_KINDS) {
      expect(kindLabel(kind), `${kind} would render its raw slug`).not.toBe(kind);
    }
  });

  it('the admin filter builds its options rather than listing them', () => {
    const code = readCode('src/app/routes/admin/AdminLitigation.tsx');
    expect(code).toContain('LITIGATION_KINDS.map');
    expect(code).not.toContain('<option value="pattern_of_practice">');
  });
});
