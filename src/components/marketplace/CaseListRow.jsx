import React from 'react';
import { Building2, Globe } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function extractDomain(url) {
  if (!url) return '—';
  try {
    const cleaned = url.startsWith('http') ? url : `https://${url}`;
    return new URL(cleaned).hostname;
  } catch { return url.split('/')[0]; }
}

export default function CaseListRow({ caseData, onViewDetails }) {
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';

  return (
    <tr
      style={{ cursor: 'default', transition: 'background-color 0.1s' }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <td style={td}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isPhysical
            ? <Building2 size={14} aria-hidden="true" style={{ color: '#1D4ED8', flexShrink: 0 }} />
            : <Globe size={14} aria-hidden="true" style={{ color: '#7C3AED', flexShrink: 0 }} />
          }
          <span style={{ fontWeight: 600, color: isPhysical ? '#1D4ED8' : '#7C3AED', fontSize: '0.8125rem' }}>
            {isPhysical ? 'Physical' : 'Digital'}
          </span>
        </div>
      </td>
      <td style={td}>{c.business_type || '—'}</td>
      <td style={td}>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
      <td style={td}>{isPhysical ? (c.violation_subtype || '—') : extractDomain(c.url_domain)}</td>
      <td style={td}>{formatDate(c.approved_at)}</td>
      <td style={td}>
        <button
          type="button"
          onClick={() => onViewDetails(c)}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
            color: 'var(--terra-600)'
          }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}
        >
          View Details →
        </button>
      </td>
    </tr>
  );
}

const td = {
  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)',
  padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--slate-100)',
  whiteSpace: 'nowrap'
};