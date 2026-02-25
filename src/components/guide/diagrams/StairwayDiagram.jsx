import React, { useState, useRef, useEffect, useCallback } from 'react';

const STAIR_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#504-stairways';
const CALLOUTS = [
  { id: 1, label: 'Treads', section: '§504.2', color: '#C2410C', x: 80, y: 42,
    plain: 'All treads within a single flight of stairs must be uniform depth — no variation is permitted. The standard minimum tread depth is 11 inches, measured from the leading edge of the nosing to the riser behind. Uniform tread depth is critical because people develop a rhythm when ascending or descending stairs; a sudden change in depth causes trips and falls.',
    legal: '"All steps on a flight of stairs shall have uniform riser heights and uniform tread depths." Treads: "11 inches deep minimum."',
    citation: '§504.2' },
  { id: 2, label: 'Risers', section: '§504.3', color: '#16A34A', x: 280, y: 42,
    plain: 'All risers in a flight must be uniform in height, between 4 and 7 inches. Open risers (where you can see through the stair) are NOT permitted on accessible routes. Open risers catch cane tips and allow feet to slip through, creating fall hazards for people with mobility or vision impairments.',
    legal: '"Risers shall be 4 inches high minimum and 7 inches high maximum." §504.4 "Open risers are not permitted."',
    citation: '§504.3' },
  { id: 3, label: 'Nosings', section: '§504.5', color: '#2563EB', x: 480, y: 42,
    plain: 'The leading edge of each tread (the nosing) must be curved or beveled — never square or abruptly projecting. The nosing can project a maximum of 1.5 inches beyond the riser face below. The underside of the nosing must form an angle of at least 60 degrees from horizontal. The radius of curvature at the leading edge must be ½ inch maximum. These profiles prevent tripping and snagging.',
    legal: '"The radius of curvature at the leading edge of the tread shall be 1/2 inch maximum." Nosing projection: "1 1/2 inches maximum." Underside angle: "60 degrees minimum from horizontal."',
    citation: '§504.5' },
  { id: 4, label: 'Handrails', section: '§504.6', color: '#7C3AED', x: 680, y: 42,
    plain: 'Handrails complying with §505 are required on both sides of all stairs. The top of the gripping surface must be 34 to 38 inches above stair nosings, measured vertically from the line connecting the nosing edges. Handrails must be continuous for the full length of each stair flight. Breaks are only permitted at landing turns.',
    legal: '"Stairs shall have handrails complying with §505." Height: "34 inches minimum and 38 inches maximum above stair nosings."',
    citation: '§504.6, §505' },
  { id: 5, label: 'Top Extension', section: '§505.10.2', color: '#D97706', x: 280, y: 280,
    plain: 'At the top of the stairs, the handrail must extend horizontally at least 12 inches beyond the top riser nosing. This extension provides a stable grip point as a person transitions from the level landing onto the descending stairs. The extension must return to the wall, guard, or post — it cannot simply end in open space where someone could catch clothing on it.',
    legal: '"At the top of a stair flight, handrails shall extend horizontally above the landing for 12 inches minimum beginning directly above the first riser nosing."',
    citation: '§505.10.2' },
  { id: 6, label: 'Bottom Extension', section: '§505.10.3', color: '#DB2777', x: 480, y: 280,
    plain: 'At the bottom, the handrail extends at the slope of the stair flight for a horizontal distance equal to one tread depth beyond the last riser nosing, then continues horizontally for 12 inches. This provides support as the person completes the last step and transitions to level ground. The total extension ensures a smooth grip from stair to landing.',
    legal: '"At the bottom of a stair flight, handrails shall extend at the slope of the stair flight for a horizontal distance at least equal to one tread depth beyond the last riser nosing."',
    citation: '§505.10.3' },
  { id: 7, label: 'Wet Conditions', section: '§504.7', color: '#0EA5E9', x: 680, y: 280,
    plain: 'Outdoor stairs and any stairs that may be subject to wet conditions (near pools, in parking garages, at building entries) must have a visual contrast strip at the leading edge of each tread. The strip must extend the full width of the tread. It provides a visual warning of each step edge for people with low vision, especially when water makes surfaces reflective.',
    legal: '"Stairways that are not in an enclosed stairwell shall have visual contrast on tread nosings." §504.7 Contrast "shall be a stripe 1 inch wide minimum and 2 inches wide maximum, placed on the nosing tread at the leading edge."',
    citation: '§504.7' }
];

