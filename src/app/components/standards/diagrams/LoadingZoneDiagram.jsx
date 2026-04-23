import React, { useState, useRef, useEffect, useCallback } from 'react';

const LZ_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#503-passenger-loading-zones';

const CALLOUTS = [
  {
    id: 1, label: 'Dimensions & Layout', section: '\u00a7503.2',
    color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52,
    plain: 'The vehicle pull-up space must be 96 inches (8 feet) wide minimum and 20 feet long minimum. Next to it, an access aisle must be 60 inches (5 feet) wide minimum and 20 feet long minimum at the same level as the vehicle space \u2014 no curbs between them. The aisle must connect directly to an accessible route into the building. Vertical clearance of 114 inches (9\u20196\u2033) is required for the pull-up space and the entire vehicle route.',
    legal: '\u201CVehicular pull-up space 96 inches wide minimum and 20 feet long minimum.\u201D Access aisle: \u201C60 inches wide minimum, 20 feet long minimum, at the same level as the vehicle pull-up space.\u201D Clearance: \u201C114 inches minimum.\u201D',
    citation: '\u00a7503.2, \u00a7503.3, \u00a7503.4'
  },
  {
    id: 2, label: 'Surface & Common Problems', section: '\u00a7503',
    color: '#15803D', textColor: '#14532D', x: 470, y: 52,
    plain: 'The access aisle and pull-up space must be firm, stable, and slip-resistant with a maximum slope of 1:48. The surface must be flush between the aisle and pull-up space. When a wheelchair ramp deploys from a van, it must not reduce the aisle width below 60 inches. At least one loading zone is required wherever they exist, plus at medical facilities and valet operations. The aisle should be marked to prevent others from blocking it.',
    legal: 'Surface per \u00a7302: \u201Cfirm, stable, and slip-resistant.\u201D Slope: \u201Cnot steeper than 1:48.\u201D \u00a7209.2: \u201CAt least one passenger loading zone complying with \u00a7503 shall be provided.\u201D',
    citation: '\u00a7503, \u00a7209'
  }
];

function makeLink(t) { return (<a href={LZ_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (
    <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'lzFade 0.25s ease-out' }}>
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
      <circle cx={c.x} cy={c.y} r="22" fill="none" stroke="transparent" strokeWidth="2" className="lz-focus-ring" />
    </g>
  ));
}

export default function LoadingZoneDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback((id) => setActive(prev => prev === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}\u2033`;
  const ft = (feet, m) => metric ? `${m} m` : `${feet} ft`;
  const ac = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>The Drop-Off Area</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 360" role="img" aria-labelledby="lz-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="lz-title">Passenger Loading Zone Layout</title>
          <rect width="720" height="360" fill="var(--page-bg-subtle)" />

          <text x="360" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Top-down view of a hotel or hospital drop-off</text>

          {/* Building edge */}
          <rect x="40" y="55" width="640" height="30" rx="2" fill="#94A3B8" opacity="0.1" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="360" y="74" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#64748B" fontWeight="600">building entrance</text>

          {/* Access aisle */}
          <rect x="40" y="90" width="540" height="70" rx="2" fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="310" y="120" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#15803D" fontWeight="600">access aisle</text>
          <text x="310" y="136" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D">level, connects to entrance</text>

          {/* Access aisle width dimension */}
          <line x1="600" y1="90" x2="600" y2="160" stroke="#15803D" strokeWidth="1.2" />
          <line x1="594" y1="90" x2="606" y2="90" stroke="#15803D" strokeWidth="1.2" />
          <line x1="594" y1="160" x2="606" y2="160" stroke="#15803D" strokeWidth="1.2" />
          <rect x="610" y="113" width="66" height="20" rx="6" fill="#15803D" />
          <text x="643" y="127" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('60', '1525')} min</text>

          {/* Vehicle pull-up space */}
          <rect x="40" y="165" width="540" height="100" rx="2" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="2" />
          <text x="310" y="210" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fill="#C2410C" fontWeight="600">vehicle pull-up space</text>
          <text x="310" y="228" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C">where the van or car stops</text>

          {/* Vehicle pull-up width */}
          <line x1="600" y1="165" x2="600" y2="265" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="594" y1="165" x2="606" y2="165" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="594" y1="265" x2="606" y2="265" stroke="#C2410C" strokeWidth="1.2" />
          <rect x="610" y="203" width="66" height="20" rx="6" fill="#C2410C" />
          <text x="643" y="217" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('96', '2440')} min</text>

          {/* 20 ft length */}
          <line x1="40" y1="285" x2="580" y2="285" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="40" y1="279" x2="40" y2="291" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="580" y1="279" x2="580" y2="291" stroke="#7C3AED" strokeWidth="1.5" />
          <rect x="270" y="290" width="80" height="20" rx="6" fill="#7C3AED" />
          <text x="310" y="304" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{ft('20', '6.1')} min long</text>

          {/* Vertical clearance note */}
          <rect x="40" y="320" width="260" height="24" rx="8" fill="#B45309" opacity="0.06" stroke="#B45309" strokeWidth="1.5" />
          <text x="170" y="336" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F" fontWeight="600">{d('114', '2895')} vertical clearance (9{'\u2019'}6{'\u2033'})</text>

          <Dots callouts={CALLOUTS} active={active} toggle={toggle} />
          <text x="400" y="348" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panelRef} />

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Loading Zones</p>
        <KeyFact color="#C2410C" number={`${d('96', '2440')}\u00d7${ft('20', '6.1')}`}>Pull-up space minimum (8 ft wide, 20 ft long)</KeyFact>
        <KeyFact color="#15803D" number={d('60', '1525')}>Access aisle width (must be level with pull-up space)</KeyFact>
        <KeyFact color="#B45309" number={d('114', '2895')}>Vertical clearance for wheelchair vans (9{'\u2019'}6{'\u2033'})</KeyFact>
      </div>

      <style>{`
        @keyframes lzFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .lz-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        g[role="button"]:focus .load-fr{stroke:var(--accent);stroke-width:2.5} @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
