import React, { useState, useRef, useEffect, useCallback } from 'react';
const GB_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#609-grab-bars';
const CALLOUTS = [
  { id: 1, label: 'Size & Mounting', section: '\u00a7609.2', color: '#C2410C', textColor: '#7C2D12', x: 170, y: 52, plain: 'Circular grab bars must be 1\u00bc to 2 inches in diameter. Non-circular bars must have a perimeter of 4 to 6\u00bc inches with a cross-section no larger than 2\u00bc inches. The bar must be mounted 33\u201336 inches above the floor. Wall clearance must be exactly 1\u00bd inches \u2014 enough to grip comfortably but not so much that an arm could slip through and get trapped.', legal: '\u201CCircular: 1\u00bc inches minimum and 2 inches maximum.\u201D Non-circular: \u201Cperimeter 4 inches minimum and 6\u00bc inches maximum.\u201D Height: \u201C33 inches minimum and 36 inches maximum.\u201D Clearance: \u201C1\u00bd inches.\u201D', citation: '\u00a7609.2, \u00a7609.3, \u00a7609.4' },
  { id: 2, label: 'Strength & Safety', section: '\u00a7609.8', color: '#15803D', textColor: '#14532D', x: 540, y: 52, plain: 'Grab bars must resist 250 pounds of force applied at any point in any direction. The bar must not rotate within its fittings \u2014 a spinning bar is worse than no bar. Surfaces must be smooth with no sharp or abrasive elements. The space between the bar and wall must be free of any protruding brackets, bolt heads, or rough surfaces that could injure hands or arms.', legal: '\u201CGrab bars shall be capable of resisting a vertical or horizontal force of 250 pounds applied at any point.\u201D \u201CGrab bars shall not rotate within their fittings.\u201D \u201CGripping surfaces shall be continuous along their length and shall not be obstructed.\u201D', citation: '\u00a7609.8, \u00a7609.5, \u00a7609.6' }
];
function makeLink(t) { return (<a href={GB_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) { if (!callout) return null; return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'gbFade 0.25s ease-out' }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}><span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span><span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span></div><button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">{'\u2715'}</span></button></div><div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}><div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div><aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p></div></aside></div></div>); }
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="gb-focus-ring" /></g>)); }

export default function GrabBarDetailDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Grab Bar Details</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>{['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}</div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 340" role="img" aria-labelledby="gb-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="gb-title">Grab Bar Cross-Section and Mounting Details</title>
          <rect width="720" height="340" fill="var(--page-bg-subtle)" />
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Cross-section</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Safety requirements</text>

          {/* LEFT: Cross-section */}
          <rect x="60" y="70" width="12" height="200" fill="#CBD5E1" rx="2" />
          <text x="48" y="170" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8" fontWeight="600">wall</text>
          {/* Clearance */}
          <line x1="72" y1="155" x2="108" y2="155" stroke="#15803D" strokeWidth="1" strokeDasharray="3 2" />
          <rect x="74" y="160" width="34" height="16" rx="4" fill="#15803D" />
          <text x="91" y="172" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('1\u00bd', '38')}</text>
          <text x="91" y="190" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="500">clearance</text>
          {/* Bar circle */}
          <circle cx="145" cy="155" r="25" fill="#C2410C" opacity="0.08" stroke="#C2410C" strokeWidth="2.5" />
          <line x1="120" y1="155" x2="170" y2="155" stroke="#C2410C" strokeWidth="1" />
          <rect x="110" y="198" width="70" height="20" rx="6" fill="#C2410C" />
          <text x="145" y="212" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('1\u00bc', '32')}{'\u2013'}{d('2', '51')}</text>
          <text x="145" y="232" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="500">diameter</text>
          {/* Height from floor */}
          <rect x="210" y="100" width="100" height="22" rx="6" fill="#7C3AED" opacity="0.08" stroke="#7C3AED" strokeWidth="1" />
          <text x="260" y="115" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="600">{d('33', '840')}{'\u2013'}{d('36', '915')} high</text>
          <text x="260" y="135" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">above floor</text>

          {/* DIVIDER */}
          <line x1="360" y1="40" x2="360" y2="320" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Safety */}
          <rect x="400" y="65" width="280" height="50" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="540" y="86" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">Must hold 250 lbs in any direction</text>
          <text x="540" y="103" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">structural anchoring is critical</text>
          <rect x="400" y="128" width="280" height="50" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="540" y="149" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">{'\u2718'} Must NOT rotate in fittings</text>
          <text x="540" y="166" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">a spinning bar is worse than no bar</text>
          <rect x="400" y="191" width="280" height="50" rx="10" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5" />
          <text x="540" y="212" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">Smooth surface, no sharp edges</text>
          <text x="540" y="229" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">no bolt heads or rough brackets in grip zone</text>
          <rect x="400" y="254" width="280" height="40" rx="10" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="540" y="278" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">Continuous grip {'\u2014'} no breaks along length</text>

          <Dots callouts={CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="332" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Grab Bars</p>
        <KeyFact color="#C2410C" number={`${d('1\u00bc', '32')}\u2013${d('2', '51')}`}>Round bar diameter</KeyFact>
        <KeyFact color="#15803D" number={d('1\u00bd', '38')}>Wall clearance (exactly)</KeyFact>
        <KeyFact color="#7C3AED" number={`${d('33', '840')}\u2013${d('36', '915')}`}>Mounting height above floor</KeyFact>
        <KeyFact color="#C2410C" number="250 lbs">Must resist this force at any point, any direction</KeyFact>
      </div>
      <style>{`
        @keyframes gbFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .gb-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
