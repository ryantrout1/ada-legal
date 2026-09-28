/**
 * Ada chat usage log (/plan Ada chat to Sonnet 5.5, Phase 2a).
 *
 * One `ada_ai_usage` log line per model round trip, numbers only, so
 * prompt caching can be verified from runtime logs. Never message text.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const events: unknown[] = [];

vi.mock('@anthropic-ai/sdk', () => {
  class FakeAnthropic {
    messages = {
      stream: () => ({
        async *[Symbol.asyncIterator]() {
          for (const e of events) yield e;
        },
      }),
    };
  }
  return { default: FakeAnthropic };
});

const SECRET = 'my wheelchair could not get through the door';

function setEvents(): void {
  events.length = 0;
  events.push(
    {
      type: 'message_start',
      message: {
        model: 'claude-test-model',
        usage: {
          input_tokens: 120,
          output_tokens: 1,
          cache_read_input_tokens: 4000,
          cache_creation_input_tokens: 0,
        },
      },
    },
    { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
    { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: SECRET } },
    { type: 'content_block_stop', index: 0 },
    { type: 'message_delta', delta: { stop_reason: 'end_turn' }, usage: { output_tokens: 57 } },
    { type: 'message_stop' },
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AnthropicAiClient usage log', () => {
  it('logs one ada_ai_usage line with model and cache numbers, no text', async () => {
    setEvents();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { AnthropicAiClient } = await import(
      '../../src/engine/clients/anthropicAiClient.js'
    );
    const client = new AnthropicAiClient('test-key');
    const chunks = [];
    for await (const c of client.stream({
      systemPrompt: 'sys',
      messages: [{ role: 'user', content: SECRET }],
      tools: [],
    } as never)) {
      chunks.push(c);
    }

    // Streaming behavior unchanged.
    expect(chunks.some((c) => c.type === 'text_delta')).toBe(true);
    expect(chunks.at(-1)).toEqual({ type: 'message_stop' });

    const lines = log.mock.calls
      .map((args) => String(args[0]))
      .filter((s) => s.includes('ada_ai_usage'));
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]!);
    expect(parsed).toEqual({
      evt: 'ada_ai_usage',
      model: 'claude-test-model',
      input: 120,
      output: 57,
      cache_read: 4000,
      cache_creation: 0,
      stop_reason: 'end_turn',
    });
    expect(lines[0]).not.toContain('wheelchair');
  });
});
