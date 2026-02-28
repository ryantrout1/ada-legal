import React, { useState, useRef, useEffect, useCallback } from 'react';

const WC_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#604-water-closets-and-toilet-compartments';
const GRAB_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#609-grab-bars';

const CALLOUTS = [
  {
    id: 1, label: 'Stall Dimensions', section: '§604.8', color: '#C2410C', textColor: '#8B2E08',
    x: 450, y: 56,
    plain: 'A wheelchair-accessible toilet stall must be at least 60 inches (5 feet) wide and at least 56 inches deep if the toilet is wall-mounted, or 59 inches deep if it is floor-mounted. The extra 3 inches for floor-mounted toilets accounts for the base taking up floor space. The door must swing outward so it does not reduce the maneuvering room inside the stall. Self-closing hinges are allowed, but the door must close slowly enough for safe use.',
    legal: '"Wheelchair accessible compartments with floor-mounted water closets shall be 60 inches (1525 mm) wide minimum… and 59 inches (1500 mm) deep minimum." Wall-hung: "56 inches (1420 mm) deep minimum." Door: "shall not swing into the minimum required compartment area."',
    citation: '§604.8.1.1, §604.8.1.2, §604.8.1.6'
  },
  {
    id: 2, label: 'Toilet Position', section: '§604.2', color: '#15803D', textColor: '#14532D',
    x: 175, y: 295,
    plain: 'The center of the toilet must be between 16 and 18 inches from the side wall. This precise positioning ensures the side grab bar is within comfortable reach during a wheelchair transfer. The seat height must be between 17 and 19 inches above the floor — higher than a standard residential toilet (typically 15 inches) — making it much easier to transfer from a wheelchair.',
    legal: '"The centerline of the water closet shall be 16 inches (405 mm) minimum to 18 inches (455 mm) maximum from the side wall or partition." Seat height: "17 inches (430 mm) minimum and 19 inches (485 mm) maximum measured to the top of the seat."',
    citation: '§604.2, §604.4'
  },
  {
    id: 3, label: 'Side Grab Bar', section: '§604.5.1 + §609', color: '#2563EB', textColor: '#1E3A8A',
    x: 80, y: 180,
    plain: 'The side grab bar must be at least 42 inches long, mounted on the wall closest to the toilet. It starts no more than 12 inches from the rear wall and extends at least 54 inches from the rear wall. It must be mounted between 33 and 36 inches above the floor, have a smooth circular cross-section between 1.25 and 2 inches in diameter, and support at least 250 pounds of force. The bar must be continuous with no breaks or obstructions along its length.',
    legal: '"The side wall grab bar shall be 42 inches (1065 mm) long minimum, located 12 inches (305 mm) maximum from the rear wall and extending 54 inches (1370 mm) minimum from the rear wall." Height: "33 inches (840 mm) minimum and 36 inches (915 mm) maximum above the finish floor." Structural strength: "250 pounds (1112 N)" of force.',
    citation: '§604.5.1, §609.4, §609.8',
    grabBar: true
  },
  {
    id: 4, label: 'Rear Grab Bar', section: '§604.5.2 + §609', color: '#7C3AED', textColor: '#5B21B6',
    x: 260, y: 425,
    plain: 'The rear grab bar must be at least 36 inches long, mounted on the wall behind the toilet. It must extend at least 12 inches past the toilet centerline on one side and at least 24 inches past it on the other (the transfer side — the open side where the wheelchair approaches). The same height, diameter, and 250-pound strength requirements apply as for the side bar.',
    legal: '"The rear wall grab bar shall be 36 inches (915 mm) long minimum and extend from the centerline of the water closet 12 inches (305 mm) minimum on one side and 24 inches (610 mm) minimum on the other side."',
    citation: '§604.5.2, §609.4',
    grabBar: true
  },
  {
    id: 5, label: 'Clear Floor Space', section: '§604.3', color: '#92400E', textColor: '#78350F',
    x: 370, y: 240,
    plain: 'The clear floor space inside the stall must extend at least 60 inches from the side wall (the full width of the stall) and at least 56 inches from the rear wall. This provides enough room for a person using a wheelchair to enter the stall, position next to the toilet, and perform a lateral (side) transfer. No fixtures, dispensers, or trash cans may protrude into this clear space.',
    legal: '"Clearance around water closets shall be 60 inches (1525 mm) minimum measured perpendicular from the side wall and 56 inches (1420 mm) minimum measured perpendicular from the rear wall."',
    citation: '§604.3.1'
  },
  {
    id: 6, label: 'Flush Controls', section: '§604.6', color: '#BE185D', textColor: '#9D174D',
    x: 250, y: 345,
    plain: 'The flush control must be on the open side of the toilet — the side where the wheelchair approaches, not the wall side. It must be hand-operated or automatic. If hand-operated, it must work with one hand and not require tight grasping, pinching, or twisting of the wrist. The maximum operating force is 5 pounds. Automatic flush sensors always comply with these requirements.',
    legal: '"Flush controls shall be hand operated or automatic. Hand operated flush controls shall comply with 309. Flush controls shall be located on the open side of the water closet."',
    citation: '§604.6'
  },
  {
    id: 7, label: 'Toilet Paper Dispenser', section: '§604.7', color: '#0E7490', textColor: '#0C4A6E',
    x: 115, y: 130,
    plain: 'The toilet paper dispenser must be mounted 7 to 9 inches in front of the toilet (measured from the front edge of the toilet to the centerline of the dispenser). It must be between 15 and 48 inches above the floor. Critically, it must not obstruct the use of the grab bar — large dispensers that stick out from the wall can block a person from gripping the bar. The dispenser must allow continuous paper delivery (no controlled-delivery types that limit how much paper you can pull at once).',
    legal: '"Toilet paper dispensers shall be 7 inches (180 mm) minimum and 9 inches (230 mm) maximum in front of the water closet measured to the centerline of the dispenser. The outlet of the dispenser shall be 15 inches (380 mm) minimum and 48 inches (1220 mm) maximum above the finish floor." "Dispensers shall not be of a type that controls delivery or that does not allow continuous paper flow."',
    citation: '§604.7'
  }
];

