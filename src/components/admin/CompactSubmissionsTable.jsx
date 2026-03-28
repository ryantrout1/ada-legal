import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ArrowRight } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function CompactSubmissionsTable({ cases }) {
  if (!cases || cases.length === 0) {
    return (
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body-secondary)', margin: 0 }}>
        No pending submissions at this time.
      </p>

    );
  }

  const th = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
    color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em',
    padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid var(--slate-200)'
  };
  const td = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-800)',
    padding: '6px 10px', borderBottom: '1px solid var(--slate-100)', verticalAlign: 'middle'
  };

  return (
    <div>
      <div style={{
        backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
        borderRadius: 'var(--radius-md)', overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--slate-50)' }}>
                <th style={th}>ID</th>
                <th style={th}>Business</th>
                <th style={th}>City / State</th>
                <th style={th}>Submitted</th>
                <th style={th}>Status</th>
                <th style={{ ...th, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {cases.map(c => (
                <tr key={c.id}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--body-secondary)' }}>
                    {c.id?.slice(0, 8)}
                  </td>
                  <td style={{ ...td, fontWeight: 600 }}>{c.business_name || '—'}</td>
                  <td style={{ ...td, color: 'var(--slate-600)' }}>
                    {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td style={td}>{formatDate(c.submitted_at || c.created_date)}</td>
                  <td style={td}>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '9999px',
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
                      color: '#92400E', backgroundColor: '#FEF3C7', textTransform: 'capitalize'
                    }}>
                      {(c.status || 'submitted').replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <Link
                      to={createPageUrl('AdminReview') + `?id=${c.id}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--slate-300)', backgroundColor: 'transparent',
                        fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                        color: 'var(--slate-700)', textDecoration: 'none',
                        transition: 'background-color 0.1s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ textAlign: 'right', marginTop: '6px' }}>
        <Link to={createPageUrl('AdminCases')} style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
          color: 'var(--terra-600)', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '4px'
        }}>
          View All <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}