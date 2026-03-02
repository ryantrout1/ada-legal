import React from 'react';
import { Mail } from 'lucide-react';

export default function SupportBanner() {
  return (
    <div style={{
      backgroundColor: 'var(--page-bg-subtle)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)',
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      flexWrap: 'wrap', marginTop: 'var(--space-xl)'
    }}>
      <Mail size={18} aria-hidden="true" style={{ color: 'var(--body)', flexShrink: 0 }} />
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
        color: 'var(--body)', margin: 0, lineHeight: 1.5
      }}>
        Questions about your case? Contact us at{' '}
        <a
          href="mailto:support@adalegalconnect.com"
          style={{ color: 'var(--section-label)', fontWeight: 600, textDecoration: 'underline' }}
        >
          support@adalegalconnect.com
        </a>
      </p>
    </div>
  );
}