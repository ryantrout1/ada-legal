import React, { useState, useRef, useEffect, useCallback } from 'react';

const LULA_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#408-limited-use-limited-application-elevators';

const CALLOUTS = [
  { id: 1, label: 'Size & Doors', section: '\u00a7408.4.1',
    color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52,
    plain: 'LULA cabs must be at least 54 inches deep by 36 inches wide for end-opening doors, or 51 by 51 inches for side-opening doors. Door width is 32 inches minimum. These are smaller than standard passenger elevators but large enough for one wheelchair user. Doors must be automatic or power-operated with reopening devices.',
    legal: '\u201CInside dimensions: 54 inches deep by 36 inches wide with end/center opening doors, or 51 inches wide by 51 inches deep with side opening doors.\u201D Door width: \u201C32 inches minimum.\u201D',
    citation: '\u00a7408.4.1, \u00a7408.4.2' },
  { id: 2, label: 'Where Allowed & Limits', section: '\u00a7206.6',
    color: '#15803D', textColor: '#14532D', x: 470, y: 52,
    plain: 'LULA elevators are only allowed in buildings where a standard passenger elevator is not required (typically 2 stories or fewer). They are limited to 25 feet of travel at 30 feet per minute. Controls must be within reach range (15\u201348 inches) with raised characters and Braille. They cannot substitute for standard elevators in buildings that require them.',
    legal: '\u00a7206.6: \u201CIn buildings not required to have a full passenger elevator, LULA elevators shall be permitted.\u201D Per ASME A17.1: maximum travel 25 feet, maximum speed 30 feet per minute.',
    citation: '\u00a7206.6, \u00a7408.4' }
];

function makeLink(t) { return (<a href={LULA_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'lulaFade 0.25s ease-out' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span>
        <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span>
      </div>
      <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close {'\u2715'}</button>
    </div>
    <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
      <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div>
      <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p>
      </div></aside>
    </div>
  </div>);
}
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>{active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text></g>)); }

export default function LULAElevatorDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panRef = useRef(null);
  const toggle = useCallback(id => setActive(p => p === id ? null : id), []);
  useEffect(() => { if (active && panRef.current) panRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (i, m) => metric ? `${m} mm` : `${i}\u2033`;
  const ac = CALLOUTS.find(c => c.id === active);
  const unitToggle = (<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>{['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}</div>);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>LULA Elevator</h3>
        {unitToggle}
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 370" role="img" aria-labelledby="lula-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="lula-title">LULA Elevator Size and Usage Limitations</title>
          <rect width="720" height="370" fill="var(--page-bg-subtle)" />
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Smaller cab, tighter fit</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Where and when allowed</text>

          {/* LEFT: Cab plan view */}
          <rect x="80" y="80" width="160" height="180" rx="4" fill="#C2410C" opacity="0.03" stroke="#475569" strokeWidth="2" />
          {/* Door at bottom */}
          <rect x="120" y="254" width="80" height="8" rx="1" fill="var(--page-bg-subtle)" />
          <line x1="120" y1="260" x2="120" y2="268" stroke="#C2410C" strokeWidth="2" />
          <line x1="200" y1="260" x2="200" y2="268" stroke="#C2410C" strokeWidth="2" />

          {/* Door width */}
          <rect x="123" y="270" width="72" height="18" rx="5" fill="#C2410C" />
          <text x="159" y="283" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('32', '815')} door</text>

          {/* Width */}
          <line x1="80" y1="295" x2="240" y2="295" stroke="#475569" strokeWidth="1.2" />
          <line x1="80" y1="290" x2="80" y2="300" stroke="#475569" strokeWidth="1.2" />
          <line x1="240" y1="290" x2="240" y2="300" stroke="#475569" strokeWidth="1.2" />
          <rect x="122" y="298" width="76" height="18" rx="5" fill="#475569" />
          <text x="160" y="311" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('36', '915')} wide</text>

          {/* Depth */}
          <line x1="258" y1="80" x2="258" y2="260" stroke="#475569" strokeWidth="1.2" />
          <line x1="253" y1="80" x2="263" y2="80" stroke="#475569" strokeWidth="1.2" />
          <line x1="253" y1="260" x2="263" y2="260" stroke="#475569" strokeWidth="1.2" />
          <rect x="265" y="160" width="56" height="18" rx="5" fill="#475569" />
          <text x="293" y="173" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('54', '1370')}</text>
          <text x="293" y="190" fontFamily="Manrope, sans-serif" fontSize="10" fill="#475569" fontWeight="600">deep</text>

          {/* Wheelchair */}
          <g transform="translate(115,120) scale(0.6)" opacity="0.4">
            <rect x="0" y="0" width="50" height="40" rx="4" fill="none" stroke="#475569" strokeWidth="2.5" />
            <circle cx="25" cy="20" r="8" fill="#E2E8F0" stroke="#475569" strokeWidth="2" />
            <circle cx="5" cy="48" r="13" fill="none" stroke="#475569" strokeWidth="2" />
            <circle cx="45" cy="48" r="13" fill="none" stroke="#475569" strokeWidth="2" />
          </g>

          {/* DIVIDER */}
          <line x1="360" y1="40" x2="360" y2="320" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Limitations */}
          <rect x="400" y="70" width="280" height="55" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="540" y="93" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Buildings with 2 stories or fewer</text>
          <text x="540" y="112" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">where a full elevator isn{'\u2019'}t required</text>

          <rect x="400" y="142" width="280" height="55" rx="10" fill="#B45309" opacity="0.04" stroke="#B45309" strokeWidth="1.5" />
          <text x="540" y="165" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#78350F" fontWeight="600">Max travel: 25 feet</text>
          <text x="540" y="184" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F">at 30 ft/min max speed (1{'\u2013'}2 stories)</text>

          <rect x="400" y="214" width="280" height="55" rx="10" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="540" y="237" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">Same control rules as standard</text>
          <text x="540" y="256" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">reach range, Braille, raised characters</text>

          <Dots callouts={CALLOUTS} active={active} toggle={toggle} />
          <text x="20" y="358" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing: ${ac.label}` : ''}</div>
      <CalloutPanel callout={ac} onClose={() => setActive(null)} panelRef={panRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} LULA Elevator</p>
        <KeyFact color="#C2410C" number={`${d('54', '1370')}\u00d7${d('36', '915')}`}>Minimum cab size (end-opening door)</KeyFact>
        <KeyFact color="#C2410C" number={d('32', '815')}>Minimum door width</KeyFact>
        <KeyFact color="#15803D" number="25 ft">Maximum travel distance</KeyFact>
      </div>

      <style>{`
        @keyframes lulaFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
