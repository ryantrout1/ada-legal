import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function formatViolationType(type) {
  if (type === 'physical_space') return 'Physical Space';
  if (type === 'digital_website') return 'Digital / Website';
  return type || '—';
}

export default function RecentSubmissionsTable({ cases }) {
  if (!cases || cases.length === 0) {
    return (
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--slate-200)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-2xl)',
        textAlign: 'center'
      }}>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.9375rem',
          color: 'var(--slate-600)',
          margin: 0
        }}>
          No pending submissions at this time.
        </p>
      </div>
    );
  }

  const headerStyle = {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'var(--slate-600)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    padding: '0.75rem 1rem',
    textAlign: 'left',
    borderBottom: '2px solid var(--slate-200)'
  };

  const cellStyle = {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '0.875rem',
    color: 'var(--slate-800)',
    padding: '0.875rem 1rem',
    borderBottom: '1px solid var(--slate-100)',
    verticalAlign: 'middle'
  };

  return (
    <div style={{
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--slate-200)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--slate-50)' }}>
              <th style={headerStyle}>Case ID</th>
              <th style={headerStyle}>Violation Type</th>
              <th style={headerStyle}>Business Name</th>
              <th style={headerStyle}>City / State</th>
              <th style={headerStyle}>Submitted</th>
              <th style={headerStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {cases.map(c => (
              <tr
                key={c.id}
                onClick={() => window.location.href = createPageUrl('AdminReview') + `?id=${c.id}`}
                style={{ cursor: 'pointer', transition: 'background-color 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <td style={{ ...cellStyle, fontWeight: 600, fontFamily: 'monospace', fontSize: '0.8125rem' }}>
                  {c.id?.slice(0, 8) || '—'}
                </td>
                <td style={cellStyle}>{formatViolationType(c.violation_type)}</td>
                <td style={{ ...cellStyle, fontWeight: 600 }}>{c.business_name || '—'}</td>
                <td style={cellStyle}>
                  {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                </td>
                <td style={cellStyle}>{formatDate(c.submitted_at || c.created_date)}</td>
                <td style={cellStyle}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#92400E',
                    backgroundColor: '#FEF3C7',
                    borderRadius: '9999px',
                    textTransform: 'capitalize'
                  }}>
                    {(c.status || 'submitted').replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}