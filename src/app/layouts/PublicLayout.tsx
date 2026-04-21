/**
 * PublicLayout — the shell wrapping all public (non-admin) routes.
 *
 * Deliberately restrained: a single-line nav at the top, generous main
 * area, a compact footer with the legal links the audience is likely to
 * verify before trusting us (privacy, how-we-work). Skip-to-content link
 * is rendered first in tab order for screen reader + keyboard users.
 *
 * The design language:
 *  - Warm off-white surface (var(--color-surface-50))
 *  - Serif display typography (Fraunces) for headings
 *  - IBM Plex Sans body — known to aid readability for dyslexic users
 *  - One accent color, used sparingly for CTAs and focus
 *  - No ornamental motion; we respect prefers-reduced-motion globally
 *
 * Ref: docs/ARCHITECTURE.md §11
 */

import { Link, Outlet, useLocation } from 'react-router-dom';
import { AccessibilityPanel } from '../components/AccessibilityPanel.js';

export default function PublicLayout() {
  const location = useLocation();
  const onHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-surface-50 text-ink-900">
      {/* Skip link — first focusable element, hidden until focused */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-ink-900 focus:text-surface-50 focus:rounded"
      >
        Skip to main content
      </a>

      {/* Top nav — intentionally minimal, no hamburger on desktop */}
      <header className="border-b border-surface-200">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 flex items-baseline justify-between gap-6">
          <Link
            to="/"
            className="font-display text-xl sm:text-2xl text-ink-900 tracking-tight hover:text-accent-600 transition-colors"
            aria-label="ADA Legal Link home"
          >
            ADA <span className="text-accent-500">Legal</span> Link
          </Link>

          <nav aria-label="Primary" className="flex items-center gap-5 text-sm">
            {!onHome && (
              <Link
                to="/"
                className="text-ink-700 hover:text-accent-600 transition-colors"
              >
                Home
              </Link>
            )}
            <Link
              to="/chat"
              className="text-ink-700 hover:text-accent-600 transition-colors"
            >
              Talk to Ada
            </Link>
            <Link
              to="/attorneys"
              className="text-ink-700 hover:text-accent-600 transition-colors"
            >
              Attorneys
            </Link>
            <AccessibilityPanel />
          </nav>
        </div>
      </header>

      {/* Main content slot */}
      <main id="main" className="flex-1">
        <Outlet />
      </main>

      {/* Footer — compact, functional, auditable */}
      <footer className="border-t border-surface-200 mt-20">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 text-sm text-ink-500">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div>
              <p className="font-display text-base text-ink-700">
                ADA Legal Link
              </p>
              <p className="mt-1">
                Free, plain-language ADA help. Not a law firm.
              </p>
            </div>
            <ul className="flex flex-wrap gap-5">
              <li>
                <a
                  href="/privacy"
                  className="hover:text-accent-600 transition-colors"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="hover:text-accent-600 transition-colors"
                >
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="/accessibility"
                  className="hover:text-accent-600 transition-colors"
                >
                  Accessibility
                </a>
              </li>
            </ul>
          </div>
          <p className="mt-6 text-xs">
            Informational only. Not legal advice. If you need an attorney, ask
            Ada and we'll help you find one.
          </p>
        </div>
      </footer>
    </div>
  );
}
