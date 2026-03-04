import React, { useState, useRef, useEffect, useCallback } from 'react';
const BT_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#607-bathtubs';
const CALLOUTS = [
  { id: 1, label: 'Layout & Clearance', section: '\u00a7607.2', color: '#C2410C', textColor: '#7C2D12', x: 170, y: 52, plain: 'Clear floor space of 30\u00d760 inches alongside the full length of the tub is required. A permanent or removable seat at the head end must be at least 15 inches deep. Controls and the shower spray must be on the end wall opposite the seat, between the tub rim and grab bar, so the user can reach them from the seated position without leaning into the water stream.', legal: '\u201CA clearance in front of bathtubs shall extend the length of the bathtub and shall be 30 inches wide minimum.\u201D Seat: \u201C15 inches deep minimum.\u201D Controls: \u201Cinstalled on an end wall.\u201D', citation: '\u00a7607.2, \u00a7607.4, \u00a7607.5' },
  { id: 2, label: 'Grab Bars & Shower Spray', section: '\u00a7607.4', color: '#15803D', textColor: '#14532D', x: 540, y: 52, plain: 'Back wall grab bars span the full length of the tub, 33\u201336 inches above the floor, plus a lower bar 8\u201310 inches above the rim. Head-end wall bars depend on whether there\u2019s a permanent seat. A hand-held shower spray with a 59-inch minimum hose is required \u2014 this lets a seated user direct the water. No shower enclosures that obstruct controls or transfer.', legal: 'Grab bars per \u00a7607.4.1 (with seat) and \u00a7607.4.2 (without seat). \u201CShower spray unit with a hose 59 inches long minimum that can be used both as a fixed-position shower head and as a hand-held shower.\u201D', citation: '\u00a7607.4, \u00a7607.6' }
];
function makeLink(t) { return (<a href={BT_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) { if (!callout) return null; return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'btFade 0.25s ease-out' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span><span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span></div><button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">{'\u2715'}</span></button></div><div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}><div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div><aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p></div></aside></div></div>); }
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="bt-focus-ring" /></g>)); }

export default function BathtubDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Accessible Bathtub</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>{['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}</div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 340" role="img" aria-labelledby="bt-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="bt-title">Accessible Bathtub {'\u2014'} Plan View</title>
          <rect width="720" height="340" fill="var(--page-bg-subtle)" />
          <text x="200" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Plan view (top down)</text>
          <text x="560" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">What to check</text>

          {/* LEFT: Plan view */}
          {/* Tub outline */}
          <rect x="40" y="80" width="250" height="120" rx="6" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="2" />
          <text x="165" y="145" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#C2410C" fontWeight="600">bathtub</text>
          {/* Seat */}
          <rect x="40" y="80" width="50" height="120" rx="4" fill="#7C3AED" opacity="0.06" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="65" y="145" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="600">seat</text>
          {/* Controls on opposite end */}
          <rect x="270" y="120" width="16" height="16" rx="3" fill="#15803D" opacity="0.2" stroke="#15803D" strokeWidth="1" />
          <text x="295" y="118" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">controls</text>
          {/* Grab bars (back wall) */}
          <line x1="50" y1="77" x2="280" y2="77" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
          <text x="165" y="70" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">back wall grab bar</text>
          {/* Clear floor space */}
          <rect x="40" y="210" width="250" height="60" rx="2" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" />
          <text x="165" y="240" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">30{'\u2033'}{'\u00d7'}60{'\u2033'} clear floor space</text>
          <text x="165" y="256" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">full length of tub</text>
          {/* Shower hose note */}
          <rect x="40" y="280" width="220" height="22" rx="6" fill="#B45309" opacity="0.06" stroke="#B45309" strokeWidth="1" />
          <text x="150" y="295" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F" fontWeight="600">hand-held spray: 59{'\u2033'} hose min</text>

          {/* DIVIDER */}
          <line x1="360" y1="40" x2="360" y2="320" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT */}
          <rect x="400" y="60" width="280" height="48" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="540" y="81" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">30{'\u2033'}{'\u00d7'}60{'\u2033'} clear floor alongside tub</text>
          <text x="540" y="98" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">must extend the full tub length</text>
          <rect x="400" y="120" width="280" height="48" rx="10" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="540" y="141" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">Seat at head end: {d('15', '380')} deep min</text>
          <text x="540" y="158" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">permanent or removable</text>
          <rect x="400" y="180" width="280" height="48" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="540" y="201" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Grab bars on back wall + head end</text>
          <text x="540" y="218" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">{d('33', '840')}{'\u2013'}{d('36', '915')} high, plus lower bar at rim</text>
          <rect x="400" y="240" width="280" height="48" rx="10" fill="#B45309" opacity="0.04" stroke="#B45309" strokeWidth="1.5" />
          <text x="540" y="261" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#78350F" fontWeight="600">Hand-held spray: 59{'\u2033'} hose minimum</text>
          <text x="540" y="278" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F">must work as both fixed and hand-held</text>

          <Dots callouts={CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="328" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Bathtubs</p>
        <KeyFact color="#C2410C" number={`30\u2033\u00d760\u2033`}>Clear floor space alongside full tub length</KeyFact>
        <KeyFact color="#7C3AED" number={d('15', '380')}>Minimum seat depth at head end</KeyFact>
        <KeyFact color="#B45309" number={d('59', '1500')}>Minimum shower hose length</KeyFact>
      </div>
      <style>{`
        @keyframes btFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .bt-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
