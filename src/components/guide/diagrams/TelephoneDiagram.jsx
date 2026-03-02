import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#704-telephones';
const CALLOUTS = [
  { id: 1, label: 'Clear Floor Space', section: '§704.2', color: 'var(--section-label)', textColor: '#8B2E08', x: 120, y: 100, plain: 'A clear floor space of 30 × 48 inches is required for a forward approach, centered on the telephone. This provides enough room for a wheelchair user to pull up directly in front of the phone.', legal: '"A clear floor or ground space complying with §305 shall be provided. The clear floor or ground space shall be centered on the telephone."', citation: '§704.2' },
  { id: 2, label: 'Mounting Height', section: '§704.2.1', color: '#15803D', textColor: '#14532D', x: 350, y: 100, plain: 'The highest operable part of the telephone must be no more than 48 inches above the floor for a forward approach, or 54 inches maximum for a side approach. This ensures a seated person can reach all buttons and the handset.', legal: '"The highest operable part of the telephone shall comply with §308 (reach ranges)." Forward: 48" max. Side: 54" max.', citation: '§704.2.1, §308' },
  { id: 3, label: 'Volume Control', section: '§704.3', color: '#2563EB', textColor: '#1E3A8A', x: 580, y: 100, plain: 'Telephones must have a volume control that provides 12 dB of gain minimum above normal. At least one phone per floor must provide 18 dB gain. The phone must automatically reset to default volume after each call. A "Volume" label must be visible.', legal: '"Volume controls shall be on 12 dB above normal. One telephone shall be provided with volume control that provides 18 dB minimum of gain."', citation: '§704.3' },
  { id: 4, label: 'TTY Shelf', section: '§704.4', color: '#7C3AED', textColor: '#5B21B6', x: 120, y: 340, plain: 'Where public phones exist, at least one TTY (text telephone) must be provided per floor or per building. A shelf at least 10 inches deep and 10 inches wide must be provided between 15 and 48 inches above the floor for placing a portable TTY device.', legal: '"Where public telephones are provided, at least one TTY shall be provided per floor." Shelf: "10 inches deep minimum and 10 inches wide minimum."', citation: '§704.4' },
  { id: 5, label: 'Cord Length', section: '§704.3', color: '#92400E', textColor: '#78350F', x: 350, y: 340, plain: 'The telephone handset cord must be at least 29 inches long so a seated user can reach it comfortably. This allows someone in a wheelchair to hold the phone while positioned at the clear floor space.', legal: '"The cord from the telephone to the handset shall be 29 inches long minimum."', citation: '§704.3' }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--section-label)', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted var(--accent)' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function TelephoneDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>§704 Telephones</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: isA ? 'var(--heading)' : 'var(--card-bg)', color: isA ? 'var(--page-bg)' : 'var(--body)', cursor: 'pointer', minHeight: 44 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="tel-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="tel-title">ADA §704 Telephones — Front Elevation & Plan View</title>
          <rect width="900" height="520" fill="var(--page-bg-subtle)" />
          <text x="250" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="var(--body-secondary)" letterSpacing=".08em">FRONT ELEVATION</text>
          <text x="680" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="var(--body-secondary)" letterSpacing=".08em">PLAN VIEW</text>

          {/* LEFT: Front elevation */}
          {/* Wall */}
          <rect x="140" y="40" width="220" height="420" fill="#94A3B8" opacity="0.04" stroke="#94A3B8" strokeWidth="1" rx="2" />
          {/* Floor line */}
          <line x1="60" y1="460" x2="440" y2="460" stroke="#94A3B8" strokeWidth="2" />
          <text x="250" y="478" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="var(--body-secondary)">FLOOR</text>

          {/* Phone unit */}
          <rect x="200" y="160" width="100" height="140" rx="6" fill="#475569" opacity="0.08" stroke="#475569" strokeWidth="1.5" />
          {/* Handset */}
          <rect x="210" y="170" width="20" height="60" rx="8" fill="#475569" opacity="0.15" />
          {/* Keypad */}
          {[0,1,2].map(r => [0,1,2].map(c => (<rect key={`k${r}${c}`} x={240 + c * 16} y={200 + r * 16} width="12" height="10" rx="2" fill="#475569" opacity="0.1" />)))}
          {/* Volume control */}
          <rect x="240" y="260" width="50" height="12" rx="3" fill="#2563EB" opacity="0.15" stroke="#2563EB" strokeWidth="1" />
          <text x="265" y="270" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5" fill="#1E3A8A" fontWeight="600">VOL</text>

          {/* Cord */}
          <path d="M220,230 Q180,290 210,320" fill="none" stroke="#B45309" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x="175" y="290" fontFamily="Manrope, sans-serif" fontSize="6" fill="#78350F" fontWeight="600">{d('29', '735')} min</text>

          {/* TTY shelf */}
          <rect x="170" y="330" width="160" height="10" rx="2" fill="#7C3AED" opacity="0.1" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="250" y="355" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#5B21B6" fontWeight="600">TTY SHELF</text>

          {/* Height dim: max operable part */}
          <line x1="80" y1="160" x2="80" y2="460" stroke="#15803D" strokeWidth="1" />
          <line x1="74" y1="160" x2="86" y2="160" stroke="#15803D" strokeWidth="1" />
          <line x1="74" y1="460" x2="86" y2="460" stroke="#15803D" strokeWidth="1" />
          <rect x="55" y="303" width="52" height="14" rx="3" fill="#15803D" />
          <text x="81" y="313" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('48', '1220')} max</text>

          {/* Shelf height dims */}
          <line x1="380" y1="330" x2="380" y2="460" stroke="#7C3AED" strokeWidth="1" />
          <line x1="374" y1="330" x2="386" y2="330" stroke="#7C3AED" strokeWidth="1" />
          <line x1="374" y1="460" x2="386" y2="460" stroke="#7C3AED" strokeWidth="1" />
          <rect x="388" y="388" width="52" height="14" rx="3" fill="#7C3AED" />
          <text x="414" y="398" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">15–{d('48', '1220')}</text>

          {/* Person in wheelchair */}
          <circle cx="250" cy="395" r="8" fill="#475569" opacity="0.12" />
          <rect x="242" y="405" width="16" height="20" rx="2" fill="#475569" opacity="0.08" />
          <circle cx="238" cy="425" r="7" fill="none" stroke="#475569" strokeWidth="1" opacity="0.12" />
          <circle cx="262" cy="425" r="7" fill="none" stroke="#475569" strokeWidth="1" opacity="0.12" />

          {/* RIGHT: Plan view */}
          {/* Wall */}
          <line x1="520" y1="120" x2="840" y2="120" stroke="#94A3B8" strokeWidth="3" />
          <text x="680" y="110" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="var(--body-secondary)">WALL</text>

          {/* Phone on wall */}
          <rect x="650" y="124" width="60" height="20" rx="3" fill="#475569" opacity="0.1" stroke="#475569" strokeWidth="1" />
          <text x="680" y="138" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#475569" fontWeight="600">PHONE</text>

          {/* Clear floor space */}
          <rect x="600" y="160" width="160" height="200" rx="4" fill="#C2410C" opacity="0.05" stroke="#C2410C" strokeWidth="2" strokeDasharray="6 3" />
          <text x="680" y="265" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#8B2E08" fontWeight="600">CLEAR FLOOR</text>
          <text x="680" y="278" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#8B2E08" fontWeight="600">SPACE</text>

          {/* Width dim */}
          <line x1="600" y1="380" x2="760" y2="380" stroke="#C2410C" strokeWidth="1" />
          <line x1="600" y1="374" x2="600" y2="386" stroke="#C2410C" strokeWidth="1" />
          <line x1="760" y1="374" x2="760" y2="386" stroke="#C2410C" strokeWidth="1" />
          <rect x="652" y="383" width="56" height="14" rx="3" fill="#C2410C" />
          <text x="680" y="393" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('30', '760')} min</text>

          {/* Depth dim */}
          <line x1="780" y1="160" x2="780" y2="360" stroke="#C2410C" strokeWidth="1" />
          <line x1="774" y1="160" x2="786" y2="160" stroke="#C2410C" strokeWidth="1" />
          <line x1="774" y1="360" x2="786" y2="360" stroke="#C2410C" strokeWidth="1" />
          <rect x="788" y="253" width="52" height="14" rx="3" fill="#C2410C" />
          <text x="814" y="263" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('48', '1220')} min</text>

          {/* TTY shelf plan */}
          <rect x="620" y="144" width="120" height="16" rx="2" fill="#7C3AED" opacity="0.08" stroke="#7C3AED" strokeWidth="1" />
          <text x="680" y="155" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#5B21B6" fontWeight="600">SHELF: {d('10', '255')}×{d('10', '255')} min</text>

          {/* Volume note */}
          <rect x="520" y="430" width="320" height="30" rx="6" fill="#2563EB" opacity="0.05" stroke="#2563EB" strokeWidth="1" />
          <text x="680" y="449" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fill="#1E3A8A" fontWeight="600">Volume: 12 dB min gain · 18 dB on at least one per floor</text>

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="510" fontFamily="Manrope, sans-serif" fontSize="9" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'telFade .25s ease-out' }}>
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
            <aside style={{ flex: '1 1 40%', minWidth: 0 }}><div style={{ background: 'var(--card-bg-tinted)', borderLeft: '3px solid var(--accent)', borderRadius: '0 10px 10px 0', padding: '16px 18px' }}>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--body-secondary)', margin: '0 0 8px' }}>Official Standard — {parseCite(ac.citation)}</p>
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>{parseCite(ac.legal)}</p>
            </div></aside>
          </div>
        </div>
      )}
      <style>{`@keyframes telFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}