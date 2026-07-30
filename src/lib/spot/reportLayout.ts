/**
 * How a Spot report is arranged, decided before anything renders it.
 *
 * The old view drew four identical cards. But the findings in a report split
 * on something the reader cares about more than severity does: whether the
 * photograph settled the question. `composeReport` already records it —
 * `hedged = confirmable === false` — and the old view used it only to print a
 * one-line footnote at the bottom of a card.
 *
 * That split is the difference between "move these bins" and "go measure the
 * threshold", and it is what turns a list of assertions into something a
 * person can act on. Severity says how bad; `hedged` says whether we know.
 * On a report where three of four findings are explicitly unresolved, the
 * second question is the more useful one.
 *
 * This module is pure and has no React in it, deliberately. The repo has no
 * render testing — no @testing-library/react, vitest runs on `node` — so
 * anything left in the component can only be verified by eye. Pulling the
 * decisions out here means the part that can be wrong is the part under test,
 * and the component keeps only markup.
 *
 * Ref: /plan Spot report redesign, phase 1.
 */

import type { SpotReportItem } from './reportSchema.js';

export interface FindingGroups {
  /** The photograph settled these. Actionable without going anywhere. */
  confirmed: SpotReportItem[];
  /** The photograph could not settle these. Each needs someone on site. */
  unconfirmed: SpotReportItem[];
}

/**
 * Split findings on whether the photo settled them, preserving order.
 *
 * Every item lands in exactly one group. A partition rather than two filters
 * so an item cannot be dropped by a predicate that fails to match — a finding
 * somebody paid for silently not rendering is the worst outcome available
 * here, and it would look exactly like a shorter report.
 */
export function groupFindings(items: readonly SpotReportItem[]): FindingGroups {
  const confirmed: SpotReportItem[] = [];
  const unconfirmed: SpotReportItem[] = [];
  for (const item of items) {
    (item.hedged ? unconfirmed : confirmed).push(item);
  }
  return { confirmed, unconfirmed };
}

/** Spelled out to nine; past that the digits read better than the words. */
const NUMBER_WORDS = [
  'Zero',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
] as const;

function count(n: number): string {
  return n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : String(n);
}

/**
 * One sentence telling the reader the shape of what follows.
 *
 * Derived from the counts, never written by the model and never stored — so
 * it cannot drift from the findings it describes.
 *
 * The wording is deliberately "fix" and "measure" rather than anything
 * naming a barrier. The items carry labels like "Possible barrier"; a summary
 * that hardened that into a determination would be the report certifying,
 * which this product never does.
 *
 * Returns null when there is nothing to summarise. A `clear` report already
 * says so in its own headline, and "Zero things to fix." underneath it would
 * be a second and weaker version of the same claim.
 */
export function summaryLine(groups: FindingGroups): string | null {
  const fix = groups.confirmed.length;
  const measure = groups.unconfirmed.length;
  if (fix === 0 && measure === 0) return null;

  const parts: string[] = [];
  if (fix > 0) parts.push(`${count(fix)} thing${fix === 1 ? '' : 's'} to fix.`);
  if (measure > 0) {
    // "One thing to fix. Three to measure." — the noun is not repeated when
    // the first half already established it.
    const noun = fix > 0 ? '' : ` thing${measure === 1 ? '' : 's'}`;
    parts.push(`${count(measure)}${noun} to measure.`);
  }
  return parts.join(' ');
}
