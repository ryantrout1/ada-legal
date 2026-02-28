import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#502-parking-spaces';
const SCOPING_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#208-parking-spaces';

const SCOPING_TABLE = [
  ['1–25', '1'], ['26–50', '2'], ['51–75', '3'], ['76–100', '4'],
  ['101–150', '5'], ['151–200', '6'], ['201–300', '7'], ['301–400', '8'],
  ['401–500', '9'], ['501–1,000', '2% of total'], ['1,001+', '20 + 1 per 100 over 1,000']
];

const CALLOUTS = [
  {
    id: 1, label: 'Van-Accessible Space', section: '§502.2', color: '#C2410C', textColor: '#8B2E08',
    x: 115, y: 190,
    plain: 'A van-accessible parking space must be at least 132 inches (11 feet) wide to allow room for a wheelchair ramp or lift to deploy from the side of a van. An alternative layout is allowed: a standard 96-inch (8-foot) space paired with an extra-wide 96-inch access aisle. For every 6 accessible spaces (or fraction of 6), at least 1 must be van-accessible.',
    legal: '"Car parking spaces shall be 96 inches (2440 mm) wide minimum. Van parking spaces shall be 132 inches (3350 mm) wide minimum." Alternative: van space of 96 inches with 96-inch access aisle. Per §208.2.4: "For every six or fraction of six accessible parking spaces, at least one shall be a van parking space."',
    citation: '§502.2, §208.2.4',
    linkOverride: null
  },
  {
    id: 2, label: 'Standard Accessible Space', section: '§502.2', color: '#15803D', textColor: '#14532D',
    x: 370, y: 190,
    plain: 'A standard accessible car space must be at least 96 inches (8 feet) wide. It must have an access aisle next to it, and must be located on the shortest accessible route to the building entrance. The space is measured from the center of the boundary markings, so the painted lines are shared between the space and the aisle.',
    legal: '"Car parking spaces shall be 96 inches (2440 mm) wide minimum." Per §502.3: access aisles "shall adjoin an accessible route." Per §208.3.1: spaces "shall be located on the shortest accessible route from parking to an entrance."',
    citation: '§502.2, §502.3, §208.3.1',
    linkOverride: null
  },
  {
    id: 3, label: 'Access Aisle', section: '§502.3', color: '#2563EB', textColor: '#1E3A8A',
    x: 255, y: 260,
    plain: 'The access aisle is the striped area next to accessible parking spaces. It must be at least 60 inches (5 feet) wide and run the full length of the space. Two adjacent accessible spaces can share a single aisle between them. The aisle must be clearly marked — usually with diagonal hatching. For angled van spaces, the aisle must be on the passenger side where the ramp deploys.',
    legal: '"Access aisles serving parking spaces shall comply with 502.3. Access aisles shall adjoin an accessible route." Width: "60 inches (1525 mm) wide minimum." "Two parking spaces shall be permitted to share a common access aisle." "Van parking spaces shall have access aisles located on the passenger side."',
    citation: '§502.3, §502.3.1, §502.3.3, §502.3.4',
    linkOverride: null
  },
  {
    id: 4, label: 'Signage', section: '§502.6', color: '#7C3AED', textColor: '#5B21B6',
    x: 575, y: 105,
    plain: 'Every accessible parking space must have a sign showing the International Symbol of Accessibility (the blue wheelchair symbol). The bottom of the sign must be at least 60 inches (5 feet) above the ground so it is visible even when a vehicle is parked in the space. Van-accessible spaces need an additional sign or text reading "Van Accessible." Exception: parking lots with only 4 or fewer total spaces do not need signage if they serve a single residential unit.',
    legal: '"Accessible parking spaces shall be identified by signs showing the International Symbol of Accessibility complying with 703.7.2.1. Signs identifying van parking spaces shall contain the designation \'van accessible.\' Signs shall be 60 inches (1525 mm) minimum above the finish floor or ground surface measured to the bottom of the sign."',
    citation: '§502.6',
    linkOverride: null
  },
  {
    id: 5, label: 'Van Vertical Clearance', section: '§502.5', color: '#92400E', textColor: '#78350F',
    x: 575, y: 265,
    plain: 'Van-accessible spaces must have at least 98 inches (8 feet 2 inches) of vertical clearance. This is not just over the parking space — it applies to the entire vehicle route from the parking facility entrance, through the space and access aisle, all the way to the facility exit. This ensures tall vans with roof-mounted wheelchair lifts can navigate the entire route safely.',
    legal: '"Van parking spaces, access aisles serving them, and a vehicular route from an entrance of the parking facility to the van parking spaces and from the van parking spaces to an exit from the parking facility shall provide a vertical clearance of 98 inches (2490 mm) minimum."',
    citation: '§502.5',
    linkOverride: null
  },
  {
    id: 6, label: 'Surface & Slope', section: '§502.4', color: '#BE185D', textColor: '#9D174D',
    x: 255, y: 340,
    plain: 'Accessible spaces and their access aisles must be firm, stable, and slip-resistant. The access aisle must be at the same level as the parking space — no curbs, steps, or level changes between them. The maximum slope in any direction is 1:48 (about 2%), which is essentially flat. Curb ramps must not project into access aisles because they create an uneven surface where wheelchairs could tip.',
    legal: '"Parking spaces and access aisles serving them shall have surface slopes not steeper than 1:48." "Access aisles shall be at the same level as the parking spaces they serve. Changes in level are not permitted."',
    citation: '§502.4',
    linkOverride: null
  },
  {
    id: 7, label: 'Scoping (How Many?)', section: '§208.2', color: '#0E7490', textColor: '#0C4A6E',
    x: 115, y: 340,
    plain: 'The number of accessible spaces required depends on the total number of parking spaces in your lot or garage. See the table below. Medical facilities specializing in treating people with mobility impairments must provide 20% accessible spaces for outpatient areas. Of all accessible spaces, at least 1 in every 6 must be van-accessible.',
    legal: '"Parking facilities shall provide accessible parking spaces in accordance with Table 208.2." Per §208.2.4: "For every six or fraction of six accessible parking spaces required, at least one shall be a van parking space complying with 502."',
    citation: '§208.2, §208.2.4',
    linkOverride: SCOPING_URL,
    hasTable: true
  }
];

