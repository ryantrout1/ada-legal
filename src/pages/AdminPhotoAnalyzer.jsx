import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import AdminPageHeader from '../components/admin/shared/AdminPageHeader';
import { Camera, Upload, AlertTriangle, CheckCircle, Info, Clock, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';

const ADA_SYSTEM_PROMPT = `You are an ADA accessibility compliance analyst. Examine photos of physical locations (entrances, parking lots, restrooms, signage, pathways, counters, etc.) and identify potential ADA compliance concerns based on the 2010 ADA Standards for Accessible Design.

Respond ONLY with valid JSON in exactly this shape — no markdown, no preamble:
{
  "summary": "1-2 sentence overall assessment",
  "overallRisk": "HIGH" | "MEDIUM" | "LOW" | "NONE",
  "photos": [
    {
      "photoIndex": 0,
      "description": "What you see in this photo",
      "concerns": [
        {
          "title": "Short concern title",
          "detail": "Specific detail including ADA standard section if applicable",
          "severity": "HIGH" | "MEDIUM" | "LOW",
          "remediation": "Recommended fix"
        }
      ],
      "positiveFindings": ["Compliant feature 1"]
    }
  ]
}

Key standards: door clearance min 32" (§404.2.3), ramp slope max 1:12 (§405.2), van-accessible parking 132" + 96" aisle (§502.2), pathway min 36" (§403.5.1), threshold max 1/2" (§404.2.5), counter max 36" (§904.4), tactile/Braille signage at permanent rooms (§703.1).

This is informational only, not a professional inspection. Be thorough but measured.`;

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function SeverityBadge({ severity }) {
  const MAP = {
    HIGH:   { label: 'HIGH',   icon: '⚠', color: 'var(--err-fg)',  bg: 'var(--err-bg)',  border: 'var(--err-bd)'  },
    MEDIUM: { label: 'MEDIUM', icon: '▲', color: 'var(--wrn-fg)',  bg: 'var(--wrn-bg)',  border: 'var(--wrn-bd)'  },
    LOW:    { label: 'LOW',    icon: '●', color: 'var(--inf-fg)',  bg: 'var(--inf-bg)',  border: 'var(--inf-bd)'  },
  };
  const c = MAP[severity] || MAP.LOW;
  return (
    <span role="img" aria-label={c.label + ' severity'} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 4, padding: '2px 8px', fontFamily: 'Manrope, sans-serif',
    }}>
      {c.icon} {c.label}
    </span>
  );
}

function RiskPill({ risk }) {
  const MAP = {
    HIGH:   { label: 'High Risk',   color: 'var(--err-fg)',  bg: 'var(--err-bg)',  border: 'var(--err-bd)'  },
    MEDIUM: { label: 'Medium Risk', color: 'var(--wrn-fg)',  bg: 'var(--wrn-bg)',  border: 'var(--wrn-bd)'  },
    LOW:    { label: 'Low Risk',    color: 'var(--inf-fg)',  bg: 'var(--inf-bg)',  border: 'var(--inf-bd)'  },
    NONE:   { label: 'No Issues',   color: 'var(--suc-fg)',  bg: 'var(--suc-bg)',  border: 'var(--suc-bd)'  },
  };
  const c = MAP[risk] || MAP.NONE;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 12, fontWeight: 700, color: c.color,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 6, padding: '3px 10px', fontFamily: 'Manrope, sans-serif',
    }}>{c.label}</span>
  );
}

