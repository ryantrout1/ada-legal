import React from 'react';
import { Building2, Globe, User, Mail, Phone, Clock, Flag } from 'lucide-react';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--heading)' }}>
        Documentation: {score}/7
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {criteria.map((c, i) => (
          <div key={i} title={c.label} style={{
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: c.met ? 'var(--suc-fg)' : 'var(--card-border)'
          }} />
        ))}
      </div>
    </div>
  );
}

const severityCfg = {
  high:   { emoji: '🔴', label: 'High Severity', bg: 'var(--error-100)',   color: 'var(--err-fg)' },
  medium: { emoji: '🟡', label: 'Medium',        bg: 'var(--warning-100)', color: 'var(--wrn-fg)' },
  low:    { emoji: '🟢', label: 'Low',            bg: 'var(--success-100)', color: '#14532D' },
};

export default function TriageCaseDetail({ caseData, titleRef }) {
  const c = caseData;
  if (!c) return null;

  const isPhysical = c.violation_type === 'physical_space';
  const sev = severityCfg[c.ai_severity] || null;
  const score = c.ai_completeness_score ?? 0;
  const compCfg = score >= 80
    ? { dot: 'var(--suc-fg)', label: 'Ready', color: 'var(--suc-fg)' }
    : score >= 50
      ? { dot: '#D97706', label: 'Partial', color: 'var(--wrn-fg)' }
      : { dot: 'var(--err-fg)', label: 'Incomplete', color: '#991B1B' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Title row */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: isPhysical ? '#FEF1EC' : '#DBEAFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isPhysical ? <Building2 size={15} style={{ color: 'var(--accent)' }} /> : <Globe size={15} style={{ color: '#1E3A8A' }} />}
          </div>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
            color: isPhysical ? '#8B2E08' : '#1E3A8A', textTransform: 'uppercase',
          }}>
            {isPhysical ? 'Physical Space' : 'Digital Website'}
          </span>
        </div>
        <h2
          ref={titleRef}
          tabIndex={-1}
          style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 600,
            color: 'var(--heading)', margin: 0, outline: 'none',
          }}
        >
          {c.business_name}
        </h2>
      </div>

      {/* Badges row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {sev && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 12px', borderRadius: '8px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 700,
            color: sev.color, backgroundColor: sev.bg,
          }}>
            {sev.emoji} {sev.label}
          </span>
        )}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '4px',
          padding: '4px 12px', borderRadius: '8px',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem', fontWeight: 600,
          color: compCfg.color, backgroundColor: score >= 80 ? 'var(--suc-bg)' : score >= 50 ? 'var(--wrn-bg)' : 'var(--err-bg)',
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: compCfg.dot }} />
          {compCfg.label} ({score}%)
        </span>
        {(c.ai_duplicate_cluster_size ?? 0) >= 2 && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px',
            borderRadius: '8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 700, color: '#1E3A8A', backgroundColor: '#DBEAFE',
          }}>
            🔗 {c.ai_duplicate_cluster_size} reports
          </span>
        )}
        {c.qc_flagged && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px',
            borderRadius: '8px', fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
            fontWeight: 700, color: 'var(--wrn-fg)', backgroundColor: 'var(--wrn-bg)',
          }}>
            <Flag size={13} /> Flagged
          </span>
        )}
      </div>

      {/* AI Summary */}
      {c.ai_summary && (
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-600)',
          margin: 0, lineHeight: 1.5,
        }}>
          {c.ai_summary}
        </p>
      )}

      {/* Business Details */}
      <div style={{
        backgroundColor: 'var(--page-bg-subtle)', borderRadius: '10px', padding: '16px',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px',
      }}>
        <div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: '#4B5563', margin: '0 0 2px', textTransform: 'uppercase' }}>Business Type</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--heading)', margin: 0 }}>{c.business_type || '—'}</p>
        </div>
        <div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: '#4B5563', margin: '0 0 2px', textTransform: 'uppercase' }}>Location</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--heading)', margin: 0 }}>
            {[c.city, c.state].filter(Boolean).join(', ') || '—'}
            {c.street_address && <><br />{c.street_address}</>}
          </p>
        </div>
        <div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: '#4B5563', margin: '0 0 2px', textTransform: 'uppercase' }}>
            {isPhysical ? 'Violation Subtype' : 'URL / Domain'}
          </p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--heading)', margin: 0 }}>
            {isPhysical ? (c.violation_subtype || '—') : (c.url_domain || '—')}
          </p>
        </div>
        <div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: '#4B5563', margin: '0 0 2px', textTransform: 'uppercase' }}>Incident Date</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--heading)', margin: 0 }}>{formatDate(c.incident_date)}</p>
        </div>
        <div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: '#4B5563', margin: '0 0 2px', textTransform: 'uppercase' }}>Visited Before?</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--heading)', margin: 0 }}>{VISITED_LABELS[c.visited_before] || '—'}</p>
        </div>
      </div>

      {/* Cluster info bar */}
      {(c.ai_duplicate_cluster_size ?? 0) >= 2 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
          backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE',
        }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: '#1E40AF' }}>
            ℹ️ This business has <strong>{(c.ai_duplicate_cluster_size ?? 1) - 1}</strong> other report{(c.ai_duplicate_cluster_size ?? 1) - 1 !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Narrative */}
      <div style={{
        borderLeft: '3px solid #C2410C', backgroundColor: 'var(--card-bg-tinted)',
        padding: '16px', borderRadius: '0 8px 8px 0',
      }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: 'var(--body-secondary)', margin: '0 0 6px', textTransform: 'uppercase' }}>Claimant Narrative</p>
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body-secondary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {c.narrative}
          </p>
        </div>
      </div>

      {/* Documentation Score */}
      <DocScoreDots caseData={c} />

      {/* Contact */}
      <div style={{
        backgroundColor: 'var(--page-bg-subtle)', borderRadius: '10px', padding: '16px',
      }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600, color: '#4B5563', margin: '0 0 10px', textTransform: 'uppercase' }}>Claimant Contact</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={14} style={{ color: '#4B5563' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--heading)' }}>{c.contact_name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={14} style={{ color: '#4B5563' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--heading)' }}>{c.contact_email}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={14} style={{ color: '#4B5563' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--heading)' }}>{c.contact_phone}</span>
          </div>
        </div>
        <div style={{ marginTop: '8px' }}>
          <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: '6px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
            color: 'var(--heading)', backgroundColor: 'var(--card-border)',
          }}>
            Prefers: {CONTACT_PREF_LABELS[c.contact_preference] || '—'}
          </span>
        </div>
      </div>
    </div>
  );
}