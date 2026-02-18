import React from 'react';
import { Phone, Mail } from 'lucide-react';

export default function ClaimantContactCard({ caseData, urgent }) {
  const c = caseData;
  const prefersPhone = c.contact_preference === 'phone';
  const prefersEmail = c.contact_preference === 'email';
  const prefLabel = prefersPhone ? 'PREFERS PHONE' : prefersEmail ? 'PREFERS EMAIL' : 'NO PREFERENCE';

  return (
    <div style={{
      backgroundColor: urgent ? '#FEF3C7' : 'var(--slate-50)',
      borderRadius: '10px', padding: '16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      flexWrap: 'wrap', gap: '12px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
          {c.contact_name}
        </span>
        {/* Show preferred method larger */}
        {prefersPhone ? (
          <>
            <a href={`tel:${c.contact_phone}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem', fontWeight: 700,
              color: 'var(--terra-600, #C2410C)', textDecoration: 'none'
            }}>
              <Phone size={16} /> {c.contact_phone}
            </a>
            <a href={`mailto:${c.contact_email}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              color: 'var(--slate-600)', textDecoration: 'none'
            }}>
              <Mail size={14} /> {c.contact_email}
            </a>
          </>
        ) : prefersEmail ? (
          <>
            <a href={`mailto:${c.contact_email}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontFamily: 'Manrope, sans-serif', fontSize: '1.0625rem', fontWeight: 700,
              color: 'var(--terra-600, #C2410C)', textDecoration: 'none'
            }}>
              <Mail size={16} /> {c.contact_email}
            </a>
            <a href={`tel:${c.contact_phone}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              color: 'var(--slate-600)', textDecoration: 'none'
            }}>
              <Phone size={14} /> {c.contact_phone}
            </a>
          </>
        ) : (
          <>
            <a href={`tel:${c.contact_phone}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              color: 'var(--slate-700)', textDecoration: 'none'
            }}>
              <Phone size={14} /> {c.contact_phone}
            </a>
            <a href={`mailto:${c.contact_email}`} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              color: 'var(--slate-700)', textDecoration: 'none'
            }}>
              <Mail size={14} /> {c.contact_email}
            </a>
          </>
        )}
      </div>
      <span style={{
        display: 'inline-block', padding: '6px 14px', borderRadius: '8px',
        fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 800,
        color: 'var(--terra-600, #C2410C)', backgroundColor: 'var(--terra-100, #FEF1EC)',
        textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap'
      }}>{prefLabel}</span>
    </div>
  );
}