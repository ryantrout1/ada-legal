/**
 * BreadcrumbAndInfo — ported from Base44 (src/components/standards/BreadcrumbAndInfo.jsx
 * @ 6b1e9ac) for M2 Phase 3. Design authority is B44; the changes here
 * are confined to the port seams:
 *   - Base44 flat routing (createPageUrl) → b44PageToRoute
 *   - Base44 SDK / analytics imports removed (M5)
 * Visual output is unchanged; tokens resolve through the alias layer in
 * app.css at the AAA-corrected values.
 */

import { b44PageToRoute } from './b44PageToRoute.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { Info, ChevronRight } from 'lucide-react';

export default function BreadcrumbAndInfo() {
  return (
    <div style={{
      background: 'var(--page-bg-alt)',
      padding: 'clamp(32px, 6vw, 60px) clamp(16px, 4vw, 40px)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: '24px' }}>
          <ol style={{
            listStyle: 'none', display: 'flex', alignItems: 'center', gap: '8px',
            margin: 0, padding: 0, fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem'
          }}>
            <li>
              <Link to={b44PageToRoute('HomeV2') ?? '/'} className="sg-cta-link" style={{
                color: 'var(--link)', textDecoration: 'none', minHeight: '44px',
                display: 'inline-flex', alignItems: 'center'
              }}>
                Home
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight size={14} style={{ color: 'var(--body-secondary)' }} />
            </li>
            <li>
              <span aria-current="page" style={{ color: 'var(--body)' }}>
                ADA Standards Guide
              </span>
            </li>
          </ol>
        </nav>

        {/* Info callout */}
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          borderLeft: '3px solid var(--accent)',
          padding: '24px 28px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--card-bg-tinted)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Info size={18} style={{ color: 'var(--section-label)' }} aria-hidden="true" />
          </div>
          <div>
            <p style={{
              fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700,
              color: 'var(--heading)', margin: '0 0 6px'
            }}>
              About This Guide
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              color: 'var(--body)', lineHeight: 1.6, margin: 0
            }}>
              This guide presents the official 2010 ADA Standards for Accessible
              Design with plain-language explanations. All citations reference ADA.gov.
              For legal advice,{' '}
              <Link to={b44PageToRoute('Intake') ?? '/chat'} className="sg-cta-link" style={{
                color: 'var(--link)', fontWeight: 600, textDecoration: 'none'
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
