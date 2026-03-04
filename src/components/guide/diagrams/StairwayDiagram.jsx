import React, { useState, useRef, useEffect, useCallback } from 'react';

const STAIR_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#504-stairways';

const STEP_CALLOUTS = [
  {
    id: 1, label: 'Treads, Risers & Nosings', section: '\u00a7504.2',
    color: '#C2410C', textColor: '#7C2D12', x: 170, y: 52,
    plain: 'All treads must be at least 11 inches deep, and all risers between 4 and 7 inches high. Every step in a flight must be uniform \u2014 no variation in height or depth. Open risers are NOT permitted because feet and cane tips can slip through. The leading edge (nosing) must be curved or beveled, never sharp. Nosings can project a maximum of 1.5 inches and must have an underside angle of at least 60\u00b0.',
    legal: '\u201CTreads shall be 11 inches deep minimum.\u201D \u201CRisers shall be 4 inches high minimum and 7 inches high maximum.\u201D \u201COpen risers are not permitted.\u201D \u201CThe radius of curvature at the leading edge shall be \u00bd inch maximum.\u201D',
    citation: '\u00a7504.2, \u00a7504.3, \u00a7504.4, \u00a7504.5'
  },
  {
    id: 2, label: 'Handrails & Wet Conditions', section: '\u00a7504.6',
    color: '#15803D', textColor: '#14532D', x: 540, y: 52,
    plain: 'Handrails must be on both sides, 34\u201338 inches above stair nosings, continuous for the full flight length. At the top, rails extend 12 inches horizontally beyond the top riser. At the bottom, rails extend at the stair slope for one tread depth, then 12 inches horizontally. Outdoor stairs or any stairs that may get wet must have contrast strips on each tread edge for people with low vision.',
    legal: '\u201CStairs shall have handrails complying with \u00a7505.\u201D Height: \u201C34 inches minimum and 38 inches maximum above stair nosings.\u201D Top extension: \u201C12 inches horizontally.\u201D \u00a7504.7: Wet conditions require visual contrast at leading edges.',
    citation: '\u00a7504.6, \u00a7505, \u00a7504.7'
  }
];

