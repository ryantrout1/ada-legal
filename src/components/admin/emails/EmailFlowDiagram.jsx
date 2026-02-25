import React from 'react';

const RECIPIENT_STYLES = {
  Reporter: { bg: '#DBEAFE', color: '#1D4ED8', border: '#93C5FD' },
  Attorney: { bg: '#F3E8FF', color: '#7C3AED', border: '#C4B5FD' },
  Attorneys: { bg: '#F3E8FF', color: '#7C3AED', border: '#C4B5FD' },
};

const STAGES = [
  {
    label: 'Report Submitted',
    color: '#9A3412', bg: '#FEF1EC',
    emails: [{ key: 'report_submitted', recipient: 'Reporter' }],
  },
  {
    label: 'Admin Review',
    color: '#1D4ED8', bg: '#DBEAFE',
    emails: [
      { key: 'case_approved', recipient: 'Reporter' },
      { key: 'case_rejected', recipient: 'Reporter' },
    ],
  },
  {
    label: 'Available to Attorneys',
    color: '#9A3412', bg: '#FEF1EC',
    emails: [{ key: 'daily_digest', recipient: 'Attorneys' }],
  },
  {
    label: 'Attorney Accepts Case',
    color: '#92400E', bg: '#FEF3C7',
    emails: [
      { key: 'attorney_assigned_reporter', recipient: 'Reporter' },
      { key: 'attorney_assigned_confirmation', recipient: 'Attorney' },
    ],
  },
  {
    label: 'Monitoring',
    color: '#D97706', bg: '#FEF3C7',
    emails: [{ key: 'contact_reminder', recipient: 'Attorney', note: 'if no contact within 22 hours' }],
  },
  {
    label: 'Resolution',
    color: '#64748B', bg: '#F1F5F9',
    emails: [{ key: 'case_closed', recipient: 'Reporter' }],
  },
];

const BRANCH = {
  label: 'Case Reclaimed',
  fromStage: 'Attorney Accepts Case',
  color: '#DC2626', bg: '#FEE2E2',
  emails: [{ key: 'case_reclaimed', recipient: 'Attorney' }],
};

const ONBOARDING = {
  label: 'Attorney Onboarding',
  color: '#15803D', bg: '#DCFCE7',
  emails: [{ key: 'lawyer_approved', recipient: 'Attorney' }],
};

function EmailPill({ email, onClick }) {
  const rs = RECIPIENT_STYLES[email.recipient] || RECIPIENT_STYLES.Reporter;
  return (
    <button
      onClick={() => onClick(email.key)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '5px 12px', borderRadius: '8px',
        backgroundColor: rs.bg, border: `1px solid ${rs.border}`,
        fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
        color: rs.color, cursor: 'pointer', transition: 'all 0.15s',
        whiteSpace: 'nowrap', lineHeight: 1.4,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${rs.border}`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
      title={`${email.key} → ${email.recipient}`}
    >
      <span style={{ fontSize: '11px' }}>✉</span>
      <span>{email.key}</span>
      <span style={{
        fontSize: '0.625rem', fontWeight: 700, opacity: 0.7,
        padding: '1px 6px', borderRadius: '4px',
        backgroundColor: `${rs.color}10`,
      }}>
        {email.recipient}
      </span>
    </button>
  );
}

function StageRow({ stage, isLast, onSelectTemplate }) {
  return (
    <div style={{ display: 'flex', gap: '0', minHeight: '72px' }}>
      {/* Timeline column */}
      <div style={{ width: '28px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '12px', height: '12px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: stage.color, border: `3px solid ${stage.bg}`,
          boxShadow: `0 0 0 2px ${stage.color}`,
          marginTop: '6px',
        }} />
        {!isLast && (
          <div style={{ width: '2px', flex: 1, backgroundColor: '#E2E8F0', minHeight: '20px' }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingBottom: isLast ? '0' : '16px', paddingLeft: '12px' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap',
          backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
          borderRadius: '10px', padding: '12px 16px',
        }}>
          {/* Stage label */}
          <div style={{ minWidth: '160px', flexShrink: 0, paddingTop: '2px' }}>
            <span style={{
              fontFamily: 'Fraunces, serif', fontSize: '0.9375rem', fontWeight: 700,
              color: stage.color, lineHeight: 1.3,
            }}>
              {stage.label}
            </span>
          </div>

          {/* Email pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            {stage.emails.map(email => (
              <div key={email.key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <EmailPill email={email} onClick={onSelectTemplate} />
                {email.note && (
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem',
                    color: '#94A3B8', fontStyle: 'italic',
                  }}>
                    {email.note}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmailFlowDiagram({ onSelectTemplate }) {
  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: '12px', padding: '24px', marginBottom: '16px',
    }}>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600,
        color: 'var(--slate-900)', margin: '0 0 8px',
      }}>
        Email Lifecycle Flow
      </h2>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#DBEAFE', border: '1px solid #93C5FD' }} />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B' }}>Reporter</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#F3E8FF', border: '1px solid #C4B5FD' }} />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 600, color: '#64748B' }}>Attorney</span>
        </div>
      </div>

      {/* Main timeline */}
      <div style={{ marginBottom: '20px' }}>
        {STAGES.map((stage, i) => (
          <StageRow key={stage.label} stage={stage} isLast={i === STAGES.length - 1} onSelectTemplate={onSelectTemplate} />
        ))}
      </div>

      {/* Branch + Onboarding side by side */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        {/* Branch: Case Reclaimed */}
        <div style={{
          flex: '1 1 320px', backgroundColor: '#FEF2F210',
          border: '1px dashed #FECACA', borderRadius: '10px', padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: BRANCH.color,
            }} />
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
              color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Branch from "Attorney Accepts Case"
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'Fraunces, serif', fontSize: '0.875rem', fontWeight: 700,
              color: BRANCH.color,
            }}>
              {BRANCH.label}
            </span>
            {BRANCH.emails.map(email => (
              <EmailPill key={email.key} email={email} onClick={onSelectTemplate} />
            ))}
          </div>
        </div>

        {/* Attorney Onboarding */}
        <div style={{
          flex: '1 1 320px', backgroundColor: '#F0FDF410',
          border: '1px dashed #BBF7D0', borderRadius: '10px', padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: ONBOARDING.color,
            }} />
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
              color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Separate Flow
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'Fraunces, serif', fontSize: '0.875rem', fontWeight: 700,
              color: ONBOARDING.color,
            }}>
              {ONBOARDING.label}
            </span>
            {ONBOARDING.emails.map(email => (
              <EmailPill key={email.key} email={email} onClick={onSelectTemplate} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}