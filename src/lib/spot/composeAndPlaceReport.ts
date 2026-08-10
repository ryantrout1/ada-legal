/**
 * Ada Spot — compose + place, the shared report core.
 *
 * Extracted from generateReport (/plan phase 1) so two callers share one
 * pipeline: the paid buyer report (generateReport analyzes, then calls this)
 * and — in phase 2 — the /photo field test (analyzes once, persists the raw
 * row for the review queue, then calls this). Because both run the SAME
 * synthesis prompt, the SAME composeReport, and the SAME placement, anything
 * the testers validate on /photo is a real change to Spot.
 *
 * This half takes ANALYSES ALREADY COMPUTED — it never analyzes — so a caller
 * that already has analyses (and may have persisted them) does not pay for a
 * second vision pass or risk the two passes disagreeing. Writes nothing.
 */

import type { AdaClients, AiStreamChunk } from '../../engine/clients/types.js';
import type { PhotoAnalysisOutput, PhotoFindingSeverity } from '../../types/db.js';
import { SPOT_REPORT_DEFAULT_MODEL } from './parseRegenerateBody.js';
import { COMPOSE_REPORT_TOOL, type ComposeReportInput, type SpotReportContent } from './reportSchema.js';
import { composeReport } from './composeReport.js';
import type { PlaceFn } from './buildPhotoAnnotations.js';
import { buildItemAnnotations, type PlaceItemInput } from './buildItemAnnotations.js';
import { boxPinForItem } from './pinFromBox.js';
import { isEdgeBox } from './pinMarkerShape.js';
import { snapToHorizontalEdge } from './edgeSnap.js';
import { makeAnthropicPlaceFn, PLACEMENT_MODEL_DEFAULT } from './placeFindingAnthropic.js';

export interface GeneratedReport {
  content: SpotReportContent;
  modelVersion: string;
}

export interface ComposeAndPlaceInput {
  /** Per-view-group analyses, already computed by the caller. */
  analyses: PhotoAnalysisOutput[];
  /** The photo blob URLs, in the same grouping the analyses came from. */
  photos: { blobUrl: string }[];
  /** Synthesis model. Resolves to SPOT_REPORT_MODEL / the default when omitted. */
  model?: string;
  /** When true, also produce photo-bound pins (content.photoAnnotations). */
  annotate?: boolean;
  /** Injectable placement function (tests). Real Anthropic placer when omitted. */
  placeFn?: PlaceFn;
  /** Minimum placement confidence to draw a pin. Defaults to 0.5. */
  minConfidence?: number;
}

const SYNTHESIS_SYSTEM =
  'You are composing a remediation-oriented ADA accessibility screening report for a business ' +
  'owner who photographed ONE spot — a single situation such as an entrance, a ramp, or a ' +
  'doorway — from several angles. Treat the photos as multiple views of the SAME place: fuse ' +
  'them into one coherent read, use closer or clearer angles to resolve what an earlier angle ' +
  'left uncertain, and never list the same barrier twice just because it shows up in more than ' +
  'one photo. Write directly to the owner — plain language, second person — remembering they ' +
  'took these because they do not know. Your job is to help them FIX the problem, never to ' +
  'assess legal exposure. Use screening language ("possible", "appears", "worth checking") and ' +
  'never say "violation", "compliant", or "certified". For each distinct concern give: what it ' +
  'is, what to do about it (a concrete fix AND, where a photo cannot settle it, a simple check ' +
  'THEY can do themselves — e.g. "measure the step; anything over half an inch needs a ramp"), ' +
  'a severity, and the ADA section ONLY if an analysis provided it (never invent one). Mark a ' +
  'concern confirmable:false when the photos cannot conclusively establish it. Set ' +
  'locatable:true ONLY when the barrier is a physical object visible in the photo that could ' +
  'be circled — a raised curb, a fixed bench, a closed cabinet. Set locatable:false when the ' +
  'concern is something ABSENT (no grab bars), a dimension of empty space (turning space, ' +
  'clearance around a fixture), or a measurement of an object the photo cannot settle (mirror ' +
  'height). A concern can be locatable:true and confirmable:false at the same time — a fixed ' +
  'bench is plainly visible even though its height needs measuring on site. If nothing ' +
  'concerning was found, return an empty areas list. Respond by calling the compose_report tool.';

