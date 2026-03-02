import React, { useState, useRef, useEffect, useCallback } from 'react';

const DOOR_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#404-doors-doorways-and-gates';

const CALLOUTS = [
  {
    id: 1, label: 'Clear Width', section: '§404.2.3', color: '#C2410C', textColor: '#8B2E08',
    x: 200, y: 80,
    plain: 'When the door is open to 90 degrees, the clear opening must be at least 32 inches wide. This is measured between the face of the door and the opposite door stop — not the full width of the door frame. A standard 36-inch door typically provides about 32 inches of clear width. Any projections into this clear width that are below 34 inches above the floor (like a closer arm) are limited to 4 inches maximum on each side.',
    legal: '"Door openings shall provide a clear width of 32 inches (815 mm) minimum. Clear openings of doorways with swinging doors shall be measured between the face of the door and the stop, with the door open 90 degrees." Projections: "into the clear opening width between 34 inches (865 mm) and 80 inches (2032 mm) above the finish floor or ground shall not exceed 4 inches (100 mm)."',
    citation: '§404.2.3'
  },
  {
    id: 2, label: 'Maneuvering Clearance', section: '§404.2.4', color: '#15803D', textColor: '#14532D',
    x: 125, y: 285,
    plain: 'Maneuvering clearance is the floor space in front of and behind a door that a wheelchair user needs to approach, open, and pass through. The required size depends on the approach direction (front, hinge-side, or latch-side) and whether you are pushing or pulling. For a front approach on the pull side, you need 60 inches of depth and 18 inches beyond the latch side. The push side requires less — typically 48 inches deep. The floor in this area must be level and clear of obstructions.',
    legal: '"Minimum maneuvering clearances at doors and gates shall comply with 404.2.4. Maneuvering clearances shall extend the full width of the doorway and the required latch side or hinge side clearance." "Floor or ground surface within the required maneuvering clearances shall be level and clear."',
    citation: '§404.2.4, §404.2.4.1'
  },
  {
    id: 3, label: 'Hardware', section: '§404.2.7', color: '#2563EB', textColor: '#1E3A8A',
    x: 620, y: 160,
    plain: 'Door hardware must be mounted between 34 and 48 inches above the floor. It must be operable with one hand and cannot require tight grasping, pinching, or twisting of the wrist. Lever handles, push-type mechanisms, and U-shaped pulls all comply. Traditional round door knobs do NOT comply because they require grasping and twisting. This also applies to locks — thumb-turn locks are acceptable, but keyed locks that require twisting are not the only means of operation.',
    legal: '"Handles, pulls, latches, locks, and other operable parts on doors and gates shall comply with 309.4. Operable parts shall be 34 inches (865 mm) minimum and 48 inches (1220 mm) maximum above the finish floor or ground." Must not require "tight grasping, pinching, or twisting of the wrist."',
    citation: '§404.2.7, §309.4'
  },
  {
    id: 4, label: 'Closing Speed', section: '§404.2.8', color: '#7C3AED', textColor: '#5B21B6',
    x: 620, y: 80,
    plain: 'If a door has a closer, it must take at least 5 seconds to move from fully open (90 degrees) to 12 degrees from the latch. This gives a wheelchair user enough time to pass through before the door pushes back. For spring hinges (which do not have a hydraulic closer), the minimum is 1.5 seconds from 70 degrees to the closed position. Fire doors with integrated closers must still meet the 5-second requirement.',
    legal: '"Door closers and gate closers shall be adjusted so that from an open position of 90 degrees, the time required to move the door to a position of 12 degrees from the latch is 5 seconds minimum." Spring hinges: "shall be adjusted so that from the open position of 70 degrees, the door or gate shall move to the closed position in 1.5 seconds minimum."',
    citation: '§404.2.8, §404.2.8.1'
  },
  {
    id: 5, label: 'Threshold', section: '§404.2.5', color: '#92400E', textColor: '#78350F',
    x: 620, y: 370,
    plain: 'Thresholds at doors cannot exceed ½ inch (13mm) in height for new construction. For existing or altered buildings, up to ¾ inch (19mm) is permitted. Any threshold over ¼ inch must be beveled with a slope no steeper than 1:2 (a 45-degree angle). This prevents wheelchair casters and walker legs from catching. The threshold must also comply with the changes-in-level provisions of §302.',
    legal: '"Thresholds, if provided at doorways, shall be 1/2 inch (13 mm) high maximum. Existing or altered thresholds 3/4 inch (19 mm) high maximum shall be permitted provided that they have a beveled edge on each side with a slope not steeper than 1:2."',
    citation: '§404.2.5'
  },
  {
    id: 6, label: 'Door Surface', section: '§404.2.10', color: '#BE185D', textColor: '#9D174D',
    x: 620, y: 445,
    plain: 'The bottom 10 inches of the push side of a swinging door must have a smooth, uninterrupted surface. This zone is where wheelchair footrests make contact when a person uses their chair to push the door open. No hardware, applied panels, or decorative features can project into this area because they could catch on footrests or leg supports. This applies the full width of the door. Tempered glass doors without stiles are exempt if they meet other bottom-rail requirements.',
    legal: '"Swinging door and gate surfaces within 10 inches (255 mm) of the finish floor or ground measured vertically shall have a smooth surface on the push side extending the full width of the door or gate." Exceptions: "Tempered glass doors without stiles" and "doors and gates that do not extend to within 10 inches of the finish floor."',
    citation: '§404.2.10'
  },
  {
    id: 7, label: 'Two Doors in Series', section: '§404.2.6', color: '#0E7490', textColor: '#0C4A6E',
    x: 350, y: 475,
    plain: 'When two doors are in a series (a vestibule or airlock), the space between them must be at least 48 inches plus the width of any door swinging into that space. This allows a wheelchair user to fully clear the first door before needing to open the second. Both doors must be able to swing open simultaneously without hitting each other. The floor between the doors must be level.',
    legal: '"The distance between two hinged or pivoted doors in series shall be 48 inches (1220 mm) minimum plus the width of doors or gates swinging into the space."',
    citation: '§404.2.6'
  }
];

