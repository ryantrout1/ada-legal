import React, { useState, useRef, useEffect, useCallback } from 'react';

const RAIL_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#505-handrails';

const CALLOUTS = [
  {
    id: 5, label: 'Circular Profile', section: '§505.7.1', color: '#C2410C', textColor: '#8B2E08',
    x: 175, y: 48,
    plain: 'A circular handrail must have an outside diameter of 1.25 inches minimum to 2 inches maximum. This range ensures most people — including those with limited grip strength — can wrap their fingers comfortably around the rail. The surface must be smooth and free of sharp or abrasive elements. Edges must be rounded. The rail must be continuous along its full length, except where interrupted by a newel post at a stair turn.',
    legal: '"Circular cross sections shall have an outside diameter of 1 1/4 inches (32 mm) minimum and 2 inches (51 mm) maximum." Per §505.6: "Handrail gripping surfaces shall be continuous along their full length and shall not be obstructed along their tops or sides."',
    citation: '§505.7.1, §505.6'
  },
  {
    id: 6, label: 'Non-Circular Profile', section: '§505.7.2', color: '#15803D', textColor: '#14532D',
    x: 580, y: 48,
    plain: 'Non-circular handrails (oval, rectangular with rounded corners, etc.) must have a cross-section dimension of 2.25 inches maximum, and a perimeter between 4 and 6.25 inches. The perimeter measurement ensures the rail is graspable — large flat rails that cannot be wrapped by a hand do not comply. All edges must be rounded, and the surface smooth. This profile is increasingly popular in modern architecture.',
    legal: '"Non-circular cross sections shall have a cross-section dimension of 2 1/4 inches (57 mm) maximum." "Non-circular cross sections shall have a perimeter dimension of 4 inches (100 mm) minimum and 6 1/4 inches (160 mm) maximum."',
    citation: '§505.7.2'
  },
  {
    id: 7, label: 'Wall Clearance', section: '§505.5', color: '#2563EB', textColor: '#1E3A8A',
    x: 380, y: 265,
    plain: 'There must be at least 1.5 inches of clear space between the handrail and the wall (or any adjacent surface). This gap ensures fingers are not pinched or scraped when gripping the rail. The space between the rail and wall must also be free of sharp or abrasive elements — no exposed bolt heads, rough concrete, or protruding brackets within the clearance zone.',
    legal: '"The clearance between handrail gripping surfaces and adjacent surfaces shall be 1 1/2 inches (38 mm) minimum."',
    citation: '§505.5'
  }
];

