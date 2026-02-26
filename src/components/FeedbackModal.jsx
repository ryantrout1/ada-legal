import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { X, CheckCircle } from 'lucide-react';

const TYPES = [
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'question', label: 'Question' },
  { value: 'general_feedback', label: 'General Feedback' },
];

/**
 * Force light-theme inline styles via JS DOM manipulation.
 * element.style.setProperty(prop, val, 'important') creates
 * inline !important which beats ALL stylesheet rules regardless
 * of specificity — this is the nuclear option that bypasses
 * dark mode / high contrast CSS entirely.
 */
function forceStyles(el, styles) {
  if (!el) return;
  Object.entries(styles).forEach(([prop, val]) => {
    el.style.setProperty(prop, val, 'important');
  });
}

function useForceLightTheme(panelRef, isOpen) {
  const applyStyles = useCallback(() => {
    const panel = panelRef.current;
    if (!panel || !isOpen) return;

    // Panel container
    forceStyles(panel, {
      'background-color': '#FAF7F2',
      'background-image': 'none',
      'color': '#334155',
      'border': 'none',
    });

    // All child divs
    panel.querySelectorAll('div').forEach(el => {
      forceStyles(el, {
        'background-color': 'transparent',
        'background-image': 'none',
        'border': 'none',
      });
    });

    // Form
    panel.querySelectorAll('form').forEach(el => {
      forceStyles(el, {
        'background-color': 'transparent',
        'background-image': 'none',
      });
    });

    // Headings
    panel.querySelectorAll('h2, h3').forEach(el => {
      forceStyles(el, { 'color': '#1E293B' });
    });

    // Paragraphs
    panel.querySelectorAll('p').forEach(el => {
      if (el.classList.contains('fb-error-msg')) {
        forceStyles(el, { 'color': '#DC2626' });
      } else if (el.classList.contains('fb-success-body')) {
        forceStyles(el, { 'color': '#475569' });
      } else {
        forceStyles(el, { 'color': '#586577' });
      }
    });

    // Labels
    panel.querySelectorAll('label').forEach(el => {
      forceStyles(el, { 'color': '#334155' });
    });

    // Spans
    panel.querySelectorAll('span').forEach(el => {
      if (el.classList.contains('fb-optional')) {
        forceStyles(el, { 'color': '#94A3B8' });
      } else if (el.classList.contains('fb-required')) {
        forceStyles(el, { 'color': '#DC2626' });
      } else {
        forceStyles(el, { 'color': '#334155' });
      }
    });

    // Inputs, textareas, selects
    panel.querySelectorAll('input, textarea, select').forEach(el => {
      forceStyles(el, {
        'background-color': '#FFFFFF',
        'background-image': 'none',
        'color': '#334155',
        'border': '1px solid #D1D5DB',
      });
    });

    // Options
    panel.querySelectorAll('option').forEach(el => {
      forceStyles(el, {
        'background-color': '#FFFFFF',
        'color': '#334155',
      });
    });

    // Close button
    panel.querySelectorAll('button.fb-close-btn').forEach(el => {
      forceStyles(el, {
        'color': '#475569',
        'background-color': 'transparent',
        'border': 'none',
      });
    });

    // Submit button
    panel.querySelectorAll('button.fb-submit-btn').forEach(el => {
      forceStyles(el, {
        'background-color': '#C2410C',
        'color': '#FFFFFF',
        'border': 'none',
      });
    });

    // Done button
    panel.querySelectorAll('button.fb-done-btn').forEach(el => {
      forceStyles(el, {
        'background-color': '#1E293B',
        'color': '#FFFFFF',
        'border': 'none',
      });
    });

    // Success icon container
    panel.querySelectorAll('div.fb-success-icon').forEach(el => {
      forceStyles(el, { 'background-color': '#F0FDF4' });
    });

  }, [panelRef, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    // Apply immediately
    const t1 = setTimeout(applyStyles, 0);
    // Re-apply after a short delay to catch any async CSS injection
    const t2 = setTimeout(applyStyles, 50);
    const t3 = setTimeout(applyStyles, 200);

    // Also observe for attribute changes (in case DisplaySettings re-applies)
    const panel = panelRef.current;
    let observer;
    if (panel && typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver(() => {
        applyStyles();
      });
      observer.observe(panel, {
        attributes: true,
        attributeFilter: ['style', 'class'],
        subtree: true,
      });
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (observer) observer.disconnect();
    };
  }, [isOpen, applyStyles]);
}

export default function FeedbackModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ feedback_type: 'general_feedback', message: '', name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const capturedRef = useRef({ page_url: '', page_name: '' });
  const textareaRef = useRef(null);
  const panelRef = useRef(null);

  // Force light theme via JS DOM manipulation — bypasses all CSS
  useForceLightTheme(panelRef, isOpen);

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
        ref={panelRef}
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
              color: '#586577', margin: '0 0 20px', lineHeight: 1.5,
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
  );
}
