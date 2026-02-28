import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#1006-golf-facilities';
const CALLOUTS = [
  { id: 1, label: 'Mini Golf — Accessible Holes', section: '§1007.2', color: '#C2410C', textColor: '#8B2E08', x: 120, y: 100, plain: 'At least 50% of miniature golf holes must be on an accessible route. The accessible holes must include the start hole and the last hole of the course. This ensures a wheelchair user can play a meaningful portion of the course.', legal: '"At least 50 percent of holes on miniature golf courses shall comply with §1007.3." Must include first and last holes.', citation: '§1007.2' },
  { id: 2, label: 'Mini Golf — Route', section: '§1007.3', color: '#15803D', textColor: '#14532D', x: 350, y: 100, plain: 'The accessible route to each accessible hole must be at least 36 inches wide. Carpet or synthetic turf is acceptable as a floor surface. Running slope must not exceed 1:20, and cross slope must not exceed 1:48.', legal: '"Accessible routes serving miniature golf holes shall comply with Chapter 4 except as modified." Width: 36" min. Carpet and synthetic turf surfaces are permitted.', citation: '§1007.3' },
  { id: 3, label: 'Mini Golf — Start of Play', section: '§1007.7', color: '#2563EB', textColor: '#1E3A8A', x: 580, y: 100, plain: 'Each accessible hole must have a clear space of 48 × 60 inches at the start of play area. One long side of this space must adjoin the accessible route. This provides room for a wheelchair user to position and swing a putter.', legal: '"Start of play areas shall be 48 inches minimum by 60 inches minimum." One long side adjoining the accessible route.', citation: '§1007.7' },
  { id: 4, label: 'Golf — Teeing Grounds', section: '§1006.2', color: '#7C3AED', textColor: '#5B21B6', x: 120, y: 340, plain: 'If one teeing ground per hole is provided, all must be accessible. If two are provided, at least one per hole must be accessible. If three or more, at least two per hole must be on an accessible route.', legal: '§1006.2: "Where one teeing ground is provided, it shall be accessible. Where two, at least one. Where three or more, at least two shall be accessible."', citation: '§1006.2' },
  { id: 5, label: 'Golf — Accessible Route', section: '§1006.3', color: '#92400E', textColor: '#78350F', x: 350, y: 340, plain: 'An accessible route must connect teeing grounds, putting greens, and weather shelters. Golf car passages at least 48 inches wide may serve as accessible routes if the course allows golf car use on those paths.', legal: '"An accessible route complying with Chapter 4 shall connect accessible elements within the boundary of the golf course." Golf car passages: "48 inches wide minimum."', citation: '§1006.3' },
  { id: 6, label: 'Golf — Weather Shelters', section: '§1006.4', color: '#0E7490', textColor: '#0C4A6E', x: 580, y: 340, plain: 'If weather shelters are provided on the course, an accessible route must lead to and into each shelter. The shelter must have the required clear floor space for a wheelchair user.', legal: '"If weather shelters are provided, an accessible route shall connect the shelter to the course." Clear floor space per §305 required inside.', citation: '§1006.4' }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function GolfDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback(id => setActive(p => p === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (imp, met) => metric ? `${met} mm` : `${imp}"`;
  const ac = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§1006/§1007 Golf & Mini Golf</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: 44 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="gf-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="gf-title">ADA §1006/§1007 Golf & Mini Golf Facilities</title>
          <rect width="900" height="520" fill="#FAFAF9" />
          <text x="230" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">MINIATURE GOLF HOLE</text>
          <text x="680" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">GOLF COURSE TEEING GROUND</text>

          {/* LEFT: Mini golf */}
          {/* Course outline */}
          <rect x="60" y="50" width="380" height="430" fill="#15803D" opacity="0.02" stroke="#94A3B8" strokeWidth="1" rx="8" />

          {/* Accessible route */}
          <rect x="70" y="50" width="50" height="430" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="95" y="270" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#14532D" fontWeight="600" transform="rotate(-90,95,270)">ACCESSIBLE ROUTE — {d('36', '915')} min</text>

          {/* Hole 1 (accessible) */}
          <rect x="130" y="70" width="280" height="120" rx="8" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="270" y="95" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#8B2E08" fontWeight="600">HOLE 1 (Accessible)</text>
          {/* Start of play area */}
          <rect x="135" y="110" width="100" height="70" rx="4" fill="#2563EB" opacity="0.05" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="4 2" />
          <text x="185" y="140" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A" fontWeight="600">START OF PLAY</text>
          <text x="185" y="155" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A">{d('48', '1220')} × {d('60', '1525')}</text>
          {/* Golf hole */}
          <circle cx="370" cy="140" r="6" fill="#475569" opacity="0.15" stroke="#475569" strokeWidth="1" />
          {/* Flag */}
          <line x1="370" y1="140" x2="370" y2="105" stroke="#475569" strokeWidth="1" />
          <polygon points="370,105 385,110 370,115" fill="#C2410C" opacity="0.3" />
          {/* Playing surface */}
          <rect x="240" y="105" width="160" height="70" rx="4" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="0.8" />
          <text x="320" y="170" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#14532D">turf/carpet surface OK</text>

          {/* Hole 2 */}
          <rect x="130" y="210" width="280" height="100" rx="8" fill="#94A3B8" opacity="0.03" stroke="#94A3B8" strokeWidth="1" />
          <text x="270" y="265" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">HOLE 2</text>

          {/* Hole 3 (accessible) */}
          <rect x="130" y="330" width="280" height="120" rx="8" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" />
          <text x="270" y="360" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#8B2E08" fontWeight="600">LAST HOLE (Accessible)</text>

          {/* 50% note */}
          <rect x="130" y="465" width="280" height="20" rx="4" fill="#C2410C" opacity="0.05" />
          <text x="270" y="479" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#8B2E08" fontWeight="600">≥ 50% of holes must be accessible (incl. first & last)</text>

          {/* RIGHT: Golf course */}
          {/* Teeing ground */}
          <rect x="510" y="60" width="340" height="200" rx="20" fill="#7C3AED" opacity="0.03" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="680" y="90" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#5B21B6" fontWeight="600">TEEING GROUND</text>

          {/* Tee boxes */}
          <rect x="560" y="120" width="60" height="30" rx="6" fill="#7C3AED" opacity="0.06" stroke="#7C3AED" strokeWidth="1" />
          <text x="590" y="139" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6">TEE 1 ✓</text>
          <rect x="650" y="120" width="60" height="30" rx="6" fill="#7C3AED" opacity="0.06" stroke="#7C3AED" strokeWidth="1" />
          <text x="680" y="139" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6">TEE 2 ✓</text>
          <rect x="740" y="120" width="60" height="30" rx="6" fill="#94A3B8" opacity="0.05" stroke="#94A3B8" strokeWidth="1" />
          <text x="770" y="139" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#4B5563">TEE 3</text>

          <text x="680" y="180" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#5B21B6">3+ tees → at least 2 must be accessible</text>

          {/* Golf car passage */}
          <rect x="510" y="270" width="340" height="40" rx="4" fill="#B45309" opacity="0.04" stroke="#B45309" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="680" y="295" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#78350F" fontWeight="600">GOLF CAR PASSAGE — {d('48', '1220')} wide min (serves as accessible route)</text>

          {/* Putting green */}
          <ellipse cx="680" cy="370" rx="140" ry="60" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1" />
          <text x="680" y="375" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#14532D" fontWeight="600">PUTTING GREEN</text>
          <circle cx="680" cy="390" r="4" fill="#475569" opacity="0.2" />

          {/* Weather shelter */}
          <rect x="720" y="440" width="120" height="50" rx="6" fill="#0EA5E9" opacity="0.04" stroke="#0891B2" strokeWidth="1.5" />
          <text x="780" y="465" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#0C4A6E" fontWeight="600">WEATHER SHELTER</text>
          <text x="780" y="480" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#0C4A6E">Accessible route required</text>

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="510" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'gfFade .25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--slate-200)', background: '#FAFAF9', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: ac.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{ac.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>{ac.label}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: ac.color, background: `${ac.color}15`, padding: '2px 8px', borderRadius: 4 }}>{ac.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close" style={{ background: 'none', border: '1px solid var(--slate-200)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-600)', minHeight: 44 }}>Close <span aria-hidden="true">✕</span></button>
          </div>
          <div className="guide-two-col" style={{ padding: 20, gap: 24, margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)', lineHeight: 1.75, margin: 0 }}>{ac.plain}</p></div>
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: '#FFFBF7', borderLeft: '3px solid #C2410C', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--slate-500)', margin: '0 0 8px' }}>Official Standard — {parseCite(ac.citation)}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(ac.legal)}</p>
            </div></aside>
          </div>
        </div>
      )}
      <style>{`@keyframes gfFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}