import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#605-urinals';
const CALLOUTS = [
  { id: 1, label: 'Rim Height', section: '§605.2', color: '#C2410C', textColor: '#8B2E08', x: 150, y: 100, plain: 'The rim of an accessible urinal must be no higher than 17 inches (430 mm) above the finish floor. This lower height allows approach by men who use wheelchairs. Wall-hung (stall-type) urinals that extend to the floor are preferred because they offer the widest range of use.', legal: '"Urinals shall be the stall-type or the wall-hung type with the rim 17 inches (430 mm) maximum above the finish floor or ground."', citation: '§605.2' },
  { id: 2, label: 'Clear Floor Space', section: '§605.3', color: '#15803D', textColor: '#14532D', x: 400, y: 100, plain: 'A clear floor space of at least 30 inches wide by 48 inches deep (760 × 1220 mm) must be provided in front of the urinal. This space must allow a forward approach — centered on the urinal. The floor must be level (max slope 1:48) and the surface must be stable, firm, and slip-resistant.', legal: '"A clear floor or ground space complying with 305 shall be provided."', citation: '§605.3, §305.3' },
  { id: 3, label: 'Flush Controls', section: '§605.4', color: '#2563EB', textColor: '#1E3A8A', x: 650, y: 100, plain: 'Flush controls must be operable with one hand and not require tight grasping, pinching, or twisting of the wrist. The force required to operate the flush valve must not exceed 5 pounds. Automatic (sensor-operated) flush valves meet this requirement. If manual, flush controls must be mounted no higher than 44 inches (1120 mm) above the floor.', legal: '"Flush controls shall be hand operated or automatic. Flush controls shall comply with 309." §309.4: "Operable parts shall be operable with one hand and shall not require tight grasping, pinching, or twisting of the wrist. The force required to activate operable parts shall be 5 pounds maximum."', citation: '§605.4, §309.4' },
  { id: 4, label: 'Shields / Partitions', section: '§605', color: '#7C3AED', textColor: '#5B21B6', x: 150, y: 340, plain: 'Where privacy shields or partitions are installed between urinals, they must not extend beyond the front edge of the urinal rim. If shields extend past the rim, they must provide at least 30 inches of clearance between them to allow wheelchair approach. Shields must not reduce the clear floor space required in front of the accessible urinal.', legal: 'Advisory §605: "Stall-type urinals provide a wider range of use for persons with disabilities. Partitions or panels separating urinals shall not extend beyond the front edge of the urinal rim and the clear floor space."', citation: '§605, Advisory' },
  { id: 5, label: 'Scoping — How Many', section: '§213.3.3', color: '#92400E', textColor: '#78350F', x: 400, y: 340, plain: 'Where urinals are provided, at least one must comply with §605. In restrooms with multiple urinals, the accessible urinal should be positioned at the end of a row so approach from the side is easier. The accessible urinal does not replace required accessible toilet compartments — both are needed.', legal: '"Where urinals are provided, at least one shall comply with 605."', citation: '§213.3.3' }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function UrinalDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>§605 Urinals</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: isA ? 'var(--dark-bg)' : 'white', color: isA ? 'white' : 'var(--body)', cursor: 'pointer', minHeight: 44 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="ur-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="ur-title">ADA §605 Urinals — Elevation & Plan View</title>
          <rect width="900" height="520" fill="var(--page-bg-subtle)" />
          <text x="220" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">FRONT ELEVATION VIEW</text>
          <text x="660" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">PLAN VIEW (TOP DOWN)</text>

          {/* ===== LEFT: Front elevation ===== */}
          {/* Wall */}
          <rect x="60" y="40" width="320" height="440" fill="#94A3B8" opacity="0.04" stroke="#94A3B8" strokeWidth="1" rx="2" />
          
          {/* Floor line */}
          <line x1="60" y1="480" x2="380" y2="480" stroke="#94A3B8" strokeWidth="2" />

          {/* Urinal body — stall type extending to floor */}
          <path d="M170,160 L170,480 Q170,480 180,480 L260,480 Q270,480 270,480 L270,160 Q270,140 220,130 Q170,140 170,160Z" fill="#E7E5E4" opacity="0.3" stroke="#94A3B8" strokeWidth="1.5" />
          {/* Rim line */}
          <line x1="170" y1="310" x2="270" y2="310" stroke="#C2410C" strokeWidth="2" />
          <text x="220" y="305" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#8B2E08" fontWeight="600">RIM</text>

          {/* Flush valve */}
          <rect x="205" y="120" width="30" height="35" rx="4" fill="#94A3B8" opacity="0.15" stroke="#2563EB" strokeWidth="1.5" />
          <text x="220" y="140" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A" fontWeight="600">FLUSH</text>

          {/* Privacy partition */}
          <rect x="300" y="100" width="6" height="340" fill="#7C3AED" opacity="0.12" stroke="#7C3AED" strokeWidth="1" rx="1" />
          <text x="320" y="280" fontFamily="Manrope, sans-serif" fontSize="7" fill="#5B21B6" fontWeight="500" transform="rotate(90 320 280)">PARTITION</text>

          {/* Dim: Rim 17" max */}
          <line x1="100" y1="310" x2="100" y2="480" stroke="#C2410C" strokeWidth="1" />
          <line x1="94" y1="310" x2="106" y2="310" stroke="#C2410C" strokeWidth="1" />
          <line x1="94" y1="480" x2="106" y2="480" stroke="#C2410C" strokeWidth="1" />
          <rect x="78" y="388" width="44" height="14" rx="3" fill="#C2410C" />
          <text x="100" y="398" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('17', '430')}</text>
          <text x="100" y="410" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#8B2E08">max</text>

          {/* Dim: Flush 44" max */}
          <line x1="350" y1="137" x2="350" y2="480" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 2" />
          <line x1="344" y1="137" x2="356" y2="137" stroke="#2563EB" strokeWidth="1" />
          <line x1="344" y1="480" x2="356" y2="480" stroke="#2563EB" strokeWidth="1" />
          <rect x="328" y="300" width="44" height="14" rx="3" fill="#2563EB" />
          <text x="350" y="310" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('44', '1120')}</text>
          <text x="350" y="324" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A">max</text>

          {/* ===== RIGHT: Plan view ===== */}
          {/* Wall */}
          <line x1="490" y1="120" x2="830" y2="120" stroke="#94A3B8" strokeWidth="2" />
          <rect x="490" y="100" width="340" height="20" fill="#94A3B8" opacity="0.06" />
          <text x="660" y="112" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563" fontWeight="500">WALL</text>

          {/* Urinal outline (half circle on wall) */}
          <path d="M630,120 L630,190 Q630,220 660,220 Q690,220 690,190 L690,120" fill="#E7E5E4" opacity="0.2" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="660" y="175" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563">URINAL</text>

          {/* Clear floor space rectangle */}
          <rect x="595" y="225" width="130" height="200" rx="4" fill="#15803D" opacity="0.05" stroke="#15803D" strokeWidth="2" />
          {/* CFS label */}
          <text x="660" y="330" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#14532D" fontWeight="600">CLEAR FLOOR</text>
          <text x="660" y="342" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#14532D" fontWeight="600">SPACE</text>

          {/* Centerline */}
          <line x1="660" y1="120" x2="660" y2="425" stroke="#15803D" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
          <text x="660" y="440" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#14532D">centerline</text>

          {/* Dim: 30" width */}
          <line x1="595" y1="450" x2="725" y2="450" stroke="#15803D" strokeWidth="1" />
          <line x1="595" y1="444" x2="595" y2="456" stroke="#15803D" strokeWidth="1" />
          <line x1="725" y1="444" x2="725" y2="456" stroke="#15803D" strokeWidth="1" />
          <rect x="632" y="453" width="52" height="14" rx="3" fill="#15803D" />
          <text x="658" y="463" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('30', '760')} min</text>

          {/* Dim: 48" depth */}
          <line x1="740" y1="225" x2="740" y2="425" stroke="#15803D" strokeWidth="1" />
          <line x1="734" y1="225" x2="746" y2="225" stroke="#15803D" strokeWidth="1" />
          <line x1="734" y1="425" x2="746" y2="425" stroke="#15803D" strokeWidth="1" />
          <rect x="745" y="318" width="52" height="14" rx="3" fill="#15803D" />
          <text x="771" y="328" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('48', '1220')} min</text>

          {/* Partition in plan */}
          <rect x="725" y="120" width="4" height="100" fill="#7C3AED" opacity="0.2" stroke="#7C3AED" strokeWidth="1" />

          {/* Forward approach arrow */}
          <line x1="660" y1="410" x2="660" y2="240" stroke="#475569" strokeWidth="1.5" opacity="0.3" markerEnd="url(#urArr)" />
          <text x="660" y="420" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#475569" opacity="0.5">Forward approach</text>
          <defs><marker id="urArr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#475569" opacity="0.4" /></marker></defs>

          {/* Scoping note */}
          <rect x="490" y="470" width="340" height="34" rx="8" fill="#B45309" opacity="0.05" stroke="#B45309" strokeWidth="1" />
          <text x="660" y="490" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#78350F" fontWeight="600">At least 1 accessible urinal required where urinals are provided</text>

          {/* Callout markers */}
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
        <div ref={panelRef} style={{ marginTop: 12, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'urFade .25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--page-bg-subtle)', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: ac.color, color: 'var(--page-bg)', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{ac.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)' }}>{ac.label}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: ac.color, background: `${ac.color}15`, padding: '2px 8px', borderRadius: 4 }}>{ac.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--body)', minHeight: 44 }}>Close <span aria-hidden="true">✕</span></button>
          </div>
          <div className="guide-two-col" style={{ padding: 20, gap: 24, margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--body)', lineHeight: 1.75, margin: 0 }}>{ac.plain}</p></div>
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: '#FFFBF7', borderLeft: '3px solid #C2410C', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard — {parseCite(ac.citation)}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(ac.legal)}</p>
            </div></aside>
          </div>
        </div>
      )}
      <style>{`@keyframes urFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}