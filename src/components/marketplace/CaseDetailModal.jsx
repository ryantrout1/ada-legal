import React, { useEffect, useRef } from 'react';
import { Building2, Globe, ArrowRight } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function extractDomain(url) {
  if (!url) return '—';
  try {
    const cleaned = url.startsWith('http') ? url : `https://${url}`;
    return new URL(cleaned).hostname;
  } catch {
    return url.split('/')[0];
  }
}

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
        color: 'var(--slate-600)', minWidth: '130px', flexShrink: 0
      }}>{label}</span>
      <span style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-800)'
      }}>{value}</span>
    </div>
  );
}

function SectionHeading({ children }) {
  return (
    <h3 style={{
      fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
      color: 'var(--slate-600)', textTransform: 'uppercase', letterSpacing: '0.06em',
      margin: '0 0 0.625rem 0', paddingBottom: '0.375rem',
      borderBottom: '1px solid var(--slate-200)'
    }}>{children}</h3>
  );
}

export default function CaseDetailModal({ caseData, onClose, onInitiate }) {
  const overlayRef = useRef(null);
  const closeRef = useRef(null);
  const initiateRef = useRef(null);

  const c = caseData;
  const isPhysical = c?.violation_type === 'physical_space';

  useEffect(() => {
    if (!c) return;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab') {
        const focusable = overlayRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [c, onClose]);

  if (!c) return null;

  const visitedLabel = { yes: 'Yes', no: 'No', first_time: 'First Time' }[c.visited_before] || c.visited_before || '—';

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-detail-heading"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: 'var(--space-xl) var(--space-lg)',
        overflowY: 'auto'
      }}
    >
      <div style={{
        backgroundColor: 'var(--surface)', borderRadius: '16px',
        border: '1px solid var(--slate-200)',
        maxWidth: '640px', width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        margin: '2rem 0'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.5rem 1rem',
          borderBottom: '1px solid var(--slate-200)'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '0.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                backgroundColor: isPhysical ? '#DBEAFE' : '#F3E8FF', flexShrink: 0
              }}>
                {isPhysical
                  ? <Building2 size={18} aria-hidden="true" style={{ color: '#1D4ED8' }} />
                  : <Globe size={18} aria-hidden="true" style={{ color: '#7C3AED' }} />
                }
              </span>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
                color: isPhysical ? '#1D4ED8' : '#7C3AED'
              }}>
                {isPhysical ? 'Physical Space' : 'Digital / Website'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                display: 'inline-block', padding: '0.2rem 0.625rem',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
                color: '#15803D', backgroundColor: '#DCFCE7', borderRadius: '9999px',
                textTransform: 'uppercase', letterSpacing: '0.04em'
              }}>Available</span>
            </div>
          </div>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            color: 'var(--slate-600)', margin: '0.625rem 0 0 0'
          }}>
            Posted {formatDate(c.approved_at)}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem' }}>
          {/* Section 1 — Location / Website */}
          <SectionHeading>{isPhysical ? 'Location' : 'Website'}</SectionHeading>
          <InfoRow label="Business Type" value={c.business_type} />
          <InfoRow label="City, State" value={[c.city, c.state].filter(Boolean).join(', ') || '—'} />
          {isPhysical && <InfoRow label="Violation Type" value={c.violation_subtype} />}
          {!isPhysical && <InfoRow label="Domain" value={c.url_domain ? extractDomain(c.url_domain) : null} />}
          {!isPhysical && c.assistive_tech?.length > 0 && (
            <InfoRow label="Assistive Tech" value={c.assistive_tech.join(', ')} />
          )}

          <div style={{ height: '1rem' }} />

          {/* Section 2 — Incident Details */}
          <SectionHeading>Incident Details</SectionHeading>
          <InfoRow label="Incident Date" value={formatDate(c.incident_date)} />
          <InfoRow label="Visited Before" value={visitedLabel} />

          <div style={{ marginTop: '0.625rem' }}>
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
              color: 'var(--slate-600)', display: 'block', marginBottom: '0.375rem'
            }}>Description</span>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              color: 'var(--slate-800)', lineHeight: 1.7,
              margin: 0, whiteSpace: 'pre-wrap'
            }}>
              {c.narrative || 'No description available.'}
            </p>
          </div>

          <div style={{ height: '1rem' }} />

          {/* Section 3 — Case Info */}
          <SectionHeading>Case Info</SectionHeading>
          <InfoRow label="Date Submitted" value={formatDate(c.submitted_at || c.created_date)} />
          <InfoRow label="Date Approved" value={formatDate(c.approved_at)} />
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem 1.5rem',
          borderTop: '1px solid var(--slate-200)'
        }}>
          <button
            ref={initiateRef}
            type="button"
            onClick={() => onInitiate(c)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.5rem', padding: '0.875rem 1.5rem',
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
              color: 'white', backgroundColor: 'var(--terra-600)', border: 'none',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              minHeight: '48px', transition: 'background-color 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--terra-700)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--terra-600)'; }}
          >
            Initiate Support <ArrowRight size={18} aria-hidden="true" />
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            style={{
              display: 'block', width: '100%', marginTop: '0.75rem',
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
              color: 'var(--slate-600)', textAlign: 'center', padding: '0.5rem'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--slate-700)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--slate-600)'; }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}