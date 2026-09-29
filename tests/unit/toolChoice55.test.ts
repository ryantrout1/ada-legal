/**
 * Model upgrade R3: the 5.5 models reject forced tool use (tool_choice
 * "tool"/"any" returns 400). For those models the photo reader and pin
 * placement send auto tool choice plus an explicit instruction, with room
 * for thinking. For every other model the request is exactly what it was.
 */
import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';
import { AnthropicPhotoAnalysisClient } from '@/engine/clients/anthropicPhotoAnalysisClient';
import { forcedToolChoiceSupported } from '@/lib/claudeModels';

const req = { blobKeys: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=='] };

function msg(content: unknown[], stop: Anthropic.Message['stop_reason'] = 'end_turn'): Anthropic.Message {
  return {
    id: 'm', type: 'message', role: 'assistant', model: 'x',
    content: content as Anthropic.Message['content'],
    stop_reason: stop, stop_sequence: null, usage: { input_tokens: 0, output_tokens: 0 },
  } as Anthropic.Message;
}
const full = () =>
  msg([
    { type: 'thinking', thinking: 'looking', signature: 's' },
    {
      type: 'tool_use', id: 't', name: 'report_findings',
      input: {
        scene: 'Door.', summary: 'One concern.', positive_findings: [],
        findings: [{ title: 'Knob', finding: 'Round knob.', severity: 'major', standard: '§404.2.7', confidence: 0.8, confirmable: true }],
      },
    },
  ]);
const empty = () => msg([{ type: 'text', text: 'Here is what I see.' }]);

function stub(model: string | undefined, ...responses: Anthropic.Message[]) {
  // Every canned response is served by whichever transport the client uses:
  // create() for forced-tool models, stream().finalMessage() for 5.5 models
  // (the SDK refuses non-streamed calls with large max_tokens).
  const queue = [...responses];
  const create = vi.fn(async (_p: unknown) => queue.shift());
  const stream = vi.fn((_p: unknown) => ({ on: () => undefined, finalMessage: async () => queue.shift() }));
  const client = model ? new AnthropicPhotoAnalysisClient('k', model) : new AnthropicPhotoAnalysisClient('k');
  (client as unknown as { client: unknown }).client = { messages: { create, stream } };
  return { client, create, stream };
}

type Params = {
  tool_choice?: { type: string; name?: string };
  max_tokens: number;
  messages: Array<{ content: Array<{ type: string; text?: string }> }>;
};

describe('forcedToolChoiceSupported', () => {
  it('is false only for models that reject forced tool use', () => {
    expect(forcedToolChoiceSupported('claude-opus-5-5')).toBe(false);
    expect(forcedToolChoiceSupported('claude-sonnet-5-5')).toBe(false);
    expect(forcedToolChoiceSupported('claude-opus-4-8')).toBe(true);
    expect(forcedToolChoiceSupported('claude-opus-5')).toBe(true);
    expect(forcedToolChoiceSupported('claude-sonnet-5')).toBe(true);
  });
});

describe('photo reader request per model', () => {
  it('on Opus 5.5: auto tool choice, an explicit instruction, and room for thinking, streamed', async () => {
    const { client, create, stream } = stub('claude-opus-5-5', full());
    const res = await client.analyze(req);
    // 32000 tokens is past the SDK's non-streaming limit, so this must stream.
    expect(create).not.toHaveBeenCalled();
    const p = stream.mock.calls[0][0] as Params;
    expect(p.tool_choice).toEqual({ type: 'auto' });
    expect(p.max_tokens).toBe(32000);
    const last = p.messages[0].content.at(-1)!;
    expect(last.type).toBe('text');
    expect(last.text).toMatch(/report_findings/);
    expect(res.output.findings).toHaveLength(1);
    expect(res.output.meta?.tool_call_present).toBe(true);
  });

  it('on Opus 4.8: unchanged (forced tool, 16000, no extra instruction, not streamed)', async () => {
    const { client, create, stream } = stub(undefined, full());
    await client.analyze(req);
    expect(stream).not.toHaveBeenCalled();
    const p = create.mock.calls[0][0] as Params;
    expect(p.tool_choice).toEqual({ type: 'tool', name: 'report_findings' });
    expect(p.max_tokens).toBe(16000);
    expect(p.messages[0].content).toHaveLength(2); // "Photo 1:" + image
  });

  it('on Opus 5.5 a text-only reply still never reads as "no barriers"', async () => {
    const { client, stream } = stub('claude-opus-5-5', empty(), empty());
    const res = await client.analyze(req);
    expect(stream).toHaveBeenCalledTimes(2);
    expect(res.output.meta?.tool_call_present).toBe(false);
  });
});

describe('streamed free read per model', () => {
  function streamOf(response: Anthropic.Message) {
    return { on: () => undefined, finalMessage: async () => response };
  }

  it('on Opus 5.5: a streamed reply with no tool call falls back to one more read', async () => {
    const { client, stream } = stub('claude-opus-5-5', full());
    stream.mockReturnValueOnce(streamOf(empty()));
    const res = await client.analyzeStream(req, () => {});
    expect(stream).toHaveBeenCalledTimes(2);
    expect(res.output.findings).toHaveLength(1);
  });

  it('on Opus 4.8: unchanged, no fallback call', async () => {
    const { client, create, stream } = stub(undefined);
    stream.mockReturnValueOnce(streamOf(empty()));
    const res = await client.analyzeStream(req, () => {});
    expect(create).not.toHaveBeenCalled();
    expect(res.output.meta?.tool_call_present).toBe(false);
  });
});
