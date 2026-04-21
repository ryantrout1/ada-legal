/**
 * Tool dispatcher.
 *
 * Wraps a single tool invocation with: lookup by name, input validation,
 * execution, error handling, and timing. Returns a ToolInvocationRecord
 * that the turn loop stores on the session for observability.
 *
 * The dispatcher NEVER throws. All failure modes — unknown tool, invalid
 * input, execute() exception — surface as { ok: false, error } so Ada
 * sees the error in a tool_result block and can recover in conversation.
 *
 * Ref: docs/ARCHITECTURE.md §7
 */

import type { AnyAdaTool, ToolExecuteContext, ToolInvocationRecord, ToolResult } from './types.js';

export interface DispatchToolInput {
  name: string;
  input: unknown;
  ctx: ToolExecuteContext;
  registry: ReadonlyMap<string, AnyAdaTool>;
}

export async function dispatchTool({
  name,
  input,
  ctx,
  registry,
}: DispatchToolInput): Promise<ToolInvocationRecord> {
  const startedAt = ctx.clients.clock.now();

  const tool = registry.get(name);
  if (!tool) {
    return {
      name,
      input,
      result: {
        ok: false,
        error: `Unknown tool: '${name}'. Available tools: ${[...registry.keys()].join(', ')}.`,
      },
      durationMs: 0,
      timestamp: startedAt.toISOString(),
    };
  }

  // Validate input.
  let validated: unknown;
  try {
    validated = tool.validateInput(input);
  } catch (err) {
    return {
      name,
      input,
      result: {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      durationMs: elapsed(ctx, startedAt),
      timestamp: startedAt.toISOString(),
    };
  }

  // Execute.
  let result: ToolResult;
  try {
    result = await tool.execute(ctx, validated);
  } catch (err) {
    result = {
      ok: false,
      error: `Tool '${name}' threw during execution: ${
        err instanceof Error ? err.message : String(err)
      }`,
    };
  }

  return {
    name,
    input,
    result,
    durationMs: elapsed(ctx, startedAt),
    timestamp: startedAt.toISOString(),
  };
}

function elapsed(ctx: ToolExecuteContext, startedAt: Date): number {
  return ctx.clients.clock.now().getTime() - startedAt.getTime();
}
