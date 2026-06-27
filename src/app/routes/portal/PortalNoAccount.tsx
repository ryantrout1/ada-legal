/**
 * PortalNoAccount — the holding screen for a signed-in Clerk user who has no
 * linked attorney account (the bind found no/ambiguous/unverified match, or the
 * bootstrap errored). Standalone (no shell chrome, since no data is reachable),
 * portal-scoped for tokens, AAA. Offers a retry + sign-out so they can fix the
 * email or switch accounts.
 *
 * Copy is a sensible default pending Gina's review (/plan Phase 4b, Open
 * Decision 1: support contact + wording).
 *
 * Ref: /plan Phase 4b.
 */

import { useClerk } from '@clerk/clerk-react';
import { ShieldQuestion, RefreshCw, LogOut } from 'lucide-react';

const SUPPORT_EMAIL = 'support@adalegallink.com';

function body(reason: string, email: string | null): { title: string; lead: string; hint: string } {
  const who = email ? email : 'your email address';
  switch (reason) {
    case 'unverified':
      return {
        title: 'Verify your email to continue',
        lead: `We need a verified email to match you to your attorney account. Verify ${who}, then try again.`,
        hint: 'Check your inbox for a verification link from Clerk, then choose Try again.',
      };
    case 'ambiguous':
      return {
        title: 'We need a hand linking your account',
        lead: `More than one attorney account is associated with ${who}, so we can’t link you automatically.`,
        hint: `Contact ${SUPPORT_EMAIL} and we’ll sort it out.`,
      };
    case 'no_match':
      return {
        title: 'No attorney account yet',
        lead: `We couldn’t find an attorney account linked to ${who}.`,
        hint: `Ask your firm’s owner to invite you with this exact email, or contact ${SUPPORT_EMAIL}.`,
      };
    default:
      return {
        title: 'We couldn’t load your account',
        lead: 'Something went wrong setting up your workspace.',
        hint: 'Try again in a moment, or sign out and back in.',
      };
  }
}

export default function PortalNoAccount({
  reason,
  email,
  onRetry,
}: {
  reason: string;
  email: string | null;
  onRetry: () => void;
}) {
  const { signOut } = useClerk();
  const { title, lead, hint } = body(reason, email);

  return (
    <div className="lawyer-workspace min-h-screen bg-surface-50 grid place-items-center px-4 py-12">
      <main className="w-full max-w-md rounded-xl border border-surface-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 grid place-items-center h-14 w-14 rounded-full bg-accent-50 text-accent-500">
          <ShieldQuestion size={26} aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl text-ink-900 mb-2">{title}</h1>
        <p className="text-sm text-ink-700 mb-1">{lead}</p>
        <p className="text-sm text-ink-500 mb-6">{hint}</p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-lg text-sm font-semibold border border-accent-500 bg-accent-500 text-white hover:bg-accent-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <RefreshCw size={16} aria-hidden="true" /> Try again
          </button>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/' })}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-lg text-sm font-semibold border border-control-border bg-white text-ink-900 hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <LogOut size={16} aria-hidden="true" /> Sign out
          </button>
        </div>

        <p className="mt-6 text-xs text-ink-500">
          Need help?{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="underline text-accent-500">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </main>
    </div>
  );
}
