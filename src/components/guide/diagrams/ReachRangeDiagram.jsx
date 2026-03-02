import React, { useState, useRef, useEffect, useCallback } from 'react';

const REACH_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#308-reach-ranges';
const CLEAR_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#305-clear-floor-or-ground-space';
const OP_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#309-operable-parts';

const CALLOUTS = [
  {
    id: 1, label: 'Unobstructed Forward Reach', section: '§308.2.1', color: '#C2410C', textColor: '#8B2E08',
    x: 115, y: 60,
    plain: 'When a wheelchair user approaches an element head-on with nothing in the way, the reach range is 15 inches minimum to 48 inches maximum above the floor. This covers controls like elevator buttons, light switches, and thermostats mounted on a wall. A clear floor space of 30 × 48 inches must be provided in front of the element so the wheelchair can pull straight up to it.',
    legal: '"Where a forward reach is unobstructed, the high forward reach shall be 48 inches (1220 mm) maximum and the low forward reach shall be 15 inches (380 mm) minimum above the finish floor or ground."',
    citation: '§308.2.1'
  },
  {
    id: 2, label: 'Obstructed Forward Reach', section: '§308.2.2', color: '#15803D', textColor: '#14532D',
    x: 365, y: 60,
    plain: 'When reaching forward over a counter, shelf, or other obstruction, the maximum reach height decreases as the obstruction gets deeper. If the obstruction is up to 20 inches deep, the maximum high reach is 48 inches. If it is between 20 and 25 inches deep, the maximum drops to 44 inches. Obstructions deeper than 25 inches are not permitted for forward reach — you would need a side approach instead. The low reach remains 15 inches in all cases.',
    legal: '"Where the high forward reach is over an obstruction, the clear floor space shall extend beneath the element for a distance not less than the required reach depth over the obstruction." Obstruction ≤ 20 inches: high reach 48 inches max. Obstruction 20–25 inches: high reach 44 inches max.',
    citation: '§308.2.2'
  },
  {
    id: 3, label: 'Unobstructed Side Reach', section: '§308.3.1', color: '#2563EB', textColor: '#1E3A8A',
    x: 595, y: 60,
    plain: 'When approaching from the side (parallel to the element), with the wheelchair alongside it, the reach range is 15 inches minimum to 48 inches maximum above the floor — the same as unobstructed forward reach. The clear floor space is positioned parallel to the element rather than facing it. This is common for wall-mounted fire extinguishers, paper towel dispensers, and coat hooks.',
    legal: '"Where a clear floor or ground space allows a parallel approach to an element and the side reach is unobstructed, the high side reach shall be 48 inches (1220 mm) maximum and the low side reach shall be 15 inches (380 mm) minimum above the finish floor or ground."',
    citation: '§308.3.1'
  },
  {
    id: 4, label: 'Obstructed Side Reach', section: '§308.3.2', color: '#7C3AED', textColor: '#5B21B6',
    x: 820, y: 60,
    plain: 'When reaching sideways over an obstruction (like a counter or shelf), the rules depend on depth. If the obstruction is up to 10 inches deep, the maximum reach is 48 inches (same as unobstructed). If the obstruction is between 10 and 24 inches deep, the maximum high reach drops to 46 inches. Obstructions deeper than 24 inches are not permitted for side reach. The low reach remains 15 inches.',
    legal: '"Where a clear floor or ground space allows a parallel approach to an element and the high side reach is over an obstruction, the height of the obstruction shall be 34 inches (865 mm) maximum and the depth shall be 24 inches (610 mm) maximum." 10–24 inches deep: high reach 46 inches max.',
    citation: '§308.3.2'
  },
  {
    id: 5, label: 'Clear Floor Space', section: '§305', color: '#92400E', textColor: '#78350F',
    x: 115, y: 390,
    plain: 'A clear floor space of at least 30 inches wide × 48 inches deep is required at every element that a person needs to reach. The space can be oriented for either a forward approach (facing the element) or a parallel approach (alongside it). At least one full side of the clear floor space must adjoin an accessible route or another clear space. The floor must be level (max 1:48 slope) and the surface firm, stable, and slip-resistant.',
    legal: '"Clear floor or ground space shall comply with 305. The clear floor space shall be 30 inches (760 mm) minimum by 48 inches (1220 mm) minimum." Positioned for forward or parallel approach.',
    citation: '§305.3',
    altUrl: CLEAR_URL
  },
  {
    id: 6, label: 'Operable Parts', section: '§309.4', color: '#BE185D', textColor: '#9D174D',
    x: 365, y: 390,
    plain: 'All controls, switches, outlets, and other operable parts within reach range must be usable with one hand and must not require tight grasping, pinching, or twisting of the wrist. The maximum operating force is 5 pounds. This applies to light switches, thermostats, electrical outlets, fire alarm pull stations, hand dryers, and any other controls or mechanisms a person needs to operate.',
    legal: '"Operable parts shall be operable with one hand and shall not require tight grasping, pinching, or twisting of the wrist. The force required to activate operable parts shall be 5 pounds (22.2 N) maximum."',
    citation: '§309.4',
    altUrl: OP_URL
  },
  {
    id: 7, label: "Children's Reach", section: 'Advisory §308.1', color: '#0E7490', textColor: '#0C4A6E',
    x: 595, y: 390,
    plain: "The Standards do not mandate separate children's reach ranges except at specific elements designed for children's use. However, the Advisory notes in §308.1 recommend reduced maximums based on age: ages 3–4 should have a forward reach maximum of 36 inches; ages 5–8 a maximum of 40 inches; and ages 9–12 a maximum of 44 inches. Facilities specifically designed for children (schools, daycare) should follow these advisories.",
    legal: '"Advisory 308.1: Where building elements are designed specifically for use by children ages 12 and younger, the following specifications may be used." Forward reach: ages 3–4: 36 inches max; ages 5–8: 40 inches max; ages 9–12: 44 inches max.',
    citation: '§308.1 Advisory'
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
      let url = REACH_URL;
      if (/^§305/.test(part)) url = CLEAR_URL;
      if (/^§309/.test(part)) url = OP_URL;
      if (callout?.altUrl) url = callout.altUrl;
      return <React.Fragment key={i}>{makeLink(part, url)}</React.Fragment>;
    }
    return part;
  });
}

