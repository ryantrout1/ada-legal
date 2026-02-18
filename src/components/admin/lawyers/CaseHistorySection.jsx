import React, { useState } from 'react';
import { Building2, Globe, ChevronDown, ChevronRight } from 'lucide-react';

const STATUS_BADGE = {
  submitted:    { bg: '#64748B', text: '#FFFFFF' },
  under_review: { bg: '#1D4ED8', text: '#FFFFFF' },
  available:    { bg: '#15803D', text: '#FFFFFF' },
  approved:     { bg: '#15803D', text: '#FFFFFF' },
  assigned:     { bg: '#C2410C', text: '#FFFFFF' },
  in_progress:  { bg: '#15803D', text: '#FFFFFF' },
  closed:       { bg: '#475569', text: '#FFFFFF' },
  rejected:     { bg: '#B91C1C', text: '#FFFFFF' },
  expired:      { bg: '#92400E', text: '#FFFFFF' }
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
    color: '#475569', textAlign: 'left', padding: '6px 8px',
    borderBottom: '2px solid var(--slate-200)', textTransform: 'uppercase',
    letterSpacing: '0.04em', whiteSpace: 'nowrap'
  };
  const td = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#475569',
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
        {open ? <ChevronDown size={14} style={{ color: '#475569' }} /> : <ChevronRight size={14} style={{ color: '#475569' }} />}
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
          Case History ({allCases.length})
        </h3>
      </button>

      {open && (
        allCases.length === 0 ? (
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569', margin: '4px 0 0 20px' }}>
            No cases assigned yet.
          </p>
        ) : (
          <div style={{ overflow: 'auto', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white' }}>
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
                      <td style={{ ...td, fontWeight: 600, color: '#334155' }}>{c.business_name}</td>
                      <td style={td}>{[c.city, c.state].filter(Boolean).join(', ') || '—'}</td>
                      <td style={td}>
                        {isPhysical
                          ? <Building2 size={14} style={{ color: '#C2410C' }} />
                          : <Globe size={14} style={{ color: '#1D4ED8' }} />
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
                            color: '#1E293B', backgroundColor: '#E2E8F0'
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