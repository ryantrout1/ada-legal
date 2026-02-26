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

  return (
    <>
      <style>{`
        #feedback-modal-panel,
        #feedback-modal-panel * {
          background-color: transparent !important;
          background-image: none !important;
        }
        #feedback-modal-panel {
          background-color: #FAF7F2 !important;
          color: #334155 !important;
        }
        #feedback-modal-panel h2 {
          color: #1E293B !important;
        }
        #feedback-modal-panel p {
          color: #64748B !important;
        }
        #feedback-modal-panel p.fb-error-msg {
          color: #DC2626 !important;
        }
        #feedback-modal-panel p.fb-success-body {
          color: #475569 !important;
        }
        #feedback-modal-panel label {
          color: #334155 !important;
        }
        #feedback-modal-panel label span {
          color: inherit !important;
        }
        #feedback-modal-panel label span.fb-optional {
          color: #94A3B8 !important;
        }
        #feedback-modal-panel label span.fb-required {
          color: #DC2626 !important;
        }
        #feedback-modal-panel input,
        #feedback-modal-panel textarea,
        #feedback-modal-panel select {
          background-color: #FFFFFF !important;
          color: #334155 !important;
          border: 1px solid #D1D5DB !important;
        }
        #feedback-modal-panel input:focus,
        #feedback-modal-panel textarea:focus,
        #feedback-modal-panel select:focus {
          border-color: #C2410C !important;
        }
        #feedback-modal-panel input::placeholder,
        #feedback-modal-panel textarea::placeholder {
          color: #9CA3AF !important;
        }
        #feedback-modal-panel option {
          background-color: #FFFFFF !important;
          color: #334155 !important;
        }
        #feedback-modal-panel button.fb-close-btn {
          color: #475569 !important;
          background-color: transparent !important;
          border: none !important;
        }
        #feedback-modal-panel button.fb-submit-btn {
          background-color: #C2410C !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        #feedback-modal-panel button.fb-done-btn {
          background-color: #1E293B !important;
          color: #FFFFFF !important;
          border: none !important;
        }
        #feedback-modal-panel div.fb-success-icon {
          background-color: #F0FDF4 !important;
        }
        #feedback-modal-panel form {
          background-color: transparent !important;
        }
        #feedback-modal-panel div {
          background-color: transparent !important;
        }
      `}</style>
      <div
        role="dialog" aria-modal="true" aria-label="Submit feedback"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
          padding: '24px',
        }}
      >
        <div
          id="feedback-modal-panel"
          style={{
            backgroundColor: '#FAF7F2',
            borderRadius: '16px', padding: '28px 24px',
            width: '100%', maxWidth: '400px', position: 'relative',
            boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            maxHeight: 'calc(100vh - 48px)', overflowY: 'auto',
            color: '#334155',
          }}
        >
          <button
            onClick={onClose} aria-label="Close"
            className="fb-close-btn"
            style={{
              position: 'absolute', top: '12px', right: '12px',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#475569', padding: '4px', minWidth: '36px', minHeight: '36px',
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
                  <label style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }} htmlFor="fb-type">Feedback type</label>
                  <select
                    id="fb-type"
                    value={form.feedback_type}
                    onChange={(e) => setForm({ ...form, feedback_type: e.target.value })}
                    style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
                      padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid #D1D5DB', outline: 'none',
                      width: '100%', boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF', color: '#334155',
                      minHeight: '40px', appearance: 'auto',
                    }}
                  >
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }} htmlFor="fb-msg">Your feedback <span className="fb-required" style={{ color: '#DC2626' }}>*</span></label>
                  <textarea
                    id="fb-msg"
                    ref={textareaRef}
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="What's on your mind?"
                    style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
                      padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid #D1D5DB', outline: 'none',
                      width: '100%', boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF', color: '#334155',
                      resize: 'vertical', minHeight: '90px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }} htmlFor="fb-name">Name <span className="fb-optional" style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span></label>
                  <input
                    id="fb-name" type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
                      padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid #D1D5DB', outline: 'none',
                      width: '100%', boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF', color: '#334155',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }} htmlFor="fb-email">Email <span className="fb-optional" style={{ color: '#94A3B8', fontWeight: 400 }}>(optional)</span></label>
                  <input
                    id="fb-email" type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
                      padding: '10px 12px', borderRadius: '8px',
                      border: '1px solid #D1D5DB', outline: 'none',
                      width: '100%', boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF', color: '#334155',
                    }}
                  />
                </div>

                {error && <p className="fb-error-msg" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: '#DC2626', margin: 0 }}>{error}</p>}

                <button
                  type="submit" disabled={submitting}
                  className="fb-submit-btn"
                  style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
                    backgroundColor: '#C2410C', color: 'white', border: 'none',
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
              <div className="fb-success-icon" style={{
                width: '52px', height: '52px', borderRadius: '50%', backgroundColor: '#F0FDF4',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
              }}>
                <CheckCircle size={26} color="#16A34A" />
              </div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 700, color: '#1E293B', margin: '0 0 6px' }}>
                Thank you!
              </h2>
              <p className="fb-success-body" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#475569', margin: '0 0 18px', lineHeight: 1.5 }}>
                Your feedback helps us build a better platform.
              </p>
              <button
                onClick={onClose}
                className="fb-done-btn"
                style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 600,
                  backgroundColor: '#1E293B', color: 'white', border: 'none',
                  padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', minHeight: '44px',
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}