import React, { useState, useRef, useEffect, useCallback } from 'react';

const CURB_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#406-curb-ramps';

const CALLOUTS = [
  {
    id: 1, label: 'Running Slope', section: '§406.1', color: '#C2410C', textColor: '#8B2E08',
    x: 220, y: 42,
    plain: 'The running slope of a curb ramp (measured in the direction of travel) must not be steeper than 1:12. This means for every 1 inch of height change, the ramp must extend at least 12 inches horizontally. A typical 6-inch curb requires a minimum 72-inch (6-foot) ramp. Steeper slopes make wheelchair descent dangerous and ascent exhausting. Cross slope must not exceed 1:48 (2%).',
    legal: '"Curb ramp runs shall have a running slope not steeper than 1:12." Per §405.2 as referenced. Cross slope per §405.3: "not steeper than 1:48."',
    citation: '§406.1'
  },
  {
    id: 2, label: 'Width', section: '§406.1', color: '#16A34A', textColor: '#14532D',
    x: 420, y: 42,
    plain: 'The clear width of a curb ramp must be at least 36 inches, measured between the flared sides (not including them). This provides enough room for a standard wheelchair to travel up or down without the wheels catching on the ramp edges. The width is measured perpendicular to the direction of travel at the narrowest point of the ramp run.',
    legal: '"Curb ramps shall be 36 inches wide minimum, exclusive of flared sides." Clear width per §405.5.',
    citation: '§406.1, §405.5'
  },
  {
    id: 3, label: 'Flared Sides', section: '§406.3', color: '#2563EB', textColor: '#1E3A8A',
    x: 120, y: 175,
    plain: 'When a curb ramp is located where pedestrians walk across the ramp (perpendicular to the ramp direction), the sides must be flared at a maximum slope of 1:10. Flared sides create a gradual transition rather than an abrupt edge that could trip pedestrians. If the ramp is located where no one would walk across it (such as in a planter or against a building), flared sides are not required — vertical returns are acceptable.',
    legal: '"Where a pedestrian circulation path crosses the curb ramp, flared sides shall have a slope of 1:10 maximum, measured parallel to the curb."',
    citation: '§406.3'
  },
  {
    id: 4, label: 'Detectable Warnings', section: '§406.8', color: '#7C3AED', textColor: '#5B21B6',
    x: 420, y: 260,
    plain: 'At the bottom of the curb ramp where it meets the street, a detectable warning surface of truncated domes must be installed. These raised bumps alert blind or visually impaired pedestrians that they are transitioning from sidewalk to roadway. The warning surface must be 36 inches deep (in the direction of travel), extend the full width of the curb ramp, and contrast visually with the surrounding surface (typically bright yellow or red on gray concrete).',
    legal: '"A curb ramp shall have a detectable warning complying with §705." §705.1: "Truncated domes 36 inches minimum in the direction of travel, extending the full width of the curb ramp." Visual contrast with adjacent surfaces required.',
    citation: '§406.8'
  },
  {
    id: 5, label: 'Top Landing', section: '§406.4', color: '#D97706', textColor: '#78350F',
    x: 620, y: 90,
    plain: 'At the top of the curb ramp where it meets the sidewalk, a landing at least 36 inches long (in the direction of travel) and at least as wide as the ramp must be provided. The landing provides a level area for a wheelchair user to stop, change direction, or transition onto the sidewalk. Maximum slope of the landing is 1:48 (about 2%) for drainage. The landing must connect directly to an accessible route.',
    legal: '"A landing 36 inches minimum by 48 inches minimum shall be provided at the top of curb ramps." Per §406.4. Slope: 1:48 maximum in any direction. Must adjoin accessible route.',
    citation: '§406.4'
  },
  {
    id: 6, label: 'Counter Slope', section: '§406.2', color: '#DB2777', textColor: '#9D174D',
    x: 220, y: 260,
    plain: 'Where the gutter or road surface meets the bottom of the curb ramp, the counter slope (the slope of the gutter pan or street going away from the ramp) must not exceed 1:20 (5%). If the counter slope is too steep, a wheelchair user descending the ramp could tip forward when the front casters hit the abrupt change in slope. The transition between ramp and street must be flush (no lip or gap).',
    legal: '"The counter slope of the gutter or street at the foot of a curb ramp shall not be steeper than 1:20."',
    citation: '§406.2'
  },
  {
    id: 7, label: 'Parallel Curb Ramps', section: '§406.5', color: '#0891B2', textColor: '#0C4A6E',
    x: 700, y: 220,
    plain: 'When the sidewalk is too narrow for a standard perpendicular curb ramp, a parallel curb ramp runs parallel to the curb with the ramp descending in the sidewalk direction. At the bottom of the parallel ramp, a 48-inch minimum turning space must be provided so the wheelchair user can turn 90 degrees to face the street before crossing. The ramp must still meet the 1:12 slope and 36-inch width requirements.',
    legal: '"Where a parallel curb ramp is provided, a turning space 48 inches minimum shall be provided at the bottom of the curb ramp." Running slope: 1:12 max. Width: 36 inches minimum.',
    citation: '§406.5'
  }
];

