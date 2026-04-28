/**
 * PublicLayout — the shell wrapping all public (non-admin) routes.
 *
 * Header behavior by viewport:
 *  - md+ (≥768px): inline nav row with all 4-5 links visible, eyeball
 *    accessibility trigger anchored on the right.
 *  - <md (phones / small tablets): logo + eyeball + hamburger button on
 *    one row; nav links live in a slide-down drawer that opens on tap.
 *
 * The eyeball lives OUTSIDE the <nav> element so it's reachable at every
 * breakpoint — this is the highest-priority control for our audience and
 * must never hide inside a collapsed menu.
 *
 * Skip-to-content link is rendered first in tab order for screen reader +
 * keyboard users.
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

import { useEffect, useId, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AccessibilityPanel } from '../components/AccessibilityPanel.js';
import { ReadingLevelProvider } from '../components/standards/ReadingLevelContext.js';

export default function PublicLayout() {
  const location = useLocation();
  const onHome = location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerId = useId();

  // Close the drawer on route change. Without this, navigating via a
  // drawer link would leave the drawer "open" in state when the next
  // page renders — visually closed because the route swapped, but
  // open in our state, which would then break the next user-toggle.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Escape closes the drawer and returns focus to the hamburger trigger.
  // Click-outside-to-close is handled by the backdrop element below.
  useEffect(() => {
    if (!menuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Body scroll-lock while drawer is open. Standard pattern; without it,
  // iOS Safari lets the page behind the drawer scroll, which feels
  // broken. Cleanup runs on close AND on unmount, so navigating away
  // mid-open never leaves the body stuck.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Move focus to the first link when the drawer opens. Mirrors the
  // AccessibilityPanel's existing focus-on-open pattern.
  useEffect(() => {
    if (menuOpen) {
      const firstLink = drawerRef.current?.querySelector<HTMLAnchorElement>('a');
      firstLink?.focus();
    }
  }, [menuOpen]);

  return (
    <ReadingLevelProvider>
    <div className="min-h-screen flex flex-col bg-surface-50 text-ink-900">
      {/* Skip link — first focusable element, hidden until focused */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-ink-900 focus:text-surface-50 focus:rounded"
      >
        Skip to main content
      </a>

      <header className="border-b border-surface-200 relative z-40 bg-surface-50">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-3 font-display text-xl sm:text-2xl text-ink-900 tracking-tight hover:text-accent-600 transition-colors"
            aria-label="ADA Legal Link home"
          >
            <img
              src="/logo.png"
              alt=""
              width="36"
              height="36"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-md flex-shrink-0"
            />
            <span>
              ADA <span className="text-accent-500">Legal</span> Link
            </span>
          </Link>

          {/* Desktop / tablet nav — visible at md and up */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-5 text-sm"
          >
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
              to="/standards-guide"
              className="text-ink-700 hover:text-accent-600 transition-colors"
            >
              Standards Guide
            </Link>
            <Link
              to="/class-actions"
              className="text-ink-700 hover:text-accent-600 transition-colors"
            >
              Class actions
            </Link>
            <Link
              to="/attorneys"
              className="text-ink-700 hover:text-accent-600 transition-colors"
            >
              Attorneys
            </Link>
          </nav>

          {/* Right-side controls — eyeball is always visible at every
              breakpoint; hamburger is mobile-only */}
          <div className="flex items-center gap-1">
            <AccessibilityPanel />
            <button
              ref={hamburgerRef}
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls={drawerId}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md text-ink-700 hover:bg-surface-100 hover:text-accent-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 transition-colors"
            >
              {menuOpen ? (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="6" y1="18" x2="18" y2="6" />
                </svg>
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer — full-width sheet below the header bar.
            Backdrop covers the rest of the viewport so click-outside
            works on touch. The drawer itself is positioned absolute
            relative to <header> so it sits flush below the bar. */}
        {menuOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 z-30 bg-ink-900/30"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={drawerRef}
              id={drawerId}
              role="dialog"
              aria-modal="true"
              aria-label="Site menu"
              className="md:hidden absolute left-0 right-0 top-full z-40 bg-surface-50 border-b border-surface-200 shadow-lg"
            >
              <nav aria-label="Primary" className="flex flex-col">
                {!onHome && (
                  <Link
                    to="/"
                    className="px-5 py-4 text-base text-ink-700 hover:bg-surface-100 hover:text-accent-600 border-b border-surface-200 transition-colors focus:outline-none focus-visible:bg-surface-100 focus-visible:text-accent-600"
                  >
                    Home
                  </Link>
                )}
                <Link
                  to="/chat"
                  className="px-5 py-4 text-base text-ink-700 hover:bg-surface-100 hover:text-accent-600 border-b border-surface-200 transition-colors focus:outline-none focus-visible:bg-surface-100 focus-visible:text-accent-600"
                >
                  Talk to Ada
                </Link>
                <Link
                  to="/standards-guide"
                  className="px-5 py-4 text-base text-ink-700 hover:bg-surface-100 hover:text-accent-600 border-b border-surface-200 transition-colors focus:outline-none focus-visible:bg-surface-100 focus-visible:text-accent-600"
                >
                  Standards Guide
                </Link>
                <Link
                  to="/class-actions"
                  className="px-5 py-4 text-base text-ink-700 hover:bg-surface-100 hover:text-accent-600 border-b border-surface-200 transition-colors focus:outline-none focus-visible:bg-surface-100 focus-visible:text-accent-600"
                >
                  Class actions
                </Link>
                <Link
                  to="/attorneys"
                  className="px-5 py-4 text-base text-ink-700 hover:bg-surface-100 hover:text-accent-600 transition-colors focus:outline-none focus-visible:bg-surface-100 focus-visible:text-accent-600"
                >
                  Attorneys
                </Link>
              </nav>
            </div>
          </>
        )}
      </header>

      {/* Main content slot */}
      <main id="main" className="flex-1">
        <Outlet />
      </main>

      {/* Footer — single row at sm+, stacked at mobile.
          At sm+: logo + tagline on the left, legal/meta links on the
          right, all on one row with flex-wrap fallback.
          Below sm: brand block stacks above link list so the legal
          disclaimer ('Not a law firm') has room to wrap to multiple
          lines without truncating — UPL liability, that statement
          cannot ellipsis. */}
      <footer className="border-t border-surface-200 mt-auto">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-4 text-xs text-ink-500">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-y-3 sm:gap-y-2 sm:gap-x-6">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <img
                src="/logo.png"
                alt=""
                width="24"
                height="24"
                className="w-6 h-6 rounded-sm flex-shrink-0 mt-0.5 sm:mt-0"
              />
              <p>
                <span className="font-display text-sm text-ink-700">
                  ADA Legal Link
                </span>
                <span className="ml-2 text-ink-500">
                  Informational only. Not legal advice. Not a law firm.
                </span>
              </p>
            </div>
            <ul className="flex flex-wrap gap-4">
              <li>
                <a
                  href="/about-ada"
                  className="hover:text-accent-600 transition-colors"
                >
                  Why she's called Ada
                </a>
              </li>
              <li>
                <a
                  href="/standards-guide"
                  className="hover:text-accent-600 transition-colors"
                >
                  Standards Guide
                </a>
              </li>
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
        </div>
      </footer>
    </div>
    </ReadingLevelProvider>
  );
}
