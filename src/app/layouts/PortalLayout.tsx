/**
 * PortalLayout — shell for all /portal/* (authed) routes.
 *
 * Top bar with the signed-in attorney's email + sign-out, a skip link, and a
 * link back to the queue. Mirrors AdminLayout's structure and design tokens,
 * with a single-surface (no sidebar) layout since the portal is a small
 * queue → case-detail flow in v1.
 *
 * Mirrors the ClerkProvider-scoping discipline (see App.tsx PortalShell): this
 * layout only renders inside the Clerk-wrapped /portal subtree.
 */

import { useUser, useClerk } from '@clerk/clerk-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

export default function PortalLayout() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const location = useLocation();

  const email = user?.primaryEmailAddress?.emailAddress ?? 'attorney';

  return (
    <div className="min-h-screen bg-surface-50 text-ink-900 flex flex-col">
      <a
        href="#portal-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-ink-900 focus:text-surface-50 focus:rounded"
      >
        Skip to main content
      </a>

      <header className="border-b border-surface-200 bg-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
          <Link
            to="/portal"
            className="font-display text-lg text-ink-900 hover:text-accent-600 transition-colors"
            aria-label="ADA Legal Link attorney portal home"
          >
            ADA <span className="text-accent-500">Legal</span> Link
            <span className="text-ink-500 font-mono text-xs ml-2 tracking-widest uppercase">
              Portal
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-ink-500 hidden sm:inline font-mono text-xs">{email}</span>
            <button
              type="button"
              onClick={() => signOut({ redirectUrl: '/' })}
              className="text-ink-700 hover:text-accent-600 underline underline-offset-2"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main
        id="portal-main"
        className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 py-6 min-w-0"
        key={location.pathname}
      >
        <Outlet />
      </main>
    </div>
  );
}
