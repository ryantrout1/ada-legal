import React, { useState, useRef, useEffect, useCallback } from 'react';

const KNEE_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#306-knee-and-toe-clearance';

const CALLOUTS = [
  {
    id: 1, label: 'Maximum Depth', section: '§306.2', color: '#C2410C', textColor: '#8B2E08',
    x: 80, y: 42,
    plain: 'Both toe clearance and knee clearance share the same horizontal space under an element. The maximum depth for both is 25 inches from the front edge. Toe clearance extends from the floor up to 9 inches; knee clearance occupies the zone from 9 inches up to 27 inches. The entire clearance envelope is 25 inches deep maximum, measured horizontally from the leading edge of the element toward the wall.',
    legal: '"Toe clearance shall be permitted to extend 25 inches maximum under an element." §306.3.3 Knee clearance "25 inches deep maximum at 9 inches above the finish floor." Both zones share the same 25-inch horizontal envelope.',
    citation: '§306.2'
  },
  {
    id: 2, label: 'Toe Space Height', section: '§306.2.1', color: '#15803D', textColor: '#14532D',
    x: 280, y: 42,
    plain: 'The toe clearance zone is defined as the space from the finish floor up to 9 inches above the floor. This is the area where a wheelchair\'s footrests and the user\'s feet extend under an element. Anything in this zone — pipes, structural supports, trash cans — reduces toe clearance and can block wheelchair access. The full 9-inch height must be maintained across the minimum required depth.',
    legal: '"Space under an element between the finish floor or ground and 9 inches (230 mm) above the finish floor or ground shall be considered toe clearance."',
    citation: '§306.2.1'
  },
  {
    id: 3, label: 'Toe Space Depth', section: '§306.2.2', color: '#2563EB', textColor: '#1E3A8A',
    x: 480, y: 42,
    plain: 'Toe clearance must extend at least 17 inches under the element (measured from the front edge toward the back) and may extend up to 25 inches maximum. The 17-inch minimum ensures footrests can fit underneath. Toe clearance is required to be 30 inches wide minimum. The toe space may extend the full depth of the knee clearance — they are not separate zones but stacked vertically.',
    legal: '"Toe clearance shall extend 17 inches (430 mm) minimum under an element." Maximum: 25 inches. Width: 30 inches minimum per §306.2.3.',
    citation: '§306.2.2'
  },
  {
    id: 4, label: 'Knee Height', section: '§306.3.1', color: '#7C3AED', textColor: '#5B21B6',
    x: 80, y: 250,
    plain: 'At the front edge of the element (the leading edge where the wheelchair approaches), knee clearance must be at least 27 inches above the finish floor. This is the point where the wheelchair user\'s thighs pass under the counter or desk surface. The 27-inch height is measured at a point 8 inches back from the front edge. This height allows standard wheelchair armrests (typically 25–27 inches) to slide under.',
    legal: '"Knee clearance shall be 27 inches (685 mm) high minimum, 30 inches (760 mm) wide minimum, and 8 inches (205 mm) deep minimum."',
    citation: '§306.3.1'
  },
  {
    id: 5, label: 'Knee Depth', section: '§306.3.3', color: '#92400E', textColor: '#78350F',
    x: 280, y: 250,
    plain: 'The knee clearance envelope tapers from front to back. At 27 inches above the floor, the clearance must be at least 8 inches deep (from the front edge back). At 9 inches above the floor (where it transitions to toe clearance), the depth must be at least 11 inches. Between these two heights, the clearance tapers linearly — creating a sloped profile that follows the natural shape of seated legs.',
    legal: '"At 27 inches above the finish floor: 8 inches deep minimum." "At 9 inches above the finish floor: 11 inches deep minimum, 25 inches deep maximum." The space between tapers linearly.',
    citation: '§306.3.3'
  },
  {
    id: 6, label: 'Width', section: '§306.3.2', color: '#BE185D', textColor: '#9D174D',
    x: 480, y: 250,
    plain: 'Both knee clearance and toe clearance must be at least 30 inches wide. This width accommodates a standard wheelchair (typically 25–27 inches wide including wheels). The 30-inch measurement is taken perpendicular to the approach direction, between any vertical obstructions on either side. Pipe covers, structural elements, or equipment must not encroach into this 30-inch width.',
    legal: '"Knee clearance shall be 30 inches (760 mm) wide minimum." Toe clearance: "30 inches wide minimum." Both measured clear of any obstructions.',
    citation: '§306.3.2'
  },
  {
    id: 7, label: 'Common Applications', section: 'Advisory §306', color: '#0E7490', textColor: '#0C4A6E',
    x: 650, y: 140,
    plain: 'Knee and toe clearance is required under lavatories (§606), dining and work surfaces (§902), sales and service counters (§904), and check-writing surfaces. Elements like pipes, valves, and enclosures underneath must not reduce the required clearance. When insulation or protection covers are added to pipes (as required at lavatories), they must fit within the clearance envelope without reducing it.',
    legal: 'Advisory §306: "Clearances are required under lavatories (§606), dining surfaces, work surfaces (§902), and sales and service counters (§904)." Elements cannot reduce required knee/toe clearance.',
    citation: '§306'
  }
];

