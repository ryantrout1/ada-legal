/**
 * AnthropicPhotoAnalysisClient — real implementation of PhotoAnalysisClient.
 *
 * Uses Claude Haiku 4.5 with vision + tool-use to force structured JSON
 * output from the model. The analyst persona + comprehensive ADA standards
 * catalog lives in content-migration/prompts/photo-analysis.md (migrated
 * verbatim from Base44).
 *
 * blob_key contract:
 *   - If blob_key is a `data:image/...;base64,...` URL, we extract the
 *     media type and send raw base64 to Anthropic (source: { type: "base64" }).
 *   - If blob_key is an `http://` or `https://` URL, we pass it as
 *     source: { type: "url" } and let Anthropic fetch it server-side.
 *   - Anything else is rejected. Real blob-storage URLs land in Phase B
 *     Step 11; until then the tool receives base64 directly from the client.
 *
 * Structured output:
 *   We define ONE tool — `report_findings` — with an array-of-findings input
 *   schema that matches our PhotoFinding type (finding, severity, standard,
 *   confidence, bounding_box). We force its use via tool_choice. The model
 *   cannot emit free-form JSON; it must call the tool.
 *
 * Ref: docs/ARCHITECTURE.md §10
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  PhotoAnalysisClient,
  PhotoAnalysisRequest,
  PhotoAnalysisResult,
} from './types.js';
import type { PhotoFinding, PhotoFindingSeverity } from '../../types/db.js';
import photoAnalysisSystemPrompt from '../../../content-migration/prompts/photo-analysis.js';

const DEFAULT_MODEL = 'claude-sonnet-4-5';
const DEFAULT_MAX_TOKENS = 2048;

/** Input schema for the `report_findings` tool. Enforced by Anthropic. */
const REPORT_FINDINGS_SCHEMA = {
  type: 'object' as const,
  properties: {
    findings: {
      type: 'array',
      description:
        'Every ADA compliance concern you identified in the image. An empty array is valid if the image shows nothing concerning.',
      items: {
        type: 'object',
        properties: {
          finding: {
            type: 'string',
            description:
              'Specific description of the concern. Include measurement estimates where visible.',
          },
          severity: {
            type: 'string',
            enum: ['critical', 'major', 'minor', 'advisory'],
            description:
              'critical = blocks access entirely; major = clear ADA violation; minor = partial or borderline; advisory = note-worthy best practice.',
          },
          standard: {
            type: 'string',
            description:
              'The ADA standard cited — e.g., "28 CFR §36.304", "ADAAG §404.2.3", "2010 Standards §502.2".',
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description:
              'Your confidence this is a real violation based on the image alone. 0 = pure guess; 1 = obvious.',
          },
          bounding_box: {
            type: 'object',
            description:
              'Normalized bounding box on the image. x,y = top-left; w,h = size. All in 0..1 image fractions.',
            properties: {
              x: { type: 'number', minimum: 0, maximum: 1 },
              y: { type: 'number', minimum: 0, maximum: 1 },
              w: { type: 'number', minimum: 0, maximum: 1 },
              h: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['x', 'y', 'w', 'h'],
          },
        },
        required: ['finding', 'severity', 'standard', 'confidence'],
      },
    },
  },
  required: ['findings'],
};

export class AnthropicPhotoAnalysisClient implements PhotoAnalysisClient {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    if (!apiKey) {
      throw new Error('AnthropicPhotoAnalysisClient: apiKey is required');
    }
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async analyze(req: PhotoAnalysisRequest): Promise<PhotoAnalysisResult> {
    const imageBlock = parseBlobKeyToImageBlock(req.blobKey);

    const userContent: Array<
      | { type: 'image'; source: ImageSource }
      | { type: 'text'; text: string }
    > = [imageBlock];

    if (req.contextHint && req.contextHint.trim().length > 0) {
      userContent.push({
        type: 'text',
        text: `Context from the session: ${req.contextHint.trim()}`,
      });
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: DEFAULT_MAX_TOKENS,
      system: photoAnalysisSystemPrompt,
      tools: [
        {
          name: 'report_findings',
          description:
            'Report all ADA accessibility concerns identified in the image. Call this exactly once with your complete findings list.',
          input_schema: REPORT_FINDINGS_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: 'report_findings' },
      messages: [{ role: 'user', content: userContent }],
    });

    const findings = extractFindingsFromResponse(response);
    return {
      findings,
      modelVersion: this.model,
    };
  }
}

// ─── Helpers (exported for testing) ───────────────────────────────────────────

type ImageSource =
  | { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string }
  | { type: 'url'; url: string };

/**
 * Parse the blob_key sent to analyze_photo into an Anthropic image block.
 * Supports two formats: `data:` URIs (base64) and `http(s):` URLs.
 */
export function parseBlobKeyToImageBlock(blobKey: string): {
  type: 'image';
  source: ImageSource;
} {
  if (blobKey.startsWith('data:')) {
    // Format: data:<mime>;base64,<b64>
    const match = blobKey.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/);
    if (!match) {
      throw new Error(
        `AnthropicPhotoAnalysisClient: unsupported data: URL format. Expected 'data:image/<jpeg|png|gif|webp>;base64,...'.`,
      );
    }
    const [, mediaType, b64] = match;
    return {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mediaType as ImageSource extends { type: 'base64'; media_type: infer M } ? M : never,
        data: b64,
      },
    };
  }

  if (blobKey.startsWith('http://') || blobKey.startsWith('https://')) {
    return { type: 'image', source: { type: 'url', url: blobKey } };
  }

  throw new Error(
    `AnthropicPhotoAnalysisClient: blob_key must be a data: URL or an http(s) URL. Got: ${blobKey.slice(0, 40)}...`,
  );
}

export function extractFindingsFromResponse(response: Anthropic.Message): PhotoFinding[] {
  // We set tool_choice to force report_findings. Find that tool_use block.
  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'report_findings') {
      const input = block.input as { findings?: unknown };
      if (!Array.isArray(input.findings)) return [];
      return input.findings
        .map(validateFinding)
        .filter((f): f is PhotoFinding => f !== null);
    }
  }
  // No tool block — likely a refusal. Return empty so the turn loop can
  // handle it conversationally rather than throwing.
  return [];
}

function validateFinding(raw: unknown): PhotoFinding | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.finding !== 'string' ||
    typeof r.standard !== 'string' ||
    typeof r.confidence !== 'number' ||
    !isValidSeverity(r.severity)
  ) {
    return null;
  }
  const out: PhotoFinding = {
    finding: r.finding,
    severity: r.severity,
    standard: r.standard,
    confidence: Math.max(0, Math.min(1, r.confidence)),
  };
  if (r.bounding_box && typeof r.bounding_box === 'object') {
    const b = r.bounding_box as Record<string, unknown>;
    if (
      typeof b.x === 'number' &&
      typeof b.y === 'number' &&
      typeof b.w === 'number' &&
      typeof b.h === 'number'
    ) {
      out.bounding_box = { x: b.x, y: b.y, w: b.w, h: b.h };
    }
  }
  return out;
}

function isValidSeverity(s: unknown): s is PhotoFindingSeverity {
  return s === 'critical' || s === 'major' || s === 'minor' || s === 'advisory';
}
