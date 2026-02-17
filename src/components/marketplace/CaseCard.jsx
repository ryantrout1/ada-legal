import React from 'react';
import { Building2, Globe, ArrowRight } from 'lucide-react';

function redactNames(text) {
  // Redact capitalized proper name patterns (2+ capitalized words in sequence, or single capitalized word not at sentence start)
  return text
    .replace(/(?<=[.!?]\s+)([A-Z][a-z]+)/g, '$1') // keep sentence-start words
    .replace(/\b([A-Z][a-z]{1,}(?:\s+[A-Z][a-z]{1,})+)\b/g, '[Name]') // multi-word proper names
    .replace(/(?<=\s)([A-Z][a-z]{2,})\b(?!\s+[a-z])/g, (match, p1, offset, str) => {
      // Single capitalized word mid-sentence
      const before = str.slice(Math.max(0, offset - 3), offset);
      if (/[.!?]\s*$/.test(before)) return match;
      return '[Name]';
    });
}

function extractDomain(url) {
  if (!url) return '—';
  try {
    const cleaned = url.startsWith('http') ? url : `https://${url}`;
    return new URL(cleaned).hostname;
  } catch {
    return url.split('/')[0];
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export default function CaseCard({ caseData, onInitiate }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';

  const truncatedNarrative = (() => {
    const raw = (c.narrative || '').slice(0, 200);
    const redacted = redactNames(raw);
    return redacted + (c.narrative && c.narrative.length > 200 ? '…' : '');
  })();

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--slate-200)',
        borderRadius: '16px',
        padding: 'var(--space-lg)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: 'default'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--slate-400)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--slate-200)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Top row: icon + type + badge */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 'var(--space-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
            backgroundColor: isPhysical ? '#DBEAFE' : '#F3E8FF', flexShrink: 0
          }}>
            {isPhysical
              ? <Building2 size={18} style={{ color: '#1D4ED8' }} />
              : <Globe size={18} style={{ color: '#7C3AED' }} />
            }
          </span>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
            color: isPhysical ? '#1D4ED8' : '#7C3AED'
          }}>
            {isPhysical ? 'Physical Space' : 'Digital / Website'}
          </span>
        </div>
        <span style={{
          display: 'inline-block', padding: '0.2rem 0.625rem',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
          color: '#15803D', backgroundColor: '#DCFCE7', borderRadius: '9999px',
          textTransform: 'uppercase', letterSpacing: '0.04em'
        }}>
          Available
        </span>
      </div>

      {/* Details */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)',
        marginBottom: 'var(--space-md)'
      }}>
        <DetailChip label={c.business_type || '—'} />
        <DetailChip label={[c.city, c.state].filter(Boolean).join(', ') || '—'} />
        {isPhysical && c.violation_subtype && <DetailChip label={c.violation_subtype} />}
        {!isPhysical && c.url_domain && <DetailChip label={extractDomain(c.url_domain)} />}
      </div>

      {/* Narrative preview */}
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
        color: 'var(--slate-600)', lineHeight: 1.6,
        marginBottom: 'var(--space-md)', minHeight: '3em'
      }}>
        {truncatedNarrative || 'No description available.'}
      </p>

      {/* Footer: date + button */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 'var(--space-sm)'
      }}>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          color: 'var(--slate-600)'
        }}>
          Posted {formatDate(c.approved_at)}
        </span>
        <button
          type="button"
          onClick={() => onInitiate(c)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.625rem 1.25rem', fontFamily: 'Manrope, sans-serif',
            fontSize: '0.875rem', fontWeight: 700, color: 'white',
            backgroundColor: 'var(--terra-600)', border: 'none',
            borderRadius: 'var(--radius-md)', cursor: 'pointer',
            minHeight: '44px', transition: 'background-color 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--terra-700)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--terra-600)'; }}
        >
          Initiate Support
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

function DetailChip({ label }) {
  return (
    <span style={{
      display: 'inline-block', padding: '0.2rem 0.625rem',
      fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
      color: 'var(--slate-700)', backgroundColor: 'var(--slate-50)',
      border: '1px solid var(--slate-200)', borderRadius: '6px'
    }}>
      {label}
    </span>
  );
}