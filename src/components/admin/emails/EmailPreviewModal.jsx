import React, { useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export default function EmailPreviewModal({ subject, bodyHtml, sampleData, onClose }) {
  const iframeRef = useRef(null);

  const replaceVars = (text) => {
    let result = text;
    for (const [key, value] of Object.entries(sampleData)) {
      result = result.split(`{{${key}}}`).join(value);
    }
    return result;
  };

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const write = () => {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      doc.open();
      doc.write(replaceVars(bodyHtml));
      doc.close();
    };
    // Write once the iframe is ready
    if (iframe.contentDocument?.readyState === 'complete' || iframe.contentDocument?.readyState === 'interactive') {
      write();
    } else {
      iframe.addEventListener('load', write, { once: true });
    }
  }, [bodyHtml]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Email preview"
        style={{
          backgroundColor: 'white', borderRadius: '12px',
          width: '100%', maxWidth: '720px', maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
        }}>
          <div>
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
              color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Email Preview
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#94A3B8', padding: '4px', display: 'flex',
              minWidth: '32px', minHeight: '32px', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Subject bar */}
        <div style={{
          padding: '12px 20px', borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#FAFAFA',
        }}>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#64748B',
          }}>Subject: </span>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-900)',
          }}>
            {replaceVars(subject)}
          </span>
        </div>

        {/* Email body iframe */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '0' }}>
          <iframe
            ref={iframeRef}
            title="Full email preview"
            srcDoc="<html><body></body></html>"
            style={{
              width: '100%', height: '100%', minHeight: '500px',
              border: 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
}