/**
 * Tool type contracts.
 *
 * Every tool Ada can invoke implements the AdaTool interface. The dispatcher
 * uses a registry of these to route tool_use blocks from the AI stream.
 *
 * Design principles (per brief §7):
 *   - Each tool is a single module that exports one AdaTool
 *   - Tool inputs are validated against a JSON schema before execute() runs
 *   - Tool execution is pure-ish: it can read clients + current state, but
 *     it MUST NOT mutate the state directly. It returns a ToolResult that
 *     includes any requested state changes, which the turn loop applies.
 *   - Tool errors surface as { ok: false, error } results, not thrown —
 *     so Ada sees the error and can recover conversationally
 *
 * The state-change shape is deliberately narrow: a tool can propose new
 * extractedFields, a new classification, a new reading level, or a session
 * transition. Anything else stays out of tool scope.
 *
 * Ref: docs/ARCHITECTURE.md §7
 */

import type { AdaClients } from '@/engine/clients/types';
import type { AdaSessionState } from '@/engine/types';
import type {
  Classification,
  ExtractedFields,
  PhotoFinding,
  ReadingLevel,
} from '@/types/db';
import type { SessionTransition } from '@/engine/session/stateMachine';

// ─── Tool I/O ─────────────────────────────────────────────────────────────────

/** JSON-schema-shaped input definition, matching Anthropic's tool_use format. */
export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

/** State changes a tool may request. The turn loop merges these into state. */
export interface ToolStateChanges {
  extractedFieldsPatch?: Partial<ExtractedFields>;
  classification?: Classification;
  readingLevel?: ReadingLevel;
  sessionTransition?: SessionTransition;
  photoFindings?: PhotoFinding[];
}

/** The result a tool returns. `content` is what goes back to Anthropic. */
export type ToolResult =
  | {
      ok: true;
      /** Free-form content for the AI to see (stringified by the dispatcher). */
      content: unknown;
      stateChanges?: ToolStateChanges;
    }
  | {
      ok: false;
      /** Error message the AI will see as a tool_result with is_error=true. */
      error: string;
    };

/** Execution context passed to every tool. */
export interface ToolExecuteContext {
  clients: AdaClients;
  /**
   * Snapshot of state at the start of the turn. Tools should NOT mutate
   * this object; propose changes via ToolResult.stateChanges instead.
   */
  state: AdaSessionState;
}

/** The contract every tool module exports. */
export interface AdaTool<Input = unknown> {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  /**
   * Validate and coerce input. Return the typed input or throw with a
   * helpful message. Called by the dispatcher before execute().
   */
  validateInput: (raw: unknown) => Input;
  execute: (ctx: ToolExecuteContext, input: Input) => Promise<ToolResult>;
}

/**
 * Erased variant used by the registry and dispatcher, since the registry
 * holds tools with different Input types. The dispatcher always calls
 * validateInput() before execute(), so the runtime invariant holds even
 * though TypeScript can't prove it through the Input parameter.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAdaTool = AdaTool<any>;

// ─── Tool invocation records (what the turn loop logs) ────────────────────────

export interface ToolInvocationRecord {
  name: string;
  input: unknown;
  result: ToolResult;
  /** ms between dispatch and result. */
  durationMs: number;
  timestamp: string;
}