function makeLink(text, url) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}
      aria-label={`${text} on ADA.gov (opens in new tab)`}>
      {text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>↗</span>
    </a>
  );
}

function parseCitations(text, callout) {
  const parts = text.split(/(§\d{3,4}(?:\.\d+)*)/g);
  return parts.map((part, i) => {
    if (/^§\d{3,4}/.test(part)) {
      const url = /^§609/.test(part) ? GRAB_URL : WC_URL;
      return <React.Fragment key={i}>{makeLink(part, url)}</React.Fragment>;
    }
    return part;
  });
}

export default function ToiletStallDiagram() {
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

  const activeCallout = CALLOUTS.find(c => c.id === active);

  // Layout constants — stall drawn from (100,60) to (520,460)
  const SX = 100;  // stall left (side wall)
  const SY = 60;   // stall top (front wall / door wall)
  const SW = 420;  // stall width  (60" mapped)
  const SD = 400;  // stall depth  (56-59" mapped)
  const SR = SX + SW; // stall right
  const SB = SY + SD; // stall bottom (rear wall)

  // Toilet position: centerline 16-18" from side wall → ~17" ≈ 119px from left
  const TX = SX + 119;  // toilet centerline X
  const TY = SB - 80;   // toilet front edge Y
  const TW = 56;         // toilet width
  const TH = 70;         // toilet depth

  // Side grab bar: on side wall (x=SX), from 12" from rear → rear-48px, 42" long → 294px
  const SGB_Y1 = SB - 48;   // 12" from rear wall
  const SGB_Y2 = SB - 378;  // extends 54" from rear (378px mapped)
  const SGB_LEN = SGB_Y1 - SGB_Y2; // visual length

  // Rear grab bar: on rear wall (y=SB), 36" long → 252px, centered on toilet
  const RGB_X1 = TX - 84;   // 12" past centerline on wall side
  const RGB_X2 = TX + 168;  // 24" past centerline on transfer side

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
        <svg viewBox="0 0 700 540" role="img" aria-labelledby="wc-title wc-desc"
          style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="wc-title">ADA §604 Accessible Toilet Stall Diagram</title>
          <desc id="wc-desc">
            Top-down plan view of a wheelchair-accessible toilet stall showing a 60-inch wide by 56-to-59-inch deep
            compartment with the toilet centered 16 to 18 inches from the side wall, a 42-inch side grab bar, a 36-inch
            rear grab bar, an outward-swinging door, clear floor space, flush control on the open side, and toilet paper
            dispenser position. Dimension lines and 7 interactive callouts provide detailed requirements.
          </desc>

          <rect x="0" y="0" width="700" height="540" fill="#FAFAF9" />

          {/* Label */}
          <text x="350" y="32" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">
            PLAN VIEW (TOP-DOWN) — WHEELCHAIR-ACCESSIBLE STALL
          </text>

          {/* ===== STALL WALLS ===== */}
          {/* Side wall (left) */}
          <line x1={SX} y1={SY} x2={SX} y2={SB} stroke="#475569" strokeWidth="4" />
          {/* Rear wall (bottom) */}
          <line x1={SX} y1={SB} x2={SR} y2={SB} stroke="#475569" strokeWidth="4" />
          {/* Right wall (partition) */}
          <line x1={SR} y1={SY + 70} x2={SR} y2={SB} stroke="#475569" strokeWidth="3" />
          {/* Front wall segments (with door gap) */}
          <line x1={SX} y1={SY} x2={SX + 100} y2={SY} stroke="#475569" strokeWidth="3" />
          <line x1={SR - 80} y1={SY} x2={SR} y2={SY} stroke="#475569" strokeWidth="3" />

          {/* Wall labels */}
          <text x={SX - 8} y={(SY + SB) / 2} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563" transform={`rotate(-90, ${SX - 8}, ${(SY + SB) / 2})`}>SIDE WALL</text>
          <text x={(SX + SR) / 2} y={SB + 16} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">REAR WALL</text>

          {/* ===== DOOR (swings outward) ===== */}
          {/* Door leaf shown swung open (arc outside stall) */}
          <line x1={SX + 100} y1={SY} x2={SX + 100} y2={SY - 50} stroke="#475569" strokeWidth="2.5" />
          <path d={`M ${SX + 100} ${SY} A 50 50 0 0 1 ${SX + 100} ${SY - 50}`}
            fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 3" />
          <text x={SX + 130} y={SY - 25} fontFamily="Manrope, sans-serif" fontSize="8" fill="#374151">DOOR</text>
          <text x={SX + 130} y={SY - 14} fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563">(swings out)</text>

          {/* Door opening indicator */}
          <line x1={SX + 100} y1={SY} x2={SR - 80} y2={SY} stroke="#475569" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

          {/* ===== CLEAR FLOOR SPACE ===== */}
          <rect x={SX + 2} y={SY + 2} width={SW - 4} height={SD - 4} rx="4"
            fill="#D97706" opacity="0.04" stroke="#D97706" strokeWidth="1" strokeDasharray="6 4" />

          {/* ===== TOILET FIXTURE ===== */}
          {/* Bowl (oval) */}
          <ellipse cx={TX} cy={TY + 20} rx={TW / 2} ry={TH / 2 + 4} fill="#F1F5F9" stroke="#64748B" strokeWidth="1.5" />
          {/* Tank */}
          <rect x={TX - 30} y={SB - 28} width={60} height={24} rx="4" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.5" />
          {/* Centerline indicator */}
          <line x1={TX} y1={TY - 10} x2={TX} y2={SB - 28} stroke="#16A34A" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
          <text x={TX} y={TY + 24} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#374151">TOILET</text>

          {/* Flush control indicator (on open/right side) */}
          <circle cx={TX + 38} cy={SB - 50} r="5" fill="#DB2777" opacity="0.2" stroke="#DB2777" strokeWidth="1" />
          <text x={TX + 38} y={SB - 38} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#9D174D">FLUSH</text>

          {/* ===== TOILET PAPER DISPENSER ===== */}
          <rect x={SX + 6} y={TY - 40} width="18" height="24" rx="3" fill="#0EA5E9" opacity="0.12" stroke="#0891B2" strokeWidth="1" />
          <text x={SX + 15} y={TY - 24} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#0C4A6E">TP</text>

          {/* ===== GRAB BARS ===== */}
          {/* Side grab bar (on side wall) */}
          <line x1={SX + 2} y1={SGB_Y1} x2={SX + 2} y2={SGB_Y2}
            stroke="#2563EB" strokeWidth="5" strokeLinecap="round" />
          <line x1={SX + 2} y1={SGB_Y1} x2={SX + 2} y2={SGB_Y2}
            stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />

          {/* Rear grab bar (on rear wall) */}
          <line x1={RGB_X1} y1={SB - 2} x2={RGB_X2} y2={SB - 2}
            stroke="#7C3AED" strokeWidth="5" strokeLinecap="round" />
          <line x1={RGB_X1} y1={SB - 2} x2={RGB_X2} y2={SB - 2}
            stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />

          {/* ===== WHEELCHAIR TURNING INDICATOR ===== */}
          <circle cx={SX + SW / 2 + 40} cy={SY + SD / 2 - 40} r="60"
            fill="none" stroke="#D97706" strokeWidth="1" strokeDasharray="5 4" opacity="0.3" />
          <text x={SX + SW / 2 + 40} y={SY + SD / 2 - 40} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" opacity="0.5">♿ turning</text>
          <text x={SX + SW / 2 + 40} y={SY + SD / 2 - 30} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" opacity="0.5">radius</text>

          {/* ===== DIMENSION LINES ===== */}

          {/* Stall width (top, outside) */}
          <line x1={SX} y1={SY - 58} x2={SR} y2={SY - 58} stroke="#C2410C" strokeWidth="1.2" />
          <line x1={SX} y1={SY - 66} x2={SX} y2={SY - 50} stroke="#C2410C" strokeWidth="1.2" />
          <line x1={SR} y1={SY - 66} x2={SR} y2={SY - 50} stroke="#C2410C" strokeWidth="1.2" />
          <polygon points={`${SX + 5},${SY - 58} ${SX + 15},${SY - 62} ${SX + 15},${SY - 54}`} fill="#C2410C" />
          <polygon points={`${SR - 5},${SY - 58} ${SR - 15},${SY - 62} ${SR - 15},${SY - 54}`} fill="#C2410C" />
          <rect x={(SX + SR) / 2 - 40} y={SY - 68} width="80" height="16" rx="3" fill="#C2410C" />
          <text x={(SX + SR) / 2} y={SY - 57} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8.5" fontWeight="700" fill="white">
            {imp('60', '1525')} min
          </text>

          {/* Stall depth (right, outside) */}
          <line x1={SR + 30} y1={SY} x2={SR + 30} y2={SB} stroke="#C2410C" strokeWidth="1.2" />
          <line x1={SR + 22} y1={SY} x2={SR + 38} y2={SY} stroke="#C2410C" strokeWidth="1.2" />
          <line x1={SR + 22} y1={SB} x2={SR + 38} y2={SB} stroke="#C2410C" strokeWidth="1.2" />
          <polygon points={`${SR + 30},${SY + 5} ${SR + 26},${SY + 15} ${SR + 34},${SY + 15}`} fill="#C2410C" />
          <polygon points={`${SR + 30},${SB - 5} ${SR + 26},${SB - 15} ${SR + 34},${SB - 15}`} fill="#C2410C" />
          <rect x={SR + 38} y={(SY + SB) / 2 - 8} width="90" height="16" rx="3" fill="#C2410C" />
          <text x={SR + 83} y={(SY + SB) / 2 + 3} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="white">
            {imp('56–59', '1420–1500')}
          </text>

          {/* Toilet centerline to side wall */}
          <line x1={SX} y1={SB - 100} x2={TX} y2={SB - 100} stroke="#16A34A" strokeWidth="1.2" />
          <line x1={SX} y1={SB - 108} x2={SX} y2={SB - 92} stroke="#16A34A" strokeWidth="1.2" />
          <line x1={TX} y1={SB - 108} x2={TX} y2={SB - 92} stroke="#16A34A" strokeWidth="1.2" />
          <rect x={(SX + TX) / 2 - 36} y={SB - 120} width="72" height="14" rx="3" fill="#16A34A" />
          <text x={(SX + TX) / 2} y={SB - 110} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">
            {imp('16–18', '405–455')}
          </text>

          {/* Side grab bar length */}
          <line x1={SX - 25} y1={SGB_Y2} x2={SX - 25} y2={SGB_Y1} stroke="#2563EB" strokeWidth="1.2" />
          <line x1={SX - 33} y1={SGB_Y2} x2={SX - 17} y2={SGB_Y2} stroke="#2563EB" strokeWidth="1.2" />
          <line x1={SX - 33} y1={SGB_Y1} x2={SX - 17} y2={SGB_Y1} stroke="#2563EB" strokeWidth="1.2" />
          <rect x={SX - 65} y={(SGB_Y1 + SGB_Y2) / 2 - 7} width="72" height="14" rx="3" fill="#2563EB" />
          <text x={SX - 29} y={(SGB_Y1 + SGB_Y2) / 2 + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">
            {imp('42', '1065')} min
          </text>

          {/* Rear grab bar length */}
          <line x1={RGB_X1} y1={SB + 25} x2={RGB_X2} y2={SB + 25} stroke="#7C3AED" strokeWidth="1.2" />
          <line x1={RGB_X1} y1={SB + 17} x2={RGB_X1} y2={SB + 33} stroke="#7C3AED" strokeWidth="1.2" />
          <line x1={RGB_X2} y1={SB + 17} x2={RGB_X2} y2={SB + 33} stroke="#7C3AED" strokeWidth="1.2" />
          <rect x={(RGB_X1 + RGB_X2) / 2 - 36} y={SB + 32} width="72" height="14" rx="3" fill="#7C3AED" />
          <text x={(RGB_X1 + RGB_X2) / 2} y={SB + 42} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">
            {imp('36', '915')} min
          </text>

          {/* Grab bar height note (small badge) */}
          <rect x={SX - 60} y={SGB_Y2 + 50} width="80" height="14" rx="3" fill="#2563EB" opacity="0.8" />
          <text x={SX - 20} y={SGB_Y2 + 60} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">
            ↕ {imp('33–36', '840–915')} high
          </text>

          {/* Seat height note */}
          <rect x={TX + 40} y={TY + 30} width="80" height="14" rx="3" fill="#16A34A" opacity="0.8" />
          <text x={TX + 80} y={TY + 40} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">
            ↕ {imp('17–19', '430–485')} seat
          </text>

          {/* TP dispenser position */}
          <line x1={SX + 15} y1={TY - 16} x2={SX + 15} y2={TY} stroke="#0891B2" strokeWidth="1" strokeDasharray="2 2" />
          <rect x={SX + 26} y={TY - 22} width="68" height="12" rx="3" fill="#0EA5E9" opacity="0.8" />
          <text x={SX + 60} y={TY - 13} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">
            {imp('7–9', '180–230')} in front
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
                className="wc-focus-ring" />
            </g>
          ))}

          <text x="40" y="525" fontFamily="Manrope, sans-serif" fontSize="10" fill="#4B5563">
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
          borderRadius: '12px', overflow: 'hidden', animation: 'wcFadeIn 0.25s ease-out'
        }}>
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

          <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                color: 'var(--slate-700)', lineHeight: 1.75, margin: 0
              }}>{activeCallout.plain}</p>
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
                }}>Official Standard — {parseCitations(activeCallout.citation)}</p>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                  color: 'var(--slate-600)', lineHeight: 1.7, margin: 0, fontStyle: 'italic'
                }}>{parseCitations(activeCallout.legal)}</p>
              </div>
            </aside>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wcFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        g[role="button"]:focus .wc-focus-ring {
          stroke: #C2410C; stroke-width: 2.5;
        }
        @media (max-width: 768px) {
          .guide-two-col { flex-direction: column !important; gap: 16px !important; }
        }
              @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}