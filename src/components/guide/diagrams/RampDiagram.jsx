import React, { useState, useRef, useEffect, useCallback } from 'react';

const RAMP_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#405-ramps';

const CALLOUTS = [
  {
    id: 1, label: 'Running Slope', section: '§405.2', color: 'var(--section-label)', textColor: '#8B2E08',
    x: 390, y: 260,
    plain: 'The maximum slope for an ADA ramp is 1:12. That means for every 1 inch of height, the ramp must go at least 12 inches forward. A ramp covering a 30-inch rise must be at least 30 feet long. In existing buildings where space is tight, steeper slopes are allowed for very short rises — up to 1:10 for 6 inches of rise, or 1:8 for just 3 inches.',
    legal: '"Ramp runs shall have a running slope not steeper than 1:12." In existing sites, slopes up to 1:10 (max 6-inch rise) or 1:8 (max 3-inch rise) are permitted where necessary due to space limitations.',
    citation: '§405.2'
  },
  {
    id: 2, label: 'Maximum Rise', section: '§405.6', color: '#15803D', textColor: '#14532D',
    x: 700, y: 175,
    plain: 'A single ramp section — the sloped part between flat landings — can rise no more than 30 inches (about 2.5 feet). If you need to go higher, you add a flat landing and start another section. For example, reaching a level 5 feet up requires at least two ramp sections with a landing in between.',
    legal: '"The rise for any ramp run shall be 30 inches (760 mm) maximum."',
    citation: '§405.6'
  },
  {
    id: 3, label: 'Clear Width', section: '§405.5', color: '#2563EB', textColor: '#1E3A8A',
    x: 450, y: 210,
    plain: 'The walking surface of the ramp must be at least 36 inches wide, measured between the handrails. This provides enough room for a wheelchair to travel comfortably. Local fire codes may require wider ramps in some buildings.',
    legal: '"The clear width of a ramp run and, where handrails are provided, the clear width between handrails shall be 36 inches (915 mm) minimum."',
    citation: '§405.5'
  },
  {
    id: 4, label: 'Landings', section: '§405.7', color: '#7C3AED', textColor: '#5B21B6',
    x: 155, y: 340,
    plain: 'Every ramp needs a flat landing at both the top and bottom. Landings must be at least 60 inches (5 feet) long in the direction you walk, and at least as wide as the ramp. If the ramp turns at a landing, that landing must be at least 60 × 60 inches so a wheelchair can turn safely. Landings must be nearly level — no more than a 1:48 slope for drainage.',
    legal: '"Ramp runs shall have landings at the top and the bottom of each ramp run. Landings shall have a clear length of 60 inches (1525 mm) long minimum." Where ramps change direction, landings shall be "60 inches (1525 mm) minimum by 60 inches (1525 mm) minimum."',
    citation: '§405.7'
  },
  {
    id: 5, label: 'Handrails', section: '§405.8 + §505', color: '#92400E', textColor: '#78350F',
    x: 580, y: 120,
    plain: 'Handrails are required on both sides of any ramp that rises more than 6 inches. They must be between 34 and 38 inches high, measured from the ramp surface to the top of the grip. Each handrail must extend 12 inches horizontally past the top and bottom of the ramp, giving people something to hold before stepping on or off the slope. The grip must be smooth, rounded, and continuous — no breaks or sharp edges.',
    legal: '"Ramp runs with a rise greater than 6 inches (150 mm) shall have handrails complying with 505." Handrails: "34 inches (865 mm) minimum and 38 inches (965 mm) maximum" high. Extensions: "12 inches (305 mm) minimum beyond the top" and bottom of ramp runs.',
    citation: '§405.8, §505.4, §505.10'
  },
  {
    id: 6, label: 'Edge Protection', section: '§405.9', color: '#BE185D', textColor: '#9D174D',
    x: 320, y: 340,
    plain: 'Both sides of the ramp must have something to stop a wheelchair, walker, or cane from slipping off the edge. This can be a raised curb, a wall, a railing, or the ramp surface itself extending at least 12 inches past the handrail. The barrier must be solid enough that a 4-inch ball cannot pass through it.',
    legal: '"Edge protection complying with 405.9.1 or 405.9.2 shall be provided on each side of ramp runs and at each side of ramp landings." Options: floor extending 12 inches minimum beyond handrail, or "a curb or barrier that prevents the passage of a 4-inch diameter sphere."',
    citation: '§405.9'
  },
  {
    id: 7, label: 'Cross Slope', section: '§405.3', color: '#0E7490', textColor: '#0C4A6E',
    x: 500, y: 370,
    plain: 'The sideways tilt of the ramp — called the cross slope — must be no more than 1:48 (about 2%). Too much sideways tilt causes a wheelchair to drift to one side, making the ramp dangerous. The ramp surface must also be firm, stable, and slip-resistant. Loose gravel, deep carpet, and wood chips do not meet this standard.',
    legal: '"Cross slope of ramp runs shall not be steeper than 1:48." Surface: "Floor or ground surfaces of ramp runs shall comply with 302," requiring firm, stable, and slip-resistant surfaces.',
    citation: '§405.3, §302'
  }
];

