import React, { useState } from 'react';
import { Building2, Globe, ChevronDown, ChevronUp, Check, X, Flag, Clock, User, Mail, Phone } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getWaitTime(submittedAt) {
  if (!submittedAt) return null;
  const now = new Date();
  const submitted = new Date(submittedAt);
  const hours = Math.floor((now - submitted) / (1000 * 60 * 60));
  if (hours < 24) return { text: `Waiting ${hours}h`, isOverdue: false };
  const days = Math.floor(hours / 24);
  return { text: `Waiting ${days}d`, isOverdue: true };
}

const VISITED_LABELS = { yes: 'Yes', no: 'No', first_time: 'First time' };
const CONTACT_PREF_LABELS = { phone: 'Phone', email: 'Email', no_preference: 'No preference' };

function DocScoreDots({ caseData }) {
  const criteria = [
    { label: 'Narrative', met: caseData.narrative?.length >= 100 },
    { label: 'Date', met: !!caseData.incident_date },
    { label: 'Location', met: !!(caseData.city && caseData.state) },
    { label: 'Business', met: !!caseData.business_name },
    { label: 'Contact', met: !!(caseData.contact_email && caseData.contact_phone) },
    { label: 'Subtype', met: !!(caseData.violation_subtype || caseData.url_domain) }
  ];
  const score = criteria.filter(c => c.met).length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-700)' }}>
        Documentation: {score}/6
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {criteria.map((c, i) => (
          <div key={i} title={c.label} style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: c.met ? '#15803D' : '#E2E8F0'
          }} />
        ))}
      </div>
    </div>
  );
}

