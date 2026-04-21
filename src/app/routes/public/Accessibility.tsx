/**
 * Accessibility — public accessibility statement.
 *
 * This page is a public commitment. The ADA community is the audience
 * this product is built for, and they deserve to see exactly what we
 * aim for, what we test, what we know is still broken, and how to
 * reach a human when something doesn't work for them.
 *
 * Written at plain-language reading level. No marketing voice, no
 * hedging. If we find out something here is false, we fix it.
 *
 * Ref: docs/ARCHITECTURE.md §15 accessibility
 */

export default function Accessibility() {
  return (
    <section className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
      <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent-500 mb-5">
        Accessibility statement
      </p>
      <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight text-ink-900 mb-6">
        Ada is for everyone.
      </h1>
      <p className="text-lg text-ink-700 leading-relaxed mb-12">
        If you can't use this site because of a disability, that's our
        problem to fix. Email{' '}
        <a
          href="mailto:accessibility@adalegallink.com"
          className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
        >
          accessibility@adalegallink.com
        </a>{' '}
        and we will get back to you within two business days. If you
        prefer to talk, tell us in the email and we will find a way.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What we commit to
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        We target <strong>WCAG 2.2 Level AAA</strong>. AAA is the highest of
        the three web accessibility standards. Most of the web does not
        aim for it. We do, because a service built for the ADA community
        that isn't fully accessible is a contradiction.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        AAA is a floor, not a ceiling. The goal is not compliance — it
        is that every person we say we serve can actually use Ada to
        get help.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What this means in practice
      </h2>
      <ul className="space-y-3 text-ink-700 mb-10 list-none p-0">
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✓
          </span>
          <span>
            <strong>Voice input</strong> — speak instead of typing. The
            microphone button is in every chat conversation.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✓
          </span>
          <span>
            <strong>Read aloud</strong> — Ada can read her answers to
            you. Turn on the "Speak" button in the chat header.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✓
          </span>
          <span>
            <strong>Plain language</strong> — pick the "Simple" reading
            level. Short sentences, no legal terms, one question at a
            time.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✓
          </span>
          <span>
            <strong>Come back later</strong> — if you need to step away,
            close the tab. Your conversation is saved for 30 days. When
            you return, Ada asks if you want to continue.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✓
          </span>
          <span>
            <strong>Save your conversation</strong> — download a copy of
            anything you and Ada discussed. Useful if you want to show
            it to an attorney later.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✓
          </span>
          <span>
            <strong>Keyboard-only navigation</strong> — every button,
            link, and input works without a mouse.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✓
          </span>
          <span>
            <strong>High contrast mode</strong> — the site works with
            Windows High Contrast and macOS Increase Contrast turned on.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✓
          </span>
          <span>
            <strong>Reduced motion</strong> — if you have that setting
            turned on in your operating system, we turn off animations
            here too.
          </span>
        </li>
      </ul>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What we test
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        Every release is checked against the axe-core accessibility
        engine at AAA level on every public route. We also do manual
        checks with a keyboard and with a screen reader before a
        release ships.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        Automated tools catch about a third of real accessibility
        problems. Humans catch the rest. That means you may still find
        something we missed.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What we know is not perfect yet
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        Honesty matters here. Known issues as of today:
      </p>
      <ul className="space-y-3 text-ink-700 mb-10 list-none p-0">
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-warning-500 flex-none">
            ·
          </span>
          <span>
            Voice input does not work in Firefox. Chrome, Edge, and
            Safari support it. We are looking at server-side speech
            recognition as a Firefox fallback.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-warning-500 flex-none">
            ·
          </span>
          <span>
            The "Read aloud" voice uses whatever your device provides.
            Some are more natural than others. Custom voice selection
            is planned.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-warning-500 flex-none">
            ·
          </span>
          <span>
            No ASL video introduction yet. For Deaf users who prefer
            ASL, this is something we know we owe you. It is planned.
          </span>
        </li>
      </ul>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        If something doesn't work
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        Tell us. Email{' '}
        <a
          href="mailto:accessibility@adalegallink.com"
          className="text-accent-500 hover:text-accent-600 underline underline-offset-2"
        >
          accessibility@adalegallink.com
        </a>
        . Include what you were trying to do, what happened, and what
        device and browser you were using if you know. If you use a
        screen reader, tell us which one.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        We will respond within two business days. Accessibility bugs
        are fixed ahead of feature work.
      </p>

      <div className="text-sm text-ink-500 border-t border-surface-200 pt-6">
        <p>Last updated: April 2026.</p>
        <p className="mt-2">
          This statement applies to <strong>adalegallink.com</strong> and
          all its subdomains.
        </p>
      </div>
    </section>
  );
}
