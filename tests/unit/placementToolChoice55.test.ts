/**
 * Model upgrade R3: Spot pin placement on models that reject forced tool
 * use sends auto tool choice, an instruction, room for thinking and low
 * effort. Other models are unchanged. placeFinding swallows errors, so a
 * rejected request would silently drop every pin; this pins the request.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const calls: Array<Record<string, unknown>> = [];
vi.mock('@anthropic-ai/sdk', () => {
  class FakeAnthropic {
    messages = {
      create: async (p: Record<string, unknown>) => {
        calls.push(p);
        return {
          content: [
            { type: 'thinking', thinking: 'hm', signature: 's' },
            { type: 'tool_use', id: 't', name: 'place_finding', input: { placeable: true, x: 0.4, y: 0.6, confidence: 0.9, label: 'Door knob' } },
          ],
          stop_reason: 'tool_use',
        };
      },
    };
  }
  return { default: FakeAnthropic };
});

beforeEach(() => { calls.length = 0; });

const target = { title: 'Door knob', detail: 'Round knob needs twisting.' };

describe('placement request per model', () => {
  it('on Opus 5.5: auto, instruction, 4000 tokens, low effort, and the pin still lands', async () => {
    const { makeAnthropicPlaceFn } = await import('@/lib/spot/placeFindingAnthropic');
    const pin = await makeAnthropicPlaceFn('k', 'claude-opus-5-5')('https://blob/x.jpg', target);
    const p = calls[0] as { tool_choice: unknown; max_tokens: number; output_config?: { effort?: string }; messages: Array<{ content: Array<{ type: string; text?: string }> }> };
    expect(p.tool_choice).toEqual({ type: 'auto' });
    expect(p.max_tokens).toBe(4000);
    expect(p.output_config?.effort).toBe('low');
    expect(p.messages[0].content.at(-1)!.text).toMatch(/place_finding/);
    expect(pin).toMatchObject({ x: 0.4, y: 0.6 });
  });

  it('on Opus 4.8: unchanged (forced, 256, no output_config)', async () => {
    const { makeAnthropicPlaceFn } = await import('@/lib/spot/placeFindingAnthropic');
    await makeAnthropicPlaceFn('k', 'claude-opus-4-8')('https://blob/x.jpg', target);
    const p = calls[0] as { tool_choice: unknown; max_tokens: number; output_config?: unknown };
    expect(p.tool_choice).toEqual({ type: 'tool', name: 'place_finding' });
    expect(p.max_tokens).toBe(256);
    expect(p.output_config).toBeUndefined();
  });
});
