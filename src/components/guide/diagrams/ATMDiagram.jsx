import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#707-automatic-teller-machines-and-fare-machines';
const CALLOUTS = [
  { id: 1, label: 'Clear Floor Space', section: '§707.2', color: '#C2410C', textColor: '#8B2E08', x: 120, y: 100, plain: 'A clear floor space of 30 × 48 inches is required for a forward approach to the ATM. The space must be centered on the machine and allow forward reach to all controls and the card slot.', legal: '"A clear floor or ground space complying with §305 shall be provided."', citation: '§707.2' },
  { id: 2, label: 'Operable Parts', section: '§707.3', color: '#16A34A', textColor: '#14532D', x: 350, y: 100, plain: 'All controls must be between 15 and 48 inches above the floor. Input keys must be raised or flush, with 0.025-inch minimum contrast from the background. The numeric keypad must follow standard telephone layout (1-2-3 across the top).', legal: '"Input controls shall be tactilely discernible without activation." Keypad layout: "Numeric keys shall be arranged in a 12-key ascending or descending telephone keypad layout."', citation: '§707.3' },
  { id: 3, label: 'Privacy', section: '§707.4', color: '#2563EB', textColor: '#1E3A8A', x: 580, y: 100, plain: 'If the ATM function requires entering personal information (like a PIN), the machine must provide visual shielding from casual observation. This can be a privacy screen filter, recessed alcove, or side panels.', legal: '"Where personal identification numbers or other personal information is entered, a mechanism to provide visual shielding shall be provided."', citation: '§707.4' },
  { id: 4, label: 'Display Screen', section: '§707.5', color: '#7C3AED', textColor: '#5B21B6', x: 120, y: 340, plain: 'The screen must be visible from a point 40 inches above the center of the clear floor space (seated eye height). Characters must be high contrast, sans-serif font, and sized appropriately for the viewing distance.', legal: '"Characters displayed on the screen shall be in a sans serif font. Characters shall be 3/16 inch high minimum based on the uppercase letter I."', citation: '§707.5' },
  { id: 5, label: 'Speech Output', section: '§707.5', color: '#D97706', textColor: '#78350F', x: 350, y: 340, plain: 'All ATMs must provide speech output that reads the screen aloud. An audio jack (standard 3.5mm) must be provided for privacy when entering PINs. Braille instructions must explain how to initiate speech mode.', legal: '"Machines shall be speech enabled. Operating instructions shall be provided in Braille." Speech: "delivered through a mechanism that is readily available to all users."', citation: '§707.5' },
  { id: 6, label: 'Input Controls', section: '§707.6', color: '#0891B2', textColor: '#0C4A6E', x: 580, y: 340, plain: 'Controls must be operable with one hand and must not require simultaneous actions (like pressing two buttons at once). Function keys must have contrast. Tactile markings are required on at least the "Enter" and "Clear" keys.', legal: '"Input controls shall be operable with one hand and shall not require tight grasping, pinching, or twisting of the wrist." Function keys: contrast ≥ 0.025 inch.', citation: '§707.6' }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function ATMDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§707 ATMs & Fare Machines</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: 28 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="atm-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="atm-title">ADA §707 ATMs & Fare Machines — Front Elevation</title>
          <rect width="900" height="520" fill="#FAFAF9" />
          <text x="320" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">FRONT ELEVATION</text>
          <text x="720" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">PLAN VIEW</text>

          {/* LEFT: Front elevation */}
          {/* Wall */}
          <rect x="160" y="50" width="300" height="400" fill="#94A3B8" opacity="0.04" stroke="#94A3B8" strokeWidth="1" rx="2" />
          {/* Floor */}
          <line x1="80" y1="450" x2="520" y2="450" stroke="#94A3B8" strokeWidth="2" />

          {/* ATM housing */}
          <rect x="230" y="100" width="160" height="300" rx="8" fill="#475569" opacity="0.06" stroke="#475569" strokeWidth="2" />

          {/* Screen */}
          <rect x="255" y="130" width="110" height="80" rx="4" fill="#7C3AED" opacity="0.06" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="310" y="175" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#5B21B6" fontWeight="600">SCREEN</text>

          {/* Privacy shield */}
          <path d="M245,120 L245,220 L240,220" fill="none" stroke="#2563EB" strokeWidth="2" />
          <path d="M375,120 L375,220 L380,220" fill="none" stroke="#2563EB" strokeWidth="2" />
          <text x="310" y="118" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A" fontWeight="600">PRIVACY SHIELD</text>

          {/* Card slot */}
          <rect x="270" y="220" width="80" height="8" rx="2" fill="#475569" opacity="0.15" />
          <text x="310" y="244" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#475569">CARD SLOT</text>

          {/* Keypad */}
          {[0, 1, 2, 3].map(r => [0, 1, 2].map(c => (
            <rect key={`k${r}${c}`} x={272 + c * 24} y={255 + r * 22} width="18" height="16" rx="3" fill="#16A34A" opacity="0.08" stroke="#16A34A" strokeWidth="0.8" />
          )))}
          <text x="310" y="352" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#14532D" fontWeight="600">KEYPAD</text>

          {/* Braille label */}
          <rect x="270" y="360" width="80" height="14" rx="3" fill="#D97706" opacity="0.08" stroke="#D97706" strokeWidth="1" />
          <text x="310" y="370" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5" fill="#78350F" fontWeight="600">BRAILLE / AUDIO JACK</text>

          {/* Cash dispenser */}
          <rect x="270" y="382" width="80" height="12" rx="2" fill="#475569" opacity="0.1" />
          <text x="310" y="391" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5" fill="#475569">CASH DISPENSE</text>

          {/* Height dim: max controls */}
          <line x1="130" y1="130" x2="130" y2="450" stroke="#16A34A" strokeWidth="1" />
          <line x1="124" y1="130" x2="136" y2="130" stroke="#16A34A" strokeWidth="1" />
          <line x1="124" y1="450" x2="136" y2="450" stroke="#16A34A" strokeWidth="1" />
          <rect x="105" y="283" width="52" height="14" rx="3" fill="#16A34A" />
          <text x="131" y="293" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('48', '1220')} max</text>

          {/* Screen visibility line at 40" */}
          <line x1="420" y1="170" x2="500" y2="170" stroke="#7C3AED" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="420" y1="290" x2="500" y2="290" stroke="#7C3AED" strokeWidth="1" strokeDasharray="3 2" />
          <text x="470" y="236" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6" fontWeight="500">Visible from</text>
          <text x="470" y="246" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#5B21B6" fontWeight="500">{d('40', '1015')} eye ht</text>

          {/* Person */}
          <circle cx="310" cy="400" r="8" fill="#475569" opacity="0.12" />
          <rect x="302" y="410" width="16" height="16" rx="2" fill="#475569" opacity="0.08" />
          <circle cx="298" cy="428" r="6" fill="none" stroke="#475569" strokeWidth="1" opacity="0.12" />
          <circle cx="322" cy="428" r="6" fill="none" stroke="#475569" strokeWidth="1" opacity="0.12" />

          {/* RIGHT: Plan view */}
          {/* Wall */}
          <line x1="570" y1="120" x2="870" y2="120" stroke="#94A3B8" strokeWidth="3" />
          <text x="720" y="110" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">WALL</text>

          {/* ATM on wall */}
          <rect x="690" y="124" width="60" height="24" rx="3" fill="#475569" opacity="0.1" stroke="#475569" strokeWidth="1" />
          <text x="720" y="140" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#475569" fontWeight="600">ATM</text>

          {/* Clear floor space */}
          <rect x="640" y="164" width="160" height="200" rx="4" fill="#C2410C" opacity="0.05" stroke="#C2410C" strokeWidth="2" strokeDasharray="6 3" />
          <text x="720" y="270" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#8B2E08" fontWeight="600">CLEAR FLOOR</text>
          <text x="720" y="283" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="9" fill="#8B2E08" fontWeight="600">SPACE</text>

          {/* Width dim */}
          <line x1="640" y1="385" x2="800" y2="385" stroke="#C2410C" strokeWidth="1" />
          <line x1="640" y1="379" x2="640" y2="391" stroke="#C2410C" strokeWidth="1" />
          <line x1="800" y1="379" x2="800" y2="391" stroke="#C2410C" strokeWidth="1" />
          <rect x="692" y="388" width="56" height="14" rx="3" fill="#C2410C" />
          <text x="720" y="398" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('30', '760')} min</text>

          {/* Depth dim */}
          <line x1="820" y1="164" x2="820" y2="364" stroke="#C2410C" strokeWidth="1" />
          <line x1="814" y1="164" x2="826" y2="164" stroke="#C2410C" strokeWidth="1" />
          <line x1="814" y1="364" x2="826" y2="364" stroke="#C2410C" strokeWidth="1" />
          <rect x="828" y="257" width="52" height="14" rx="3" fill="#C2410C" />
          <text x="854" y="267" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('48', '1220')} min</text>

          {/* Speech note */}
          <rect x="570" y="430" width="300" height="40" rx="8" fill="#D97706" opacity="0.05" stroke="#D97706" strokeWidth="1" />
          <text x="720" y="450" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7.5" fill="#78350F" fontWeight="600">Speech output required · 3.5mm audio jack for privacy</text>
          <text x="720" y="464" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#78350F">Braille instructions for initiating speech mode</text>

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
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'atmFade .25s ease-out' }}>
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
      <style>{`@keyframes atmFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}