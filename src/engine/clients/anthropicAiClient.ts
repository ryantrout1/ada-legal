/**
 * AnthropicAiClient — real implementation of AiClient.
 *
 * Streams responses from Anthropic's Messages API with tool-use enabled.
 * Implements the AsyncIterable<AiStreamChunk> contract defined in
 * src/engine/clients/types.ts.
 *
 * The engine code does not know or care this is Anthropic; it sees only
 * the AiClient interface. That's what lets us swap in InMemoryAiClient
 * for tests.
 *
 * Model default: claude-sonnet-4-5 (model alias, floats forward with
 * minor Anthropic snapshot updates). Override via req.model if a given
 * call wants a different tier.
 *
 * Chunk mapping (Anthropic stream event → our AiStreamChunk):
 *   content_block_start (text)      → text_delta (empty init, nothing emitted)
 *   content_block_delta (text)      → text_delta with delta text
 *   content_block_start (tool_use)  → tool_use_start with name + id
 *   content_block_delta (tool_use)  → tool_use_delta with partial JSON
 *   content_block_stop              → tool_use_stop (for tool blocks only)
 *   message_stop                    → message_stop
 *
 * Ref: docs/ARCHITECTURE.md §9
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AiClient,
  AiStreamChunk,
  AiStreamRequest,
} from './types.js';

const DEFAULT_MODEL = 'claude-sonnet-4-5';
const DEFAULT_MAX_TOKENS = 4096;

export class AnthropicAiClient implements AiClient {
  private readonly client: Anthropic;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('AnthropicAiClient: apiKey is required');
    }
    this.client = new Anthropic({ apiKey });
  }

  async *stream(req: AiStreamRequest): AsyncIterable<AiStreamChunk> {
    const anthropicMessages = req.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        // Content can be a string OR an array of content blocks (text,
        // image, tool_use, tool_result). Anthropic accepts both shapes;
        // pass through unchanged. Image blocks let Ada see uploaded
        // photos natively without a separate analyzer call. The turn
        // loop is responsible for ensuring blocks conform to Anthropic
        // shapes (tool_use with id/name/input, etc.).
        content: m.content as never,
      }));

    // System prompt: when a cache prefix is provided, we send Anthropic
    // an array of two system blocks — the stable prefix first with
    // cache_control: ephemeral, the volatile suffix second uncached.
    // This lets Anthropic skip prefill on the prefix from turn 2 onward
    // and bills it at ~10% of normal input rate. When no prefix is
    // provided (or it's empty), fall back to plain string for
    // backward compatibility.
    const hasPrefix =
      typeof req.systemPromptCachePrefix === 'string' &&
      req.systemPromptCachePrefix.trim().length > 0;
    const systemBlocks: Array<{
      type: 'text';
      text: string;
      cache_control?: { type: 'ephemeral' };
    }> = [];
    if (hasPrefix) {
      systemBlocks.push({
        type: 'text',
        text: req.systemPromptCachePrefix as string,
        cache_control: { type: 'ephemeral' },
      });
    }
    if (req.systemPrompt.trim().length > 0) {
      systemBlocks.push({ type: 'text', text: req.systemPrompt });
    }
    const systemParam: string | typeof systemBlocks = hasPrefix
      ? systemBlocks
      : req.systemPrompt;

    const stream = this.client.messages.stream({
      model: req.model ?? DEFAULT_MODEL,
      max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
      system: systemParam as never, // SDK accepts both shapes; types lag features.
      messages: anthropicMessages,
      tools: req.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      })),
    });

    // Track which content blocks are tool_use so we emit the right chunk types.
    const blockKinds = new Map<number, 'text' | 'tool_use'>();
    const toolUseBuffers = new Map<number, { id: string; name: string; json: string }>();

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'text') {
          blockKinds.set(event.index, 'text');
        } else if (event.content_block.type === 'tool_use') {
          blockKinds.set(event.index, 'tool_use');
          toolUseBuffers.set(event.index, {
            id: event.content_block.id,
            name: event.content_block.name,
            json: '',
          });
          yield {
            type: 'tool_use_start',
            toolName: event.content_block.name,
            toolId: event.content_block.id,
          };
        }
      } else if (event.type === 'content_block_delta') {
        const kind = blockKinds.get(event.index);
        if (kind === 'text' && event.delta.type === 'text_delta') {
          yield { type: 'text_delta', content: event.delta.text };
        } else if (kind === 'tool_use' && event.delta.type === 'input_json_delta') {
          const buf = toolUseBuffers.get(event.index);
          if (buf) {
            buf.json += event.delta.partial_json;
            yield {
              type: 'tool_use_delta',
              toolId: buf.id,
              toolName: buf.name,
            };
          }
        }
      } else if (event.type === 'content_block_stop') {
        const kind = blockKinds.get(event.index);
        if (kind === 'tool_use') {
          const buf = toolUseBuffers.get(event.index);
          if (buf) {
            // Parse accumulated JSON into structured input.
            let toolInput: Record<string, unknown> = {};
            try {
              toolInput = buf.json.trim().length > 0 ? JSON.parse(buf.json) : {};
            } catch {
              // Leave as empty; dispatcher will report validation error
              // which Ada can recover from.
              toolInput = { __parse_error: true, __raw: buf.json };
            }
            yield {
              type: 'tool_use_stop',
              toolId: buf.id,
              toolName: buf.name,
              toolInput,
            };
          }
        }
      } else if (event.type === 'message_stop') {
        yield { type: 'message_stop' };
      }
    }
  }
}
