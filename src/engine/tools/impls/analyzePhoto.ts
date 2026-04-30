/**
 * analyze_photo tool.
 *
 * Ada calls this after a user has uploaded photos (via the public UI's
 * photo upload, which stores to Vercel Blob and returns blob keys).
 * Delegates to PhotoAnalysisClient, which runs the photo-analysis prompt
 * against an Anthropic model.
 *
 * Up to 3 photos per call. The turn-loop is responsible for passing
 * blob_key values from the AdaTurnInput.photoBlobKeys array into the
 * tool; Ada only sees slugs or descriptions of available photos, never
 * raw URLs. If the user uploaded more than 3 photos in a session, Ada
 * should call this tool multiple times with different batches.
 *
 * Ref: docs/ARCHITECTURE.md §7, §10
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';
import type { PhotoAnalysisOutput, PhotoFinding } from '../../../types/db.js';
import { guideUrlForTopic, topicsForSection, topicsForText } from '../../../lib/standardsIndex.js';

const MAX_PHOTOS_PER_CALL = 3;

interface AnalyzePhotoInput {
  blob_keys: string[];
  context_hint?: string;
}

/**
 * Enrich a raw finding from the photo analyzer with a guide_url when
 * we can resolve one. Resolution order:
 *
 *   1. Try topicsForSection(finding.standard). The analyzer returns
 *      strings like "§405.2", "ADAAG §405", "2010 ADA Standards §604.8"
 *      — we extract the first §-token and match.
 *   2. If no section match, try topicsForText(finding.finding). This
 *      catches cases where the analyzer cites a rule that doesn't have
 *      a section number we index (e.g. "service animal") but the
 *      finding text mentions something we recognize.
 *
 * When neither matches, guide_url is left undefined. The finding
 * still ships to Ada and the attorney package — just without the
 * link-back convenience.
 */
function enrichFindingWithGuideUrl(f: PhotoFinding): PhotoFinding {
  const sectionMatch = /§\s*\d{3,4}(?:\.\d+)*/i.exec(f.standard ?? '');
  if (sectionMatch) {
    const hits = topicsForSection(sectionMatch[0].replace(/\s+/g, ''));
    if (hits.length > 0) {
      return { ...f, guide_url: guideUrlForTopic(hits[0]) };
    }
  }

  const textHits = topicsForText(`${f.finding} ${f.standard}`);
  if (textHits.length > 0) {
    return { ...f, guide_url: guideUrlForTopic(textHits[0]) };
  }

  return f;
}

