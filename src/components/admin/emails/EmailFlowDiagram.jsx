import React from 'react';

const STEPS = [
  { label: 'Report Submitted', type: 'stage', color: '#9A3412', bg: '#FEF1EC' },
  { label: 'report_submitted', type: 'email', recipient: 'Reporter', color: '#C2410C' },
  { label: 'Admin Reviews', type: 'stage', color: '#1D4ED8', bg: '#DBEAFE' },
  { label: 'case_rejected', type: 'email', recipient: 'Reporter', color: '#DC2626', branch: true },
  { label: 'case_approved', type: 'email', recipient: 'Reporter', color: '#15803D' },
  { label: 'Available to Attorneys', type: 'stage', color: '#9A3412', bg: '#FEF1EC' },
  { label: 'daily_digest', type: 'email', recipient: 'Attorneys', color: '#7C3AED' },
  { label: 'Attorney Accepts', type: 'stage', color: '#92400E', bg: '#FEF3C7' },
  { label: 'attorney_assigned_reporter', type: 'email', recipient: 'Reporter', color: '#C2410C' },
  { label: 'attorney_assigned_confirmation', type: 'email', recipient: 'Attorney', color: '#1D4ED8' },
  { label: '22hrs No Contact', type: 'stage', color: '#D97706', bg: '#FEF3C7' },
  { label: 'contact_reminder', type: 'email', recipient: 'Attorney', color: '#D97706' },
  { label: 'Case Closed', type: 'stage', color: '#64748B', bg: '#F1F5F9' },
  { label: 'case_closed', type: 'email', recipient: 'Reporter', color: '#64748B' },
];

const RECLAIM = { stage: 'Case Reclaimed', email: 'case_reclaimed', recipient: 'Attorney', color: '#DC2626' };
const ONBOARDING = { label: 'lawyer_approved', recipient: 'Attorney', color: '#15803D' };

export default function EmailFlowDiagram({ onSelectTemplate }) {
  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)', borderRadius: '12px', padding: '24px', marginBottom: '16px', overflowX: 'auto' }}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 20px' }}>
        Email Lifecycle Flow
      </h2>
      
      {/* Main flow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {STEPS.map((step, i) => (
          <React.Fragment key={i}>
            {i > 0 && step.type === 'stage' && (
              <div style={{ color: '#CBD5E1', fontSize: '18px', fontWeight: 700, padding: '0 2px' }}>→</div>
            )}
            {step.type === 'stage' ? (
              <div style={{
                padding: '6px 14px', borderRadius: '8px',
                backgroundColor: step.bg, border: `1px solid ${step.color}20`,
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                color: step.color, whiteSpace: 'nowrap'
              }}>
                {step.label}
              </div>
            ) : (
              <button
                onClick={() => onSelectTemplate(step.label)}
                style={{
                  padding: '4px 10px', borderRadius: '6px',
                  backgroundColor: `${step.color}10`, border: `1px dashed ${step.color}40`,
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600,
                  color: step.color, cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'flex', alignItems: 'center', gap: '4px',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${step.color}20`; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${step.color}10`; }}
                title={`${step.label} → ${step.recipient}`}
              >
                <span style={{ fontSize: '10px' }}>✉</span>
                {step.label}
                <span style={{ fontSize: '0.625rem', opacity: 0.7 }}>({step.recipient})</span>
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Secondary rows */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Reclaim branch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: '#94A3B8' }}>Branch:</span>
          <div style={{
            padding: '6px 14px', borderRadius: '8px',
            backgroundColor: '#FEE2E2', border: '1px solid #DC262620',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
            color: '#DC2626', whiteSpace: 'nowrap'
          }}>
            {RECLAIM.stage}
          </div>
          <div style={{ color: '#CBD5E1', fontSize: '18px', fontWeight: 700 }}>→</div>
          <button
            onClick={() => onSelectTemplate(RECLAIM.email)}
            style={{
              padding: '4px 10px', borderRadius: '6px',
              backgroundColor: '#DC262610', border: '1px dashed #DC262640',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600,
              color: '#DC2626', cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <span style={{ fontSize: '10px' }}>✉</span>
            {RECLAIM.email}
            <span style={{ fontSize: '0.625rem', opacity: 0.7 }}>({RECLAIM.recipient})</span>
          </button>
        </div>

        {/* Onboarding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: '#94A3B8' }}>Onboarding:</span>
          <button
            onClick={() => onSelectTemplate(ONBOARDING.label)}
            style={{
              padding: '4px 10px', borderRadius: '6px',
              backgroundColor: '#15803D10', border: '1px dashed #15803D40',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600,
              color: '#15803D', cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <span style={{ fontSize: '10px' }}>✉</span>
            {ONBOARDING.label}
            <span style={{ fontSize: '0.625rem', opacity: 0.7 }}>({ONBOARDING.recipient})</span>
          </button>
        </div>
      </div>
    </div>
  );
}