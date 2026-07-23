/**
 * AttorneyCard — one attorney in the public directory.
 *
 * Ported from Base44 (src/components/attorneys/AttorneyCard.jsx
 * @ 6b1e9ac, carrying B44's July 7 cohesion pass that unified this
 * card's visual grammar with LawsuitCard). Design authority is B44;
 * changes are confined to the port seams:
 *   - payload is the snake_case /api/attorneys row, typed as
 *     PublicAttorneyRow, which structurally excludes every field B44's
 *     header comment says never to render
 *   - all render decisions come from the pure toCardFields mapper, so
 *     the sparse-row behaviour is tested rather than discovered
 *   - hardcoded hex fallbacks dropped; `--terra-100/600/700` (B44
 *     names this app does not declare) resolve to the accent tiers
 *   - the per-card <style> block is declared once in app.css instead
 *
 * B44 renders phone despite its own header comment saying not to. That
 * comment is stale — phone has been in the live card and in the
 * endpoint's public contract throughout. Kept, matching what the live
 * site shows today; if it should go, it goes from the endpoint too.
 */

import { Mail, Phone, MapPin, ExternalLink, Globe } from 'lucide-react';
import type { CSSProperties } from 'react';
import { toCardFields } from '../../lib/attorneyCardFields.js';
import type { PublicAttorneyRow } from '../../lib/attorneyTypes.js';

const sectionLabelStyle: CSSProperties = {
  margin: '0 0 0.45rem',
  fontFamily: 'Manrope, sans-serif',
  fontSize: '0.6875rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--body-secondary)',
};

const chipListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.375rem',
};

const chipStyle: CSSProperties = {
  fontFamily: 'Manrope, sans-serif',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--heading)',
  background: 'var(--card-bg-tinted)',
  border: '1px solid var(--card-border)',
  borderRadius: 999,
  padding: '3px 10px',
};

const contactRowStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  minHeight: 44,
  padding: '0 0.25rem',
  borderRadius: 8,
  color: 'var(--link)',
  fontFamily: 'Manrope, sans-serif',
  fontSize: '0.875rem',
  fontWeight: 600,
  textDecoration: 'underline',
  alignSelf: 'flex-start',
};

export default function AttorneyCard({ attorney }: { attorney: PublicAttorneyRow }) {
  const f = toCardFields(attorney);

  return (
    <article
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 14,
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        height: '100%',
        boxSizing: 'border-box',
        boxShadow: '0 1px 2px rgba(30,41,59,0.04)',
      }}
    >
      {/* Avatar + name + firm */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div
          aria-hidden="true"
          style={{
            flexShrink: 0,
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--card-bg-tinted)',
            color: 'var(--link)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          {f.initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'Manrope, sans-serif',
              fontSize: '1.0625rem',
              fontWeight: 500,
              color: 'var(--heading)',
              lineHeight: 1.3,
            }}
          >
            {attorney.name}
          </h2>
          {attorney.firm_name && (
            <p
              style={{
                margin: '0.125rem 0 0',
                fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem',
                color: 'var(--body-secondary)',
                lineHeight: 1.35,
              }}
            >
              {attorney.firm_name}
            </p>
          )}
        </div>
      </div>

      {f.showLocation && (
        <p
          style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.875rem',
            color: 'var(--body)',
            lineHeight: 1.35,
          }}
        >
          <MapPin
            size={15}
            aria-hidden="true"
            style={{ flexShrink: 0, color: 'var(--accent)' }}
          />
          {f.location}
        </p>
      )}

      <div style={{ height: 1, background: 'var(--card-border)' }} aria-hidden="true" />

      {/* Licensed in — bar admission, NOT service area. Empty on every
          live row today; the section simply does not render. */}
      {f.showStates && (
        <div>
          <p style={sectionLabelStyle}>Licensed in</p>
          <ul aria-label={`States where ${attorney.name} is licensed`} style={chipListStyle}>
            {f.states.map((st) => (
              <li key={st} style={chipStyle}>
                {st}
              </li>
            ))}
          </ul>
        </div>
      )}

      {f.showChips && (
        <div>
          <p style={sectionLabelStyle}>Practice areas</p>
          <ul aria-label={`Practice areas for ${attorney.name}`} style={chipListStyle}>
            {f.chips.map((c) => (
              <li key={c} style={chipStyle}>
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {f.showBio && (
        <p
          style={{
            margin: 0,
            fontFamily: 'Manrope, sans-serif',
            fontSize: '0.875rem',
            color: 'var(--body)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {f.bio}
        </p>
      )}

      {/* Contact footer — pinned to the card bottom so footers align
          across the grid regardless of bio length. Each row is its own
          44px target and renders only when the field exists. */}
      {f.showContact && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '0.875rem',
            borderTop: '1px solid var(--card-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.125rem',
            alignSelf: 'stretch',
          }}
        >
          {f.website && (
            <a
              className="directory-card-link"
              href={f.website}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${attorney.name}'s website (opens in a new tab)`}
              style={contactRowStyle}
            >
              <Globe size={16} aria-hidden="true" style={{ flex: '0 0 auto' }} />
              Visit website
              <ExternalLink
                size={12}
                aria-hidden="true"
                style={{ flex: '0 0 auto', opacity: 0.7 }}
              />
            </a>
          )}
          {f.email && (
            <a
              className="directory-card-link"
              href={`mailto:${f.email}`}
              aria-label={`Email ${attorney.name} at ${f.email}`}
              style={{ ...contactRowStyle, wordBreak: 'break-all' }}
            >
              <Mail size={16} aria-hidden="true" style={{ flex: '0 0 auto' }} />
              {f.email}
            </a>
          )}
          {f.phoneLabel && f.telHref && (
            <a
              className="directory-card-link"
              href={f.telHref}
              aria-label={`Call ${attorney.name} at ${f.phoneLabel}`}
              style={contactRowStyle}
            >
              <Phone size={16} aria-hidden="true" style={{ flex: '0 0 auto' }} />
              {f.phoneLabel}
            </a>
          )}
        </div>
      )}
    </article>
  );
}
