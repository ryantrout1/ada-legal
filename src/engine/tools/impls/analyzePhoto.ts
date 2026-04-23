/**
 * analyze_photo tool.
 *
 * Ada calls this after a user has uploaded a photo (via the public UI's
 * photo upload, which stores to Vercel Blob and returns a blob key).
 * Delegates to PhotoAnalysisClient, which runs the photo-analysis prompt
 * against an Anthropic model.
 *
 * The turn-loop is responsible for passing blob_key values from the
 * AdaTurnInput.photoBlobKeys array into the tool; Ada only sees slugs
 * or descriptions of available photos, never raw URLs.
 *
 * Ref: docs/ARCHITECTURE.md §7, §10
 */

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types.js';
import type { PhotoFinding } from '../../../types/db.js';
import { guideUrlForTopic, topicsForSection, topicsForText } from '../../../lib/standardsIndex.js';

interface AnalyzePhotoInput {
  blob_key: string;
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
    'Request photo analysis for an uploaded image. Use the blob_key the user referenced. ' +
    'Provide a context_hint describing what you want the analyzer to look for ' +
    '(e.g. "physical barrier at entrance", "missing handrail on ramp"). ' +
    'Returns a list of findings with ADA standard citations, severity, and bounding boxes.',
  inputSchema: {
    type: 'object',
    properties: {
      blob_key: {
        type: 'string',
        description: 'The blob key for the uploaded photo. Provided in the conversation context.',
      },
      context_hint: {
        type: 'string',
        description: "Optional hint about what to look for, e.g. 'doorway width', 'service counter height'.",
      },
    },
    required: ['blob_key'],
  },
  validateInput(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new Error('analyze_photo: input must be an object');
    }
    const r = raw as Record<string, unknown>;
    if (typeof r.blob_key !== 'string' || r.blob_key.trim() === '') {
      throw new Error('analyze_photo: blob_key must be a non-empty string');
    }
    if (r.context_hint !== undefined && typeof r.context_hint !== 'string') {
      throw new Error('analyze_photo: context_hint, if provided, must be a string');
    }
    return {
      blob_key: r.blob_key,
      context_hint: typeof r.context_hint === 'string' ? r.context_hint : undefined,
    };
  },
  async execute({ clients }: ToolExecuteContext, input): Promise<ToolResult> {
    try {
      const result = await clients.photo.analyze({
        blobKey: input.blob_key,
        contextHint: input.context_hint,
      });
      // Enrich each finding with a guide_url when we can resolve the
      // cited standard against the Standards Guide index. This makes
      // guide links available to Ada (in her next-turn context) and
      // to the attorney package / session package downstream.
      const enriched = result.findings.map(enrichFindingWithGuideUrl);
      return {
        ok: true,
        content: {
          findings: enriched,
          model: result.modelVersion,
        },
        stateChanges: { photoFindings: enriched },
      };
    } catch (err) {
      return {
        ok: false,
        error: `Photo analysis failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