// Wheelchair silhouette (simplified, side view) — accepts x offset and optional flip
function WheelchairPerson({ x, y, scale = 1, opacity = 1 }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      {/* Rear wheel */}
      <circle cx="20" cy="70" r="18" fill="none" stroke="#64748B" strokeWidth="1.5" />
      {/* Front caster */}
      <circle cx="55" cy="78" r="6" fill="none" stroke="#64748B" strokeWidth="1.2" />
      {/* Seat / frame */}
      <line x1="15" y1="52" x2="55" y2="52" stroke="#64748B" strokeWidth="2" />
      <line x1="15" y1="52" x2="10" y2="70" stroke="#64748B" strokeWidth="1.5" />
      <line x1="55" y1="52" x2="55" y2="72" stroke="#64748B" strokeWidth="1.5" />
      {/* Back rest */}
      <line x1="15" y1="52" x2="12" y2="25" stroke="#64748B" strokeWidth="2" />
      {/* Person torso */}
      <line x1="25" y1="50" x2="22" y2="18" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      {/* Head */}
      <circle cx="22" cy="10" r="7" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
      {/* Arm reaching forward */}
      <line x1="24" y1="28" x2="50" y2="20" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      {/* Footrest */}
      <line x1="40" y1="78" x2="55" y2="78" stroke="#64748B" strokeWidth="1.5" />
    </g>
  );
}

