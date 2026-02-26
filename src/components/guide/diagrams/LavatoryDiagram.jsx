import React, { useState, useRef, useEffect, useCallback } from 'react';

const LAV_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#606-lavatories-and-sinks';

const CALLOUTS = [
  {
    id: 1, label: 'Height', section: '§606.3', color: '#C2410C',
    x: 100, y: 42,
    plain: 'The rim or counter surface of the lavatory must be no higher than 34 inches above the finish floor. This height allows a wheelchair user to reach the faucet and use the sink comfortably from a seated position. If a counter surrounds the bowl, the measurement is taken from the higher of the rim or the counter surface — whichever is taller governs.',
    legal: '"Lavatories and sinks shall be installed with the front of the higher of the rim or counter surface 34 inches maximum above the finish floor or ground."',
    citation: '§606.3'
  },
  {
    id: 2, label: 'Clear Floor Space', section: '§606.2', color: '#16A34A',
    x: 300, y: 42,
    plain: 'A clear floor space of 30 × 48 inches must be provided, centered on the lavatory and positioned for a forward approach. The clear space extends from the front edge of the lavatory outward 48 inches. Knee and toe clearance must be provided underneath the lavatory so the wheelchair user can pull up directly to the basin. The floor must be level (max 1:48 slope) and slip-resistant.',
    legal: '"A clear floor space complying with §305, positioned for a forward approach, shall be provided." §305.3: "30 inches minimum by 48 inches minimum." Knee and toe clearance per §306 is required.',
    citation: '§606.2'
  },
  {
    id: 3, label: 'Knee Clearance', section: '§606.2 / §306', color: '#2563EB',
    x: 100, y: 195,
    plain: 'Under the lavatory, there must be knee clearance at least 27 inches high, 30 inches wide, and 8 inches deep (measured from the front edge of the lavatory back toward the wall). The clearance envelope slopes: at 27 inches above the floor you need at least 8 inches of depth, and the depth can increase as you go lower. At 9 inches above the floor, the maximum depth is 25 inches. This sloped profile matches the shape of a seated person\'s legs.',
    legal: '"Knee clearance shall be 27 inches high minimum, 30 inches wide minimum, and 8 inches deep minimum." Per §306.3 the clearance tapers: 27 inches high at 8 inches deep, reducing to 9 inches high at up to 25 inches deep.',
    citation: '§306.3'
  },
  {
    id: 4, label: 'Toe Clearance', section: '§306.2', color: '#7C3AED',
    x: 300, y: 195,
    plain: 'Below the knee clearance zone (from the floor up to 9 inches), toe clearance must extend at least 17 inches deep from the front edge and can extend up to 25 inches maximum. The toe space must be 30 inches wide minimum. This allows the footrests of a wheelchair to slide under the lavatory. The space must be free of any pipes, valves, or structural elements that would block the wheelchair\'s footrests.',
    legal: '"Toe clearance shall extend 17 inches minimum under an element." §306.2 "Space under an element between the finish floor and 9 inches above the finish floor shall be considered toe clearance." Maximum depth: 25 inches.',
    citation: '§306.2'
  },
  {
    id: 5, label: 'Faucets', section: '§606.4', color: '#D97706',
    x: 500, y: 70,
    plain: 'Faucet controls must be operable with one hand and must not require tight grasping, pinching, or twisting of the wrist. Lever handles, push-type controls, and touch/sensor-activated faucets all comply. Traditional round knobs do not. If the faucet has a self-closing (metering) valve, it must remain open for at least 10 seconds to give the user enough time to wash their hands.',
    legal: '"Faucets shall comply with §309." §309.4: "Operable with one hand… shall not require tight grasping, pinching, or twisting of the wrist. The force required to activate operable parts shall be 5 pounds maximum." Self-closing faucets: "remain open for 10 seconds minimum."',
    citation: '§606.4'
  },
  {
    id: 6, label: 'Pipe Protection', section: '§606.5', color: '#DB2777',
    x: 500, y: 195,
    plain: 'Hot water supply pipes and drain pipes under the lavatory must be insulated or otherwise configured to protect against contact. A wheelchair user\'s legs are directly under the sink and may have reduced sensation — exposed hot pipes can cause serious burns without the person feeling it. Protection covers (pipe wraps or molded covers) must be smooth with no sharp or abrasive surfaces that could injure skin or snag clothing.',
    legal: '"Water supply and drain pipes under lavatories and sinks shall be insulated or otherwise configured to protect against contact. There shall be no sharp or abrasive surfaces under lavatories and sinks."',
    citation: '§606.5'
  },
  {
    id: 7, label: 'Exposed Pipes', section: '§606.5', color: '#0EA5E9',
    x: 700, y: 130,
    plain: 'Pipe protection covers must not reduce the required knee and toe clearance underneath. If bulky insulation or covers take up too much space, the lavatory must be adjusted (raised higher or moved farther from the wall) to maintain clearances. Covers must be securely attached so they don\'t shift or come loose over time. All surfaces within the clearance zone must remain smooth and free of sharp edges.',
    legal: '"Water supply and drain pipes under lavatories and sinks shall be insulated or otherwise configured to protect against contact." Covers must not reduce knee/toe clearance per §306. Must be securely attached.',
    citation: '§606.5'
  }
];

