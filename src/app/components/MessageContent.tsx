/**
 * MessageContent — renders a conversation message's `content`, which is
 * `string | ContentBlock[]` (see src/types/db.ts). Stored Ada transcripts mix
 * plain-string messages with Anthropic block arrays (text / tool_use /
 * tool_result / image). Rendering a block object directly as a React child
 * throws React error #31 ("Objects are not valid as a React child"), which is
 * exactly what crashed the attorney portal's case detail view.
 *
 * Rendering rules:
 *   - string         → plain text
 *   - text block     → its text
 *   - tool_use block → compact chip (Ada's structured extraction — useful to
 *                      the attorney; kept, not hidden)
 *   - image block    → inline thumbnail (url OR base64 source; base64 is NEVER
 *                      emitted as text)
 *   - tool_result    → hidden (echoes a prior tool_use; noise in a transcript)
 *   - unknown        → skipped safely (never drop a raw object into JSX)
 */

import type { ContentBlock } from '../../types/db.js';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Compact one-line summary of a tool_use block's input. */
function summarizeInput(input: unknown): string {
  if (input == null) return '';
  if (typeof input === 'string') return input;
  if (typeof input !== 'object') return String(input);
  const parts = Object.entries(input as Record<string, unknown>).map(([k, v]) => {
    const val =
      v == null
        ? ''
        : typeof v === 'object'
        ? JSON.stringify(v)
        : String(v);
    return `${k}: ${val}`;
  });
  const joined = parts.join(', ');
  return joined.length > 120 ? joined.slice(0, 117) + '…' : joined;
}

/** Resolve a renderable image src from an image block; null if unusable. */
function imageSrc(block: ContentBlock): string | null {
  const source = block.source as
    | { type?: string; url?: string; media_type?: string; data?: string }
    | undefined;
  if (!source) return null;
  if (source.type === 'url' && source.url) return source.url;
  if (source.type === 'base64' && source.data) {
    return `data:${source.media_type ?? 'image/jpeg'};base64,${source.data}`;
  }
  return null;
}

export default function MessageContent({
  content,
}: {
  content: string | ContentBlock[];
}) {
  if (typeof content === 'string') {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }
  if (!Array.isArray(content)) return null;

  return (
    <div className="flex flex-col items-start gap-1.5">
      {content.map((block, i) => {
        switch (block?.type) {
          case 'text':
            return (
              <p key={i} className="whitespace-pre-wrap">
                {asString(block.text)}
              </p>
            );
          case 'tool_use': {
            const name = asString(block.name) || 'tool';
            const summary = summarizeInput(block.input);
            return (
              <span
                key={i}
                className="inline-flex items-baseline gap-1.5 rounded border border-surface-200 bg-surface-50 px-2 py-0.5 text-xs text-ink-700"
              >
                <span className="font-mono uppercase tracking-wide text-ink-500">
                  {name}
                </span>
                {summary ? <span className="font-mono">{summary}</span> : null}
              </span>
            );
          }
          case 'image': {
            const src = imageSrc(block);
            return src ? (
              <img
                key={i}
                src={src}
                alt="Image submitted in the conversation"
                className="max-h-48 rounded border border-surface-200"
              />
            ) : null;
          }
          // tool_result and any unknown block type are intentionally not rendered.
          default:
            return null;
        }
      })}
    </div>
  );
}
