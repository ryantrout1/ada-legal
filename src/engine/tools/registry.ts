/**
 * Ch0 tool registry.
 *
 * The authoritative list of tools Ada can invoke in Ch0 sessions. The
 * prompt assembler (Step 8) reads this list to build the <tools> section
 * of the system prompt. The dispatcher uses this to route tool_use blocks
 * by name.
 *
 * Adding a Ch0 tool: append to CH0_TOOLS. That's it — the dispatcher,
 * prompt assembler, and AI client will all pick it up automatically.
 *
 * Ch1 will add additional tools; the registry for those lives in a
 * separate file to keep Ch0 scope clean.
 *
 * Ref: docs/ARCHITECTURE.md §7
 */

import type { AnyAdaTool } from './types.js';
import { setClassificationTool } from './impls/setClassification.js';
import { extractFieldTool } from './impls/extractField.js';
import { analyzePhotoTool } from './impls/analyzePhoto.js';
import { searchAttorneysTool } from './impls/searchAttorneys.js';
import { setReadingLevelTool } from './impls/setReadingLevel.js';
import { endSessionTool } from './impls/endSession.js';

export const CH0_TOOLS: ReadonlyArray<AnyAdaTool> = [
  setClassificationTool,
  extractFieldTool,
  analyzePhotoTool,
  searchAttorneysTool,
  setReadingLevelTool,
  endSessionTool,
] as const;

/** Build a name → tool lookup for the dispatcher. */
export function buildToolIndex(tools: ReadonlyArray<AnyAdaTool>): Map<string, AnyAdaTool> {
  const index = new Map<string, AnyAdaTool>();
  for (const tool of tools) {
    if (index.has(tool.name)) {
      throw new Error(`Duplicate tool name in registry: ${tool.name}`);
    }
    index.set(tool.name, tool);
  }
  return index;
}
