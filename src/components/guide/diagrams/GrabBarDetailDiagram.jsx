import React, { useState, useRef, useEffect, useCallback } from 'react';

const GRAB_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#609-grab-bars';

const CALLOUTS = [
  {
    id: 1, label: 'Circular Profile', section: '§609.2.1', color: '#C2410C', textColor: '#8B2E08',
    x: 120, y: 42,
    plain: 'A circular grab bar must have an outside diameter of 1.25 inches minimum to 2 inches maximum. This size range allows most people — including those with limited grip strength or arthritis — to wrap their fingers securely around the bar. The gripping surface must be smooth, continuous, and free of any sharp or abrasive elements. Edges must be rounded.',
    legal: '"Circular cross sections shall have an outside diameter of 1 1/4 inches (32 mm) minimum and 2 inches (51 mm) maximum."',
    citation: '§609.2.1'
  },
  {
    id: 2, label: 'Non-Circular Profile', section: '§609.2.2', color: '#15803D', textColor: '#14532D',
    x: 310, y: 42,
    plain: 'Non-circular grab bars (oval, D-shaped, or rectangular with rounded corners) must have a maximum cross-section dimension of 2 inches, and a perimeter between 4 and 6.25 inches. The perimeter measurement ensures the bar is graspable. All edges must have a minimum radius of 0.01 inches (essentially rounded, not sharp). The surface must be smooth and non-abrasive.',
    legal: '"Non-circular cross sections shall have a cross-section dimension of 2 inches (51 mm) maximum. Non-circular cross sections shall have a perimeter dimension of 4 inches (100 mm) minimum and 6 1/4 inches (160 mm) maximum."',
    citation: '§609.2.2'
  },
  {
    id: 3, label: 'Wall Clearance', section: '§609.3', color: '#2563EB', textColor: '#1E3A8A',
    x: 120, y: 260,
    plain: 'The space between the grab bar gripping surface and the adjacent wall must be 1.5 inches minimum. This ensures fingers are not pinched or scraped when gripping the bar. The space between the grab bar and any projecting object below must be at least 1.5 inches. No sharp or abrasive elements are permitted within this clearance zone — no exposed bolt heads, rough concrete, or protruding bracket hardware.',
    legal: '"The clearance between the grab bar gripping surface and adjacent surfaces shall be 1 1/2 inches (38 mm) minimum."',
    citation: '§609.3'
  },
  {
    id: 4, label: 'Mounting Height', section: '§609.4', color: '#7C3AED', textColor: '#5B21B6',
    x: 620, y: 42,
    plain: 'Grab bars must be mounted with the top of the gripping surface between 33 and 36 inches above the finish floor. They are installed horizontally unless otherwise specified (some shower configurations require vertical bars). This height range puts the bar at a comfortable reach for someone seated on a toilet (17–19 inches high) or transferring from a wheelchair.',
    legal: '"Grab bars and any wall or other surfaces adjacent to grab bars shall be free of sharp or abrasive elements and shall have rounded edges." Top of gripping surfaces: "33 inches minimum and 36 inches maximum above the finish floor."',
    citation: '§609.4'
  },
  {
    id: 5, label: 'Structural Strength', section: '§609.8', color: '#92400E', textColor: '#78350F',
    x: 810, y: 42,
    plain: 'Grab bars must withstand 250 pounds of force applied vertically or horizontally at any point on the bar without permanent deformation. The wall behind must have structural reinforcement — typically wood blocking or metal plates between studs — to support the mounting hardware. The bending stress in the bar itself must not exceed the allowable stress for the material. This strength is critical because people rely on these bars to prevent falls.',
    legal: '"Grab bars, grab bar fittings, and any wall or other surfaces adjacent to grab bars shall be designed to resist a force of 250 pounds (1112 N) applied at any point on the grab bar." Bending stress shall not exceed allowable stress for material.',
    citation: '§609.8'
  },
  {
    id: 6, label: 'Hazards', section: '§609.5', color: '#BE185D', textColor: '#9D174D',
    x: 620, y: 190,
    plain: 'The gripping surface must be free of sharp or abrasive elements. This includes the bar itself, any adjacent wall surfaces within 1.5 inches, and the mounting hardware. Edges where the bar meets the wall (at returns and fittings) must be rounded. No exposed screws, bolt heads, or rough welds are permitted on or near the gripping surface. The bar must provide a secure, comfortable grip without risk of skin injury.',
    legal: '"Grab bars and any wall or other surfaces adjacent to grab bars shall be free of sharp or abrasive elements and shall have rounded edges."',
    citation: '§609.5'
  },
  {
    id: 7, label: 'Fittings', section: '§609.6 / §609.7', color: '#0E7490', textColor: '#0C4A6E',
    x: 810, y: 190,
    plain: 'Grab bars must not rotate within their fittings — any rotation could cause a sudden loss of grip and a fall. The space adjacent to the grab bar must be free of obstructions for 1.5 inches above the bar (so hands can wrap over the top) and 12 inches below (so no objects catch on arms or clothing during a transfer). Fittings must be smooth and securely anchored to structural reinforcement.',
    legal: '"Grab bars shall not rotate within their fittings." §609.3 "Space between the wall and the grab bar shall be 1 1/2 inches." Adjacent space: "free of sharp or abrasive elements." 1.5 inches above, 12 inches below must be unobstructed.',
    citation: '§609.6, §609.7'
  }
];

