import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CaseIdDisplay({ caseId }) {
  const [copied, setCopied] = useState(false);

  if (!caseId) return null;

  const shortId = caseId;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shortId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      backgroundColor: '#F0FDF4', border: '2px solid #BBF7D0',
      borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)',
      textAlign: 'center', marginBottom: 'var(--space-xl)'
    }}>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
        color: '#065F46', margin: '0 0 0.5rem 0', textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Your Reference Number
      </p>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '0.75rem', flexWrap: 'wrap'
      }}>
        <code style={{
          fontFamily: 'monospace', fontSize: 'clamp(1.125rem, 3vw, 1.5rem)', fontWeight: 700,
          color: 'var(--heading)', backgroundColor: 'white',
          padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)', userSelect: 'all',
          wordBreak: 'break-all'
        }}>
          {shortId}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy reference number'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 0.875rem', fontFamily: 'Manrope, sans-serif',
            fontSize: '0.8125rem', fontWeight: 700,
            color: copied ? '#065F46' : 'var(--body)',
            backgroundColor: copied ? '#DCFCE7' : 'white',
            border: '1px solid', borderColor: copied ? '#86EFAC' : 'var(--border)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            minHeight: '40px', transition: 'all 0.15s'
          }}
        >
          {copied
            ? <><Check size={14} aria-hidden="true" /> Copied</>
            : <><Copy size={14} aria-hidden="true" /> Copy</>
          }
        </button>
      </div>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
        color: '#065F46', margin: '0.75rem 0 0 0', lineHeight: 1.5
      }}>
        Save this number for your records.
      </p>
    </div>
  );
}