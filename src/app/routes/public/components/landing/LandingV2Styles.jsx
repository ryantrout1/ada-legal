import React from 'react';

/**
 * LandingV2Styles — animations, responsive rules, and a11y utilities for the
 * HomeV2 landing concept. Self-contained so the entire v2 concept lives in one
 * folder (src/components/landing-v2/) and can be promoted or removed cleanly.
 * Relies on the global design tokens applied by DisplaySettings (var(--*)).
 */
export default function LandingV2Styles() {
  return (
    <style>{`
      /* Ada's distinct purple treatment, scoped to the v2 landing */
      .home-v2-root {
        --v2-ada: #7C5CFC;
        --v2-ada-light: #A78BFA;
        --v2-ada-text: #B9A6FC; /* AAA text-on-dark Ada violet: 8.4:1 on #141820 */
        --v2-ada-bg: rgba(124,92,252,0.08);
        --v2-ada-border: rgba(124,92,252,0.25);
      }
      .v2-btn-ada:hover, .v2-btn-ada:focus-visible { background: #6948e0 !important; }
      .v2-btn-ada:focus-visible {
        outline: 3px solid var(--v2-ada-light) !important; outline-offset: 2px !important;
      }

      @keyframes v2FadeUp {
        from { opacity: 0; transform: translateY(24px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .v2-fade-up { animation: v2FadeUp 0.6s ease-out both; }
      .v2-delay-1 { animation-delay: 100ms; }
      .v2-delay-2 { animation-delay: 200ms; }
      .v2-delay-3 { animation-delay: 300ms; }
      .v2-delay-4 { animation-delay: 400ms; }

      .v2-card { transition: transform 0.2s, box-shadow 0.2s; }
      .v2-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.09); }

      .v2-tritem { transition: background 0.15s; }
      .v2-tritem:hover { background: rgba(255,255,255,0.06) !important; }

      .v2-btn { transition: all 0.15s; }
      .v2-btn-primary:hover, .v2-btn-primary:focus-visible { background: var(--link) !important; }
      .v2-btn-secondary:hover, .v2-btn-secondary:focus-visible {
        border-color: var(--dark-body-secondary) !important; color: var(--btn-text) !important;
      }
      .v2-btn-ghost:hover, .v2-btn-ghost:focus-visible {
        border-color: var(--accent) !important; color: var(--accent) !important;
      }
      .v2-btn-primary:focus-visible, .v2-btn-secondary:focus-visible, .v2-btn-ghost:focus-visible {
        outline: 3px solid var(--accent-light) !important; outline-offset: 2px !important;
      }
      .v2-link:hover { gap: 10px !important; }
      .v2-link:focus-visible {
        outline: 3px solid var(--accent-light) !important; outline-offset: 2px !important; border-radius: 4px;
      }

      .v2-sr-only {
        position: absolute !important; width: 1px !important; height: 1px !important;
        padding: 0 !important; margin: -1px !important; overflow: hidden !important;
        clip: rect(0,0,0,0) !important; white-space: nowrap !important; border: 0 !important;
      }

      @media (max-width: 900px) {
        .v2-spine-grid { grid-template-columns: 1fr !important; }
        .v2-titles-grid { grid-template-columns: 1fr !important; }
        .v2-trust-grid { grid-template-columns: 1fr !important; }
        .v2-scope-grid { grid-template-columns: 1fr !important; }
        .v2-story-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        .v2-hero { padding: 56px 0 48px !important; }
        .v2-hero-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        .v2-hero h1 { font-size: 2.4rem !important; }
        section.v2-section { padding-top: 72px !important; padding-bottom: 72px !important; }
      }
      @media (max-width: 600px) {
        .v2-cta-row { flex-direction: column !important; align-items: stretch !important; }
        .v2-cta-row a { width: 100% !important; justify-content: center !important; text-align: center !important; box-sizing: border-box; }
        .v2-ada-entry { gap: 8px !important; }
      }

      @media (prefers-reduced-motion: reduce) {
        .v2-fade-up { animation: none !important; opacity: 1 !important; transform: none !important; }
        .v2-card, .v2-tritem, .v2-btn { transition: none !important; }
        .v2-card:hover { transform: none !important; }
      }
      @media (prefers-contrast: more) {
        .v2-card, .v2-tcard, .v2-tritem { border-width: 2px !important; }
      }
    `}</style>
  );
}