function makeLink(text) {
  return (<a href={GRAB_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }} aria-label={`${text} on ADA.gov`}>{text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>↗</span></a>);
}
function parseCitations(text) {
  return text.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p);
}

export default function GrabBarDetailDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§609 Grab Bars — Installation Detail</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: '28px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 900 320" role="img" aria-labelledby="grab-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="grab-title">ADA §609 Grab Bar Cross-Sections and Wall Mounting Detail</title>
          <rect x="0" y="0" width="900" height="320" fill="#FAFAF9" />

          {/* ===== LEFT: CROSS SECTIONS ===== */}
          <text x="215" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">CROSS-SECTION PROFILES</text>

          {/* (A) Circular */}
          <text x="120" y="68" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#8B2E08">(A) CIRCULAR</text>
          {/* Wall segment */}
          <rect x="30" y="80" width="10" height="120" fill="#94A3B8" rx="1" />
          {/* Clearance gap */}
          <line x1="40" y1="140" x2="80" y2="140" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 2" />
          <rect x="42" y="126" width="36" height="12" rx="3" fill="#2563EB" opacity="0.85" />
          <text x="60" y="135" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" fill="white">{d('1.5', '38')}</text>
          {/* Bar circle */}
          <circle cx="120" cy="140" r="38" fill="#FEF2F2" stroke="#C2410C" strokeWidth="2.5" />
          <circle cx="120" cy="140" r="2" fill="#C2410C" />
          {/* Diameter dim */}
          <line x1="82" y1="140" x2="158" y2="140" stroke="#C2410C" strokeWidth="1" />
          <rect x="86" y="148" width="68" height="12" rx="3" fill="#C2410C" />
          <text x="120" y="157" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('1.25–2', '32–51')} O.D.</text>

          {/* (B) Non-Circular */}
          <text x="310" y="68" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#14532D">(B) NON-CIRCULAR</text>
          {/* Wall */}
          <rect x="220" y="80" width="10" height="120" fill="#94A3B8" rx="1" />
          {/* Clearance */}
          <line x1="230" y1="140" x2="265" y2="140" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 2" />
          <rect x="232" y="126" width="36" height="12" rx="3" fill="#2563EB" opacity="0.85" />
          <text x="250" y="135" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" fill="white">{d('1.5', '38')}</text>
          {/* Bar oval */}
          <rect x="270" y="110" width="80" height="60" rx="18" fill="#F0FDF4" stroke="#16A34A" strokeWidth="2.5" />
          {/* Cross-section dim */}
          <line x1="310" y1="110" x2="310" y2="170" stroke="#16A34A" strokeWidth="1" />
          <rect x="352" y="126" width="56" height="12" rx="3" fill="#16A34A" />
          <text x="380" y="135" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" fill="white">{d('2', '51')} max</text>
          {/* Perimeter */}
          <rect x="262" y="174" width="96" height="12" rx="3" fill="#16A34A" opacity="0.85" />
          <text x="310" y="183" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" fill="white">Perimeter: {d('4–6.25', '100–160')}</text>

          {/* (C) Clearance detail */}
          <text x="215" y="218" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#1E3A8A">(C) WALL CLEARANCE DETAIL</text>
          <rect x="100" y="230" width="8" height="60" fill="#94A3B8" rx="1" />
          <circle cx="155" cy="260" r="20" fill="none" stroke="#64748B" strokeWidth="2" />
          {/* 1.5" gap */}
          <line x1="108" y1="260" x2="135" y2="260" stroke="#2563EB" strokeWidth="1.5" />
          <line x1="108" y1="252" x2="108" y2="268" stroke="#2563EB" strokeWidth="1" />
          <line x1="135" y1="252" x2="135" y2="268" stroke="#2563EB" strokeWidth="1" />
          <rect x="110" y="244" width="22" height="10" rx="2" fill="#2563EB" />
          <text x="121" y="252" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5.5" fontWeight="700" fill="white">{d('1.5', '38')}</text>
          <text x="260" y="255" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A">No sharp/abrasive</text>
          <text x="260" y="268" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A">elements in gap</text>


          {/* ===== DIVIDER ===== */}
          <line x1="440" y1="20" x2="440" y2="310" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />


          {/* ===== RIGHT: WALL MOUNTING ELEVATION ===== */}
          <text x="670" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">WALL MOUNTING ELEVATION</text>

          {/* Wall */}
          <rect x="470" y="40" width="380" height="12" fill="#94A3B8" rx="1" />
          <text x="660" y="36" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563">WALL SURFACE</text>

          {/* Structural reinforcement (behind wall, shown dashed) */}
          <rect x="560" y="46" width="200" height="20" rx="2" fill="#D97706" opacity="0.06" stroke="#D97706" strokeWidth="1" strokeDasharray="4 3" />
          <text x="660" y="60" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#78350F" fontWeight="600">BLOCKING / REINFORCEMENT</text>

          {/* Grab bar (horizontal, front view) */}
          <rect x="530" y="148" width="260" height="12" rx="6" fill="#7C3AED" opacity="0.15" stroke="#7C3AED" strokeWidth="2" />
          <text x="660" y="144" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#5B21B6" fontWeight="700">GRAB BAR</text>

          {/* Mounting brackets */}
          <rect x="560" y="52" width="8" height="100" rx="1" fill="#94A3B8" opacity="0.4" />
          <rect x="750" y="52" width="8" height="100" rx="1" fill="#94A3B8" opacity="0.4" />

          {/* Floor */}
          <line x1="460" y1="280" x2="860" y2="280" stroke="#94A3B8" strokeWidth="2" />

          {/* Height dimension: 33-36" from floor */}
          <line x1="480" y1="154" x2="480" y2="280" stroke="#7C3AED" strokeWidth="1" />
          <line x1="472" y1="154" x2="488" y2="154" stroke="#7C3AED" strokeWidth="1" />
          <line x1="472" y1="280" x2="488" y2="280" stroke="#7C3AED" strokeWidth="1" />
          <rect x="458" y="210" width="40" height="13" rx="3" fill="#7C3AED" />
          <text x="478" y="219" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('33–36', '840–915')}</text>

          {/* 250 lb force arrows */}
          <line x1="660" y1="162" x2="660" y2="200" stroke="#D97706" strokeWidth="1.5" markerEnd="url(#forceArrow)" />
          <line x1="660" y1="154" x2="700" y2="154" stroke="#D97706" strokeWidth="1.5" markerEnd="url(#forceArrow)" />
          <rect x="664" y="196" width="60" height="12" rx="3" fill="#D97706" />
          <text x="694" y="205" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" fill="white">250 lbs force</text>

          <defs>
            <marker id="forceArrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#D97706" />
            </marker>
          </defs>

          {/* 1.5" clearance above bar */}
          <rect x="530" y="113" width="260" height="33" rx="2" fill="#DB2777" opacity="0.03" stroke="#DB2777" strokeWidth="0.8" strokeDasharray="3 2" />
          <text x="830" y="133" fontFamily="Manrope, sans-serif" fontSize="6" fill="#9D174D" fontWeight="500">{d('1.5', '38')}↑</text>

          {/* 12" clearance below bar */}
          <rect x="530" y="162" width="260" height="60" rx="2" fill="#0EA5E9" opacity="0.03" stroke="#0891B2" strokeWidth="0.8" strokeDasharray="3 2" />
          <text x="830" y="196" fontFamily="Manrope, sans-serif" fontSize="6" fill="#0C4A6E" fontWeight="500">{d('12', '305')}↓</text>

          <text x="660" y="236" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#0C4A6E">Clear zone: {d('1.5', '38')} above, {d('12', '305')} below</text>


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
        <div ref={panelRef} style={{ marginTop: '12px', background: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden', animation: 'grabFade 0.25s ease-out' }}>
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
      <style>{`@keyframes grabFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}