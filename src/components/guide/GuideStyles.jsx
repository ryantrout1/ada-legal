import React from 'react';

export default function GuideStyles() {
  return (
    <style>{`
      .guide-content-wrap {
        background: #FAF7F2;
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
    `}</style>
  );
}