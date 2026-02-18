import React from 'react';
import { Building2, Globe } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

export default function CaseCard({ caseData, onViewDetails }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';

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
              ? <Building2 size={18} aria-hidden="true" style={{ color: '#1D4ED8' }} />
              : <Globe size={18} aria-hidden="true" style={{ color: '#7C3AED' }} />
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

      {/* Narrative preview — 2 lines max */}
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
        color: 'var(--slate-600)', lineHeight: 1.6,
        marginBottom: 'var(--space-sm)',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        minHeight: '2.8em'
      }}>
        {c.narrative || 'No description available.'}
      </p>

      {/* View Details link */}
      <button
        type="button"
        onClick={() => onViewDetails(c)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
          color: 'var(--terra-600)', marginBottom: 'var(--space-md)',
          display: 'inline-block'
        }}
        onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
        onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
      >
        View Details →
      </button>

      {/* Footer: date */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          color: 'var(--slate-600)'
        }}>
          Posted {formatDate(c.approved_at)}
        </span>
      </div>
    </div>
  );
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