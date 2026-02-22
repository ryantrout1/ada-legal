import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Info, ChevronRight } from 'lucide-react';

export default function BreadcrumbAndInfo() {
  return (
    <div style={{
      background: '#FAF7F2',
      padding: '60px 40px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '24px' }}>
          <ol style={{
            listStyle: 'none', display: 'flex', alignItems: 'center', gap: '8px',
            margin: 0, padding: 0, fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem'
          }}>
            <li>
              <Link to={createPageUrl('Home')} style={{
                color: 'var(--terra-600)', textDecoration: 'none'
              }}>
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={14} style={{ color: '#94A3B8' }} />
            </li>
            <li>
              <span aria-current="page" style={{ color: 'var(--slate-600)' }}>
                ADA Standards Guide
              </span>
            </li>
          </ol>
        </nav>

        {/* Info callout */}
        <div style={{
          background: 'white',
          border: '1px solid var(--slate-200)',
          borderRadius: '16px',
          borderLeft: '3px solid #C2410C',
          padding: '24px 28px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--terra-100)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Info size={18} style={{ color: '#C2410C' }} aria-hidden="true" />
          </div>
          <div>
            <p style={{
              fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700,
              color: 'var(--slate-900)', margin: '0 0 6px'
            }}>
              About This Guide
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              color: 'var(--slate-600)', lineHeight: 1.6, margin: 0
            }}>
              This guide presents the official 2010 ADA Standards for Accessible
              Design with plain-language explanations. All citations reference ADA.gov.
              For legal advice,{' '}
              <Link to={createPageUrl('Intake')} style={{
                color: 'var(--terra-600)', fontWeight: 600, textDecoration: 'none'
              }}>
                connect with an ADA attorney
              </Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}