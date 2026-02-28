import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { X, CheckCircle } from 'lucide-react';

const TYPES = [
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'question', label: 'Question' },
  { value: 'general_feedback', label: 'General Feedback' },
  { value: 'testimonial', label: '\u2764\uFE0F I Love This!' },
];

export default function FeedbackModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ feedback_type: 'general_feedback', message: '', name: '', email: '', display_name: '', location: '', testimonial_consent: false });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const capturedRef = useRef({ page_url: '', page_name: '' });
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      capturedRef.current = { page_url: window.location.href, page_name: document.title };
      setForm({ feedback_type: 'general_feedback', message: '', name: '', email: '', display_name: '', location: '', testimonial_consent: false });
      setSuccess(false);
      setConfirming(false);
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

  const handleReview = (e) => {
    e.preventDefault();
    if (!form.message.trim()) { setError('Please enter your feedback.'); return; }
    if (form.feedback_type === 'testimonial' && !form.testimonial_consent) {
      setError('Please check the box to allow us to share your words.'); return;
    }
    setError('');
    setConfirming(true);
  };

  const handleConfirmSend = async () => {
    setSubmitting(true);
    setError('');
    try {
      await base44.entities.Feedback.create({
        feedback_type: form.feedback_type,
        message: form.message.trim(),
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
        page_url: capturedRef.current.page_url,
        page_name: capturedRef.current.page_name,
        status: 'new',
        ...(form.feedback_type === 'testimonial' ? {
          display_name: form.display_name.trim() || undefined,
          location: form.location.trim() || undefined,
          testimonial_consent: form.testimonial_consent,
        } : {}),
      });
      base44.analytics.track({ eventName: 'feedback_submitted', properties: { feedback_type: form.feedback_type } });
    } catch (err) { console.error('Feedback submit error:', err); }
    setSubmitting(false);
    setSuccess(true);
  };

  return (
    <>
      <style>{`
        .fb-overlay {
          position: fixed; inset: 0; z-index: 10000;
          background-color: rgba(0,0,0,0.5);
          backdrop-filter: blur(3px);
          display: flex; align-items: flex-end; justify-content: flex-end;
          padding: 24px;
        }
        .fb-panel {
          background-color: #FAF7F2;
          border-radius: 16px; padding: 28px 24px;
          width: 100%; max-width: 400px; position: relative;
          box-shadow: 0 20px 60px rgba(0,0,0,0.18);
          max-height: calc(100vh - 48px); overflow-y: auto;
          color: #334155;
        }
        .fb-close-btn {
          position: absolute; top: 12px; right: 12px;
          background: transparent; border: none; cursor: pointer;
          color: #475569; padding: 4px;
          min-width: 44px; min-height: 44px;
          display: flex; align-items: center; justify-content: center;
        }
        .fb-title {
          font-family: Fraunces, Georgia, serif;
          font-size: 1.25rem; font-weight: 700;
          color: #1E293B; margin: 0 0 4px;
        }
        .fb-subtitle {
          font-family: Manrope, sans-serif;
          font-size: 0.85rem; color: #3D4A5C;
          margin: 0 0 20px; line-height: 1.5;
        }
        .fb-form { display: flex; flex-direction: column; gap: 14px; }
        .fb-label {
          font-family: Manrope, sans-serif;
          font-size: 0.8125rem; font-weight: 600;
          color: #334155; display: block; margin-bottom: 4px;
        }
        .fb-optional { color: #434E5E; font-weight: 400; }
        .fb-required { color: #991B1B; }
        .fb-select, .fb-input, .fb-textarea {
          font-family: Manrope, sans-serif; font-size: 0.9rem;
          padding: 10px 12px; border-radius: 8px;
          border: 1px solid #9CA3AF; outline: none;
          width: 100%; box-sizing: border-box;
          background-color: #FFFFFF; color: #334155;
        }
        .fb-select { min-height: 40px; appearance: auto; }
        .fb-textarea { resize: vertical; min-height: 90px; }
        .fb-select:focus, .fb-input:focus, .fb-textarea:focus {
          border-color: #B7501F;
          outline: 2px solid #B7501F;
          outline-offset: -1px;
        }
        .fb-input::placeholder, .fb-textarea::placeholder { color: #6B7280; }
        .fb-error {
          font-family: Manrope, sans-serif;
          font-size: 0.85rem; color: #991B1B; margin: 0;
        }
        .fb-submit-btn {
          font-family: Manrope, sans-serif;
          font-size: 0.9375rem; font-weight: 700;
          background-color: #C2410C; color: #FFFFFF; border: none;
          padding: 12px 20px; border-radius: 10px;
          cursor: pointer; min-height: 44px;
        }
        .fb-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .fb-success-wrap { text-align: center; padding: 16px 0; }
        .fb-success-icon-wrap {
          width: 52px; height: 52px; border-radius: 50%;
          background-color: #F0FDF4;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 14px;
        }
        .fb-success-title {
          font-family: Fraunces, Georgia, serif;
          font-size: 1.2rem; font-weight: 700;
          color: #1E293B; margin: 0 0 6px;
        }
        .fb-success-body {
          font-family: Manrope, sans-serif;
          font-size: 0.9rem; color: #475569;
          margin: 0 0 18px; line-height: 1.5;
        }
        .fb-done-btn {
          font-family: Manrope, sans-serif;
          font-size: 0.9rem; font-weight: 600;
          background-color: #1E293B; color: #FFFFFF; border: none;
          padding: 10px 24px; border-radius: 10px;
          cursor: pointer; min-height: 44px;
        }
      `}</style>
      <div className="fb-overlay" role="dialog" aria-modal="true" aria-label="Submit feedback"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fb-panel">
        <button className="fb-close-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        {!success && !confirming ? (
          <>
            <h2 className="fb-title">Share Your Feedback</h2>
            <p className="fb-subtitle">Help us improve ADA Legal Link.</p>
            <form className="fb-form" onSubmit={handleReview}>
              <div>
                <label className="fb-label" htmlFor="fb-type">Feedback type</label>
                <select id="fb-type" className="fb-select" value={form.feedback_type}
                        onChange={(e) => setForm({ ...form, feedback_type: e.target.value })}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {form.feedback_type === 'testimonial' && (
                <div style={{
                  background: '#FEF3C7', border: '1px solid #F59E0B',
                  borderRadius: '10px', padding: '14px 16px',
                }}>
                  <p style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
                    color: '#92400E', margin: 0, lineHeight: 1.5,
                  }}>
                    Tell us what you liked — with your permission, we may feature your words
                    and first name on our site to help others in the community find this resource.
                  </p>
                </div>
              )}

              <div>
                <label className="fb-label" htmlFor="fb-msg">
                  {form.feedback_type === 'testimonial' ? 'What do you love about it?' : 'Your feedback'}{' '}
                  <span className="fb-required">*</span>
                </label>
                <textarea id="fb-msg" ref={textareaRef} className="fb-textarea" rows={4} value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          placeholder={form.feedback_type === 'testimonial'
                            ? 'e.g. I finally found what I needed without asking for help...'
                            : "What's on your mind?"} />
              </div>

              {form.feedback_type === 'testimonial' ? (
                <>
                  <div>
                    <label className="fb-label" htmlFor="fb-display-name">
                      First name <span className="fb-optional">(as you'd like it to appear)</span>
                    </label>
                    <input id="fb-display-name" type="text" className="fb-input" value={form.display_name}
                           onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                           placeholder="e.g. Maria T." />
                  </div>
                  <div>
                    <label className="fb-label" htmlFor="fb-location">
                      Location <span className="fb-optional">(optional)</span>
                    </label>
                    <input id="fb-location" type="text" className="fb-input" value={form.location}
                           onChange={(e) => setForm({ ...form, location: e.target.value })}
                           placeholder="e.g. Phoenix, AZ" />
                  </div>
                  <div>
                    <label className="fb-label" htmlFor="fb-email">Email <span className="fb-optional">(optional — in case we'd like to follow up)</span></label>
                    <input id="fb-email" type="email" className="fb-input" value={form.email}
                           onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <input
                      id="fb-consent"
                      type="checkbox"
                      checked={form.testimonial_consent}
                      onChange={(e) => setForm({ ...form, testimonial_consent: e.target.checked })}
                      style={{ marginTop: '3px', width: '18px', height: '18px', flexShrink: 0, accentColor: '#C2410C' }}
                    />
                    <label htmlFor="fb-consent" style={{
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                      color: '#475569', lineHeight: 1.5, cursor: 'pointer',
                    }}>
                      By submitting, you're okay with us featuring your words and name on our site to help
                      others in the community.
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="fb-label" htmlFor="fb-name">Name <span className="fb-optional">(optional)</span></label>
                    <input id="fb-name" type="text" className="fb-input" value={form.name}
                           onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
                  </div>
                  <div>
                    <label className="fb-label" htmlFor="fb-email">Email <span className="fb-optional">(optional)</span></label>
                    <input id="fb-email" type="email" className="fb-input" value={form.email}
                           onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" />
                  </div>
                </>
              )}

              {error && <p className="fb-error">{error}</p>}
              <button type="submit" className="fb-submit-btn" disabled={submitting}>
                Review &amp; Send
              </button>
            </form>
          </>
        ) : confirming && !success ? (
          <>
            <h2 className="fb-title">Confirm Your Feedback</h2>
            <p className="fb-subtitle">Please review before sending.</p>
            <div style={{ marginBottom: '14px' }}>
              <p className="fb-label">Type</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#334155', margin: '2px 0 10px' }}>
                {TYPES.find(t => t.value === form.feedback_type)?.label}
              </p>
              <p className="fb-label">{form.feedback_type === 'testimonial' ? 'Your words' : 'Message'}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#334155', margin: '2px 0 10px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {form.message}
              </p>
              {form.feedback_type === 'testimonial' ? (
                <>
                  {form.display_name && <>
                    <p className="fb-label">Display name</p>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#334155', margin: '2px 0 10px' }}>{form.display_name}</p>
                  </>}
                  {form.location && <>
                    <p className="fb-label">Location</p>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#334155', margin: '2px 0 10px' }}>{form.location}</p>
                  </>}
                  {form.email && <>
                    <p className="fb-label">Email</p>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#334155', margin: '2px 0 10px' }}>{form.email}</p>
                  </>}
                  <p style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
                    color: '#16A34A', margin: '10px 0 0', fontWeight: 600,
                  }}>✓ You've agreed to let us feature your words on our site.</p>
                </>
              ) : (
                <>
                  {form.name && <>
                    <p className="fb-label">Name</p>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#334155', margin: '2px 0 10px' }}>{form.name}</p>
                  </>}
                  {form.email && <>
                    <p className="fb-label">Email</p>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#334155', margin: '2px 0 10px' }}>{form.email}</p>
                  </>}
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="fb-done-btn" onClick={() => setConfirming(false)} style={{ flex: 1 }}>
                Go Back
              </button>
              <button type="button" className="fb-submit-btn" onClick={handleConfirmSend} disabled={submitting} style={{ flex: 1 }}>
                {submitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <div className="fb-success-wrap">
            <div className="fb-success-icon-wrap"><CheckCircle size={26} color="#16A34A" /></div>
            <h2 className="fb-success-title">
              {form.feedback_type === 'testimonial' ? 'You made our day!' : 'Thank you!'}
            </h2>
            <p className="fb-success-body">
              {form.feedback_type === 'testimonial'
                ? "Your words mean the world to us. We'll review and may feature them to help others find this resource."
                : 'Your feedback helps us build a better platform.'}
            </p>
            <button className="fb-done-btn" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}