const SPOT_ANNOTATION_MIN_CONFIDENCE = 0.5;

/**
 * Only barriers that matter get a marker. Locatable answers "can we point at
 * it"; this answers "is it worth pointing at". Shower controls are plainly
 * visible and so are locatable, but a minor advisory does not earn a pin —
 * every extra marker competes with the critical one for the reader's
 * attention, and a report that flags everything flags nothing.
 */
const PINNED_SEVERITIES = new Set<PhotoFindingSeverity>(['critical', 'major']);

function serializeAnalyses(analyses: PhotoAnalysisOutput[]): string {
  return analyses
    .map((a, i) => {
      if (a.meta?.tool_call_present === false) {
        return `View group ${i + 1}: could not be read clearly (no reliable analysis).`;
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
        `View group ${i + 1} (angles of the same spot):`,
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
      const input = (c.toolInput ?? {}) as Record<string, unknown>;
      // The client sets this sentinel when the accumulated tool JSON does not
      // parse. Casting it straight to ComposeReportInput — which is what this
      // did — turns a failed generation into a report with no overview and no
      // areas, and stores it. Treat it as no tool call at all.
      if (input.__parse_error === true) return null;
      return input as unknown as ComposeReportInput;
    }
  }
  return null;
}

/**
 * Move edge-type pins onto the real edge found in the image.
 *
 * Mutates in place, and only for pins whose box is edge-shaped: an object's
 * box centre is already the right answer, and re-deriving it from brightness
 * would be worse. Any failure leaves the pin exactly where it was.
 */
async function snapEdgeItems(items: PlaceItemInput[], photoUrl: string | undefined): Promise<void> {
  const edgeItems = items.filter((i) => i.presetPin?.box && isEdgeBox(i.presetPin.box));
  if (!photoUrl || edgeItems.length === 0) return;

  let buffer: Buffer;
  try {
    const resp = await fetch(photoUrl);
    if (!resp.ok) return;
    buffer = Buffer.from(await resp.arrayBuffer());
  } catch (err) {
    console.warn('spot edge snap: could not fetch photo, keeping box positions', err);
    return;
  }

  for (const item of edgeItems) {
    const box = item.presetPin!.box!;
    const snappedY = await snapToHorizontalEdge(buffer, box);
    if (snappedY === null) continue;
    // Move both the marker point and the band, so the band still frames the
    // edge it marks instead of drifting away from its own pin.
    item.presetPin = {
      ...item.presetPin!,
      y: snappedY,
      box: { ...box, y: snappedY },
    };
  }
}

function requireApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
  return key;
}

/**
 * Compose a report from already-computed analyses, optionally placing pins.
 * Same retry and pins-never-fail-the-report semantics generateReport had.
 */
