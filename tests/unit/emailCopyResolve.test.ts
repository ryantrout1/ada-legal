/**
 * Resolving a slot to the words that actually go out.
 *
 * The chain is stored row, then the default for that reading level, then
 * the standard default. It never yields an empty string, because every
 * link in that chain ends at a sentence a person wrote. An empty return
 * would reach a claimant as a missing line, which is worse than wording
 * nobody has got round to editing.
 *
 * An unknown template or slot throws instead of returning empty. That is
 * a wiring mistake, not a content state, and the loud version of it costs
 * a failing test while the quiet version costs a blank paragraph in
 * somebody's inbox.
 *
 * Ref: /plan editable email copy — Phase 1, split. Phase 1d, AC3.
 */

import { describe, it, expect } from 'vitest';
import { loadCopy, copyFor, type CopyBundle } from '@/engine/email/resolveCopy';
import { EMAIL_TEMPLATES } from '@/engine/email/copySlots';
import { InMemoryDbClient } from '@/engine/clients/inMemoryClients';

const ORG = '00000000-0000-4000-8000-000000000001';

function bundle(entries: Record<string, string> = {}): CopyBundle {
  return new Map(Object.entries(entries));
}

describe('falling back', () => {
  it('uses the code default when nobody has edited', () => {
    expect(copyFor(bundle(), 'routing_user_connected', 'cta_label', 'standard')).toBe(
      'View your summary',
    );
  });

  it('uses the stored row when someone has', () => {
    expect(
      copyFor(
        bundle({ 'cta_label:standard': 'See what we sent' }),
        'routing_user_connected',
        'cta_label',
        'standard',
      ),
    ).toBe('See what we sent');
  });

  it('picks the right reading level out of the defaults', () => {
    expect(copyFor(bundle(), 'claimant_handoff', 'summary_heading', 'simple')).toBe(
      'What we talked about',
    );
    expect(copyFor(bundle(), 'claimant_handoff', 'summary_heading', 'professional')).toBe(
      'Summary of intake',
    );
  });

  it('edits one reading level without disturbing the others', () => {
    const b = bundle({ 'summary_heading:standard': 'What you told us' });
    expect(copyFor(b, 'claimant_handoff', 'summary_heading', 'standard')).toBe('What you told us');
    expect(copyFor(b, 'claimant_handoff', 'summary_heading', 'simple')).toBe(
      'What we talked about',
    );
  });

  it('falls back to standard when a level was never stored or defaulted', () => {
    // A flat slot has one default. Asking for it at simple must still
    // return that sentence rather than nothing.
    expect(copyFor(bundle(), 'spot_release', 'heading', 'simple')).toBe(
      'Your screening is ready',
    );
  });

  it('ignores a blank stored value rather than sending an empty line', () => {
    // The write guard refuses blanks, so this should be unreachable. It
    // is covered anyway: a row that got in another way must not be able
    // to blank out a sentence.
    expect(
      copyFor(bundle({ 'cta_label:standard': '   ' }), 'routing_user_connected', 'cta_label', 'standard'),
    ).toBe('View your summary');
  });

  it('never returns empty for any slot at any level', () => {
    for (const tpl of EMAIL_TEMPLATES) {
      for (const slot of tpl.slots) {
        for (const level of ['simple', 'standard', 'professional'] as const) {
          const out = copyFor(bundle(), tpl.key, slot.key, level);
          expect(out.trim().length, `${tpl.key}.${slot.key} (${level}) resolved to nothing`)
            .toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('wiring mistakes are loud', () => {
  it('throws on a template nobody registered', () => {
    expect(() => copyFor(bundle(), 'not_a_template', 'subject', 'standard')).toThrow(
      /not_a_template/,
    );
  });

  it('throws on a slot the template does not have', () => {
    expect(() => copyFor(bundle(), 'spot_release', 'not_a_slot', 'standard')).toThrow(/not_a_slot/);
  });
});

describe('loading a bundle', () => {
  it('is empty when nobody has edited', async () => {
    const db = new InMemoryDbClient();
    const b = await loadCopy(db, ORG, 'claimant_handoff');
    expect(b.size).toBe(0);
    expect(copyFor(b, 'claimant_handoff', 'summary_heading', 'standard')).toBe('What we discussed');
  });

  it('carries only the template asked for', async () => {
    const db = new InMemoryDbClient();
    await db.upsertEmailCopy({
      orgId: ORG,
      templateKey: 'claimant_handoff',
      slotKey: 'summary_heading',
      readingLevel: 'standard',
      value: 'What you told us',
    });
    await db.upsertEmailCopy({
      orgId: ORG,
      templateKey: 'spot_release',
      slotKey: 'heading',
      readingLevel: 'standard',
      value: 'Ready',
    });

    const b = await loadCopy(db, ORG, 'claimant_handoff');
    expect(b.size).toBe(1);
    expect(copyFor(b, 'claimant_handoff', 'summary_heading', 'standard')).toBe('What you told us');
  });

  it('survives the database being down rather than blocking an email', async () => {
    // An email that goes out with default wording beats an email that
    // does not go out. The send paths already soft-fail; this keeps the
    // copy load from being the thing that breaks them.
    const db = new InMemoryDbClient();
    db.getEmailCopy = async () => {
      throw new Error('db down');
    };
    const b = await loadCopy(db, ORG, 'claimant_handoff');
    expect(b.size).toBe(0);
    expect(copyFor(b, 'claimant_handoff', 'summary_heading', 'standard')).toBe('What we discussed');
  });
});
