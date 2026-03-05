import React, { useState, useRef, useEffect, useCallback } from 'react';

const WALK_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#403-walking-surfaces';

const SLOPE_CALLOUTS = [
  {
    id: 1, label: 'Width & Passing', section: '\u00a7403.5',
    color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52,
    plain: 'Walking surfaces must be at least 36 inches wide. They can narrow to 32 inches at a single point for up to 24 inches. On corridors less than 60 inches wide, a 60\u00d760-inch passing space must be provided every 200 feet so two wheelchair users can pass each other.',
    legal: '\u201CThe clear width of walking surfaces shall be 36 inches minimum.\u201D Exception: \u201CMay reduce to 32 inches minimum for 24 inches maximum.\u201D Passing spaces every 200 feet per \u00a7403.5.3.',
    citation: '\u00a7403.5'
  },
  {
    id: 2, label: 'Running Slope & Cross Slope', section: '\u00a7403.3',
    color: '#15803D', textColor: '#14532D', x: 470, y: 52,
    plain: 'Running slope (direction of travel) cannot exceed 1:20 (5%). Anything steeper becomes a ramp and must comply with \u00a7405 \u2014 handrails, landings, and edge protection required. Cross slope (perpendicular to travel) cannot exceed 1:48 (about 2%). Excessive cross slope causes wheelchairs to drift sideways.',
    legal: '\u201CThe running slope of walking surfaces shall not be steeper than 1:20.\u201D \u201CThe cross slope shall not be steeper than 1:48.\u201D Advisory: \u201CA slope steeper than 1:20 is a ramp and must comply with \u00a7405.\u201D',
    citation: '\u00a7403.3'
  }
];

const SURFACE_CALLOUTS = [
  {
    id: 1, label: 'Surface Requirements', section: '\u00a7302',
    color: '#7C3AED', textColor: '#5B21B6', x: 100, y: 52,
    plain: 'All walking surfaces must be firm, stable, and slip-resistant. Carpet must be securely attached with maximum \u00bd-inch pile height. Openings in floor surfaces (like grates) must not allow a \u00bd-inch sphere to pass through, and elongated openings must run perpendicular to the direction of travel so casters and cane tips don\u2019t get caught.',
    legal: '\u201CFloor or ground surfaces shall be stable, firm, and slip-resistant.\u201D Carpet: \u201CLevel loop, textured loop, level cut pile, or level cut/uncut pile. Pile height \u00bd inch maximum.\u201D Gratings: \u201COpenings shall not allow passage of a sphere more than \u00bd inch in diameter.\u201D',
    citation: '\u00a7302, \u00a7302.3'
  },
  {
    id: 2, label: 'Changes in Level', section: '\u00a7303',
    color: '#2563EB', textColor: '#1E3A8A', x: 470, y: 52,
    plain: 'Small bumps in the walking surface matter. Up to \u00bc inch can be vertical (a sharp step). Between \u00bc and \u00bd inch must be beveled at no steeper than 1:2. Anything over \u00bd inch must be treated as a ramp. Look for: uneven pavement joints, raised thresholds, carpet edges, and cracked sidewalk lips.',
    legal: '\u201CChanges in level of \u00bc inch high maximum shall be permitted to be vertical.\u201D \u201CChanges between \u00bc inch and \u00bd inch shall be beveled with a slope not steeper than 1:2.\u201D \u201CChanges greater than \u00bd inch shall comply with \u00a7405 or \u00a7406.\u201D',
    citation: '\u00a7303'
  }
];