function makeLink(text) {
  return (<a href={CURB_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }} aria-label={`${text} on ADA.gov`}>{text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>↗</span></a>);
}
function parseCitations(text) {
  return text.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p);
}

export default function CurbRampDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback((id) => setActive(prev => prev === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}"`;
  const ac = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§406 Curb Ramps</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: '28px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 900 320" role="img" aria-labelledby="curb-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="curb-title">ADA §406 Curb Ramp — Isometric View</title>
          <rect x="0" y="0" width="900" height="320" fill="#FAFAF9" />

          {/* ===== ISOMETRIC CURB RAMP ===== */}
          {/* Street level surface */}
          <polygon points="50,260 450,280 850,260 450,240" fill="#94A3B8" opacity="0.08" stroke="#94A3B8" strokeWidth="1" />
          <text x="450" y="275" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#4B5563" fontWeight="500">STREET</text>

          {/* Curb line */}
          <line x1="100" y1="230" x2="800" y2="230" stroke="#94A3B8" strokeWidth="2.5" />
          {/* Curb face (vertical) */}
          <rect x="100" y="220" width="700" height="10" fill="#94A3B8" opacity="0.2" />

          {/* Sidewalk (elevated) */}
          <rect x="100" y="60" width="700" height="160" rx="2" fill="#E7E5E4" opacity="0.15" stroke="#94A3B8" strokeWidth="1" />
          <text x="200" y="85" fontFamily="Manrope, sans-serif" fontSize="10" fill="#4B5563" fontWeight="500">SIDEWALK</text>
          <text x="680" y="85" fontFamily="Manrope, sans-serif" fontSize="10" fill="#4B5563" fontWeight="500">SIDEWALK</text>

          {/* Ramp run (center, going from sidewalk down to street) */}
          <polygon points="350,100 550,100 580,230 320,230" fill="#C2410C" opacity="0.06" stroke="#C2410C" strokeWidth="1.5" />

          {/* Slope arrows on ramp */}
          <line x1="450" y1="110" x2="450" y2="220" stroke="#C2410C" strokeWidth="1.5" markerEnd="url(#curbSlope)" />
          <text x="460" y="170" fontFamily="Manrope, sans-serif" fontSize="8" fill="#8B2E08" fontWeight="700">1:12 max</text>

          <defs>
            <marker id="curbSlope" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#C2410C" />
            </marker>
          </defs>

          {/* Flared side — left */}
          <polygon points="280,100 350,100 320,230 250,230" fill="#2563EB" opacity="0.06" stroke="#2563EB" strokeWidth="1.2" />
          <text x="290" y="175" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A" fontWeight="600" transform="rotate(-60 290 175)">FLARE 1:10</text>

          {/* Flared side — right */}
          <polygon points="550,100 620,100 650,230 580,230" fill="#2563EB" opacity="0.06" stroke="#2563EB" strokeWidth="1.2" />
          <text x="610" y="175" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A" fontWeight="600" transform="rotate(60 610 175)">FLARE 1:10</text>

          {/* Detectable warnings at bottom */}
          <rect x="325" y="196" width="250" height="32" rx="2" fill="#7C3AED" opacity="0.12" stroke="#7C3AED" strokeWidth="1.5" />
          {/* Truncated dome pattern */}
          {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
            <React.Fragment key={`row${i}`}>
              {[0,1,2].map(j => (
                <circle key={`d${i}${j}`} cx={335 + i * 22} cy={204 + j * 10} r="2.5" fill="#7C3AED" opacity="0.3" />
              ))}
            </React.Fragment>
          ))}
          <text x="450" y="215" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#5B21B6" fontWeight="700">DETECTABLE WARNINGS ({d('36', '915')} deep)</text>

          {/* Top landing */}
          <rect x="340" y="68" width="220" height="32" rx="2" fill="#D97706" opacity="0.06" stroke="#D97706" strokeWidth="1.2" strokeDasharray="5 3" />
          <text x="450" y="88" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" fontWeight="600">LANDING ({d('36', '915')} min)</text>

          {/* Width dimension */}
          <line x1="350" y1="100" x2="550" y2="100" stroke="#16A34A" strokeWidth="1.2" />
          <line x1="350" y1="94" x2="350" y2="106" stroke="#16A34A" strokeWidth="1" />
          <line x1="550" y1="94" x2="550" y2="106" stroke="#16A34A" strokeWidth="1" />
          <rect x="418" y="103" width="64" height="13" rx="3" fill="#16A34A" />
          <text x="450" y="112" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('36', '915')} min</text>

          {/* Counter slope note */}
          <rect x="320" y="232" width="260" height="16" rx="3" fill="#DB2777" opacity="0.06" stroke="#DB2777" strokeWidth="1" strokeDasharray="4 3" />
          <text x="450" y="243" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#9D174D" fontWeight="600">Counter slope ≤ 1:20 at gutter</text>

          {/* Parallel ramp sketch (small, far right) */}
          <rect x="720" y="120" width="120" height="90" rx="4" fill="#0EA5E9" opacity="0.04" stroke="#0891B2" strokeWidth="1" />
          <text x="780" y="140" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#0C4A6E" fontWeight="600">PARALLEL</text>
          <text x="780" y="152" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#0C4A6E">ALTERNATIVE</text>
          <line x1="740" y1="160" x2="800" y2="160" stroke="#0891B2" strokeWidth="1" />
          <rect x="740" y="162" width="60" height="30" rx="2" fill="#0EA5E9" opacity="0.08" stroke="#0891B2" strokeWidth="0.8" />
          <text x="770" y="180" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#0C4A6E">{d('48', '1220')} turn</text>


          {/* CALLOUT DOTS */}
          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label} — ${c.section}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="310" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: '12px', background: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden', animation: 'curbFade 0.25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--slate-200)', background: '#FAFAF9', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: ac.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{ac.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>{ac.label}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: ac.color, background: `${ac.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{ac.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--slate-200)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-600)', minHeight: '44px' }}>Close <span aria-hidden="true">✕</span></button>
          </div>
          <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)', lineHeight: 1.75, margin: 0 }}>{ac.plain}</p></div>
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: '#FFFBF7', borderLeft: '3px solid #C2410C', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--slate-500)', margin: '0 0 8px' }}>Official Standard — {parseCitations(ac.citation)}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCitations(ac.legal)}</p>
            </div></aside>
          </div>
        </div>
      )}
      <style>{`@keyframes curbFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}