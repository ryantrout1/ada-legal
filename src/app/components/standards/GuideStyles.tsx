/**
 * GuideStyles — injects scoped CSS for the Standards Guide chapter
 * pages. Covers layout wrappers, two-column section layout, focus-
 * visible styles for interactive SVG elements, and reduced-motion /
 * high-contrast user-preference fallbacks.
 *
 * Ported verbatim from base44-archive src/components/guide/GuideStyles.jsx.
 * No logic changes. All token references (var(--page-bg-alt),
 * var(--accent-light), var(--border)) resolve through the alias
 * layer in app.css.
 *
 * The reading-level adaptation rules at the end (hiding legal
 * asides in simple mode, prioritizing them in professional mode)
 * read html[data-reading-level="..."]. ChapterPageLayout is
 * responsible for setting that attribute on the <html> element
 * when the reading-level toggle changes.
 */

export default function GuideStyles() {
  return (
    <style>{`
      .guide-content-wrap {
        background: var(--page-bg-alt);
        padding: 60px 40px;
      }
      .guide-content {
        max-width: 800px;
        margin: 0 auto;
      }
      .guide-two-col {
        display: flex;
        gap: 32px;
        align-items: flex-start;
        margin-bottom: 48px;
      }
      .guide-two-col > div:first-child { flex: 1 1 55%; min-width: 0; }
      .guide-two-col > aside { flex: 1 1 40%; min-width: 0; }

      @media (max-width: 768px) {
        .guide-content-wrap {
          padding: 40px 20px !important;
        }
        .guide-two-col {
          flex-direction: column !important;
          gap: 20px !important;
        }
        .guide-two-col > div:first-child,
        .guide-two-col > aside {
          flex: 1 1 100% !important;
        }
      }
      @media (max-width: 480px) {
        .guide-content-wrap {
          padding: 28px 16px !important;
        }
      }

      /* Diagram interactive element focus styles */
      .ada-diagram-wrap g[role="button"]:focus-visible {
        outline: 2px solid var(--accent-light);
        outline-offset: 3px;
        border-radius: 50%;
      }
      .ada-diagram-wrap g[role="button"]:focus {
        outline: 2px solid var(--accent-light);
        outline-offset: 3px;
      }
      /* Unit toggle button focus */
      .ada-diagram-wrap button:focus-visible {
        outline: 2px solid var(--accent-light);
        outline-offset: 2px;
      }
      /* Guide link focus */
      .guide-content a:focus-visible {
        outline: 3px solid var(--accent-light);
        outline-offset: 2px;
        border-radius: 4px;
      }
      /* Accordion header focus */
      .guide-content button:focus-visible {
        outline: 3px solid var(--accent-light);
        outline-offset: 2px;
        border-radius: 10px;
      }
      /* Share button focus */
      .share-btn:focus-visible {
        outline: 3px solid var(--accent-light) !important;
        outline-offset: 2px !important;
      }
      /* Details/summary focus */
      .guide-content details summary:focus-visible {
        outline: 3px solid var(--accent-light);
        outline-offset: 2px;
        border-radius: 4px;
      }
      @media (prefers-reduced-motion: reduce) {
        .guide-two-col,
        .guide-content button,
        .ada-diagram-wrap button,
        .share-btn {
          transition: none !important;
        }
      }
      @media (prefers-contrast: more) {
        .guide-content div[role="note"] {
          border-width: 2px !important;
        }
      }

      /* Reading-level adaptation for diagram callout panels.
         In Simple mode: hide the legal aside to reduce cognitive load.
         In Professional mode: make the legal aside primary (wider). */
      html[data-reading-level="simple"] .ada-diagram-wrap aside {
        display: none !important;
      }
      html[data-reading-level="simple"] .ada-diagram-wrap .guide-two-col > div:first-child {
        flex: 1 1 100% !important;
      }
      html[data-reading-level="professional"] .ada-diagram-wrap .guide-two-col > aside {
        flex: 1 1 60% !important;
        order: -1;
      }
      html[data-reading-level="professional"] .ada-diagram-wrap .guide-two-col > div:first-child {
        flex: 1 1 35% !important;
      }
    `}</style>
  );
}
