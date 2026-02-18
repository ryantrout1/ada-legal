import React from 'react';
import LawyerBadge, { accountColors } from './LawyerBadge';

const statusColors = {
  submitted: { bg: '#FEF3C7', text: '#92400E' },
  under_review: { bg: '#FEF3C7', text: '#92400E' },
  approved: { bg: '#DBEAFE', text: '#1D4ED8' },
  rejected: { bg: '#FEE2E2', text: '#B91C1C' },
  available: { bg: '#F3E8FF', text: '#7C3AED' },
  assigned: { bg: '#DCFCE7', text: '#15803D' },
  in_progress: { bg: '#DCFCE7', text: '#15803D' },
  closed: { bg: '#F1F5F9', text: '#475569' }
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CaseHistorySection({ lawyer, cases, contactLogs }) {
  const allCases = cases
    .filter(c => c.assigned_lawyer_id === lawyer.id)
    .sort((a, b) => new Date(b.assigned_at || b.created_date) - new Date(a.assigned_at || a.created_date));

  const th = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
    color: 'var(--slate-500)', textAlign: 'left', padding: '0.4rem 0.5rem',
    borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase',
    letterSpacing: '0.04em', whiteSpace: 'nowrap'
  };
  const td = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-700)',
    padding: '0.4rem 0.5rem', borderBottom: '1px solid var(--slate-100)',
    whiteSpace: 'nowrap'
  };

  return (
    <div>
      <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 0.75rem 0' }}>
        Case History ({allCases.length})
      </h3>
      {allCases.length === 0 ? (
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-500)', margin: 0 }}>No cases assigned yet.</p>
      ) : (
        <div style={{ overflow: 'auto', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
            <thead>
              <tr>
                <th style={th}>Business</th>
                <th style={th}>Location</th>
                <th style={th}>Type</th>
                <th style={th}>Assigned</th>
                <th style={th}>First Contact</th>
                <th style={th}>Time to Contact</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {allCases.map(c => {
                const logs = contactLogs.filter(l => l.case_id === c.id && l.lawyer_id === lawyer.id);
                let firstContact = null;
                let timeToContact = null;
                if (logs.length > 0) {
                  firstContact = logs.reduce((min, l) => {
                    const t = new Date(l.logged_at || l.created_date);
                    return t < min ? t : min;
                  }, new Date('2999-01-01'));
                  if (c.assigned_at) {
                    timeToContact = Math.round((firstContact - new Date(c.assigned_at)) / (1000 * 60 * 60));
                  }
                }
                return (
                  <tr key={c.id}>
                    <td style={{ ...td, fontWeight: 600, color: 'var(--slate-800)' }}>{c.business_name}</td>
                    <td style={td}>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                    <td style={td}>{c.violation_type === 'physical_space' ? '🏢' : '🌐'}</td>
                    <td style={td}>{formatDate(c.assigned_at)}</td>
                    <td style={td}>{firstContact ? formatDate(firstContact) : '—'}</td>
                    <td style={td}>{timeToContact !== null ? `${timeToContact}h` : '—'}</td>
                    <td style={td}>
                      <span style={{
                        display: 'inline-block', padding: '0.15rem 0.5rem',
                        fontSize: '0.6875rem', fontWeight: 700, borderRadius: '9999px',
                        backgroundColor: (statusColors[c.status] || statusColors.submitted).bg,
                        color: (statusColors[c.status] || statusColors.submitted).text,
                        textTransform: 'uppercase'
                      }}>
                        {(c.status || '').replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}