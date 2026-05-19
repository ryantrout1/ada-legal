/**
 * DocumentationRequiredBlock — reusable prominent docs-required section.
 *
 * Renders when a case has documentation_required prose for the
 * caller's reading level. The block is deliberately visually
 * prominent (border + accent tint) because eligibility frequently
 * pivots on whether the user has the documentation. Hiding this in
 * a paragraph would let users start an intake they can't complete.
 *
 * Props:
 *  - text: the resolved variant string (simple or professional) — the
 *    caller does the pickVariant() resolution so this component stays
 *    voice-agnostic.
 *
 * Renders nothing when text is null/empty.
 *
 * Ref: /plan Phase A3b.
 */

interface DocumentationRequiredBlockProps {
  text: string | null;
}

export function DocumentationRequiredBlock({
  text,
}: DocumentationRequiredBlockProps) {
  if (!text || !text.trim()) return null;
  return (
    <section
      aria-labelledby="documentation-required-heading"
      className="rounded-md border border-accent-500 bg-accent-50 p-5 sm:p-6"
    >
      <h2
        id="documentation-required-heading"
        className="font-display text-lg text-ink-900 mb-3"
      >
        Documentation you&rsquo;ll likely need
      </h2>
      <p className="text-ink-700 whitespace-pre-wrap leading-relaxed">
        {text}
      </p>
    </section>
  );
}
