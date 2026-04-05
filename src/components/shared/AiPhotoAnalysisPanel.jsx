import React, { useState } from 'react';
import { CheckCircle, ChevronDown, ChevronUp, Microscope } from 'lucide-react';

const SEV_CONFIG = {
  HIGH:   { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', badge: '#FCA5A5', label: 'High' },
  MEDIUM: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', badge: '#FCD34D', label: 'Medium' },
  LOW:    { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', badge: '#86EFAC', label: 'Low' },
};

const RISK_CONFIG = {
  HIGH:   { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', label: 'HIGH RISK' },
  MEDIUM: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', label: 'MEDIUM RISK' },
  LOW:    { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', label: 'LOW RISK' },
  NONE:   { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', label: 'NO VIOLATIONS DETECTED' },
};

const CONF_CONFIG = {
  HIGH:   { text: '#166534', bg: '#DCFCE7', label: '✓ Clearly visible' },
  MEDIUM: { text: '#92400E', bg: '#FEF9C3', label: '~ Likely — verify on-site' },
  LOW:    { text: '#92400E', bg: '#FEF3C7', label: '⚠ Estimated — verify on-site' },
};

function formatConcernCount(concerns) {
  const highCount = concerns.filter(c => c.severity === 'HIGH').length;
  const medCount  = concerns.filter(c => c.severity === 'MEDIUM').length;
  const lowCount  = concerns.length - highCount - medCount;
  const parts = [];
  if (highCount > 0) parts.push(`${highCount} high`);
  if (medCount  > 0) parts.push(`${medCount} medium`);
  if (lowCount  > 0) parts.push(`${lowCount} low`);
  return `${parts.join(', ')} severity issue${concerns.length !== 1 ? 's' : ''} found`;
}

function SeverityBadge({ severity }) {
  const c = SEV_CONFIG[severity] || SEV_CONFIG.LOW;
  return (
    <span style={{
      display: 'inline-block', padding: '1px 8px', borderRadius: 4,
      fontSize: 11, fontWeight: 700, fontFamily: 'Manrope, sans-serif',
      background: c.badge, color: c.text, textTransform: 'uppercase', letterSpacing: '0.04em'
    }}>{c.label}</span>
  );
}

function ConcernCard({ concern }) {
  const [open, setOpen] = useState(false);
  const sev  = SEV_CONFIG[concern.severity] || SEV_CONFIG.LOW;
  const conf = CONF_CONFIG[concern.confidence] || CONF_CONFIG.MEDIUM;

  return (
    <div style={{ borderRadius: 8, border: `1px solid ${sev.border}`, background: sev.bg, overflow: 'hidden', marginBottom: 8 }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <SeverityBadge severity={concern.severity} />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, color: sev.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {concern.title}
          </span>
        </div>
        {open
          ? <ChevronUp   size={14} style={{ color: sev.text, flexShrink: 0 }} aria-hidden="true" />
          : <ChevronDown size={14} style={{ color: sev.text, flexShrink: 0 }} aria-hidden="true" />
        }
      </button>

      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${sev.border}` }}>
          {concern.detail && (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: sev.text, margin: '10px 0 6px', lineHeight: 1.5 }}>
              {concern.detail}
            </p>
          )}
          {concern.remediation && (
            <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 6, padding: '8px 10px', marginBottom: 6 }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: sev.text }}>Fix: </span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: sev.text }}>{concern.remediation}</span>
            </div>
          )}
          {concern.confidence && (
            <span style={{
              display: 'inline-block', padding: '2px 8px', borderRadius: 4,
              fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 600,
              background: conf.bg, color: conf.text
            }}>
              {conf.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function AiPhotoAnalysisPanel({ caseData }) {
  const [expanded, setExpanded] = useState(true);

  // photo_analysis is stored as a JSON string on the Case entity
  if (!caseData?.photo_analysis) return null;

  let analysis;
  try {
    analysis = typeof caseData.photo_analysis === 'string'
      ? JSON.parse(caseData.photo_analysis)
      : caseData.photo_analysis;
  } catch {
    return null;
  }

  if (!analysis) return null;

  const risk = RISK_CONFIG[analysis.overallRisk] || RISK_CONFIG.NONE;

  // Flatten concerns across all photos, sorted HIGH -> MEDIUM -> LOW
  const allConcerns = (analysis.photos || [])
    .flatMap((p, pi) => (p.concerns || []).map(c => ({ ...c, photoIndex: pi })))
    .sort((a, b) => {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
    });

  const allPositive = (analysis.photos || []).flatMap(p => p.positiveFindings || []);

  return (
    <div style={{ marginTop: 16 }}>

      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setExpanded(o => !o)}
        aria-expanded={expanded}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px', textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Microscope size={14} aria-hidden="true" style={{ color: 'var(--accent)' }} />
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            AI Photo Analysis
          </span>
        </div>
        {expanded
          ? <ChevronUp   size={14} style={{ color: 'var(--body-secondary)' }} aria-hidden="true" />
          : <ChevronDown size={14} style={{ color: 'var(--body-secondary)' }} aria-hidden="true" />
        }
      </button>

      {expanded && (
        <div style={{ borderRadius: 10, border: `1px solid ${risk.border}`, background: risk.bg, padding: 14 }}>

          {/* Risk pill + concern count */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <span style={{
              flexShrink: 0, padding: '3px 10px', borderRadius: 20,
              fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 800,
              background: risk.border, color: risk.text, textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              {risk.label}
            </span>
            {allConcerns.length > 0 && (
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: risk.text, lineHeight: 1.4 }}>
                {formatConcernCount(allConcerns)}
              </span>
            )}
          </div>

          {/* Summary */}
          {analysis.summary && (
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: risk.text, margin: '0 0 12px', lineHeight: 1.6 }}>
              {analysis.summary}
            </p>
          )}

          {/* Concern cards */}
          {allConcerns.length > 0 && (
            <div>
              {allConcerns.map((concern, i) => (
                <ConcernCard key={i} concern={concern} />
              ))}
            </div>
          )}

          {/* Compliant features */}
          {allPositive.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 6px' }}>
                Compliant Features
              </p>
              {allPositive.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                  <CheckCircle size={13} style={{ color: '#22C55E', flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
                  <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, color: '#166534', lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: risk.text, margin: '10px 0 0', opacity: 0.7, lineHeight: 1.4 }}>
            AI-generated analysis for reference only — not a professional inspection. Verify all findings on-site.
          </p>

        </div>
      )}
    </div>
  );
}