function makeLink(text) {
  return (
    <a href={LAV_URL} target="_blank" rel="noopener noreferrer"
      style={{ color: '#C2410C', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}
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

export default function LavatoryDiagram() {
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

  const d = (inches, mm) => metric ? `${mm} mm` : `${inches}"`;
  const ac = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§606 Lavatories & Sinks</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => {
            const isA = u === 'Metric' ? metric : !metric;
            return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: '28px' }}>{u}</button>);
          })}
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 900 320" role="img" aria-labelledby="lav-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="lav-title">ADA §606 Lavatory — Front Elevation and Side Section</title>
          <rect x="0" y="0" width="900" height="320" fill="#FAFAF9" />

          {/* ===== LEFT: FRONT ELEVATION ===== */}
          <text x="200" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">FRONT ELEVATION</text>

          {/* Wall */}
          <rect x="80" y="40" width="240" height="8" fill="#94A3B8" rx="1" />
          <text x="200" y="36" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563">WALL</text>

          {/* Counter/rim at 34" — y=108 (floor at y=280) */}
          <rect x="100" y="105" width="200" height="10" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Bowl */}
          <ellipse cx="200" cy="115" rx="60" ry="20" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Faucet */}
          <rect x="190" y="95" width="20" height="12" rx="3" fill="#D97706" opacity="0.2" stroke="#D97706" strokeWidth="1" />
          <circle cx="200" cy="92" r="4" fill="#D97706" opacity="0.3" />
          <text x="200" y="86" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#D97706" fontWeight="600">FAUCET</text>

          {/* Pipes underneath */}
          <line x1="180" y1="135" x2="180" y2="240" stroke="#DB2777" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
          <line x1="220" y1="135" x2="220" y2="250" stroke="#DB2777" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
          <rect x="170" y="140" width="60" height="110" rx="4" fill="#DB2777" opacity="0.04" stroke="#DB2777" strokeWidth="1" strokeDasharray="4 3" />
          <text x="200" y="200" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#DB2777" fontWeight="600">PIPE COVERS</text>

          {/* Knee clearance zone */}
          <rect x="108" y="108" width="184" height="134" rx="2" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" strokeDasharray="5 3" />
          <text x="200" y="165" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#2563EB" fontWeight="600">KNEE CLEARANCE</text>
          <text x="200" y="176" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#2563EB">{d('27', '685')} high × {d('30', '760')} wide min</text>

          {/* Toe clearance zone */}
          <rect x="108" y="242" width="184" height="38" rx="2" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1" strokeDasharray="5 3" />
          <text x="200" y="265" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#7C3AED" fontWeight="600">TOE CLEARANCE (below {d('9', '230')})</text>

          {/* Floor */}
          <line x1="60" y1="280" x2="340" y2="280" stroke="#94A3B8" strokeWidth="2" />

          {/* 34" height dim */}
          <line x1="68" y1="108" x2="68" y2="280" stroke="#C2410C" strokeWidth="1" />
          <line x1="60" y1="108" x2="76" y2="108" stroke="#C2410C" strokeWidth="1" />
          <line x1="60" y1="280" x2="76" y2="280" stroke="#C2410C" strokeWidth="1" />
          <rect x="44" y="186" width="44" height="13" rx="3" fill="#C2410C" />
          <text x="66" y="195" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('34', '865')}</text>

          {/* 27" knee height dim */}
          <line x1="320" y1="146" x2="320" y2="280" stroke="#2563EB" strokeWidth="1" />
          <line x1="314" y1="146" x2="326" y2="146" stroke="#2563EB" strokeWidth="1" />
          <line x1="314" y1="280" x2="326" y2="280" stroke="#2563EB" strokeWidth="1" />
          <rect x="328" y="206" width="40" height="13" rx="3" fill="#2563EB" />
          <text x="348" y="215" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('27', '685')}</text>


          {/* ===== DIVIDER ===== */}
          <line x1="420" y1="20" x2="420" y2="310" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />


          {/* ===== RIGHT: SIDE SECTION ===== */}
          <text x="660" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing="0.08em">SIDE SECTION</text>

          {/* Wall */}
          <rect x="460" y="40" width="8" height="240" fill="#94A3B8" rx="1" />
          <text x="464" y="36" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563">WALL</text>

          {/* Counter/rim */}
          <rect x="468" y="108" width="120" height="8" rx="2" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Bowl profile */}
          <path d="M 490 116 Q 510 145 560 145 Q 580 145 588 116" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />

          {/* Pipes */}
          <line x1="530" y1="145" x2="530" y2="240" stroke="#DB2777" strokeWidth="2.5" opacity="0.3" />
          <rect x="522" y="148" width="16" height="90" rx="3" fill="#DB2777" opacity="0.04" stroke="#DB2777" strokeWidth="0.8" strokeDasharray="3 2" />

          {/* Knee clearance envelope — sloped profile */}
          <path d="M 588 108 L 588 152 L 520 236 L 468 236 L 468 108 Z" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" strokeDasharray="5 3" />
          <text x="520" y="180" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#2563EB" fontWeight="600">KNEE</text>

          {/* Toe clearance */}
          <rect x="468" y="248" width="140" height="32" rx="2" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1" strokeDasharray="5 3" />
          <text x="538" y="268" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#7C3AED" fontWeight="600">TOE ({d('9', '230')} high, {d('17–25', '430–635')} deep)</text>

          {/* Floor */}
          <line x1="440" y1="280" x2="870" y2="280" stroke="#94A3B8" strokeWidth="2" />

          {/* Wheelchair user silhouette (simplified) */}
          {/* Rear wheel */}
          <circle cx="720" cy="260" r="22" fill="none" stroke="#64748B" strokeWidth="1.5" />
          {/* Front caster */}
          <circle cx="770" cy="272" r="7" fill="none" stroke="#64748B" strokeWidth="1.2" />
          {/* Frame */}
          <line x1="715" y1="238" x2="770" y2="238" stroke="#64748B" strokeWidth="2" />
          <line x1="715" y1="238" x2="708" y2="258" stroke="#64748B" strokeWidth="1.5" />
          <line x1="770" y1="238" x2="770" y2="264" stroke="#64748B" strokeWidth="1.5" />
          {/* Backrest */}
          <line x1="715" y1="238" x2="712" y2="208" stroke="#64748B" strokeWidth="2" />
          {/* Person */}
          <line x1="725" y1="236" x2="720" y2="200" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="720" cy="190" r="8" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
          {/* Arms reaching to lavatory */}
          <line x1="722" y1="212" x2="590" y2="115" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          {/* Footrest under lavatory */}
          <line x1="755" y1="272" x2="770" y2="272" stroke="#64748B" strokeWidth="1.5" />
          {/* Arrow showing knees going under */}
          <path d="M 760 260 L 600 260" fill="none" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" markerEnd="url(#lavArrow)" />

          <defs>
            <marker id="lavArrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill="#2563EB" opacity="0.5" />
            </marker>
          </defs>

          {/* 8" knee depth dim */}
          <line x1="588" y1="118" x2="468" y2="118" stroke="#2563EB" strokeWidth="0.8" opacity="0.5" />
          <rect x="510" y="120" width="54" height="12" rx="3" fill="#2563EB" opacity="0.85" />
          <text x="537" y="129" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('8', '205')} min depth</text>

          {/* 34" height */}
          <line x1="446" y1="108" x2="446" y2="280" stroke="#C2410C" strokeWidth="1" />
          <line x1="440" y1="108" x2="452" y2="108" stroke="#C2410C" strokeWidth="1" />
          <line x1="440" y1="280" x2="452" y2="280" stroke="#C2410C" strokeWidth="1" />
          <rect x="426" y="186" width="36" height="12" rx="3" fill="#C2410C" />
          <text x="444" y="195" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('34', '865')}</text>

          {/* Clear floor space note */}
          <rect x="660" y="282" width="140" height="24" rx="4" fill="#16A34A" opacity="0.06" stroke="#16A34A" strokeWidth="1" strokeDasharray="4 3" />
          <text x="730" y="297" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#16A34A" fontWeight="600">Clear floor: {d('30', '760')} × {d('48', '1220')}</text>


          {/* CALLOUT DOTS */}
          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label} — ${c.section}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && (<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>)}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.color : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.color}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="310" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>

      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>

      {ac && (
        <div ref={panelRef} style={{ marginTop: '12px', background: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden', animation: 'lavFade 0.25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--slate-200)', background: '#FAFAF9', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '26px', height: '26px', borderRadius: '50%', background: ac.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{ac.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>{ac.label}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: ac.color, background: `${ac.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{ac.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close panel" style={{ background: 'none', border: '1px solid var(--slate-200)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-600)', minHeight: '44px' }}>Close <span aria-hidden="true">✕</span></button>
          </div>
          <div className="guide-two-col" style={{ padding: '20px', gap: '24px', margin: 0 }}>
            <div style={{ flex: '1 1 55%', minWidth: 0 }}><p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem', color: 'var(--slate-700)', lineHeight: 1.75, margin: 0 }}>{ac.plain}</p></div>
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: '#FFFBF7', borderLeft: '3px solid #C2410C', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--slate-500)', margin: '0 0 8px' }}>Official Standard — {parseCitations(ac.citation)}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCitations(ac.legal)}</p>
            </div></aside>
          </div>
        </div>
      )}
      <style>{`@keyframes lavFade { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}