function sectionLink(citation) {
  return (
    <a href={RAMP_URL} target="_blank" rel="noopener noreferrer"
      style={{ color: 'var(--section-label)', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }}
      aria-label={`${citation} on ADA.gov (opens in new tab)`}>
      {citation}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>↗</span>
    </a>
  );
}

function parseCitations(text) {
  const parts = text.split(/(§\d{3,4}(?:\.\d+)*)/g);
  return parts.map((part, i) => {
    if (/^§\d{3,4}/.test(part)) {
      return <React.Fragment key={i}>{sectionLink(part)}</React.Fragment>;
    }
    return part;
  });
}

export default function RampDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const calloutRefs = useRef({});

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
  const impFt = (ft, mm) => metric ? `${mm} mm` : `${ft} ft`;

  const activeCallout = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      {/* Unit toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px', gap: '8px', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
        <button
          onClick={() => setMetric(false)}
          style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: !metric ? 700 : 500,
            padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)',
            background: !metric ? 'var(--heading)' : 'var(--card-bg)', color: !metric ? 'var(--page-bg)' : 'var(--body)',
            cursor: 'pointer', minHeight: '44px'
          }}
          aria-pressed={!metric}
        >Imperial</button>
        <button
          onClick={() => setMetric(true)}
          style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: metric ? 700 : 500,
            padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)',
            background: metric ? 'var(--heading)' : 'var(--card-bg)', color: metric ? 'var(--page-bg)' : 'var(--body)',
            cursor: 'pointer', minHeight: '44px'
          }}
          aria-pressed={metric}
        >Metric</button>
      </div>

      {/* SVG Diagram */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="ramp-title ramp-desc"
          style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="ramp-title">ADA §405 Ramp Requirements Diagram</title>
          <desc id="ramp-desc">
            Side-view cross-section of an ADA-compliant ramp showing a bottom landing, a sloped ramp surface rising left to right,
            a top landing, handrails on both sides with 12-inch horizontal extensions, edge protection along the base,
            and dimension lines indicating a maximum 1:12 running slope, 30-inch maximum rise, 60-inch minimum landings,
            34-to-38-inch handrail height, maximum 1:48 cross slope, and 36-inch minimum clear width between handrails.
          </desc>

          {/* Background */}
          <rect x="0" y="0" width="900" height="520" fill="var(--page-bg-subtle)" />

          {/* Ground line */}
          <line x1="30" y1="390" x2="870" y2="390" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />

          {/* Bottom landing */}
          <rect x="80" y="330" width="160" height="60" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="160" y="365" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#374151">Bottom Landing</text>

          {/* Ramp surface */}
          <polygon points="240,330 720,180 720,240 240,390" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Ramp top surface line (emphasized) */}
          <line x1="240" y1="330" x2="720" y2="180" stroke="#64748B" strokeWidth="2" />

          {/* Top landing */}
          <rect x="720" y="180" width="140" height="60" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="790" y="215" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#374151">Top Landing</text>

          {/* Edge protection (curb along bottom of ramp) */}
          <line x1="240" y1="390" x2="720" y2="240" stroke="#DB2777" strokeWidth="3" opacity="0.5" />
          <line x1="240" y1="390" x2="720" y2="240" stroke="#DB2777" strokeWidth="1" strokeDasharray="6 3" />

          {/* Handrail - near side (full line with extensions) */}
          <line x1="210" y1="300" x2="240" y2="300" stroke="#B45309" strokeWidth="2.5" strokeDasharray="4 3" />
          <line x1="240" y1="300" x2="720" y2="150" stroke="#B45309" strokeWidth="2.5" />
          <line x1="720" y1="150" x2="750" y2="150" stroke="#B45309" strokeWidth="2.5" strokeDasharray="4 3" />

          {/* Handrail extension labels */}
          <text x="225" y="292" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#78350F">{imp('12', '305')}</text>
          <text x="735" y="142" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#78350F">{imp('12', '305')}</text>

          {/* Wheelchair silhouette on ramp */}
          <g transform="translate(420, 240) scale(0.35)" opacity="0.25">
            <circle cx="20" cy="-30" r="12" fill="#64748B" />
            <circle cx="0" cy="20" r="18" fill="none" stroke="#64748B" strokeWidth="4" />
            <circle cx="40" cy="20" r="12" fill="none" stroke="#64748B" strokeWidth="4" />
            <line x1="0" y1="0" x2="20" y2="-15" stroke="#64748B" strokeWidth="4" />
            <line x1="20" y1="-15" x2="35" y2="0" stroke="#64748B" strokeWidth="4" />
          </g>

          {/* Slope indicator triangle */}
          <polygon points="260,370 360,370 360,354" fill="none" stroke="#C2410C" strokeWidth="1.5" />
          <rect x="290" y="356" width="46" height="18" rx="4" fill="#C2410C" />
          <text x="313" y="369" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="white">1:12</text>

          {/* --- DIMENSION LINES --- */}

          {/* Rise: vertical on right */}
          <line x1="755" y1="180" x2="755" y2="330" stroke="#15803D" strokeWidth="1.5" />
          <line x1="748" y1="180" x2="762" y2="180" stroke="#15803D" strokeWidth="1.5" />
          <line x1="748" y1="330" x2="762" y2="330" stroke="#15803D" strokeWidth="1.5" />
          <polygon points="755,185 751,195 759,195" fill="#15803D" />
          <polygon points="755,325 751,315 759,315" fill="#15803D" />
          <rect x="762" y="243" width="80" height="16" rx="3" fill="#15803D" />
          <text x="802" y="254" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="white">
            {imp('30', '760')} max
          </text>

          {/* Bottom landing dimension */}
          <line x1="80" y1="408" x2="240" y2="408" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="80" y1="400" x2="80" y2="416" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="240" y1="400" x2="240" y2="416" stroke="#7C3AED" strokeWidth="1.5" />
          <polygon points="85,408 95,404 95,412" fill="#7C3AED" />
          <polygon points="235,408 225,404 225,412" fill="#7C3AED" />
          <rect x="117" y="418" width="86" height="16" rx="3" fill="#7C3AED" />
          <text x="160" y="429" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="white">
            {impFt('5', '1525')} min
          </text>

          {/* Top landing dimension */}
          <line x1="720" y1="168" x2="860" y2="168" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="720" y1="160" x2="720" y2="176" stroke="#7C3AED" strokeWidth="1.5" />
          <line x1="860" y1="160" x2="860" y2="176" stroke="#7C3AED" strokeWidth="1.5" />
          <polygon points="725,168 735,164 735,172" fill="#7C3AED" />
          <polygon points="855,168 845,164 845,172" fill="#7C3AED" />
          <rect x="747" y="152" width="86" height="16" rx="3" fill="#7C3AED" />
          <text x="790" y="163" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="white">
            {impFt('5', '1525')} min
          </text>

          {/* Handrail height dimension */}
          <line x1="260" y1="300" x2="260" y2="325" stroke="#B45309" strokeWidth="1.2" strokeDasharray="3 2" />
          <line x1="253" y1="300" x2="267" y2="300" stroke="#B45309" strokeWidth="1.2" />
          <line x1="253" y1="325" x2="267" y2="325" stroke="#B45309" strokeWidth="1.2" />
          <rect x="228" y="307" width="64" height="14" rx="3" fill="#B45309" />
          <text x="260" y="317" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="white">
            {imp('34–38', '865–965')}
          </text>

          {/* Cross slope indicator */}
          <line x1="400" y1="395" x2="520" y2="395" stroke="#0891B2" strokeWidth="1.5" />
          <polygon points="400,395 410,391 410,399" fill="#0EA5E9" />
          <polygon points="520,395 510,391 510,399" fill="#0EA5E9" />
          <rect x="417" y="399" width="86" height="14" rx="3" fill="#0EA5E9" />
          <text x="460" y="409" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="white">
            1:48 max cross slope
          </text>

          {/* Clear width indicator */}
          <g transform="translate(480, 195)">
            <line x1="0" y1="0" x2="0" y2="30" stroke="#2563EB" strokeWidth="1.2" />
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#2563EB" strokeWidth="1.2" />
            <line x1="-5" y1="30" x2="5" y2="30" stroke="#2563EB" strokeWidth="1.2" />
            <rect x="-32" y="8" width="64" height="14" rx="3" fill="#2563EB" />
            <text x="0" y="18" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="white">
              {imp('36', '915')} min
            </text>
          </g>

          {/* --- CALLOUT DOTS --- */}
          {CALLOUTS.map(c => (
            <g key={c.id}
              tabIndex="0"
              role="button"
              aria-label={`Callout ${c.id}: ${c.label} — ${c.section}. Press Enter for details.`}
              aria-expanded={active === c.id}
              onClick={() => toggle(c.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); }}}
              style={{ cursor: 'pointer', outline: 'none' }}
              ref={el => calloutRefs.current[c.id] = el}
            >
              {/* Pulse ring when active */}
              {active === c.id && (
                <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3">
                  <animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'}
                stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif"
                fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>
                {c.id}
              </text>
              {/* Focus ring */}
              <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2"
                className="callout-focus-ring" />
            </g>
          ))}

          {/* Legend */}
          <text x="50" y="480" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">
            Click or tap numbered callouts for details
          </text>
        </svg>
      </div>

      {/* Live region for screen readers */}
      <div aria-live="polite" className="sr-only">
        {activeCallout ? `Now showing details for callout ${activeCallout.id}: ${activeCallout.label}, ${activeCallout.section}` : ''}
      </div>

      {/* Info panel */}
      {activeCallout && (
        <div ref={panelRef} style={{
          marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: '12px', overflow: 'hidden',
          animation: 'fadeSlideIn 0.25s ease-out'
        }}>
          {/* Panel header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderBottom: '1px solid var(--border)',
            background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '26px', height: '26px', borderRadius: '50%',
                background: activeCallout.color, color: 'var(--page-bg)',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700
              }}>{activeCallout.id}</span>
              <span style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700,
                color: 'var(--heading)'
              }}>{activeCallout.label}</span>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600,
                color: activeCallout.color, background: `${activeCallout.color}15`,
                padding: '2px 8px', borderRadius: '4px'
              }}>{activeCallout.section}</span>
            </div>
            <button onClick={() => setActive(null)}
              aria-label="Close panel"
              style={{
                background: 'none', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '8px 16px', cursor: 'pointer',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                fontWeight: 600, color: 'var(--body)', minHeight: '44px'
              }}>
              Close <span aria-hidden="true">✕</span>
            </button>
          </div>

          {/* Two-column content */}
          <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
            {/* Plain language */}
            <div style={{ flex: '1 1 55%', minWidth: 0 }}>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
                color: 'var(--body)', lineHeight: 1.75, margin: 0
              }}>{activeCallout.plain}</p>
            </div>
            {/* Legal text */}
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
                  color: 'var(--body)', lineHeight: 1.7, margin: 0,
                  fontStyle: 'italic'
                }}>{parseCitations(activeCallout.legal)}</p>
              </div>
            </aside>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        g[role="button"]:focus .callout-focus-ring {
          stroke: var(--accent);
          stroke-width: 2.5;
        }
        g[role="button"]:hover circle:first-of-type,
        g[role="button"]:hover circle:nth-of-type(2) {
          filter: brightness(0.95);
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