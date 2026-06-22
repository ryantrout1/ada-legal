/**
 * AnthropicPhotoAnalysisClient — real implementation of PhotoAnalysisClient.
 *
 * Uses Claude Opus 4.8 with vision + tool-use to force structured JSON
 * output from the model. The analyst persona + comprehensive ADA standards
 * catalog lives in content-migration/prompts/photo-analysis.md
 * (scene/summary/positive findings, confirmable flag). Output is at the
 * standard reading level only; simple/professional are generated on
 * demand by rewriteToLevel() and cached back onto the photo_analyses row.
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
 *   The `report_findings` tool's input schema is the standard-level
 *   projection of PhotoAnalysisOutput: top-level scene/summary (strings),
 *   positive_findings (string list), plus a findings[] array (title +
 *   finding per concern). overall_risk is computed in code from the
 *   findings (computeOverallRisk in lib/photoRisk), not requested from the
 *   model. We force its use via tool_choice
 *   — no free-form JSON. validateOutput wraps each string as the
 *   `standard` variant of its reading-level field.
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
} from '../../types/db.js';
import { computeOverallRisk } from '../../lib/photoRisk.js';
import photoAnalysisSystemPrompt from '../../../content-migration/prompts/photo-analysis.js';
import readingLevelsPrompt from '../../../content-migration/prompts/reading-levels.js';
import { renderCatalogForPrompt } from '../../lib/adaCatalog.js';

const DEFAULT_MODEL = 'claude-opus-4-8';

// The ADA standards checklist the analyzer reasons against, rendered from
// the single-source-of-truth catalog (src/lib/adaCatalog.ts) and sent as a
// second cached system block. Computed once at module load — it is static.
const ADA_STANDARDS_CHECKLIST = renderCatalogForPrompt();
// Standard reading level only — one variant of scene + summary +
// positive_findings + (title + finding) per concern. Generating all
// three reading levels at capture was ~60% of the output and the cause
// of the 45–90s wait; simple/professional are now produced on demand via
// rewriteToLevel() and cached back onto the row. 4096 is ample for a
// single-level, 3-photo, 10-finding site; truncation still surfaces as a
// max_tokens stop_reason which extractOutputFromResponse handles
// gracefully (empty findings + meta logged for visibility).
const DEFAULT_MAX_TOKENS = 4096;
const MAX_PHOTOS_PER_CALL = 3;

// Vercel Blob URL pattern: https://<storeId>.public.blob.vercel-storage.com/<path>.
// Anything else is rejected — this is the only legitimate source for
// photo URLs Anthropic fetches server-side. http:// is never accepted.
// See B3 in the security audit: prompt injection could otherwise drive
// analyze_photo at arbitrary URLs, turning Anthropic's IP space into
// a tracking-pixel exfil channel.
const VERCEL_BLOB_URL_RE =
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

/**
 * Input schema for the `report_findings` tool. Enforced by Anthropic.
 *
 * Standard reading level only. scene/summary are plain strings,
 * positive_findings a plain string list, and each finding carries a
 * single title + finding. The simple/professional variants that used to
 * be required here are generated on demand by rewriteToLevel() — see the
 * DEFAULT_MAX_TOKENS note for why.
 */
const REPORT_FINDINGS_SCHEMA = {
  type: 'object' as const,
  properties: {
    scene: {
      type: 'string',
      description:
        'What the photo(s) show — building type, materials, fixtures visible, lighting context. Reference each photo by number when multiple are provided ("Photo 1 shows...; Photo 2 shows..."). Write at a standard (8th-grade, conversational) reading level.',
    },
    summary: {
      type: 'string',
      description:
        '2-3 sentence overall assessment of the batch. Mention the headline concerns, anything notably compliant, and whether the angle/framing limited assessment. Standard (8th-grade) reading level.',
    },
    positive_findings: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Compliant features observed (curb cut present, accessible signage visible, etc.). Empty array allowed. Standard reading level.',
    },
    findings: {
      type: 'array',
      description:
        'Every ADA compliance concern you identified. An empty array is valid if the photos show nothing concerning.',
      items: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description:
              'Short headline for the concern, e.g. "Door Pull Bar Hardware — Graspability Concern". Standard reading level.',
          },
          finding: {
            type: 'string',
            description:
              'Full prose explanation of the concern. Cite the section and explain the requirement. State a specific measured dimension only when a visible reference in the photo establishes it; otherwise compare the apparent condition to the requirement threshold and note the exact figure needs on-site measurement — do not assert an unmeasured number. Standard reading level.',
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
          'title',
          'finding',
          'severity',
          'standard',
          'confidence',
          'confirmable',
        ],
      },
    },
  },
  required: ['scene', 'summary', 'positive_findings', 'findings'],
};

