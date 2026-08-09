/**
 * Ada Spot — summarize the analyzer's bounding box across repeated runs.
 *
 * Ten runs of one bathroom photo produced curb boxes whose top edge ranged
 * 0.72–0.85 with no code change at all. That spread is wider than most of the
 * differences we were judging from single screenshots, which is how several
 * "fixes" looked convincing and changed nothing. This module replaces that with
 * counts: across N runs of the SAME photo, how many put the concern inside the
 * box, and how far the box wanders on its own.
 *
 * Containment is the grounding metric. Spread is the noise floor — a change
 * that moves the box less than the spread has not been shown to do anything.
 *
 * Findings are matched across runs by ADA SECTION, never by title. The
 * analyzer rewords titles every run — the same shower curb has appeared under
 * seven different names across thirteen stored runs — so any key derived from
 * the prose silently reports a finding as missing when it was actually there.
 * The section is stable (all thirteen cite 608.7) and never empty (0 of 371
 * stored findings lack one). Where several findings in one run share a section
 * (4.5% of section groups, worst case three) they are disambiguated by title
 * word overlap, and every matched title is returned so a bad match is visible
 * rather than silent.
 *
 * Pure and deterministic; the model never runs here. Ref: /plan repeat-run.
 */

import type { PhotoBoundingBox } from '../../types/db.js';
import { boxContains, type Point } from './boxAccuracy.js';

export interface PreviewFindingBox {
  title: string;
  /** The cited ADA section — the stable identity key across runs. */
  standard: string;
  box?: PhotoBoundingBox | null;
}

/** The stored finding being tracked across runs. */
export interface TrackedFinding {
  standard: string;
  /** Only used to disambiguate a same-section collision, never to match. */
  title: string;
}

/** One analyzer run's findings. */
export interface PreviewRun {
  findings: PreviewFindingBox[];
}

export interface RunSummary {
  /** The section used to match the finding across runs. */
  standard: string;
  /** The title each matched run used — reveals rewording and bad matches. */
  matchedTitles: string[];
  /** Runs in which a finding citing the tracked section appeared. */
  matchedRuns: number;
  /** Runs where the finding appeared but was absent — the analyzer skipped it. */
  missingRuns: number;
  /** Of the matched runs, how many carried a bounding box. */
  boxedRuns: number;
  /**
   * How many boxed runs contained the ground-truth point. Null without a truth
   * point (nothing to contain) — never silently reported as zero.
   */
  containment: { inside: number; total: number } | null;
  /** Spread of the box's top edge across boxed runs. Null when none were boxed. */
  ySpread: { min: number; max: number; range: number } | null;
  /** Every observed box top edge, in run order — the raw evidence. */
  observedY: number[];
}

const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/** Sections differ only cosmetically between runs (a stray section sign or space). */
function normalizeSection(s: string): string {
  return s.replace(/[§\s]/g, '').toLowerCase();
}

/** Words worth comparing — short filler carries no identifying signal. */
function titleWords(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3),
  );
}

function overlapScore(a: string, b: string): number {
  const wa = titleWords(a);
  let hits = 0;
  for (const w of titleWords(b)) if (wa.has(w)) hits++;
  return hits;
}

/**
 * Match a whole set of tracked findings across runs, assigning EXCLUSIVELY:
 * within a run, no two tracked findings may claim the same reported finding.
 *
 * This matters because sections collide. Lavatory knee clearance and lavatory
 * faucet both cite 606. Matched independently, both claimed the run's single
 * 606 finding, so the faucet row rendered the cabinet's boxes and titles
 * verbatim — a fabricated 5-of-5 for a finding that appeared 0 of 5. A
 * fabricated match is worse than a missing one: it reports stability that was
 * never measured.
 *
 * Assignment is greedy by best title overlap, highest-scoring pair first, so
 * the clearest match wins regardless of list order. Anything left unassigned
 * counts as missing for that run.
 */
export function summarizeTrackedFindings(
  runs: readonly PreviewRun[],
  tracked: readonly TrackedFinding[],
  truth: Point | undefined,
): RunSummary[] {
  const matched: PreviewFindingBox[][] = tracked.map(() => []);
  const missing: number[] = tracked.map(() => 0);

  for (const run of runs) {
    const takenCandidate = new Set<number>();
    const assignedTracked = new Set<number>();

    // Score every (tracked, candidate) pair that shares a section.
    const pairs: { t: number; c: number; score: number }[] = [];
    tracked.forEach((t, ti) => {
      const wanted = normalizeSection(t.standard);
      run.findings.forEach((f, ci) => {
        if (normalizeSection(f.standard) !== wanted) return;
        pairs.push({ t: ti, c: ci, score: overlapScore(t.title, f.title) });
      });
    });

    // Best overlap first; ties fall back to list order for determinism.
    pairs.sort((a, b) => b.score - a.score || a.t - b.t || a.c - b.c);

    for (const p of pairs) {
      if (assignedTracked.has(p.t) || takenCandidate.has(p.c)) continue;
      assignedTracked.add(p.t);
      takenCandidate.add(p.c);
      matched[p.t].push(run.findings[p.c]);
    }

    tracked.forEach((_, ti) => {
      if (!assignedTracked.has(ti)) missing[ti]++;
    });
  }

  return tracked.map((t, ti) => buildSummary(t, matched[ti], missing[ti], truth));
}

/** Single-finding convenience wrapper. No collisions are possible with one. */
export function summarizeRuns(
  runs: readonly PreviewRun[],
  tracked: TrackedFinding,
  truth: Point | undefined,
): RunSummary {
  return summarizeTrackedFindings(runs, [tracked], truth)[0];
}

function buildSummary(
  tracked: TrackedFinding,
  matched: readonly PreviewFindingBox[],
  missingRuns: number,
  truth: Point | undefined,
): RunSummary {
  const boxed = matched.filter((f): f is PreviewFindingBox & { box: PhotoBoundingBox } =>
    Boolean(f.box),
  );
  const observedY = boxed.map((f) => f.box.y);

  return {
    standard: tracked.standard,
    matchedTitles: matched.map((f) => f.title),
    matchedRuns: matched.length,
    missingRuns,
    boxedRuns: boxed.length,
    containment:
      truth && boxed.length > 0
        ? { inside: boxed.filter((f) => boxContains(f.box, truth)).length, total: boxed.length }
        : null,
    ySpread:
      observedY.length > 0
        ? {
            min: round3(Math.min(...observedY)),
            max: round3(Math.max(...observedY)),
            range: round3(Math.max(...observedY) - Math.min(...observedY)),
          }
        : null,
    observedY,
  };
}
