/**
 * useSpotCapture — the free-read capture flow (Ada Spot 1b).
 *
 * Deliberately NOT usePhotoCapture: that hook is the bench field-test flow
 * (mints is_test sessions, uploads to blob, hits /api/ada/analyze-photo,
 * persists photo_analyses). This is a firewalled, self-contained flow:
 * downscale → base64 data URL → POST /api/spot/analyze → map the result.
 * The free read is transient — no session, no blob, no persistence here.
 *
 * State machine: idle → analyzing → done | error.
 */

import { useCallback, useState } from 'react';
import { downscalePhoto } from '@/app/utils/downscalePhoto';
import { mapSpotFindings, type SpotResultView } from '@/lib/spot/mapSpotFindings';
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

export function useSpotCapture() {
  const [state, setState] = useState<SpotState>(IDLE);

  const reset = useCallback(() => setState(IDLE), []);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos }),
      });

      if (res.status === 503) {
        setState({ status: 'error', unavailable: true, error: "Ada Spot isn't available right now. Please check back soon." });
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

      const data = (await res.json()) as {
        tier: SpotTier;
        result?: PhotoAnalysisOutput;
        upsell?: SpotUpsell;
      };

      if (data.tier === 'blocked') {
        setState({ status: 'done', tier: 'blocked', upsell: data.upsell });
        return;
      }
      if (!res.ok || !data.result) {
        setState({ status: 'error', error: 'Something went wrong reading your photos. Please try again.' });
        return;
      }
      setState({
        status: 'done',
        tier: data.tier,
        view: mapSpotFindings(data.result),
        upsell: data.upsell,
      });
    } catch {
      setState({ status: 'error', error: 'Something went wrong. Please try again.' });
    }
  }, []);

  return { state, run, reset };
}
