import React, { useState, useRef, useEffect, useCallback } from 'react';

const UR_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#605-urinals';
const CALLOUTS = [
  { id: 1, label: 'Height & Clear Space', section: '\u00a7605.2', color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52,
    plain: 'The rim of an accessible urinal must be no higher than 17 inches above the floor. Wall-hung stall-type urinals that extend to the floor are preferred. A clear floor space of at least 30\u00d748 inches must be provided for a forward approach, centered on the urinal. The floor must be level (max 1:48) and slip-resistant.', legal: '\u201CUrinals shall be the stall-type or wall-hung type with the rim 17 inches maximum above the finish floor.\u201D Clear floor space: \u201C30\u00d748 inches for forward approach.\u201D', citation: '\u00a7605.2, \u00a7605.3' },
  { id: 2, label: 'Flush Controls & Shields', section: '\u00a7605.4', color: '#15803D', textColor: '#14532D', x: 470, y: 52,
    plain: 'Flush controls must be operable with one hand, no tight grasping or twisting, 5 pounds max force. Manual controls must be no higher than 44 inches. Automatic sensor flush valves comply. Privacy shields between urinals must not extend beyond the rim or reduce the 30-inch clear floor space. The accessible urinal should be at the end of a row for easier side approach.', legal: '\u201CFlush controls shall be hand operated or automatic and shall comply with \u00a7309. Flush controls shall be 44 inches maximum above the floor.\u201D', citation: '\u00a7605.4' }
];
function makeLink(t) { return (<a href={UR_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) { if (!callout) return null; return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'urFade 0.25s ease-out' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span><span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span></div><button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">{'\u2715'}</span></button></div><div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}><div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div><aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p></div></aside></div></div>); }
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="22" fill="none" stroke="transparent" strokeWidth="2" className="ur-focus-ring" /></g>)); }

export default function UrinalDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback((id) => setActive(prev => prev === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}\u2033`;
  const ac = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Accessible Urinal</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 340" role="img" aria-labelledby="ur-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="ur-title">Accessible Urinal Requirements</title>
          <rect width="720" height="340" fill="var(--page-bg-subtle)" />

          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Side view</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">What to check</text>

          {/* LEFT: Side view */}
          {/* Wall */}
          <rect x="170" y="60" width="10" height="230" fill="#CBD5E1" rx="2" />

          {/* Urinal */}
          <rect x="180" y="130" width="50" height="160" rx="4" fill="#C2410C" opacity="0.06" stroke="#C2410C" strokeWidth="1.5" />
          <text x="205" y="200" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="500">urinal</text>

          {/* Rim at 17" */}
          <line x1="180" y1="130" x2="250" y2="130" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="260" y1="130" x2="260" y2="290" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="254" y1="130" x2="266" y2="130" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="254" y1="290" x2="266" y2="290" stroke="#C2410C" strokeWidth="1.2" />
          <rect x="268" y="200" width="70" height="20" rx="6" fill="#C2410C" />
          <text x="303" y="214" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('17', '430')} max</text>
          <text x="303" y="232" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="500">rim height</text>

          {/* Flush control */}
          <rect x="182" y="90" width="16" height="16" rx="3" fill="#15803D" opacity="0.15" stroke="#15803D" strokeWidth="1" />
          <line x1="210" y1="98" x2="260" y2="98" stroke="#15803D" strokeWidth="1" strokeDasharray="3 2" />
          <text x="290" y="95" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">{d('44', '1120')} max</text>
          <text x="290" y="109" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D">flush controls</text>

          {/* Floor */}
          <line x1="50" y1="290" x2="340" y2="290" stroke="#94A3B8" strokeWidth="2" />

          {/* Clear floor space */}
          <rect x="80" y="240" width="100" height="48" rx="2" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" />
          <text x="130" y="270" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">30{'\u2033'}{'\u00d7'}48{'\u2033'}</text>


          {/* DIVIDER */}
          <line x1="370" y1="20" x2="370" y2="320" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: Checklist */}
          <rect x="400" y="70" width="280" height="50" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="540" y="92" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">Rim no higher than {d('17', '430')}</text>
          <text x="540" y="108" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">stall-type (floor-length) preferred</text>

          <rect x="400" y="135" width="280" height="50" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="540" y="157" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Flush: one hand, {'\u2264'} 5 lbs or auto</text>
          <text x="540" y="173" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">manual controls at {d('44', '1120')} max</text>

          <rect x="400" y="200" width="280" height="50" rx="10" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="540" y="222" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">30{'\u2033'} {'\u00d7'} 48{'\u2033'} clear floor space</text>
          <text x="540" y="238" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">forward approach, centered on urinal</text>

          <rect x="400" y="265" width="280" height="40" rx="10" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="540" y="289" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">Place at end of row for easier approach</text>

          <Dots callouts={CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="330" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Urinals</p>
        <KeyFact color="#C2410C" number={`\u2264 ${d('17', '430')}`}>Maximum rim height above floor</KeyFact>
        <KeyFact color="#15803D" number={`\u2264 ${d('44', '1120')}`}>Maximum height for manual flush controls</KeyFact>
        <KeyFact color="#2563EB" number={`30\u2033\u00d748\u2033`}>Clear floor space for forward approach</KeyFact>
      </div>

      <style>{`
        @keyframes urFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .ur-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
