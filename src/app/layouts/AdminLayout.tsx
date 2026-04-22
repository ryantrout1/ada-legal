/**
 * AdminLayout — shell for all /admin/* routes.
 *
 * Sidebar nav on the left, content on the right. Header shows the
 * signed-in admin's email and a sign-out button. Matches the public
 * site's typographic language but with a slightly denser, more
 * functional feel (admin is a tool, not a marketing surface).
 *
 * Ref: docs/ARCHITECTURE.md §11
 */

import { useUser, useClerk } from '@clerk/clerk-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/admin/sessions', label: 'Sessions' },
  { to: '/admin/firms', label: 'Firms' },
  { to: '/admin/attorneys', label: 'Attorneys' },
  { to: '/admin/settings', label: 'Settings' },
  { to: '/admin/analytics', label: 'Analytics' },
];

export default function AdminLayout() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const location = useLocation();

  const email = user?.primaryEmailAddress?.emailAddress ?? 'admin';

  return (
    <div className="min-h-screen bg-surface-50 text-ink-900 flex flex-col">
      {/* Skip link */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-ink-900 focus:text-surface-50 focus:rounded"
      >
        Skip to main content
      </a>

      {/* Top bar */}
      <header className="border-b border-surface-200 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
          <Link
            to="/admin/sessions"
            className="font-display text-lg text-ink-900 hover:text-accent-600 transition-colors"
            aria-label="ADA Legal Link admin home"
          >
            ADA <span className="text-accent-500">Legal</span> Link
            <span className="text-ink-500 font-mono text-xs ml-2 tracking-widest uppercase">
              Admin
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

      {/* Body: sidebar + main */}
      <div className="flex-1 max-w-6xl w-full mx-auto flex flex-col md:flex-row gap-6 px-5 sm:px-8 py-6">
        <aside className="md:w-48 md:flex-none">
          <nav aria-label="Admin sections" className="flex md:flex-col gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  'block px-3 py-2 rounded-md text-sm whitespace-nowrap transition-colors ' +
                  (isActive
                    ? 'bg-accent-500 text-white font-medium'
                    : 'text-ink-700 hover:bg-surface-100 hover:text-accent-600')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main id="admin-main" className="flex-1 min-w-0" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
