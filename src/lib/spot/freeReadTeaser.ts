/**
 * Ada Spot — the free read, reduced to a teaser (pure).
 *
 * The free read used to return the whole analyzer output. Everything the paid
 * report sells — the explanation of each barrier, the rule it points to, what
 * to do about it — was already on the visitor's screen, so the report had
 * nothing left to offer. This is the boundary that fixes that: a few names, an
 * honest count of what is being held back, and nothing else.
 *
 * What it withholds is content, never the truth about the read. A teaser may
 * decline to say WHAT the other barriers are; it may not imply barriers exist
 * when they do not, nor hide that the photo could not be read at all. So the
 * three integrity rules survive intact:
 *
 *   - Absence-honesty: zero findings is 'clear' — no count, no "unlock the
 *     rest", because there is no rest. A model that never returned a tool call
 *     is 'no_read' and gets a retry prompt, never an all-clear.
 *   - Hedge-don't-drop: a shown row that needs on-site confirmation keeps its
 *     hedged flag, so the free read never overstates its own certainty.
 *   - Never certify: this layer emits names and severities only; the screening
 *     labels live in SPOT_SEVERITY_LABEL as before.
 *
 * Deliberately NOT a variant of mapSpotFindings: that one still serves the
 * admin free-read detail page, where Ryan and Gina need to see everything the
 * analyzer said. Two audiences, two mappers, no shared truncation flag that
 * could be passed wrong and quietly blind the reviewers.
 *
 * Pure + deterministic — same analysis, same teaser, every time.
 */

import type {
  PhotoAnalysisOutput,
  PhotoFinding,
  PhotoFindingSeverity,
} from '../../types/db.js';

/**
 * How many barriers the free read names.
 *
 * Three, not all of them: the names are what proves the read actually worked,
 * but a full list of ten leaves nothing worth paying for. Three is enough to
 * be credible and short enough to stay a teaser.
 */
export const FREE_READ_TEASER_MAX = 3;

/**
 * One named barrier. A title, how serious it is, and whether it needs
 * confirming on site.
 *
 * Pointedly missing: the explanation, the ADA section, and the fix. Those are
 * the report. A field added here is the paywall leaking one column at a time,
 * which is why freeReadTeaser.test.ts asserts the exact key set.
 */
export interface FreeReadTeaserItem {
  title: string;
  severity: PhotoFindingSeverity;
  /** True when the model could not fully assess this from the photo. */
  hedged: boolean;
}

export interface FreeReadTeaser {
  kind: 'no_read' | 'clear' | 'findings';
  /** What the photo shows ("a residential bathroom") — names no barrier. */
  scene?: string;
  /** The named barriers, most serious first. At most FREE_READ_TEASER_MAX. */
  shown: FreeReadTeaserItem[];
  /** How many distinct barriers are being held back. */
  withheldCount: number;
  /** Distinct barriers found in total. shown.length + withheldCount. */
  totalCount: number;
}

/** Most serious first. Matches the order the report itself presents. */
const SEVERITY_RANK: Record<PhotoFindingSeverity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
  advisory: 3,
};

/**
 * Sections differ only cosmetically between runs (a stray section sign or
 * space) — same normalization pinFromBox uses to match findings across runs.
 */
function normalizeSection(s: string): string {
  return s.replace(/[§\s]/g, '').toLowerCase();
}

/**
 * Collapse findings that describe the SAME barrier.
 *
 * The analyzer will sometimes cite one section twice — "curb at the shower"
 * and "raised threshold into shower" are one curb, described twice. Counting
 * that as two inflates the "and N more" promise the paid report then has to
 * keep, which is the one number in this teaser that could read as a bait.
 * Section is the identity key here for the same measured reason pinFromBox
 * uses it: titles vary run to run, sections do not.
 *
 * A finding citing no section is kept distinct — with no key there is no
 * evidence it duplicates anything, and collapsing them would UNDER-count,
 * hiding a real barrier from the total.
 */
function dedupeBySection(findings: readonly PhotoFinding[]): PhotoFinding[] {
  const bySection = new Map<string, PhotoFinding>();
  const unkeyed: PhotoFinding[] = [];

  for (const f of findings) {
    const key = normalizeSection(f.standard ?? '');
    if (!key) {
      unkeyed.push(f);
      continue;
    }
    const held = bySection.get(key);
    // Keep the most serious wording of the barrier; confidence breaks a tie.
    // Same precedence pinFromBox applies when several findings share a
    // section, so the two never disagree about which finding "is" the barrier.
    if (
      !held ||
      SEVERITY_RANK[f.severity] < SEVERITY_RANK[held.severity] ||
      (f.severity === held.severity && f.confidence > held.confidence)
    ) {
      bySection.set(key, f);
    }
  }

  return [...bySection.values(), ...unkeyed];
}

function toItem(f: PhotoFinding): FreeReadTeaserItem {
  return {
    title: f.title_standard,
    severity: f.severity,
    hedged: f.confirmable === false,
  };
}

/**
 * Build the teaser the free read returns.
 *
 * `max` is injectable for tests only; callers should take the default so the
 * product has one answer to "how much is free".
 */
export function buildFreeReadTeaser(
  output: PhotoAnalysisOutput,
  opts: { max?: number } = {},
): FreeReadTeaser {
  const max = opts.max ?? FREE_READ_TEASER_MAX;
  const scene = output.scene?.standard || undefined;

  // Absence-honesty: an explicit refusal is never dressed up as a read.
  if (output.meta && output.meta.tool_call_present === false) {
    return { kind: 'no_read', shown: [], withheldCount: 0, totalCount: 0 };
  }

  const distinct = dedupeBySection(output.findings ?? []);
  if (distinct.length === 0) {
    // Nothing found means nothing withheld. A count here would invent a
    // paywall over content that does not exist.
    return { kind: 'clear', scene, shown: [], withheldCount: 0, totalCount: 0 };
  }

  // Most serious first, stable within a severity so the model's own ordering
  // breaks ties rather than something arbitrary.
  const ordered = distinct
    .map((f, i) => ({ f, i }))
    .sort((a, b) => {
      const bySeverity = SEVERITY_RANK[a.f.severity] - SEVERITY_RANK[b.f.severity];
      return bySeverity !== 0 ? bySeverity : a.i - b.i;
    })
    .map(({ f }) => f);

  const shown = ordered.slice(0, max).map(toItem);

  return {
    kind: 'findings',
    scene,
    shown,
    withheldCount: ordered.length - shown.length,
    totalCount: ordered.length,
  };
}
