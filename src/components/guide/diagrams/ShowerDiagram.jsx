import React, { useState, useRef, useEffect, useCallback } from 'react';

const SHOWER_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#608-shower-compartments';

const CALLOUTS = [
  {
    id: 1, label: 'Transfer Shower Size', section: '§608.2.1', color: '#C2410C', textColor: '#8B2E08',
    x: 135, y: 42,
    plain: 'A transfer-type shower compartment must be exactly 36 × 36 inches (inside dimensions). The person transfers from a wheelchair onto the built-in seat, so a clear floor space of 36 × 48 inches must be provided adjacent to the open side. The entry must be at least 36 inches wide with no curb or threshold (maximum ½ inch if beveled). This compact design is ideal for smaller restrooms.',
    legal: '"Transfer type shower compartments shall be 36 inches by 36 inches inside finished dimensions measured at the center points of opposing sides." Clear floor space: 36 inches wide minimum by 48 inches long minimum positioned adjacent to the open face of the compartment.',
    citation: '§608.2.1'
  },
  {
    id: 2, label: 'Roll-In Shower Size', section: '§608.3.1', color: '#15803D', textColor: '#14532D',
    x: 560, y: 42,
    plain: 'A standard roll-in shower is 60 × 30 inches (inside dimensions), open on the long 60-inch side so a wheelchair can roll directly in. There is no curb or threshold. This design requires more floor space than a transfer shower but allows the user to remain in their wheelchair (or a shower wheelchair). An alternate roll-in shower (§608.3.2) is 36 × 60 inches with a 36-inch entry on the long side.',
    legal: '"Standard roll-in type shower compartments shall be 30 inches minimum by 60 inches minimum clear inside dimension measured at center points of opposing sides." Threshold: level with floor, ½ inch max if beveled.',
    citation: '§608.3.1'
  },
  {
    id: 3, label: 'Shower Seat', section: '§608.4 / §610', color: '#2563EB', textColor: '#1E3A8A',
    x: 80, y: 190,
    plain: 'A folding or non-folding seat is required in transfer-type showers. The seat must be 15 to 16 inches deep and extend the full width of the compartment (wall to wall). It must support at least 250 pounds of force. The top of the seat surface must be 17 to 19 inches above the shower floor — matching standard wheelchair seat height to facilitate a smooth lateral transfer.',
    legal: '"In transfer type and certain alternate roll-in type shower compartments, a folding or non-folding seat shall be provided." §610.2 Rectangular seats: "15 inches deep minimum and 16 inches deep maximum." §610.3 "Seats shall support a vertical or horizontal force of 250 pounds."',
    citation: '§608.4, §610'
  },
  {
    id: 4, label: 'Grab Bars (Transfer)', section: '§608.2.1.1', color: '#7C3AED', textColor: '#5B21B6',
    x: 270, y: 100,
    plain: 'In a transfer shower, grab bars are installed on two walls: (1) across from the seat — extending the full length of the wall, and (2) on the side wall (control wall) — extending from the front edge of the seat to the shower entry. Both are mounted 33 to 36 inches above the shower floor. The bars let the user support themselves while transferring from wheelchair to seat and while showering.',
    legal: '"Grab bars shall be provided across the control wall and on the back wall to a point 18 inches from the control wall." Mounted 33 to 36 inches above the shower floor per §609.4.',
    citation: '§608.2.1.1'
  },
  {
    id: 5, label: 'Grab Bars (Roll-In)', section: '§608.3.1.1', color: '#92400E', textColor: '#78350F',
    x: 560, y: 240,
    plain: 'In a standard roll-in shower, grab bars are installed on three walls: the full length of the back wall and on both side walls extending from the entry to the back wall grab bar. Bars are mounted 33 to 36 inches above the shower floor. The maximum gap between a grab bar end and an adjacent wall is 6 inches. This three-wall configuration provides continuous support as the user moves within the shower.',
    legal: '"Grab bars shall be provided on the back wall and on the side walls. Grab bars on the back wall shall extend the length of the wall. Grab bars on the side walls shall extend from the edge of the shower to the grab bar on the back wall." 6 inches max from adjacent walls.',
    citation: '§608.3.1.1'
  },
  {
    id: 6, label: 'Controls & Spray', section: '§608.5 / §608.6', color: '#BE185D', textColor: '#9D174D',
    x: 270, y: 260,
    plain: 'Shower controls must be installed above the grab bar, between 38 and 48 inches above the shower floor. They must be operable with one hand and must not require tight grasping, pinching, or twisting. In transfer-type showers, a hand-held shower spray unit with a hose at least 59 inches long is required. In roll-in showers, a hand shower is also required. The spray unit must have an on/off control with a non-positive shut-off.',
    legal: '"Controls, faucets, and shower spray units shall be installed on the side wall opposite the seat 38 inches minimum and 48 inches maximum above the shower floor." §608.6 "A shower spray unit with a hose 59 inches long minimum… shall be provided."',
    citation: '§608.5, §608.6'
  },
  {
    id: 7, label: 'Alternate Roll-In', section: '§608.3.2', color: '#0E7490', textColor: '#0C4A6E',
    x: 720, y: 160,
    plain: 'The alternate roll-in shower is 36 × 60 inches with the entry (36 inches minimum) on the long side. A folding seat is provided on one end wall. Grab bars are installed on each side of the seat (both side walls) and on the back wall opposite the seat. This design accommodates both wheelchair roll-in use and seated bathing, combining the benefits of both shower types.',
    legal: '"Alternate roll-in type shower compartments shall be 36 inches wide and 60 inches deep minimum." Entry: 36 inches minimum on the long side. "A folding seat complying with §610 shall be provided on an end wall."',
    citation: '§608.3.2'
  }
];

