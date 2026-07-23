/**
 * LitigationChips — AAA chips/badges for the lawsuit card and detail.
 *
 * Ported from Base44 (src/components/litigation/LitigationChips.jsx
 * @ 6b1e9ac). Design authority is B44; changes are confined to the port
 * seams:
 *   - hardcoded hex fallbacks dropped (`var(--heading, #1E293B)` →
 *     `var(--heading)`); this app always declares the tokens, and a
 *     literal fallback would go unreadable in dark / contrast /
 *     low-vision rather than following the display mode
 *   - the status dot's colors come from the semantic token tiers
 *     instead of raw hex, for the same reason
 *
 * The AAA property B44 established and this keeps: fill and text are
 * same-family tokens that flip together with the display mode, so the
 * chip is never light-on-light. The status dot is decorative only —
 * `aria-hidden`, and the text label beside it carries the meaning, so
 * status is never conveyed by color alone (WCAG 1.4.1).
 */

import type { CSSProperties, ReactNode } from 'react';
import { kindLabel, statusLabel } from '../../lib/litigationLabels.js';

export function chipListStyle(): CSSProperties {
  return {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.375rem',
  };
}

/** State / neutral chip — tinted card fill, heading-weight text. */
export function StateChip({ children }: { children: ReactNode }) {
  return (
    <li
      style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--heading)',
        background: 'var(--card-bg-tinted)',
        border: '1px solid var(--card-border)',
        borderRadius: 999,
        padding: '3px 10px',
      }}
    >
      {children}
    </li>
  );
}

/**
 * Status family → dot color. Decorative reinforcement of the adjacent
 * text label, so these need only be perceivable, not 7:1 text contrast.
 * Token tiers rather than raw hex so they track the display mode.
 *
 * Hues follow B44 where this palette has the tier: green for active,
 * terracotta for investigating, violet for tracking, slate for closed.
 * B44 used blue for `compliance` and this design system carries no blue
 * tier, so compliance takes the warning (amber) tier instead. Inventing
 * a blue token to match a decorative dot would be a design-system
 * change smuggled in as a port.
 */
const STATUS_DOT: Record<string, string> = {
  active: 'var(--color-success-500)',
  investigating: 'var(--color-accent-500)',
  compliance: 'var(--color-warning-500)',
  tracking: 'var(--color-ada-500)',
  closed: 'var(--body-secondary)',
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const label = statusLabel(status);
  if (!label) return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontFamily: 'Manrope, sans-serif',
        fontSize: '0.7rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--heading)',
        background: 'var(--card-bg-tinted)',
        border: '1px solid var(--card-border)',
        borderRadius: 999,
        padding: '4px 10px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: STATUS_DOT[status ?? ''] ?? STATUS_DOT.closed,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

/** Kind label — quiet text label beneath the status badge. */
export function KindLabel({ kind }: { kind: string | null | undefined }) {
  const label = kindLabel(kind);
  if (!label) return null;
  return (
    <span
      style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '0.8125rem',
        fontWeight: 600,
        color: 'var(--body-secondary)',
      }}
    >
      {label}
    </span>
  );
}
