/**
 * runSessionQualityCheck — deterministic post-completion scoring.
 *
 * Takes a session state that has just transitioned to 'completed' and
 * evaluates a set of rule-based checks. Returns failures and warnings.
 * This is intentionally simple + synchronous for Ch0 — no AI calls, no
 * network, no timing issues. Step 14 minimal scope per Option A.
 *
 * Later iterations can add Haiku-based scoring (e.g. "did Ada actually
 * answer the user's question") as additional async checks. This module
 * is the boundary where those would plug in.
 *
 * Ref: docs/ARCHITECTURE.md §14 — observability + quality
 */

import type { AdaSessionState } from '../types.js';
import type {
  QualityCheckFailure,
  QualityCheckWarning,
} from '../../types/db.js';

export interface SessionQualityCheckResult {
  passed: boolean;
  failures: QualityCheckFailure[];
  warnings: QualityCheckWarning[];
}

/**
 * Run the full deterministic check suite over a completed session.
 *
 * Returned shape matches the session_quality_checks columns so the
 * caller can pass it straight to the DB.
 */
export function runSessionQualityCheck(
  state: AdaSessionState,
): SessionQualityCheckResult {
  const failures: QualityCheckFailure[] = [];
  const warnings: QualityCheckWarning[] = [];

  // ── FAILURES ──────────────────────────────────────────────────────────────

  if (state.classification === null || state.classification === undefined) {
    failures.push({
      code: 'no_classification',
      message:
        'Session completed without a classification. Ada should call ' +
        'set_classification before ending every session.',
    });
  }

  const extractedCount = Object.keys(state.extractedFields ?? {}).length;
  if (extractedCount === 0) {
    failures.push({
      code: 'no_extracted_fields',
      message:
        'Session completed with zero extracted fields. Expected at least ' +
        'facility_type, state, and incident_date for most ADA topics.',
      details: { extractedCount },
    });
  }

  const userMessageCount = (state.conversationHistory ?? []).filter(
    (m) => m.role === 'user',
  ).length;
  if (userMessageCount < 2) {
    failures.push({
      code: 'conversation_too_short',
      message:
        'Fewer than 2 user messages before completion — likely a ' +
        'dropout misclassified as completion.',
      details: { userMessageCount },
    });
  }

  // ── WARNINGS ──────────────────────────────────────────────────────────────

  const toolNames = new Set<string>();
  for (const msg of state.conversationHistory ?? []) {
    for (const tc of msg.tool_calls ?? []) toolNames.add(tc.name);
  }
  if (toolNames.size === 0) {
    warnings.push({
      code: 'no_tool_use',
      message:
        'Session completed without any tool calls. Ada typically uses ' +
        'at least extract_field and set_classification.',
    });
  }

  const metadataKeys = Object.keys(state.metadata ?? {});
  if (metadataKeys.length === 0) {
    warnings.push({
      code: 'missing_metadata',
      message:
        'metadata JSONB is empty. Step 14 expects turn-count, latency, ' +
        'and tool-usage observability to be populated.',
    });
  }

  const a11yKeys = Object.keys(state.accessibilitySettings ?? {});
  if (a11yKeys.length === 0) {
    warnings.push({
      code: 'missing_accessibility_settings',
      message:
        'accessibility_settings is empty. Expected at minimum a ' +
        'reading_level snapshot when the session ends.',
    });
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings,
  };
}