function makeLink(text) {
  return (<a href={KNEE_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }} aria-label={`${text} on ADA.gov`}>{text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>↗</span></a>);
}
function parseCitations(text) {
  return text.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p);
}

export default function KneeToeDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback((id) => setActive(prev => prev === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}"`;
  const ac = CALLOUTS.find(c => c.id === active);

  /* Layout: floor at y=440, counter surface at ~y=160 (27" zone top) */
  /* Scale: ~10.4 px per inch from floor to 27" mark */

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>§306 Knee & Toe Clearance</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 900 480" role="img" aria-labelledby="knee-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="knee-title">ADA §306 Knee and Toe Clearance — Side Cross-Section</title>
          <rect x="0" y="0" width="900" height="480" fill="var(--page-bg-subtle)" />

          <text x="450" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">SIDE CROSS-SECTION — CLEARANCE ENVELOPE</text>

          {/* Wall */}
          <rect x="140" y="60" width="12" height="390" fill="#94A3B8" rx="1" />
          <text x="146" y="55" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">WALL</text>

          {/* Floor */}
          <line x1="100" y1="440" x2="850" y2="440" stroke="#94A3B8" strokeWidth="2.5" />
          <text x="130" y="460" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">FLOOR</text>

          {/* Counter/desk surface */}
          <rect x="152" y="155" width="240" height="12" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="272" y="148" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563" fontWeight="600">COUNTER / DESK SURFACE</text>

          {/* ===== CLEARANCE ENVELOPE ===== */}
          {/* Toe zone: floor(440) to 9"(347), 25" deep max from front edge(392) back to wall(152) */}
          {/* Knee zone: 9"(347) to 27"(160), tapers from 11" deep at 9" to 8" deep at 27" */}
          {/* Front edge at x=392 (25" from wall at x=152, scale: ~9.6px/inch) */}

          {/* Toe clearance zone (full rectangle) */}
          <rect x="152" y="347" width="240" height="93" rx="0" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="272" y="400" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#14532D" fontWeight="600">TOE CLEARANCE</text>
          <text x="272" y="415" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#14532D">below {d('9', '230')}</text>

          {/* Knee clearance zone (tapered trapezoid) */}
          {/* At 27" (y=160): 8" deep = ~77px from front edge(392) → x=315 */}
          {/* At 9" (y=347): 11" deep min = ~106px → x=286, but can go to 25" = x=152 */}
          <path d="M 392 160 L 315 160 L 286 347 L 392 347 Z" fill="#7C3AED" opacity="0.06" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="360" y="260" fontFamily="Manrope, sans-serif" fontSize="9" fill="#5B21B6" fontWeight="600">KNEE</text>
          <text x="360" y="275" fontFamily="Manrope, sans-serif" fontSize="8" fill="#5B21B6">{d('9', '230')}–{d('27', '685')}</text>

          {/* Taper line (sloped back edge of knee zone) */}
          <line x1="315" y1="160" x2="286" y2="347" stroke="#B45309" strokeWidth="2" strokeDasharray="4 3" />
          <text x="280" y="256" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" fontWeight="600" transform="rotate(-76 280 256)">TAPER</text>

          {/* ===== DIMENSION LINES ===== */}

          {/* 27" height (floor to knee top) */}
          <line x1="115" y1="160" x2="115" y2="440" stroke="#7C3AED" strokeWidth="1" />
          <line x1="108" y1="160" x2="122" y2="160" stroke="#7C3AED" strokeWidth="1" />
          <line x1="108" y1="440" x2="122" y2="440" stroke="#7C3AED" strokeWidth="1" />
          <rect x="90" y="293" width="46" height="14" rx="3" fill="#7C3AED" />
          <text x="113" y="303" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">{d('27', '685')}</text>

          {/* 9" height (floor to toe/knee boundary) */}
          <line x1="128" y1="347" x2="128" y2="440" stroke="#15803D" strokeWidth="1" />
          <line x1="122" y1="347" x2="134" y2="347" stroke="#15803D" strokeWidth="1" />
          <rect x="90" y="385" width="40" height="14" rx="3" fill="#15803D" />
          <text x="110" y="395" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">{d('9', '230')}</text>

          {/* 8" deep at 27" high */}
          <line x1="315" y1="167" x2="392" y2="167" stroke="#B45309" strokeWidth="1" />
          <line x1="315" y1="160" x2="315" y2="174" stroke="#B45309" strokeWidth="1" />
          <line x1="392" y1="160" x2="392" y2="174" stroke="#B45309" strokeWidth="1" />
          <rect x="326" y="170" width="58" height="13" rx="3" fill="#B45309" />
          <text x="355" y="179" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('8', '205')} min</text>

          {/* 11" deep at 9" high */}
          <line x1="286" y1="340" x2="392" y2="340" stroke="#B45309" strokeWidth="1" />
          <line x1="286" y1="333" x2="286" y2="347" stroke="#B45309" strokeWidth="1" />
          <line x1="392" y1="333" x2="392" y2="347" stroke="#B45309" strokeWidth="1" />
          <rect x="306" y="324" width="62" height="13" rx="3" fill="#B45309" />
          <text x="337" y="333" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('11', '280')} min</text>

          {/* 25" max total depth */}
          <line x1="152" y1="452" x2="392" y2="452" stroke="#C2410C" strokeWidth="1" />
          <line x1="152" y1="446" x2="152" y2="458" stroke="#C2410C" strokeWidth="1" />
          <line x1="392" y1="446" x2="392" y2="458" stroke="#C2410C" strokeWidth="1" />
          <rect x="238" y="455" width="68" height="14" rx="3" fill="#C2410C" />
          <text x="272" y="465" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">{d('25', '635')} max</text>

          {/* 17" min toe depth */}
          <line x1="232" y1="430" x2="392" y2="430" stroke="#2563EB" strokeWidth="1" />
          <line x1="232" y1="424" x2="232" y2="436" stroke="#2563EB" strokeWidth="1" />
          <rect x="280" y="418" width="62" height="13" rx="3" fill="#2563EB" />
          <text x="311" y="427" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('17', '430')} min</text>

          {/* Front edge line */}
          <line x1="392" y1="140" x2="392" y2="455" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <text x="396" y="138" fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563">FRONT EDGE</text>


          {/* ===== WHEELCHAIR USER ===== */}
          {/* Rear wheel */}
          <circle cx="610" cy="406" r="34" fill="none" stroke="#64748B" strokeWidth="1.8" />
          {/* Front caster */}
          <circle cx="690" cy="428" r="10" fill="none" stroke="#64748B" strokeWidth="1.2" />
          {/* Frame */}
          <line x1="604" y1="372" x2="690" y2="372" stroke="#64748B" strokeWidth="2" />
          <line x1="604" y1="372" x2="594" y2="402" stroke="#64748B" strokeWidth="1.5" />
          <line x1="690" y1="372" x2="690" y2="418" stroke="#64748B" strokeWidth="1.5" />
          {/* Backrest */}
          <line x1="604" y1="372" x2="600" y2="330" stroke="#64748B" strokeWidth="2" />
          {/* Person torso */}
          <line x1="620" y1="370" x2="610" y2="310" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          {/* Head */}
          <circle cx="608" cy="296" r="12" fill="#E2E8F0" stroke="#475569" strokeWidth="1.8" />
          {/* Arms reaching forward to counter */}
          <line x1="614" y1="340" x2="420" y2="168" stroke="#475569" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          {/* Thighs (knees going under counter) */}
          <line x1="620" y1="370" x2="450" y2="300" stroke="#475569" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
          {/* Lower legs */}
          <line x1="450" y1="300" x2="430" y2="400" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
          {/* Footrest */}
          <line x1="680" y1="430" x2="700" y2="430" stroke="#64748B" strokeWidth="2" />

          {/* Arrow showing approach */}
          <path d="M 680 380 L 420 380" fill="none" stroke="#7C3AED" strokeWidth="1" strokeDasharray="5 3" opacity="0.3" markerEnd="url(#kneeArr)" />
          <defs>
            <marker id="kneeArr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
              <polygon points="0 0, 7 2.5, 0 5" fill="#7C3AED" opacity="0.4" />
            </marker>
          </defs>

          {/* Width note (30") */}
          <rect x="620" y="152" width="150" height="30" rx="6" fill="#DB2777" opacity="0.06" stroke="#DB2777" strokeWidth="1" strokeDasharray="4 3" />
          <text x="695" y="170" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#9D174D" fontWeight="600">Width: {d('30', '760')} min (into screen)</text>

          {/* Applications note */}
          <rect x="560" y="200" width="260" height="60" rx="8" fill="#0EA5E9" opacity="0.04" stroke="#0891B2" strokeWidth="1" />
          <text x="690" y="222" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#0C4A6E" fontWeight="600">Common Applications:</text>
          <text x="690" y="236" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fill="#0C4A6E">Lavatories · Desks · Counters</text>
          <text x="690" y="250" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fill="#0C4A6E">Dining surfaces · Check-writing areas</text>


          {/* CALLOUT DOTS */}
          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label} — ${c.section}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="475" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'kneeFade 0.25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: ac.color, color: 'var(--page-bg)', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{ac.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{ac.label}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: ac.color, background: `${ac.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{ac.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">✕</span></button>
          </div>
          <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{ac.plain}</p></div>
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard — {parseCitations(ac.citation)}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCitations(ac.legal)}</p>
            </div></aside>
          </div>
        </div>
      )}
      <style>{`@keyframes kneeFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}