function makeLink(text) {
  return (
    <a href={RAIL_URL} target="_blank" rel="noopener noreferrer"
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

export default function HandrailDiagram() {
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

  const imp = (inches, mm) => metric ? `${mm} mm` : `${inches}"`;
  const activeCallout = CALLOUTS.find(c => c.id === active);

  // Layout: two cross-sections side by side
  const CY = 170; // vertical center of cross-sections
  const WALL_X_L = 90;  // left wall x
  const WALL_X_R = 490; // right wall x

  return (
    <div className="ada-diagram-wrap" style={{ margin: '48px 0 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>
          §505 Handrails — Cross-Section Detail
        </h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => {
            const isA = u === 'Metric' ? metric : !metric;
            return (
              <button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA}
                style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>
            );
          })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 900 320" role="img" aria-labelledby="rail-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="rail-title">ADA §505 Handrail Cross-Section — Circular and Non-Circular Profiles</title>
          <rect x="0" y="0" width="900" height="320" fill="var(--page-bg-subtle)" />

          {/* ===== LEFT: CIRCULAR ===== */}
          <text x="220" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">CIRCULAR CROSS-SECTION</text>

          {/* Wall */}
          <rect x={WALL_X_L} y="80" width="10" height="180" fill="#94A3B8" rx="1" />
          <text x={WALL_X_L + 5} y="75" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">WALL</text>

          {/* Handrail circle — radius ~40px (maps to ~1.5" dia visually) */}
          <circle cx="220" cy={CY} r="40" fill="#FEF2F2" stroke="#C2410C" strokeWidth="2.5" />
          <circle cx="220" cy={CY} r="2" fill="#C2410C" />

          {/* Diameter dimension across circle */}
          <line x1="180" y1={CY} x2="260" y2={CY} stroke="#C2410C" strokeWidth="1" />
          <line x1="180" y1={CY - 8} x2="180" y2={CY + 8} stroke="#C2410C" strokeWidth="1" />
          <line x1="260" y1={CY - 8} x2="260" y2={CY + 8} stroke="#C2410C" strokeWidth="1" />
          <rect x="188" y={CY + 12} width="64" height="14" rx="3" fill="#C2410C" />
          <text x="220" y={CY + 22} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">{imp('1.25–2', '32–51')}</text>

          {/* Wall clearance (1.5") */}
          <line x1={WALL_X_L + 10} y1={CY} x2="180" y2={CY} stroke="#2563EB" strokeWidth="1.2" />
          <line x1={WALL_X_L + 10} y1={CY - 8} x2={WALL_X_L + 10} y2={CY + 8} stroke="#2563EB" strokeWidth="1.2" />
          <line x1="180" y1={CY - 8} x2="180" y2={CY + 8} stroke="#2563EB" strokeWidth="1.2" />
          <rect x={WALL_X_L + 18} y={CY - 22} width="62" height="14" rx="3" fill="#2563EB" />
          <text x={WALL_X_L + 49} y={CY - 12} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">{imp('1.5', '38')} min</text>

          {/* Hand silhouette hint */}
          <path d="M 200 128 Q 190 140 190 155 Q 190 180 200 195 Q 210 205 225 205 Q 245 205 250 195 Q 258 180 255 155 Q 252 140 240 130"
            fill="none" stroke="#C2410C" strokeWidth="1" opacity="0.15" strokeDasharray="3 2" />


          {/* ===== DIVIDER ===== */}
          <line x1="400" y1="20" x2="400" y2="310" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />


          {/* ===== RIGHT: NON-CIRCULAR ===== */}
          <text x="640" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">NON-CIRCULAR CROSS-SECTION</text>

          {/* Wall */}
          <rect x={WALL_X_R} y="80" width="10" height="180" fill="#94A3B8" rx="1" />
          <text x={WALL_X_R + 5} y="75" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">WALL</text>

          {/* Handrail — rounded rectangle (oval-ish) */}
          <rect x="588" y={CY - 30} width="80" height="60" rx="18" fill="#F0FDF4" stroke="#15803D" strokeWidth="2.5" />
          <circle cx="628" cy={CY} r="2" fill="#15803D" />

          {/* Cross-section dimension (2.25" max height) */}
          <line x1="628" y1={CY - 30} x2="628" y2={CY + 30} stroke="#15803D" strokeWidth="1" />
          <line x1="620" y1={CY - 30} x2="636" y2={CY - 30} stroke="#15803D" strokeWidth="1" />
          <line x1="620" y1={CY + 30} x2="636" y2={CY + 30} stroke="#15803D" strokeWidth="1" />
          <rect x="636" y={CY - 8} width="68" height="14" rx="3" fill="#15803D" />
          <text x="670" y={CY + 3} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{imp('2.25', '57')} max</text>

          {/* Perimeter annotation */}
          <path d={`M 588 ${CY - 10} Q 580 ${CY - 35} 610 ${CY - 35} L 646 ${CY - 35} Q 672 ${CY - 35} 672 ${CY - 10} L 672 ${CY + 10} Q 672 ${CY + 35} 646 ${CY + 35} L 610 ${CY + 35} Q 584 ${CY + 35} 584 ${CY + 10} Z`}
            fill="none" stroke="#15803D" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
          <rect x="680" y={CY + 18} width="90" height="14" rx="3" fill="#15803D" opacity="0.85" />
          <text x="725" y={CY + 28} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">Perim. {imp('4–6.25', '100–160')}</text>

          {/* Wall clearance (1.5") */}
          <line x1={WALL_X_R + 10} y1={CY} x2="588" y2={CY} stroke="#2563EB" strokeWidth="1.2" />
          <line x1={WALL_X_R + 10} y1={CY - 8} x2={WALL_X_R + 10} y2={CY + 8} stroke="#2563EB" strokeWidth="1.2" />
          <line x1="588" y1={CY - 8} x2="588" y2={CY + 8} stroke="#2563EB" strokeWidth="1.2" />
          <rect x={WALL_X_R + 18} y={CY - 22} width="62" height="14" rx="3" fill="#2563EB" />
          <text x={WALL_X_R + 49} y={CY - 12} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">{imp('1.5', '38')} min</text>


          {/* CALLOUT DOTS */}
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
              <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="rail-focus-ring" />
            </g>
          ))}

          <text x="30" y="310" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">
        {activeCallout ? `Now showing details for callout ${activeCallout.id}: ${activeCallout.label}` : ''}
      </div>

      {activeCallout && (
        <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'railFade 0.25s ease-out' }}>
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
              <div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard — {parseCitations(activeCallout.citation)}</p>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCitations(activeCallout.legal)}</p>
              </div>
            </aside>
          </div>
        </div>
      )}

      <style>{`
        @keyframes railFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .rail-focus-ring { stroke: #C2410C; stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
              @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}