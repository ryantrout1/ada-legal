import React from 'react';
import { createPageUrl } from '../../utils';

export default function WhatHappensNextCallout() {
  return (
    <div style={{
      backgroundColor: '#FFFBF7', borderLeft: '3px solid var(--section-label)',
      borderRadius: '0 8px 8px 0', padding: 'var(--space-md) var(--space-lg)',
      marginBottom: 'var(--space-lg)', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto',
      textAlign: 'left'
    }}>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
        color: 'var(--heading)', margin: '0 0 12px'
      }}>
        What Happens Next
      </p>

      <div style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
        color: 'var(--body)', lineHeight: 1.65
      }}>
        <p style={{ margin: '0 0 10px' }}>
          <strong style={{ color: 'var(--heading)' }}>1. Review</strong> — Our team reviews your report to make sure it has enough detail for an attorney to evaluate.
        </p>
        <p style={{ margin: '0 0 10px' }}>
          <strong style={{ color: 'var(--heading)' }}>2. Shared with attorneys</strong> — If your report meets our criteria, it will be shared with ADA attorneys in our network.
        </p>
        <p style={{ margin: '0 0 10px' }}>
          <strong style={{ color: 'var(--heading)' }}>3. Attorney contact</strong> — An attorney who is interested in your case may reach out to discuss next steps.
        </p>

        <div style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: '8px', padding: '12px 14px', marginTop: '14px'
        }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            color: 'var(--body-secondary)', lineHeight: 1.6, margin: 0
          }}>
            <strong style={{ color: 'var(--body)' }}>Please know:</strong> Submitting a report does not guarantee attorney representation. Not every case is picked up, and there is no attorney-client relationship until an attorney contacts you directly. We will keep you updated on your case status regardless of outcome.
          </p>
        </div>

        <p style={{ margin: '14px 0 0' }}>
          In the meantime, visit our{' '}
          <a href={createPageUrl('StandardsGuide')} style={{ color: 'var(--section-label)', fontWeight: 600 }}>
            ADA Standards Guide
          </a>{' '}
          to learn more about your rights and the steps you can take on your own.
        </p>
      </div>
    </div>
  );
}
