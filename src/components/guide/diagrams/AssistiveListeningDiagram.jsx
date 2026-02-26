import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#706-assistive-listening-systems';
const CALLOUTS = [
  { id: 1, label: 'System Types', section: '§706.2', color: '#C2410C', textColor: '#8B2E08', x: 120, y: 100, plain: 'Assistive listening systems may use induction loop, FM, infrared, or digital technology. Induction loop is preferred for hearing aid users because it works directly with the T-coil in hearing aids — no separate receiver needed. FM and infrared require handheld receivers.', legal: '"Assistive listening systems shall comply with §706." Systems include induction loop, FM, infrared, or other approved technologies.', citation: '§706.2' },
  { id: 2, label: 'Signal-to-Noise Ratio', section: '§706.3', color: '#16A34A', textColor: '#14532D', x: 350, y: 100, plain: 'The system must provide a minimum 18 dB signal-to-noise ratio improvement. This ensures that spoken audio is clearly audible above ambient background noise. The system must cover the entire seating area uniformly.', legal: '"The signal-to-noise ratio for the assistive listening system shall be not less than 18 dB." Coverage area must be the entire seating area.', citation: '§706.3' },
  { id: 3, label: 'Receivers', section: '§706.2', color: '#2563EB', textColor: '#1E3A8A', x: 580, y: 100, plain: 'The number of receivers is based on the seating capacity (per §219.3 table). At least 25% of receivers must be hearing-aid compatible (neckloops that work with T-coils). The remaining 75% can be standard receivers with earbuds or headphones.', legal: '"At least 25 percent, but no fewer than two, of the receivers shall be hearing-aid compatible." Remaining receivers: standard earbuds/headphones.', citation: '§706.2, §219.3' },
  { id: 4, label: 'Signage', section: '§706.4', color: '#7C3AED', textColor: '#5B21B6', x: 120, y: 340, plain: 'The International Symbol of Access for Hearing Loss must be posted at each assembly area where an assistive listening system is provided. The sign must indicate that the system is available and where to obtain receivers.', legal: '"Each assembly area required to provide an assistive listening system shall provide signs informing patrons of the availability of the system." Sign: International Symbol of Access for Hearing Loss per §703.7.2.4.', citation: '§706.4' },
  { id: 5, label: 'Scoping', section: '§219.2', color: '#D97706', textColor: '#78350F', x: 350, y: 340, plain: 'Assistive listening systems are required in assembly areas with audio amplification. Areas with 50 or more fixed seats must follow the scoping table. Courtrooms always require them. Areas under 50 seats are generally not required to have ALS unless audio amplification is integral to the space\'s use.', legal: '§219.2: "In each assembly area where audible communication is integral to the use of the space, an assistive listening system shall be provided." Scoping per Table 219.3.', citation: '§219.2' }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function AssistiveListeningDiagram() {
  const [active, setActive] = useState(null);
  const panelRef = useRef(null);
  const toggle = useCallback(id => setActive(p => p === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const ac = CALLOUTS.find(c => c.id === active);

  return (
    <div className="ada-diagram-wrap" style={{ margin: '32px 0' }}>
      <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 8px' }}>§706 Assistive Listening Systems</h3>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="als-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="als-title">ADA §706 Assistive Listening Systems — Assembly Area Cutaway</title>
          <rect width="900" height="520" fill="#FAFAF9" />
          <text x="450" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">ASSEMBLY AREA — ASSISTIVE LISTENING COVERAGE</text>

          {/* Stage */}
          <rect x="250" y="60" width="400" height="80" rx="6" fill="#475569" opacity="0.06" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="450" y="105" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#4B5563" fontWeight="600">STAGE / SPEAKER AREA</text>
          {/* Podium */}
          <rect x="420" y="80" width="60" height="40" rx="4" fill="#475569" opacity="0.1" stroke="#475569" strokeWidth="1" />
          <text x="450" y="105" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#475569">PODIUM</text>

          {/* Induction loop zone */}
          <rect x="100" y="160" width="700" height="260" rx="12" fill="#C2410C" opacity="0.03" stroke="#C2410C" strokeWidth="2" strokeDasharray="8 4" />
          <text x="450" y="185" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#8B2E08" fontWeight="600">INDUCTION LOOP / COVERAGE ZONE</text>

          {/* Seating rows */}
          {[0, 1, 2, 3, 4].map(row => (
            <g key={row}>
              {Array.from({ length: 12 }, (_, i) => (
                <rect key={i} x={155 + i * 50} y={200 + row * 40} width="36" height="24" rx="4" fill="#94A3B8" opacity="0.06" stroke="#94A3B8" strokeWidth="0.8" />
              ))}
            </g>
          ))}
          <text x="130" y="290" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563" transform="rotate(-90, 130, 290)">SEATING ROWS</text>

          {/* Signal waves from stage */}
          {[1, 2, 3].map(i => (
            <path key={i} d={`M450,130 Q${450 + i * 60},${130 + i * 20} ${450 + i * 80},${200 + i * 30}`} fill="none" stroke="#16A34A" strokeWidth="1" opacity={0.4 - i * 0.1} strokeDasharray="4 3" />
          ))}
          {[1, 2, 3].map(i => (
            <path key={`l${i}`} d={`M450,130 Q${450 - i * 60},${130 + i * 20} ${450 - i * 80},${200 + i * 30}`} fill="none" stroke="#16A34A" strokeWidth="1" opacity={0.4 - i * 0.1} strokeDasharray="4 3" />
          ))}
          <text x="450" y="152" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#14532D" fontWeight="600">18 dB S/N ratio min</text>

          {/* Receiver station */}
          <rect x="730" y="440" width="140" height="50" rx="8" fill="#2563EB" opacity="0.05" stroke="#2563EB" strokeWidth="1" />
          <text x="800" y="460" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A" fontWeight="600">RECEIVER STATION</text>
          <text x="800" y="474" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A">25% hearing-aid compatible</text>
          <text x="800" y="484" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A">75% standard earbuds</text>

          {/* Signage */}
          <rect x="60" y="440" width="120" height="50" rx="8" fill="#7C3AED" opacity="0.05" stroke="#7C3AED" strokeWidth="1" />
          <text x="120" y="460" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#5B21B6" fontWeight="600">POSTED SIGNAGE</text>
          <text x="120" y="474" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6">International Symbol of</text>
          <text x="120" y="484" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6">Access for Hearing Loss</text>

          {/* Hearing aid icon */}
          <circle cx="320" cy="310" r="10" fill="#C2410C" opacity="0.08" stroke="#C2410C" strokeWidth="1" />
          <text x="320" y="314" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#8B2E08">T</text>
          <text x="340" y="314" fontFamily="Manrope, sans-serif" fontSize="6" fill="#8B2E08">T-coil</text>

          {/* Headphone icon */}
          <circle cx="520" cy="310" r="10" fill="#2563EB" opacity="0.08" stroke="#2563EB" strokeWidth="1" />
          <text x="520" y="314" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A">🎧</text>
          <text x="540" y="314" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A">Receiver</text>

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.color : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="510" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'alsFade .25s ease-out' }}>
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
      <style>{`@keyframes alsFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}