function makeLink(text) {
  return (
    <a href={SHOWER_URL} target="_blank" rel="noopener noreferrer"
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

export default function ShowerDiagram() {
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
          §608 Shower Compartments
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
        <svg viewBox="0 0 900 320" role="img" aria-labelledby="shower-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="shower-title">ADA §608 Shower Compartments — Transfer and Roll-In Types</title>
          <rect x="0" y="0" width="900" height="320" fill="var(--page-bg-subtle)" />

          {/* ===== LEFT: TRANSFER SHOWER 36x36 ===== */}
          <text x="170" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">TRANSFER SHOWER (36×36)</text>

          {/* Compartment walls — 3 sides, open on bottom */}
          <rect x="40" y="60" width="160" height="160" fill="#C2410C" opacity="0.03" stroke="#94A3B8" strokeWidth="2" />
          {/* Open side (entry) — dashed */}
          <line x1="40" y1="220" x2="200" y2="220" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6 4" />
          <text x="120" y="234" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563" fontWeight="600">ENTRY ({d('36', '915')} min)</text>

          {/* Seat — on left wall */}
          <rect x="40" y="60" width="36" height="160" rx="2" fill="#2563EB" opacity="0.08" stroke="#2563EB" strokeWidth="1.2" />
          <text x="58" y="145" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A" fontWeight="600" transform="rotate(-90 58 145)">SEAT</text>

          {/* Seat depth dimension */}
          <line x1="40" y1="248" x2="76" y2="248" stroke="#2563EB" strokeWidth="0.8" />
          <line x1="40" y1="244" x2="40" y2="252" stroke="#2563EB" strokeWidth="0.8" />
          <line x1="76" y1="244" x2="76" y2="252" stroke="#2563EB" strokeWidth="0.8" />
          <text x="58" y="260" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#1E3A8A" fontWeight="600">{d('15–16', '380–405')}</text>

          {/* Grab bar — back wall (top, across from seat) */}
          <line x1="198" y1="62" x2="198" y2="218" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" />
          <text x="210" y="140" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6" fontWeight="600" transform="rotate(90 210 140)">GRAB BAR</text>

          {/* Grab bar — control wall (top wall, from seat edge to entry) */}
          <line x1="76" y1="62" x2="198" y2="62" stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" />

          {/* Controls on top wall */}
          <circle cx="150" cy="68" r="5" fill="#DB2777" opacity="0.3" stroke="#DB2777" strokeWidth="1" />
          <text x="150" y="82" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#9D174D" fontWeight="600">CONTROLS</text>

          {/* Shower spray */}
          <circle cx="170" cy="68" r="3" fill="#DB2777" opacity="0.5" />

          {/* Compartment dimensions */}
          {/* Width (horizontal) */}
          <line x1="40" y1="50" x2="200" y2="50" stroke="#C2410C" strokeWidth="1" />
          <line x1="40" y1="44" x2="40" y2="56" stroke="#C2410C" strokeWidth="1" />
          <line x1="200" y1="44" x2="200" y2="56" stroke="#C2410C" strokeWidth="1" />
          <rect x="88" y="42" width="64" height="13" rx="3" fill="#C2410C" />
          <text x="120" y="51" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('36', '915')}</text>

          {/* Depth (vertical) */}
          <line x1="28" y1="60" x2="28" y2="220" stroke="#C2410C" strokeWidth="1" />
          <line x1="22" y1="60" x2="34" y2="60" stroke="#C2410C" strokeWidth="1" />
          <line x1="22" y1="220" x2="34" y2="220" stroke="#C2410C" strokeWidth="1" />
          <rect x="6" y="132" width="40" height="13" rx="3" fill="#C2410C" />
          <text x="26" y="141" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('36', '915')}</text>

          {/* Clear floor space — adjacent */}
          <rect x="40" y="222" width="160" height="72" rx="2" fill="#B45309" opacity="0.04" stroke="#B45309" strokeWidth="1" strokeDasharray="5 3" />
          <text x="120" y="262" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" fontWeight="600">CLEAR FLOOR SPACE</text>
          <text x="120" y="274" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#78350F">{d('36', '915')} × {d('48', '1220')}</text>

          {/* Wheelchair hint */}
          <text x="120" y="286" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="18" fill="#78350F" opacity="0.2">♿</text>


          {/* ===== DIVIDER ===== */}
          <line x1="370" y1="20" x2="370" y2="310" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />


          {/* ===== RIGHT: ROLL-IN SHOWER 60x30 ===== */}
          <text x="580" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">STANDARD ROLL-IN SHOWER (60×30)</text>

          {/* Compartment — 3 walls, open on bottom (long side) */}
          <rect x="410" y="70" width="280" height="120" fill="#15803D" opacity="0.03" stroke="#94A3B8" strokeWidth="2" />
          {/* Open side (entry) — dashed on long side */}
          <line x1="410" y1="190" x2="690" y2="190" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6 4" />
          <text x="550" y="204" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563" fontWeight="600">ENTRY ({d('60', '1525')} full width)</text>

          {/* Grab bars — back wall */}
          <line x1="412" y1="72" x2="688" y2="72" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />
          {/* Grab bars — left side wall */}
          <line x1="412" y1="72" x2="412" y2="188" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />
          {/* Grab bars — right side wall */}
          <line x1="688" y1="72" x2="688" y2="188" stroke="#B45309" strokeWidth="4" strokeLinecap="round" />

          {/* Controls on back wall */}
          <circle cx="550" cy="78" r="5" fill="#DB2777" opacity="0.3" stroke="#DB2777" strokeWidth="1" />
          <text x="550" y="92" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#9D174D" fontWeight="600">CONTROLS</text>

          {/* Optional seat (dashed, on back wall) */}
          <rect x="640" y="72" width="48" height="30" rx="2" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" />
          <text x="664" y="91" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A" fontWeight="500">SEAT (opt.)</text>

          {/* Width dimension */}
          <line x1="410" y1="58" x2="690" y2="58" stroke="#15803D" strokeWidth="1" />
          <line x1="410" y1="52" x2="410" y2="64" stroke="#15803D" strokeWidth="1" />
          <line x1="690" y1="52" x2="690" y2="64" stroke="#15803D" strokeWidth="1" />
          <rect x="518" y="49" width="64" height="13" rx="3" fill="#15803D" />
          <text x="550" y="58" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('60', '1525')}</text>

          {/* Depth dimension */}
          <line x1="700" y1="70" x2="700" y2="190" stroke="#15803D" strokeWidth="1" />
          <line x1="694" y1="70" x2="706" y2="70" stroke="#15803D" strokeWidth="1" />
          <line x1="694" y1="190" x2="706" y2="190" stroke="#15803D" strokeWidth="1" />
          <rect x="708" y="122" width="40" height="13" rx="3" fill="#15803D" />
          <text x="728" y="131" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('30', '760')}</text>

          {/* Wheelchair in roll-in */}
          <text x="500" y="155" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="24" fill="#14532D" opacity="0.15">♿</text>


          {/* ===== ALTERNATE ROLL-IN sketch (small, bottom right) ===== */}
          <rect x="760" y="80" width="120" height="70" rx="2" fill="#0EA5E9" opacity="0.04" stroke="#0891B2" strokeWidth="1.2" />
          <line x1="760" y1="150" x2="880" y2="150" stroke="#0891B2" strokeWidth="1.2" strokeDasharray="4 3" />
          <text x="820" y="96" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#0C4A6E" fontWeight="600">ALTERNATE</text>
          <text x="820" y="107" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#0C4A6E">{d('36', '915')} × {d('60', '1525')}</text>
          {/* Seat at end */}
          <rect x="856" y="82" width="22" height="66" rx="1" fill="#0EA5E9" opacity="0.08" stroke="#0891B2" strokeWidth="0.8" />
          <text x="867" y="120" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5" fill="#0C4A6E">SEAT</text>


          {/* Grab bar height note */}
          <rect x="410" y="215" width="140" height="28" rx="4" fill="#B45309" opacity="0.06" stroke="#B45309" strokeWidth="1" strokeDasharray="4 3" />
          <text x="480" y="228" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" fontWeight="600">Grab bars: {d('33–36', '840–915')} AFF</text>
          <text x="480" y="239" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#78350F">Controls: {d('38–48', '965–1220')} AFF</text>


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
              <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="shower-focus-ring" />
            </g>
          ))}

          <text x="30" y="310" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">
        {activeCallout ? `Now showing details for callout ${activeCallout.id}: ${activeCallout.label}` : ''}
      </div>

      {activeCallout && (
        <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'showerFade 0.25s ease-out' }}>
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
        @keyframes showerFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .shower-focus-ring { stroke: #C2410C; stroke-width: 2.5; }
              @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}