import React, { useState, useRef, useEffect, useCallback } from 'react';

const TURN_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#304-turning-space';

const CALLOUTS = [
  {
    id: 1, label: 'Circular Space', section: '§304.3.1', color: 'var(--section-label)', textColor: '#8B2E08',
    x: 160, y: 50,
    plain: 'The most common turning space option is a clear circular area with a 60-inch (5-foot) diameter. This allows a wheelchair user to make a full 360-degree turn. The entire circle must be free of obstructions at floor level — no columns, trash cans, or furniture legs within the circle. This is equivalent to the turning radius of a standard manual or power wheelchair.',
    legal: '"The turning space shall be a space complying with 304.3.1 or 304.3.2. The floor or ground surface of a circular turning space shall be a circular space with a 60 inch (1525 mm) diameter minimum. The floor or ground surface shall comply with 302."',
    citation: '§304.3.1'
  },
  {
    id: 2, label: 'T-Shaped Space', section: '§304.3.2', color: '#15803D', textColor: '#14532D',
    x: 560, y: 50,
    plain: 'The T-shaped turning space is an alternative to the circular option, useful in tighter layouts like corridors or alcoves. It fits within a 60-inch square and consists of a T-shape where each arm of the T is at least 36 inches wide. The person in a wheelchair executes a three-point turn — rolling forward into one arm, backing into the stem, then rolling forward in the new direction. Each arm must be clear of obstructions.',
    legal: '"The floor or ground surface of a T-shaped turning space shall be a T-shaped space within a 60 inch (1525 mm) square minimum with arms and base 36 inches (915 mm) wide minimum." Each segment of the T shall be provided with clearance 36 inches minimum.',
    citation: '§304.3.2'
  },
  {
    id: 3, label: 'Floor Surface', section: '§304.2', color: '#2563EB', textColor: '#1E3A8A',
    x: 340, y: 285,
    plain: 'The floor within a turning space must be level, with a maximum slope of 1:48 (about 2%) in any direction. The surface must be firm, stable, and slip-resistant per §302. Carpet, if used, must be securely attached with a firm cushion or no cushion, and the pile height cannot exceed ½ inch. Gratings must have openings no wider than ½ inch in one direction.',
    legal: '"Floor or ground surfaces of a turning space shall comply with 302. Changes in level are not permitted." Slope: "shall not be steeper than 1:48."',
    citation: '§304.2'
  },
  {
    id: 4, label: 'Obstructions', section: '§304', color: '#7C3AED', textColor: '#5B21B6',
    x: 780, y: 285,
    plain: 'Doors are permitted to swing into a turning space as long as the required space is still usable when the door is in any position during normal use. Knee and toe clearance areas (§306) — such as space under a lavatory or counter — can overlap with the turning space. However, no other fixed obstructions such as columns, furniture, or equipment may encroach into the turning space.',
    legal: '"EXCEPTION: Doors complying with 404.2.3, in any position, shall be permitted to encroach into turning spaces." Knee and toe clearance per §306 can extend into turning space.',
    citation: '§304'
  }
];