function makeLink(text, url) {
  return (
    <a href={url || DOOR_URL} target="_blank" rel="noopener noreferrer"
      style={{ color: '#C2410C', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}
      aria-label={`${text} on ADA.gov (opens in new tab)`}>
      {text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>↗</span>
    </a>
  );
}

function parseCitations(text) {
  const parts = text.split(/(§\d{3,4}(?:\.\d+)*)/g);
  return parts.map((part, i) => {
    if (/^§\d{3,4}/.test(part)) {
      return <React.Fragment key={i}>{makeLink(part, DOOR_URL)}</React.Fragment>;
    }
    return part;
  });
}

export default function DoorDiagram() {
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
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="door-title door-desc"
          style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="door-title">ADA §404 Doors, Doorways &amp; Gates Diagram</title>
          <desc id="door-desc">
            Split-view diagram. Left: top-down plan view showing pull-side maneuvering clearances for a hinged door,
            including 32-inch clear width, 60-inch depth, and 18-inch latch-side clearance. Right: front elevation
            of a door showing hardware height at 34–48 inches, threshold, 10-inch smooth push-side surface zone,
            and closing speed annotation.
          </desc>

          <rect x="0" y="0" width="900" height="520" fill="var(--page-bg-subtle)" />

          {/* ===== LEFT: PLAN VIEW ===== */}
          <text x="220" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">
            PLAN VIEW — PULL SIDE APPROACH
          </text>


          {/* Wall (horizontal) */}
          <rect x="40" y="110" width="155" height="8" fill="#475569" rx="1" />
          <rect x="275" y="110" width="165" height="8" fill="#475569" rx="1" />

          {/* Door opening gap */}
          <line x1="195" y1="114" x2="275" y2="114" stroke="#C2410C" strokeWidth="1" strokeDasharray="3 2" opacity="0.4" />

          {/* Door leaf at 90° */}
          <rect x="270" y="30" width="6" height="82" rx="1" fill="#78716C" stroke="#57534E" strokeWidth="1" />
          {/* Door swing arc */}
          <path d={`M 273 114 A 82 82 0 0 0 273 30`}
            fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 3" />
          {/* Hinge point */}
          <circle cx="273" cy="114" r="4" fill="#57534E" />

          {/* Latch side label */}
          <text x="199" y="105" fontFamily="Manrope, sans-serif" fontSize="7.5" fill="#374151" textAnchor="middle">LATCH SIDE</text>
          <line x1="199" y1="108" x2="199" y2="118" stroke="#64748B" strokeWidth="0.8" />

          {/* Hinge side label */}
          <text x="290" y="105" fontFamily="Manrope, sans-serif" fontSize="7.5" fill="#374151">HINGE</text>

          {/* Clear width dimension (between door face at 90° and opposite stop) */}
          <line x1="195" y1="50" x2="270" y2="50" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="195" y1="42" x2="195" y2="58" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="270" y1="42" x2="270" y2="58" stroke="#C2410C" strokeWidth="1.2" />
          <polygon points="200,50 210,46 210,54" fill="#C2410C" />
          <polygon points="265,50 255,46 255,54" fill="#C2410C" />
          <rect x="204" y="35" width="62" height="14" rx="3" fill="#C2410C" />
          <text x="235" y="45" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="white">
            {imp('32', '815')} min
          </text>

          {/* ===== MANEUVERING CLEARANCE ZONE (pull side) ===== */}
          <rect x="100" y="118" width="250" height="260" rx="4"
            fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="1.5" strokeDasharray="6 4" />
          <text x="225" y="138" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#14532D" fontWeight="600">MANEUVERING CLEARANCE (PULL SIDE)</text>

          {/* Depth dimension: 60" */}
          <line x1="62" y1="118" x2="62" y2="378" stroke="#15803D" strokeWidth="1.2" />
          <line x1="54" y1="118" x2="70" y2="118" stroke="#15803D" strokeWidth="1.2" />
          <line x1="54" y1="378" x2="70" y2="378" stroke="#15803D" strokeWidth="1.2" />
          <polygon points="62,123 58,133 66,133" fill="#15803D" />
          <polygon points="62,373 58,363 66,363" fill="#15803D" />
          <rect x="28" y="240" width="62" height="14" rx="3" fill="#15803D" />
          <text x="59" y="250" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="white">
            {imp('60', '1525')}
          </text>

          {/* Latch-side clearance: 18" beyond latch */}
          <line x1="100" y1="395" x2="195" y2="395" stroke="#15803D" strokeWidth="1.2" />
          <line x1="100" y1="387" x2="100" y2="403" stroke="#15803D" strokeWidth="1.2" />
          <line x1="195" y1="387" x2="195" y2="403" stroke="#15803D" strokeWidth="1.2" />
          <polygon points="105,395 115,391 115,399" fill="#15803D" />
          <polygon points="190,395 180,391 180,399" fill="#15803D" />
          <rect x="117" y="400" width="60" height="14" rx="3" fill="#15803D" />
          <text x="147" y="410" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">
            {imp('18', '455')} min
          </text>

          {/* Wheelchair approach indicator */}
          <circle cx="225" cy="330" r="28" fill="none" stroke="#15803D" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
          <text x="225" y="328" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="14" fill="#14532D" opacity="0.5">♿</text>
          <text x="225" y="345" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#14532D" opacity="0.5">approach</text>
          {/* Approach arrow */}
          <line x1="225" y1="290" x2="225" y2="160" stroke="#15803D" strokeWidth="1.5" opacity="0.4" />
          <polygon points="225,160 220,172 230,172" fill="#15803D" opacity="0.5" />


          {/* ===== DIVIDER ===== */}
          <line x1="470" y1="20" x2="470" y2="500" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />


          {/* ===== RIGHT: ELEVATION DETAIL ===== */}
          <text x="680" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">
            ELEVATION — FRONT VIEW
          </text>

          {/* Floor line */}
          <rect x="510" y="455" width="340" height="14" rx="2" fill="#E7E5E4" stroke="#D6D3D1" strokeWidth="1" />
          <text x="680" y="466" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B4540">FLOOR</text>

          {/* Door frame */}
          <rect x="590" y="55" width="180" height="400" rx="2" fill="none" stroke="#475569" strokeWidth="3" />

          {/* Door panel */}
          <rect x="594" y="59" width="172" height="392" rx="1" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1" />

          {/* Door panel details */}
          {/* Upper panel inset */}
          <rect x="610" y="75" width="140" height="130" rx="3" fill="none" stroke="#CBD5E1" strokeWidth="1" />
          {/* Vision lite (window) */}
          <rect x="630" y="95" width="100" height="80" rx="2" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1" opacity="0.6" />
          <text x="680" y="140" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#93C5FD">VISION LITE</text>

          {/* Lower panel inset */}
          <rect x="610" y="225" width="140" height="150" rx="3" fill="none" stroke="#CBD5E1" strokeWidth="1" />

          {/* Door handle (lever) */}
          <line x1="614" y1="268" x2="614" y2="290" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />
          <line x1="614" y1="268" x2="600" y2="262" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" />

          {/* Kick plate (bottom 10") */}
          <rect x="594" y="405" width="172" height="46" rx="0" fill="#DB2777" opacity="0.06" stroke="#DB2777" strokeWidth="1" strokeDasharray="4 3" />
          <text x="680" y="432" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fill="#9D174D" fontWeight="600">SMOOTH SURFACE ZONE</text>
          <text x="680" y="444" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#9D174D">(push side — bottom {imp('10', '255')})</text>

          {/* Threshold */}
          <rect x="590" y="451" width="180" height="4" rx="1" fill="#B45309" stroke="#B45309" strokeWidth="0.5" />

          {/* ===== RIGHT DIMENSION LINES ===== */}

          {/* Hardware height: 34–48" */}
          <line x1="550" y1="245" x2="550" y2="330" stroke="#2563EB" strokeWidth="1.5" />
          <line x1="543" y1="245" x2="557" y2="245" stroke="#2563EB" strokeWidth="1.5" />
          <line x1="543" y1="330" x2="557" y2="330" stroke="#2563EB" strokeWidth="1.5" />
          {/* Dashed lines to door */}
          <line x1="557" y1="245" x2="595" y2="245" stroke="#2563EB" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.4" />
          <line x1="557" y1="330" x2="595" y2="330" stroke="#2563EB" strokeWidth="0.8" strokeDasharray="3 2" opacity="0.4" />
          {/* Connect to floor */}
          <line x1="550" y1="330" x2="550" y2="455" stroke="#2563EB" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.3" />
          <polygon points="550,250 546,260 554,260" fill="#2563EB" />
          <polygon points="550,325 546,315 554,315" fill="#2563EB" />
          <rect x="505" y="278" width="80" height="16" rx="3" fill="#2563EB" />
          <text x="545" y="289" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="white">
            {imp('34–48', '865–1220')}
          </text>

          {/* Threshold dimension */}
          <line x1="790" y1="451" x2="790" y2="455" stroke="#B45309" strokeWidth="1.5" />
          <line x1="783" y1="451" x2="797" y2="451" stroke="#B45309" strokeWidth="1.5" />
          <line x1="783" y1="455" x2="797" y2="455" stroke="#B45309" strokeWidth="1.5" />
          <rect x="800" y="445" width="82" height="16" rx="3" fill="#B45309" />
          <text x="841" y="456" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">
            {imp('½', '13')} max new
          </text>

          {/* Smooth zone height */}
          <line x1="785" y1="405" x2="785" y2="451" stroke="#DB2777" strokeWidth="1.2" />
          <line x1="778" y1="405" x2="792" y2="405" stroke="#DB2777" strokeWidth="1.2" />
          <line x1="778" y1="451" x2="792" y2="451" stroke="#DB2777" strokeWidth="1.2" />
          <rect x="795" y="419" width="70" height="14" rx="3" fill="#DB2777" />
          <text x="830" y="429" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">
            {imp('10', '255')} zone
          </text>

          {/* Closing speed annotation */}
          <path d="M 758 70 A 40 40 0 0 1 730 100" fill="none" stroke="#7C3AED" strokeWidth="1.5" />
          <polygon points="730,100 727,90 737,93" fill="#7C3AED" />
          <text x="770" y="66" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#5B21B6">90°</text>
          <text x="718" y="112" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#5B21B6">12°</text>
          <rect x="780" y="78" width="82" height="14" rx="3" fill="#7C3AED" />
          <text x="821" y="88" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fontWeight="700" fill="white">
            5 sec minimum
          </text>

          {/* Two doors in series note (bottom center) */}
          <rect x="180" y="450" width="240" height="40" rx="6" fill="#0EA5E9" opacity="0.05" stroke="#0891B2" strokeWidth="1" strokeDasharray="5 3" />
          <text x="300" y="468" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#0C4A6E" fontWeight="600">TWO DOORS IN SERIES (VESTIBULE)</text>
          <text x="300" y="480" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#0C4A6E">
            {imp('48', '1220')} min + door width between doors
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
                className="door-focus-ring" />
            </g>
          ))}

          <text x="50" y="508" fontFamily="Manrope, sans-serif" fontSize="10" fill="#4B5563">
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
          borderRadius: '12px', overflow: 'hidden', animation: 'doorFadeIn 0.25s ease-out'
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
                }}>Official Standard — {parseCitations(activeCallout.citation)}</p>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                  color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic'
                }}>{parseCitations(activeCallout.legal)}</p>
              </div>
            </aside>
          </div>
        </div>
      )}

      <style>{`
        @keyframes doorFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        g[role="button"]:focus .door-focus-ring {
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