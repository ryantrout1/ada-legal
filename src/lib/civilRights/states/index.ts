/**
 * State registry for the civil rights complaint page.
 *
 * Adding a state: write states/<code>.ts and add it to LIVE below. That is
 * the whole change (plus Gina's copy review). There is no "coming soon"
 * list on purpose: we only name states that actually work.
 */

import type { StateConfig } from '../types.js';
import { AZ } from './az.js';

const LIVE: StateConfig[] = [AZ];

/** Accepts the two-letter code or the name/slug, any case. */
export function resolveState(input: string | undefined | null): StateConfig | null {
  if (!input) return null;
  const key = input.trim().toLowerCase();
  if (!key) return null;
  return LIVE.find((s) => s.code === key || s.slug === key) ?? null;
}

export function listStates(): StateConfig[] {
  return [...LIVE];
}

export function CANONICAL_PATH(state: StateConfig): string {
  return `/civil-rights/${state.slug}`;
}
