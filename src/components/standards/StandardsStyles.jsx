import React from 'react';

export default function StandardsStyles() {
  return (
    <style>{`
      .sg-hero-grid {
        max-width: 1200px;
        margin: 0 auto;
        padding: 140px 40px 80px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 60px;
        align-items: start;
        position: relative;
        width: 100%;
      }
      .sg-search-input {
        width: 100%;
        padding: 14px 16px 14px 48px;
        font-family: Manrope, sans-serif;
        font-size: 1rem;
        color: var(--heading);
        background: var(--card-bg);
        border: 2px solid transparent;
        border-radius: 10px;
        outline: none;
        min-height: 44px;
        box-sizing: border-box;
      }
      .sg-search-input::placeholder {
        color: var(--body-secondary);
      }
      .sg-search-input:focus {
        border-color: var(--accent);
        box-shadow: 0 0 0 4px rgba(194,65,12,0.15);
      }
      .sg-filter-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        border-radius: 100px;
        background: var(--page-bg-subtle);
        border: 1.5px solid var(--border);
        font-family: Manrope, sans-serif;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--heading);
        cursor: pointer;
        min-height: 44px;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
      }
      .sg-filter-btn:hover,
      .sg-filter-btn:focus-visible {
        background: var(--card-bg-tinted);
        border-color: var(--accent);
      }
      .sg-filter-btn:focus-visible {
        outline: 3px solid var(--accent-light);
        outline-offset: 2px;
      }
      .sg-filter-btn[aria-pressed="true"] {
        background: var(--heading);
        border-color: var(--heading);
        color: var(--page-bg);
      }
      @media (max-width: 900px) {
        .sg-hero-grid {
          grid-template-columns: 1fr !important;
          padding: 100px 24px 48px !important;
          gap: 32px !important;
        }
      }
      @media (max-width: 600px) {
        .sg-hero-grid {
          padding: 88px 16px 40px !important;
        }
      }
      .sg-body-grid {
        max-width: 1200px;
        margin: 0 auto;
        padding: 48px 40px 80px;
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: 48px;
        align-items: start;
      }
      .sg-sidebar {
        position: sticky;
        top: 96px;
      }
      .sg-sidebar-link:hover {
        background: var(--border-lighter) !important;
        color: var(--heading) !important;
        border-left-color: var(--border) !important;
      }
      .sg-sidebar-link:focus-visible {
        outline: 3px solid var(--accent-light) !important;
        outline-offset: -2px !important;
        border-radius: 0 6px 6px 0 !important;
      }
      .sg-sidebar-active:hover {
        background: var(--card-bg-tinted) !important;
        color: var(--accent) !important;
        border-left-color: var(--accent) !important;
      }
      .sg-card-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }
      .sg-resource-card {
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .sg-resource-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.08);
      }
      .sg-card-link::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: 1;
      }
      .sg-card-link:focus-visible {
        outline: 3px solid var(--accent-light);
        outline-offset: 2px;
        border-radius: 4px;
      }
      .sg-share-btn:focus-visible {
        outline: 3px solid var(--accent-light) !important;
        outline-offset: 2px !important;
      }
      @media (max-width: 960px) {
        .sg-body-grid {
          grid-template-columns: 1fr !important;
          padding: 32px 24px 60px !important;
          gap: 32px !important;
        }
        .sg-sidebar {
          position: static !important;
        }
      }
      @media (max-width: 600px) {
        .sg-body-grid {
          padding: 24px 16px 48px !important;
        }
        .sg-card-grid {
          grid-template-columns: 1fr !important;
        }
        .sg-filter-row {
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 8px !important;
          scrollbar-width: thin;
        }
        .sg-filter-btn {
          flex-shrink: 0 !important;
        }
      }
      @media (max-width: 360px) {
        .sg-card-grid {
          grid-template-columns: 1fr !important;
        }
      }
      .sg-chapter-link {
        transition: background 0.15s, border-color 0.15s;
      }
      .sg-chapter-link:hover,
      .sg-chapter-link:focus-visible {
        background: var(--card-bg-tinted) !important;
        border-color: var(--accent) !important;
      }
      .sg-chapter-link:focus-visible {
        outline: 3px solid var(--accent-light) !important;
        outline-offset: 2px !important;
      }
      .sg-carousel-btn:focus-visible {
        outline: 3px solid var(--accent-light) !important;
        outline-offset: 2px !important;
      }
      .sg-carousel-dot:focus-visible {
        outline: 3px solid var(--accent-light) !important;
        outline-offset: 2px !important;
      }
      .sg-cta-link:focus-visible {
        outline: 3px solid var(--accent-light);
        outline-offset: 2px;
      }
      @media (prefers-reduced-motion: reduce) {
        .sg-search-input,
        .sg-filter-btn,
        .sg-resource-card,
        .sg-chapter-link,
        .sg-carousel-btn {
          transition: none !important;
        }
        .sg-resource-card:hover {
          transform: none !important;
        }
      }
      @media (prefers-contrast: more) {
        .sg-resource-card,
        .sg-chapter-link {
          border-width: 2px !important;
        }
      }
    `}</style>
  );
}