export async function composeAndPlaceReport(
  clients: AdaClients,
  input: ComposeAndPlaceInput,
): Promise<GeneratedReport> {
  const model = input.model ?? process.env.SPOT_REPORT_MODEL ?? SPOT_REPORT_DEFAULT_MODEL;
  const { analyses } = input;

  // The synthesis call is retried once.
  //
  // The observed malformation — the model serializing its findings into the
  // overview string instead of emitting `areas` — happened on one of four
  // reports with the same prompt, model and inputs. It is a roll of the dice,
  // and a buyer who paid should not lose their report to one bad roll. Only the
  // SYNTHESIS is retried, never the analyses (those are the expensive vision
  // calls, already done). One retry, not a loop.
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const stream = clients.ai.stream({
      systemPrompt: SYNTHESIS_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Analyses of the photographed spot (grouped views, each up to 3 angles):\n\n${serializeAnalyses(analyses)}`,
          timestamp: new Date().toISOString(),
        },
      ],
      tools: [COMPOSE_REPORT_TOOL],
      model,
      // A report now carries around ten concerns, each with an explanation, a
      // remediation paragraph and a self-check. At 4000 the model ran out of
      // output mid-tool-call, which arrives here as "no tool call at all" —
      // so it retried, and two long attempts together blew the 120s function
      // limit and returned a 504. This is a CAP, not a charge: unused budget
      // costs nothing, so it is sized for the longest plausible report rather
      // than the typical one.
      maxTokens: 16000,
    });

    try {
      const modelOutput = await collectComposeReport(stream);
      // A missing tool call is a generation failure — surface it so the caller
      // leaves the session for retry rather than persisting an empty report.
      if (!modelOutput) {
        // The commonest cause is the model running out of output budget
        // partway through the tool call, which arrives here indistinguishable
        // from never having called the tool. Say so, because the previous
        // wording sent us looking at the tool schema while the real problem
        // was maxTokens.
        throw new Error(
          'model did not return a complete compose_report tool call ' +
            '(most likely truncated: output exceeded maxTokens)',
        );
      }

      const content = composeReport(modelOutput, analyses);
      const base: SpotReportContent = { ...content, modelVersion: model };

      // Annotations are additive and must never fail a report: any error in
      // placement is swallowed and the report ships without pins. Placement
      // always runs on claude-opus-4-8 (the model that tested cleanest for
      // tool-call placement), independent of the report synthesis model.
      if (input.annotate) {
        try {
          // Placement is the FALLBACK now, not the primary source: items are
          // pinned from the analyzer's own bounding box where it drew one (see
          // pinFromBox), which is deterministic and needs no model call. A
          // separate placement call was both slower and less accurate — it
          // discarded a good box and re-guessed, differently each run.
          const place =
            input.placeFn ?? makeAnthropicPlaceFn(requireApiKey(), PLACEMENT_MODEL_DEFAULT);
          // Place the composed CONFIRMED items (the "visible in the photo"
          // rows), not the raw per-photo findings — so each pin is one report
          // row, tied by itemIndex, and the render numbers them by that index.
          const items: PlaceItemInput[] = content.items
            .map((it, itemIndex) => ({ it, itemIndex }))
            // Pin only what can actually be pointed at. This used to be
            // !hedged, which conflated "we cannot measure it" with "we cannot
            // show you where it is" — so a plainly visible fixed bench and
            // closed cabinet got no marker merely because their dimensions
            // need a tape measure, while the reader lost the one thing a photo
            // is good for. Absent grab bars and insufficient turning space
            // still get no pin: there is no object there to mark.
            .filter(({ it }) => it.locatable && PINNED_SEVERITIES.has(it.severity))
            .map(({ it, itemIndex }) => {
              const presetPin = boxPinForItem(it, analyses);
              return {
                itemIndex,
                title: it.title,
                detail: it.concern,
                severity: it.severity,
                presetPin: presetPin ?? undefined,
                // The box belongs to the photo whose analysis produced it.
                // Single-photo reports are the common case; for multi-photo,
                // analyses and photos are index-aligned by the caller.
                presetPhotoUrl: presetPin ? input.photos[0]?.blobUrl : undefined,
              };
            });

          // Edges get their position from the image rather than the box. The
          // analyzer's box for a threshold drifts about 6% between runs on the
          // same photo — the difference between marking the curb and marking
          // the floor in front of it — while the image itself does not move.
          // The photo is fetched ONCE here, not per finding, and no model call
          // is involved. If nothing dominates, snapToHorizontalEdge declines
          // and the box-derived position stands.
          await snapEdgeItems(items, input.photos[0]?.blobUrl);
          const photoAnnotations = await buildItemAnnotations(
            items,
            input.photos.map((p) => p.blobUrl),
            place,
            { minConfidence: input.minConfidence ?? SPOT_ANNOTATION_MIN_CONFIDENCE },
          );
          return { content: { ...base, photoAnnotations }, modelVersion: model };
        } catch (err) {
          console.warn(
            'spot composeAndPlaceReport: annotation build failed, shipping report without pins',
            err,
          );
        }
      }
      return { content: base, modelVersion: model };
    } catch (err) {
      lastError = err;
      if (attempt === 0) {
        console.warn('spot composeAndPlaceReport: synthesis attempt failed, retrying once', err);
      }
    }
  }

  throw lastError;
}
