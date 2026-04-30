/**
 * AnthropicPhotoAnalysisClient — real implementation of PhotoAnalysisClient.
 *
 * Uses Claude Sonnet 4.5 with vision + tool-use to force structured JSON
 * output from the model. The analyst persona + comprehensive ADA standards
 * catalog lives in content-migration/prompts/photo-analysis.md (extended
 * for Commit 8 — scene/summary/positive findings, three reading-level
 * variants, confirmable flag).
 *
 * blob_keys contract:
 *   Each entry must be either:
 *   - a `data:image/...;base64,...` URL — extracted and sent as raw
 *     base64 (source: { type: "base64" }), or
 *   - an `https://*.public.blob.vercel-storage.com/...` URL — passed
 *     as source: { type: "url" } and fetched server-side by Anthropic.
 *   ALL other URL patterns are rejected — deliberate allowlist closing
 *   the SSRF surface from prompt-injected blob_key values (B3).
 *   http:// is never accepted.
 *
 *   Up to 3 photos per call (MAX_PHOTOS_PER_CALL). Throws if length is
 *   0 or > 3. Batch shape lets the model reason about cross-photo
 *   compliance chains. Step 30, Commit 8.
 *
 * Structured output:
 *   The `report_findings` tool's input schema matches PhotoAnalysisOutput:
 *   top-level scene/summary/overall_risk/positive_findings (each with
 *   three reading-level variants) plus a findings[] array. We force its
 *   use via tool_choice — no free-form JSON.
 *
 * Ref: docs/ARCHITECTURE.md §10
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  PhotoAnalysisClient,
  PhotoAnalysisRequest,
  PhotoAnalysisResult,
} from './types.js';
import type {
  PhotoAnalysisOutput,
  PhotoFinding,
  PhotoFindingSeverity,
  PhotoOverallRisk,
  ReadingLevelStringList,
  ReadingLevelText,
} from '../../types/db.js';
import photoAnalysisSystemPrompt from '../../../content-migration/prompts/photo-analysis.js';

const DEFAULT_MODEL = 'claude-sonnet-4-5';
// Three reading-level variants × scene + summary + positive_findings +
// (title + finding) per concern can easily exceed 2048 on a 3-photo,
// 10-finding site. 8192 leaves comfortable headroom; image tokens
// dominate cost regardless. Step 30, Commit 8.
const DEFAULT_MAX_TOKENS = 8192;
const MAX_PHOTOS_PER_CALL = 3;

// Vercel Blob URL pattern: https://<storeId>.public.blob.vercel-storage.com/<path>.
// Anything else is rejected — this is the only legitimate source for
// photo URLs Anthropic fetches server-side. http:// is never accepted.
// See B3 in the security audit: prompt injection could otherwise drive
// analyze_photo at arbitrary URLs, turning Anthropic's IP space into
// a tracking-pixel exfil channel.
const VERCEL_BLOB_URL_RE =
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

const READING_LEVEL_TEXT_SCHEMA = {
  type: 'object' as const,
  description:
    'Reading-level-aware string. Provide all three variants. simple = COGA-conformant plain language. standard = 8th-grade conversational. professional = legal/technical with ADA terminology.',
  properties: {
    simple: { type: 'string' },
    standard: { type: 'string' },
    professional: { type: 'string' },
  },
  required: ['simple', 'standard', 'professional'],
};

const READING_LEVEL_STRING_LIST_SCHEMA = {
  type: 'object' as const,
  description:
    'Reading-level-aware list of strings. Provide all three variants of the same list at different reading levels.',
  properties: {
    simple: { type: 'array', items: { type: 'string' } },
    standard: { type: 'array', items: { type: 'string' } },
    professional: { type: 'array', items: { type: 'string' } },
  },
  required: ['simple', 'standard', 'professional'],
};

/** Input schema for the `report_findings` tool. Enforced by Anthropic. */
const REPORT_FINDINGS_SCHEMA = {
  type: 'object' as const,
  properties: {
    scene: {
      ...READING_LEVEL_TEXT_SCHEMA,
      description:
        'What the photo(s) show — building type, materials, fixtures visible, lighting context. Reference each photo by number when multiple are provided ("Photo 1 shows...; Photo 2 shows..."). Provide three reading-level variants.',
    },
    summary: {
      ...READING_LEVEL_TEXT_SCHEMA,
      description:
        '2-3 sentence overall assessment of the batch. Mention the headline concerns, anything notably compliant, and whether the angle/framing limited assessment. Three reading-level variants.',
    },
    overall_risk: {
      type: 'string',
      enum: ['high', 'medium', 'low', 'none'],
      description:
        'high = any confirmable critical/major finding. medium = any major-severity unconfirmable, OR any minor finding. low = only advisory findings. none = zero findings.',
    },
    positive_findings: {
      ...READING_LEVEL_STRING_LIST_SCHEMA,
      description:
        'Compliant features observed (curb cut present, accessible signage visible, etc.). Empty arrays allowed.',
    },
    findings: {
      type: 'array',
      description:
        'Every ADA compliance concern you identified. An empty array is valid if the photos show nothing concerning.',
      items: {
        type: 'object',
        properties: {
          title_simple: { type: 'string' },
          title_standard: { type: 'string' },
          title_professional: {
            type: 'string',
            description:
              'Short headline for the concern, e.g. "Door Pull Bar Hardware — Graspability Concern".',
          },
          finding_simple: { type: 'string' },
          finding_standard: { type: 'string' },
          finding_professional: {
            type: 'string',
            description:
              'Full prose explanation of the concern, including measurement estimates where visible.',
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
              'The ADA standard cited — e.g., "§404.2.3", "ADAAG §404", "2010 Standards §502.2". Universal — do not localize across reading levels.',
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description:
              'Your confidence this is a real violation based on the image alone. 0 = pure guess; 1 = obvious.',
          },
          confirmable: {
            type: 'boolean',
            description:
              'true if you can fully assess this concern from the photo. false when angle, framing, or lighting prevents conclusive measurement (e.g. you can see a door closer but not time its closing speed). The finding still ships either way; this flag tells downstream consumers to render it as needs-on-site-verification.',
          },
          bounding_box: {
            type: 'object',
            description:
              'Normalized bounding box on the image. x,y = top-left; w,h = size. All in 0..1 image fractions. Optional when a finding spans multiple photos.',
            properties: {
              x: { type: 'number', minimum: 0, maximum: 1 },
              y: { type: 'number', minimum: 0, maximum: 1 },
              w: { type: 'number', minimum: 0, maximum: 1 },
              h: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['x', 'y', 'w', 'h'],
          },
        },
        required: [
          'title_simple',
          'title_standard',
          'title_professional',
          'finding_simple',
          'finding_standard',
          'finding_professional',
          'severity',
          'standard',
          'confidence',
          'confirmable',
        ],
      },
    },
  },
  required: ['scene', 'summary', 'overall_risk', 'positive_findings', 'findings'],
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
    if (!Array.isArray(req.blobKeys) || req.blobKeys.length === 0) {
      throw new Error(
        'AnthropicPhotoAnalysisClient: blobKeys must be a non-empty array',
      );
    }
    if (req.blobKeys.length > MAX_PHOTOS_PER_CALL) {
      throw new Error(
        `AnthropicPhotoAnalysisClient: maximum ${MAX_PHOTOS_PER_CALL} photos per call (got ${req.blobKeys.length})`,
      );
    }

    const userContent: Array<
      | { type: 'image'; source: ImageSource }
      | { type: 'text'; text: string }
    > = [];

    // Interleave a labeling text block before each image so the model
    // can refer to each photo by number in scene/summary/finding text.
    req.blobKeys.forEach((blobKey, idx) => {
      userContent.push({
        type: 'text',
        text: `Photo ${idx + 1}:`,
      });
      userContent.push(parseBlobKeyToImageBlock(blobKey));
    });

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
            'Report all ADA accessibility concerns identified across the provided photo(s). Call this exactly once with your complete assessment — scene description, summary, overall risk, positive findings, and per-concern findings.',
          input_schema: REPORT_FINDINGS_SCHEMA,
        },
      ],
      tool_choice: { type: 'tool', name: 'report_findings' },
      messages: [{ role: 'user', content: userContent }],
    });

    const output = extractOutputFromResponse(response);
    return {
      output,
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

  if (VERCEL_BLOB_URL_RE.test(blobKey)) {
    return { type: 'image', source: { type: 'url', url: blobKey } };
  }

  throw new Error(
    `AnthropicPhotoAnalysisClient: blob_key must be a data: URL or a Vercel Blob URL (https://<storeId>.public.blob.vercel-storage.com/...). Got: ${blobKey.slice(0, 40)}...`,
  );
}

