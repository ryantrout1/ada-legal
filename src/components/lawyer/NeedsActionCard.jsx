import React, { useState } from 'react';
import { Building2, Globe, Clock, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import CaseExpandedView from './CaseExpandedView';

export default function NeedsActionCard({ caseData, contactLogs, notes, onLogContact, onResolve, onSaveNote, highlighted, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded || false);
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const hoursSinceAssign = c.assigned_at ? Math.round((Date.now() - new Date(c.assigned_at).getTime()) / (1000 * 60 * 60)) : 0;
  const overdue = hoursSinceAssign > 24;
  const daysOverdue = Math.floor((hoursSinceAssign - 24) / 24);

  const urgencyText = overdue
    ? (hoursSinceAssign > 72 ? `OVERDUE — ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} past deadline` : `OVERDUE — ${hoursSinceAssign - 24}h past deadline`)
    : `${24 - hoursSinceAssign} hours remaining`;

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: highlighted ? '2px solid #16A34A' : '1px solid var(--slate-200)',
      borderLeft: '4px solid #B91C1C', borderRadius: '12px', overflow: 'hidden',
      boxShadow: highlighted ? '0 0 0 3px rgba(22,163,74,0.2)' : 'none',
      animation: highlighted ? 'highlightPulse 1.5s ease-in-out 2' : 'none'
    }}>
      {highlighted && (
        <style>{`@keyframes highlightPulse { 0%,100%{box-shadow:0 0 0 3px rgba(22,163,74,0.15)} 50%{box-shadow:0 0 0 6px rgba(22,163,74,0.25)} }        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>
      )}
      {/* Collapsed Row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px',
        cursor: 'pointer', transition: 'background-color 0.1s', flexWrap: 'wrap'
      }}
        onClick={(e) => { if (e.target.tagName !== 'BUTTON') setExpanded(!expanded); }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {expanded ? <ChevronDown size={14} style={{ color: 'var(--slate-400)', flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: 'var(--slate-400)', flexShrink: 0 }} />}
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#B91C1C', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)' }}>
          {c.business_name}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '3px',
          padding: '2px 8px', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 700,
          backgroundColor: isPhysical ? 'var(--terra-100, #FEF1EC)' : '#DBEAFE',
          color: isPhysical ? 'var(--terra-600, #C2410C)' : '#1E3A8A', flexShrink: 0
        }}>
          {isPhysical ? <Building2 size={10} /> : <Globe size={10} />}
          {isPhysical ? 'Physical' : 'Digital'}
        </span>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-500)', flex: 1, minWidth: '60px' }}>
          {[c.city, c.state].filter(Boolean).join(', ')}
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0,
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
          color: overdue ? '#B91C1C' : '#B45309'
        }}>
          {overdue ? <AlertTriangle size={13} /> : <Clock size={13} />}
          {urgencyText}
        </span>
        <button type="button" onClick={(e) => { e.stopPropagation(); onLogContact(c); }} style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '0 14px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          fontWeight: 700, color: 'white', backgroundColor: 'var(--terra-600)',
          border: 'none', borderRadius: '8px', cursor: 'pointer', minHeight: '34px', flexShrink: 0,
          transition: 'background-color 0.15s'
        }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--terra-700)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--terra-600)'; }}
        >Log Contact</button>
      </div>

      {expanded && (
        <CaseExpandedView
          caseData={c}
          contactLogs={contactLogs || []}
          notes={notes || []}
          urgent
          onLogContact={onLogContact}
          onResolve={onResolve}
          onSaveNote={onSaveNote}
        />
      )}
    </div>
  );
}