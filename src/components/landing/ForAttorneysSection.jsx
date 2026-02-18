import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { ArrowRight, Briefcase, Shield, TrendingUp } from 'lucide-react';

const props = [
  { icon: Briefcase, text: 'Access pre-qualified ADA cases in your jurisdiction' },
  { icon: Shield, text: 'Exclusive case assignment — no bidding wars' },
  { icon: TrendingUp, text: 'Grow your ADA practice with a steady pipeline' }
];

export default function ForAttorneysSection() {
  return (
    <section style={{
      backgroundColor: 'var(--surface)',
      padding: 'clamp(3rem, 8vw, 5rem) 1.5rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
          fontWeight: 700, color: 'var(--slate-900)',
          marginBottom: '0.75rem', marginTop: 0
        }}>
          For Attorneys
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
          color: 'var(--slate-600)', lineHeight: 1.6,
          maxWidth: '520px', margin: '0 auto clamp(2rem, 5vw, 2.5rem)'
        }}>
          Join a marketplace built for ADA practitioners. Get matched with real clients who need your help.
        </p>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: '1rem',
          alignItems: 'center', marginBottom: '2rem'
        }}>
          {props.map(p => {
            const Icon = p.icon;
            return (
              <div key={p.text} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
                color: 'var(--slate-700)'
              }}>
                <Icon size={20} aria-hidden="true" style={{ color: 'var(--terra-600)', flexShrink: 0 }} />
                <span>{p.text}</span>
              </div>
            );
          })}
        </div>

        <Link
          to={createPageUrl('LawyerLanding')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
            color: 'var(--terra-600)', textDecoration: 'none',
            padding: '0.75rem 1.5rem', border: '2px solid var(--terra-600)',
            borderRadius: 'var(--radius-md)', minHeight: '48px',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--terra-50)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          Learn More <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}