/**
 * Input schema for the `rewrite_reading_level` tool. Mirrors the standard
 * payload sent in — scene/summary strings, a positive-findings string
 * list, and a findings array of {title, finding} kept in input order.
 */
const REWRITE_LEVEL_SCHEMA = {
  type: 'object' as const,
  properties: {
    scene: { type: 'string' },
    summary: { type: 'string' },
    positive_findings: { type: 'array', items: { type: 'string' } },
    findings: {
      type: 'array',
      description:
        'Same length and order as the input findings. Each entry is the rewritten title + explanation for the finding at that index.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          finding: { type: 'string' },
        },
        required: ['title', 'finding'],
      },
    },
  },
  required: ['scene', 'summary', 'positive_findings', 'findings'],
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
      // System prompt + tool schema are stable across every photo
      // analysis call. Marking the last block of each with
      // cache_control: ephemeral lets Anthropic skip prefill on
      // repeat calls within the cache TTL (~5min) — for the photo
      // analyzer this is ~10KB system + ~8KB tool schema that would
      // otherwise be re-tokenized every call. Saves both latency
      // and ~90% of input-token cost on the cached portion. Mirrors
      // the pattern in anthropicAiClient.ts.
      system: [
        {
          type: 'text',
          text: photoAnalysisSystemPrompt,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: ADA_STANDARDS_CHECKLIST,
          cache_control: { type: 'ephemeral' },
        },
      ] as never,
      tools: [
        {
          name: 'report_findings',
          description:
            'Report all ADA accessibility concerns identified across the provided photo(s). Call this exactly once with your complete assessment — scene description, summary, overall risk, positive findings, and per-concern findings.',
          input_schema: REPORT_FINDINGS_SCHEMA,
          cache_control: { type: 'ephemeral' },
        } as never,
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

  async rewriteToLevel(
    output: PhotoAnalysisOutput,
    level: 'simple' | 'professional',
  ): Promise<PhotoAnalysisOutput> {
    // Nothing to rewrite (empty/refused analysis) — return as-is so we
    // don't burn a model call producing empty variants.
    const hasContent =
      (output.scene.standard?.length ?? 0) > 0 ||
      (output.summary.standard?.length ?? 0) > 0 ||
      output.findings.length > 0;
    if (!hasContent) return output;

    // Send only the standard text the model needs to rewrite. Findings
    // are reduced to {title, finding} and re-aligned by index on return.
    const payload = {
      scene: output.scene.standard ?? '',
      summary: output.summary.standard ?? '',
      positive_findings: output.positive_findings.standard ?? [],
      findings: output.findings.map((f) => ({
        title: f.title_standard,
        finding: f.finding_standard,
      })),
    };

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: DEFAULT_MAX_TOKENS,
      // Two system blocks: the stable style guide is marked for caching
      // (shared across the simple and professional rewrite of every
      // analysis within the TTL); the per-level instruction is small and
      // volatile, so it sits uncached after the marker.
      system: [
        {
          type: 'text',
          text: readingLevelsPrompt,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: `You are rewriting an existing ADA photo analysis from the STANDARD reading level into the ${level.toUpperCase()} reading level described above. Rewrite the scene, the summary, every positive finding, and every finding's title and explanation into the ${level} style. Preserve meaning, severity, measurement estimates, and any cited ADA section exactly — do not add, drop, merge, or reorder concerns. Keep the findings array in the same order and the same length as the input. Call rewrite_reading_level exactly once with the rewritten text.`,
        },
      ] as never,
      tools: [
        {
          name: 'rewrite_reading_level',
          description:
            'Return the analysis rewritten into the requested reading level. Same structure and finding order as the input.',
          input_schema: REWRITE_LEVEL_SCHEMA,
          cache_control: { type: 'ephemeral' },
        } as never,
      ],
      tool_choice: { type: 'tool', name: 'rewrite_reading_level' },
      messages: [
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
    });

    return mergeRewrittenLevel(output, level, extractRewriteFromResponse(response));
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

/** The rewritten text returned by the rewrite_reading_level tool. */
interface RewrittenLevel {
  scene: string;
  summary: string;
  positive_findings: string[];
  findings: Array<{ title: string; finding: string }>;
}

/**
 * Pull the rewrite_reading_level tool_use block out of a response.
 * Returns null when the model didn't call the tool (refusal, truncation)
 * — mergeRewrittenLevel then falls back to the standard text per field.
 */
export function extractRewriteFromResponse(
  response: Anthropic.Message,
): RewrittenLevel | null {
  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'rewrite_reading_level') {
      const input = block.input as Record<string, unknown>;
      const findings = Array.isArray(input.findings)
        ? input.findings.map((f) => {
            const r = (f ?? {}) as Record<string, unknown>;
            return {
              title: typeof r.title === 'string' ? r.title : '',
              finding: typeof r.finding === 'string' ? r.finding : '',
            };
          })
        : [];
      return {
        scene: typeof input.scene === 'string' ? input.scene : '',
        summary: typeof input.summary === 'string' ? input.summary : '',
        positive_findings: toStringArray(input.positive_findings),
        findings,
      };
    }
  }
  return null;
}