const EMPTY_RLT: ReadingLevelText = { simple: '', standard: '', professional: '' };

/**
 * Factory rather than a frozen constant: callers may mutate the
 * returned arrays (e.g. push to positive_findings.standard), and a
 * shared reference would corrupt every other empty output. Always
 * call this fresh.
 */
function emptyRLSL(): ReadingLevelStringList {
  return { simple: [], standard: [], professional: [] };
}

function emptyOutput(): PhotoAnalysisOutput {
  return {
    scene: { ...EMPTY_RLT },
    summary: { ...EMPTY_RLT },
    overall_risk: 'none',
    positive_findings: emptyRLSL(),
    findings: [],
  };
}

export function extractOutputFromResponse(
  response: Anthropic.Message,
): PhotoAnalysisOutput {
  // We set tool_choice to force report_findings. Find that tool_use block.
  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'report_findings') {
      const input = block.input as Record<string, unknown>;
      const out = validateOutput(input);
      out.meta = {
        tool_call_present: true,
        stop_reason: response.stop_reason ?? 'unknown',
      };
      return out;
    }
  }
  // No tool_use block — model didn't call report_findings. This means
  // the schema was rejected by Anthropic, the model refused (vision
  // safety, content policy), or the response was truncated. Surface it
  // in logs so production failures are visible in Vercel — without
  // this, the caller just sees "no findings" and can't tell which.
  const textExcerpt = response.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join(' ')
    .slice(0, 200);
  // eslint-disable-next-line no-console
  console.warn(
    '[photo-analyzer] no report_findings tool_use block in response',
    {
      stop_reason: response.stop_reason,
      content_block_count: response.content.length,
      content_block_types: response.content.map((b) => b.type),
      text_excerpt: textExcerpt || undefined,
    },
  );
  const fallback = emptyOutput();
  fallback.meta = {
    tool_call_present: false,
    stop_reason: response.stop_reason ?? 'unknown',
  };
  return fallback;
}

