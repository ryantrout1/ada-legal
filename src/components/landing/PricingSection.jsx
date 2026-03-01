import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Check, ArrowRight } from 'lucide-react';

const features = [
  'Access to all pre-screened ADA cases in your state',
  'Exclusive case assignment — no bidding',
  'Real-time case notifications',
  'Full reporter details upon assignment',
  'Dedicated attorney dashboard',
  'Cancel anytime'
];

export default function PricingSection() {
  return (
    <section style={{
      maxWidth: '600px', margin: '0 auto',
      padding: 'clamp(3rem, 8vw, 5rem) 1.5rem'
    }}>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
        fontWeight: 700, textAlign: 'center', color: 'var(--slate-900)',
        marginBottom: '0.75rem', marginTop: 0
      }}>
        Simple, Transparent Pricing
      </h2>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
        color: 'var(--slate-600)', textAlign: 'center',
        maxWidth: '400px', margin: '0 auto clamp(2rem, 5vw, 2.5rem)'
      }}>
        One plan, everything included.
      </p>

      <div style={{
        backgroundColor: 'var(--surface)',
        border: '2px solid var(--slate-900)',
        borderRadius: '16px',
        padding: '2.5rem 2rem',
        textAlign: 'center'
      }}>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
          color: 'var(--terra-600)', textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: '0.5rem', marginTop: 0
        }}>
          Platform Access
        </p>

        <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
          {features.map(f => (
            <div key={f} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              marginBottom: '0.75rem'
            }}>
              <Check size={18} style={{ color: 'var(--success-600)', flexShrink: 0 }} />
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                color: 'var(--slate-700)'
              }}>{f}</span>
            </div>
          ))}
        </div>

        <Link
          to={createPageUrl('LawyerRegister')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.625rem',
            background: 'var(--terra-600)', color: 'white',
            padding: '0.875rem 2.5rem', borderRadius: 'var(--radius-md)',
            fontSize: '1rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif',
            textDecoration: 'none', minHeight: '48px',
            transition: 'background 0.15s',
            width: '100%', justifyContent: 'center', boxSizing: 'border-box'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--terra-700)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--terra-600)'}
        >
          Apply Now <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}