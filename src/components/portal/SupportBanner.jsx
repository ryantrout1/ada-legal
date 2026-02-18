import React from 'react';
import { Mail } from 'lucide-react';

export default function SupportBanner() {
  return (
    <div style={{
      backgroundColor: 'var(--slate-50)', border: '1px solid var(--slate-200)',
      borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      flexWrap: 'wrap', marginTop: 'var(--space-xl)'
    }}>
      <Mail size={18} aria-hidden="true" style={{ color: 'var(--slate-500)', flexShrink: 0 }} />
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
        color: 'var(--slate-600)', margin: 0, lineHeight: 1.5
      }}>
        Questions about your case? Contact us at{' '}
        <a
          href="mailto:support@adalegalmarketplace.com"
          style={{ color: 'var(--terra-600)', fontWeight: 600, textDecoration: 'underline' }}
        >
          support@adalegalmarketplace.com
        </a>
      </p>
    </div>
  );
}