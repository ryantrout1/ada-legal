import React from 'react';
import { Building2, Globe } from 'lucide-react';
import { getFreshness } from './docScore';
import DocScoreDots from './DocScoreDots';
import SourceBadge from '../shared/SourceBadge';
import ClusterIndicator from './ClusterIndicator';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function extractDomain(url) {
  if (!url) return '—';
  try { const c = url.startsWith('http') ? url : `https://${url}`; return new URL(c).hostname; }
  catch { return url.split('/')[0]; }
}

export default function CaseCard({ caseData, onViewDetails }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const freshness = getFreshness(c);

  const cardOpacity = freshness.type === 'old' ? 0.85 : 1;

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        cursor: 'default',
        opacity: cardOpacity,
        position: 'relative'
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--body-secondary)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Green accent bar for new cases */}
      {freshness.type === 'new' && (
        <div style={{ height: '4px', backgroundColor: 'var(--accent-success)', width: '100%' }} />
      )}

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Row 1: Violation type header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '8px 12px', borderRadius: 'var(--radius-sm)',
          backgroundColor: isPhysical ? 'var(--card-bg-tinted)' : '#DBEAFE'
        }}>
          {isPhysical
            ? <Building2 size={16} aria-hidden="true" style={{ color: 'var(--accent)' }} />
            : <Globe size={16} aria-hidden="true" style={{ color: 'var(--link)' }} />
          }
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
            color: isPhysical ? 'var(--section-label)' : 'var(--link)'
          }}>
            {isPhysical ? 'Physical Space' : 'Digital / Website'}
          </span>
          <SourceBadge source={c.intake_source} />
        </div>

        {/* Row 2: Business type + location */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--heading)' }}>
            {c.business_type || '—'}
          </span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body)' }}>
            {[c.city, c.state].filter(Boolean).join(', ') || '—'}
          </span>
        </div>

        {/* Row 3: Single tag pill */}
        {(isPhysical ? c.violation_subtype : c.url_domain) && (
          <div>
            <span style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: '6px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
              color: 'var(--dark-bg)', backgroundColor: 'var(--page-bg-subtle)',
              border: '1px solid var(--border)'
            }}>
              {isPhysical ? c.violation_subtype : extractDomain(c.url_domain)}
            </span>
          </div>
        )}

        {/* Row 4: Narrative preview */}
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          color: 'var(--body)', lineHeight: 1.55, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden', textOverflow: 'ellipsis', minHeight: '2.5em'
        }}>
          {c.narrative || 'No description available.'}
        </p>

        {/* Documentation Score */}
        <DocScoreDots caseData={c} tooltipPlacement="below" />

        {/* Cluster Indicator */}
        <ClusterIndicator caseData={c} />

        {/* Row 5: Footer — date + view details */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: freshness.type === 'old' ? 'var(--section-label)' : 'var(--body-secondary)' }}>
            {freshness.type === 'old' ? `Posted ${freshness.daysAgo} days ago` : `Posted ${formatDate(c.approved_at)}`}
            {freshness.type === 'new' && (
              <span style={{
                display: 'inline-block', marginLeft: '6px', padding: '1px 6px', borderRadius: '4px',
                fontSize: '0.625rem', fontWeight: 800, color: 'var(--accent-success)', backgroundColor: '#DCFCE7',
                textTransform: 'uppercase', letterSpacing: '0.04em', verticalAlign: 'middle'
              }}>NEW</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => onViewDetails(c)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
              color: 'var(--section-label)'
            }}
            onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
          >
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
}