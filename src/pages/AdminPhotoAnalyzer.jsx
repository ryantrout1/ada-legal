import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const SEVERITY_CONFIG = {
  HIGH:   { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)',   label: 'HIGH' },
  MEDIUM: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  label: 'MED'  },
  LOW:    { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  label: 'LOW'  },
};

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
      "positiveFindings": ["Compliant feature 1", "Compliant feature 2"]
    }
  ]
}

Key ADA standards: door clearance min 32" (§404.2.3), ramp slope max 1:12 (§405.2), accessible parking van-accessible 132" + 96" aisle (§502.2), pathway width min 36" (§403.5.1), threshold max 1/2" (§404.2.5), counter height max 36" (§904.4), tactile/Braille signage at permanent rooms (§703.1).

Important: This is informational only, not a professional inspection. Be thorough but measured.`;

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
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.LOW;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 4, padding: '2px 7px', letterSpacing: '0.05em' }}>
      {cfg.label}
    </span>
  );
}

function RiskPill({ risk }) {
  const cfg = SEVERITY_CONFIG[risk] || { color: '#22C55E', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', label: 'NONE' };
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 6, padding: '3px 10px' }}>
      {risk || 'NONE'}
    </span>
  );
}

// ── History Row ────────────────────────────────────────────────────────────────
function HistoryRow({ record, onSelect, isSelected }) {
  const result = record.analysis_result || {};
  return (
    <div
      onClick={() => onSelect(record)}
      style={{
        padding: '12px 16px', borderRadius: 8, cursor: 'pointer', marginBottom: 6,
        background: isSelected ? 'rgba(251,176,64,0.08)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isSelected ? 'rgba(251,176,64,0.4)' : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {record.location_label || 'Unlabeled'}
          </div>
          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
            {formatDate(record.created_date)} · {record.photo_count || 1} photo{record.photo_count !== 1 ? 's' : ''}
          </div>
        </div>
        <RiskPill risk={result.overallRisk} />
      </div>
      {result.summary && (
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {result.summary}
        </div>
      )}
    </div>
  );
}

// ── Analysis Results ───────────────────────────────────────────────────────────
function AnalysisResults({ result, photoFiles }) {
  if (!result) return null;
  const totalConcerns = result.photos?.reduce((s, p) => s + (p.concerns?.length || 0), 0) || 0;
  const highCount = result.photos?.reduce((s, p) => s + (p.concerns?.filter(c => c.severity === 'HIGH').length || 0), 0) || 0;

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <RiskPill risk={result.overallRisk} />
        <span style={{ fontSize: 13, color: '#94A3B8' }}>{totalConcerns} concern{totalConcerns !== 1 ? 's' : ''} found</span>
        {highCount > 0 && <span style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>⚠ {highCount} high severity</span>}
      </div>
      {result.summary && (
        <div style={{ fontSize: 14, color: '#CBD5E1', lineHeight: 1.6, marginBottom: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
          {result.summary}
        </div>
      )}

      {/* Per-photo results */}
      {result.photos?.map((photo, idx) => (
        <div key={idx} style={{ marginBottom: 20, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 13, fontWeight: 600, color: '#94A3B8', fontFamily: 'Manrope, sans-serif' }}>
            Photo {idx + 1}
          </div>
          <div style={{ padding: '12px 14px' }}>
            <p style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 12, lineHeight: 1.5 }}>{photo.description}</p>

            {photo.concerns?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                {photo.concerns.map((c, ci) => (
                  <div key={ci} style={{ marginBottom: 8, padding: '10px 12px', borderRadius: 8, background: SEVERITY_CONFIG[c.severity]?.bg || 'rgba(255,255,255,0.04)', border: `1px solid ${SEVERITY_CONFIG[c.severity]?.border || 'rgba(255,255,255,0.08)'}` }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <SeverityBadge severity={c.severity} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{c.title}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#94A3B8', margin: '4px 0', lineHeight: 1.5 }}>{c.detail}</p>
                    {c.remediation && (
                      <p style={{ fontSize: 12, color: '#6EE7B7', margin: '4px 0 0', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600 }}>Fix: </span>{c.remediation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {photo.positiveFindings?.length > 0 && (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#86EFAC', marginBottom: 6 }}>✅ Compliant Features</p>
                {photo.positiveFindings.map((f, fi) => (
                  <p key={fi} style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0' }}>• {f}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}

      <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.12)', fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
        <strong style={{ color: '#94A3B8' }}>Disclaimer:</strong> This AI-powered analysis is informational only and does not constitute a professional ADA inspection or legal advice. Actual compliance determinations require on-site assessment by a qualified ADA consultant.
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminPhotoAnalyzer() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [locationLabel, setLocationLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef();
  const dropRef = useRef();

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const records = await base44.entities.PhotoAnalysis.list('-created_date', 50);
      setHistory(records || []);
    } catch (e) {
      console.warn('Could not load history:', e);
    }
    setHistoryLoading(false);
  }

  function handleFiles(incoming) {
    const valid = [...incoming].filter(f => f.type.startsWith('image/')).slice(0, 5);
    setFiles(valid);
    setResult(null);
    setSelectedRecord(null);
    setError('');
    const urls = valid.map(f => URL.createObjectURL(f));
    setPreviews(urls);
  }

  const handleDrop = useCallback(e => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, []);

  async function runAnalysis() {
    if (!files.length) { setError('Please upload at least one photo.'); return; }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const base64Images = await Promise.all(files.map(f => fileToBase64(f)));

      const content = [
        ...base64Images.map(b64 => ({
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: b64 }
        })),
        { type: 'text', text: `Please analyze ${base64Images.length > 1 ? `these ${base64Images.length} photos` : 'this photo'} for ADA compliance concerns. Location: ${locationLabel || 'Not specified'}.` }
      ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: ADA_SYSTEM_PROMPT,
          messages: [{ role: 'user', content }]
        })
      });

      const data = await response.json();
      const rawText = data.content?.find(b => b.type === 'text')?.text || '';
      const clean = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);

      // Persist to DB
      try {
        const saved = await base44.entities.PhotoAnalysis.create({
          location_label: locationLabel || 'Unlabeled',
          photo_count: files.length,
          analysis_result: parsed,
          overall_risk: parsed.overallRisk || 'NONE',
        });
        setHistory(prev => [saved, ...prev]);
        setSelectedRecord(saved);
      } catch (dbErr) {
        console.warn('Could not persist to DB:', dbErr);
      }

    } catch (e) {
      setError('Analysis failed. Check your connection and try again.');
      console.error(e);
    }
    setLoading(false);
  }

  function selectRecord(record) {
    setSelectedRecord(record);
    setResult(record.analysis_result || null);
    setFiles([]);
    setPreviews([]);
    setLocationLabel(record.location_label || '');
  }

  function startNew() {
    setSelectedRecord(null);
    setResult(null);
    setFiles([]);
    setPreviews([]);
    setLocationLabel('');
    setError('');
  }

  const isDark = '#1A1F2E';

  return (
    <div style={{ minHeight: '100vh', background: '#0F1623', fontFamily: 'Manrope, sans-serif', color: '#E2E8F0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#E2E8F0', margin: 0, letterSpacing: '-0.02em' }}>
            ♿ ADA Photo Analyzer
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: '6px 0 0' }}>
            Upload photos of physical locations to get an AI-powered ADA compliance assessment.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start' }}>

          {/* ── Left: History sidebar ── */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>History</span>
              <button onClick={startNew} style={{ fontSize: 12, fontWeight: 600, color: '#FBB040', background: 'rgba(251,176,64,0.1)', border: '1px solid rgba(251,176,64,0.3)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
                + New
              </button>
            </div>

            {historyLoading ? (
              <div style={{ fontSize: 13, color: '#475569', textAlign: 'center', padding: '20px 0' }}>Loading…</div>
            ) : history.length === 0 ? (
              <div style={{ fontSize: 13, color: '#475569', textAlign: 'center', padding: '20px 0' }}>No analyses yet</div>
            ) : (
              history.map(r => (
                <HistoryRow key={r.id} record={r} onSelect={selectRecord} isSelected={selectedRecord?.id === r.id} />
              ))
            )}
          </div>

          {/* ── Right: Upload + Results ── */}
          <div>
            {/* Upload area — only shown when not viewing a history record */}
            {!selectedRecord && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20, marginBottom: 20 }}>

                {/* Location label */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location Label</label>
                  <input
                    value={locationLabel}
                    onChange={e => setLocationLabel(e.target.value)}
                    placeholder="e.g. Desert Valley Medical — Main Entrance"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#E2E8F0', fontSize: 14, fontFamily: 'Manrope, sans-serif', outline: 'none' }}
                  />
                </div>

                {/* Drop zone */}
                <div
                  ref={dropRef}
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed rgba(251,176,64,0.3)', borderRadius: 10, padding: '32px 20px',
                    textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                    background: files.length ? 'rgba(251,176,64,0.04)' : 'transparent',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(251,176,64,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = files.length ? 'rgba(251,176,64,0.04)' : 'transparent'}
                >
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#CBD5E1', margin: '0 0 4px' }}>Drop photos here or click to upload</p>
                  <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>Up to 5 photos — entrances, parking, restrooms, signage, pathways</p>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
                </div>

                {/* Previews */}
                {previews.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                    {previews.map((url, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={url} alt={`preview ${i + 1}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)' }} />
                        <button
                          onClick={e => { e.stopPropagation(); const nf = files.filter((_, fi) => fi !== i); handleFiles(nf); }}
                          style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#EF4444', border: 'none', color: 'white', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}

                {error && <p style={{ fontSize: 13, color: '#EF4444', marginTop: 12 }}>{error}</p>}

                <button
                  onClick={runAnalysis}
                  disabled={loading || !files.length}
                  style={{
                    marginTop: 16, width: '100%', padding: '12px 0', borderRadius: 8, fontWeight: 700, fontSize: 14,
                    fontFamily: 'Manrope, sans-serif', cursor: loading || !files.length ? 'not-allowed' : 'pointer',
                    background: loading || !files.length ? 'rgba(251,176,64,0.3)' : '#FBB040',
                    color: loading || !files.length ? 'rgba(0,0,0,0.4)' : '#1A1200',
                    border: 'none', transition: 'all 0.2s',
                  }}
                >
                  {loading ? '🔍 Analyzing…' : '🔍 Analyze Photos'}
                </button>
              </div>
            )}

            {/* Viewing history record — header */}
            {selectedRecord && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#E2E8F0' }}>{selectedRecord.location_label || 'Unlabeled'}</div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{formatDate(selectedRecord.created_date)} · {selectedRecord.photo_count} photo{selectedRecord.photo_count !== 1 ? 's' : ''}</div>
                </div>
                <button onClick={startNew} style={{ fontSize: 13, fontWeight: 600, color: '#FBB040', background: 'rgba(251,176,64,0.1)', border: '1px solid rgba(251,176,64,0.3)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
                  + New Analysis
                </button>
              </div>
            )}

            {/* Results */}
            {result && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 20 }}>
                <AnalysisResults result={result} photoFiles={files} />
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && !selectedRecord && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#475569' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
                <p style={{ fontSize: 14 }}>Upload photos above to run your first analysis, or select a past analysis from the history panel.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
