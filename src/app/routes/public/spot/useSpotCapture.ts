/**
 * useSpotCapture — the free-read capture flow (Ada Spot 1b).
 *
 * Deliberately NOT usePhotoCapture: that hook is the bench field-test flow
 * (mints is_test sessions, uploads to blob, hits /api/ada/analyze-photo,
 * persists photo_analyses). This is a firewalled, self-contained flow:
 * downscale → base64 data URL → POST /api/spot/analyze (SSE) → render the
 * read as it streams → reconcile on the done frame. The free read is
 * transient — no session, no blob, no persistence here.
 *
 * State machine: idle → analyzing (progress accrues) → done | error.
 * `progress` is advisory and carries no verdict; `view` from the done frame
 * is the source of truth for the finished read.
 */

import { useCallback, useState } from 'react';
import { downscalePhoto } from '@/app/utils/downscalePhoto';
import { mapSpotFindings, type SpotResultView } from '@/lib/spot/mapSpotFindings';
import type { SpotProgressView } from '@/lib/spot/mapSpotProgress';
import type { PhotoAnalysisOutput } from '@/types/db';

export type SpotStatus = 'idle' | 'analyzing' | 'done' | 'error';
export type SpotTier = 'allowed' | 'soft_gated' | 'blocked';

export interface SpotUpsell {
  price_usd: number;
  max_photos: number;
  anchor: string;
}

export interface SpotState {
  status: SpotStatus;
  tier?: SpotTier;
  view?: SpotResultView;
  upsell?: SpotUpsell;
  /**
   * Partial result while the analysis streams. Advisory only — `view` (from
   * the done frame) is the source of truth for the finished read, and this
   * carries no verdict by construction (see mapSpotProgress).
   */
  progress?: SpotProgressView;
  /** True on a 503 — Ada Spot is turned off. */
  unavailable?: boolean;
  /** User-facing error message. */
  error?: string;
}

const IDLE: SpotState = { status: 'idle' };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });
}

interface SpotSseHandlers {
  onProgress: (view: SpotProgressView) => void;
  onDone: (payload: { tier: SpotTier; result?: PhotoAnalysisOutput; upsell?: SpotUpsell }) => void;
  onError: (message: string) => void;
}

/**
 * Read the SSE stream from /api/spot/analyze.
 *
 * Deliberately self-contained rather than sharing useChatSession's reader:
 * that one is unexported, shaped to the chat's TurnResponse, and has no test
 * coverage — and this flow is firewalled from Ada by design (same reason this
 * hook is not usePhotoCapture). ~40 lines of duplication beats coupling the
 * Ada chat to Spot; if a third consumer appears, extract then.
 *
 * Frames are `event:`/`data:` pairs separated by a blank line; partial bytes
 * are buffered until a full frame is available.
 */
async function consumeSpotSse(
  body: ReadableStream<Uint8Array>,
  handlers: SpotSseHandlers,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const dispatch = (frame: string) => {
    let event = 'message';
    let dataLine = '';
    for (const line of frame.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLine = line.slice(5).trim();
    }
    if (!dataLine) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(dataLine);
    } catch {
      return; // malformed payload — skip rather than killing the stream
    }

    if (event === 'progress') handlers.onProgress(parsed as SpotProgressView);
    else if (event === 'done') handlers.onDone(parsed as Parameters<SpotSseHandlers['onDone']>[0]);
    else if (event === 'error') {
      handlers.onError((parsed as { error?: string }).error ?? 'Analysis failed.');
    }
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let frameEnd = buffer.indexOf('\n\n');
      while (frameEnd !== -1) {
        dispatch(buffer.slice(0, frameEnd));
        buffer = buffer.slice(frameEnd + 2);
        frameEnd = buffer.indexOf('\n\n');
      }
    }
    // Flush a trailing frame if the final blank line never arrived.
    if (buffer.trim().length > 0) dispatch(buffer);
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
  }
}

export function useSpotCapture() {
  const [state, setState] = useState<SpotState>(IDLE);

  const reset = useCallback(() => setState(IDLE), []);

  /**
   * Reconcile the finished read. Both transports land here, so the done
   * frame and the JSON body can't drift in how they resolve state.
   */
  const applyFinal = useCallback(
    (data: { tier: SpotTier; result?: PhotoAnalysisOutput; upsell?: SpotUpsell }) => {
      if (data.tier === 'blocked') {
        setState({ status: 'done', tier: 'blocked', upsell: data.upsell });
        return;
      }
      if (!data.result) {
        setState({ status: 'error', error: 'Something went wrong reading your photos. Please try again.' });
        return;
      }
      // Drop `progress` — the mapped view supersedes it, and leaving both
      // would let a stale partial render alongside the real result.
      setState({
        status: 'done',
        tier: data.tier,
        view: mapSpotFindings(data.result),
        upsell: data.upsell,
      });
    },
    [],
  );

  const run = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      setState({ status: 'error', error: 'Add one or two photos first.' });
      return;
    }
    setState({ status: 'analyzing' });
    try {
      const photos = await Promise.all(
        files.slice(0, 1).map(async (f) => fileToDataUrl(await downscalePhoto(f))),
      );

      const res = await fetch('/api/spot/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ photos }),
      });

      if (res.status === 503) {
        setState({ status: 'error', unavailable: true, error: "Spot isn't available right now. Please check back soon." });
        return;
      }
      if (res.status === 413) {
        setState({ status: 'error', error: 'One of those photos is too large — try a smaller shot.' });
        return;
      }
      if (res.status === 400) {
        setState({ status: 'error', error: 'Please add one or two clear photos.' });
        return;
      }

      // The server only opens a stream once every gate has passed. Anything
      // else (429 blocked, 500, an intermediary that stripped SSE) is still
      // the JSON shape — fall back rather than trying to read frames.
      const isSse =
        res.ok &&
        (res.headers.get('content-type') ?? '').includes('text/event-stream') &&
        res.body !== null;

      if (!isSse) {
        const data = (await res.json()) as {
          tier: SpotTier;
          result?: PhotoAnalysisOutput;
          upsell?: SpotUpsell;
        };
        applyFinal(data);
        return;
      }

      let streamFailed: string | null = null;
      let sawDone = false;
      await consumeSpotSse(res.body!, {
        onProgress: (view) => {
          // Progress only ever adds to the analyzing state; it can't
          // resolve the read or render a verdict.
          setState((prev) =>
            prev.status === 'analyzing' ? { ...prev, progress: view } : prev,
          );
        },
        onDone: (payload) => {
          sawDone = true;
          applyFinal(payload);
        },
        onError: (message) => {
          streamFailed = message;
        },
      });

      // An error frame, or a stream that closed without ever sending done
      // (dropped connection, function timeout), leaves us with no result.
      if (!sawDone) {
        setState({
          status: 'error',
          error: streamFailed ?? 'Something went wrong reading your photos. Please try again.',
        });
      }
    } catch {
      setState({ status: 'error', error: 'Something went wrong. Please try again.' });
    }
  }, [applyFinal]);

  return { state, run, reset };
}