function validateOutput(raw: Record<string, unknown>): PhotoAnalysisOutput {
  const findings = Array.isArray(raw.findings)
    ? raw.findings
        .map(validateFinding)
        .filter((f): f is PhotoFinding => f !== null)
    : [];
  return {
    scene: validateRLT(raw.scene),
    summary: validateRLT(raw.summary),
    overall_risk: isValidRisk(raw.overall_risk) ? raw.overall_risk : 'none',
    positive_findings: validateRLSL(raw.positive_findings),
    findings,
  };
}

function validateRLT(raw: unknown): ReadingLevelText {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_RLT };
  const r = raw as Record<string, unknown>;
  return {
    simple: typeof r.simple === 'string' ? r.simple : '',
    standard: typeof r.standard === 'string' ? r.standard : '',
    professional: typeof r.professional === 'string' ? r.professional : '',
  };
}

function validateRLSL(raw: unknown): ReadingLevelStringList {
  if (!raw || typeof raw !== 'object') {
    return emptyRLSL();
  }
  const r = raw as Record<string, unknown>;
  const toStringArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
  return {
    simple: toStringArray(r.simple),
    standard: toStringArray(r.standard),
    professional: toStringArray(r.professional),
  };
}

export function validateFinding(raw: unknown): PhotoFinding | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.title_simple !== 'string' ||
    typeof r.title_standard !== 'string' ||
    typeof r.title_professional !== 'string' ||
    typeof r.finding_simple !== 'string' ||
    typeof r.finding_standard !== 'string' ||
    typeof r.finding_professional !== 'string' ||
    typeof r.standard !== 'string' ||
    typeof r.confidence !== 'number' ||
    typeof r.confirmable !== 'boolean' ||
    !isValidSeverity(r.severity)
  ) {
    return null;
  }
  const out: PhotoFinding = {
    // Deprecated alias — equals finding_standard so legacy readers keep
    // working until Commit 9 removes the field.
    finding: r.finding_standard,
    title_simple: r.title_simple,
    title_standard: r.title_standard,
    title_professional: r.title_professional,
    finding_simple: r.finding_simple,
    finding_standard: r.finding_standard,
    finding_professional: r.finding_professional,
    severity: r.severity,
    standard: r.standard,
    confidence: Math.max(0, Math.min(1, r.confidence)),
    confirmable: r.confirmable,
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

function isValidRisk(s: unknown): s is PhotoOverallRisk {
  return s === 'high' || s === 'medium' || s === 'low' || s === 'none';
}
