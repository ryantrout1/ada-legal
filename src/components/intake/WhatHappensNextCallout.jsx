import React from 'react';
import { createPageUrl } from '../../utils';

export default function WhatHappensNextCallout() {
  return (
    <div style={{
      backgroundColor: '#FFFBF7', borderLeft: '3px solid var(--terra-600)',
      borderRadius: '0 8px 8px 0', padding: 'var(--space-md) var(--space-lg)',
      marginBottom: 'var(--space-lg)', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto',
      textAlign: 'left'
    }}>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
        color: 'var(--slate-900)', margin: '0 0 8px'
      }}>
        What Happens Next
      </p>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
        color: 'var(--slate-600)', lineHeight: 1.65, margin: 0
      }}>
        Your report will be reviewed by our team. If it meets our criteria, it will be shared with ADA attorneys in our network who may reach out to discuss your case. Not every report results in attorney representation, but we'll keep you updated on your case status. In the meantime, visit our <a href={createPageUrl('StandardsGuide')} style={{ color: 'var(--terra-600)', fontWeight: 600 }}>ADA Standards Guide</a> to learn more about your rights and the steps you can take on your own.
      </p>
    </div>
  );
}