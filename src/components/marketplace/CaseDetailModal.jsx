import React, { useEffect, useRef } from 'react';
import { Building2, Globe, ArrowRight, FileText, Phone, Mail, MinusCircle } from 'lucide-react';
import { calculateDocScore, getFreshness } from './docScore';
import PhotoGallery from '../shared/PhotoGallery';
import SourceBadge from '../shared/SourceBadge';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function extractDomain(url) {
  if (!url) return '—';
  try { const cleaned = url.startsWith('http') ? url : `https://${url}`; return new URL(cleaned).hostname; }
  catch { return url.split('/')[0]; }
}

export default function CaseDetailModal({ caseData, onClose, onInitiate }) {
  const overlayRef = useRef(null);
  const closeRef = useRef(null);

  const c = caseData;
  const isPhysical = c?.violation_type === 'physical_space';

  useEffect(() => {
    if (!c) return;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab') {
        const focusable = overlayRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = ''; };
  }, [c, onClose]);

  if (!c) return null;

  const visitedLabel = { yes: 'Yes', no: 'No', first_time: 'First Time' }[c.visited_before] || c.visited_before || '—';
  const docScore = calculateDocScore(c);
  const freshness = getFreshness(c);

  const contactPrefLabel = { phone: 'Phone', email: 'Email', no_preference: 'No Preference' }[c.contact_preference] || c.contact_preference || '—';
  const ContactIcon = c.contact_preference === 'phone' ? Phone : c.contact_preference === 'email' ? Mail : MinusCircle;

  // Build violation summary grid items
  const summaryItems = [];
  if (isPhysical && c.violation_subtype) summaryItems.push({ label: 'Violation Subtype', value: c.violation_subtype });
  if (!isPhysical && c.url_domain) summaryItems.push({ label: 'Domain', value: extractDomain(c.url_domain) });
  if (c.incident_date) summaryItems.push({ label: 'Incident Date', value: formatDate(c.incident_date) });
  summaryItems.push({ label: 'Visited Before', value: visitedLabel });

  return (
    <div
      ref={overlayRef} role="dialog" aria-modal="true" aria-labelledby="case-detail-heading"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(30,41,59,0.5)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '2rem 1rem', overflowY: 'auto'
      }}
    >
      <div style={{
        backgroundColor: 'var(--surface)', borderRadius: '16px',
        maxWidth: '600px', width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        margin: '1rem 0', overflow: 'hidden'
      }}>
        {/* ── Header Banner ── */}
        <div style={{
          backgroundColor: isPhysical ? 'var(--terra-100, #FEF1EC)' : '#DBEAFE',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isPhysical
              ? <Building2 size={20} aria-hidden="true" style={{ color: 'var(--terra-600, #C2410C)' }} />
              : <Globe size={20} aria-hidden="true" style={{ color: '#1D4ED8' }} />
            }
            <span id="case-detail-heading" style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 800,
              color: isPhysical ? '#7C2D12' : '#1E3A5F'
            }}>
              {isPhysical ? 'Physical Space' : 'Digital / Website'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '9999px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
              color: '#15803D', backgroundColor: '#DCFCE7',
              textTransform: 'uppercase', letterSpacing: '0.04em'
            }}>Available</span>
            <SourceBadge source={c.intake_source} />
            {freshness.type === 'new' ? (
              <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '0.625rem', fontWeight: 800, color: '#15803D', backgroundColor: '#BBF7D0', textTransform: 'uppercase' }}>NEW</span>
            ) : (
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: freshness.type === 'old' ? '#92400E' : '#475569' }}>
                Posted {freshness.daysAgo} day{freshness.daysAgo !== 1 ? 's' : ''} ago
              </span>
            )}
          </div>
        </div>

        {/* ── Business Name Row ── */}
        <div style={{
          padding: '16px 24px 0',
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px'
        }}>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 600, color: 'var(--slate-900)' }}>
            {c.business_type || '—'}
          </span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-600)' }}>
            {[c.city, c.state].filter(Boolean).join(', ') || '—'}
          </span>
        </div>

        {/* ── Content Sections ── */}
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Section 1 — Violation Summary Grid */}
          <div style={{
            backgroundColor: 'var(--slate-100, #F1F5F9)', borderRadius: '12px', padding: '16px',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px'
          }}>
            {summaryItems.map((item, i) => (
              <div key={i}>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 2px' }}>{item.label}</p>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>{item.value}</p>
              </div>
            ))}
            {/* Assistive Tech pills for digital */}
            {!isPhysical && c.assistive_tech?.length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>Assistive Technologies</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {c.assistive_tech.map((t, i) => (
                    <span key={i} style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: '6px',
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
                      color: '#1E3A5F', backgroundColor: '#DBEAFE'
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2 — Claimant's Account */}
          <div style={{
            borderLeft: '3px solid var(--terra-600, #C2410C)',
            backgroundColor: '#FFF8F5',
            borderRadius: '0 10px 10px 0',
            padding: '20px'
          }}>
            <FileText size={16} aria-hidden="true" style={{ color: 'var(--terra-600, #C2410C)', marginBottom: '8px', opacity: 0.6 }} />
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem', color: 'var(--slate-900)',
              lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap'
            }}>
              {c.narrative || 'No description available.'}
            </p>
          </div>

          {/* Photos */}
          {c.photos?.length > 0 && (
            <div>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>Evidence Photos</p>
              <PhotoGallery photos={c.photos} />
            </div>
          )}

          {/* Section 3 — Documentation Score (inline) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {docScore.criteria.map((cr, i) => (
                  <span key={i} style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: cr.met ? docScore.color : 'var(--slate-300)' }} />
                ))}
              </div>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700, color: docScore.color }}>
                {docScore.score}/7 — {docScore.label}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
              {docScore.criteria.map((cr, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.85rem', color: cr.met ? '#15803D' : 'var(--slate-300)', flexShrink: 0 }}>{cr.met ? '●' : '○'}</span>
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: cr.met ? 'var(--slate-800)' : 'var(--slate-400)' }}>{cr.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4 — Before You Commit */}
          <div style={{
            backgroundColor: '#DBEAFE', borderRadius: '10px', padding: '16px',
            display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ContactIcon size={16} style={{ color: '#1D4ED8', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: '#1E3A5F' }}>
                Contact Preference: {contactPrefLabel}
              </span>
            </div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#1E3A5F', margin: 0, lineHeight: 1.5 }}>
              24-hour contact window begins when you initiate support
            </p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#1E3A5F', margin: 0, lineHeight: 1.5 }}>
              Case assigned exclusively to you — no other attorneys will have access
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '0 24px 20px' }}>
          <button type="button" onClick={() => onInitiate(c)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', padding: '16px',
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
            color: 'white', backgroundColor: 'var(--terra-600)', border: 'none',
            borderRadius: '10px', cursor: 'pointer', minHeight: '52px',
            transition: 'background-color 0.15s, transform 0.15s'
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--terra-700)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--terra-600)'; e.currentTarget.style.transform = 'none'; }}
          >
            Initiate Support <ArrowRight size={18} aria-hidden="true" />
          </button>

          {/* Dates line */}
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#475569',
            textAlign: 'center', margin: '12px 0 4px'
          }}>
            Submitted {formatDate(c.submitted_at || c.created_date)} · Approved {formatDate(c.approved_at)}
          </p>

          <button ref={closeRef} type="button" onClick={onClose} style={{
            display: 'block', width: '100%',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 600,
            color: '#475569', textAlign: 'center', padding: '6px'
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--slate-900)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#475569'; }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}