export default function QCCaseCard({ caseData, onApprove, onReject, onFlag }) {
  const [expanded, setExpanded] = useState(false);
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const waitTime = getWaitTime(c.submitted_at || c.created_date);

  const iconBg = isPhysical ? '#FEF1EC' : '#DBEAFE';
  const iconColor = isPhysical ? '#C2410C' : '#1D4ED8';

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: '12px', overflow: 'hidden'
    }}>
      {/* Collapsed Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto auto auto auto',
        alignItems: 'center',
        gap: '16px',
        padding: '14px 16px'
      }}>
        {/* Icon */}
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {isPhysical
            ? <Building2 size={18} style={{ color: iconColor }} />
            : <Globe size={18} style={{ color: iconColor }} />
          }
        </div>

        {/* Col 1: Business + Case ID */}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
              color: 'var(--slate-900)', margin: 0, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {c.business_name}
            </p>
            {c.qc_flagged && (
              <Flag size={14} style={{ color: '#D97706', flexShrink: 0 }} aria-label="Flagged for review" />
            )}
          </div>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)', margin: 0
          }}>
            {c.id?.slice(0, 8)}...
          </p>
        </div>

        {/* Col 2: Business type + subtype pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600,
            color: '#475569', backgroundColor: 'var(--slate-100)'
          }}>{c.business_type}</span>
          {(c.violation_subtype || c.url_domain) && (
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600,
              color: isPhysical ? '#C2410C' : '#1D4ED8',
              backgroundColor: isPhysical ? '#FEF1EC' : '#DBEAFE'
            }}>{c.violation_subtype || c.url_domain}</span>
          )}
        </div>

        {/* Col 3: Location */}
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569', whiteSpace: 'nowrap'
        }}>
          {[c.city, c.state].filter(Boolean).join(', ') || '—'}
        </span>

        {/* Col 4: Date + wait time */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
            {formatDate(c.submitted_at || c.created_date)}
          </p>
          {waitTime && (
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
              color: waitTime.isOverdue ? '#D97706' : '#475569', margin: 0,
              display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end'
            }}>
              <Clock size={12} /> {waitTime.text}
            </p>
          )}
        </div>

        {/* Expand */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse details' : 'Expand details'}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
            color: 'var(--slate-500)'
          }}
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {/* Expanded View */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--slate-200)', padding: '20px' }}>
          {/* Violation Summary Card */}
          <div style={{
            backgroundColor: 'var(--slate-50)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px'
          }}>
            {/* Header strip */}
            <div style={{
              height: '6px', backgroundColor: isPhysical ? '#FEF1EC' : '#DBEAFE'
            }} />
            <div style={{ padding: '16px' }}>
              {/* Row 1: 3-column */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', margin: '0 0 2px', textTransform: 'uppercase' }}>Business</p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>{c.business_name}</p>
                </div>
                <div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', margin: '0 0 2px', textTransform: 'uppercase' }}>Type</p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>{c.business_type}</p>
                </div>
                <div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', margin: '0 0 2px', textTransform: 'uppercase' }}>Location</p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>
                    {[c.city, c.state].filter(Boolean).join(', ')}
                    {c.street_address && <><br />{c.street_address}</>}
                  </p>
                </div>
              </div>

              {/* Row 2: 2-column */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', margin: '0 0 2px', textTransform: 'uppercase' }}>
                    {isPhysical ? 'Violation Subtype' : 'URL / Domain'}
                  </p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>
                    {isPhysical ? (c.violation_subtype || '—') : (c.url_domain || '—')}
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', margin: '0 0 2px', textTransform: 'uppercase' }}>Incident Date</p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>{formatDate(c.incident_date)}</p>
                </div>
              </div>

              {/* Digital only: assistive tech */}
              {!isPhysical && c.assistive_tech?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', margin: '0 0 6px', textTransform: 'uppercase' }}>Assistive Technologies</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {c.assistive_tech.map((t, i) => (
                      <span key={i} style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                        fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                        color: '#1D4ED8', backgroundColor: '#DBEAFE'
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Visited Before */}
              <div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', margin: '0 0 2px', textTransform: 'uppercase' }}>Visited Before?</p>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>{VISITED_LABELS[c.visited_before] || '—'}</p>
              </div>
            </div>
          </div>

          {/* Narrative */}
          <div style={{
            borderLeft: '3px solid #C2410C', backgroundColor: '#FFF7ED',
            padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '16px'
          }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', margin: '0 0 6px', textTransform: 'uppercase' }}>Claimant Narrative</p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {c.narrative}
            </p>
          </div>

          {/* Claimant Contact Card */}
          <div style={{
            backgroundColor: 'var(--slate-50)', borderRadius: '12px', padding: '16px', marginBottom: '16px'
          }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', margin: '0 0 12px', textTransform: 'uppercase' }}>Claimant Contact</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={14} style={{ color: 'var(--slate-400)' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569' }}>{c.contact_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} style={{ color: 'var(--slate-400)' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569' }}>{c.contact_email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} style={{ color: 'var(--slate-400)' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569' }}>{c.contact_phone}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                color: '#475569', backgroundColor: 'var(--slate-200)'
              }}>Prefers: {CONTACT_PREF_LABELS[c.contact_preference] || '—'}</span>
            </div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)', margin: '10px 0 0', fontStyle: 'italic' }}>
              Contact info is hidden from attorneys until case is assigned.
            </p>
          </div>

          {/* Doc Score */}
          <div style={{ marginBottom: '20px' }}>
            <DocScoreDots caseData={c} />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onApprove}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                fontWeight: 700, color: 'white', backgroundColor: '#15803D',
                border: 'none', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              <Check size={16} /> Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                fontWeight: 700, color: 'white', backgroundColor: '#B91C1C',
                border: 'none', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              <X size={16} /> Reject
            </button>
            <button
              type="button"
              onClick={onFlag}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '10px 20px', fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                fontWeight: 700, color: '#D97706', backgroundColor: 'transparent',
                border: '2px solid #D97706', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              <Flag size={16} /> Flag for Review
            </button>
          </div>
        </div>
      )}
    </div>
  );
}