import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';

const TYPES = [
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'question', label: 'Question' },
  { value: 'general_feedback', label: 'General Feedback' },
];

/*
 * ALL styles live inside Shadow DOM — completely isolated from
 * DisplaySettings, dark mode, high contrast, or any other page CSS.
 * Nothing from outside can reach in. This is the only bulletproof fix.
 */
const SHADOW_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .fb-overlay {
    position: fixed; inset: 0; z-index: 10000;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(3px);
    display: flex; align-items: flex-end; justify-content: flex-end;
    padding: 24px;
    font-family: Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
  .fb-panel {
    background: #FAF7F2; border-radius: 16px; padding: 28px 24px;
    width: 100%; max-width: 400px; position: relative;
    box-shadow: 0 20px 60px rgba(0,0,0,0.18);
    max-height: calc(100vh - 48px); overflow-y: auto;
    color: #334155;
  }
  .fb-close {
    position: absolute; top: 12px; right: 12px;
    background: transparent; border: none; cursor: pointer;
    color: #475569; padding: 4px; min-width: 36px; min-height: 36px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; line-height: 1;
  }
  .fb-close:hover { color: #1E293B; }
  .fb-title {
    font-family: Fraunces, Georgia, serif;
    font-size: 1.25rem; font-weight: 700; color: #1E293B;
    margin: 0 0 4px;
  }
  .fb-subtitle {
    font-size: 0.85rem; color: #586577;
    margin: 0 0 20px; line-height: 1.5;
  }
  .fb-form { display: flex; flex-direction: column; gap: 14px; }
  .fb-label {
    font-size: 0.8125rem; font-weight: 600; color: #334155;
    display: block; margin-bottom: 4px;
  }
  .fb-optional { color: #94A3B8; font-weight: 400; }
  .fb-required { color: #DC2626; }
  .fb-input, .fb-textarea, .fb-select {
    font-family: Manrope, sans-serif; font-size: 0.9rem;
    padding: 10px 12px; border-radius: 8px;
    border: 1px solid #D1D5DB; outline: none;
    width: 100%; background: #FFFFFF; color: #334155;
  }
  .fb-input:focus, .fb-textarea:focus, .fb-select:focus {
    border-color: #C75B2B; outline: 2px solid #C75B2B; outline-offset: -1px;
  }
  .fb-input::placeholder, .fb-textarea::placeholder { color: #9CA3AF; }
  .fb-select { min-height: 40px; appearance: auto; }
  .fb-textarea { resize: vertical; min-height: 90px; }
  .fb-error { font-size: 0.85rem; color: #DC2626; }
  .fb-submit {
    font-family: Manrope, sans-serif; font-size: 0.9375rem; font-weight: 700;
    background: #C2410C; color: #FFFFFF; border: none;
    padding: 12px 20px; border-radius: 10px; cursor: pointer;
    min-height: 44px; transition: opacity 0.15s;
  }
  .fb-submit:hover { opacity: 0.9; }
  .fb-submit:disabled { opacity: 0.7; cursor: not-allowed; }
  .fb-success { text-align: center; padding: 16px 0; }
  .fb-success-icon {
    width: 52px; height: 52px; border-radius: 50%; background: #F0FDF4;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 14px;
  }
  .fb-success-icon svg { color: #16A34A; }
  .fb-success-title {
    font-family: Fraunces, Georgia, serif;
    font-size: 1.2rem; font-weight: 700; color: #1E293B;
    margin: 0 0 6px;
  }
  .fb-success-body {
    font-size: 0.9rem; color: #475569;
    margin: 0 0 18px; line-height: 1.5;
  }
  .fb-done {
    font-family: Manrope, sans-serif; font-size: 0.9rem; font-weight: 600;
    background: #1E293B; color: #FFFFFF; border: none;
    padding: 10px 24px; border-radius: 10px; cursor: pointer; min-height: 44px;
  }
  .fb-done:hover { opacity: 0.9; }
`;

const X_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;

function ShadowHost({ children, isOpen }) {
  const hostRef = useRef(null);
  const shadowRef = useRef(null);
  const mountRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hostRef.current || shadowRef.current) return;
    const shadow = hostRef.current.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = SHADOW_CSS;
    shadow.appendChild(style);
    const mount = document.createElement('div');
    shadow.appendChild(mount);
    shadowRef.current = shadow;
    mountRef.current = mount;
    setReady(true);
  }, []);

  return (
    <div ref={hostRef} style={{ display: isOpen ? 'contents' : 'none' }}>
      {ready && mountRef.current && createPortal(children, mountRef.current)}
    </div>
  );
}

export default function FeedbackModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ feedback_type: 'general_feedback', message: '', name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const capturedPage = useRef({ url: '', name: '' });

  useEffect(() => {
    if (isOpen) {
      capturedPage.current = { url: window.location.href, name: document.title };
      setForm({ feedback_type: 'general_feedback', message: '', name: '', email: '' });
      setSuccess(false);
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!form.message.trim()) { setError('Please enter your feedback.'); return; }
    setSubmitting(true);
    setError('');
    try {
      await base44.entities.Feedback.create({
        feedback_type: form.feedback_type,
        message: form.message.trim(),
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
        page_url: capturedPage.current.url,
        page_name: capturedPage.current.name,
        status: 'new',
      });
      base44.analytics.track({ eventName: 'feedback_submitted', properties: { feedback_type: form.feedback_type } });
    } catch (err) {
      console.error('Feedback submit error', err);
    }
    setSubmitting(false);
    setSuccess(true);
  };

  return (
    <ShadowHost isOpen={isOpen}>
      {isOpen && (
        <div className="fb-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
             role="dialog" aria-modal="true" aria-label="Submit feedback">
          <div className="fb-panel">
            <button className="fb-close" onClick={onClose} aria-label="Close"
                    dangerouslySetInnerHTML={{ __html: X_SVG }} />

            {!success ? (
              <>
                <h2 className="fb-title">Share Your Feedback</h2>
                <p className="fb-subtitle">Help us improve ADA Legal Link.</p>
                <div className="fb-form">
                  <div>
                    <label className="fb-label" htmlFor="fb-type">Feedback type</label>
                    <select id="fb-type" className="fb-select" value={form.feedback_type}
                            onChange={(e) => setForm({ ...form, feedback_type: e.target.value })}>
                      {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="fb-label" htmlFor="fb-msg">
                      Your feedback <span className="fb-required">*</span>
                    </label>
                    <textarea id="fb-msg" className="fb-textarea" rows={4} value={form.message}
                              onChange={(e) => setForm({ ...form, message: e.target.value })}
                              placeholder="What's on your mind?" autoFocus />
                  </div>
                  <div>
                    <label className="fb-label" htmlFor="fb-name">
                      Name <span className="fb-optional">(optional)</span>
                    </label>
                    <input id="fb-name" type="text" className="fb-input" value={form.name}
                           onChange={(e) => setForm({ ...form, name: e.target.value })}
                           placeholder="Your name" />
                  </div>
                  <div>
                    <label className="fb-label" htmlFor="fb-email">
                      Email <span className="fb-optional">(optional)</span>
                    </label>
                    <input id="fb-email" type="email" className="fb-input" value={form.email}
                           onChange={(e) => setForm({ ...form, email: e.target.value })}
                           placeholder="your@email.com" />
                  </div>
                  {error && <p className="fb-error">{error}</p>}
                  <button className="fb-submit" disabled={submitting}
                          onClick={handleSubmit} type="button">
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                </div>
              </>
            ) : (
              <div className="fb-success">
                <div className="fb-success-icon" dangerouslySetInnerHTML={{ __html: CHECK_SVG }} />
                <h2 className="fb-success-title">Thank you!</h2>
                <p className="fb-success-body">Your feedback helps us build a better platform.</p>
                <button className="fb-done" onClick={onClose}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}
    </ShadowHost>
  );
}
