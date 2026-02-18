import React, { useState } from 'react';
import { Copy, Check, Mail } from 'lucide-react';

export default function CaseHelpCard({ caseId }) {
  const [copied, setCopied] = useState(false);
  const shortId = caseId?.slice(0, 8) || caseId;

  const handleCopy = () => {
    navigator.clipboard.writeText(caseId || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      backgroundColor: 'var(--slate-900)', borderRadius: '12px', padding: '24px',
      color: 'white'
    }}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 600, color: 'white', margin: '0 0 8px' }}>
        Questions about your case?
      </h2>
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--slate-300)', margin: '0 0 16px', lineHeight: 1.5 }}>
        Our team is here to help. Reference your case number when contacting us.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, color: 'white',
          backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px 14px', borderRadius: '8px'
        }}>
          Case #{shortId}
        </span>
        <button type="button" onClick={handleCopy} style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '0 12px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
          fontWeight: 600, color: 'var(--slate-300)',
          backgroundColor: 'rgba(255,255,255,0.1)', border: 'none',
          borderRadius: '8px', cursor: 'pointer', minHeight: '36px'
        }}>
          {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
        </button>
      </div>
      <a
        href={`mailto:support@adalegalconnect.com?subject=Case%20${encodeURIComponent(caseId || '')}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '0 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
          fontWeight: 700, color: 'white', backgroundColor: 'var(--terra-600)',
          borderRadius: '10px', textDecoration: 'none', minHeight: '44px',
          transition: 'background-color 0.15s'
        }}
      >
        <Mail size={16} /> Email Support
      </a>
    </div>
  );
}