function makeLink(text, url) {
  return (
    <a href={url || STD_URL} target="_blank" rel="noopener noreferrer"
      style={{ color: '#C2410C', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}
      aria-label={`${text} on ADA.gov (opens in new tab)`}>
      {text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>↗</span>
    </a>
  );
}

function parseCitations(text, linkOverride) {
  const parts = text.split(/(§\d{3,4}(?:\.\d+)*)/g);
  return parts.map((part, i) => {
    if (/^§\d{3,4}/.test(part)) {
      const url = /^§208/.test(part) ? SCOPING_URL : (linkOverride || STD_URL);
      return <React.Fragment key={i}>{makeLink(part, url)}</React.Fragment>;
    }
    return part;
  });
}

function HatchPattern() {
  return (
    <defs>
      <pattern id="hatch" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="8" stroke="#2563EB" strokeWidth="1.5" opacity="0.35" />
      </pattern>
    </defs>
  );
}

export default function ParkingDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);

  const toggle = useCallback((id) => {
    setActive(prev => prev === id ? null : id);
  }, []);

  useEffect(() => {
    if (active && panelRef.current) {
      panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [active]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setActive(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const imp = (inches, mm) => metric ? `${mm} mm` : `${inches}"`;
  const impFt = (ft, mm) => metric ? `${mm} mm` : `${ft}'`;

  const activeCallout = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      {/* Unit toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
        {['Imperial', 'Metric'].map(u => {
          const isActive = u === 'Metric' ? metric : !metric;
          return (
            <button key={u} onClick={() => setMetric(u === 'Metric')}
              style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isActive ? 700 : 500,
                padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--slate-200)',
                background: isActive ? '#1A1F2B' : 'white', color: isActive ? 'white' : 'var(--slate-600)',
                cursor: 'pointer', minHeight: '28px'
              }} aria-pressed={isActive}>{u}</button>
          );
        })}
      </div>

      {/* SVG */}
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 900 440" role="img" aria-labelledby="park-title park-desc"
          style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="park-title">ADA §502 Accessible Parking Spaces Diagram</title>
          <desc id="park-desc">
            Split-view diagram. Left: top-down plan of a van-accessible space (132 inches wide), a shared access aisle
            (60 inches wide with diagonal hatching), and a standard accessible car space (96 inches wide), plus a sidewalk
            above. Right: signage elevation detail showing ISA sign at 60 inches minimum height and 98-inch van vertical clearance.
          </desc>

          <rect x="0" y="0" width="900" height="440" fill="#FAFAF9" />
          <HatchPattern />

          {/* ===== LEFT: PLAN VIEW ===== */}
          {/* Divider label */}
          <text x="230" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">PLAN VIEW (TOP-DOWN)</text>

          {/* Sidewalk strip */}
          <rect x="30" y="42" width="430" height="36" rx="3" fill="#D6D3D1" stroke="#A8A29E" strokeWidth="1" />
          <text x="245" y="64" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="600" fill="#4B4540">SIDEWALK / ACCESSIBLE ROUTE TO ENTRANCE →</text>

          {/* Van space */}
          <rect x="30" y="82" width="140" height="260" rx="2" fill="#FEF2F2" stroke="#C2410C" strokeWidth="1.5" />
          {/* Van silhouette */}
          <rect x="50" y="110" width="100" height="180" rx="8" fill="#C2410C" opacity="0.07" />
          <rect x="55" y="115" width="90" height="40" rx="4" fill="#C2410C" opacity="0.05" />
          <rect x="55" y="255" width="90" height="30" rx="4" fill="#C2410C" opacity="0.05" />
          <text x="100" y="207" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#8B2E08" opacity="0.6">VAN</text>
          {/* ISA on ground */}
          <circle cx="100" cy="316" r="10" fill="none" stroke="#2563EB" strokeWidth="1.5" opacity="0.4" />
          <text x="100" y="320" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#1E3A8A" opacity="0.5">♿</text>
          <text x="100" y="96" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#8B2E08">VAN ACCESSIBLE</text>

          {/* Access aisle */}
          <rect x="170" y="82" width="70" height="260" fill="url(#hatch)" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="205" y="215" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#1E3A8A" transform="rotate(-90, 205, 215)">ACCESS AISLE</text>

          {/* Car space */}
          <rect x="240" y="82" width="110" height="260" rx="2" fill="#F0FDF4" stroke="#15803D" strokeWidth="1.5" />
          {/* Car silhouette */}
          <rect x="258" y="120" width="74" height="160" rx="10" fill="#15803D" opacity="0.06" />
          <rect x="262" y="125" width="66" height="35" rx="6" fill="#15803D" opacity="0.04" />
          <rect x="262" y="250" width="66" height="25" rx="6" fill="#15803D" opacity="0.04" />
          <text x="295" y="207" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#14532D" opacity="0.6">CAR</text>
          {/* ISA on ground */}
          <circle cx="295" cy="316" r="10" fill="none" stroke="#2563EB" strokeWidth="1.5" opacity="0.4" />
          <text x="295" y="320" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#1E3A8A" opacity="0.5">♿</text>

          {/* Non-accessible space (dashed) */}
          <rect x="350" y="82" width="110" height="260" rx="2" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="5 4" />
          <text x="405" y="207" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">STANDARD</text>
          <text x="405" y="218" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">SPACE</text>

          {/* --- LEFT DIMENSIONS --- */}
          {/* Van width */}
          <line x1="30" y1="362" x2="170" y2="362" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="30" y1="354" x2="30" y2="370" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="170" y1="354" x2="170" y2="370" stroke="#C2410C" strokeWidth="1.2" />
          <polygon points="35,362 45,358 45,366" fill="#C2410C" />
          <polygon points="165,362 155,358 155,366" fill="#C2410C" />
          <rect x="62" y="369" width="76" height="15" rx="3" fill="#C2410C" />
          <text x="100" y="379" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="white">
            {imp('132', '3350')} / {impFt("11'", '3350')}
          </text>

          {/* Aisle width */}
          <line x1="170" y1="362" x2="240" y2="362" stroke="#2563EB" strokeWidth="1.2" />
          <line x1="240" y1="354" x2="240" y2="370" stroke="#2563EB" strokeWidth="1.2" />
          <polygon points="175,362 185,358 185,366" fill="#2563EB" />
          <polygon points="235,362 225,358 225,366" fill="#2563EB" />
          <rect x="172" y="369" width="66" height="15" rx="3" fill="#2563EB" />
          <text x="205" y="379" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="white">
            {imp('60', '1525')} / {impFt("5'", '1525')}
          </text>

          {/* Car width */}
          <line x1="240" y1="362" x2="350" y2="362" stroke="#15803D" strokeWidth="1.2" />
          <line x1="350" y1="354" x2="350" y2="370" stroke="#15803D" strokeWidth="1.2" />
          <polygon points="245,362 255,358 255,366" fill="#15803D" />
          <polygon points="345,362 335,358 335,366" fill="#15803D" />
          <rect x="262" y="369" width="66" height="15" rx="3" fill="#15803D" />
          <text x="295" y="379" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="white">
            {imp('96', '2440')} / {impFt("8'", '2440')}
          </text>

          {/* Surface/slope label */}
          <line x1="50" y1="400" x2="340" y2="400" stroke="#DB2777" strokeWidth="1" strokeDasharray="3 2" />
          <rect x="130" y="405" width="110" height="14" rx="3" fill="#DB2777" />
          <text x="185" y="414" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">
            1:48 max slope all areas
          </text>


          {/* ===== DIVIDER ===== */}
          <line x1="485" y1="30" x2="485" y2="430" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />


          {/* ===== RIGHT: SIGNAGE ELEVATION ===== */}
          <text x="690" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">SIGNAGE DETAIL (ELEVATION)</text>

          {/* Ground line */}
          <rect x="510" y="380" width="360" height="20" rx="2" fill="#E7E5E4" stroke="#D6D3D1" strokeWidth="1" />
          <text x="690" y="394" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B4540">GROUND LEVEL</text>

          {/* Sign post */}
          <rect x="618" y="105" width="6" height="275" fill="#78716C" rx="1" />

          {/* Sign face — ISA */}
          <rect x="630" y="105" width="70" height="70" rx="4" fill="#1D4ED8" stroke="#1E40AF" strokeWidth="1.5" />
          <text x="665" y="148" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="28" fill="white">♿</text>

          {/* VAN ACCESSIBLE sub-sign */}
          <rect x="634" y="180" width="62" height="22" rx="3" fill="white" stroke="#1E40AF" strokeWidth="1" />
          <text x="665" y="194" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="#1E40AF">VAN ACCESSIBLE</text>

          {/* Van silhouette for scale */}
          <rect x="720" y="220" width="100" height="160" rx="10" fill="#B45309" opacity="0.08" stroke="#B45309" strokeWidth="1" opacity="0.2" />
          <rect x="725" y="225" width="90" height="40" rx="6" fill="#B45309" opacity="0.06" />
          <rect x="725" y="345" width="90" height="30" rx="6" fill="#B45309" opacity="0.06" />
          <text x="770" y="305" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#78350F" opacity="0.4">VAN</text>

          {/* --- RIGHT DIMENSIONS --- */}

          {/* Sign height: 60" min */}
          <line x1="590" y1="175" x2="590" y2="380" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="583" y1="175" x2="597" y2="175" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="583" y1="380" x2="597" y2="380" stroke="#7C3AED" strokeWidth="1.5" />
          <polygon points="590,180 586,190 594,190" fill="#7C3AED" />
          <polygon points="590,375 586,365 594,365" fill="#7C3AED" />
          <rect x="548" y="270" width="70" height="16" rx="3" fill="#7C3AED" />
          <text x="583" y="281" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="white">
            {imp('60', '1525')} min
          </text>

          {/* Van clearance: 98" min */}
          <line x1="840" y1="218" x2="840" y2="380" stroke="#B45309" strokeWidth="1.5" />
          <line x1="833" y1="218" x2="847" y2="218" stroke="#B45309" strokeWidth="1.5" />
          <line x1="833" y1="380" x2="847" y2="380" stroke="#B45309" strokeWidth="1.5" />
          <polygon points="840,223 836,233 844,233" fill="#B45309" />
          <polygon points="840,375 836,365 844,365" fill="#B45309" />
          {/* Overhead clearance line */}
          <line x1="700" y1="218" x2="860" y2="218" stroke="#B45309" strokeWidth="1" strokeDasharray="5 3" />
          <rect x="800" y="240" width="76" height="16" rx="3" fill="#B45309" />
          <text x="838" y="251" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="white">
            {imp('98', '2490')} min
          </text>


          {/* ===== CALLOUT DOTS ===== */}
          {CALLOUTS.map(c => (
            <g key={c.id}
              tabIndex="0" role="button"
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
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'}
                stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif"
                fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
              <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2"
                className="park-focus-ring" />
            </g>
          ))}

          <text x="50" y="432" fontFamily="Manrope, sans-serif" fontSize="10" fill="#4B5563">
            Click or tap numbered callouts for details
          </text>
        </svg>
      </div>

      {/* Live region */}
      <div aria-live="polite" className="sr-only">
        {activeCallout ? `Now showing details for callout ${activeCallout.id}: ${activeCallout.label}, ${activeCallout.section}` : ''}
      </div>

      {/* Info panel */}
      {activeCallout && (
        <div ref={panelRef} style={{
          marginTop: '12px', background: 'white', border: '1px solid var(--slate-200)',
          borderRadius: '12px', overflow: 'hidden', animation: 'parkFadeIn 0.25s ease-out'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderBottom: '1px solid var(--slate-200)', background: '#FAFAF9',
            flexWrap: 'wrap', gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '26px', height: '26px', borderRadius: '50%',
                background: activeCallout.color, color: 'white',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700
              }}>{activeCallout.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                {activeCallout.label}
              </span>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                color: activeCallout.color, background: `${activeCallout.color}15`,
                padding: '2px 8px', borderRadius: '4px'
              }}>{activeCallout.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close panel"
              style={{
                background: 'none', border: '1px solid var(--slate-200)', borderRadius: '8px',
                padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-600)', minHeight: '44px'
              }}>Close <span aria-hidden="true">✕</span></button>
          </div>

          {/* Content */}
          <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                color: 'var(--slate-700)', lineHeight: 1.75, margin: 0
              }}>{activeCallout.plain}</p>

              {/* Scoping table for callout 7 */}
              {activeCallout.hasTable && (
                <table style={{
                  width: '100%', borderCollapse: 'collapse', marginTop: '16px',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem'
                }} role="table" aria-label="Accessible parking scoping table">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--slate-200)', fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.8rem' }}>Total Spaces</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid var(--slate-200)', fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.8rem' }}>Accessible Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCOPING_TABLE.map(([total, req], i) => (
                      <tr key={i}>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--slate-100)', color: 'var(--slate-700)' }}>{total}</td>
                        <td style={{ padding: '6px 10px', borderBottom: '1px solid var(--slate-100)', color: 'var(--slate-700)', fontWeight: 600 }}>{req}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}>
              <div style={{
                background: '#FFFBF7', borderLeft: '3px solid #C2410C',
                borderRadius: '0 10px 10px 0', padding: '16px 18px'
              }}>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--slate-500)', margin: '0 0 8px'
                }}>Official Standard — {parseCitations(activeCallout.citation, activeCallout.linkOverride)}</p>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                  color: 'var(--slate-600)', lineHeight: 1.7, margin: 0, fontStyle: 'italic'
                }}>{parseCitations(activeCallout.legal, activeCallout.linkOverride)}</p>
              </div>
            </aside>
          </div>
        </div>
      )}

      <style>{`
        @keyframes parkFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        g[role="button"]:focus .park-focus-ring {
          stroke: #C2410C; stroke-width: 2.5;
        }
        @media (max-width: 768px) {
          .guide-two-col { flex-direction: column !important; gap: 16px !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}