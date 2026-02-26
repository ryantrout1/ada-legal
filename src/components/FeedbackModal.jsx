import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, CheckCircle } from 'lucide-react';

const TYPES = [
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'question', label: 'Question' },
  { value: 'general_feedback', label: 'General Feedback' },
];

export default function FeedbackModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ feedback_type: 'general_feedback', message: '', name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const capturedRef = useRef({ page_url: '', page_name: '' });
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      capturedRef.current = {
        page_url: window.location.href,
        page_name: document.title,
      };
      setForm({ feedback_type: 'general_feedback', message: '', name: '', email: '' });
      setSuccess(false);
      setError('');
      setTimeout(() => textareaRef.current?.focus(), 100);
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
    if (!form.message.trim()) {
      setError('Please enter your feedback.');
      return;
    }
    setSubmitting(true);
    setError('');
    await base44.entities.Feedback.create({
      feedback_type: form.feedback_type,
      message: form.message.trim(),
      name: form.name.trim() || undefined,
      email: form.email.trim() || undefined,
      page_url: capturedRef.current.page_url,
      page_name: capturedRef.current.page_name,
      status: 'new',
    });
    base44.analytics.track({ eventName: 'feedback_submitted', properties: { feedback_type: form.feedback_type } });
    setSubmitting(false);
    setSuccess(true);
  };

  const inputStyle = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
    padding: '10px 12px', borderRadius: '8px',
    border: '1px solid #E2E8F0', outline: 'none',
    width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle = {
    fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
    fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px',
  };

  return (
    <div
      role="dialog" aria-modal="true" aria-label="Submit feedback"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
        padding: '24px',
      }}
    >
      <div style={{
        background: 'white', borderRadius: '16px', padding: '28px 24px',
        width: '100%', maxWidth: '400px', position: 'relative',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
      }}>
        <button
          onClick={onClose} aria-label="Close"
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#64748B', padding: '4px', minWidth: '36px', minHeight: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <X size={18} />
        </button>

        {!success ? (
          <>
            <h2 style={{
              fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700,
              color: '#1E293B', margin: '0 0 4px',
            }}>
              Share Your Feedback
            </h2>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
              color: '#64748B', margin: '0 0 20px', lineHeight: 1.5,
            }}>
              Help us improve ADA Legal Link.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle} htmlFor="fb-type">Feedback type</label>
                <select
                  id="fb-type"
                  value={form.feedback_type}
                  onChange={(e) => setForm({ ...form, feedback_type: e.target.value })}
                  style={{ ...inputStyle, minHeight: '40px' }}
                >
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle} htmlFor="fb-msg">Your feedback <span style={{ color: '#DC2626' }}>*</span></label>
                <textarea
                  id="fb-msg"
                  ref={textareaRef}
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="What's on your mind?"
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '90px' }}
                  onFocus={(e) => e.target.style.borderColor = '#C2410C'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="fb-name">Name <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span></label>
                <input
                  id="fb-name" type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#C2410C'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div>
                <label style={labelStyle} htmlFor="fb-email">Email <span style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span></label>
                <input
                  id="fb-email" type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#C2410C'}
                  onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                />

              </div>

              {error && <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: '#DC2626', margin: 0 }}>{error}</p>}

              <button
                type="submit" disabled={submitting}
                style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
                  background: '#C2410C', color: 'white', border: 'none',
                  padding: '12px 20px', borderRadius: '10px', cursor: 'pointer',
                  minHeight: '44px', opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%', background: '#F0FDF4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>
              <CheckCircle size={26} color="#16A34A" />
            </div>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 700, color: '#1E293B', margin: '0 0 6px' }}>
              Thank you!
            </h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#475569', margin: '0 0 18px', lineHeight: 1.5 }}>
              Your feedback helps us build a better platform.
            </p>
            <button
              onClick={onClose}
              style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 600,
                background: '#1E293B', color: 'white', border: 'none',
                padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', minHeight: '44px',
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}