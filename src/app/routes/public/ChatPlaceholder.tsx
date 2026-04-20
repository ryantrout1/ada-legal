/**
 * ChatPlaceholder — /chat route placeholder.
 *
 * Real chat UI lands in Step 11 part 3 (the turn after API routes).
 * For now this page demonstrates the layout + typography tokens, so
 * the homepage CTA routes to something visible while we stage the
 * streaming implementation.
 */

export default function ChatPlaceholder() {
  return (
    <section className="max-w-3xl mx-auto px-5 sm:px-8 py-16 sm:py-24">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-500 mb-5">
        Coming online soon
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-ink-900 mb-6">
        Ada is almost ready to talk.
      </h1>
      <p className="text-lg text-ink-700 leading-relaxed max-w-2xl">
        The conversational interface lands in the next deploy. The backend
        engine is live and fully tested — what's left is wiring the chat
        window to it. Check back shortly.
      </p>

      <div className="mt-10 p-6 border border-surface-200 rounded-md bg-surface-100">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-ink-500 mb-2">
          If you need ADA help right now
        </p>
        <ul className="space-y-3 text-ink-700">
          <li>
            <strong className="text-ink-900">Government building issue?</strong>{' '}
            File with the DOJ at{' '}
            <a
              href="https://ada.gov/filing-a-complaint"
              className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              ada.gov/filing-a-complaint
            </a>
            .
          </li>
          <li>
            <strong className="text-ink-900">Workplace issue?</strong> File with
            the EEOC at{' '}
            <a
              href="https://eeoc.gov/filing-charge-discrimination"
              className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              eeoc.gov/filing-charge-discrimination
            </a>
            .
          </li>
        </ul>
      </div>
    </section>
  );
}