function makeLink(text) {
  return (
    <a href={TURN_URL} target="_blank" rel="noopener noreferrer"
      style={{ color: 'var(--section-label)', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }}
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

export default function TurningSpaceDiagram() {
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

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>
          §304 Turning Space
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
        <svg viewBox="0 0 900 320" role="img" aria-labelledby="turn-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="turn-title">ADA §304 Turning Space — Circular and T-Shaped Options</title>
          <rect x="0" y="0" width="900" height="320" fill="var(--page-bg-subtle)" />

          {/* LEFT: CIRCULAR */}
          <text x="200" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="var(--body-secondary)" letterSpacing="0.08em">CIRCULAR TURNING SPACE</text>

          <circle cx="200" cy="170" r="110" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" strokeDasharray="6 4" />
          {/* Wheelchair silhouette */}
          <circle cx="200" cy="155" r="10" fill="#8B2E08" opacity="0.06" />
          <rect x="192" y="142" width="16" height="10" rx="2" fill="none" stroke="#8B2E08" strokeWidth="1" opacity="0.3" />
          <circle cx="191" cy="165" r="6" fill="none" stroke="#8B2E08" strokeWidth="0.8" opacity="0.25" />
          <circle cx="209" cy="165" r="6" fill="none" stroke="#8B2E08" strokeWidth="0.8" opacity="0.25" />
          <text x="200" y="140" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#8B2E08" opacity="0.5">360° turn</text>
          {/* Rotation arrow */}
          <path d="M 250 100 A 70 70 0 1 1 150 100" fill="none" stroke="#C2410C" strokeWidth="1.2" opacity="0.3" />
          <polygon points="150,100 155,110 145,108" fill="#C2410C" opacity="0.4" />

          {/* Diameter dimension */}
          <line x1="90" y1="170" x2="310" y2="170" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="90" y1="162" x2="90" y2="178" stroke="#C2410C" strokeWidth="1.2" />
          <line x1="310" y1="162" x2="310" y2="178" stroke="#C2410C" strokeWidth="1.2" />
          <polygon points="95,170 105,166 105,174" fill="#C2410C" />
          <polygon points="305,170 295,166 295,174" fill="#C2410C" />
          <rect x="162" y="176" width="76" height="16" rx="3" fill="#C2410C" />
          <text x="200" y="187" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8.5" fontWeight="700" fill="white">{imp('60', '1525')} dia.</text>


          {/* DIVIDER */}
          <line x1="420" y1="20" x2="420" y2="310" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />


          {/* RIGHT: T-SHAPED */}
          <text x="650" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="var(--body-secondary)" letterSpacing="0.08em">T-SHAPED TURNING SPACE</text>

          {/* 60" bounding square (dashed) */}
          <rect x="470" y="65" width="220" height="220" fill="none" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

          {/* T-shape: top bar (horizontal arm) + vertical stem */}
          {/* Top arm: full 220px width, 70px tall (36") */}
          <rect x="470" y="65" width="220" height="74" rx="2" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="1.5" />
          {/* Vertical stem: centered, 74px wide (36"), from bottom of arm to bottom of square */}
          <rect x="543" y="139" width="74" height="146" rx="2" fill="#15803D" opacity="0.06" stroke="#15803D" strokeWidth="1.5" />

          {/* Arm labels */}
          <text x="510" y="105" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#14532D" fontWeight="600">← turn left</text>
          <text x="655" y="105" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#14532D" fontWeight="600">turn right →</text>
          <text x="580" y="215" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#14532D" fontWeight="600">enter / back up</text>

          {/* Wheelchair in center of T intersection */}
          <circle cx="580" cy="145" r="10" fill="#15803D" opacity="0.08" />
          <rect x="572" y="132" width="16" height="10" rx="2" fill="none" stroke="#15803D" strokeWidth="0.8" opacity="0.4" />
          <circle cx="571" cy="152" r="5" fill="none" stroke="#15803D" strokeWidth="0.6" opacity="0.3" />
          <circle cx="589" cy="152" r="5" fill="none" stroke="#15803D" strokeWidth="0.6" opacity="0.3" />

          {/* Three-point turn arrows */}
          <line x1="560" y1="108" x2="520" y2="108" stroke="#15803D" strokeWidth="1" opacity="0.35" markerEnd="url(#arrowG)" />
          <line x1="600" y1="108" x2="640" y2="108" stroke="#15803D" strokeWidth="1" opacity="0.35" markerEnd="url(#arrowG)" />
          <line x1="580" y1="160" x2="580" y2="240" stroke="#15803D" strokeWidth="1" opacity="0.35" markerEnd="url(#arrowG)" />
          <defs>
            <marker id="arrowG" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0,0 6,2 0,4" fill="#15803D" opacity="0.5" />
            </marker>
          </defs>

          {/* T-arm width dimension (36") */}
          <line x1="470" y1="148" x2="543" y2="148" stroke="#15803D" strokeWidth="1" />
          <line x1="470" y1="142" x2="470" y2="154" stroke="#15803D" strokeWidth="1" />
          <line x1="543" y1="142" x2="543" y2="154" stroke="#15803D" strokeWidth="1" />
          <rect x="478" y="153" width="48" height="13" rx="3" fill="#15803D" />
          <text x="502" y="162" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{imp('36', '915')} min</text>

          {/* Stem width dimension (36") */}
          <line x1="543" y1="292" x2="617" y2="292" stroke="#15803D" strokeWidth="1" />
          <line x1="543" y1="286" x2="543" y2="298" stroke="#15803D" strokeWidth="1" />
          <line x1="617" y1="286" x2="617" y2="298" stroke="#15803D" strokeWidth="1" />
          <rect x="553" y="296" width="48" height="13" rx="3" fill="#15803D" />
          <text x="577" y="305" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{imp('36', '915')} min</text>

          {/* Overall 60" width */}
          <line x1="470" y1="52" x2="690" y2="52" stroke="#64748B" strokeWidth="1" />
          <line x1="470" y1="44" x2="470" y2="60" stroke="#64748B" strokeWidth="1" />
          <line x1="690" y1="44" x2="690" y2="60" stroke="#64748B" strokeWidth="1" />
          <rect x="548" y="42" width="64" height="13" rx="3" fill="#64748B" />
          <text x="580" y="51" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{imp('60', '1525')} sq.</text>


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
              <circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="turn-focus-ring" />
            </g>
          ))}

          <text x="30" y="310" fontFamily="Manrope, sans-serif" fontSize="9" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">
        {activeCallout ? `Now showing details for callout ${activeCallout.id}: ${activeCallout.label}` : ''}
      </div>

      {activeCallout && (
        <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'turnFade 0.25s ease-out' }}>
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
        @keyframes turnFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        g[role="button"]:focus .turn-focus-ring { stroke: var(--accent); stroke-width: 2.5; }
        @media (max-width:768px) { .guide-two-col { flex-direction:column !important; gap:16px !important; } }
              @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}