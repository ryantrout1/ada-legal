import React, { useState } from 'react';
import { Building2, Globe } from 'lucide-react';
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
      backgroundColor: isEven ? 'var(--slate-50)' : 'white',
      height: '48px', opacity: freshness.type === 'old' ? 0.85 : 1
    }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = isEven ? 'var(--slate-50)' : 'white'; }}
    >
      <td style={td}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '24px', height: '24px', borderRadius: '4px',
          backgroundColor: isPhysical ? 'var(--terra-100, #FEF1EC)' : '#DBEAFE'
        }}>
          {isPhysical
            ? <Building2 size={12} style={{ color: 'var(--terra-600, #C2410C)' }} />
            : <Globe size={12} style={{ color: '#1D4ED8' }} />
          }
        </span>
      </td>
      <td style={{ ...td, fontWeight: 700, color: 'var(--slate-800)' }}>{c.business_type || '—'}</td>
      <td style={td}>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
      <td style={td}>{isPhysical ? (c.violation_subtype || '—') : extractDomain(c.url_domain)}</td>
      <td style={td}>
        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', position: 'relative' }}
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
        >
          {criteria.map((cr, i) => (
            <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: cr.met ? color : 'var(--slate-300)', display: 'inline-block' }} />
          ))}
          {showTip && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: '6px',
              padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--slate-900)',
              color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem',
              whiteSpace: 'nowrap', zIndex: 50
            }}>
              {label} — {score} of 6
            </div>
          )}
        </div>
      </td>
      <td style={td}>
        {freshness.type === 'new' && (
          <span style={{ padding: '1px 5px', borderRadius: '4px', fontSize: '0.5625rem', fontWeight: 800, color: '#15803D', backgroundColor: '#DCFCE7', textTransform: 'uppercase' }}>NEW</span>
        )}
        {freshness.type === 'old' && (
          <span style={{ fontSize: '0.6875rem', color: '#B45309', fontWeight: 600 }}>{freshness.daysAgo}d</span>
        )}
      </td>
      <td style={td}>
        <span style={{ fontSize: '0.75rem', color: freshness.type === 'old' ? '#B45309' : 'var(--slate-500)' }}>
          {formatDate(c.approved_at)}
        </span>
      </td>
      <td style={td}>
        <button type="button" onClick={() => onViewDetails(c)} style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700, color: 'var(--terra-600)'
        }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
        >View Details →</button>
      </td>
    </tr>
  );
}

const td = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)',
  padding: '0 0.75rem', borderBottom: '1px solid var(--slate-100)', whiteSpace: 'nowrap'
};