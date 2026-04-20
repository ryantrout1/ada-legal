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

import type { AdaTool, ToolResult, ToolExecuteContext } from '../types';

interface AnalyzePhotoInput {
  blob_key: string;
  context_hint?: string;
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
      return {
        ok: true,
        content: {
          findings: result.findings,
          model: result.modelVersion,
        },
        stateChanges: { photoFindings: result.findings },
      };
    } catch (err) {
      return {
        ok: false,
        error: `Photo analysis failed: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
};
