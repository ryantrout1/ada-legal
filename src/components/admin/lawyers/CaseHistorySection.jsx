import React, { useState } from 'react';
import { Building2, Globe, ChevronDown, ChevronRight } from 'lucide-react';

const STATUS_BADGE = {
  submitted:    { bg: 'var(--body-secondary)', text: '#FFFFFF' },
  under_review: { bg: '#1D4ED8', text: '#FFFFFF' },
  available:    { bg: 'var(--suc-fg)', text: '#FFFFFF' },
  approved:     { bg: 'var(--suc-fg)', text: '#FFFFFF' },
  assigned:     { bg: 'var(--accent)', text: '#FFFFFF' },
  in_progress:  { bg: 'var(--suc-fg)', text: '#FFFFFF' },
  closed:       { bg: 'var(--body-secondary)', text: '#FFFFFF' },
  rejected:     { bg: 'var(--err-fg)', text: '#FFFFFF' },
  expired:      { bg: 'var(--wrn-fg)', text: '#FFFFFF' }
};

const RESOLUTION_LABELS = {
  engaged: 'Engaged', referred_out: 'Referred Out', not_viable: 'Not Viable',
  claimant_unresponsive: 'Unresponsive', claimant_declined: 'Declined', admin_closed: 'Admin Closed'
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CaseHistorySection({ lawyer, cases, contactLogs }) {
  const allCases = cases
    .filter(c => c.assigned_lawyer_id === lawyer.id)
    .sort((a, b) => new Date(b.assigned_at || b.created_date) - new Date(a.assigned_at || a.created_date));

  const [open, setOpen] = useState(allCases.length > 0);

  const th = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
    color: 'var(--body-secondary)', textAlign: 'left', padding: '6px 8px',
    borderBottom: '2px solid var(--card-border)', textTransform: 'uppercase',
    letterSpacing: '0.04em', whiteSpace: 'nowrap'
  };
  const td = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)',
    padding: '6px 8px', borderBottom: '1px solid #F1F5F9', whiteSpace: 'nowrap'
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: open ? '8px' : 0
        }}
      >
        {open ? <ChevronDown size={14} style={{ color: 'var(--body-secondary)' }} /> : <ChevronRight size={14} style={{ color: 'var(--body-secondary)' }} />}
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>
          Case History ({allCases.length})
        </p>
      </button>

      {open && (
        allCases.length === 0 ? (
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body-secondary)', margin: '4px 0 0 20px' }}>
            No cases assigned yet.
          </p>
        ) : (
          <div style={{ overflow: 'auto', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'var(--card-bg)' }}>
              <thead>
                <tr>
                  <th style={th}>Business</th>
                  <th style={th}>Location</th>
                  <th style={th}>Type</th>
                  <th style={th}>Assigned</th>
                  <th style={th}>Status</th>
                  <th style={th}>Resolution</th>
                </tr>
              </thead>
              <tbody>
                {allCases.map(c => {
                  const isPhysical = c.violation_type === 'physical_space';
                  const badge = STATUS_BADGE[c.status] || STATUS_BADGE.submitted;
                  return (
                    <tr key={c.id}>
                      <td style={{ ...td, fontWeight: 600, color: 'var(--body)' }}>{c.business_name}</td>
                      <td style={td}>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                      <td style={td}>
                        {isPhysical
                          ? <Building2 size={14} style={{ color: 'var(--accent)' }} />
                          : <Globe size={14} style={{ color: '#1E3A8A' }} />
                        }
                      </td>
                      <td style={td}>{formatDate(c.assigned_at)}</td>
                      <td style={td}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px',
                          fontSize: '0.6875rem', fontWeight: 700, borderRadius: '9999px',
                          backgroundColor: badge.bg, color: badge.text,
                          textTransform: 'uppercase'
                        }}>
                          {(c.status || '').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={td}>
                        {c.resolution_type ? (
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                            fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600,
                            color: 'var(--heading)', backgroundColor: 'var(--card-border)'
                          }}>
                            {RESOLUTION_LABELS[c.resolution_type] || c.resolution_type}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}