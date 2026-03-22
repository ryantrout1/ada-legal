import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../../utils';
import { ArrowRight } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecentSubmissionsPanel({ cases, onViewAll }) {
  const recent = useMemo(() => {
    return cases
      .filter(c => c.status === 'submitted')
      .sort((a, b) => new Date(b.submitted_at || b.created_date) - new Date(a.submitted_at || a.created_date))
      .slice(0, 5);
  }, [cases]);

  if (recent.length === 0) {
    return (
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body-secondary)', margin: 0 }}>
        No pending submissions at this time.
      </p>
    );
  }

  const th = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
    color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em',
    padding: '6px 10px', textAlign: 'left', borderBottom: '2px solid var(--card-border)',
  };
  const td = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body)',
    padding: '6px 10px', borderBottom: '1px solid var(--card-bg-tinted)', verticalAlign: 'middle',
  };

  return (
    <div>
      <div style={{
        backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)',
        borderRadius: '8px', overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--page-bg-subtle)' }}>
                <th style={th}>Case ID</th>
                <th style={th}>Business Name</th>
                <th style={th}>City / State</th>
                <th style={th}>Submitted</th>
                <th style={{ ...th, textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(c => (
                <tr key={c.id}>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--body-secondary)' }}>
                    {c.id?.slice(0, 8)}
                  </td>
                  <td style={{ ...td, fontWeight: 600 }}>{c.business_name || '—'}</td>
                  <td style={{ ...td, color: 'var(--slate-600)' }}>
                    {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td style={td}>{formatDate(c.submitted_at || c.created_date)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <Link
                      to={createPageUrl('AdminReview') + `?id=${c.id}`}
                      aria-label={`Review case for ${c.business_name || 'unknown business'}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 10px', borderRadius: '4px',
                        border: '1px solid var(--card-border)', backgroundColor: 'transparent',
                        fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                        color: 'var(--body)', textDecoration: 'none',
                        minHeight: '44px', transition: 'background-color 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--page-bg-subtle)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      Review <ArrowRight size={12} aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {onViewAll && (
        <div style={{ textAlign: 'right', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onViewAll}
            aria-label="View all submitted cases"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
              color: 'var(--terra-600)', display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '4px', minHeight: '44px',
            }}
          >
            View All <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}