function HistoryRow({ record, onSelect, isSelected }) {
  const result = record.analysis_result || {};
  return (
    <article
      aria-label={'Analysis: ' + (record.location_label || 'Unlabeled')}
      aria-current={isSelected ? 'true' : undefined}
      onClick={() => onSelect(record)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect(record)}
      tabIndex={0}
      role="button"
      style={{
        padding: '12px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 6,
        background: isSelected ? 'var(--card-bg-tinted)' : 'var(--card-bg)',
        border: '1px solid ' + (isSelected ? 'var(--accent)' : 'var(--card-border)'),
        outline: 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {record.location_label || 'Unlabeled'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--body-secondary)', marginTop: 2, fontFamily: 'Manrope, sans-serif' }}>
            <time dateTime={record.created_date}>{formatDate(record.created_date)}</time>
            {' · '}{record.photo_count || 1} photo{record.photo_count !== 1 ? 's' : ''}
          </div>
        </div>
        <RiskPill risk={result.overallRisk} />
      </div>
      {result.summary && (
        <p style={{ fontSize: 12, color: 'var(--body-secondary)', margin: '6px 0 0', lineHeight: 1.4, fontFamily: 'Manrope, sans-serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {result.summary}
        </p>
      )}
    </article>
  );
}

function ConcernCard({ concern }) {
  const [open, setOpen] = useState(false);
  const SEV_BORDER = { HIGH: 'var(--err-bd)', MEDIUM: 'var(--wrn-bd)', LOW: 'var(--inf-bd)' };
  const SEV_BG     = { HIGH: 'var(--err-bg)', MEDIUM: 'var(--wrn-bg)', LOW: 'var(--inf-bg)' };
  return (
    <div style={{ borderRadius: 8, border: '1px solid ' + (SEV_BORDER[concern.severity] || SEV_BORDER.LOW), background: SEV_BG[concern.severity] || SEV_BG.LOW, marginBottom: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 44 }}
      >
        <SeverityBadge severity={concern.severity} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif' }}>{concern.title}</span>
        {open ? <ChevronUp size={16} aria-hidden="true" style={{ color: 'var(--body-secondary)', flexShrink: 0 }} />
               : <ChevronDown size={16} aria-hidden="true" style={{ color: 'var(--body-secondary)', flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid ' + (SEV_BORDER[concern.severity] || SEV_BORDER.LOW) }}>
          <p style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.6, margin: '10px 0 8px', fontFamily: 'Manrope, sans-serif' }}>{concern.detail}</p>
          {concern.remediation && (
            <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--accent-success-bg)', border: '1px solid var(--accent-success)' }}>
              <p style={{ fontSize: 12, color: 'var(--heading)', margin: 0, lineHeight: 1.5, fontFamily: 'Manrope, sans-serif' }}>
                <strong style={{ color: 'var(--success-600)' }}>Recommended fix: </strong>{concern.remediation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AnalysisResults({ result }) {
  if (!result) return null;
  const totalConcerns = result.photos?.reduce((s, p) => s + (p.concerns?.length || 0), 0) || 0;
  const highCount = result.photos?.reduce((s, p) => s + (p.concerns?.filter(c => c.severity === 'HIGH').length || 0), 0) || 0;
  return (
    <section aria-label="Analysis results">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16, padding: '12px 16px', background: 'var(--card-bg-tinted)', border: '1px solid var(--card-border)', borderRadius: 8 }}>
        <RiskPill risk={result.overallRisk} />
        <span style={{ fontSize: 13, color: 'var(--body)', fontFamily: 'Manrope, sans-serif' }}>{totalConcerns} concern{totalConcerns !== 1 ? 's' : ''} identified</span>
        {highCount > 0 && (
          <span style={{ fontSize: 13, color: 'var(--err-fg)', fontWeight: 700, fontFamily: 'Manrope, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertTriangle size={14} aria-hidden="true" /> {highCount} high severity
          </span>
        )}
      </div>
      {result.summary && (
        <p style={{ fontSize: 14, color: 'var(--body)', lineHeight: 1.7, marginBottom: 20, padding: '14px 16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, fontFamily: 'Manrope, sans-serif' }}>
          {result.summary}
        </p>
      )}
      {result.photos?.map((photo, idx) => (
        <section key={idx} aria-label={'Photo ' + (idx + 1) + ' results'} style={{ marginBottom: 20, borderRadius: 10, border: '1px solid var(--card-border)', background: 'var(--card-bg)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', background: 'var(--slate-100)', borderBottom: '1px solid var(--card-border)' }}>
            <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Photo {idx + 1}
            </h3>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <p style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.6, marginBottom: 14, fontFamily: 'Manrope, sans-serif' }}>{photo.description}</p>
            {photo.concerns?.length > 0 && (
              <div role="list" aria-label={'Concerns for photo ' + (idx + 1)}>
                {photo.concerns.map((c, ci) => <div key={ci} role="listitem"><ConcernCard concern={c} /></div>)}
              </div>
            )}
            {photo.positiveFindings?.length > 0 && (
              <div style={{ padding: '12px 14px', borderRadius: 8, marginTop: 4, background: 'var(--accent-success-bg)', border: '1px solid var(--accent-success)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--success-600)', marginBottom: 8, fontFamily: 'Manrope, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} aria-hidden="true" /> Compliant Features Observed
                </p>
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {photo.positiveFindings.map((f, fi) => (
                    <li key={fi} style={{ fontSize: 12, color: 'var(--body)', lineHeight: 1.6, marginBottom: 2, fontFamily: 'Manrope, sans-serif' }}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      ))}
      <aside aria-label="Legal disclaimer" style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--banner-info-bg)', border: '1px solid var(--banner-info-border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <Info size={16} aria-hidden="true" style={{ color: 'var(--banner-info-text)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 12, color: 'var(--banner-info-text)', lineHeight: 1.6, margin: 0, fontFamily: 'Manrope, sans-serif' }}>
          <strong>Disclaimer:</strong> This AI-powered analysis is informational only and does not constitute a professional ADA inspection or legal advice. Actual compliance determinations require on-site assessment by a qualified ADA consultant. For legal guidance, connect with an attorney through ADA Legal Link.
        </p>
      </aside>
    </section>
  );
}

export default function AdminPhotoAnalyzer() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [locationLabel, setLocationLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();
  const resultsRef = useRef();
  const errorRef = useRef();

  useEffect(() => {
    async function init() {
      try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') { window.location.href = createPageUrl('Home'); return; }
      } catch (e) { window.location.href = createPageUrl('Home'); return; }
      setPageLoading(false);
      loadHistory();
    }
    init();
  }, []);

  useEffect(() => { if (error && errorRef.current) errorRef.current.focus(); }, [error]);

  async function loadHistory() {
    setHistoryLoading(true);
    try { setHistory((await base44.entities.PhotoAnalysis.list('-created_date', 50)) || []); }
    catch (e) { console.warn('History load failed:', e); }
    setHistoryLoading(false);
  }

  function handleFiles(incoming) {
    const valid = Array.from(incoming).filter(f => f.type.startsWith('image/')).slice(0, 5);
    setFiles(valid);
    setResult(null); setSelectedRecord(null); setError('');
    previews.forEach(u => URL.revokeObjectURL(u));
    setPreviews(valid.map(f => URL.createObjectURL(f)));
  }

  function removeFile(idx) {
    URL.revokeObjectURL(previews[idx]);
    setFiles(files.filter((_, i) => i !== idx));
    setPreviews(previews.filter((_, i) => i !== idx));
  }

  const handleDrop = useCallback(e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }, [previews]);

  async function runAnalysis() {
    if (!files.length) { setError('Please upload at least one photo before running the analysis.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const base64Images = await Promise.all(files.map(f => fileToBase64(f)));
      const content = [
        ...base64Images.map(b64 => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } })),
        { type: 'text', text: 'Please analyze ' + (base64Images.length > 1 ? 'these ' + base64Images.length + ' photos' : 'this photo') + ' for ADA compliance concerns. Location: ' + (locationLabel || 'Not specified') + '.' }
      ];
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: ADA_SYSTEM_PROMPT, messages: [{ role: 'user', content }] })
      });
      const data = await response.json();
      const rawText = data.content?.find(b => b.type === 'text')?.text || '';
      const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      setResult(parsed);
      setTimeout(() => resultsRef.current?.focus(), 100);
      try {
        const saved = await base44.entities.PhotoAnalysis.create({ location_label: locationLabel || 'Unlabeled', photo_count: files.length, analysis_result: parsed, overall_risk: parsed.overallRisk || 'NONE' });
        setHistory(prev => [saved, ...prev]);
        setSelectedRecord(saved);
      } catch (dbErr) { console.warn('DB persist failed:', dbErr); }
    } catch (e) { setError('Analysis failed. Please check your connection and try again.'); console.error(e); }
    setLoading(false);
  }

  function selectRecord(record) {
    setSelectedRecord(record); setResult(record.analysis_result || null);
    setFiles([]); previews.forEach(u => URL.revokeObjectURL(u)); setPreviews([]);
    setLocationLabel(record.location_label || ''); setError('');
  }

  function startNew() {
    setSelectedRecord(null); setResult(null);
    setFiles([]); previews.forEach(u => URL.revokeObjectURL(u)); setPreviews([]);
    setLocationLabel(''); setError('');
  }

  if (pageLoading) return (
    <div role="status" aria-label="Loading ADA Photo Analyzer" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}>
      <div className="a11y-spinner" aria-hidden="true" />
      <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)' }}>Loading…</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: 'var(--slate-50)', minHeight: 'calc(100vh - 200px)', padding: 'clamp(0.75rem, 3vw, 1.5rem)' }}>
      <style>{`
        /* Severity semantic tokens — AAA-verified (≥7:1) in light + dark + high-contrast */
        :root {
          --err-fg: #991B1B; --err-bg: #FEF2F2; --err-bd: #FCA5A5;
          --wrn-fg: #78350F; --wrn-bg: #FFFBEB; --wrn-bd: #FCD34D;
          --inf-fg: #1E3A8A; --inf-bg: #EFF6FF; --inf-bd: #93C5FD;
          --suc-fg: #14532D; --suc-bg: #F0FDF4; --suc-bd: #86EFAC;
        }
        /* Dark mode overrides — sourced from DisplaySettings token map */
        body[data-mode="dark"] :root, html.dark :root,
        [data-display-pref="dark"] {
          --err-fg: #FCA5A5 !important; --err-bg: #3B0808 !important; --err-bd: #7F1D1D !important;
          --wrn-fg: #FDE68A !important; --wrn-bg: #2D1A00 !important; --wrn-bd: #78350F !important;
          --inf-fg: #93C5FD !important; --inf-bg: #0C1A3D !important; --inf-bd: #1E3A8A !important;
          --suc-fg: #86EFAC !important; --suc-bg: #052E16 !important; --suc-bd: #14532D !important;
        }
        /* High contrast */
        @media (prefers-contrast: more) {
          :root {
            --err-fg: #7F0000 !important; --err-bg: #FFF0F0 !important; --err-bd: #7F0000 !important;
            --wrn-fg: #4A2000 !important; --wrn-bg: #FFFAEB !important; --wrn-bd: #4A2000 !important;
            --inf-fg: #001A7F !important; --inf-bg: #EFF4FF !important; --inf-bd: #001A7F !important;
            --suc-fg: #004020 !important; --suc-bg: #F0FFF5 !important; --suc-bd: #004020 !important;
          }
          button, input, textarea { border-width: 2px !important; }
        }
        /* Focus ring — consistent with globals.css */
        *:focus-visible { outline: 3px solid var(--accent-light) !important; outline-offset: 2px !important; }
        *:focus:not(:focus-visible) { outline: none !important; }
        .drop-zone:focus-visible { outline: 3px solid var(--accent) !important; outline-offset: 3px !important; }
        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
        /* Responsive grid */
        @media (max-width: 700px) { .photo-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <AdminPageHeader
          title="ADA Photo Analyzer"
          actionButton={selectedRecord ? (
            <button onClick={startNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 20px', minHeight: 44, borderRadius: 8, background: 'var(--accent)', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Manrope, sans-serif' }}>
              <Plus size={16} aria-hidden="true" /> New Analysis
            </button>
          ) : null}
        />

        <div className="photo-grid" style={{ display: 'grid', gridTemplateColumns: 'clamp(240px, 28%, 300px) 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── Sidebar: History ── */}
          <aside aria-label="Analysis history">
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Past Analyses
                </h2>
                <span style={{ fontSize: 11, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif' }}>
                  {history.length} record{history.length !== 1 ? 's' : ''}
                </span>
              </div>
              {historyLoading ? (
                <div role="status" style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div className="a11y-spinner" aria-hidden="true" style={{ width: '1.5rem', height: '1.5rem' }} />
                  <p style={{ fontSize: 13, color: 'var(--body-secondary)', marginTop: 8, fontFamily: 'Manrope, sans-serif' }}>Loading…</p>
                </div>
              ) : history.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--body-secondary)', textAlign: 'center', padding: '24px 0', fontFamily: 'Manrope, sans-serif' }}>
                  No analyses yet. Upload photos to get started.
                </p>
              ) : (
                <div role="list" aria-label="Past analyses">
                  {history.map(r => <div key={r.id} role="listitem"><HistoryRow record={r} onSelect={selectRecord} isSelected={selectedRecord?.id === r.id} /></div>)}
                </div>
              )}
            </div>
          </aside>

          {/* ── Main: Upload + Results ── */}
          <main aria-label="Photo analysis workspace">

            {/* Upload panel */}
            {!selectedRecord && (
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', fontFamily: 'Fraunces, serif' }}>
                  New Analysis
                </h2>

                {/* Location label */}
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="location-label" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 6, fontFamily: 'Manrope, sans-serif' }}>
                    Location Label
                  </label>
                  <input
                    id="location-label"
                    type="text"
                    value={locationLabel}
                    onChange={e => setLocationLabel(e.target.value)}
                    placeholder="e.g. Desert Valley Medical — Main Entrance"
                    aria-describedby="location-hint"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', minHeight: 44, borderRadius: 8, fontFamily: 'Manrope, sans-serif', fontSize: 14, background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--body)', outline: 'none' }}
                  />
                  <p id="location-hint" style={{ fontSize: 12, color: 'var(--body-secondary)', margin: '4px 0 0', fontFamily: 'Manrope, sans-serif' }}>
                    Optional — helps identify this analysis in your history.
                  </p>
                </div>

                {/* Drop zone */}
                <div
                  className="drop-zone"
                  role="button"
                  tabIndex={0}
                  aria-label="Upload photos. Click or drag and drop up to 5 images."
                  aria-describedby="upload-hint"
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                  style={{ border: '2px dashed ' + (dragOver ? 'var(--accent)' : 'var(--slate-200)'), borderRadius: 10, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'var(--card-bg-tinted)' : 'var(--page-bg-subtle)' }}
                >
                  <Camera size={32} aria-hidden="true" style={{ color: 'var(--terra-400)', marginBottom: 10 }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', margin: '0 0 4px', fontFamily: 'Manrope, sans-serif' }}>
                    Drop photos here or click to upload
                  </p>
                  <p id="upload-hint" style={{ fontSize: 12, color: 'var(--body-secondary)', margin: 0, fontFamily: 'Manrope, sans-serif' }}>
                    Up to 5 images — entrances, parking, restrooms, signage, pathways
                  </p>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple aria-label="Choose photos to upload" onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
                </div>

                {/* Previews */}
                {previews.length > 0 && (
                  <div role="list" aria-label="Selected photos" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                    {previews.map((url, i) => (
                      <div key={i} role="listitem" style={{ position: 'relative' }}>
                        <img src={url} alt={'Selected photo ' + (i + 1) + ': ' + (files[i]?.name || '')} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--card-border)', display: 'block' }} />
                        <button onClick={() => removeFile(i)} aria-label={'Remove photo ' + (i + 1)} style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, minWidth: 24, minHeight: 24, borderRadius: '50%', background: '#DC2626', border: '2px solid var(--surface)', color: '#FFFFFF', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <X size={12} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div ref={errorRef} role="alert" tabIndex={-1} style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--err-bg)', border: '1px solid var(--err-bd)', display: 'flex', gap: 8, alignItems: 'flex-start', outline: 'none' }}>
                    <AlertTriangle size={16} aria-hidden="true" style={{ color: 'var(--err-fg)', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: 'var(--err-fg)', margin: 0, fontFamily: 'Manrope, sans-serif' }}>{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={runAnalysis}
                  disabled={loading || !files.length}
                  aria-busy={loading}
                  aria-disabled={!files.length}
                  style={{ marginTop: 18, width: '100%', minHeight: 48, borderRadius: 8, fontWeight: 700, fontSize: '0.9375rem', fontFamily: 'Manrope, sans-serif', cursor: loading || !files.length ? 'not-allowed' : 'pointer', background: loading || !files.length ? 'var(--slate-300)' : 'var(--accent)', color: loading || !files.length ? 'var(--slate-700)' : '#FFFFFF', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading
                    ? <><div className="a11y-spinner" aria-hidden="true" style={{ width: '1rem', height: '1rem', borderWidth: 2 }} /> Analyzing…</>
                    : <><Upload size={17} aria-hidden="true" /> Analyze Photos</>}
                </button>
              </div>
            )}

            {/* Viewing a saved record */}
            {selectedRecord && (
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', fontFamily: 'Fraunces, serif' }}>
                    {selectedRecord.location_label || 'Unlabeled Analysis'}
                  </h2>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} aria-hidden="true" />
                    <time dateTime={selectedRecord.created_date}>{formatDate(selectedRecord.created_date)}</time>
                    {' · '}{selectedRecord.photo_count} photo{selectedRecord.photo_count !== 1 ? 's' : ''}
                  </p>
                </div>
                <button onClick={startNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 20px', minHeight: 44, borderRadius: 8, background: 'var(--accent)', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Manrope, sans-serif' }}>
                  <Plus size={16} aria-hidden="true" /> New Analysis
                </button>
              </div>
            )}

            {/* Results */}
            {result && (
              <div ref={resultsRef} tabIndex={-1} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: 20, outline: 'none' }}>
                <AnalysisResults result={result} />
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && !selectedRecord && (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10 }}>
                <Camera size={48} aria-hidden="true" style={{ color: 'var(--slate-400)', marginBottom: 16 }} />
                <p style={{ fontSize: 14, color: 'var(--body-secondary)', maxWidth: 380, margin: '0 auto', fontFamily: 'Manrope, sans-serif', lineHeight: 1.6 }}>
                  Upload photos of a physical location to receive an AI-powered ADA compliance assessment, or select a past analysis from the history panel.
                </p>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
