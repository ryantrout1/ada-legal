/**
 * Admin add and remove for litigation contacts.
 *
 * This is the first write path into a table the public case pages read, so
 * a bad row here shows up in front of a claimant rather than in an admin
 * screen. Two things carry the weight:
 *
 *   The scope note stays mandatory, and the admin has to be TOLD that
 *   rather than shown a Postgres constraint error. A scope note is the
 *   sentence that stops someone in Arizona ringing a Seattle curb-ramp
 *   line, so "please say who this contact can help" is the whole point of
 *   the field, not a validation nicety.
 *
 *   Delete is scoped to the litigation as well as the contact. Keying on
 *   the contact id alone would let a mismatched pair delete a row
 *   belonging to a different case — the same shape as the firm-assignment
 *   bug, where a delete ran without the constraint that made it safe.
 *
 * Ref: /plan admin-editing, Phase 3, AC4 + AC5.
 */

import { describe, it, expect } from 'vitest';
import { makeInMemoryClients } from '@/engine/clients/inMemoryClients';
import type { CreateLitigationContactInput } from '@/engine/clients/types';
import { validateContactInput } from '../../api/admin/litigation/[id]/contacts.js';

const ORG_ID = '00000000-0000-4000-8000-000000000001';
const LIT = '20000000-0000-4000-8000-00000000d001';
const OTHER = '20000000-0000-4000-8000-00000000d002';

function input(
  overrides: Partial<CreateLitigationContactInput> = {},
): CreateLitigationContactInput {
  return {
    orgId: ORG_ID,
    litigationListingId: LIT,
    contactKind: 'class_counsel',
    orgName: 'Example Legal Center',
    scopeNote: 'For people who use sidewalks in the City of Example.',
    ...overrides,
  };
}

describe('what the admin form will accept', () => {
  it('accepts a complete contact', () => {
    const v = validateContactInput({
      contact_kind: 'state_pa',
      org_name: 'Disability Rights Texas',
      scope_note: 'For Harris County voters who cannot mark a paper ballot.',
    });
    expect(v.ok).toBe(true);
  });

  it('names the scope note when it is missing', () => {
    // The message is the feature. An admin who leaves it blank should read
    // a sentence, not a CHECK constraint.
    for (const scope_note of [undefined, '', '   ']) {
      const v = validateContactInput({
        contact_kind: 'class_counsel',
        org_name: 'Somebody LLP',
        scope_note,
      });
      expect(v.ok).toBe(false);
      expect(v.ok === false && v.error).toMatch(/who this contact can help/i);
    }
  });

  it('names the organisation when it is missing', () => {
    const v = validateContactInput({
      contact_kind: 'class_counsel',
      scope_note: 'Covers everyone.',
    });
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.error).toMatch(/organisation|organization/i);
  });

  it('rejects a contact kind it does not recognise', () => {
    const v = validateContactInput({
      contact_kind: 'a_friend',
      org_name: 'Somebody LLP',
      scope_note: 'Covers everyone.',
    });
    expect(v.ok).toBe(false);
    expect(v.ok === false && v.error).toMatch(/kind/i);
  });
});

describe('removing a contact removes only that contact', () => {
  it('leaves the others, in their order', async () => {
    const c = makeInMemoryClients();
    await c.db.createLitigationContact(input({ orgName: 'First', displayOrder: 1 }));
    const middle = await c.db.createLitigationContact(
      input({ orgName: 'Second', displayOrder: 2 }),
    );
    await c.db.createLitigationContact(input({ orgName: 'Third', displayOrder: 3 }));

    const removed = await c.db.deleteLitigationContact(LIT, middle.id);
    expect(removed).toBe(true);

    const left = await c.db.listContactsForLitigation(LIT);
    expect(left.map((r) => r.orgName)).toEqual(['First', 'Third']);
  });

  it('will not delete across cases', async () => {
    // The guard that matters. A contact id from another litigation must
    // not delete anything, even though the id itself is real.
    const c = makeInMemoryClients();
    const ours = await c.db.createLitigationContact(input({ orgName: 'Ours' }));
    await c.db.createLitigationContact(
      input({ litigationListingId: OTHER, orgName: 'Theirs' }),
    );

    const removed = await c.db.deleteLitigationContact(OTHER, ours.id);
    expect(removed).toBe(false);

    expect((await c.db.listContactsForLitigation(LIT)).map((r) => r.orgName))
      .toEqual(['Ours']);
    expect((await c.db.listContactsForLitigation(OTHER)).map((r) => r.orgName))
      .toEqual(['Theirs']);
  });

  it('reports a miss rather than pretending it worked', async () => {
    const c = makeInMemoryClients();
    const removed = await c.db.deleteLitigationContact(
      LIT,
      '20000000-0000-4000-8000-00000000dead',
    );
    expect(removed).toBe(false);
  });
});
