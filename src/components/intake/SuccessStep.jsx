import React, { useState } from 'react';
import { CheckCircle, Mail, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../../utils';
import { caseSubmittedEmail } from '../emails/caseEmails';
import CaseIdDisplay from './CaseIdDisplay';
import WhatHappensNextCallout from './WhatHappensNextCallout';

const inputStyle = {
  width: '100%',
  minHeight: '44px',
  padding: '0.625rem 0.75rem',
  fontFamily: 'Manrope, sans-serif',
  fontSize: '1rem',
  color: 'var(--slate-800)',
  backgroundColor: 'var(--surface)',
  border: '2px solid var(--slate-200)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box'
};

const focusHandler = (e) => {
  e.target.style.borderColor = '#1D4ED8';
  e.target.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.15)';
};

const blurHandler = (e) => {
  e.target.style.borderColor = 'var(--slate-200)';
  e.target.style.boxShadow = 'none';
};

export default function SuccessStep({ caseData, caseId, isLoggedIn }) {
  const [email, setEmail] = useState(caseData.contact_email || '');
  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    setInviting(true);
    try {
      await base44.users.inviteUser(trimmed, 'user');
    } catch (err) {
      // User may already exist — still allow sign in
    }

    // Send confirmation email now that user is registered
    try {
      const portalUrl = window.location.origin + '/MyCases';
      await base44.integrations.Core.SendEmail({
        to: trimmed,
        subject: 'ADA Legal Link — Report Received',
        body: caseSubmittedEmail(caseData, portalUrl)
      });
    } catch (emailErr) {
      console.error('Confirmation email failed:', emailErr);
    }

    setInvited(true);
    setInviting(false);
  };

  const handleSignIn = () => {
    base44.auth.redirectToLogin(createPageUrl('MyCases'));
  };

  // After invite is sent
  if (invited) {
    return (
      <div style={{ textAlign: 'center' }}>
        <CaseIdDisplay caseId={caseId} />
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          backgroundColor: 'var(--success-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-xl)'
        }}>
          <Mail size={40} aria-hidden="true" style={{ color: 'var(--success-600)' }} />
        </div>

        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 700,
          color: 'var(--slate-900)', marginBottom: 'var(--space-sm)'
        }}>
          Check Your Email
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem',
          color: 'var(--slate-600)', lineHeight: 1.6,
          maxWidth: '480px', margin: '0 auto var(--space-xl)'
        }}>
          We sent a sign-in link to <strong style={{ color: 'var(--slate-800)' }}>{email.trim()}</strong>. Click the link in the email to access your case portal.
        </p>

        <button
          type="button"
          onClick={handleSignIn}
          style={{
            width: '100%', maxWidth: '400px', padding: '0.875rem',
            fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem', fontWeight: 700,
            color: 'white', backgroundColor: 'var(--terra-600)',
            border: 'none', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', minHeight: '52px', transition: 'background-color 0.2s'
          }}
          onMouseEnter={e => { e.target.style.backgroundColor = 'var(--terra-700)'; }}
          onMouseLeave={e => { e.target.style.backgroundColor = 'var(--terra-600)'; }}
        >
          Sign In Now
        </button>

        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          color: 'var(--slate-500)', marginTop: 'var(--space-lg)', lineHeight: 1.5
        }}>
          Didn't receive the email? Check your spam folder or try signing in directly.
        </p>
      </div>
    );
  }

  // Skipped state
  if (skipped) {
    return (
      <div style={{ textAlign: 'center' }}>
        <CaseIdDisplay caseId={caseId} />
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          backgroundColor: 'var(--success-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-xl)'
        }}>
          <CheckCircle size={40} aria-hidden="true" style={{ color: 'var(--success-600)' }} />
        </div>

        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 700,
          color: 'var(--slate-900)', marginBottom: 'var(--space-sm)'
        }}>
          Report Submitted Successfully
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem',
          color: 'var(--slate-600)', lineHeight: 1.6,
          maxWidth: '480px', margin: '0 auto var(--space-lg)'
        }}>
          Your report has been received. A confirmation email has been sent to <strong style={{ color: 'var(--slate-700)' }}>{caseData.contact_email}</strong>.
          </p>

          <WhatHappensNextCallout />

          <div style={{
          backgroundColor: 'var(--warning-100)', border: '1px solid var(--warning-600)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
          textAlign: 'left', maxWidth: '480px', margin: '0 auto'
        }}>
          <AlertTriangle size={20} aria-hidden="true" style={{ color: 'var(--warning-600)', flexShrink: 0, marginTop: '2px' }} />
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
            color: 'var(--slate-700)', margin: 0, lineHeight: 1.5
          }}>
            Without an account, you won't be able to check your case status online. You can still create one anytime by signing in with <strong>{caseData.contact_email}</strong>.
          </p>
        </div>
      </div>
    );
  }

  // If user was already logged in, skip account creation — show simple confirmation
  if (isLoggedIn) {
    return (
      <div style={{ textAlign: 'center' }}>
        <CaseIdDisplay caseId={caseId} />
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          backgroundColor: 'var(--success-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-xl)'
        }}>
          <CheckCircle size={40} aria-hidden="true" style={{ color: 'var(--success-600)' }} />
        </div>

        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 700,
          color: 'var(--slate-900)', marginBottom: 'var(--space-sm)'
        }}>
          Report Submitted Successfully
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem',
          color: 'var(--slate-600)', lineHeight: 1.6,
          maxWidth: '480px', margin: '0 auto var(--space-xl)'
        }}>
          Your ADA violation report has been received and is pending review. A confirmation email has been sent to <strong style={{ color: 'var(--slate-700)' }}>{caseData.contact_email}</strong>.
          </p>

          <WhatHappensNextCallout />

          <a
          href={createPageUrl('MyCases')}
          style={{
            display: 'inline-block', padding: '0.875rem 2rem',
            fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem', fontWeight: 700,
            color: 'white', backgroundColor: 'var(--terra-600)',
            borderRadius: 'var(--radius-md)', textDecoration: 'none',
            minHeight: '52px', transition: 'background-color 0.2s'
          }}
        >
          View My Cases
        </a>
      </div>
    );
  }

  // Default: account creation prompt
  return (
    <div>
      <CaseIdDisplay caseId={caseId} />
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          backgroundColor: 'var(--success-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto var(--space-xl)'
        }}>
          <CheckCircle size={40} aria-hidden="true" style={{ color: 'var(--success-600)' }} />
        </div>

        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 700,
          color: 'var(--slate-900)', marginBottom: 'var(--space-sm)'
        }}>
          Report Submitted Successfully
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem',
          color: 'var(--slate-600)', lineHeight: 1.6,
          maxWidth: '480px', margin: '0 auto'
        }}>
          Your ADA violation report has been received and is pending review.
          </p>

          <WhatHappensNextCallout />
          </div>

          {/* Account creation section */}
      <div style={{
        backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)',
        borderRadius: 'var(--radius-lg)', padding: 'var(--space-xl)',
        marginBottom: 'var(--space-lg)'
      }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600,
          color: 'var(--slate-900)', marginBottom: 'var(--space-sm)', textAlign: 'center'
        }}>
          Track Your Case
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
          color: 'var(--slate-600)', lineHeight: 1.6,
          marginBottom: 'var(--space-lg)', textAlign: 'center'
        }}>
          Create an account to check your case status anytime and receive updates when an attorney is assigned.
        </p>

        {/* Email field */}
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <label
            htmlFor="account-email"
            style={{
              display: 'block', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              fontWeight: 600, color: 'var(--slate-700)', marginBottom: 'var(--space-xs)'
            }}
          >
            Email Address
          </label>
          <input
            id="account-email"
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            onFocus={focusHandler}
            onBlur={blurHandler}
            aria-invalid={!!error}
            aria-describedby={error ? 'account-email-error' : undefined}
            style={inputStyle}
          />
          {error && (
            <p id="account-email-error" style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
              color: 'var(--error-600)', marginTop: 'var(--space-xs)', margin: '0.25rem 0 0 0'
            }}>
              {error}
            </p>
          )}
        </div>

        {/* Primary action */}
        <button
          type="button"
          onClick={handleInvite}
          disabled={inviting}
          style={{
            width: '100%', padding: '0.875rem',
            fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem', fontWeight: 700,
            color: 'white', backgroundColor: inviting ? 'var(--slate-400)' : 'var(--terra-600)',
            border: 'none', borderRadius: 'var(--radius-md)',
            cursor: inviting ? 'not-allowed' : 'pointer',
            minHeight: '52px', transition: 'background-color 0.2s',
            marginBottom: 'var(--space-md)'
          }}
          onMouseEnter={e => { if (!inviting) e.target.style.backgroundColor = 'var(--terra-700)'; }}
          onMouseLeave={e => { if (!inviting) e.target.style.backgroundColor = 'var(--terra-600)'; }}
        >
          {inviting ? 'Sending…' : 'Create My Account'}
        </button>

        {/* Secondary action */}
        <button
          type="button"
          onClick={handleSignIn}
          style={{
            width: '100%', padding: '0.75rem',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
            color: 'var(--terra-600)', backgroundColor: 'transparent',
            border: '2px solid var(--terra-600)', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', minHeight: '48px', transition: 'all 0.2s'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--terra-50)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          I Already Have an Account — Sign In
        </button>
      </div>

      {/* Skip link */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => setSkipped(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
            color: 'var(--slate-500)', textDecoration: 'underline',
            padding: '0.5rem'
          }}
        >
          Skip for now
        </button>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          color: 'var(--slate-500)', fontStyle: 'italic', marginTop: 'var(--space-xs)',
          lineHeight: 1.5
        }}>
          Without an account, you won't be able to check your case status online.
        </p>
      </div>

      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
        color: 'var(--slate-500)', lineHeight: 1.5, textAlign: 'center',
        marginTop: 'var(--space-lg)'
      }}>
        A confirmation email has been sent to <strong style={{ color: 'var(--slate-700)' }}>{caseData.contact_email}</strong>.
      </p>
    </div>
  );
}