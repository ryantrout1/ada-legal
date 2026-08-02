import React, { useState, useRef, useEffect, useCallback } from 'react';

const CURB_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#406-curb-ramps';

const RAMP_CALLOUTS = [
  { id: 1, label: 'Slope & Width', section: '\u00a7406.1',
    color: 'var(--dx-orange)', textColor: 'var(--dx-orange)', x: 100, y: 52,
    plain: 'Curb ramps must have a running slope no steeper than 1:12, just like building ramps. The width must be 36 inches minimum, not counting flared sides. The counter slope at the base (where the ramp meets the street) cannot be steeper than 1:20. The top of the curb ramp must connect to a level landing or the sidewalk.',
    legal: '\u201CThe running slope of curb ramp runs shall not be steeper than 1:12.\u201D Width: 36 inches minimum excluding flares. Counter slope: 1:20 maximum. Top landing per \u00a7406.4.',
    citation: '\u00a7406.1, \u00a7406.2, \u00a7406.4' },
  { id: 2, label: 'Flared Sides', section: '\u00a7406.3',
    color: 'var(--dx-green)', textColor: 'var(--dx-green)', x: 470, y: 52,
    plain: 'When the curb ramp is next to a walking path, the sides must be flared at no steeper than 1:10. Without flares, a pedestrian could step off the side of the curb ramp and trip on the vertical edge. If the curb ramp is inside a planter or has a returned curb (vertical side), flares aren\u2019t needed because pedestrians can\u2019t walk across it.',
    legal: '\u201CWhere a pedestrian circulation path crosses the curb ramp, flared sides shall have a slope of 1:10 maximum, measured at the curb face.\u201D',
    citation: '\u00a7406.3' }
];

const WARN_CALLOUTS = [
  { id: 1, label: 'Detectable Warning Surface', section: '\u00a7406.13',
    color: 'var(--dx-violet)', textColor: 'var(--dx-violet)', x: 100, y: 52,
    plain: 'Raised truncated domes (the bumpy texture you feel underfoot) are required at the bottom of curb ramps where they meet the street. These warn people who are blind or have low vision that they are leaving the sidewalk and entering a roadway. The dome surface must extend 24 inches minimum in the direction of travel and the full width of the curb ramp.',
    legal: '\u201CDetectable warning surfaces complying with \u00a7705 shall be provided where curb ramps or blended transitions connect to street crossings.\u201D Depth: 24 inches minimum in the direction of travel. Width: full width of the curb ramp or blended transition.',
    citation: '\u00a7406.13, \u00a7705' },
  { id: 2, label: 'Placement at Crossings', section: '\u00a7406.5',
    color: 'var(--dx-blue)', textColor: 'var(--dx-blue)', x: 470, y: 52,
    plain: 'Each crosswalk must have its own curb ramp \u2014 two crosswalks at a corner means two separate ramps. A single ramp at the apex of a corner does not meet this requirement because it doesn\u2019t align the wheelchair user with the crosswalk, directing them into the intersection instead. Parallel curb ramps (running along the curb with a landing at the bottom) are an acceptable alternative.',
    legal: '\u201CCurb ramps at marked crossings shall be wholly contained within the markings.\u201D Advisory \u00a7406.5: Separate curb ramps for each crosswalk rather than a single diagonal ramp.',
    citation: '\u00a7406.5' }
];

