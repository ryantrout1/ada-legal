import React, { useState, useRef, useEffect, useCallback } from 'react';

const TUB_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#607-bathtubs';

const CALLOUTS = [
  {
    id: 1, label: 'Clear Floor Space', section: '§607.2', color: '#C2410C', textColor: '#8B2E08',
    x: 100, y: 42,
    plain: 'A clear floor space of at least 30 inches wide by 60 inches long must be provided alongside the bathtub, extending the full length of the tub. If a permanent seat is provided at the head end of the tub, the clear floor space must extend 12 inches beyond the seat wall — so the wheelchair can pull past the seat for an easier lateral transfer. The floor must be level and slip-resistant.',
    legal: '"A clearance in front of bathtubs shall extend the length of the bathtub and shall be 30 inches wide minimum." §607.2 EXCEPTION: "Where a permanent seat is provided at the head end of the bathtub, the clearance shall extend 12 inches minimum beyond the wall at the head end of the bathtub."',
    citation: '§607.2'
  },
  {
    id: 2, label: 'Bathtub Seat', section: '§607.3', color: '#15803D', textColor: '#14532D',
    x: 330, y: 42,
    plain: 'A seat is required in accessible bathtubs — either a permanent (built-in) seat at the head end or a removable seat. Permanent seats must be 15 inches deep minimum and extend from the back wall to or beyond the outer edge of the tub. Removable seats must also be 15 inches deep and span the full width of the tub. The top of the seat must be at the same height as the tub rim (17–19 inches) to allow a smooth transfer from a wheelchair.',
    legal: '"An in-tub seat or a seat at the head end of the bathtub shall be provided." §607.3 Permanent seats: "15 inches deep minimum, extending from the back wall to or beyond the outer edge of the bathtub." Removable: "15 inches deep minimum, capable of secure placement."',
    citation: '§607.3'
  },
  {
    id: 3, label: 'Grab Bars (With Seat)', section: '§607.4.1', color: '#2563EB', textColor: '#1E3A8A',
    x: 100, y: 190,
    plain: 'When a permanent seat is provided at the head end: Two horizontal grab bars on the back (long) wall — one at 33–36 inches above the floor and one at 8–10 inches above the tub rim, each 24 inches long minimum starting near the seat end. One grab bar on the head-end wall at 33–36 inches above the floor, extending the full width of the tub. The lower back-wall bar helps with balance during transfer.',
    legal: '"Two grab bars on the back wall, one 33 to 36 inches above the floor and one 8 to 10 inches above the rim of the bathtub, each 24 inches long minimum, installed at the head end of the bathtub." Head-end wall: "one bar 33 to 36 inches above the floor, mounted on the head end wall at the front edge of the bathtub."',
    citation: '§607.4.1'
  },
  {
    id: 4, label: 'Grab Bars (No Seat)', section: '§607.4.2', color: '#7C3AED', textColor: '#5B21B6',
    x: 330, y: 190,
    plain: 'When no permanent seat is provided (removable seat only): Two grab bars on the back wall — the upper bar at 33–36 inches above the floor, 24 inches long minimum near the head. The lower bar at 8–10 inches above the rim, extending the full length of the tub. One additional bar on the head-end wall at 33–36 inches, full width. This provides maximum support for someone using a removable bath seat.',
    legal: '"Two grab bars on the back wall — upper: 33 to 36 inches above floor, 24 inches minimum starting at head end. Lower: 8 to 10 inches above rim, full length of tub." Head-end wall: "33 to 36 inches above floor, full width of wall."',
    citation: '§607.4.2'
  },
  {
    id: 5, label: 'Controls & Shower', section: '§607.5 / §607.6', color: '#92400E', textColor: '#78350F',
    x: 560, y: 90,
    plain: 'Controls and the shower spray unit must be installed between the bathtub rim and the grab bar, on the end wall opposite the seat (the foot end or open end). This placement keeps controls within reach of someone seated on the tub seat or in a wheelchair alongside the tub. A hand-held shower spray with a hose at least 59 inches long is required. Controls must be operable with one hand — no twisting.',
    legal: '"Controls, faucets, and shower spray units shall be installed on an end wall between the bathtub rim and the grab bar." §607.6 "A shower spray unit with a hose 59 inches long minimum… shall be provided." Operable with one hand per §309.',
    citation: '§607.5, §607.6'
  },
  {
    id: 6, label: 'Enclosures', section: '§607.7', color: '#BE185D', textColor: '#9D174D',
    x: 560, y: 210,
    plain: 'Bathtub enclosures (shower curtains, glass doors) cannot have tracks mounted on the tub rim that would obstruct transfer. A person must be able to slide across the rim from a wheelchair or bath chair without catching on a metal track. Enclosures also must not obstruct access to the controls, faucets, or shower spray. Shower curtains are generally the best solution as they don\'t create physical barriers.',
    legal: '"Enclosures for bathtubs shall not obstruct controls, faucets, and shower spray units or obstruct transfer from wheelchairs onto bathtub seats or into bathtubs. Enclosures on bathtubs shall not have tracks mounted on their rims."',
    citation: '§607.7'
  },
  {
    id: 7, label: 'Surface & Drainage', section: '§607.1', color: '#0E7490', textColor: '#0C4A6E',
    x: 710, y: 150,
    plain: 'The bathtub floor must be slip-resistant to prevent falls. While the Standards don\'t specify a precise coefficient of friction, the surface must meet the general §302 requirement for firm, stable, and slip-resistant finishes. The tub rim height should be approximately 17–19 inches above the floor to facilitate wheelchair transfer — matching standard wheelchair seat height. Drainage must prevent water accumulation on the adjacent floor.',
    legal: '"Bathtubs shall comply with §607." Floor surface per §302: "stable, firm, and slip-resistant." Rim height should permit transfer from wheelchair — typically 17 to 19 inches above the finish floor.',
    citation: '§607.1'
  }
];

