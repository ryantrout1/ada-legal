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
        color: #1E293B;
        background: white;
        border: 2px solid transparent;
        border-radius: 10px;
        outline: none;
        min-height: 44px;
        box-sizing: border-box;
      }
      .sg-search-input::placeholder {
        color: #94A3B8;
      }
      .sg-search-input:focus {
        border-color: #C2410C;
        box-shadow: 0 0 0 4px rgba(194,65,12,0.15);
      }
      .sg-filter-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        border-radius: 100px;
        background: var(--slate-50);
        border: 1.5px solid var(--slate-200);
        font-family: Manrope, sans-serif;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--slate-800);
        cursor: pointer;
        min-height: 44px;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
      }
      .sg-filter-btn:hover,
      .sg-filter-btn:focus-visible {
        background: var(--terra-100);
        border-color: var(--terra-400);
      }
      .sg-filter-btn[aria-pressed="true"] {
        background: var(--slate-900);
        border-color: var(--slate-900);
        color: white;
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
        #sg-heading {
          font-size: 2rem !important;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .sg-search-input,
        .sg-filter-btn {
          transition: none !important;
        }
      }
    `}</style>
  );
}