/**
 * Fold a rewritten level back into the analysis: set scene[level],
 * summary[level], positive_findings[level], and each finding's
 * title_<level>/finding_<level>, preserving the standard variant and all
 * other fields. Findings re-align by index; if the model returned the
 * wrong count (or no tool call), the missing entries fall back to the
 * standard text so a consumer never renders blank.
 */
export function mergeRewrittenLevel(
  output: PhotoAnalysisOutput,
  level: 'simple' | 'professional',
  rewritten: RewrittenLevel | null,
): PhotoAnalysisOutput {
  const titleKey = `title_${level}` as 'title_simple' | 'title_professional';
  const findingKey = `finding_${level}` as
    | 'finding_simple'
    | 'finding_professional';
  return {
    ...output,
    scene: { ...output.scene, [level]: rewritten?.scene || output.scene.standard },
    summary: {
      ...output.summary,
      [level]: rewritten?.summary || output.summary.standard,
    },
    positive_findings: {
      ...output.positive_findings,
      [level]:
        rewritten && rewritten.positive_findings.length > 0
          ? rewritten.positive_findings
          : output.positive_findings.standard,
    },
    findings: output.findings.map((f, i) => {
      const rf = rewritten?.findings[i];
      return {
        ...f,
        [titleKey]: rf?.title || f.title_standard,
        [findingKey]: rf?.finding || f.finding_standard,
      };
    }),
  };
}

function emptyOutput(): PhotoAnalysisOutput {
  return {
    scene: { standard: '' },
    summary: { standard: '' },
    overall_risk: 'none',
    positive_findings: { standard: [] },
    findings: [],
  };
}

/** Coerce an unknown value into a string[] (non-strings dropped). */
function toStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
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
    scene: { standard: typeof raw.scene === 'string' ? raw.scene : '' },
    summary: { standard: typeof raw.summary === 'string' ? raw.summary : '' },
    overall_risk: computeOverallRisk(findings),
    positive_findings: { standard: toStringArray(raw.positive_findings) },
    findings,
  };
}

export function validateFinding(raw: unknown): PhotoFinding | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.title !== 'string' ||
    typeof r.finding !== 'string' ||
    typeof r.standard !== 'string' ||
    typeof r.confidence !== 'number' ||
    typeof r.confirmable !== 'boolean' ||
    !isValidSeverity(r.severity)
  ) {
    return null;
  }
  const out: PhotoFinding = {
    title_standard: r.title,
    finding_standard: r.finding,
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
