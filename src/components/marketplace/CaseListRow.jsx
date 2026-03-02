import React, { useState } from 'react';
import { Building2, Globe, BarChart3 } from 'lucide-react';
import { calculateDocScore, getFreshness } from './docScore';

function extractDomain(url) {
  if (!url) return '—';
  try { const c = url.startsWith('http') ? url : `https://${url}`; return new URL(c).hostname; }
  catch { return url.split('/')[0]; }
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CaseListRow({ caseData, onViewDetails, isEven }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const { criteria, score, label, color } = calculateDocScore(c);
  const freshness = getFreshness(c);
  const [showTip, setShowTip] = useState(false);

  return (
    <tr style={{
      cursor: 'default', transition: 'background-color 0.1s',
      backgroundColor: isEven ? 'var(--page-bg-subtle)' : 'white',
      height: '48px', opacity: freshness.type === 'old' ? 0.85 : 1
    }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--page-bg-subtle)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = isEven ? 'var(--page-bg-subtle)' : 'white'; }}
    >
      <td style={td}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '24px', height: '24px', borderRadius: '4px',
          backgroundColor: isPhysical ? 'var(--card-bg-tinted)' : '#DBEAFE'
        }}>
          {isPhysical
            ? <Building2 size={12} style={{ color: 'var(--accent)' }} />
            : <Globe size={12} style={{ color: 'var(--link)' }} />
          }
        </span>
      </td>
      <td style={{ ...td, fontWeight: 700, color: 'var(--heading)' }}>{c.business_type || '—'}</td>
      <td style={td}>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
      <td style={td}>{isPhysical ? (c.violation_subtype || '—') : extractDomain(c.url_domain)}</td>
      <td style={td}>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', position: 'relative' }}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
        >
          {criteria.map((cr, i) => (
            <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: cr.met ? color : 'var(--body-secondary)', display: 'inline-block' }} />
          ))}
          {showTip && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: '6px',
              padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--heading)',
              color: 'var(--btn-text)', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem',
              whiteSpace: 'nowrap', zIndex: 50
            }}>
              {label} — {score} of 6
            </div>
          )}
        </div>
      </td>
      <td style={td}>
        {freshness.type === 'new' && (
          <span style={{ padding: '1px 5px', borderRadius: '4px', fontSize: '0.5625rem', fontWeight: 800, color: 'var(--accent-success)', backgroundColor: '#DCFCE7', textTransform: 'uppercase' }}>NEW</span>
        )}
        {freshness.type === 'old' && (
          <span style={{ fontSize: '0.6875rem', color: 'var(--section-label)', fontWeight: 600 }}>{freshness.daysAgo}d</span>
        )}
      </td>
      <td style={td}>
        <span style={{ fontSize: '0.75rem', color: freshness.type === 'old' ? 'var(--section-label)' : 'var(--body-secondary)' }}>
          {formatDate(c.approved_at)}
        </span>
      </td>
      <td style={td}>
        {c.ai_duplicate_cluster_size >= 2 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--link)' }}>
            <BarChart3 size={12} aria-hidden="true" />
            {c.ai_duplicate_cluster_size}
          </span>
        )}
      </td>
      <td style={td}>
        <button type="button" onClick={() => onViewDetails(c)} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--section-label)'
        }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
        >View Details →</button>
      </td>
    </tr>
  );
}

const td = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body)',
  padding: '0 0.75rem', borderBottom: '1px solid var(--border-lighter)', whiteSpace: 'nowrap'
};