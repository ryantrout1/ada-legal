import React, { useState, useRef, useEffect, useCallback } from 'react';

const PROT_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#307-protruding-objects';

const CALLOUTS = [
  {
    id: 1, label: 'Wall-Mounted Limit', section: '§307.2', color: '#C2410C', textColor: '#8B2E08',
    x: 80, y: 42,
    plain: 'Objects mounted on walls with their leading edges between 27 and 80 inches above the floor may protrude no more than 4 inches into the circulation path. This is the most commonly violated provision — fire extinguisher cabinets, AED boxes, display cases, and wall-mounted shelves frequently exceed the 4-inch limit. People who are blind or have low vision cannot detect objects above 27 inches with a cane, so the 4-inch limit prevents them from walking into hazards.',
    legal: '"Objects with leading edges more than 27 inches (685 mm) and not more than 80 inches (2030 mm) above the finish floor or ground shall protrude 4 inches (100 mm) maximum horizontally into the circulation path."',
    citation: '§307.2'
  },
  {
    id: 2, label: 'Below 27 Inches', section: '§307.2', color: '#15803D', textColor: '#14532D',
    x: 280, y: 42,
    plain: 'Objects with leading edges at or below 27 inches above the floor have no protrusion limit. The reason is simple: a person using a long cane sweeps the cane at floor level in an arc. Any object at or below 27 inches will be detected by the cane before the person walks into it. Common examples include drinking fountains (mounted with rim at 27 inches or lower), benches, planters, and guard rails.',
    legal: '"Objects with leading edges at or below 27 inches above the finish floor may protrude any amount." These objects are within cane-detectable range.',
    citation: '§307.2'
  },
  {
    id: 3, label: 'Post-Mounted', section: '§307.3', color: '#2563EB', textColor: '#1E3A8A',
    x: 480, y: 42,
    plain: 'Objects mounted on free-standing posts or pylons (like signs or phone enclosures) may protrude up to 12 inches maximum beyond the post when their leading edge is between 27 and 80 inches above the floor. If the object extends more than 12 inches, its bottom edge must be 27 inches or lower so a cane can detect it. Alternatively, a detectable barrier (like a rail or curb) can be placed at the base of the post.',
    legal: '"Free-standing objects mounted on posts or pylons shall overhang 12 inches (305 mm) maximum when located 27 inches (685 mm) minimum and 80 inches (2030 mm) maximum above the finish floor."',
    citation: '§307.3'
  },
  {
    id: 4, label: 'Overhead Clearance', section: '§307.4', color: '#7C3AED', textColor: '#5B21B6',
    x: 680, y: 42,
    plain: 'Vertical clearance of 80 inches minimum must be maintained in all circulation areas, including hallways, lobbies, and accessible routes. This protects against head injuries. Where overhead clearance is less than 80 inches (such as under stairs, escalators, or sloped ceilings), a guardrail or barrier must be placed at 27 inches or lower to prevent people from walking into the low-headroom zone. The barrier must be detectable by cane.',
    legal: '"Vertical clearance shall be 80 inches (2030 mm) high minimum." Where vertical clearance is less than 80 inches: "a guardrail or other barrier shall be provided where the vertical clearance is less than 80 inches."',
    citation: '§307.4'
  },
  {
    id: 5, label: 'Cane Detection', section: '§307.2', color: '#92400E', textColor: '#78350F',
    x: 180, y: 290,
    plain: 'The 27-inch line is the critical threshold for cane detection. A person using a long white cane typically sweeps in an arc approximately 27 inches above the floor. Objects above this line that protrude more than 4 inches are invisible to the cane and create a head or body impact hazard. Objects below 27 inches are detected by the cane sweep before the person reaches them. This is why 27 inches is the dividing line for protrusion rules.',
    legal: '"Objects with leading edges more than 27 inches above the finish floor" are subject to the 4-inch limit because they are outside the detectable zone of a long cane.',
    citation: '§307.2'
  },
  {
    id: 6, label: 'Circulation Width', section: '§307.5', color: '#BE185D', textColor: '#9D174D',
    x: 480, y: 290,
    plain: 'Protruding objects cannot reduce the required clear width of an accessible route. The minimum clear width is 36 inches (narrowing to 32 inches at a single point for up to 24 inches). When measuring clear width, protruding objects are measured from their outermost edge, not from the wall. A hallway that is 40 inches wide with a 6-inch protrusion only has 34 inches of usable width.',
    legal: '"Protruding objects shall not reduce the clear width required for accessible routes." §403.5.1: "36 inches minimum." Objects encroaching into this width are violations.',
    citation: '§307.5'
  },
  {
    id: 7, label: 'Common Violations', section: 'Advisory §307', color: '#0E7490', textColor: '#0C4A6E',
    x: 680, y: 290,
    plain: 'The most frequent §307 violations include: fire extinguisher cabinets (recessing into the wall solves this), AED boxes, wall-mounted display cases, open stairway undersides (must have a cane-detectable barrier when headroom drops below 80 inches), decorative wall sconces and artwork, building directories and signage brackets, drinking fountains mounted too high, and wall-mounted TV screens or monitors in waiting areas.',
    legal: 'Advisory §307.2: "Examples of protruding objects include wall-mounted fire extinguisher cabinets, drinking fountains, signs, and similar elements." Recessing objects into the wall or adding a cane-detectable apron below are common solutions.',
    citation: '§307'
  }
];

