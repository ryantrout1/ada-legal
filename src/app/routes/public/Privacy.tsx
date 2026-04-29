/**
 * Privacy — public privacy policy.
 *
 * Draft for Gina's legal review. Written at plain-language reading
 * level where possible; some sections (data processors, legal bases)
 * require precision that can't be dumbed down.
 *
 * This policy is intentionally short and honest. The longer a privacy
 * policy is, the less people read it. The goal here is for a real
 * person to be able to understand what we do with their information
 * in under three minutes.
 *
 * Key commitments the policy makes the product accountable to:
 *   - No selling of personal data, ever
 *   - No advertising use
 *   - Conversation content is never shared with third parties except
 *     Anthropic (the AI provider) and the attorney the user chooses
 *   - Anonymous sessions stay anonymous
 *   - 30-day conversation retention by default, user can delete sooner
 *   - Right to access, right to delete, right to export
 *
 * Ref: docs/ARCHITECTURE.md §16 privacy
 */

import { Link } from 'react-router-dom';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';

export default function Privacy() {
  return (
    <section className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: 'Privacy' },
        ]}
        className="mb-8"
      />
      <p className="font-mono text-xs sm:text-sm uppercase tracking-[0.18em] text-accent-500 mb-5">
        Privacy policy
      </p>
      <h1 className="font-display text-4xl sm:text-5xl leading-[1.1] tracking-tight text-ink-900 mb-6">
        Your information stays with you.
      </h1>
      <p className="text-lg text-ink-700 leading-relaxed mb-10">
        ADA Legal Link exists to help people, not to collect data about
        them. This policy explains what information we have, what we do
        with it, and what rights you have over it.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What we collect
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        <strong>When you talk to Ada.</strong> The content of your
        conversation — what you write to her and what she writes back —
        is stored on our servers so we can show you the conversation
        later and improve Ada over time. We do not ask for your name,
        email, or phone number to use Ada.
      </p>
      <p className="text-ink-700 leading-relaxed mb-4">
        <strong>A browser cookie.</strong> When you first visit the site
        we set one cookie on your browser (<code className="font-mono text-sm">ada_anon</code>)
        that lets us recognize you if you come back to continue a
        conversation. This cookie contains a random identifier. It
        does not contain your name or any other personal information.
        It stays in your browser for 30 days.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        <strong>Technical data.</strong> Our servers log basic technical
        information about requests — IP address, browser type, pages
        visited — for a short period so we can fix problems and keep
        the service secure. This data is separate from your conversation.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What we do NOT collect
      </h2>
      <ul className="space-y-2 text-ink-700 mb-10 list-none p-0">
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✕
          </span>
          <span>Your name, email, or phone number (unless you choose to share it with Ada, and even then only if you want an attorney to contact you)</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✕
          </span>
          <span>Your disability status or diagnosis (you can tell Ada if it's relevant to your question, but we don't require it)</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✕
          </span>
          <span>Tracking cookies from advertisers or social networks</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✕
          </span>
          <span>Analytics that follow you across other websites</span>
        </li>
      </ul>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Who we share it with
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        We share the minimum necessary information with three types of
        parties, and no one else:
      </p>
      <p className="text-ink-700 leading-relaxed mb-4">
        <strong>Anthropic.</strong> Ada is powered by Anthropic's Claude
        AI. When you send Ada a message, the content of that message is
        sent to Anthropic to generate the reply. Anthropic's data use is
        governed by their commercial terms, which prohibit using your
        data to train their models.
      </p>
      <p className="text-ink-700 leading-relaxed mb-4">
        <strong>Attorneys you choose.</strong> If you ask Ada to connect
        you with an attorney, we share only the information you
        explicitly provide for that purpose — typically your name,
        contact information, and a summary of your situation. The
        attorney you choose is responsible for their own privacy
        practices once they have your information.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        <strong>Service providers that run our infrastructure.</strong>
        {' '}We use Vercel for hosting, Neon for our database, and Clerk
        for staff authentication. These providers process data on our
        behalf and are contractually bound to keep it confidential.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        What we NEVER do
      </h2>
      <ul className="space-y-2 text-ink-700 mb-10 list-none p-0">
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✕
          </span>
          <span>Sell your information to anyone, for any reason</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✕
          </span>
          <span>Use your information to show you advertisements</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✕
          </span>
          <span>Share your conversation with anyone except the attorney you choose</span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✕
          </span>
          <span>Generate &quot;leads&quot; from your conversation and sell them</span>
        </li>
      </ul>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        How long we keep it
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        Conversations are kept for 30 days by default, then deleted.
        You can ask us to delete a conversation sooner. You can also
        download a copy of any conversation from the chat header before
        we delete it.
      </p>
      <p className="text-ink-700 leading-relaxed mb-10">
        If you've asked to be connected to an attorney, we keep a record
        of that referral so we can follow up if needed. You can ask us
        to delete that record too.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Your rights
      </h2>
      <p className="text-ink-700 leading-relaxed mb-4">
        Regardless of where you live, you have these rights with us:
      </p>
      <ul className="space-y-2 text-ink-700 mb-6 list-none p-0">
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✓
          </span>
          <span>
            <strong>Access.</strong> You can ask to see what data we
            have about you.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✓
          </span>
          <span>
            <strong>Download.</strong> You can download any conversation
            as a text file from the chat header.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✓
          </span>
          <span>
            <strong>Delete.</strong> You can ask us to delete your
            conversations and any other data we have about you.
          </span>
        </li>
        <li className="flex gap-3">
          <span aria-hidden="true" className="text-accent-500 flex-none">
            ✓
          </span>
          <span>
            <strong>Correct.</strong> If something we have is wrong, you
            can ask us to fix it.
          </span>
        </li>
      </ul>
      <p className="text-ink-700 leading-relaxed mb-10">
        To exercise any of these rights, email{' '}
        <a
          href="mailto:privacy@adalegallink.com"
          className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
        >
          privacy@adalegallink.com
        </a>
        . We will respond within 30 days. If you can't use email, tell
        us in your first message and we'll find another way.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Children
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        Ada is not designed for children under 13, and we do not
        knowingly collect information from children under 13. If you
        believe a child has sent us information, please email us and
        we will delete it.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Changes to this policy
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        If we make material changes to how we handle your information,
        we will update this page and note the date of the change below.
        For substantial changes, we will also announce them on the
        homepage for at least 30 days.
      </p>

      <h2 className="font-display text-2xl sm:text-3xl text-ink-900 mb-4">
        Contact
      </h2>
      <p className="text-ink-700 leading-relaxed mb-10">
        Questions about privacy:{' '}
        <a
          href="mailto:privacy@adalegallink.com"
          className="inline-block px-1.5 py-1 -my-1 rounded text-accent-500 hover:text-accent-600 underline underline-offset-2"
        >
          privacy@adalegallink.com
        </a>
        .
      </p>

      <div className="rounded-lg border border-surface-200 bg-surface-100 px-6 py-6 sm:px-8 sm:py-8 mb-10">
        <h3 className="font-display text-xl text-ink-900 mb-2">
          Have a question about your rights?
        </h3>
        <p className="text-ink-700 leading-relaxed mb-4">
          Privacy questions about your conversation, your data, or your
          rights under the ADA — Ada can talk through any of it.
        </p>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-medium px-5 py-3 rounded-md transition-colors"
        >
          Talk to Ada
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="text-sm text-ink-700 border-t border-surface-200 pt-6">
        <p>Last updated: April 2026.</p>
        <p className="mt-2">
          This policy applies to <strong>adalegallink.com</strong> and
          all its subdomains.
        </p>
      </div>
    </section>
  );
}