function makeLink(t) { return (<a href={STAIR_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function StairwayDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback(id => setActive(p => p === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (imp, met) => metric ? `${met} mm` : `${imp}"`;
  const ac = CALLOUTS.find(c => c.id === active);

  const tW = 110, rH = 60;
  const steps = [0,1,2,3,4];
  const baseX = 120, baseY = 400;

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§504 Stairways</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: 28 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 480" role="img" aria-labelledby="stair-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="stair-title">ADA §504 Stairways — Side Elevation with Nosing Detail</title>
          <rect width="900" height="480" fill="#FAFAF9" />
          <text x="350" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#94A3B8" letterSpacing=".08em">SIDE ELEVATION</text>

          {/* Stair steps */}
          {steps.map(i => {
            const sx = baseX + i * tW, sy = baseY - i * rH;
            return (
              <React.Fragment key={i}>
                {/* Tread */}
                <rect x={sx} y={sy - rH} width={tW} height={rH} fill="white" stroke="#94A3B8" strokeWidth="2" />
                {/* Nosing highlight */}
                <line x1={sx} y1={sy - rH} x2={sx + tW} y2={sy - rH} stroke="#C2410C" strokeWidth="3" />
                {/* Riser */}
                <line x1={sx} y1={sy} x2={sx} y2={sy - rH} stroke="#94A3B8" strokeWidth="2" />
              </React.Fragment>
            );
          })}
          {/* Top landing */}
          <rect x={baseX + 5 * tW} y={baseY - 5 * rH} width={160} height={rH} fill="#E7E5E4" opacity="0.2" stroke="#94A3B8" strokeWidth="1.5" />
          <text x={baseX + 5 * tW + 80} y={baseY - 5 * rH + 35} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#94A3B8">TOP LANDING</text>
          {/* Bottom landing */}
          <rect x={40} y={baseY} width={80} height={rH} fill="#E7E5E4" opacity="0.2" stroke="#94A3B8" strokeWidth="1.5" />
          <text x={80} y={baseY + 35} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#94A3B8">BOTTOM</text>

          {/* Handrail */}
          {/* Top extension (12" horizontal) */}
          <line x1={baseX + 5 * tW + 80} y1={baseY - 5 * rH - 50} x2={baseX + 5 * tW} y2={baseY - 5 * rH - 50} stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" />
          {/* Sloped handrail along stairs */}
          <line x1={baseX + 5 * tW} y1={baseY - 5 * rH - 50} x2={baseX} y2={baseY - 50} stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" />
          {/* Bottom extension (one tread depth sloped + 12" horizontal) */}
          <line x1={baseX} y1={baseY - 50} x2={baseX - tW} y2={baseY + rH - 50} stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          <line x1={baseX - tW} y1={baseY + rH - 50} x2={baseX - tW - 60} y2={baseY + rH - 50} stroke="#7C3AED" strokeWidth="4" strokeLinecap="round" opacity="0.6" />

          {/* 34-38" height label */}
          <line x1={baseX + 2 * tW + 55} y1={baseY - 2 * rH} x2={baseX + 2 * tW + 55} y2={baseY - 2 * rH - 50} stroke="#7C3AED" strokeWidth="1" />
          <rect x={baseX + 2 * tW + 60} y={baseY - 2 * rH - 38} width="65" height="13" rx="3" fill="#7C3AED" />
          <text x={baseX + 2 * tW + 92} y={baseY - 2 * rH - 29} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('34–38', '865–965')}</text>

          {/* Tread depth dim */}
          <line x1={baseX + tW} y1={baseY - rH + 12} x2={baseX + 2 * tW} y2={baseY - rH + 12} stroke="#C2410C" strokeWidth="1" />
          <line x1={baseX + tW} y1={baseY - rH + 6} x2={baseX + tW} y2={baseY - rH + 18} stroke="#C2410C" strokeWidth="1" />
          <line x1={baseX + 2 * tW} y1={baseY - rH + 6} x2={baseX + 2 * tW} y2={baseY - rH + 18} stroke="#C2410C" strokeWidth="1" />
          <rect x={baseX + tW + 20} y={baseY - rH + 15} width="58" height="12" rx="3" fill="#C2410C" />
          <text x={baseX + tW + 49} y={baseY - rH + 24} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('11', '280')} min</text>

          {/* Riser height dim */}
          <line x1={baseX + 3 * tW - 10} y1={baseY - 2 * rH} x2={baseX + 3 * tW - 10} y2={baseY - 3 * rH} stroke="#16A34A" strokeWidth="1" />
          <line x1={baseX + 3 * tW - 16} y1={baseY - 2 * rH} x2={baseX + 3 * tW - 4} y2={baseY - 2 * rH} stroke="#16A34A" strokeWidth="1" />
          <line x1={baseX + 3 * tW - 16} y1={baseY - 3 * rH} x2={baseX + 3 * tW - 4} y2={baseY - 3 * rH} stroke="#16A34A" strokeWidth="1" />
          <rect x={baseX + 3 * tW - 60} y={baseY - 3 * rH + 22} width="44" height="12" rx="3" fill="#16A34A" />
          <text x={baseX + 3 * tW - 38} y={baseY - 3 * rH + 31} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('4–7', '100–180')}</text>

          {/* Top ext 12" label */}
          <line x1={baseX + 5 * tW} y1={baseY - 5 * rH - 40} x2={baseX + 5 * tW + 80} y2={baseY - 5 * rH - 40} stroke="#D97706" strokeWidth="1" />
          <rect x={baseX + 5 * tW + 10} y={baseY - 5 * rH - 38} width="56" height="12" rx="3" fill="#D97706" />
          <text x={baseX + 5 * tW + 38} y={baseY - 5 * rH - 29} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('12', '305')} min</text>

          {/* Bottom ext label */}
          <rect x={baseX - tW - 40} y={baseY + rH - 40} width="70" height="12" rx="3" fill="#DB2777" />
          <text x={baseX - tW - 5} y={baseY + rH - 31} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" fill="white">slope + {d('12', '305')}</text>

          {/* Nosing inset */}
          <text x="760" y="50" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fontWeight="700" fill="#94A3B8">NOSING PROFILES</text>
          {/* (A) Angled */}
          <rect x="700" y="60" width="120" height="70" rx="4" fill="white" stroke="#2563EB" strokeWidth="1" />
          <text x="760" y="76" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#2563EB" fontWeight="600">(A) Angled</text>
          <line x1="720" y1="90" x2="800" y2="90" stroke="#94A3B8" strokeWidth="2" />
          <line x1="720" y1="90" x2="720" y2="120" stroke="#94A3B8" strokeWidth="2" />
          <line x1="720" y1="90" x2="710" y2="118" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x="760" y="118" fontFamily="Manrope, sans-serif" fontSize="6" fill="#2563EB">60° min</text>

          {/* (B) Curved */}
          <rect x="700" y="140" width="120" height="60" rx="4" fill="white" stroke="#2563EB" strokeWidth="1" />
          <text x="760" y="156" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#2563EB" fontWeight="600">(B) Rounded</text>
          <path d="M 720 170 Q 720 185 735 185 L 800 185" fill="none" stroke="#94A3B8" strokeWidth="2" />
          <text x="760" y="196" fontFamily="Manrope, sans-serif" fontSize="6" fill="#2563EB">½" max radius</text>

          {/* (C) Flush */}
          <rect x="700" y="210" width="120" height="50" rx="4" fill="white" stroke="#2563EB" strokeWidth="1" />
          <text x="760" y="226" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#2563EB" fontWeight="600">(C) Flush / No Nosing</text>
          <line x1="720" y1="240" x2="800" y2="240" stroke="#94A3B8" strokeWidth="2" />
          <line x1="720" y1="240" x2="720" y2="255" stroke="#94A3B8" strokeWidth="2" />

          {/* No open risers */}
          <rect x="700" y="275" width="120" height="35" rx="4" fill="#EF4444" opacity="0.06" stroke="#EF4444" strokeWidth="1.5" />
          <text x="760" y="296" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#EF4444" fontWeight="700">✕ NO OPEN RISERS</text>

          {/* Callouts */}
          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.color : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.color}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="470" fontFamily="Manrope, sans-serif" fontSize="9" fill="#94A3B8">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'stairFade .25s ease-out' }}>
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
      <style>{`@keyframes stairFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}