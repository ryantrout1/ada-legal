import React, { useState } from 'react';
import { Building2, Globe, ChevronDown, ChevronRight } from 'lucide-react';
import CaseExpandedView from './CaseExpandedView';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
const METHOD_LABELS = { phone: 'Phone', email: 'Email', in_person: 'In Person', other: 'Other' };

export default function InProgressCard({ caseData, contactLogs, notes, onLogContact, onResolve, onSaveNote, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded || false);
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const sorted = [...contactLogs].sort((a, b) => new Date(b.logged_at || b.created_date) - new Date(a.logged_at || a.created_date));
  const lastLog = sorted[0];

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderLeft: '4px solid #15803D', borderRadius: '12px', overflow: 'hidden'
    }}>
      {/* Collapsed Row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
        cursor: 'pointer', transition: 'background-color 0.1s', flexWrap: 'wrap'
      }}
        onClick={(e) => { if (e.target.tagName !== 'BUTTON') setExpanded(!expanded); }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.backgroundColor = '#F0FDF4'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {expanded ? <ChevronDown size={14} style={{ color: 'var(--slate-400)', flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />}
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#15803D', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)' }}>
          {c.business_name}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          padding: '2px 8px', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 700,
          backgroundColor: isPhysical ? 'var(--terra-100, #FEF1EC)' : '#DBEAFE',
          color: isPhysical ? 'var(--terra-600, #C2410C)' : '#1D4ED8', flexShrink: 0
        }}>
          {isPhysical ? <Building2 size={10} /> : <Globe size={10} />}
          {isPhysical ? 'Physical' : 'Digital'}
        </span>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)', flex: 1, minWidth: '60px' }}>
          {[c.city, c.state].filter(Boolean).join(', ')}
        </span>
        {lastLog && (
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#15803D', flexShrink: 0 }}>
            Last contact: {formatDate(lastLog.logged_at || lastLog.created_date)} via {METHOD_LABELS[lastLog.contact_method] || lastLog.contact_method}
          </span>
        )}
        <button type="button" onClick={(e) => { e.stopPropagation(); onLogContact(c); }} style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '0 14px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          fontWeight: 700, color: 'var(--terra-600)', backgroundColor: 'transparent',
          border: '1px solid var(--terra-600)', borderRadius: '8px', cursor: 'pointer',
          minHeight: '34px', flexShrink: 0
        }}>Log Follow-Up</button>
      </div>

      {expanded && (
        <CaseExpandedView
          caseData={c}
          contactLogs={contactLogs}
          notes={notes || []}
          urgent={false}
          onLogContact={onLogContact}
          onResolve={onResolve}
          onSaveNote={onSaveNote}
        />
      )}
    </div>
  );
}