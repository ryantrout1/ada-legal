import React from 'react';
import { CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SuccessStep({ caseData }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: 'var(--success-100)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto var(--space-xl)'
      }}>
        <CheckCircle size={40} style={{ color: 'var(--success-600)' }} />
      </div>

      <h2 style={{
        fontFamily: 'Fraunces, serif',
        fontSize: '1.75rem',
        fontWeight: 700,
        color: 'var(--slate-900)',
        marginBottom: 'var(--space-sm)'
      }}>
        Report Submitted Successfully
      </h2>

      <p style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '1.0625rem',
        color: 'var(--slate-600)',
        lineHeight: 1.6,
        marginBottom: 'var(--space-2xl)',
        maxWidth: '480px',
        margin: '0 auto var(--space-2xl)'
      }}>
        Your ADA violation report has been received. Our team will review it and, if approved, match you with a licensed attorney in your area.
      </p>

      <div style={{
        backgroundColor: 'var(--slate-50)',
        border: '1px solid var(--slate-200)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xl)',
        marginBottom: 'var(--space-xl)',
        textAlign: 'left'
      }}>
        <h3 style={{
          fontFamily: 'Fraunces, serif',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: 'var(--slate-900)',
          marginBottom: 'var(--space-sm)',
          textAlign: 'center'
        }}>
          Create an Account
        </h3>
        <p style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.9375rem',
          color: 'var(--slate-600)',
          lineHeight: 1.6,
          marginBottom: 'var(--space-lg)',
          textAlign: 'center'
        }}>
          Create an account to track the status of your case and receive updates.
        </p>

        <button
          type="button"
          onClick={() => base44.auth.redirectToLogin()}
          style={{
            width: '100%',
            padding: '0.875rem',
            fontFamily: 'Manrope, sans-serif',
            fontSize: '1.0625rem',
            fontWeight: 700,
            color: 'white',
            backgroundColor: 'var(--terra-600)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            minHeight: '52px',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={e => { e.target.style.backgroundColor = 'var(--terra-700)'; }}
          onMouseLeave={e => { e.target.style.backgroundColor = 'var(--terra-600)'; }}
        >
          Create Account / Sign In
        </button>
      </div>

      <p style={{
        fontFamily: 'Manrope, sans-serif',
        fontSize: '0.8125rem',
        color: 'var(--slate-500)',
        lineHeight: 1.5
      }}>
        A confirmation email has been sent to <strong style={{ color: 'var(--slate-700)' }}>{caseData.contact_email}</strong>.
      </p>
    </div>
  );
}