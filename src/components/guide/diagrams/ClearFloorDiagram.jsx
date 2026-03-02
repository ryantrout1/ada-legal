import React, { useState, useRef, useEffect, useCallback } from 'react';

const CLEAR_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#305-clear-floor-or-ground-space';

const CALLOUTS = [
  {
    id: 1, label: 'Dimensions', section: '§305.3', color: 'var(--section-label)', textColor: '#8B2E08',
    x: 200, y: 42,
    plain: 'The minimum clear floor or ground space is 30 inches wide by 48 inches deep. These dimensions are measured in the clear — no fixed obstructions (columns, fixtures, equipment) may encroach into this area. The space must be large enough for a standard wheelchair and its occupant to park and operate whatever element is being accessed. Larger clear spaces may be required in alcoves or at specific elements.',
    legal: '"Clear floor or ground spaces shall be 30 inches (760 mm) minimum by 48 inches (1220 mm) minimum."',
    citation: '§305.3'
  },
  {
    id: 2, label: 'Forward Approach', section: '§305.5', color: '#15803D', textColor: '#14532D',
    x: 130, y: 170,
    plain: 'In a forward approach, the 48-inch dimension extends toward the element being accessed. The wheelchair faces the element head-on. This is the standard approach for lavatories, drinking fountains, counters, and any element that requires knee and toe clearance underneath. The user pulls straight up to the element with their knees extending under it.',
    legal: '"One full unobstructed side of the clear floor or ground space shall adjoin an accessible route or adjoin another clear floor or ground space." Forward approach: 48 inches toward element.',
    citation: '§305.5'
  },
  {
    id: 3, label: 'Parallel Approach', section: '§305.6', color: '#2563EB', textColor: '#1E3A8A',
    x: 570, y: 170,
    plain: 'In a parallel approach, the 48-inch dimension runs alongside the element. The wheelchair parks parallel to whatever is being accessed. This is common for wall-mounted controls (light switches, thermostats), some ATMs, vending machines, and fire alarm pull stations. The user reaches sideways to operate the element.',
    legal: '"Where a clear floor or ground space is positioned for a parallel approach, the 48-inch dimension shall be parallel to the element." Side reach per §308.3 applies.',
    citation: '§305.6'
  },
  {
    id: 4, label: 'Floor Surface', section: '§305.2', color: '#7C3AED', textColor: '#5B21B6',
    x: 370, y: 42,
    plain: 'The floor within the clear space must comply with §302: firm, stable, and slip-resistant. The maximum slope in any direction is 1:48 (about 2%), which allows only minor drainage slope. Carpet, if present, must be securely attached with a firm cushion or no cushion, and pile height cannot exceed ½ inch. Gratings must have openings no wider than ½ inch. No changes in level are permitted within the clear space.',
    legal: '"Floor or ground surfaces of a clear floor or ground space shall comply with §302." Changes in level not permitted. Slope: "not steeper than 1:48."',
    citation: '§305.2'
  },
  {
    id: 5, label: 'Knee/Toe Clearance', section: '§305.4', color: '#92400E', textColor: '#78350F',
    x: 130, y: 280,
    plain: 'The clear floor space may extend under an element if knee and toe clearance per §306 is provided. This is essential for lavatories, desks, and counters where the wheelchair user needs to pull up underneath. Knee clearance: 27 inches high minimum, 8 inches deep minimum at that height. Toe clearance: below 9 inches, extending 17 to 25 inches from the front edge.',
    legal: '"Unless otherwise specified, clear floor or ground space may include knee and toe clearance complying with §306." This allows the clear space to extend under elements like lavatories and desks.',
    citation: '§305.4'
  },
  {
    id: 6, label: 'Overlap', section: '§305.7', color: '#BE185D', textColor: '#9D174D',
    x: 370, y: 280,
    plain: 'Clear floor spaces are permitted to overlap with other clear floor spaces, accessible routes, turning spaces (§304), and maneuvering clearances at doors (§404). This is critical for compact designs — a single area can serve multiple purposes simultaneously. However, clear floor spaces cannot overlap restricted areas, hazardous zones, or areas behind barriers.',
    legal: '"Unless otherwise specified, clear floor or ground spaces, turning spaces, and accessible routes are permitted to overlap." Multiple clear spaces may share the same floor area.',
    citation: '§305.7'
  },
  {
    id: 7, label: 'Alcoves', section: '§305.7', color: '#0E7490', textColor: '#0C4A6E',
    x: 570, y: 280,
    plain: 'When a clear floor space is located in an alcove (recessed area), additional width is required for maneuvering. Forward approach in an alcove deeper than 15 inches: width must increase to 36 inches (from the standard 30). Parallel approach in an alcove deeper than 24 inches: width must also increase to 36 inches. The extra width gives the wheelchair room to turn into the alcove.',
    legal: '"Alcoves shall be 36 inches wide minimum where the depth exceeds 15 inches for forward approach, or 24 inches for parallel approach." Extra maneuvering width compensates for restricted movement.',
    citation: '§305.7'
  }
];

