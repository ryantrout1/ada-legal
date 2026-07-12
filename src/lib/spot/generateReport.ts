/**
 * Ada Spot — report generation orchestration (Phase 3a).
 *
 * uploaded session's photos → batched vision (the analyzer caps at 3/call) →
 * a single structured synthesis via clients.ai.stream(compose_report) →
 * composeReport (pure validation) → SpotReportContent.
 *
 * Reuses the shared analyzer + AI client additively; writes nothing here (the
 * cron persists). Model is selectable (SPOT_REPORT_MODEL, default Opus 4.8) so
 * the admin preview can run the Fable-5-vs-Opus-4.8 A/B; the free read is a
 * separate path and is unaffected.
 */

import type { AdaClients, AiStreamChunk } from '../../engine/clients/types.js';
import type { PhotoAnalysisOutput } from '../../types/db.js';
import { COMPOSE_REPORT_TOOL, type ComposeReportInput, type SpotReportContent } from './reportSchema.js';
import { composeReport } from './composeReport.js';

/** The analyzer throws on > 3 blob keys — batch to its max. */
export const SPOT_REPORT_BATCH_SIZE = 3;
export const SPOT_REPORT_DEFAULT_MODEL = 'claude-opus-4-8';

const SYNTHESIS_SYSTEM =
  'You are composing a remediation-oriented ADA accessibility screening report for a business ' +
  'owner from the per-photo analyses below. Your job is to help them FIX issues, never to assess ' +
  'legal exposure. Use screening language ("possible", "appears", "worth checking") and never say ' +
  '"violation", "compliant", or "certified". Group concerns by area, and for each give the concern, ' +
  'what to fix and how, a severity, and the ADA section ONLY if an analysis provided it (never ' +
  'invent one). Mark an area confirmable:false when a photo cannot conclusively establish it. If ' +
  'the analyses found nothing concerning, return an empty areas list. Respond by calling the ' +
  'compose_report tool.';

export interface GenerateReportInput {
  photos: { blobUrl: string }[];
  model?: string;
}

export interface GeneratedReport {
  content: SpotReportContent;
  modelVersion: string;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function serializeAnalyses(analyses: PhotoAnalysisOutput[]): string {
  return analyses
    .map((a, i) => {
      if (a.meta?.tool_call_present === false) {
        return `Batch ${i + 1}: the model could not read these photos (no reliable analysis).`;
      }
      const findings = (a.findings ?? [])
        .map(
          (f) =>
            `- [${f.severity}${f.confirmable === false ? ', unconfirmable' : ''}] ${f.title_standard}` +
            `${f.standard ? ` (${f.standard})` : ''}: ${f.finding_standard}`,
        )
        .join('\n');
      const positives = (a.positive_findings?.standard ?? []).join('; ');
      return [
        `Batch ${i + 1}:`,
        `Scene: ${a.scene?.standard ?? ''}`,
        `Summary: ${a.summary?.standard ?? ''}`,
        findings ? `Findings:\n${findings}` : 'Findings: none',
        positives ? `Looks good: ${positives}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n');
}

async function collectComposeReport(
  stream: AsyncIterable<AiStreamChunk>,
): Promise<ComposeReportInput | null> {
  for await (const c of stream) {
    if (c.type === 'tool_use_stop' && c.toolName === COMPOSE_REPORT_TOOL.name) {
      return (c.toolInput ?? {}) as unknown as ComposeReportInput;
    }
  }
  return null;
}

export async function generateReport(
  clients: AdaClients,
  input: GenerateReportInput,
): Promise<GeneratedReport> {
  if (input.photos.length === 0) throw new Error('no photos to analyze');
  const model = input.model ?? process.env.SPOT_REPORT_MODEL ?? SPOT_REPORT_DEFAULT_MODEL;

  const analyses: PhotoAnalysisOutput[] = [];
  for (const batch of chunk(input.photos.map((p) => p.blobUrl), SPOT_REPORT_BATCH_SIZE)) {
    const res = await clients.photo.analyze({ blobKeys: batch });
    analyses.push(res.output);
  }

  const stream = clients.ai.stream({
    systemPrompt: SYNTHESIS_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Per-photo analyses:\n\n${serializeAnalyses(analyses)}`,
        timestamp: new Date().toISOString(),
      },
    ],
    tools: [COMPOSE_REPORT_TOOL],
    model,
    maxTokens: 4000,
  });

  const modelOutput = await collectComposeReport(stream);
  // A missing tool call is a generation failure — surface it so the caller
  // leaves the session for retry rather than persisting an empty report.
  if (!modelOutput) throw new Error('model did not return a compose_report tool call');

  const content = composeReport(modelOutput, analyses);
  return { content: { ...content, modelVersion: model }, modelVersion: model };
}
