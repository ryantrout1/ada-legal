import React, { useEffect, useRef } from 'react';
import { calculateDocScore } from './docScore';
import { X } from 'lucide-react';

const GENERIC_CRITERIA = [
  { label: 'Detailed Narrative', description: 'The reporter provided a description of 50 or more characters explaining what happened.' },
  { label: 'Location Identified', description: 'A street address for the business or location was provided.' },
  { label: 'Incident Date Recorded', description: 'The reporter specified when the violation occurred.' },
  { label: 'Visit History', description: 'The reporter indicated whether they had visited the location before.' },
  { label: 'Violation Specifics', description: 'For physical violations: the specific subtype (parking, entrance, restroom, etc.) was identified. For digital violations: the assistive technologies affected were specified.' },
  { label: 'Contact Preference Stated', description: 'The reporter indicated their preferred method of contact (phone, email, etc.).' },
];

export default function DocScoreModal({ open, onClose, caseData }) {
  const overlayRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  const caseSpecific = caseData ? calculateDocScore(caseData) : null;
  const criteria = caseSpecific ? caseSpecific.criteria : GENERIC_CRITERIA.map(c => ({ ...c, met: true }));

  return (
    <div
      ref={overlayRef}
      role="dialog" aria-modal="true" aria-labelledby="doc-score-heading"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '2rem 1rem', overflowY: 'auto'
      }}
    >
      <div style={{
        backgroundColor: 'var(--surface)', borderRadius: '16px',
        maxWidth: '560px', width: '100%', padding: '32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', margin: '2rem 0', position: 'relative'
      }}>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#475569'
        }}>
          <X size={20} />
        </button>

        <h2 id="doc-score-heading" style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700,
          color: 'var(--slate-900)', margin: '0 0 12px', lineHeight: 1.3
        }}>Understanding Case Documentation Scores</h2>

        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-600)',
          lineHeight: 1.7, margin: '0 0 20px'
        }}>
          Each case receives a documentation score based on the completeness of the information provided by the reporter. Better-documented cases typically have stronger foundations for legal action. The score is not a measure of case merit — it reflects how much information is available for your review.
        </p>

        {caseSpecific && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
            backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)',
            marginBottom: '16px', border: '1px solid var(--slate-200)'
          }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {criteria.map((cr, i) => (
                <span key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: cr.met ? caseSpecific.color : 'var(--slate-500)' }} />
              ))}
            </div>
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: caseSpecific.color }}>
              {caseSpecific.score}/6 — {caseSpecific.label}
            </span>
          </div>
        )}

        {/* Criteria list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {criteria.map((cr, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.875rem', color: cr.met ? '#15803D' : 'var(--slate-500)', flexShrink: 0, marginTop: '1px' }}>
                {cr.met ? '●' : '○'}
              </span>
              <div>
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-800)' }}>{cr.label}</span>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)', lineHeight: 1.6, margin: '2px 0 0' }}>
                  {cr.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Guidance */}
        <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-800)', margin: '0 0 10px' }}>
          What this means for you
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {[
            { range: 'Well Documented (5-6)', text: 'These cases have comprehensive detail. You\'ll have strong information to evaluate the violation and reach out to the reporter effectively.', color: '#15803D' },
            { range: 'Moderate Detail (3-4)', text: 'These cases have the basics covered. You may need to gather additional details during your initial contact with the reporter.', color: 'var(--slate-600)' },
            { range: 'Limited Detail (1-2)', text: 'These cases have minimal information. The reporter may not have been able to provide full details at the time of reporting. Initial contact may require more discovery.', color: '#92400E' },
          ].map((item, i) => (
            <div key={i}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: item.color }}>{item.range}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: 'var(--slate-600)' }}> — {item.text}</span>
            </div>
          ))}
        </div>

        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#475569',
          lineHeight: 1.6, margin: 0, fontStyle: 'italic',
          borderTop: '1px solid var(--slate-200)', paddingTop: '16px'
        }}>
          Documentation score does not indicate the legal merit or potential value of a case. Many strong ADA violations are reported with limited initial documentation. All cases on this platform have been reviewed and approved by our team.
        </p>
      </div>
    </div>
  );
}