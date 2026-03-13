import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Bell, CheckCircle } from 'lucide-react';
import trackEvent from './analytics/trackEvent';

export default function ComingSoonModal({ isOpen, onClose, signupType = 'report_violation' }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setSuccess(false);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    setError('');
    await base44.entities.WaitlistSignup.create({
      email: email.trim(),
      signup_type: signupType,
      signed_up_at: new Date().toISOString()
    });
    trackEvent('waitlist_signup', { signup_type: signupType, email: email.trim() }, 'ComingSoonModal');
    setSubmitting(false);
    setSuccess(true);
  };

  const isPathways = signupType === 'pathways';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Coming soon notification signup"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        ref={modalRef}
        className="modal-light-theme"
        style={{
          background: '#FFFFFF', borderRadius: '16px', padding: '40px 32px',
          maxWidth: '480px', width: '100%', position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          color: '#334155',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#475569', padding: '4px', minWidth: '44px', minHeight: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <X size={20} />
        </button>

        {!success ? (
          <>
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px',
              background: '#FEF1EC', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 0 20px'
            }}>
              <Bell size={28} color="#C2410C" />
            </div>

            <h2 style={{
              fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700,
              color: '#1E293B', margin: '0 0 8px', lineHeight: 1.25
            }}>
              {isPathways ? 'Rights Pathway Opens Soon' : 'Violation Reporting Opens Soon'}
            </h2>

            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
              color: '#475569', lineHeight: 1.65, margin: '0 0 24px'
            }}>
              We're currently in early access. Explore our{' '}
              <span style={{ fontWeight: 600, color: '#1E293B' }}>ADA Standards Guide</span>{' '}
              to understand your rights. Enter your email to be notified when{' '}
              {isPathways ? 'the Rights Pathway goes' : 'reporting goes'} live.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                ref={inputRef}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
                style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
                  padding: '14px 16px', borderRadius: '10px',
                  border: '1px solid #D1D5DB', outline: 'none',
                  transition: 'border-color 0.15s', minHeight: '44px',
                  backgroundColor: '#FFFFFF', color: '#334155',
                }}
                onFocus={(e) => e.target.style.borderColor = '#C2410C'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
              {error && (
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
                  color: '#991B1B', margin: 0
                }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
                  background: '#C2410C', color: 'white', border: 'none',
                  padding: '14px 24px', borderRadius: '10px', cursor: 'pointer',
                  minHeight: '44px', opacity: submitting ? 0.7 : 1,
                  transition: 'background 0.15s'
                }}
              >
                {submitting ? 'Submitting...' : 'Notify Me'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#F0FDF4', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px'
            }}>
              <CheckCircle size={28} color="#16A34A" />
            </div>
            <h2 style={{
              fontFamily: 'Fraunces, serif', fontSize: '1.375rem', fontWeight: 700,
              color: '#1E293B', margin: '0 0 8px'
            }}>
              You're on the list!
            </h2>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
              color: '#475569', lineHeight: 1.6, margin: '0 0 20px'
            }}>
              We'll email you as soon as {isPathways ? 'the Rights Pathway' : 'violation reporting'} is live. In the meantime, explore our ADA Standards Guide.
            </p>
            <button
              onClick={onClose}
              style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 600,
                background: '#1E293B', color: 'white', border: 'none',
                padding: '12px 28px', borderRadius: '10px', cursor: 'pointer',
                minHeight: '44px'
              }}
            >
              Got it
            </button>
          </div>
        )}
      </div>
    </div>
  );
}