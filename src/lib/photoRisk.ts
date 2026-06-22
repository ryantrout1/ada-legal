import type { PhotoFinding, PhotoOverallRisk } from '../types/db.js';

/**
 * Deterministic overall_risk roll-up, computed in code — NOT emitted by the
 * model. Risk is driven only by CONFIRMABLE findings: a concern the analyzer
 * could not establish from the photo (confirmable:false) is surfaced as
 * needs-on-site-verification but never inflates the risk score above low.
 *
 *   high   — any confirmable critical or major finding
 *   medium — (no high) any confirmable minor finding
 *   low    — only advisory confirmable findings, and/or only unconfirmable
 *            findings of any severity
 *   none   — no findings at all
 *
 * This replaces the model's self-reported overall_risk, which was both
 * inconsistent across runs and prone to inflating risk on findings the model
 * itself could not confirm. The enum is unchanged, so every consumer
 * (review queues, admin risk filter, attorney package) is unaffected.
 */
export function computeOverallRisk(findings: PhotoFinding[]): PhotoOverallRisk {
  if (findings.length === 0) return 'none';
  const confirmable = findings.filter((f) => f.confirmable);
  if (
    confirmable.some((f) => f.severity === 'critical' || f.severity === 'major')
  ) {
    return 'high';
  }
  if (confirmable.some((f) => f.severity === 'minor')) return 'medium';
  return 'low';
}
