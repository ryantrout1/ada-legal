/**
 * NoDocumentationOfframp — graceful off-ramp for users without
 * documentation.
 *
 * Shown alongside DocumentationRequiredBlock when the case has
 * no_documentation_path prose. Frames the path forward: even if you
 * can't join the class action because you lack the paper trail, the
 * incident is still actionable through a DOJ complaint or a demand
 * letter — both of which Ada can help draft (Plan C). For now those
 * are placeholder buttons that open the chat with a pre-seeded
 * prompt; the full feature ships in a later plan.
 *
 * Props:
 *  - text: the resolved variant string for no_documentation_path
 *    (simple or professional) — caller resolves the voice.
 *  - onStartChat: callback to start the standard chat session.
 *    Optional — if not provided, the buttons fall through to a plain
 *    Link element pointing at /chat. Provided so the parent can wire
 *    the litigation_id deep-link.
 *
 * Renders nothing when text is null/empty.
 *
 * Ref: /plan Phase A3b. Full DOJ-complaint + demand-letter generation
 * is a Plan C feature; this block sets the affordance now.
 */

import { Link } from 'react-router-dom';

interface NoDocumentationOfframpProps {
  text: string | null;
  onStartChat?: () => void;
  disabled?: boolean;
}

export function NoDocumentationOfframp({
  text,
  onStartChat,
  disabled,
}: NoDocumentationOfframpProps) {
  if (!text || !text.trim()) return null;
  return (
    <section
      aria-labelledby="no-documentation-heading"
      className="rounded-md border border-surface-200 bg-surface-100 p-5 sm:p-6"
    >
      <h2
        id="no-documentation-heading"
        className="font-display text-lg text-ink-900 mb-3"
      >
        What if you don&rsquo;t have documentation?
      </h2>
      <p className="text-ink-700 whitespace-pre-wrap leading-relaxed mb-4">
        {text}
      </p>
      <p className="text-sm text-ink-700 mb-3">
        Even without the paper trail, your experience can still be
        actionable. Ada can help you think through next steps.
      </p>
      {onStartChat ? (
        <button
          type="button"
          onClick={onStartChat}
          disabled={disabled}
          className="inline-block px-4 py-2 rounded-md border border-accent-500 bg-white text-accent-600 font-medium hover:bg-accent-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Talk to Ada about next steps
        </button>
      ) : (
        <Link
          to="/ada"
          className="inline-block px-4 py-2 rounded-md border border-accent-500 bg-white text-accent-600 font-medium hover:bg-accent-50 transition-colors"
        >
          Talk to Ada about next steps
        </Link>
      )}
    </section>
  );
}
