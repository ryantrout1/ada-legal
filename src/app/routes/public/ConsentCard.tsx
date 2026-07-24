/**
 * ConsentCard — the claimant's consent action on the readout page (/s/:slug).
 *
 * Rendered only for lanes that involve a handoff (routed_firm / sourcing /
 * general_queue) and only until consent is given. Posts to
 * /api/packages/[slug]/consent. The claimant is sharing their intake details;
 * this is their explicit, in-their-control choice — phrased as a question, not
 * a directive (matching the page's "informational, never directive" principle).
 *
 * Accessibility (WCAG 2.2 AAA): semantic section + heading, a real <button>
 * (keyboard-operable), visible focus ring, ≥44px target (py-3), meaning never
 * by color alone (text labels throughout), success announced via aria-live,
 * errors via role="alert".
 *
 * Copy here is flagged for Gina's review before launch.
 *
 * Ref: /plan Phase 1b.
 */

import { useState } from 'react';

type Lane =
  | 'routed_firm'
  | 'sourcing'
  | 'general_queue'
  | 'self_help'
  | 'no_action'
  | 'direct'
  | 'matched_self_referral'
  | 'pool'
  | null;

interface ConsentCopy {
  eyebrow: string;
  heading: string;
  body: string;
  button: string;
}

const COPY: Record<'routed_firm' | 'sourcing' | 'general_queue' | 'pool', ConsentCopy> = {
  routed_firm: {
    eyebrow: 'Connect with an attorney',
    heading: 'Want us to share your details with the attorney on this case?',
    body: 'An attorney handling this case can review what you described and reach out to you. Nothing is shared until you say yes.',
    button: 'Yes, share my details',
  },
  sourcing: {
    eyebrow: 'Find an attorney',
    heading: 'Want us to help find an attorney for your situation?',
    body: 'We can look for an attorney who handles cases like yours and pass along what you described. Nothing is shared until you say yes.',
    button: 'Yes, help me find an attorney',
  },
  general_queue: {
    eyebrow: 'Get a closer look',
    heading: 'Want someone on our team to review your situation?',
    body: 'Our team can review what you described and connect you with the right help. Nothing is shared until you say yes.',
    button: 'Yes, review my situation',
  },
  pool: {
    eyebrow: 'Make your case available to attorneys',
    heading: 'Want to make your case available for an attorney to pick up?',
    body: 'We can add your situation to a list attorneys review. Your name and contact details stay private until an attorney takes your case — then they can reach out to you. Nothing is shared until you say yes.',
    button: 'Yes, make my case available',
  },
};

type Status = 'idle' | 'submitting' | 'done' | 'error';

export default function ConsentCard({
  slug,
  lane,
  initialConsented,
}: {
  slug: string;
  lane: Lane;
  initialConsented: boolean | null;
}) {
  const [status, setStatus] = useState<Status>(initialConsented ? 'done' : 'idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Only the handoff lanes get a consent action. matched_self_referral shows
  // the firm's public contact on the readout but involves no handoff, so it
  // gets no consent card — the claimant reaches out to the firm themselves.
  // 'pool' does get a consent action: consenting is what makes the case
  // available for an attorney to claim (contact stays private until claimed).
  if (
    lane !== 'routed_firm' &&
    lane !== 'sourcing' &&
    lane !== 'general_queue' &&
    lane !== 'pool'
  ) {
    return null;
  }
  const copy = COPY[lane];

  async function submit() {
    setStatus('submitting');
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/packages/${encodeURIComponent(slug)}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "I couldn't record that just now.");
      }
      setStatus('done');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "I couldn't record that just now.");
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <section
        className="mb-10 bg-accent-50 border-2 border-accent-500 rounded-md p-5 sm:p-6"
        aria-labelledby="consent-done"
      >
        <p className="text-xs uppercase tracking-wider font-mono text-accent-600 mb-2">Shared</p>
        <h2 id="consent-done" className="font-display text-xl text-ink-900 mb-2 leading-tight">
          Thank you — we&rsquo;ll share your details.
        </h2>
        <p className="text-ink-700" aria-live="polite">
          You&rsquo;re in control. If you change your mind, reply to your summary email anytime to
          withdraw.
        </p>
      </section>
    );
  }

  return (
    <section
      className="mb-10 bg-accent-50 border-2 border-accent-500 rounded-md p-5 sm:p-6"
      aria-labelledby="consent-heading"
    >
      <p className="text-xs uppercase tracking-wider font-mono text-accent-600 mb-2">
        {copy.eyebrow}
      </p>
      <h2 id="consent-heading" className="font-display text-xl text-ink-900 mb-3 leading-tight">
        {copy.heading}
      </h2>
      <p className="text-ink-700 mb-5">{copy.body}</p>

      <button
        type="button"
        onClick={submit}
        disabled={status === 'submitting'}
        className="min-h-[44px] px-5 py-3 rounded-md bg-accent-500 text-white font-medium hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 disabled:opacity-70 transition-colors"
      >
        {status === 'submitting' ? 'Sharing…' : copy.button}
      </button>

      {status === 'error' && errorMsg && (
        <p role="alert" className="mt-3 text-ink-900 font-medium">
          {errorMsg} Please try again.
        </p>
      )}
    </section>
  );
}
