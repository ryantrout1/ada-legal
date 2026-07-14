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

      <header className="bg-brand-navy text-white relative z-40 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
        <div
          className="w-full flex items-center justify-between"
          style={{ height: 72, padding: '0 clamp(16px, 4vw, 40px)' }}
        >
          <Link
            to="/"
            className="flex items-center gap-3 font-display font-bold text-white no-underline"
            style={{ fontSize: '1.5rem' }}
            aria-label="ADA Legal Link home"
          >
            <img
              src="/logo-transparent.png"
              alt=""
              width="44"
              height="44"
              className="w-11 h-11 object-contain flex-shrink-0"
            />
            <span className="whitespace-nowrap">
              ADA Legal <span style={{ color: '#FDBA74' }}>Link</span>
            </span>
          </Link>

          {/* Right cluster — nav, display settings, mobile menu (logo left,
              everything else right, matching adalegallink.com) */}
          <div className="flex items-center gap-1 sm:gap-2">
            <nav
              aria-label="Primary"
              className="hidden md:flex items-center gap-1 font-chrome"
            >
              <Link
                to="/standards-guide"
                className="text-white hover:text-brand-gold transition-colors inline-flex items-center"
                style={{ fontSize: '0.9375rem', fontWeight: 500, minHeight: 44, padding: '6px 12px' }}
              >
                ADA Standards Guide
              </Link>
              <Link
                to="/attorneys"
                className="text-white hover:text-brand-gold transition-colors inline-flex items-center"
                style={{ fontSize: '0.9375rem', fontWeight: 500, minHeight: 44, padding: '6px 12px' }}
              >
                Find an Attorney
              </Link>
              <Link
                to="/class-actions"
                className="text-white hover:text-brand-gold transition-colors inline-flex items-center"
                style={{ fontSize: '0.9375rem', fontWeight: 500, minHeight: 44, padding: '6px 12px' }}
              >
                Lawsuits
              </Link>
            </nav>

            <AccessibilityPanel onDark />
            <button
              ref={hamburgerRef}
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls={drawerId}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md text-white hover:bg-brand-navy-hover hover:text-brand-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy transition-colors"
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
              className="md:hidden absolute left-0 right-0 top-full z-40 bg-brand-navy border-b border-brand-navy-hover shadow-lg"
            >
              <nav aria-label="Primary" className="flex flex-col font-chrome">
                <Link
                  to="/standards-guide"
                  className="px-5 py-4 text-base text-white hover:bg-brand-navy-hover hover:text-brand-gold border-b border-brand-navy-hover transition-colors focus:outline-none focus-visible:bg-brand-navy-hover focus-visible:text-brand-gold"
                >
                  ADA Standards Guide
                </Link>
                <Link
                  to="/attorneys"
                  className="px-5 py-4 text-base text-white hover:bg-brand-navy-hover hover:text-brand-gold border-b border-brand-navy-hover transition-colors focus:outline-none focus-visible:bg-brand-navy-hover focus-visible:text-brand-gold"
                >
                  Find an Attorney
                </Link>
                <Link
                  to="/class-actions"
                  className="px-5 py-4 text-base text-white hover:bg-brand-navy-hover hover:text-brand-gold transition-colors focus:outline-none focus-visible:bg-brand-navy-hover focus-visible:text-brand-gold"
                >
                  Lawsuits
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
      <footer className="mt-auto bg-brand-navy" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Primary brand row — matches adalegallink.com (brand · © · tagline) */}
        <div
          className="w-full flex flex-wrap items-center justify-between gap-2 font-chrome"
          style={{ maxWidth: 1400, margin: '0 auto', padding: '0 1.5rem', minHeight: 48 }}
        >
          <div className="flex items-center gap-2.5" aria-hidden="true">
            <img
              src="/logo-transparent.png"
              alt=""
              width="28"
              height="28"
              className="w-7 h-7 object-contain flex-shrink-0"
            />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#E2E8F0', letterSpacing: '0.01em' }}>
              ADA Legal Link
            </span>
          </div>
          <p className="m-0 whitespace-nowrap" style={{ fontSize: '0.75rem', color: '#B0BEC5' }}>
            © 2026 ADA Legal Link. All rights reserved.
          </p>
          <p className="m-0" style={{ fontSize: '0.75rem', color: '#B0BEC5' }}>
            Connecting people with experienced ADA attorneys.
          </p>
        </div>

        {/* Secondary — UPL disclaimer + site links (kept from the Vercel footer) */}
        <div className="w-full font-chrome" style={{ maxWidth: 1400, margin: '0 auto', padding: '10px 1.5rem 16px' }}>
          <div
            className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-y-2 sm:gap-x-6"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}
          >
            <p className="m-0" style={{ fontSize: '0.72rem', color: '#B0BEC5' }}>
              Informational only. Not legal advice. Not a law firm.
            </p>
            <ul className="flex flex-wrap gap-4" style={{ fontSize: '0.72rem' }}>
              <li><a href="/about-ada" className="text-[#B0BEC5] hover:text-brand-gold transition-colors">Why she's called Ada</a></li>
              <li><a href="/standards-guide" className="text-[#B0BEC5] hover:text-brand-gold transition-colors">Standards Guide</a></li>
              <li><a href="/glossary" className="text-[#B0BEC5] hover:text-brand-gold transition-colors">Glossary</a></li>
              <li><a href="/privacy" className="text-[#B0BEC5] hover:text-brand-gold transition-colors">Privacy</a></li>
              <li><a href="/terms" className="text-[#B0BEC5] hover:text-brand-gold transition-colors">Terms</a></li>
              <li><a href="/accessibility" className="text-[#B0BEC5] hover:text-brand-gold transition-colors">Accessibility</a></li>
              <li><a href="/for-attorneys" className="text-[#B0BEC5] hover:text-brand-gold transition-colors">For attorneys</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
    </ReadingLevelProvider>
  );
}