export default function ReachRangeDiagram() {
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

  // Common layout: ground at y=340, each panel ~210px wide
  const GY = 340; // ground Y

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      {/* Unit toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
        {['Imperial', 'Metric'].map(u => {
          const isActive = u === 'Metric' ? metric : !metric;
          return (
            <button key={u} onClick={() => setMetric(u === 'Metric')}
              style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isActive ? 700 : 500,
                padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)',
                background: isActive ? 'var(--heading)' : 'var(--card-bg)', color: isActive ? 'var(--page-bg)' : 'var(--body)',
                cursor: 'pointer', minHeight: '44px'
              }} aria-pressed={isActive}>{u}</button>
          );
        })}
      </div>

      {/* SVG */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 920 440" role="img" aria-labelledby="reach-title reach-desc"
          style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="reach-title">ADA §308 Reach Ranges Diagram</title>
          <desc id="reach-desc">
            Four side-view scenarios showing a person in a wheelchair demonstrating forward and side reach envelopes.
            Left to right: unobstructed forward reach (15–48 inches), obstructed forward reach over a counter,
            unobstructed side reach (15–48 inches), and obstructed side reach over a shelf.
          </desc>

          <rect x="0" y="0" width="920" height="440" fill="var(--page-bg-subtle)" />

          {/* Ground line */}
          <rect x="10" y={GY} width="900" height="12" rx="2" fill="#E7E5E4" stroke="#D6D3D1" strokeWidth="0.8" />


          {/* ===== PANEL 1: UNOBSTRUCTED FORWARD REACH ===== */}
          <text x="115" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="#4B5563" letterSpacing="0.06em">
            UNOBSTRUCTED FORWARD
          </text>

          {/* Wall */}
          <rect x="158" y="100" width="6" height="240" fill="#94A3B8" rx="1" />

          {/* Reach envelope zone */}
          <rect x="150" y="116" width="18" height="186" rx="2" fill="#C2410C" opacity="0.08" stroke="#C2410C" strokeWidth="1" strokeDasharray="4 3" />

          {/* Person in wheelchair */}
          <WheelchairPerson x={60} y={248} scale={1} />

          {/* High reach line: 48" → y=116 (GY - 48*4.67 ≈ 224px up from ground) */}
          <line x1="40" y1="116" x2="170" y2="116" stroke="#C2410C" strokeWidth="1" strokeDasharray="3 2" />
          {/* Low reach line: 15" → y=302 */}
          <line x1="40" y1="302" x2="170" y2="302" stroke="#C2410C" strokeWidth="1" strokeDasharray="3 2" />

          {/* Dimension: 48" max */}
          <line x1="30" y1="116" x2="30" y2={GY} stroke="#C2410C" strokeWidth="1.2" />
          <line x1="22" y1="116" x2="38" y2="116" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="22" y1={GY} x2="38" y2={GY} stroke="#C2410C" strokeWidth="1.2" />
          <polygon points="30,121 26,131 34,131" fill="#C2410C" />
          <polygon points={`30,${GY - 5} 26,${GY - 15} 34,${GY - 15}`} fill="#C2410C" />
          <rect x="4" y="205" width="48" height="14" rx="3" fill="#C2410C" />
          <text x="28" y="215" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">
            {imp('48', '1220')}
          </text>

          {/* Dimension: 15" min */}
          <rect x="170" y="296" width="48" height="14" rx="3" fill="#C2410C" opacity="0.8" />
          <text x="194" y="306" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">
            {imp('15', '380')}
          </text>


          {/* ===== DIVIDER ===== */}
          <line x1="230" y1="40" x2="230" y2="360" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />


          {/* ===== PANEL 2: OBSTRUCTED FORWARD REACH ===== */}
          <text x="365" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="#4B5563" letterSpacing="0.06em">
            OBSTRUCTED FORWARD
          </text>

          {/* Wall */}
          <rect x="408" y="100" width="6" height="240" fill="#94A3B8" rx="1" />

          {/* Counter / obstruction */}
          <rect x="340" y="212" width="70" height="8" rx="1" fill="#15803D" opacity="0.2" stroke="#15803D" strokeWidth="1.2" />
          {/* Counter legs */}
          <line x1="345" y1="220" x2="345" y2={GY} stroke="#15803D" strokeWidth="1" opacity="0.4" />
          <line x1="405" y1="220" x2="405" y2={GY} stroke="#15803D" strokeWidth="1" opacity="0.4" />

          {/* Knee space under counter */}
          <rect x="348" y="240" width="54" height="96" rx="2" fill="#15803D" opacity="0.03" stroke="#15803D" strokeWidth="0.8" strokeDasharray="3 3" />

          {/* Person in wheelchair */}
          <WheelchairPerson x={272} y={248} scale={1} />

          {/* Reach envelope — two zones */}
          {/* ≤20" deep = 48" max (y=116) */}
          <line x1="250" y1="116" x2="420" y2="116" stroke="#15803D" strokeWidth="1" strokeDasharray="3 2" />
          {/* 20–25" deep = 44" max (y=135) */}
          <line x1="250" y1="135" x2="420" y2="135" stroke="#15803D" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />

          {/* Dimension: 48" (≤20" obstruction) */}
          <rect x="416" y="110" width="60" height="14" rx="3" fill="#15803D" />
          <text x="446" y="120" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">
            {imp('48', '1220')} (≤20")
          </text>

          {/* Dimension: 44" (20–25" obstruction) */}
          <rect x="416" y="129" width="64" height="14" rx="3" fill="#15803D" opacity="0.8" />
          <text x="448" y="139" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">
            {imp('44', '1120')} (20–25")
          </text>

          {/* Obstruction depth dimension */}
          <line x1="340" y1="228" x2="408" y2="228" stroke="#15803D" strokeWidth="1" />
          <line x1="340" y1="222" x2="340" y2="234" stroke="#15803D" strokeWidth="1" />
          <line x1="408" y1="222" x2="408" y2="234" stroke="#15803D" strokeWidth="1" />
          <rect x="348" y="230" width="50" height="12" rx="3" fill="#15803D" opacity="0.85" />
          <text x="373" y="239" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">
            ≤ {imp('25', '635')} deep
          </text>


          {/* ===== DIVIDER ===== */}
          <line x1="490" y1="40" x2="490" y2="360" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />


          {/* ===== PANEL 3: UNOBSTRUCTED SIDE REACH ===== */}
          <text x="595" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="#4B5563" letterSpacing="0.06em">
            UNOBSTRUCTED SIDE
          </text>

          {/* Wall (behind person) */}
          <rect x="640" y="100" width="6" height="240" fill="#94A3B8" rx="1" />

          {/* Reach envelope zone (on wall) */}
          <rect x="632" y="116" width="18" height="186" rx="2" fill="#2563EB" opacity="0.08" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" />

          {/* Person — side view facing right, reaching toward wall */}
          <WheelchairPerson x={540} y={248} scale={1} />

          {/* Reach lines */}
          <line x1="520" y1="116" x2="650" y2="116" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="520" y1="302" x2="650" y2="302" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 2" />

          {/* Dimension: 48" max */}
          <line x1="512" y1="116" x2="512" y2={GY} stroke="#2563EB" strokeWidth="1.2" />
          <line x1="504" y1="116" x2="520" y2="116" stroke="#2563EB" strokeWidth="1.2" />
          <line x1="504" y1={GY} x2="520" y2={GY} stroke="#2563EB" strokeWidth="1.2" />
          <polygon points="512,121 508,131 516,131" fill="#2563EB" />
          <polygon points={`512,${GY - 5} 508,${GY - 15} 516,${GY - 15}`} fill="#2563EB" />
          <rect x="486" y="205" width="48" height="14" rx="3" fill="#2563EB" />
          <text x="510" y="215" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">
            {imp('48', '1220')}
          </text>

          {/* Dimension: 15" min */}
          <rect x="652" y="296" width="48" height="14" rx="3" fill="#2563EB" opacity="0.8" />
          <text x="676" y="306" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">
            {imp('15', '380')}
          </text>


          {/* ===== DIVIDER ===== */}
          <line x1="715" y1="40" x2="715" y2="360" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />


          {/* ===== PANEL 4: OBSTRUCTED SIDE REACH ===== */}
          <text x="820" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="#4B5563" letterSpacing="0.06em">
            OBSTRUCTED SIDE
          </text>

          {/* Wall */}
          <rect x="865" y="100" width="6" height="240" fill="#94A3B8" rx="1" />

          {/* Shelf / obstruction */}
          <rect x="815" y="212" width="52" height="7" rx="1" fill="#7C3AED" opacity="0.2" stroke="#7C3AED" strokeWidth="1.2" />
          {/* Support */}
          <line x1="865" y1="219" x2="865" y2={GY} stroke="#7C3AED" strokeWidth="1" opacity="0.4" />

          {/* Person */}
          <WheelchairPerson x={740} y={248} scale={1} />

          {/* Reach lines */}
          {/* ≤10" deep = 48" max */}
          <line x1="730" y1="116" x2="875" y2="116" stroke="#7C3AED" strokeWidth="1" strokeDasharray="3 2" />
          {/* 10–24" deep = 46" max (y=126) */}
          <line x1="730" y1="126" x2="875" y2="126" stroke="#7C3AED" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />

          {/* Dimension labels */}
          <rect x="873" y="110" width="42" height="14" rx="3" fill="#7C3AED" />
          <text x="894" y="120" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">
            {imp('48', '1220')}
          </text>
          <rect x="873" y="130" width="42" height="14" rx="3" fill="#7C3AED" opacity="0.8" />
          <text x="894" y="140" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">
            {imp('46', '1170')}
          </text>

          {/* Obstruction depth */}
          <line x1="815" y1="226" x2="865" y2="226" stroke="#7C3AED" strokeWidth="1" />
          <line x1="815" y1="220" x2="815" y2="232" stroke="#7C3AED" strokeWidth="1" />
          <line x1="865" y1="220" x2="865" y2="232" stroke="#7C3AED" strokeWidth="1" />
          <rect x="817" y="233" width="46" height="12" rx="3" fill="#7C3AED" opacity="0.85" />
          <text x="840" y="242" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">
            ≤ {imp('24', '610')}
          </text>


          {/* ===== CLEAR FLOOR SPACE note (spans panels 1 & 2) ===== */}
          <rect x="55" y="355" width="130" height="28" rx="4" fill="#B45309" opacity="0.06" stroke="#B45309" strokeWidth="1" strokeDasharray="4 3" />
          <text x="120" y="370" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" fontWeight="600">
            CLEAR FLOOR: {imp('30', '760')} × {imp('48', '1220')}
          </text>
          <text x="120" y="380" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#78350F">(forward approach)</text>

          <rect x="535" y="355" width="130" height="28" rx="4" fill="#B45309" opacity="0.06" stroke="#B45309" strokeWidth="1" strokeDasharray="4 3" />
          <text x="600" y="370" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" fontWeight="600">
            CLEAR FLOOR: {imp('30', '760')} × {imp('48', '1220')}
          </text>
          <text x="600" y="380" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#78350F">(parallel approach)</text>


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
                className="reach-focus-ring" />
            </g>
          ))}

          <text x="30" y="425" fontFamily="Manrope, sans-serif" fontSize="10" fill="#4B5563">
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
          marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: '12px', overflow: 'hidden', animation: 'reachFadeIn 0.25s ease-out'
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)',
            flexWrap: 'wrap', gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '26px', height: '26px', borderRadius: '50%',
                background: activeCallout.color, color: 'var(--page-bg)',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700
              }}>{activeCallout.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>
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
                background: 'none', border: '1px solid var(--border)', borderRadius: '8px',
                padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px'
              }}>Close <span aria-hidden="true">✕</span></button>
          </div>

          <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                color: 'var(--body)', lineHeight: 1.75, margin: 0
              }}>{activeCallout.plain}</p>
            </div>
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}>
              <div style={{
                background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)',
                borderRadius: '0 10px 10px 0', padding: '16px 18px'
              }}>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--body-secondary)', margin: '0 0 8px'
                }}>Official Standard — {parseCitations(activeCallout.citation, activeCallout)}</p>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                  color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic'
                }}>{parseCitations(activeCallout.legal, activeCallout)}</p>
              </div>
            </aside>
          </div>
        </div>
      )}

      <style>{`
        @keyframes reachFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        g[role="button"]:focus .reach-focus-ring {
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