function makeLink(text) {
  return (
    <a href={TUB_URL} target="_blank" rel="noopener noreferrer"
      style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}
      aria-label={`${text} on ADA.gov (opens in new tab)`}>
      {text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>↗</span>
    </a>
  );
}

function parseCitations(text) {
  const parts = text.split(/(§\d{3,4}(?:\.\d+)*)/g);
  return parts.map((part, i) => /^§\d{3,4}/.test(part)
    ? <React.Fragment key={i}>{makeLink(part)}</React.Fragment>
    : part
  );
}

export default function BathtubDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);

  const toggle = useCallback((id) => setActive(prev => prev === id ? null : id), []);

  useEffect(() => {
    if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [active]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') setActive(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}"`;
  const activeCallout = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>
          §607 Bathtubs
        </h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => {
            const isA = u === 'Metric' ? metric : !metric;
            return (
              <button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA}
                style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--dark-bg)' : 'white', color: isA ? 'white' : 'var(--body)', cursor: 'pointer', minHeight: '28px' }}>{u}</button>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 900 320" role="img" aria-labelledby="tub-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="tub-title">ADA §607 Bathtubs — Plan View and Side Elevation</title>
          <rect x="0" y="0" width="900" height="320" fill="var(--page-bg-subtle)" />

          {/* ===== LEFT: PLAN VIEW ===== */}
          <text x="210" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">PLAN VIEW</text>

          {/* Bathtub outline — 60" long × ~30" wide at scale */}
          <rect x="60" y="65" width="280" height="100" rx="8" fill="#0EA5E9" opacity="0.04" stroke="#94A3B8" strokeWidth="2" />
          <text x="200" y="120" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#4B5563" fontWeight="600">BATHTUB</text>

          {/* Seat at head end (left side) */}
          <rect x="60" y="65" width="48" height="100" rx="4" fill="#15803D" opacity="0.08" stroke="#15803D" strokeWidth="1.2" />
          <text x="84" y="120" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#14532D" fontWeight="600">SEAT</text>

          {/* Controls at foot end (right side) */}
          <circle cx="330" cy="75" r="4" fill="#B45309" opacity="0.4" stroke="#B45309" strokeWidth="1" />
          <circle cx="320" cy="75" r="3" fill="#B45309" opacity="0.4" />
          <text x="325" y="90" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#78350F" fontWeight="600">CONTROLS</text>

          {/* Grab bar — back wall (long wall, top) */}
          <line x1="62" y1="67" x2="338" y2="67" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
          <text x="200" y="60" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A" fontWeight="600">GRAB BAR (back wall)</text>

          {/* Grab bar — head-end wall */}
          <line x1="62" y1="67" x2="62" y2="163" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" />
          <text x="50" y="120" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6" fontWeight="600" transform="rotate(-90 50 120)">GRAB (head)</text>

          {/* Tub dimensions */}
          {/* Length */}
          <line x1="60" y1="180" x2="340" y2="180" stroke="#94A3B8" strokeWidth="1" />
          <line x1="60" y1="174" x2="60" y2="186" stroke="#94A3B8" strokeWidth="1" />
          <line x1="340" y1="174" x2="340" y2="186" stroke="#94A3B8" strokeWidth="1" />
          <rect x="168" y="183" width="64" height="13" rx="3" fill="#94A3B8" />
          <text x="200" y="192" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('60', '1525')}</text>

          {/* Clear floor space */}
          <rect x="60" y="200" width="280" height="70" rx="2" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1" strokeDasharray="5 3" />
          <text x="200" y="238" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fill="#8B2E08" fontWeight="600">CLEAR FLOOR SPACE</text>
          <text x="200" y="250" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#8B2E08">{d('30', '760')} × {d('60', '1525')}</text>

          {/* Clear floor width dim */}
          <line x1="46" y1="200" x2="46" y2="270" stroke="#C2410C" strokeWidth="1" />
          <line x1="40" y1="200" x2="52" y2="200" stroke="#C2410C" strokeWidth="1" />
          <line x1="40" y1="270" x2="52" y2="270" stroke="#C2410C" strokeWidth="1" />
          <rect x="22" y="227" width="44" height="13" rx="3" fill="#C2410C" />
          <text x="44" y="236" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('30', '760')}</text>

          {/* Wheelchair hint */}
          <text x="200" y="264" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="18" fill="#8B2E08" opacity="0.15">♿</text>

          {/* 12" extension if permanent seat */}
          <line x1="60" y1="288" x2="20" y2="288" stroke="#C2410C" strokeWidth="1" strokeDasharray="3 2" />
          <text x="40" y="298" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#8B2E08">+{d('12', '305')} if perm. seat</text>


          {/* ===== DIVIDER ===== */}
          <line x1="430" y1="20" x2="430" y2="310" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />


          {/* ===== RIGHT: SIDE ELEVATION ===== */}
          <text x="665" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">SIDE ELEVATION</text>

          {/* Floor line */}
          <line x1="460" y1="275" x2="870" y2="275" stroke="#94A3B8" strokeWidth="2" />

          {/* Tub body */}
          <rect x="500" y="185" width="280" height="90" rx="6" fill="#0EA5E9" opacity="0.04" stroke="#94A3B8" strokeWidth="2" />
          <text x="640" y="245" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563" fontWeight="500">BATHTUB</text>

          {/* Tub rim */}
          <line x1="500" y1="185" x2="780" y2="185" stroke="#94A3B8" strokeWidth="2.5" />
          <text x="820" y="188" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#4B5563">RIM</text>

          {/* Back wall */}
          <rect x="494" y="55" width="8" height="220" fill="#94A3B8" rx="1" />
          <text x="498" y="48" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563">WALL</text>

          {/* Seat at head end */}
          <rect x="502" y="180" width="60" height="8" rx="2" fill="#15803D" opacity="0.3" stroke="#15803D" strokeWidth="1" />
          <text x="532" y="176" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#14532D" fontWeight="600">SEAT</text>

          {/* Upper grab bar — 33-36" above floor */}
          <line x1="504" y1="118" x2="640" y2="118" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
          <text x="575" y="112" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A" fontWeight="600">GRAB BAR ({d('33–36', '840–915')} AFF)</text>

          {/* Lower grab bar — 8-10" above rim */}
          <line x1="504" y1="155" x2="640" y2="155" stroke="#7C3AED" strokeWidth="3.5" strokeLinecap="round" />
          <text x="575" y="149" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6" fontWeight="600">LOWER BAR ({d('8–10', '200–255')} above rim)</text>

          {/* Controls on foot-end wall */}
          <circle cx="770" cy="140" r="6" fill="#B45309" opacity="0.3" stroke="#B45309" strokeWidth="1.2" />
          <circle cx="770" cy="160" r="4" fill="#B45309" opacity="0.3" />
          <text x="770" y="130" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#78350F" fontWeight="600">CONTROLS</text>

          {/* Shower spray hose */}
          <path d="M 770 160 Q 800 130 810 170 Q 815 200 790 210" fill="none" stroke="#B45309" strokeWidth="1" strokeDasharray="3 2" opacity="0.5" />
          <text x="810" y="215" fontFamily="Manrope, sans-serif" fontSize="6" fill="#78350F">59" hose</text>

          {/* Height dimensions */}
          {/* Rim height */}
          <line x1="860" y1="185" x2="860" y2="275" stroke="#0891B2" strokeWidth="1" />
          <line x1="854" y1="185" x2="866" y2="185" stroke="#0891B2" strokeWidth="1" />
          <line x1="854" y1="275" x2="866" y2="275" stroke="#0891B2" strokeWidth="1" />
          <rect x="842" y="222" width="36" height="12" rx="3" fill="#0EA5E9" />
          <text x="860" y="231" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" fill="white">~{d('17–19', '430–485')}</text>

          {/* Upper grab bar height */}
          <line x1="456" y1="118" x2="456" y2="275" stroke="#2563EB" strokeWidth="1" />
          <line x1="450" y1="118" x2="462" y2="118" stroke="#2563EB" strokeWidth="1" />
          <line x1="450" y1="275" x2="462" y2="275" stroke="#2563EB" strokeWidth="1" />
          <rect x="434" y="190" width="40" height="12" rx="3" fill="#2563EB" />
          <text x="454" y="199" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" fill="white">{d('33–36', '840–915')}</text>


          {/* ===== CALLOUT DOTS ===== */}
          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button"
              aria-label={`Callout ${c.id}: ${c.label} — ${c.section}. Press Enter for details.`}
              aria-expanded={active === c.id}
              onClick={() => toggle(c.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }}
              style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && (
                <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3">
                  <animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
              <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="tub-focus-ring" />
            </g>
          ))}

          <text x="30" y="310" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">
        {activeCallout ? `Now showing details for callout ${activeCallout.id}: ${activeCallout.label}` : ''}
      </div>

      {activeCallout && (
        <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'tubFade 0.25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: activeCallout.color, color: 'var(--page-bg)', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{activeCallout.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{activeCallout.label}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: activeCallout.color, background: `${activeCallout.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{activeCallout.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">✕</span></button>
          </div>
          <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{activeCallout.plain}</p>
            </div>
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}>
              <div style={{ background: '#FFFBF7', borderLeft: '3px solid #C2410C', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard — {parseCitations(activeCallout.citation)}</p>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCitations(activeCallout.legal)}</p>
              </div>
            </aside>
          </div>
        </div>
      )}

      <style>{`
        @keyframes tubFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .tub-focus-ring { stroke: #C2410C; stroke-width: 2.5; }
              @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}