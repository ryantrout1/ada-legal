import React, { useState, useRef, useEffect, useCallback } from 'react';

const RAIL_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#505-handrails';

const CALLOUTS = [
  {
    id: 1, label: 'Grip Size & Shape', section: '\u00a7505.7',
    color: '#C2410C', textColor: '#7C2D12', x: 170, y: 52,
    plain: 'A circular handrail must have an outside diameter of 1\u00bc to 2 inches. This range lets most people \u2014 including those with limited grip strength \u2014 wrap their fingers comfortably around the rail. Non-circular handrails (oval, rounded rectangle) must have a perimeter between 4 and 6\u00bc inches and a cross-section no larger than 2\u00bc inches. The surface must be smooth with no sharp edges.',
    legal: '\u201CCircular cross sections shall have an outside diameter of 1\u00bc inches minimum and 2 inches maximum.\u201D Non-circular: \u201Ccross-section dimension of 2\u00bc inches maximum\u201D and \u201Cperimeter dimension of 4 inches minimum and 6\u00bc inches maximum.\u201D',
    citation: '\u00a7505.7.1, \u00a7505.7.2'
  },
  {
    id: 2, label: 'Wall Clearance & Mounting', section: '\u00a7505.5',
    color: '#15803D', textColor: '#14532D', x: 540, y: 52,
    plain: 'There must be at least 1\u00bd inches of clear space between the handrail and the wall. This prevents fingers from being pinched or scraped. No exposed bolt heads, rough surfaces, or protruding brackets within the clearance zone. The rail must be continuous for the full length of stair flights and ramp runs \u2014 breaks are only permitted at landing turns where newel posts are used.',
    legal: '\u201CThe clearance between handrail gripping surfaces and adjacent surfaces shall be 1\u00bd inches minimum.\u201D \u00a7505.6: \u201CHandrail gripping surfaces shall be continuous along their full length and shall not be obstructed along their tops or sides.\u201D',
    citation: '\u00a7505.5, \u00a7505.6'
  }
];

function makeLink(t) { return (<a href={RAIL_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (
    <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'railFade 0.25s ease-out' }}>
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
      <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="rail-focus-ring" />
    </g>
  ));
}

export default function HandrailDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Handrail Profiles</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 340" role="img" aria-labelledby="rail-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="rail-title">Handrail Cross-Section Profiles and Wall Clearance</title>
          <rect width="720" height="340" fill="var(--page-bg-subtle)" />

          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Round profile</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Wall clearance</text>

          {/* LEFT: Circular profile cross-section */}
          {/* Wall */}
          <rect x="60" y="70" width="12" height="200" fill="#CBD5E1" rx="2" />
          <text x="48" y="170" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8" fontWeight="600">wall</text>

          {/* Wall clearance gap */}
          <line x1="72" y1="155" x2="108" y2="155" stroke="#15803D" strokeWidth="1" strokeDasharray="3 2" />
          <rect x="74" y="158" width="34" height="16" rx="4" fill="#15803D" />
          <text x="91" y="170" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('1\u00bd', '38')}</text>
          <text x="91" y="186" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="500">clearance</text>

          {/* Circular handrail cross-section */}
          <circle cx="150" cy="150" r="30" fill="#C2410C" opacity="0.08" stroke="#C2410C" strokeWidth="2.5" />

          {/* Diameter dimension */}
          <line x1="120" y1="150" x2="180" y2="150" stroke="#C2410C" strokeWidth="1.2" />
          <rect x="115" y="196" width="70" height="20" rx="6" fill="#C2410C" />
          <text x="150" y="210" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('1\u00bc', '32')}{'\u2013'}{d('2', '51')}</text>
          <text x="150" y="230" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="500">diameter</text>

          {/* Hand gripping illustration */}
          <g transform="translate(200,115)" opacity="0.4">
            <path d="M 0 10 C 10 -5 40 -5 50 10 C 55 20 55 50 50 60 C 40 75 10 75 0 60 C -5 50 -5 20 0 10" fill="none" stroke="#475569" strokeWidth="1.5" />
          </g>
          <text x="230" y="108" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">fingers wrap</text>
          <text x="230" y="122" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B">around the rail</text>

          {/* Non-circular option */}
          <rect x="90" y="260" width="120" height="32" rx="10" fill="#7C3AED" opacity="0.06" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="150" y="280" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6" fontWeight="600">non-circular option</text>
          <text x="150" y="304" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">perimeter: 4{'\u2033'}{'\u2013'}6{'\u00bc'}{'\u2033'}</text>


          {/* DIVIDER */}
          <line x1="360" y1="40" x2="360" y2="320" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />


          {/* RIGHT: Wall clearance side view */}
          {/* Wall */}
          <rect x="420" y="60" width="15" height="240" fill="#CBD5E1" rx="2" />
          <text x="428" y="52" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8" fontWeight="600">wall</text>

          {/* Bracket */}
          <rect x="435" y="155" width="30" height="6" rx="1" fill="#94A3B8" />

          {/* Rail (side view) */}
          <rect x="465" y="135" width="15" height="50" rx="7" fill="#C2410C" opacity="0.1" stroke="#C2410C" strokeWidth="2" />

          {/* 1.5" clearance dimension */}
          <line x1="435" y1="200" x2="465" y2="200" stroke="#15803D" strokeWidth="1.5" />
          <line x1="435" y1="194" x2="435" y2="206" stroke="#15803D" strokeWidth="1.5" />
          <line x1="465" y1="194" x2="465" y2="206" stroke="#15803D" strokeWidth="1.5" />
          <rect x="435" y="210" width="60" height="20" rx="6" fill="#15803D" />
          <text x="465" y="224" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('1\u00bd', '38')} min</text>
          <text x="465" y="244" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="500">wall clearance</text>

          {/* What goes wrong */}
          <rect x="520" y="90" width="170" height="72" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="605" y="112" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">{'\u2718'} Fingers pinched</text>
          <text x="605" y="128" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">if clearance is too small</text>
          <text x="605" y="148" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">no bolts or rough surfaces</text>

          {/* What's right */}
          <rect x="520" y="180" width="170" height="60" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="605" y="202" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">{'\u2714'} Continuous grip</text>
          <text x="605" y="218" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">smooth, no breaks, full length</text>

          <text x="605" y="280" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600">both sides of stairs and ramps</text>

          <Dots callouts={CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="332" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Handrails</p>
        <KeyFact color="#C2410C" number={`${d('1\u00bc', '32')}\u2013${d('2', '51')}`}>Round handrail diameter range</KeyFact>
        <KeyFact color="#15803D" number={d('1\u00bd', '38')}>Minimum wall clearance (no pinched fingers)</KeyFact>
        <KeyFact color="#7C3AED" number={`4\u2033\u20136\u00bc\u2033`}>Non-circular handrail perimeter range</KeyFact>
      </div>

      <style>{`
        @keyframes railFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .rail-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