function makeLink(t) { return (<a href={WALK_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (
    <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'walkFade 0.25s ease-out' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span>
          <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: callout.color, background: `${callout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span>
        </div>
        <button onClick={onClose} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close {'\u2715'}</button>
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
  return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}>
    <span style={{ background: color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span>
    <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span>
  </div>);
}
function Dots({ callouts, active, toggle }) {
  return callouts.map(c => (
    <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
      {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
      <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
      <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
      <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="walk-fr"/>
    </g>
  ));
}

export default function WalkingSurfaceDiagram() {
  const [slopeActive, setSlopeActive] = useState(null);
  const [surfActive, setSurfActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const slopeRef = useRef(null); const surfRef = useRef(null);
  const toggleSlope = useCallback(id => { setSlopeActive(p => p === id ? null : id); setSurfActive(null); }, []);
  const toggleSurf = useCallback(id => { setSurfActive(p => p === id ? null : id); setSlopeActive(null); }, []);
  useEffect(() => { if (slopeActive && slopeRef.current) slopeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [slopeActive]);
  useEffect(() => { if (surfActive && surfRef.current) surfRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [surfActive]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') { setSlopeActive(null); setSurfActive(null); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (i, m) => metric ? `${m} mm` : `${i}\u2033`;
  const slopeC = SLOPE_CALLOUTS.find(c => c.id === slopeActive);
  const surfC = SURFACE_CALLOUTS.find(c => c.id === surfActive);
  const unitToggle = (<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>{['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}</div>);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      {/* DIAGRAM 1: Width & Slope */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Width & Slope</h3>
        {unitToggle}
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 360" role="img" aria-labelledby="ws-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="ws-title">Walking Surface Width and Slope Requirements</title>
          <rect width="720" height="360" fill="var(--page-bg-subtle)" />

          {/* LEFT: Width */}
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">How wide the path must be</text>

          {/* Corridor walls */}
          <rect x="60" y="80" width="220" height="14" rx="2" fill="#CBD5E1" />
          <rect x="60" y="280" width="220" height="14" rx="2" fill="#CBD5E1" />
          <text x="170" y="78" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8" fontWeight="600">wall</text>
          <text x="170" y="308" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8" fontWeight="600">wall</text>

          {/* Walking path */}
          <rect x="60" y="94" width="220" height="186" rx="0" fill="#C2410C" opacity="0.03" />

          {/* Wheelchair top-down */}
          <g transform="translate(135,145) scale(0.9)" opacity="0.5">
            <rect x="0" y="0" width="50" height="40" rx="4" fill="none" stroke="#475569" strokeWidth="1.8" />
            <circle cx="25" cy="20" r="8" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
            <circle cx="5" cy="48" r="13" fill="none" stroke="#475569" strokeWidth="1.5" />
            <circle cx="45" cy="48" r="13" fill="none" stroke="#475569" strokeWidth="1.5" />
          </g>

          {/* 36" dimension */}
          <line x1="60" y1="320" x2="280" y2="320" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="60" y1="314" x2="60" y2="326" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="280" y1="314" x2="280" y2="326" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="130" y="326" width="80" height="22" rx="6" fill="#C2410C" />
          <text x="170" y="341" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="white">{d('36', '915')} min</text>

          {/* DIVIDER */}
          <line x1="345" y1="20" x2="345" y2="340" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Slope */}
          <text x="530" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">How steep it can be</text>

          {/* Running slope surface */}
          <line x1="380" y1="230" x2="680" y2="190" stroke="#475569" strokeWidth="3" />
          <text x="530" y="178" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#64748B" fontWeight="600">direction of travel {'\u2192'}</text>

          {/* Running slope label */}
          <rect x="460" y="235" width="140" height="22" rx="6" fill="#15803D" />
          <text x="530" y="250" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">running slope: 1:20 max</text>

          {/* Cross slope illustration */}
          <line x1="410" y1="300" x2="650" y2="295" stroke="#475569" strokeWidth="2" strokeDasharray="4 3" />
          <rect x="460" y="305" width="140" height="22" rx="6" fill="#2563EB" />
          <text x="530" y="320" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">cross slope: 1:48 max</text>

          {/* Slope angle indicator */}
          <line x1="380" y1="230" x2="680" y2="230" stroke="#15803D" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <text x="690" y="212" fontFamily="Manrope, sans-serif" fontSize="10" fill="#15803D" fontWeight="600">5%</text>

          {/* Warning note */}
          <rect x="395" y="90" width="270" height="44" rx="8" fill="#C2410C" opacity="0.05" stroke="#C2410C" strokeWidth="1" />
          <text x="530" y="110" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C" fontWeight="600">Steeper than 1:20?</text>
          <text x="530" y="126" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#C2410C">It{'\u2019'}s a ramp {'\u2014'} needs handrails + landings</text>

          <Dots callouts={SLOPE_CALLOUTS} active={slopeActive} toggle={toggleSlope} />
          <text x="20" y="350" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{slopeC ? `Showing: ${slopeC.label}` : ''}</div>
      <CalloutPanel callout={slopeC} onClose={() => setSlopeActive(null)} panelRef={slopeRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Width & Slope</p>
        <KeyFact color="#C2410C" number={d('36', '915')}>Minimum clear width of any walking surface</KeyFact>
        <KeyFact color="#15803D" number="1:20">Maximum running slope (5%) before it becomes a ramp</KeyFact>
        <KeyFact color="#2563EB" number="1:48">Maximum cross slope (about 2%) to prevent wheelchair drift</KeyFact>
      </div>

      {/* DIAGRAM 2: Surface & Level Changes */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Surface & Level Changes</h3>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 320" role="img" aria-labelledby="surf-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="surf-title">Surface Requirements and Changes in Level</title>
          <rect width="720" height="320" fill="var(--page-bg-subtle)" />

          {/* LEFT: Surface */}
          <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">The surface itself</text>

          <rect x="40" y="70" width="280" height="50" rx="8" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="180" y="92" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">Firm + Stable + Slip-resistant</text>
          <text x="180" y="108" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">no loose gravel, deep carpet, or slick tile</text>

          <rect x="40" y="135" width="280" height="50" rx="8" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="180" y="157" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">Carpet: {d('\u00bd', '13')} max pile height</text>
          <text x="180" y="173" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">must be securely attached, firm backing</text>

          <rect x="40" y="200" width="280" height="50" rx="8" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="180" y="222" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">Grate openings: {d('\u00bd', '13')} max gap</text>
          <text x="180" y="238" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">long slots run perpendicular to travel</text>

          {/* DIVIDER */}
          <line x1="360" y1="20" x2="360" y2="300" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Level changes */}
          <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Bumps and edges</text>

          {/* Three tiers of level changes */}
          <rect x="400" y="70" width="280" height="55" rx="8" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" />
          <text x="540" y="90" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">{'\u2264'} {d('\u00bc', '6')} {'\u2014'} OK as-is</text>
          <text x="540" y="108" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">vertical edge is fine</text>

          <rect x="400" y="140" width="280" height="55" rx="8" fill="#B45309" opacity="0.04" stroke="#B45309" strokeWidth="1.5" />
          <text x="540" y="160" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#78350F" fontWeight="600">{d('\u00bc', '6')} to {d('\u00bd', '13')} {'\u2014'} must bevel</text>
          <text x="540" y="178" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F">slope the edge at 1:2 max</text>

          <rect x="400" y="210" width="280" height="55" rx="8" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="540" y="230" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">{'\u003e'} {d('\u00bd', '13')} {'\u2014'} needs a ramp</text>
          <text x="540" y="248" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">full ramp requirements apply ({'\u00a7'}405)</text>

          <Dots callouts={SURFACE_CALLOUTS} active={surfActive} toggle={toggleSurf} />
          <text x="20" y="308" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{surfC ? `Showing: ${surfC.label}` : ''}</div>
      <CalloutPanel callout={surfC} onClose={() => setSurfActive(null)} panelRef={surfRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Surface & Level Changes</p>
        <KeyFact color="#7C3AED" number="3 rules">Firm, stable, and slip-resistant {'\u2014'} every walking surface</KeyFact>
        <KeyFact color="#15803D" number={`\u2264 ${d('\u00bc', '6')}`}>Small level changes OK as vertical edges</KeyFact>
        <KeyFact color="#B45309" number={`${d('\u00bc', '6')}\u2013${d('\u00bd', '13')}`}>Must be beveled (angled at 1:2 max slope)</KeyFact>
        <KeyFact color="#C2410C" number={`> ${d('\u00bd', '13')}`}>Needs a full ramp with handrails and landings</KeyFact>
      </div>

      <style>{`
        @keyframes walkFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        g[role="button"]:focus .walk-fr { stroke: var(--accent); stroke-width: 2.5; } @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
