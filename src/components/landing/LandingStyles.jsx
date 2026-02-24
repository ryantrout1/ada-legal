import React from 'react';

export default function LandingStyles() {
  return (
    <style>{`
      /* Landing page animations */
      @keyframes landingFadeUp {
        from { opacity: 0; transform: translateY(24px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .landing-fade-up {
        animation: landingFadeUp 0.6s ease-out both;
      }
      .landing-delay-1 { animation-delay: 100ms; }
      .landing-delay-2 { animation-delay: 200ms; }
      .landing-delay-3 { animation-delay: 300ms; }
      .landing-delay-4 { animation-delay: 400ms; }

      /* Hover effects */
      .landing-story-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.08);
      }
      .landing-stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(0,0,0,0.08);
      }
      .landing-commitment-card:hover {
        background: rgba(255,255,255,0.06) !important;
      }

      /* Button hovers */
      .landing-btn-primary:hover {
        background: #9A3412 !important;
      }
      .landing-btn-secondary:hover {
        border-color: #CBD5E1 !important;
        color: white !important;
      }
      .landing-btn-attorney:hover {
        background: #C2410C !important;
        color: white !important;
      }
      .landing-footer-link:hover {
        color: #EA580C !important;
      }

      /* Responsive */
      @media (max-width: 900px) {
        .landing-hero-grid {
          grid-template-columns: 1fr !important;
          padding-top: 2rem !important;
          padding-bottom: 2rem !important;
        }
        .landing-stories-grid {
          grid-template-columns: 1fr !important;
        }
        .landing-steps-grid {
          grid-template-columns: repeat(2, 1fr) !important;
        }
        .landing-steps-line {
          display: none !important;
        }
        .landing-commitment-grid {
          grid-template-columns: 1fr !important;
        }
        .landing-attorneys-grid {
          grid-template-columns: 1fr !important;
          gap: 32px !important;
        }
        .landing-stat-grid {
          grid-template-columns: repeat(2, 1fr) !important;
        }
        section[aria-labelledby] {
          padding-top: 72px !important;
          padding-bottom: 72px !important;
          padding-left: 24px !important;
          padding-right: 24px !important;
        }
      }

      @media (max-width: 600px) {
        .landing-hero-buttons {
          flex-direction: column !important;
        }
        .landing-hero-buttons a {
          width: 100% !important;
          justify-content: center !important;
        }
        .landing-steps-grid {
          grid-template-columns: 1fr !important;
        }
        .landing-stat-grid {
          grid-template-columns: 1fr !important;
        }
        .landing-footer-links {
          flex-direction: column !important;
          gap: 0.5rem !important;
        }
        .landing-watermark {
          display: none !important;
        }
        section[aria-labelledby="hero-heading"] {
          min-height: auto !important;
          padding-top: 88px !important;
          padding-bottom: 48px !important;
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .landing-fade-up {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
        .landing-story-card,
        .landing-stat-card,
        .landing-commitment-card,
        .landing-btn-primary,
        .landing-btn-secondary,
        .landing-btn-attorney {
          transition: none !important;
        }
        .landing-story-card:hover,
        .landing-stat-card:hover {
          transform: none !important;
        }
      }

      /* High contrast */
      @media (prefers-contrast: more) {
        .landing-story-card,
        .landing-stat-card {
          border-width: 2px !important;
        }
        .landing-commitment-card {
          border-width: 2px !important;
        }
      }

      @keyframes landingBounce {
        0%, 100% { transform: translateX(-50%) translateY(0); }
        50% { transform: translateX(-50%) translateY(8px); }
      }
      .landing-scroll-hint {
        animation: landingBounce 2s ease-in-out infinite;
      }
    `}</style>
  );
}