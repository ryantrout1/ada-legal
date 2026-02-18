import React from 'react';
import { CreditCard, Mail } from 'lucide-react';

const subColors = {
  inactive: { bg: '#F1F5F9', text: '#475569' },
  active: { bg: '#DCFCE7', text: '#15803D' },
  canceled: { bg: '#FEE2E2', text: '#B91C1C' },
  past_due: { bg: '#FEF3C7', text: '#92400E' }
};

export default function BillingCard({ profile }) {
  const sc = subColors[profile.subscription_status] || subColors.inactive;

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: '12px', padding: '24px'
    }}>
      <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.125rem', fontWeight: 600, color: 'var(--slate-900)', margin: '0 0 16px' }}>
        Billing & Subscription
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <CreditCard size={18} style={{ color: 'var(--slate-400)' }} />
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)' }}>
          Subscription Status:
        </span>
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: '9999px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
          backgroundColor: sc.bg, color: sc.text, textTransform: 'uppercase'
        }}>{(profile.subscription_status || 'inactive').replace(/_/g, ' ')}</span>
      </div>
      {profile.subscription_status === 'active' && (
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)', margin: '0 0 12px' }}>
          <strong>Professional</strong> — $499/month
        </p>
      )}
      <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-500)', margin: '0 0 12px', lineHeight: 1.6 }}>
        Billing management coming soon. Contact support for subscription changes.
      </p>
      <a href="mailto:support@adalegalconnect.com" style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600,
        color: 'var(--terra-600)', textDecoration: 'none'
      }}>
        <Mail size={14} /> support@adalegalconnect.com
      </a>
    </div>
  );
}