function makeLink(text) {
  return (<a href={PROT_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }} aria-label={`${text} on ADA.gov`}>{text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>↗</span></a>);
}
function parseCitations(text) {
  return text.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p);
}

export default function ProtrudingObjectsDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback((id) => setActive(prev => prev === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = (e) => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}"`;
  const ac = CALLOUTS.find(c => c.id === active);

  /* Layout: floor y=440, 80" line ~y=80, 27" line ~y=304 */
  /* Scale: ~4.5px per inch */

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>§307 Protruding Objects</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 900 480" role="img" aria-labelledby="prot-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="prot-title">ADA §307 Protruding Objects — Side Elevation with Detection Zones</title>
          <rect x="0" y="0" width="900" height="480" fill="var(--page-bg-subtle)" />

          <text x="450" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">SIDE ELEVATION — PROTRUSION LIMITS</text>

          {/* Wall (left side, tall) */}
          <rect x="60" y="50" width="12" height="400" fill="#94A3B8" rx="1" />

          {/* Floor */}
          <line x1="40" y1="440" x2="860" y2="440" stroke="#94A3B8" strokeWidth="2.5" />

          {/* ===== REFERENCE LINES ===== */}
          {/* 80" overhead clearance line */}
          <line x1="50" y1="80" x2="860" y2="80" stroke="#7C3AED" strokeWidth="1.2" strokeDasharray="8 4" />
          <rect x="780" y="68" width="72" height="15" rx="4" fill="#7C3AED" />
          <text x="816" y="79" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">{d('80', '2030')}</text>

          {/* 27" cane detection line */}
          <line x1="50" y1="318" x2="860" y2="318" stroke="#B45309" strokeWidth="1.5" strokeDasharray="6 3" />
          <rect x="780" y="306" width="72" height="15" rx="4" fill="#B45309" />
          <text x="816" y="317" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">{d('27', '685')}</text>

          {/* Zone labels */}
          <rect x="800" y="170" width="52" height="30" rx="5" fill="#C2410C" opacity="0.06" stroke="#C2410C" strokeWidth="0.8" />
          <text x="826" y="183" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#8B2E08" fontWeight="600">HAZARD</text>
          <text x="826" y="193" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#8B2E08">ZONE</text>

          <rect x="800" y="365" width="52" height="30" rx="5" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="0.8" />
          <text x="826" y="378" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#14532D" fontWeight="600">CANE</text>
          <text x="826" y="388" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#14532D">DETECT</text>


          {/* ===== SCENARIO 1: Wall-mounted object 27-80" (e.g., fire extinguisher cabinet) ===== */}
          <text x="160" y="70" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#8B2E08">(A) WALL-MOUNTED</text>

          {/* Object (fire ext cabinet) */}
          <rect x="72" y="180" width="45" height="60" rx="4" fill="#C2410C" opacity="0.1" stroke="#C2410C" strokeWidth="2" />
          <text x="94" y="215" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#8B2E08" fontWeight="600">CABINET</text>

          {/* 4" max protrusion dim */}
          <line x1="72" y1="250" x2="117" y2="250" stroke="#C2410C" strokeWidth="1" />
          <line x1="72" y1="244" x2="72" y2="256" stroke="#C2410C" strokeWidth="1" />
          <line x1="117" y1="244" x2="117" y2="256" stroke="#C2410C" strokeWidth="1" />
          <rect x="72" y="256" width="52" height="13" rx="3" fill="#C2410C" />
          <text x="98" y="265" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('4', '100')} max</text>

          {/* Leading edge indicator */}
          <line x1="117" y1="180" x2="117" y2="240" stroke="#C2410C" strokeWidth="0.8" strokeDasharray="2 2" />
          <text x="130" y="195" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#8B2E08">leading edge</text>


          {/* ===== SCENARIO 2: Wall-mounted below 27" (drinking fountain) ===== */}
          <text x="340" y="70" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#14532D">(B) BELOW 27"</text>

          {/* Wall segment for this scenario */}
          <rect x="260" y="50" width="12" height="400" fill="#94A3B8" rx="1" />

          {/* Object (drinking fountain, bottom edge below 27") */}
          <rect x="272" y="330" width="60" height="60" rx="6" fill="#15803D" opacity="0.1" stroke="#15803D" strokeWidth="2" />
          <text x="302" y="365" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#14532D" fontWeight="600">FOUNTAIN</text>

          {/* No limit arrow */}
          <line x1="332" y1="360" x2="380" y2="360" stroke="#15803D" strokeWidth="1.5" markerEnd="url(#protArr)" />
          <text x="362" y="352" fontFamily="Manrope, sans-serif" fontSize="7" fill="#14532D" fontWeight="600">Any amount OK</text>
          <text x="362" y="380" fontFamily="Manrope, sans-serif" fontSize="6" fill="#14532D">(cane detects it)</text>

          <defs>
            <marker id="protArr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
              <polygon points="0 0, 7 2.5, 0 5" fill="#15803D" />
            </marker>
          </defs>


          {/* ===== SCENARIO 3: Post-mounted object ===== */}
          <text x="555" y="70" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#1E3A8A">(C) POST-MOUNTED</text>

          {/* Post */}
          <rect x="510" y="100" width="8" height="340" fill="#94A3B8" rx="1" />

          {/* Object on post (sign) */}
          <rect x="518" y="170" width="80" height="50" rx="4" fill="#2563EB" opacity="0.1" stroke="#2563EB" strokeWidth="2" />
          <text x="558" y="200" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A" fontWeight="600">SIGN</text>

          {/* 12" max protrusion */}
          <line x1="518" y1="230" x2="598" y2="230" stroke="#2563EB" strokeWidth="1" />
          <line x1="518" y1="224" x2="518" y2="236" stroke="#2563EB" strokeWidth="1" />
          <line x1="598" y1="224" x2="598" y2="236" stroke="#2563EB" strokeWidth="1" />
          <rect x="528" y="234" width="58" height="13" rx="3" fill="#2563EB" />
          <text x="557" y="243" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('12', '305')} max</text>


          {/* ===== PERSON WITH CANE ===== */}
          {/* Standing person */}
          <circle cx="720" cy="120" r="14" fill="#E2E8F0" stroke="#475569" strokeWidth="1.8" />
          {/* Body */}
          <line x1="720" y1="134" x2="720" y2="310" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
          {/* Legs */}
          <line x1="720" y1="310" x2="700" y2="430" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="720" y1="310" x2="740" y2="430" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          {/* Arm holding cane */}
          <line x1="720" y1="200" x2="690" y2="280" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          {/* Cane (sweeping) */}
          <line x1="690" y1="280" x2="650" y2="435" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" />
          {/* Cane sweep arc */}
          <path d="M 630 435 Q 650 420 670 435" fill="none" stroke="#B45309" strokeWidth="1.5" strokeDasharray="3 2" />

          {/* Cane detection zone label */}
          <text x="660" y="420" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" fontWeight="600">Cane sweep</text>

          {/* Height labels on side */}
          <line x1="44" y1="80" x2="44" y2="440" stroke="#94A3B8" strokeWidth="0.8" />
          <line x1="38" y1="80" x2="50" y2="80" stroke="#94A3B8" strokeWidth="0.8" />
          <line x1="38" y1="318" x2="50" y2="318" stroke="#94A3B8" strokeWidth="0.8" />
          <line x1="38" y1="440" x2="50" y2="440" stroke="#94A3B8" strokeWidth="0.8" />

          {/* Circulation width note */}
          <rect x="620" y="340" width="160" height="40" rx="6" fill="#DB2777" opacity="0.04" stroke="#DB2777" strokeWidth="1" />
          <text x="700" y="358" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fill="#9D174D" fontWeight="600">Min route width: {d('36', '915')}</text>
          <text x="700" y="372" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#9D174D">Protrusions cannot reduce this</text>


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
        <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'protFade 0.25s ease-out' }}>
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
      <style>{`@keyframes protFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}