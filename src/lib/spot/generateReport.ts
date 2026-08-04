/**
 * Ada Spot — report generation orchestration (Phase 3a).
 *
 * uploaded session's photos → batched vision (the analyzer caps at 3/call) →
 * composeAndPlaceReport (the shared synthesis + compose + place core) →
 * SpotReportContent.
 *
 * The compose+place half lives in composeAndPlaceReport so the /photo field
 * test shares the exact same pipeline (/plan). This function is now just the
 * analyze-then-delegate wrapper. Reuses the shared analyzer additively; writes
 * nothing here (the cron persists). Model is selectable (SPOT_REPORT_MODEL,
 * default Opus 4.8); the free read is a separate path and is unaffected.
 */

import type { AdaClients } from '../../engine/clients/types.js';
import type { PhotoAnalysisOutput } from '../../types/db.js';
import { SPOT_REPORT_DEFAULT_MODEL } from './parseRegenerateBody.js';
import type { PlaceFn } from './buildPhotoAnnotations.js';
import {
  composeAndPlaceReport,
  type GeneratedReport,
} from './composeAndPlaceReport.js';

/** The analyzer throws on > 3 blob keys — batch to its max. */
export const SPOT_REPORT_BATCH_SIZE = 3;
// Imported, not redeclared. This was its own literal, so the allowlist and the
// pipeline default were two constants that had to be kept in step by hand.
export { SPOT_REPORT_DEFAULT_MODEL };
// Re-export so existing consumers importing the type from here keep working.
export type { GeneratedReport } from './composeAndPlaceReport.js';

export interface GenerateReportInput {
  photos: { blobUrl: string }[];
  model?: string;
  /**
   * When true, also produce photo-bound pins (content.photoAnnotations).
   * Off by default; resolved from the spot_show_annotations flag by callers.
   */
  annotate?: boolean;
  /**
   * Injectable placement function (tests). When annotate is true and this is
   * omitted, the real Anthropic placer is built from the environment.
   */
  placeFn?: PlaceFn;
  /** Minimum placement confidence to draw a pin. Defaults to 0.5. */
  minConfidence?: number;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function generateReport(
  clients: AdaClients,
  input: GenerateReportInput,
): Promise<GeneratedReport> {
  if (input.photos.length === 0) throw new Error('no photos to analyze');

  // Batches are independent (each is its own vision call over its own
  // photos) — run them in parallel. `map` preserves batch order in the
  // resulting analyses array, so view-group numbering in the synthesis
  // prompt is unchanged. Any batch failure rejects the whole report,
  // same semantics as the previous sequential loop (the caller leaves
  // the session `uploaded` for retry).
  const analyses: PhotoAnalysisOutput[] = await Promise.all(
    chunk(input.photos.map((p) => p.blobUrl), SPOT_REPORT_BATCH_SIZE).map(
      async (batch) => (await clients.photo.analyze({ blobKeys: batch })).output,
    ),
  );

  // Everything after analyze — synthesis, compose, place — is the shared core.
  return composeAndPlaceReport(clients, {
    analyses,
    photos: input.photos,
    model: input.model,
    annotate: input.annotate,
    placeFn: input.placeFn,
    minConfidence: input.minConfidence,
  });
}
