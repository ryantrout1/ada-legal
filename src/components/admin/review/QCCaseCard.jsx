import React, { useState } from 'react';
import { Building2, Globe, ChevronDown, ChevronUp, Check, X, Flag, Clock, User, Mail, Phone } from 'lucide-react';
import PhotoGallery from '../../shared/PhotoGallery';
import SourceBadge from '../../shared/SourceBadge';

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
    { label: 'Subtype', met: !!(caseData.violation_subtype || caseData.url_domain) },
    { label: 'Photos', met: caseData.photos?.length > 0 }
  ];
  const score = criteria.filter(c => c.met).length;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#1E293B' }}>
        Documentation: {score}/7
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

export default function QCCaseCard({ caseData, onApprove, onReject, onFlag, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const c = caseData;
  const isPhysical = c.violation_type === 'physical_space';
  const waitTime = getWaitTime(c.submitted_at || c.created_date);

  const iconBg = isPhysical ? '#FEF1EC' : '#DBEAFE';
  const iconColor = isPhysical ? '#C2410C' : '#1D4ED8';

  // Left border highlight
  const isHighSeverity = c.ai_severity === 'high';
  const isLargeCluster = (c.ai_duplicate_cluster_size ?? 0) >= 5;
  const leftBorder = isHighSeverity ? '3px solid var(--error-400, #F87171)' : isLargeCluster ? '3px solid var(--info-400, #60A5FA)' : 'none';

  // Severity config
  const severityCfg = {
    high:   { emoji: '🔴', label: 'High Severity', bg: 'var(--error-100)',   color: '#7F1D1D' },
    medium: { emoji: '🟡', label: 'Medium',        bg: 'var(--warning-100)', color: '#92400E' },
    low:    { emoji: '🟢', label: 'Low',            bg: 'var(--success-100)', color: '#14532D' },
  };
  const sev = severityCfg[c.ai_severity] || null;

  // Completeness config
  const score = c.ai_completeness_score ?? 0;
  const compCfg = score >= 80
    ? { dot: '#15803D', label: 'Ready',      color: '#15803D' }
    : score >= 50
      ? { dot: '#D97706', label: 'Partial',    color: '#B45309' }
      : { dot: '#DC2626', label: 'Incomplete', color: '#991B1B' };

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--slate-200)',
      borderRadius: '12px', overflow: 'hidden',
      borderLeft: leftBorder,
    }}>
      {/* Collapsed Row */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${c.business_name} — ${c.business_type}, ${[c.city, c.state].filter(Boolean).join(', ') || 'unknown location'}. ${c.ai_severity ? c.ai_severity + ' severity.' : ''} ${expanded ? 'Collapse' : 'Expand'} details.`}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded); } }}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px 14px',
          padding: '14px 16px',
          cursor: 'pointer',
          minHeight: '48px',
          backgroundColor: expanded ? 'var(--slate-50)' : 'transparent',
          transition: 'background-color 0.15s'
        }}
        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'var(--slate-50)'; }}
        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        {/* Icon */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {isPhysical
            ? <Building2 size={16} style={{ color: iconColor }} />
            : <Globe size={16} style={{ color: iconColor }} />
          }
        </div>

        {/* Left: Business + Case ID + cluster badge */}
        <div style={{ minWidth: 0, flex: '0 1 180px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700,
              color: 'var(--slate-900)', margin: 0, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {c.business_name}
            </p>
            {c.qc_flagged && (
              <Flag size={14} style={{ color: '#92400E', flexShrink: 0 }} aria-label="Flagged for review" />
            )}
            {(c.ai_duplicate_cluster_size ?? 0) >= 2 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', padding: '1px 7px', borderRadius: '100px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.6875rem', fontWeight: 700,
                color: '#1E3A8A', backgroundColor: 'var(--info-100)', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {c.ai_duplicate_cluster_size} reports
              </span>
            )}
          </div>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)', margin: 0
          }}>
            {c.id?.slice(0, 8)}...
          </p>
        </div>

        {/* Middle: AI insights */}
        <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Severity + Completeness row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {sev && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                padding: '2px 8px', borderRadius: '6px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                color: sev.color, backgroundColor: sev.bg,
              }}>
                {sev.emoji} {sev.label}
              </span>
            )}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
              color: compCfg.color,
            }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                backgroundColor: compCfg.dot, flexShrink: 0,
              }} />
              {compCfg.label}
            </span>
          </div>
          {/* AI summary */}
          {c.ai_summary && (
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: 'var(--slate-600)',
              margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              lineHeight: 1.4,
            }}>
              {c.ai_summary}
            </p>
          )}
        </div>

        {/* Right: Location + date + arrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '0 0 auto' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', color: '#475569',
              whiteSpace: 'nowrap', display: 'block',
            }}>
              {[c.city, c.state].filter(Boolean).join(', ') || '—'}
            </span>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#475569', margin: '2px 0 0' }}>
              {formatDate(c.submitted_at || c.created_date)}
            </p>
            {waitTime && (
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600,
                color: waitTime.isOverdue ? '#92400E' : '#475569', margin: 0,
                display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end'
              }}>
                <Clock size={11} /> {waitTime.text}
              </p>
            )}
          </div>
          <span aria-hidden="true" style={{ color: 'var(--slate-500)', display: 'flex', alignItems: 'center', padding: '4px' }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#475569', margin: '0 0 2px', textTransform: 'uppercase' }}>Business</p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>{c.business_name}</p>
                </div>
                <div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#475569', margin: '0 0 2px', textTransform: 'uppercase' }}>Type</p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>{c.business_type}</p>
                </div>
                <div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#475569', margin: '0 0 2px', textTransform: 'uppercase' }}>Location</p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>
                    {[c.city, c.state].filter(Boolean).join(', ')}
                    {c.street_address && <><br />{c.street_address}</>}
                  </p>
                </div>
              </div>

              {/* Row 2: 2-column */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '12px' }}>
                <div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#475569', margin: '0 0 2px', textTransform: 'uppercase' }}>
                    {isPhysical ? 'Violation Subtype' : 'URL / Domain'}
                  </p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>
                    {isPhysical ? (c.violation_subtype || '—') : (c.url_domain || '—')}
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#475569', margin: '0 0 2px', textTransform: 'uppercase' }}>Incident Date</p>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>{formatDate(c.incident_date)}</p>
                </div>
              </div>

              {/* Digital only: assistive tech */}
              {!isPhysical && c.assistive_tech?.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#475569', margin: '0 0 6px', textTransform: 'uppercase' }}>Assistive Technologies</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {c.assistive_tech.map((t, i) => (
                      <span key={i} style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                        fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                        color: '#1E3A5F', backgroundColor: '#DBEAFE'
                      }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Visited Before */}
              <div>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#475569', margin: '0 0 2px', textTransform: 'uppercase' }}>Visited Before?</p>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0 }}>{VISITED_LABELS[c.visited_before] || '—'}</p>
              </div>
            </div>
          </div>

          {/* Narrative */}
          <div style={{
            borderLeft: '3px solid #C2410C', backgroundColor: '#FFF7ED',
            padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '16px'
          }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#475569', margin: '0 0 6px', textTransform: 'uppercase' }}>Claimant Narrative</p>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: '#475569', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {c.narrative}
            </p>
          </div>

          {/* Evidence Photos */}
          {c.photos?.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#475569', margin: '0 0 8px', textTransform: 'uppercase' }}>Evidence Photos</p>
              <PhotoGallery photos={c.photos} />
            </div>
          )}

          {/* Claimant Contact Card */}
          <div style={{
            backgroundColor: 'var(--slate-50)', borderRadius: '12px', padding: '16px', marginBottom: '16px'
          }}>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: '#475569', margin: '0 0 12px', textTransform: 'uppercase' }}>Claimant Contact</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={14} style={{ color: 'var(--slate-500)' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569' }}>{c.contact_name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={14} style={{ color: 'var(--slate-500)' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569' }}>{c.contact_email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={14} style={{ color: 'var(--slate-500)' }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#475569' }}>{c.contact_phone}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                color: '#1E293B', backgroundColor: 'var(--slate-200)'
              }}>Prefers: {CONTACT_PREF_LABELS[c.contact_preference] || '—'}</span>
            </div>
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: '#334155', margin: '10px 0 0', fontStyle: 'italic' }}>
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
                border: 'none', borderRadius: '8px', cursor: 'pointer', minHeight: '44px'
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
                border: 'none', borderRadius: '8px', cursor: 'pointer', minHeight: '44px'
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
                fontWeight: 700, color: '#92400E', backgroundColor: 'transparent',
                border: '2px solid #92400E', borderRadius: '8px', cursor: 'pointer', minHeight: '44px'
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