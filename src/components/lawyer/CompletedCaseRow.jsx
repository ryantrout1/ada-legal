import React, { useState } from 'react';
import { Building2, Globe, ChevronDown, ChevronRight } from 'lucide-react';
import LawyerNotesSection from './LawyerNotesSection';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const RESOLUTION_BADGE = {
  engaged: { label: 'Engaged', bg: '#DCFCE7', color: '#15803D' },
  referred_out: { label: 'Referred Out', bg: '#DBEAFE', color: '#1E3A8A' },
  not_viable: { label: 'Not Viable', bg: 'var(--border-lighter)', color: 'var(--body)' },
  claimant_unresponsive: { label: 'Unresponsive', bg: '#FEF3C7', color: '#B45309' },
  claimant_declined: { label: 'Declined', bg: '#FEF3C7', color: '#B45309' },
  admin_closed: { label: 'Admin Closed', bg: 'var(--border-lighter)', color: 'var(--body)' },
};

export default function CompletedCaseRow({ caseData, notes, onSaveNote }) {
  const [expanded, setExpanded] = useState(false);
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const badge = RESOLUTION_BADGE[c.resolution_type] || { label: c.resolution_type || 'Closed', bg: 'var(--border-lighter)', color: 'var(--body)' };

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderLeft: '4px solid var(--border)', borderRadius: '8px', overflow: 'hidden',
      marginBottom: '6px'
    }}>
      <button type="button" onClick={() => setExpanded(!expanded)} style={{
        display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
        padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
        textAlign: 'left', transition: 'background-color 0.1s'
      }}
        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--page-bg-subtle)'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {expanded ? <ChevronDown size={14} style={{ color: 'var(--body-secondary)', flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: 'var(--body-secondary)', flexShrink: 0 }} />}
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--body-secondary)', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--heading)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.business_name}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
          backgroundColor: isPhysical ? 'var(--card-bg-tinted)' : '#DBEAFE'
        }}>
          {isPhysical ? <Building2 size={10} style={{ color: 'var(--accent)' }} /> : <Globe size={10} style={{ color: '#1E3A8A' }} />}
        </span>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', flexShrink: 0 }}>
          {[c.city, c.state].filter(Boolean).join(', ')}
        </span>
        <span style={{
          display: 'inline-block', padding: '2px 10px', borderRadius: '9999px', flexShrink: 0,
          fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
          backgroundColor: badge.bg, color: badge.color
        }}>{badge.label}</span>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--body-secondary)', flexShrink: 0 }}>
          {formatDate(c.closed_at)}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px 42px', borderTop: '1px solid var(--border-lighter)' }}>
          {c.resolution_notes && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', margin: '0 0 4px' }}>Resolution Notes</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.6, margin: 0 }}>{c.resolution_notes}</p>
            </div>
          )}
          <div style={{
            marginTop: '12px', backgroundColor: 'var(--page-bg-subtle)', borderRadius: '8px', padding: '12px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px'
          }}>
            <div>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', margin: '0 0 2px' }}>Business Type</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--heading)', margin: 0 }}>{c.business_type || '—'}</p>
            </div>
            <div>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', margin: '0 0 2px' }}>Assigned</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--heading)', margin: 0 }}>{formatDate(c.assigned_at)}</p>
            </div>
            <div>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.65rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', margin: '0 0 2px' }}>Closed</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--heading)', margin: 0 }}>{formatDate(c.closed_at)}</p>
            </div>
          </div>
          {/* Lawyer Notes */}
          <div style={{ marginTop: '16px' }}>
            <LawyerNotesSection notes={notes || []} onSaveNote={onSaveNote} />
          </div>
        </div>
      )}
    </div>
  );
}