function makeLink(text) {
  return (<a href={CLEAR_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }} aria-label={`${text} on ADA.gov`}>{text}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>↗</span></a>);
}
function parseCitations(text) {
  return text.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p);
}

export default function ClearFloorDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>§305 Clear Floor Space</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: '44px' }}>{u}</button>); })}
        </div>
      </div>

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 900 320" role="img" aria-labelledby="clear-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="clear-title">ADA §305 Clear Floor Space — Forward and Parallel Approaches</title>
          <rect x="0" y="0" width="900" height="320" fill="var(--page-bg-subtle)" />

          {/* ===== LEFT: FORWARD APPROACH ===== */}
          <text x="200" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="var(--body-secondary)" letterSpacing="0.08em">FORWARD APPROACH</text>

          {/* Element (wall-mounted, at top) */}
          <rect x="130" y="56" width="140" height="12" rx="2" fill="#94A3B8" opacity="0.3" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="200" y="52" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="var(--body-secondary)" fontWeight="600">ELEMENT</text>

          {/* Clear floor rectangle — 30 wide × 48 deep (toward element) */}
          <rect x="110" y="70" width="180" height="210" rx="4" fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="2" />

          {/* Wheelchair icon (top-down) */}
          {/* Wheels */}
          <circle cx="155" cy="210" r="22" fill="none" stroke="#64748B" strokeWidth="1.5" />
          <circle cx="245" cy="210" r="22" fill="none" stroke="#64748B" strokeWidth="1.5" />
          {/* Casters */}
          <circle cx="170" cy="145" r="6" fill="none" stroke="#64748B" strokeWidth="1" />
          <circle cx="230" cy="145" r="6" fill="none" stroke="#64748B" strokeWidth="1" />
          {/* Frame */}
          <rect x="158" y="148" width="84" height="65" rx="4" fill="none" stroke="#64748B" strokeWidth="1.5" />
          {/* Person circle */}
          <circle cx="200" cy="180" r="14" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
          {/* Arrow toward element */}
          <line x1="200" y1="130" x2="200" y2="80" stroke="#15803D" strokeWidth="1.5" markerEnd="url(#clearArr)" />

          <defs>
            <marker id="clearArr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#15803D" />
            </marker>
          </defs>

          {/* Width dimension (30") */}
          <line x1="110" y1="290" x2="290" y2="290" stroke="#C2410C" strokeWidth="1" />
          <line x1="110" y1="284" x2="110" y2="296" stroke="#C2410C" strokeWidth="1" />
          <line x1="290" y1="284" x2="290" y2="296" stroke="#C2410C" strokeWidth="1" />
          <rect x="168" y="292" width="64" height="13" rx="3" fill="#C2410C" />
          <text x="200" y="301" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('30', '760')} min</text>

          {/* Depth dimension (48") */}
          <line x1="90" y1="70" x2="90" y2="280" stroke="#C2410C" strokeWidth="1" />
          <line x1="84" y1="70" x2="96" y2="70" stroke="#C2410C" strokeWidth="1" />
          <line x1="84" y1="280" x2="96" y2="280" stroke="#C2410C" strokeWidth="1" />
          <rect x="62" y="168" width="52" height="13" rx="3" fill="#C2410C" />
          <text x="88" y="177" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('48', '1220')}</text>


          {/* ===== DIVIDER ===== */}
          <line x1="400" y1="20" x2="400" y2="310" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />


          {/* ===== RIGHT: PARALLEL APPROACH ===== */}
          <text x="620" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="var(--body-secondary)" letterSpacing="0.08em">PARALLEL APPROACH</text>

          {/* Element (on side) */}
          <rect x="420" y="110" width="12" height="140" rx="2" fill="#94A3B8" opacity="0.3" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="418" y="180" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="var(--body-secondary)" fontWeight="600" transform="rotate(-90 418 180)">ELEMENT</text>

          {/* Clear floor rectangle — 48 long (parallel) × 30 wide */}
          <rect x="440" y="82" width="330" height="200" rx="4" fill="#2563EB" opacity="0.05" stroke="#2563EB" strokeWidth="2" />

          {/* Wheelchair (side view, parallel) */}
          <circle cx="550" cy="210" r="22" fill="none" stroke="#64748B" strokeWidth="1.5" />
          <circle cx="640" cy="210" r="22" fill="none" stroke="#64748B" strokeWidth="1.5" />
          <circle cx="565" cy="145" r="6" fill="none" stroke="#64748B" strokeWidth="1" />
          <circle cx="625" cy="145" r="6" fill="none" stroke="#64748B" strokeWidth="1" />
          <rect x="553" y="148" width="84" height="65" rx="4" fill="none" stroke="#64748B" strokeWidth="1.5" />
          <circle cx="595" cy="180" r="14" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
          {/* Arrow toward element (sideways) */}
          <line x1="540" y1="180" x2="445" y2="180" stroke="#2563EB" strokeWidth="1.5" markerEnd="url(#clearArrL)" />

          <defs>
            <marker id="clearArrL" markerWidth="8" markerHeight="6" refX="0" refY="3" orient="auto-start-reverse">
              <polygon points="8 0, 0 3, 8 6" fill="#2563EB" />
            </marker>
          </defs>

          {/* Width dimension (30") — vertical */}
          <line x1="790" y1="82" x2="790" y2="282" stroke="#C2410C" strokeWidth="1" />
          <line x1="784" y1="82" x2="796" y2="82" stroke="#C2410C" strokeWidth="1" />
          <line x1="784" y1="282" x2="796" y2="282" stroke="#C2410C" strokeWidth="1" />
          <rect x="798" y="175" width="52" height="13" rx="3" fill="#C2410C" />
          <text x="824" y="184" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('30', '760')}</text>

          {/* Length dimension (48") — horizontal */}
          <line x1="440" y1="290" x2="770" y2="290" stroke="#C2410C" strokeWidth="1" />
          <line x1="440" y1="284" x2="440" y2="296" stroke="#C2410C" strokeWidth="1" />
          <line x1="770" y1="284" x2="770" y2="296" stroke="#C2410C" strokeWidth="1" />
          <rect x="573" y="292" width="64" height="13" rx="3" fill="#C2410C" />
          <text x="605" y="301" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('48', '1220')}</text>


          {/* CALLOUT DOTS */}
          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label} — ${c.section}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="312" fontFamily="Manrope, sans-serif" fontSize="9" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', animation: 'clearFade 0.25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: ac.color, color: 'var(--page-bg)', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{ac.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{ac.label}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: ac.color, background: `${ac.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{ac.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: '44px' }}>Close <span aria-hidden="true">✕</span></button>
          </div>
          <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{ac.plain}</p></div>
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard — {parseCitations(ac.citation)}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCitations(ac.legal)}</p>
            </div></aside>
          </div>
        </div>
      )}
      <style>{`@keyframes clearFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}