/**
 * ShareBar — a horizontal row of share buttons: copy link, Facebook,
 * Twitter/X, LinkedIn, email.
 *
 * Ported from base44-archive src/components/guide/ShareBar.jsx.
 * Simplification: the Base44 original coupled button styles to the
 * site's active display mode via getDisplayMode(). The ShareBar only
 * renders inside GuideHeroBanner, which is always dark. So we drop
 * the mode-switching and hardcode against the --dark-* token family
 * from the alias layer. Saves ~60 lines of switch-case styling.
 *
 * Behavior preserved:
 *   - Copy-link with "Copied!" feedback for 2 seconds
 *   - Social share opens in a 600x500 popup
 *   - Email uses mailto: with subject + body
 *   - All buttons meet 44×44 touch-target minimum
 *   - Full keyboard + screen-reader support
 */

import type { ComponentType } from 'react';
import { useState } from 'react';
import { Link2, Mail, Check } from 'lucide-react';

/**
 * Brand logos for social shares. lucide-react removed Facebook,
 * Twitter, and LinkedIn icons for trademark reasons in recent
 * versions, so we inline them here. The paths are the brand-standard
 * glyph shapes as used by their official icon sets. Sized via the
 * `size` prop like lucide icons.
 */
function FacebookIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TwitterIcon({ size }: { size: number }) {
  // X / Twitter logo — the post-rebrand glyph
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedinIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface ShareButton {
  label: string;
  icon: ComponentType<{ size: number }>;
  onClick: () => void;
  highlight?: boolean;
}

export default function ShareBar() {
  const [copied, setCopied] = useState(false);

  // window / document access is fine at render time in React Router
  // v6 — we're client-side only (no SSR). Keeping these inline instead
  // of in state makes the share URLs always reflect the current page.
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const title =
    typeof document !== 'undefined'
      ? document.title.replace(/ — ADA Legal Link$/, '')
      : '';

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can reject in some contexts (iframe without
      // permission, older browsers). Fail silently — the user will
      // just not see a "Copied!" state.
    }
  }

  function openPopup(shareUrl: string): void {
    window.open(shareUrl, '_blank', 'width=600,height=500,noopener,noreferrer');
  }

  const buttons: ShareButton[] = [
    {
      label: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? Check : Link2,
      onClick: handleCopy,
      highlight: copied,
    },
    {
      label: 'Facebook',
      icon: FacebookIcon,
      onClick: () =>
        openPopup(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        ),
    },
    {
      label: 'X / Twitter',
      icon: TwitterIcon,
      onClick: () =>
        openPopup(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
        ),
    },
    {
      label: 'LinkedIn',
      icon: LinkedinIcon,
      onClick: () =>
        openPopup(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        ),
    },
    {
      label: 'Email',
      icon: Mail,
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(
          title,
        )}&body=${encodeURIComponent(`I thought this might be useful:\n\n${url}`)}`;
      },
    },
  ];

  return (
    <div
      role="group"
      aria-label="Share this page"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body), Manrope, sans-serif',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--dark-muted)',
          marginRight: '4px',
        }}
      >
        Share
      </span>
      {buttons.map(({ label, icon: Icon, onClick, highlight }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          aria-label={label}
          className="share-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            minHeight: '44px',
            minWidth: '44px',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            background: highlight
              ? 'var(--accent)'
              : 'rgba(255, 255, 255, 0.08)',
            color: highlight ? 'var(--btn-text)' : 'var(--dark-heading)',
            fontFamily: 'var(--font-body), Manrope, sans-serif',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          <Icon size={14} aria-hidden="true" />
          <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
        </button>
      ))}
    </div>
  );
}
