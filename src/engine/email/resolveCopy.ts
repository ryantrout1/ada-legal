/**
 * Turning a slot into the words that go out.
 *
 * Two pieces on purpose. `loadCopy` touches the database and is async.
 * `copyFor` is pure and synchronous, and it is the one the renderers
 * call. That split is what keeps the renderers side-effect-free, which
 * their own headers promise and which every existing caller and all 101
 * of their assertions depend on. A resolver awaited inside a renderer
 * would have turned one render into a dozen queries and made every
 * caller async for no gain.
 *
 * So the shape is: load the bundle once at the send site, then render.
 *
 * THE CHAIN. Stored row, then the default for that reading level, then
 * the standard default. Every link ends at a sentence somebody wrote, so
 * the result is never empty — an empty return reaches a claimant as a
 * missing line, which is worse than wording nobody has edited yet.
 *
 * WIRING MISTAKES THROW. An unknown template or slot is a bug in the
 * code, not a state the content can be in. Loud costs a failing test;
 * quiet costs a blank paragraph in somebody's inbox.
 *
 * Ref: /plan editable email copy — Phase 1, split. Phase 1d.
 */

import type { DbClient } from '../clients/types.js';
import type { ReadingLevel } from '../../types/db.js';
import { EMAIL_TEMPLATES, type LeveledText } from './copySlots.js';

/** Edited slots for one template, keyed `slotKey:readingLevel`. */
export type CopyBundle = ReadonlyMap<string, string>;

const EMPTY: CopyBundle = new Map();

/**
 * Edited copy for one template, or an empty bundle.
 *
 * Soft-fails. The send paths this feeds already swallow transport
 * errors so a Resend outage never throws; a copy read failing should not
 * be the one thing that stops an email, when falling back to the wording
 * in the code is a perfectly good answer.
 */
export async function loadCopy(
  db: Pick<DbClient, 'getEmailCopy'>,
  orgId: string,
  templateKey: string,
): Promise<CopyBundle> {
  try {
    const rows = await db.getEmailCopy(orgId, templateKey);
    return new Map(rows.map((r) => [`${r.slotKey}:${r.readingLevel}`, r.value]));
  } catch (err) {
    console.error(`email copy load failed for ${templateKey}, using defaults`, err);
    return EMPTY;
  }
}

function isBlank(v: string | undefined): v is undefined {
  return v === undefined || v.trim().length === 0;
}

/**
 * The words for one slot. Never empty.
 *
 * `bundle` holds only the template's own slots, so the caller cannot
 * accidentally read one template's wording into another.
 */
export function copyFor(
  bundle: CopyBundle,
  templateKey: string,
  slotKey: string,
  readingLevel: ReadingLevel,
): string {
  const tpl = EMAIL_TEMPLATES.find((t) => t.key === templateKey);
  if (!tpl) throw new Error(`no email template registered as ${templateKey}`);
  const slot = tpl.slots.find((s) => s.key === slotKey);
  if (!slot) throw new Error(`${templateKey} has no slot ${slotKey}`);

  const stored = bundle.get(`${slotKey}:${readingLevel}`);
  if (!isBlank(stored)) return stored;

  if (typeof slot.default === 'string') return slot.default;

  const leveled = slot.default as LeveledText;
  // Standard is the backstop rather than an error: a varied slot is
  // guaranteed all three by emailCopyRegistry.test.ts, so reaching it
  // means a level was added to ReadingLevel and not to the registry —
  // in which case a real sentence beats a thrown one.
  return isBlank(leveled[readingLevel]) ? leveled.standard : leveled[readingLevel];
}