export const analyzePhotoTool: AdaTool<AnalyzePhotoInput> = {
  name: 'analyze_photo',
  description:
    'Request photo analysis for one or more uploaded images (1-3 per call). ' +
    'Pass blob_keys for the photos you want analyzed together — the analyzer ' +
    'treats them as a batch and can reason about cross-photo compliance chains. ' +
    'If the user uploaded more than 3 photos, call this tool again with a different batch. ' +
    'Provide a context_hint describing what to look for (e.g. "physical barrier at entrance", ' +
    '"missing handrail on ramp"). Returns scene description, summary, overall risk, ' +
    'positive findings, and per-concern findings — each with three reading-level variants.',
  inputSchema: {
    type: 'object',
    properties: {
      blob_keys: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: MAX_PHOTOS_PER_CALL,
        description:
          'Blob keys for 1-3 photos. Provided in the conversation context. Group photos from the same site for cross-photo reasoning.',
      },
      context_hint: {
        type: 'string',
        description: "Optional hint about what to look for, e.g. 'doorway width', 'service counter height'.",
      },
    },
    required: ['blob_keys'],
  },
  validateInput(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('analyze_photo: input must be an object');
    }
    const r = raw as Record<string, unknown>;
    if (!Array.isArray(r.blob_keys) || r.blob_keys.length === 0) {
      throw new Error('analyze_photo: blob_keys must be a non-empty array');
    }
    if (r.blob_keys.length > MAX_PHOTOS_PER_CALL) {
      throw new Error(
        `analyze_photo: maximum ${MAX_PHOTOS_PER_CALL} photos per call. Group photos into batches of ${MAX_PHOTOS_PER_CALL} if user uploaded more.`,
      );
    }
    const blobKeys = r.blob_keys.map((k) => {
      if (typeof k !== 'string' || k.trim() === '') {
        throw new Error('analyze_photo: every blob_keys entry must be a non-empty string');
      }
      return k;
    });
    if (r.context_hint !== undefined && typeof r.context_hint !== 'string') {
      throw new Error('analyze_photo: context_hint, if provided, must be a string');
    }
    return {
      blob_keys: blobKeys,
      context_hint: typeof r.context_hint === 'string' ? r.context_hint : undefined,
    };
  },
  async execute({ clients, state }: ToolExecuteContext, input): Promise<ToolResult> {
    try {
      // Cache check — if we already analyzed this exact blob_keys batch
      // earlier in the session, return the prior output instead of
      // re-running the ~10–18s vision call. Cache keying is order-
      // independent (same photos in any order = same analysis) and
      // exact-match (subset of a prior batch is NOT a hit, since
      // cross-photo reasoning differs).
      const cached = findCachedAnalysis(state.metadata.photo_analyses, input.blob_keys);
      if (cached) {
        // Return the cached output. No state change — the analysis is
        // already in metadata.photo_analyses, photoFindings/photoAnalyses
        // for this turn would just re-list what's already there.
        return {
          ok: true,
          content: {
            output: cached,
            model: 'cached',
          },
        };
      }

      const result = await clients.photo.analyze({
        blobKeys: input.blob_keys,
        contextHint: input.context_hint,
      });
      // Enrich each finding with a guide_url when we can resolve the
      // cited standard against the Standards Guide index. Findings ship
      // to Ada (in her next-turn context) and downstream to the
      // attorney package / session package via stateChanges.
      const enrichedFindings = result.output.findings.map(enrichFindingWithGuideUrl);
      const enrichedOutput: PhotoAnalysisOutput = {
        ...result.output,
        findings: enrichedFindings,
        // Stamp the cache key onto the output so a later turn can
        // match against it. Stored sorted so order-independent lookup
        // doesn't have to re-sort on every check.
        blob_keys: [...input.blob_keys].sort(),
      };
      // Append to the session metadata cache. Existing entries are
      // preserved — a session can have multiple distinct analyses
      // (e.g. two different photo batches at different points in the
      // conversation).
      const updatedCache = [
        ...(state.metadata.photo_analyses ?? []),
        enrichedOutput,
      ];
      return {
        ok: true,
        content: {
          output: enrichedOutput,
          model: result.modelVersion,
        },
        stateChanges: {
          photoFindings: enrichedFindings,
          photoAnalyses: [enrichedOutput],
          metadataPatch: {
            photo_analyses: updatedCache,
          },
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: `Photo analysis failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};

/**
 * Find a cached analysis whose blob_keys exactly match (order-independent)
 * the requested batch. Returns undefined on miss. Pre-cache analyses
 * (no blob_keys field) are skipped — they predate the cache and we
 * can't safely match them.
 */
function findCachedAnalysis(
  cache: PhotoAnalysisOutput[] | undefined,
  requestedBlobKeys: string[],
): PhotoAnalysisOutput | undefined {
  if (!cache || cache.length === 0) return undefined;
  const requestedSorted = [...requestedBlobKeys].sort().join('\u0001');
  for (const entry of cache) {
    if (!entry.blob_keys || entry.blob_keys.length === 0) continue;
    if (entry.blob_keys.length !== requestedBlobKeys.length) continue;
    const entrySorted = [...entry.blob_keys].sort().join('\u0001');
    if (entrySorted === requestedSorted) return entry;
  }
  return undefined;
}
