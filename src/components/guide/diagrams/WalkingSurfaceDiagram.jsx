import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#403-walking-surfaces';
const CALLOUTS = [
  { id: 1, label: 'Clear Width', section: '§403.5.1', color: '#C2410C', x: 100, y: 80, plain: 'The clear width of a walking surface must be 36 inches (915 mm) minimum. At a point where someone in a wheelchair must turn around, a 60-inch (1525 mm) turning space or T-shaped space is required. The 36-inch clear width is measured between walls, railings, or other obstructions — not including the flare at the base of handrails.', legal: '"The clear width of walking surfaces shall be 36 inches minimum." §403.5.1: "The clear width of walking surfaces shall be 36 inches (915 mm) minimum." EXCEPTION: "The clear width shall be permitted to be reduced to 32 inches (815 mm) minimum for a length of 24 inches (610 mm) maximum provided that reduced-width segments are separated by segments that are 48 inches (1220 mm) long minimum and 36 inches (915 mm) wide minimum."', citation: '§403.5.1' },
  { id: 2, label: 'Running Slope', section: '§403.3', color: '#16A34A', x: 300, y: 80, plain: 'The running slope (the slope in the direction of travel) must not be steeper than 1:20 (5%). If the slope exceeds 1:20, it becomes a ramp and must comply with §405 — including handrails, landings, and edge protection. Walking surfaces at door landings must not exceed 1:48 (about 2%) slope.', legal: '"The running slope of walking surfaces shall not be steeper than 1:20." Advisory 403.3: "A slope steeper than 1:20 is a ramp and must comply with §405."', citation: '§403.3' },
  { id: 3, label: 'Cross Slope', section: '§403.3', color: '#2563EB', x: 500, y: 80, plain: 'The cross slope (perpendicular to the direction of travel) must not exceed 1:48 (about 2%). Excessive cross slope causes wheelchairs to drift sideways and makes it extremely difficult for users to maintain a straight path. This applies to all walking surfaces, including sidewalks, corridors, and floor surfaces along accessible routes.', legal: '"The cross slope of walking surfaces shall not be steeper than 1:48."', citation: '§403.3' },
  { id: 4, label: 'Surface Requirements', section: '§403.2', color: '#7C3AED', x: 700, y: 80, plain: 'All walking surfaces must be firm, stable, and slip-resistant. This applies to both indoor and outdoor surfaces. Carpet must be securely attached with a firm cushion or backing and have a maximum pile height of ½ inch. Openings in floor surfaces (like grates) must not allow passage of a ½-inch sphere and must be oriented so the long dimension is perpendicular to the dominant direction of travel.', legal: '"Floor or ground surfaces shall be stable, firm, and slip-resistant." §302.2: "Carpet or carpet tile shall be securely attached and shall have a firm cushion, pad, or backing or no cushion or pad. Carpet or carpet tile shall have a level loop, textured loop, level cut pile, or level cut/uncut pile texture. Pile height shall be ½ inch maximum."', citation: '§403.2, §302' },
  { id: 5, label: 'Changes in Level', section: '§403.4', color: '#D97706', x: 100, y: 300, plain: 'Changes in level along the walking surface up to ¼ inch may be vertical (a sharp step). Changes between ¼ inch and ½ inch must be beveled with a slope no steeper than 1:2. Changes greater than ½ inch must be treated as a ramp (§405) or curb ramp (§406). This means even small uneven pavement joints, raised thresholds, or carpet edges matter.', legal: '"Changes in level of ¼ inch high maximum shall be permitted to be vertical. Changes in level between ¼ inch high minimum and ½ inch high maximum shall be beveled with a slope not steeper than 1:2." §303.4: "Changes in level greater than ½ inch high shall comply with 405 (Ramps) or 406 (Curb Ramps)."', citation: '§303.2, §303.3, §303.4' },
  { id: 6, label: 'Passing Spaces', section: '§403.5.3', color: '#DB2777', x: 300, y: 300, plain: 'On corridors less than 60 inches wide, passing spaces must be provided every 200 feet. A passing space is either a 60×60 inch area or a T-shaped intersection of two corridors. This allows two wheelchair users traveling in opposite directions to pass each other.', legal: '"An accessible route with a clear width less than 60 inches shall provide passing spaces at intervals of 200 feet maximum. Passing spaces shall be either a space 60 inches minimum by 60 inches minimum, or an intersection of two walking surfaces providing a T-shaped space."', citation: '§403.5.3' },
  { id: 7, label: 'Gratings & Openings', section: '§302.3', color: '#0EA5E9', x: 500, y: 300, plain: 'Any gratings, grates, or openings in walking surfaces on accessible routes must have gaps no wider than ½ inch in one direction. Elongated openings (like the slits in a floor grate) must be oriented so the long dimension runs perpendicular to the dominant direction of travel. This prevents wheelchair caster wheels and cane tips from getting caught.', legal: '"Openings in floor or ground surfaces shall not allow passage of a sphere more than ½ inch in diameter. Elongated openings shall be placed so that the long dimension is perpendicular to the dominant direction of travel."', citation: '§302.3' }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function WalkingSurfaceDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§403 Walking Surfaces</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: 28 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="ws-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="ws-title">ADA §403 Walking Surfaces — Section & Plan View</title>
          <rect width="900" height="520" fill="#FAFAF9" />
          <text x="280" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">PLAN VIEW — CORRIDOR WITH PASSING SPACE</text>
          <text x="720" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">CROSS SECTION</text>

          {/* ===== LEFT: Plan view corridor ===== */}
          {/* Walls */}
          <rect x="60" y="40" width="8" height="440" fill="#94A3B8" opacity="0.3" rx="2" />
          <rect x="200" y="40" width="8" height="180" fill="#94A3B8" opacity="0.3" rx="2" />
          {/* Narrowing point */}
          <rect x="190" y="220" width="18" height="50" fill="#94A3B8" opacity="0.2" rx="2" />
          <rect x="200" y="270" width="8" height="80" fill="#94A3B8" opacity="0.3" rx="2" />

          {/* Passing space box */}
          <rect x="60" y="350" width="210" height="130" rx="4" fill="#DB2777" opacity="0.04" stroke="#DB2777" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="165" y="420" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#DB2777" fontWeight="600">PASSING SPACE</text>
          <rect x="268" y="350" width="8" height="130" fill="#94A3B8" opacity="0.3" rx="2" />

          {/* Corridor floor fill */}
          <rect x="68" y="40" width="132" height="310" fill="#C2410C" opacity="0.03" />
          <text x="134" y="110" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563" transform="rotate(-90 134 110)">CORRIDOR</text>

          {/* Wheelchair silhouette */}
          <circle cx="130" cy="160" r="10" fill="#475569" opacity="0.15" />
          <rect x="120" y="170" width="20" height="25" rx="3" fill="#475569" opacity="0.1" />
          <circle cx="118" cy="195" r="8" fill="none" stroke="#475569" strokeWidth="1.5" opacity="0.2" />
          <circle cx="142" cy="195" r="8" fill="none" stroke="#475569" strokeWidth="1.5" opacity="0.2" />

          {/* Direction arrow */}
          <line x1="134" y1="55" x2="134" y2="200" stroke="#475569" strokeWidth="1" opacity="0.2" markerEnd="url(#wsArr)" />
          <defs><marker id="wsArr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#475569" opacity="0.3" /></marker></defs>

          {/* Dim: 36" clear width */}
          <line x1="68" y1="500" x2="200" y2="500" stroke="#C2410C" strokeWidth="1" />
          <line x1="68" y1="494" x2="68" y2="506" stroke="#C2410C" strokeWidth="1" />
          <line x1="200" y1="494" x2="200" y2="506" stroke="#C2410C" strokeWidth="1" />
          <rect x="106" y="490" width="52" height="14" rx="3" fill="#C2410C" />
          <text x="132" y="500" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('36', '915')} min</text>

          {/* Dim: 32" narrowing */}
          <line x1="68" y1="245" x2="190" y2="245" stroke="#D97706" strokeWidth="1" />
          <line x1="68" y1="239" x2="68" y2="251" stroke="#D97706" strokeWidth="1" />
          <line x1="190" y1="239" x2="190" y2="251" stroke="#D97706" strokeWidth="1" />
          <rect x="101" y="248" width="52" height="12" rx="3" fill="#D97706" />
          <text x="127" y="257" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('32', '815')} min</text>
          <text x="129" y="275" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#D97706">(24" max length)</text>

          {/* Dim: 60x60 passing */}
          <line x1="60" y1="487" x2="270" y2="487" stroke="#DB2777" strokeWidth="1" />
          <line x1="60" y1="481" x2="60" y2="493" stroke="#DB2777" strokeWidth="1" />
          <line x1="270" y1="481" x2="270" y2="493" stroke="#DB2777" strokeWidth="1" />
          <rect x="134" y="476" width="62" height="12" rx="3" fill="#DB2777" />
          <text x="165" y="485" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('60', '1525')} × {d('60', '1525')}</text>

          {/* Grating detail box */}
          <rect x="320" y="370" width="120" height="90" rx="6" fill="#0EA5E9" opacity="0.04" stroke="#0EA5E9" strokeWidth="1" />
          <text x="380" y="390" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#0EA5E9" fontWeight="600">GRATE DETAIL</text>
          {/* Grate lines */}
          {[0,1,2,3,4,5].map(i => (
            <line key={`g${i}`} x1={340 + i * 16} y1="400" x2={340 + i * 16} y2="445" stroke="#0EA5E9" strokeWidth="1.5" opacity="0.3" />
          ))}
          <text x="380" y="458" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#0EA5E9">½" max opening</text>
          {/* Travel direction arrow */}
          <line x1="340" y1="432" x2="420" y2="432" stroke="#0EA5E9" strokeWidth="1" opacity="0.5" markerEnd="url(#wsArr2)" />
          <text x="380" y="428" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#0EA5E9">↑ travel</text>
          <defs><marker id="wsArr2" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><polygon points="0 0,6 2,0 4" fill="#0EA5E9" opacity="0.5" /></marker></defs>

          {/* ===== RIGHT: Cross section ===== */}
          {/* Floor line */}
          <line x1="540" y1="350" x2="860" y2="350" stroke="#94A3B8" strokeWidth="2" />
          <rect x="540" y="350" width="320" height="20" fill="#94A3B8" opacity="0.06" />

          {/* Running slope arrow */}
          <line x1="560" y1="340" x2="740" y2="325" stroke="#16A34A" strokeWidth="2" />
          <polygon points="740,321 748,325 740,329" fill="#16A34A" />
          <text x="650" y="318" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#16A34A" fontWeight="600">Running slope ≤ 1:20</text>
          <text x="650" y="330" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#16A34A">(direction of travel)</text>

          {/* Cross slope indicators */}
          <line x1="780" y1="350" x2="780" y2="280" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 2" />
          <line x1="850" y1="350" x2="850" y2="280" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 2" />
          <line x1="780" y1="295" x2="850" y2="290" stroke="#2563EB" strokeWidth="2" />
          <text x="815" y="280" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#2563EB" fontWeight="600">Cross slope ≤ 1:48</text>
          <text x="815" y="270" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#2563EB">(perpendicular)</text>

          {/* Changes in level detail */}
          <text x="700" y="395" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="600" fill="#D97706">CHANGES IN LEVEL</text>
          {/* ¼" vertical */}
          <line x1="580" y1="420" x2="640" y2="420" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="640" y1="420" x2="640" y2="414" stroke="#D97706" strokeWidth="2" />
          <line x1="640" y1="414" x2="700" y2="414" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="640" y="440" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#D97706">¼" vertical OK</text>

          {/* ½" beveled */}
          <line x1="720" y1="420" x2="770" y2="420" stroke="#94A3B8" strokeWidth="1.5" />
          <line x1="770" y1="420" x2="778" y2="412" stroke="#D97706" strokeWidth="2" />
          <line x1="778" y1="412" x2="840" y2="412" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="780" y="440" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#D97706">¼"–½" beveled 1:2</text>

          {/* Surface note */}
          <rect x="560" y="460" width="280" height="36" rx="8" fill="#7C3AED" opacity="0.05" stroke="#7C3AED" strokeWidth="1" />
          <text x="700" y="478" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#7C3AED" fontWeight="600">Surface: firm, stable, slip-resistant</text>
          <text x="700" y="490" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#7C3AED">Carpet pile ½" max · Grate openings ½" max</text>

          {/* Callout markers */}
          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.color : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.color}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="510" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'wsFade .25s ease-out' }}>
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
      <style>{`@keyframes wsFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}