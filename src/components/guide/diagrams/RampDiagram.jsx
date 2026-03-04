import React, { useState, useRef, useEffect, useCallback } from 'react';

const RAMP_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#405-ramps';

const SLOPE_CALLOUTS = [
  { id: 1, label: 'Slope & Rise', section: '\u00a7405.2',
    color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52,
    plain: 'The running slope cannot be steeper than 1:12 \u2014 for every 1 inch of rise, you need 12 inches of ramp. A 30-inch rise requires a 30-foot ramp. The maximum rise per ramp run is 30 inches, then a landing is required. Cross slope must not exceed 1:48. The clear width between handrails must be 36 inches minimum.',
    legal: '\u201CRamp runs shall have a running slope not steeper than 1:12.\u201D \u201CThe rise for any ramp run shall be 30 inches maximum.\u201D \u201CCross slope of ramp runs shall not be steeper than 1:48.\u201D Width: \u201C36 inches minimum.\u201D',
    citation: '\u00a7405.2, \u00a7405.5, \u00a7405.6' },
  { id: 2, label: 'Landings', section: '\u00a7405.7',
    color: '#15803D', textColor: '#14532D', x: 470, y: 52,
    plain: 'A level landing is required at the top and bottom of every ramp run, and wherever the ramp changes direction. Landings must be at least 60 inches long and at least as wide as the ramp. Where a ramp turns, the landing must be 60\u00d760 inches minimum. Landings must have a slope no steeper than 1:48 in any direction.',
    legal: '\u201CLandings shall be at least as wide as the widest ramp run leading to the landing.\u201D \u201CLanding length shall be 60 inches long minimum.\u201D \u201CRamps that change direction between runs at landings shall have a clear landing 60 inches minimum by 60 inches minimum.\u201D',
    citation: '\u00a7405.7' }
];

const RAIL_CALLOUTS = [
  { id: 1, label: 'Handrails', section: '\u00a7405.8',
    color: '#7C3AED', textColor: '#5B21B6', x: 100, y: 52,
    plain: 'Handrails are required on both sides of any ramp with more than 6 inches of rise. They must be 34 to 38 inches above the ramp surface, continuous along the full length, and graspable (1\u00bc to 2-inch round cross section or equivalent). Extensions: handrails must extend 12 inches beyond the top and bottom of the ramp, parallel to the floor.',
    legal: '\u201CHandrails complying with \u00a7505 shall be provided on both sides of ramp runs.\u201D Height: \u201C34 inches minimum and 38 inches maximum.\u201D Extensions: \u201C12 inches minimum beyond the top and bottom of ramp runs.\u201D',
    citation: '\u00a7405.8, \u00a7505' },
  { id: 2, label: 'Edge Protection', section: '\u00a7405.9',
    color: '#2563EB', textColor: '#1E3A8A', x: 470, y: 52,
    plain: 'Edge protection prevents wheelchairs from rolling off the side of the ramp. Options include: a curb at least 4 inches high, a wall or railing, or a barrier that extends to within 4 inches of the ramp surface. Without edge protection, a wheelchair that drifts to the side can drop off the edge \u2014 a serious fall hazard.',
    legal: '\u201CEdge protection complying with \u00a7405.9.1 or \u00a7405.9.2 shall be provided on each side of ramp runs and at each side of ramp landings.\u201D Options: extended floor surface, curb or barrier.',
    citation: '\u00a7405.9' }
];

