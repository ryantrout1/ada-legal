/**
 * ShareBar — a horizontal row of share buttons: copy link and email.
 *
 * Ported from base44-archive src/components/guide/ShareBar.jsx.
 * Simplification: the Base44 original coupled button styles to the
 * site's active display mode via getDisplayMode(). The ShareBar only
 * renders inside GuideHeroBanner, which is always dark. So we drop
 * the mode-switching and hardcode against the --dark-* token family
 * from the alias layer.
 *
 * The Facebook / X / LinkedIn buttons were removed 2026-07-30 — those
 * accounts are not set up yet, so the buttons pointed at pages that
 * do not exist. Restore from git history when the accounts are live.
 *
 * Behavior preserved:
 *   - Copy-link with "Copied!" feedback for 2 seconds
 *   - Email uses mailto: with subject + body
 *   - All buttons meet 44×44 touch-target minimum
 *   - Full keyboard + screen-reader support
 */

import type { ComponentType } from 'react';
import { useState } from 'react';
import { Link2, Mail, Check } from 'lucide-react';

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

  const buttons: ShareButton[] = [
    {
      label: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? Check : Link2,
      onClick: handleCopy,
      highlight: copied,
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
          fontFamily: 'var(--font-body)',
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
            fontFamily: 'var(--font-body)',
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