function makeLink(t) { return (<a href={STAIR_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (
    <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'stairFade 0.25s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span>
        </div>
        <button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">{'\u2715'}</span></button>
      </div>
      <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
        <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div>
        <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p>
        </div></aside>
      </div>
    </div>
  );
}

function KeyFact({ color, number, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}>
      <span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span>
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

function Dots({ callouts, active, toggle }) {
  return callouts.map(c => (
    <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
      {active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}
      <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
      <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
      <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="stair-focus-ring" />
    </g>
  ));
}

export default function StairwayDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback((id) => setActive(prev => prev === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}\u2033`;
  const ac = STEP_CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Steps & Safety</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="stair-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="stair-title">Stairway Requirements {'\u2014'} Treads, Risers, Nosings, Handrails</title>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />

          <text x="190" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">What each step looks like</text>
          <text x="560" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Handrail extensions</text>

          {/* LEFT: Step cross-section */}
          {/* Stairs (3 steps) */}
          <line x1="60" y1="310" x2="140" y2="310" stroke="#475569" strokeWidth="2.5" />
          <line x1="140" y1="310" x2="140" y2="250" stroke="#475569" strokeWidth="2.5" />
          <line x1="140" y1="250" x2="220" y2="250" stroke="#475569" strokeWidth="2.5" />
          <line x1="220" y1="250" x2="220" y2="190" stroke="#475569" strokeWidth="2.5" />
          <line x1="220" y1="190" x2="300" y2="190" stroke="#475569" strokeWidth="2.5" />
          <line x1="300" y1="190" x2="300" y2="130" stroke="#475569" strokeWidth="2.5" />
          <line x1="300" y1="130" x2="360" y2="130" stroke="#475569" strokeWidth="2.5" />

          {/* Tread depth dimension (bottom step) */}
          <line x1="60" y1="320" x2="140" y2="320" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="60" y1="315" x2="60" y2="325" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="140" y1="315" x2="140" y2="325" stroke="#C2410C" strokeWidth="1.2" />
          <rect x="65" y="328" width="66" height="18" rx="5" fill="#C2410C" />
          <text x="98" y="341" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('11', '280')} min</text>
          <text x="98" y="360" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="500">tread depth</text>

          {/* Riser height dimension */}
          <line x1="150" y1="250" x2="150" y2="310" stroke="#15803D" strokeWidth="1.2" />
          <line x1="145" y1="250" x2="155" y2="250" stroke="#15803D" strokeWidth="1.2" />
          <line x1="145" y1="310" x2="155" y2="310" stroke="#15803D" strokeWidth="1.2" />
          <rect x="158" y="268" width="58" height="18" rx="5" fill="#15803D" />
          <text x="187" y="281" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('4', '100')}{'\u2013'}{d('7', '178')}</text>
          <text x="187" y="300" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="500">riser height</text>

          {/* Nosing detail callout */}
          <circle cx="140" cy="250" r="12" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 2" />
          <line x1="148" y1="240" x2="240" y2="160" stroke="#2563EB" strokeWidth="1" />
          <text x="245" y="156" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A" fontWeight="600">rounded nosing</text>
          <text x="245" y="170" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">{'\u2264'} 1{'\u00bd'}{'\u2033'} projection</text>

          {/* NO open risers */}
          <rect x="60" y="80" width="160" height="40" rx="8" fill="#C2410C" opacity="0.05" stroke="#C2410C" strokeWidth="1.5" />
          <text x="140" y="98" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">{'\u2718'} No open risers</text>
          <text x="140" y="114" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">canes and feet get caught</text>


          {/* DIVIDER */}
          <line x1="380" y1="40" x2="380" y2="360" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: Handrail with extensions */}
          {/* Stair profile (simplified) */}
          <line x1="460" y1="300" x2="500" y2="300" stroke="#475569" strokeWidth="2" />
          <line x1="500" y1="300" x2="500" y2="260" stroke="#475569" strokeWidth="2" />
          <line x1="500" y1="260" x2="540" y2="260" stroke="#475569" strokeWidth="2" />
          <line x1="540" y1="260" x2="540" y2="220" stroke="#475569" strokeWidth="2" />
          <line x1="540" y1="220" x2="580" y2="220" stroke="#475569" strokeWidth="2" />
          <line x1="580" y1="220" x2="580" y2="180" stroke="#475569" strokeWidth="2" />
          <line x1="580" y1="180" x2="640" y2="180" stroke="#475569" strokeWidth="2" />

          {/* Handrail line */}
          <line x1="488" y1="260" x2="568" y2="140" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />

          {/* Top 12" extension */}
          <line x1="568" y1="140" x2="650" y2="140" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
          <line x1="568" y1="150" x2="650" y2="150" stroke="#7C3AED" strokeWidth="1" />
          <rect x="580" y="118" width="60" height="18" rx="5" fill="#7C3AED" />
          <text x="610" y="131" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('12', '305')} ext.</text>
          <text x="610" y="108" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="500">top extension</text>

          {/* Bottom extension (follows slope then horizontal) */}
          <line x1="488" y1="260" x2="460" y2="290" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
          <line x1="460" y1="290" x2="410" y2="290" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
          <rect x="408" y="296" width="60" height="18" rx="5" fill="#7C3AED" />
          <text x="438" y="309" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('12', '305')} ext.</text>
          <text x="438" y="326" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="500">bottom extension</text>

          {/* Height dimension */}
          <line x1="545" y1="175" x2="545" y2="220" stroke="#7C3AED" strokeWidth="1" strokeDasharray="3 2" />
          <rect x="395" y="80" width="170" height="22" rx="6" fill="#7C3AED" opacity="0.08" stroke="#7C3AED" strokeWidth="1" />
          <text x="480" y="95" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="600">{d('34', '865')}{'\u2013'}{d('38', '965')} above nosings</text>

          {/* Both sides note */}
          <text x="540" y="348" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="600">required on both sides, continuous</text>

          <Dots callouts={STEP_CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="370" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Stairways</p>
        <KeyFact color="#C2410C" number={d('11', '280')}>Minimum tread depth</KeyFact>
        <KeyFact color="#15803D" number={`${d('4', '100')}\u2013${d('7', '178')}`}>Riser height range (must be uniform within a flight)</KeyFact>
        <KeyFact color="#7C3AED" number={d('12', '305')}>Handrail extension beyond top and bottom</KeyFact>
        <KeyFact color="#C2410C" number="No open">Open risers are not permitted on accessible routes</KeyFact>
      </div>

      <style>{`
        @keyframes stairFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .stair-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
