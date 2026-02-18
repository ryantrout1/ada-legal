import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'matched', label: 'Attorney Matched' },
  { key: 'in_progress', label: 'In Progress' }
];

function getStepIndex(status) {
  if (status === 'submitted') return 0;
  if (status === 'under_review') return 1;
  if (status === 'approved' || status === 'available') return 2;
  if (status === 'assigned') return 3;
  if (status === 'in_progress') return 3;
  if (status === 'closed') return 4;
  if (status === 'expired') return 2;
  if (status === 'rejected') return 1;
  return 0;
}

function isCompleted(stepIdx, currentIdx, status) {
  if (status === 'closed') return stepIdx < 4;
  return stepIdx < currentIdx;
}

function isCurrent(stepIdx, currentIdx, status) {
  if (status === 'closed') return false;
  return stepIdx === currentIdx;
}

const STATUS_MESSAGES = {
  submitted: {
    bg: 'var(--slate-50)',
    text: 'Your report has been received. Our team is reviewing it for completeness. This usually takes less than 24 hours.'
  },
  under_review: {
    bg: '#DBEAFE',
    text: "Your report is currently being reviewed by our team. We're making sure it has everything an attorney needs to evaluate your case."
  },
  approved: {
    bg: '#DCFCE7',
    text: 'Your case has been approved and is now available to attorneys in your area. An attorney will reach out to you soon.'
  },
  available: {
    bg: '#DCFCE7',
    text: 'Your case has been approved and is now available to attorneys in your area. An attorney will reach out to you soon.'
  },
  assigned: {
    bg: 'var(--terra-100, #FEF1EC)',
    text: 'An attorney has been assigned to your case and should contact you within 24 hours using your preferred contact method.'
  },
  in_progress: {
    bg: '#DCFCE7',
    text: "An attorney is actively working on your case. If you haven't heard from them, please contact us."
  },
  expired: {
    bg: '#FEF3C7',
    text: null
  },
  closed: {
    bg: '#F1F5F9',
    text: null
  },
  rejected: {
    bg: '#FEE2E2',
    text: 'After review, your case was not approved for the attorney marketplace. If you believe this was in error, please contact support.'
  }
};

export default function StatusProgress({ status, closedEventDescription, expiredMessage }) {
  const currentIdx = getStepIndex(status);
  const msg = STATUS_MESSAGES[status] || STATUS_MESSAGES.submitted;

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: '12px', padding: '24px'
    }}>
      {/* Step Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        {STEPS.map((step, i) => {
          const completed = isCompleted(i, currentIdx, status);
          const current = isCurrent(i, currentIdx, status);
          const future = !completed && !current;
          return (
            <React.Fragment key={step.key}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: '0 0 auto', minWidth: '70px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: completed ? '#15803D' : current ? 'var(--terra-600, #C2410C)' : 'transparent',
                  border: future ? '2px solid var(--slate-300)' : 'none',
                  animation: current ? 'stepPulse 2s ease-in-out infinite' : 'none',
                  transition: 'background-color 0.3s'
                }}>
                  {completed && <Check size={16} style={{ color: 'white' }} />}
                  {current && <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'white' }} />}
                </div>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                  color: completed ? '#15803D' : current ? 'var(--terra-600, #C2410C)' : 'var(--slate-400)',
                  textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.03em'
                }}>{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  flex: 1, height: '2px', margin: '0 4px',
                  backgroundColor: completed ? '#15803D' : 'var(--slate-200)',
                  marginBottom: '20px', transition: 'background-color 0.3s'
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status message */}
      {status === 'closed' && closedEventDescription ? (
        <div style={{ backgroundColor: '#F1F5F9', borderRadius: '10px', padding: '16px' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-700)', margin: '0 0 4px' }}>
            Case Resolution
          </p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)', lineHeight: 1.7, margin: 0 }}>
            {closedEventDescription}
          </p>
        </div>
      ) : status === 'expired' ? (
        <div style={{ backgroundColor: '#FEF3C7', borderRadius: '10px', padding: '16px' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#92400E', lineHeight: 1.7, margin: '0 0 12px' }}>
            We were unable to match your case with an attorney in your area within 90 days. This may be due to limited attorney availability in your region. You are welcome to submit a new report at any time.
          </p>
          <Link to={createPageUrl('Intake')} style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '0 16px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
            fontWeight: 700, color: 'white', backgroundColor: 'var(--terra-600)',
            borderRadius: '8px', textDecoration: 'none', minHeight: '44px'
          }}>Submit New Report →</Link>
        </div>
      ) : msg.text ? (
        <div style={{ backgroundColor: msg.bg, borderRadius: '10px', padding: '16px' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)', lineHeight: 1.7, margin: 0 }}>
            {msg.text}
          </p>
        </div>
      ) : null}

      <style>{`@keyframes stepPulse { 0%,100%{box-shadow:0 0 0 0 rgba(194,65,12,0.3)} 50%{box-shadow:0 0 0 8px rgba(194,65,12,0)} }`}</style>
    </div>
  );
}