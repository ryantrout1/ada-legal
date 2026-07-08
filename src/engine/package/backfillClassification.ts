/**
 * backfillClassificationFromLitigation — completion-time safety net.
 *
 * The summary package, the self-help email, and case routing are all gated
 * (in finalizeTurn) on the session carrying a classification, which Ada sets
 * by choosing to call `set_classification`. On a litigation-match run Ada can
 * bind a litigation and end the session WITHOUT classifying — leaving the
 * session complete but with no readout, no routed case, and no notification
 * (the whole point of the match). See the Niles v. Hilton repro.
 *
 * A confirmed litigation binding is itself a complete, routable intake, so
 * when classification is missing we derive one from the matched litigation.
 * This is deterministic — it does not depend on the model remembering to
 * classify. It's a no-op when Ada already classified or when no litigation
 * is bound, so the normal path is unchanged.
 *
 * Routing ignores the title (decideLane routes on the litigation binding),
 * so the derived title only affects how the readout renders: a `class`
 * litigation reads as a class action; the enforcement/decree/pattern kinds
 * read as a Title III public-accommodation matter (the common private-
 * claimant case). Both are actionable.
 *
 * Ref: /triage — litigation-matched intake completes with no classification.
 */

import type { AdaSessionState } from '../types.js';
import type { DbClient, LitigationKind } from '../clients/types.js';
import type { AdaTitle } from '../../types/db.js';

function titleForLitigation(kind: LitigationKind): AdaTitle {
  return kind === 'class' ? 'class_action' : 'III';
}

export async function backfillClassificationFromLitigation(
  db: Pick<DbClient, 'getLitigationById'>,
  state: AdaSessionState,
): Promise<AdaSessionState> {
  // No-op: already classified, or nothing to derive from.
  if (state.classification || !state.litigationListingId) return state;

  const litigation = await db.getLitigationById(state.litigationListingId);
  if (!litigation) return state; // can't derive — leave for the silent-guard log.

  return {
    ...state,
    classification: {
      title: titleForLitigation(litigation.kind),
      tier: 'medium',
      standard: litigation.legalTheory ?? 'n/a',
      reasoning:
        `Derived from the matched litigation "${litigation.caseName}" — you confirmed ` +
        `you want to be considered for this action, so the intake is routed on that basis.`,
    },
  };
}
