/**
 * Ch1 tool registry.
 *
 * Tools Ada can invoke when running in a Ch1-enabled context (listing-
 * scoped sessions). Ch1 adds match_listing and finalize_intake on top
 * of the Ch0 set. The prompt assembler and dispatcher concatenate both
 * registries when Ch1 is active.
 *
 * Whether Ch1 tools surface to a given session depends on Ada's
 * organization + session type. In Step 20 we expose both tools
 * universally so Ada can promote public_ada sessions via match_listing.
 * A future step may gate based on whether any active listings exist at
 * all.
 *
 * Ref: Step 20.
 */

import type { AnyAdaTool } from './types.js';
import { matchListingTool } from './impls/matchListing.js';
import { finalizeIntakeTool } from './impls/finalizeIntake.js';

export const CH1_TOOLS: ReadonlyArray<AnyAdaTool> = [
  matchListingTool,
  finalizeIntakeTool,
] as const;
