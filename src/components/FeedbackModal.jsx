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
      capturedRef.current = { page_url: window.location.href, page_name: document.title };
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
    if (!form.message.trim()) { setError('Please enter your feedback.'); return; }
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
          min-width: 36px; min-height: 36px;
          display: flex; align-items: center; justify-content: center;
        }
        .fb-title {
          font-family: Fraunces, Georgia, serif;
          font-size: 1.25rem; font-weight: 700;
          color: #1E293B; margin: 0 0 4px;
        }
        .fb-subtitle {
          font-family: Manrope, sans-serif;
          font-size: 0.85rem; color: #586577;
          margin: 0 0 20px; line-height: 1.5;
        }
        .fb-form { display: flex; flex-direction: column; gap: 14px; }
        .fb-label {
          font-family: Manrope, sans-serif;
          font-size: 0.8125rem; font-weight: 600;
          color: #334155; display: block; margin-bottom: 4px;
        }
        .fb-optional { color: #5E6B7C; font-weight: 400; }
        .fb-required { color: #DC2626; }
        .fb-select, .fb-input, .fb-textarea {
          font-family: Manrope, sans-serif; font-size: 0.9rem;
          padding: 10px 12px; border-radius: 8px;
          border: 1px solid #D1D5DB; outline: none;
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
          font-size: 0.85rem; color: #DC2626; margin: 0;
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
        {!success ? (
          <>
            <h2 className="fb-title">Share Your Feedback</h2>
            <p className="fb-subtitle">Help us improve ADA Legal Link.</p>
            <form className="fb-form" onSubmit={handleSubmit}>
              <div>
                <label className="fb-label" htmlFor="fb-type">Feedback type</label>
                <select id="fb-type" className="fb-select" value={form.feedback_type}
                        onChange={(e) => setForm({ ...form, feedback_type: e.target.value })}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="fb-label" htmlFor="fb-msg">Your feedback <span className="fb-required">*</span></label>
                <textarea id="fb-msg" ref={textareaRef} className="fb-textarea" rows={4} value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="What's on your mind?" />
              </div>
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
              {error && <p className="fb-error">{error}</p>}
              <button type="submit" className="fb-submit-btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </>
        ) : (
          <div className="fb-success-wrap">
            <div className="fb-success-icon-wrap"><CheckCircle size={26} color="#16A34A" /></div>
            <h2 className="fb-success-title">Thank you!</h2>
            <p className="fb-success-body">Your feedback helps us build a better platform.</p>
            <button className="fb-done-btn" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}