function makeLink(t) { return (<a href={RAMP_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'rampFade 0.25s ease-out' }}>
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

export default function RampDiagram() {
  const [slopeActive, setSlopeActive] = useState(null);
  const [railActive, setRailActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const slopeRef = useRef(null); const railRef = useRef(null);
  const toggleSlope = useCallback(id => { setSlopeActive(p => p === id ? null : id); setRailActive(null); }, []);
  const toggleRail = useCallback(id => { setRailActive(p => p === id ? null : id); setSlopeActive(null); }, []);
  useEffect(() => { if (slopeActive && slopeRef.current) slopeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [slopeActive]);
  useEffect(() => { if (railActive && railRef.current) railRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [railActive]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') { setSlopeActive(null); setRailActive(null); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (i, m) => metric ? `${m} mm` : `${i}\u2033`;
  const slopeC = SLOPE_CALLOUTS.find(c => c.id === slopeActive);
  const railC = RAIL_CALLOUTS.find(c => c.id === railActive);
  const unitToggle = (<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>{['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}</div>);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Slope & Landings</h3>
        {unitToggle}
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 380" role="img" aria-labelledby="ramp-slope-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="ramp-slope-title">Ramp Slope, Rise, and Landing Requirements</title>
          <rect width="720" height="380" fill="var(--page-bg-subtle)" />

          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">How steep and how long</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Flat spots to rest</text>

          {/* LEFT: Ramp side view */}
          {/* Bottom landing */}
          <rect x="40" y="280" width="80" height="6" rx="1" fill="#15803D" opacity="0.15" stroke="#15803D" strokeWidth="1.5" />
          <text x="80" y="300" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">bottom landing</text>

          {/* Ramp surface */}
          <line x1="120" y1="280" x2="320" y2="180" stroke="#475569" strokeWidth="3" />

          {/* Wheelchair going up the ramp */}
          <g transform="translate(190,215) rotate(-27)" opacity="0.6">
            <circle cx="15" cy="-8" r="7" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
            <line x1="15" y1="0" x2="15" y2="22" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <circle cx="6" cy="30" r="6" fill="none" stroke="#475569" strokeWidth="1.2" />
            <circle cx="24" cy="30" r="6" fill="none" stroke="#475569" strokeWidth="1.2" />
            <line x1="15" y1="8" x2="5" y2="16" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
          </g>

          {/* Top landing */}
          <rect x="320" y="174" width="80" height="6" rx="1" fill="#15803D" opacity="0.15" stroke="#15803D" strokeWidth="1.5" />
          <text x="360" y="168" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">top landing</text>

          {/* Horizontal reference line */}
          <line x1="120" y1="280" x2="320" y2="280" stroke="#C2410C" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

          {/* 1:12 slope label */}
          <rect x="155" y="215" width="100" height="22" rx="6" fill="#C2410C" />
          <text x="205" y="230" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">1:12 max slope</text>

          {/* Rise dimension (vertical) */}
          <line x1="325" y1="180" x2="325" y2="280" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="319" y1="180" x2="331" y2="180" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="319" y1="280" x2="331" y2="280" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="332" y="218" width="70" height="22" rx="6" fill="#C2410C" />
          <text x="367" y="233" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('30', '760')} max</text>
          <text x="367" y="252" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="600">rise per run</text>

          {/* 36" width note */}
          <rect x="140" y="310" width="100" height="22" rx="6" fill="#2563EB" />
          <text x="190" y="325" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('36', '915')} wide min</text>

          {/* DIVIDER */}
          <line x1="420" y1="40" x2="420" y2="360" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Landing details */}
          {/* Landing rectangle */}
          <rect x="460" y="120" width="220" height="100" rx="6" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="2" strokeDasharray="6 3" />

          {/* 60" dimension */}
          <line x1="460" y1="240" x2="680" y2="240" stroke="#15803D" strokeWidth="1.5" />
          <line x1="460" y1="234" x2="460" y2="246" stroke="#15803D" strokeWidth="1.5" />
          <line x1="680" y1="234" x2="680" y2="246" stroke="#15803D" strokeWidth="1.5" />
          <rect x="530" y="246" width="80" height="22" rx="6" fill="#15803D" />
          <text x="570" y="261" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('60', '1525')} min</text>
          <text x="570" y="280" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">landing length</text>

          <text x="570" y="155" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">level landing</text>
          <text x="570" y="175" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">at top, bottom, and every turn</text>
          <text x="570" y="195" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">slope {'\u2264'} 1:48 in any direction</text>

          {/* Turn landing note */}
          <rect x="460" y="300" width="220" height="40" rx="8" fill="#B45309" opacity="0.04" stroke="#B45309" strokeWidth="1.5" />
          <text x="570" y="318" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F" fontWeight="600">Turns? {d('60', '1525')} {'\u00d7'} {d('60', '1525')} min landing</text>
          <text x="570" y="333" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F">wheelchair needs room to rotate at direction change</text>

          <Dots callouts={SLOPE_CALLOUTS} active={slopeActive} toggle={toggleSlope} />
          <text x="20" y="368" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{slopeC ? `Showing: ${slopeC.label}` : ''}</div>
      <CalloutPanel callout={slopeC} onClose={() => setSlopeActive(null)} panelRef={slopeRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Slope & Landings</p>
        <KeyFact color="#C2410C" number="1:12">Maximum ramp slope (1 inch rise per 12 inches of ramp)</KeyFact>
        <KeyFact color="#C2410C" number={d('30', '760')}>Maximum rise per ramp run before a landing is required</KeyFact>
        <KeyFact color="#15803D" number={d('60', '1525')}>Minimum landing length at top, bottom, and direction changes</KeyFact>
        <KeyFact color="#2563EB" number={d('36', '915')}>Minimum clear width between handrails</KeyFact>
      </div>

      {/* DIAGRAM 2: Handrails & Edge Protection */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Handrails & Edge Protection</h3>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 340" role="img" aria-labelledby="ramp-rail-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="ramp-rail-title">Ramp Handrail and Edge Protection Requirements</title>
          <rect width="720" height="340" fill="var(--page-bg-subtle)" />

          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Handrails on both sides</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Keeping wheels on the ramp</text>

          {/* LEFT: Handrail side view */}
          {/* Ramp surface */}
          <line x1="60" y1="240" x2="300" y2="160" stroke="#475569" strokeWidth="3" />

          {/* Handrail line (parallel above ramp) */}
          <line x1="48" y1="200" x2="288" y2="120" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />

          {/* 12" extensions */}
          <line x1="288" y1="120" x2="340" y2="120" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
          <line x1="60" y1="240" x2="20" y2="240" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" opacity="0.5" />

          {/* 12" extension dimension */}
          <line x1="288" y1="130" x2="340" y2="130" stroke="#7C3AED" strokeWidth="1" />
          <rect x="290" y="132" width="56" height="18" rx="5" fill="#7C3AED" />
          <text x="318" y="145" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('12', '305')} ext.</text>

          {/* 34-38" height */}
          <line x1="180" y1="200" x2="180" y2="140" stroke="#7C3AED" strokeWidth="1.2" strokeDasharray="3 3" />
          <rect x="130" y="158" width="100" height="22" rx="6" fill="#7C3AED" />
          <text x="180" y="173" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('34', '865')}{'\u2013'}{d('38', '965')}</text>

          {/* Required when rise > 6" note */}
          <rect x="40" y="260" width="260" height="40" rx="8" fill="#B45309" opacity="0.04" stroke="#B45309" strokeWidth="1.5" />
          <text x="170" y="278" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F" fontWeight="600">Required when rise exceeds {d('6', '150')}</text>
          <text x="170" y="294" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F">both sides, continuous, graspable (1{'\u00bc'}{'\u2033'}{'\u2013'}2{'\u2033'} round)</text>

          {/* DIVIDER */}
          <line x1="370" y1="40" x2="370" y2="320" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Edge protection */}
          {/* Ramp cross-section */}
          <rect x="430" y="200" width="230" height="8" rx="1" fill="#475569" />

          {/* Left curb */}
          <rect x="420" y="170" width="16" height="38" rx="2" fill="#2563EB" opacity="0.15" stroke="#2563EB" strokeWidth="1.5" />
          {/* Right curb */}
          <rect x="654" y="170" width="16" height="38" rx="2" fill="#2563EB" opacity="0.15" stroke="#2563EB" strokeWidth="1.5" />

          {/* 4" min curb height */}
          <line x1="674" y1="170" x2="674" y2="208" stroke="#2563EB" strokeWidth="1" />
          <rect x="618" y="148" width="56" height="22" rx="6" fill="#2563EB" />
          <text x="646" y="163" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">{d('4', '100')} min</text>

          <text x="545" y="194" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600">ramp surface</text>

          {/* Labels */}
          <text x="428" y="160" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#2563EB" fontWeight="600">curb</text>
          <text x="662" y="160" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#2563EB" fontWeight="600">curb</text>

          {/* Wheelchair on ramp (front view) */}
          <g transform="translate(520,110)" opacity="0.6">
            <circle cx="20" cy="0" r="9" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
            <line x1="20" y1="10" x2="20" y2="35" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="18" x2="8" y2="28" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="20" y1="18" x2="32" y2="28" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="48" r="10" fill="none" stroke="#475569" strokeWidth="1.5" />
            <circle cx="32" cy="48" r="10" fill="none" stroke="#475569" strokeWidth="1.5" />
          </g>

          {/* Options list */}
          <text x="545" y="240" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A" fontWeight="600">Options: curb, wall, rail, or barrier</text>
          <text x="545" y="260" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">prevents wheelchair from rolling off the edge</text>

          <Dots callouts={RAIL_CALLOUTS} active={railActive} toggle={toggleRail} />
          <text x="20" y="328" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{railC ? `Showing: ${railC.label}` : ''}</div>
      <CalloutPanel callout={railC} onClose={() => setRailActive(null)} panelRef={railRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Handrails & Edge Protection</p>
        <KeyFact color="#7C3AED" number={`${d('34', '865')}\u2013${d('38', '965')}`}>Handrail height above ramp surface</KeyFact>
        <KeyFact color="#7C3AED" number={d('12', '305')}>Extension beyond top and bottom of ramp run</KeyFact>
        <KeyFact color="#2563EB" number={d('4', '100')}>Minimum curb height for edge protection</KeyFact>
      </div>

      <style>{`
        @keyframes rampFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
