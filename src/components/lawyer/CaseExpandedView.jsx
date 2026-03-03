import React from 'react';
import ClaimantContactCard from './ClaimantContactCard';
import CaseSummaryGrid from './CaseSummaryGrid';
import ContactTimeline from './ContactTimeline';
import LawyerNotesSection from './LawyerNotesSection';

export default function CaseExpandedView({ caseData, contactLogs, notes, urgent, onLogContact, onResolve, onSaveNote }) {
  const c = caseData;
  const logLabel = contactLogs.length > 0 ? 'Log Follow-Up' : 'Log Contact';

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border-lighter)' }}>
      <ClaimantContactCard caseData={c} urgent={urgent} />
      <CaseSummaryGrid caseData={c} />

      {/* Narrative */}
      <div style={{
        borderLeft: '3px solid var(--accent)',
        backgroundColor: 'var(--card-bg-tinted)', borderRadius: '0 10px 10px 0', padding: '16px'
      }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--heading)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
          {c.narrative || '—'}
        </p>
      </div>

      {/* Contact History */}
      <ContactTimeline logs={contactLogs} />

      {/* Lawyer Notes */}
      <LawyerNotesSection notes={notes} onSaveNote={onSaveNote} />

      {/* Actions */}
      {c.status !== 'closed' && (
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => onLogContact(c)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '0 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            fontWeight: 700, color: 'white', backgroundColor: 'var(--section-label)',
            border: 'none', borderRadius: '10px', cursor: 'pointer', minHeight: '44px',
            transition: 'background-color 0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--section-label)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--section-label)'; }}
          >{logLabel}</button>
          <button type="button" onClick={() => onResolve(c)} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '0 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            fontWeight: 700, color: 'var(--body)', backgroundColor: 'transparent',
            border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', minHeight: '44px'
          }}>Resolve Case</button>
        </div>
      )}
    </div>
  );
}