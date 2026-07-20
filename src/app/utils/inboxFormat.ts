/**
 * Pure formatting helpers for the Inbox (Phase 5 §7.2).
 *
 * Priority is derived from the real first-contact SLA (no fabricated "match
 * score"): a case past its due time is high, one due within 6h is medium,
 * everything else is unflagged. Age + hours are compact, locale-free strings.
 */

const H = 3600_000;

export type InboxPriority = 'high' | 'medium' | 'none';

/**
 * Priority from the first-contact SLA. Overdue → high, due within 6h → medium.
 *
 * Only ever flags a case still awaiting the firm's decision. `status` is
 * required for a reason: cases.contacted_at is declared but has no writer and
 * no reader anywhere in the codebase, so the SLA clock has no stop button —
 * judged on the due date alone, every routed case reads "overdue to make first
 * contact" forever, including one where the attorney has already sent a demand
 * letter. Accepting a case is the only signal we actually have that someone
 * picked it up, so acceptance clears the flag. This mirrors the proxy
 * cases/agenda.ts:160 already uses (status 'new' → check the due date; past
 * that → staleness on last activity).
 *
 * Passing status is a required argument rather than an optional one so a new
 * caller has to decide, instead of silently re-introducing the bug this
 * replaced. When contacted_at grows a real writer, this becomes a genuine
 * "contacted?" check and the proxy goes away.
 */
export function priorityForSla(
  firstContactDue: string | null,
  status: string,
  now: number = Date.now(),
  contactedAt: string | null = null,
): InboxPriority {
  // First contact logged satisfies the SLA outright — this is the real
  // signal the 'new'-status proxy was standing in for. Once contacted_at is
  // set, the flag clears regardless of status or due date.
  if (contactedAt) return 'none';
  if (status !== 'new') return 'none';
  if (!firstContactDue) return 'none';
  const due = Date.parse(firstContactDue);
  if (Number.isNaN(due)) return 'none';
  if (due <= now) return 'high';
  if (due - now <= 6 * H) return 'medium';
  return 'none';
}

/** Compact relative age: "just now", "12m ago", "3h ago", "2d ago". */
export function relativeAge(iso: string | null, now: number = Date.now()): string {
  if (!iso) return '—';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const mins = Math.max(0, Math.floor((now - t) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** "6h" / "2d" / "—" for the response-time KPI (median hours; null/0 → dash). */
export function formatHours(hours: number | null | undefined): string {
  if (hours == null || hours <= 0) return '—';
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}