function makeLink(t) { return (<a href={CURB_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>{'\u2197'}</span></a>); }
function parseCite(t) { return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^\u00a7\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }
function CalloutPanel({ callout, onClose, panelRef }) {
  if (!callout) return null;
  return (<div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'curbFade 0.25s ease-out' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: callout.color, color: 'var(--page-bg)', fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 700 }}>{callout.id}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{callout.label}</span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--page-bg)', background: callout.color, padding: '2px 8px', borderRadius: '4px' }}>{callout.section}</span>
      </div>
      <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close {'\u2715'}</button>
    </div>
    <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
      <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'var(--font-body)', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{callout.plain}</p></div>
      <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard {'\u2014'} {parseCite(callout.citation)}</p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(callout.legal)}</p>
      </div></aside>
    </div>
  </div>);
}
function KeyFact({ color, number, children }) { return (<div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', padding: '6px 0' }}><span style={{ background: color, color: 'var(--page-bg)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 700, minWidth: '60px', textAlign: 'center', padding: '3px 10px', borderRadius: '6px', flexShrink: 0, whiteSpace: 'nowrap' }}>{number}</span><span style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--body)', lineHeight: 1.6 }}>{children}</span></div>); }
function Dots({ callouts, active, toggle }) { return callouts.map(c => (<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer' }}>{active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}<circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" /><text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="var(--font-body)" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="22" fill="none" stroke="transparent" strokeWidth="2" className="curb-fr"/></g>)); }

export default function CurbRampDiagram() {
  const [rampActive, setRampActive] = useState(null);
  const [warnActive, setWarnActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const rampRef = useRef(null); const warnRef = useRef(null);
  const toggleRamp = useCallback(id => { setRampActive(p => p === id ? null : id); setWarnActive(null); }, []);
  const toggleWarn = useCallback(id => { setWarnActive(p => p === id ? null : id); setRampActive(null); }, []);
  useEffect(() => { if (rampActive && rampRef.current) rampRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [rampActive]);
  useEffect(() => { if (warnActive && warnRef.current) warnRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [warnActive]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') { setRampActive(null); setWarnActive(null); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (i, m) => metric ? `${m} mm` : `${i}\u2033`;
  const rampC = RAMP_CALLOUTS.find(c => c.id === rampActive);
  const warnC = WARN_CALLOUTS.find(c => c.id === warnActive);
  const unitToggle = (<div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}><span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>{['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}</div>);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>The Ramp Itself</h2>
        {unitToggle}
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 360" role="group" aria-labelledby="curb-ramp-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="curb-ramp-title">Curb Ramp Slope, Width, and Flared Sides</title>
          <rect width="720" height="360" fill="var(--page-bg-subtle)" />
          <text x="170" y="30" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Side view</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Plan view (from above)</text>

          {/* LEFT: Side view */}
          {/* Sidewalk level */}
          <rect x="30" y="140" width="120" height="8" rx="1" fill="var(--dx-label)" />
          <text x="90" y="132" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-label)" fontWeight="600">sidewalk</text>

          {/* Curb ramp slope */}
          <line x1="150" y1="148" x2="300" y2="260" stroke="var(--dx-line)" strokeWidth="3" />

          {/* Street level */}
          <rect x="300" y="260" width="120" height="8" rx="1" fill="var(--dx-label)" />
          <text x="360" y="284" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-label)" fontWeight="600">street</text>

          {/* 1:12 slope */}
          <line x1="150" y1="148" x2="300" y2="148" stroke="var(--dx-orange)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          <rect x="170" y="195" width="100" height="22" rx="6" fill="var(--dx-orange)" />
          <text x="220" y="210" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fontWeight="700" fill="var(--page-bg)">1:12 max slope</text>

          {/* Counter slope at bottom */}
          <rect x="260" y="290" width="90" height="18" rx="5" fill="var(--dx-amber)" />
          <text x="305" y="303" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fontWeight="700" fill="var(--page-bg)">1:20 counter max</text>

          {/* DIVIDER */}
          <line x1="430" y1="40" x2="430" y2="340" stroke="var(--dx-line)" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Plan view showing flares */}
          {/* Main ramp area */}
          <rect x="510" y="100" width="80" height="160" rx="2" fill="var(--dx-orange)" opacity="0.05" stroke="var(--dx-orange)" strokeWidth="2" />
          <text x="550" y="185" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-orange)" fontWeight="600">ramp</text>

          {/* 36" width */}
          <line x1="510" y1="275" x2="590" y2="275" stroke="var(--dx-orange)" strokeWidth="1.5" />
          <line x1="510" y1="270" x2="510" y2="280" stroke="var(--dx-orange)" strokeWidth="1.5" />
          <line x1="590" y1="270" x2="590" y2="280" stroke="var(--dx-orange)" strokeWidth="1.5" />
          <rect x="516" y="282" width="66" height="18" rx="5" fill="var(--dx-orange)" />
          <text x="549" y="295" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fontWeight="700" fill="var(--page-bg)">{d('36', '915')} min</text>

          {/* Left flare */}
          <path d="M 510 100 L 470 100 L 510 260 Z" fill="var(--dx-green)" opacity="0.04" stroke="var(--dx-green)" strokeWidth="1.5" />
          <text x="476" y="190" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-green)" fontWeight="600">flare</text>

          {/* Right flare */}
          <path d="M 590 100 L 630 100 L 590 260 Z" fill="var(--dx-green)" opacity="0.04" stroke="var(--dx-green)" strokeWidth="1.5" />
          <text x="616" y="190" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-green)" fontWeight="600">flare</text>

          {/* Flare slope label */}
          <rect x="628" y="165" width="70" height="18" rx="5" fill="var(--dx-green)" />
          <text x="663" y="178" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fontWeight="700" fill="var(--page-bg)">1:10 max</text>

          {/* Sidewalk at top */}
          <text x="550" y="88" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-label)" fontWeight="600">sidewalk</text>
          {/* Street at bottom */}
          <text x="550" y="320" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-label)" fontWeight="600">street</text>

          <Dots callouts={RAMP_CALLOUTS} active={rampActive} toggle={toggleRamp} />
          <text x="20" y="348" fontFamily="var(--font-body)" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{rampC ? `Showing: ${rampC.label}` : ''}</div>
      <CalloutPanel callout={rampC} onClose={() => setRampActive(null)} panelRef={rampRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} The Ramp</p>
        <KeyFact color="var(--dx-orange)" number="1:12">Maximum running slope</KeyFact>
        <KeyFact color="var(--dx-orange)" number={d('36', '915')}>Minimum width of the ramp itself</KeyFact>
        <KeyFact color="var(--dx-green)" number="1:10">Maximum slope of flared sides</KeyFact>
        <KeyFact color="var(--dx-amber)" number="1:20">Maximum counter slope where ramp meets street</KeyFact>
      </div>

      {/* DIAGRAM 2: Warning Bumps */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '40px', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>Warning Bumps & Crosswalk Alignment</h2>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 720 320" role="group" aria-labelledby="curb-warn-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="curb-warn-title">Detectable Warning Surfaces and Crosswalk Alignment</title>
          <rect width="720" height="320" fill="var(--page-bg-subtle)" />
          <text x="170" y="30" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fontWeight="700" fill="var(--body-secondary)">The bumpy surface at the bottom</text>
          <text x="540" y="30" textAnchor="middle" fontFamily="var(--font-body)" fontSize="12" fontWeight="700" fill="var(--body-secondary)">One ramp per crosswalk</text>

          {/* LEFT: Detectable warnings */}
          {/* Ramp surface */}
          <rect x="80" y="80" width="180" height="120" rx="2" fill="var(--dx-label)" opacity="0.05" stroke="var(--dx-label)" strokeWidth="1" />

          {/* Truncated dome area */}
          <rect x="80" y="160" width="180" height="40" rx="2" fill="var(--dx-violet)" opacity="0.1" stroke="var(--dx-violet)" strokeWidth="2" />
          {/* Dome dots pattern */}
          {[0,1,2,3,4,5].map(r => [0,1,2,3,4,5,6,7].map(c => (
            <circle key={`${r}-${c}`} cx={92 + c * 23} cy={166 + r * 6} r="2" fill="var(--dx-violet)" opacity="0.3" />
          )))}
          <text x="170" y="218" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-violet)" fontWeight="600">truncated domes</text>
          <text x="170" y="234" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-violet)">(raised bumps you can feel)</text>

          {/* 24" depth dimension */}
          <line x1="275" y1="160" x2="275" y2="200" stroke="var(--dx-violet)" strokeWidth="1.2" />
          <line x1="270" y1="160" x2="280" y2="160" stroke="var(--dx-violet)" strokeWidth="1.2" />
          <line x1="270" y1="200" x2="280" y2="200" stroke="var(--dx-violet)" strokeWidth="1.2" />
          <rect x="282" y="170" width="56" height="18" rx="5" fill="var(--dx-violet)" />
          <text x="310" y="183" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fontWeight="700" fill="var(--page-bg)">{d('24', '610')} min</text>

          <text x="170" y="260" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-violet)">warns: you{'\u2019'}re entering the road</text>

          {/* Street label */}
          <text x="170" y="290" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-label)">{'\u2193'} street below</text>

          {/* DIVIDER */}
          <line x1="380" y1="40" x2="380" y2="300" stroke="var(--dx-line)" strokeWidth="1.5" strokeDasharray="6 4" />

          {/* RIGHT: Crosswalk alignment — two ramps per corner */}
          {/* Corner shape */}
          <rect x="450" y="60" width="120" height="180" rx="4" fill="var(--dx-label)" opacity="0.05" stroke="var(--dx-label)" strokeWidth="1" />
          <text x="510" y="155" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-label)" fontWeight="600">sidewalk</text>
          <text x="510" y="170" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-label)">corner</text>

          {/* Ramp 1 pointing down */}
          <rect x="480" y="240" width="60" height="40" rx="2" fill="var(--dx-blue)" opacity="0.1" stroke="var(--dx-blue)" strokeWidth="2" />
          <text x="510" y="263" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-blue)" fontWeight="600">ramp 1</text>
          <text x="510" y="296" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-blue)">{'\u2193'} crosswalk A</text>

          {/* Ramp 2 pointing right */}
          <rect x="570" y="120" width="40" height="60" rx="2" fill="var(--dx-blue)" opacity="0.1" stroke="var(--dx-blue)" strokeWidth="2" />
          <text x="590" y="155" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-blue)" fontWeight="600">ramp 2</text>
          <text x="640" y="155" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-blue)">crosswalk B {'\u2192'}</text>

          {/* X on diagonal */}
          <rect x="430" y="75" width="90" height="34" rx="6" fill="var(--dx-orange)" opacity="0.06" stroke="var(--dx-orange)" strokeWidth="1.5" />
          <text x="475" y="90" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-orange)" fontWeight="600">{'\u2718'} single diagonal</text>
          <text x="475" y="103" textAnchor="middle" fontFamily="var(--font-body)" fontSize="10" fill="var(--dx-orange)">ramp is not OK</text>

          <Dots callouts={WARN_CALLOUTS} active={warnActive} toggle={toggleWarn} />
          <text x="20" y="308" fontFamily="var(--font-body)" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{warnC ? `Showing: ${warnC.label}` : ''}</div>
      <CalloutPanel callout={warnC} onClose={() => setWarnActive(null)} panelRef={warnRef} />
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px', marginTop: '12px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', margin: '0 0 12px' }}>Key numbers {'\u2014'} Warnings & Crosswalks</p>
        <KeyFact color="var(--dx-violet)" number={d('24', '610')}>Minimum depth of truncated dome surface in direction of travel</KeyFact>
        <KeyFact color="var(--dx-violet)" number="Full width">Domes must extend the full width of the curb ramp</KeyFact>
        <KeyFact color="var(--dx-blue)" number="1 per">Each crosswalk gets its own curb ramp {'\u2014'} no shared diagonal ramps</KeyFact>
      </div>

      <style>{`
        @keyframes curbFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
        g[role="button"]:focus .curb-fr { stroke: var(--accent); stroke-width: 2.5; } @media (prefers-reduced-motion: reduce) { .ada-diagram-wrap * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}
