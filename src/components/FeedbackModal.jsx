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
  );
}