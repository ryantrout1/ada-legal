/**
 * Pipeline analytics math (Phase 4c).
 *
 * Turns the firm's cases + their transition activity into:
 *   - a funnel (how many cases reached each board stage), and
 *   - median time-in-stage (how long, typically, a case sits in a stage before
 *     moving on).
 *
 * Pure and deterministic — the neon / in-memory methods just hand it rows. Stage
 * entry is read from the activity log (ROUTED/ACCEPT/SEND_DEMAND/BEGIN_NEGOTIATION/RESOLVE), with
 * the case's createdAt standing in for "entered New". The earliest event of each
 * type wins, so replays / duplicates don't skew the numbers.
 */

export interface PipelineStageCounts {
  new: number;
  accepted: number;
  working: number;
  resolved: number;
}

// Legacy stat keys retained for the funnel shape: 'accepted' now tracks the
// ACCEPT→investigating milestone, 'working' the SEND_DEMAND→demand_sent one.
export type TimedStage = 'new' | 'accepted' | 'working';

export interface PipelineStats {
  stageCounts: PipelineStageCounts;
  timeInStage: { stage: TimedStage; medianHours: number; n: number }[];
  /** Cases whose first ACCEPT fell within the last 7 days (inbox KPI). */
  acceptedThisWeek: number;
}

interface CaseInput {
  id: string;
  createdAt: string;
}
interface EventInput {
  caseId: string;
  eventType: string;
  createdAt: string;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const m = sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
  return Math.round(m * 10) / 10;
}

export function computePipelineStats(
  cases: CaseInput[],
  events: EventInput[],
  now: number = Date.now(),
): PipelineStats {
  // Earliest timestamp of each transition type, per case.
  const firstEvent = new Map<string, Map<string, number>>();
  for (const e of events) {
    const t = Date.parse(e.createdAt);
    if (Number.isNaN(t)) continue;
    let perCase = firstEvent.get(e.caseId);
    if (!perCase) {
      perCase = new Map();
      firstEvent.set(e.caseId, perCase);
    }
    const existing = perCase.get(e.eventType);
    if (existing === undefined || t < existing) perCase.set(e.eventType, t);
  }

  const has = (caseId: string, type: string) => firstEvent.get(caseId)?.has(type) ?? false;

  const stageCounts: PipelineStageCounts = {
    new: cases.length,
    accepted: cases.filter((c) => has(c.id, 'ACCEPT')).length,
    working: cases.filter((c) => has(c.id, 'SEND_DEMAND')).length,
    resolved: cases.filter((c) => has(c.id, 'RESOLVE')).length,
  };

  const newDur: number[] = [];
  const acceptedDur: number[] = [];
  const workingDur: number[] = [];
  const H = 3600_000;

  for (const c of cases) {
    const ev = firstEvent.get(c.id);
    const created = Date.parse(c.createdAt);
    const accept = ev?.get('ACCEPT');
    const begin = ev?.get('SEND_DEMAND');
    const resolve = ev?.get('RESOLVE');

    if (accept !== undefined && !Number.isNaN(created) && accept >= created) {
      newDur.push((accept - created) / H);
    }
    if (accept !== undefined && begin !== undefined && begin >= accept) {
      acceptedDur.push((begin - accept) / H);
    }
    if (begin !== undefined && resolve !== undefined && resolve >= begin) {
      workingDur.push((resolve - begin) / H);
    }
  }

  // Cases first accepted within the last 7 days (inbox "Accepted this week" KPI).
  const weekAgo = now - 7 * 24 * H;
  let acceptedThisWeek = 0;
  for (const c of cases) {
    const accept = firstEvent.get(c.id)?.get('ACCEPT');
    if (accept !== undefined && accept >= weekAgo && accept <= now) acceptedThisWeek++;
  }

  return {
    stageCounts,
    timeInStage: [
      { stage: 'new', medianHours: median(newDur), n: newDur.length },
      { stage: 'accepted', medianHours: median(acceptedDur), n: acceptedDur.length },
      { stage: 'working', medianHours: median(workingDur), n: workingDur.length },
    ],
    acceptedThisWeek,
  };
}
