import React, { useState, useRef, useEffect, useCallback } from 'react';

const STD_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#809-residential-dwelling-units';
const CALLOUTS = [
  { id: 1, label: 'Accessible Route Within Unit', section: '§809.2', color: '#C2410C', x: 120, y: 100, plain: 'An accessible route at least 36 inches wide must connect all rooms and spaces within the dwelling unit — from the entry door through hallways, to the bedroom, bathroom, kitchen, and living area. Thresholds must be ½ inch maximum height.', legal: '"Accessible routes within residential dwelling units shall comply with §402." Thresholds: "½ inch high maximum."', citation: '§809.2' },
  { id: 2, label: 'Kitchen', section: '§809.3', color: '#16A34A', x: 350, y: 100, plain: 'Clearance between opposing counters must be 40 inches minimum (60 inches for U-shaped kitchens). At least one work surface must be 34 inches maximum height with knee clearance underneath. Sink and cooktop controls must be accessible.', legal: '"Kitchens shall comply with §804." Clearance: "40 inches minimum between opposing base cabinets, countertops, appliances, or walls." U-shaped: 60 inches for turning.', citation: '§809.3, §804' },
  { id: 3, label: 'Bathroom', section: '§809.4', color: '#2563EB', x: 580, y: 100, plain: 'Walls must be reinforced for future grab bar installation at the toilet, tub, and shower. Clear floor space is required at the toilet, tub/shower, and lavatory. Either a roll-in shower or a tub with fold-down seat must be provided.', legal: '"Bathrooms shall comply with §603." Reinforcement: walls must support future installation of grab bars per §604, §607, §608.', citation: '§809.4, §603' },
  { id: 4, label: 'Controls & Outlets', section: '§809.5', color: '#7C3AED', x: 120, y: 340, plain: 'Light switches, electrical outlets, thermostats, and other environmental controls must be between 15 and 48 inches above the floor. All must be operable with one hand and not require tight grasping or twisting. This includes the circuit breaker panel.', legal: '"Lighting controls, electrical switches, and receptacle outlets, as well as environmental controls, shall comply with §309." Reach: 15"–48".', citation: '§809.5, §309' },
  { id: 5, label: 'Clear Floor Space at Bed', section: '§806.2.3', color: '#D97706', x: 350, y: 340, plain: 'A clear floor space at least 30 inches wide must be provided on both sides of the bed (or one side in some single-bed configurations). The clear space must connect to the accessible route within the unit.', legal: '"Clear floor space 36 inches wide minimum shall be provided along both sides of a bed." Clear space connects to accessible route per §402.', citation: '§806.2.3' }
];

function makeLink(t) { return (<a href={STD_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function ResidentialUnitDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§809 Residential Dwelling Units</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: 28 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" role="img" aria-labelledby="res-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="res-title">ADA §809 Residential Dwelling Units — Plan View</title>
          <rect width="900" height="520" fill="#FAFAF9" />
          <text x="450" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#94A3B8" letterSpacing=".08em">ACCESSIBLE DWELLING UNIT — PLAN VIEW</text>

          {/* Unit outline */}
          <rect x="60" y="50" width="780" height="440" fill="white" stroke="#94A3B8" strokeWidth="2" rx="4" />

          {/* Entry door */}
          <rect x="60" y="230" width="10" height="50" fill="#C2410C" opacity="0.15" />
          <text x="50" y="260" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="7" fill="#C2410C" fontWeight="600">ENTRY</text>

          {/* Hallway / accessible route */}
          <rect x="70" y="230" width="200" height="50" fill="#C2410C" opacity="0.03" stroke="#C2410C" strokeWidth="1" strokeDasharray="4 3" />
          <text x="170" y="260" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#C2410C" fontWeight="600">ROUTE — {d('36', '915')} min</text>

          {/* Kitchen */}
          <rect x="280" y="55" width="260" height="180" fill="#16A34A" opacity="0.03" stroke="#16A34A" strokeWidth="1.5" rx="4" />
          <text x="410" y="80" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#16A34A" fontWeight="700">KITCHEN</text>
          {/* Counter top */}
          <rect x="290" y="90" width="240" height="15" rx="2" fill="#16A34A" opacity="0.08" />
          <text x="410" y="101" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#16A34A">COUNTER — {d('34', '865')} max work surface</text>
          {/* Clearance */}
          <line x1="290" y1="105" x2="290" y2="200" stroke="#16A34A" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="530" y1="105" x2="530" y2="200" stroke="#16A34A" strokeWidth="1" strokeDasharray="3 2" />
          <text x="410" y="160" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#16A34A">{d('40', '1015')} min clearance</text>
          {/* Sink */}
          <rect x="380" y="195" width="60" height="30" rx="4" fill="#16A34A" opacity="0.06" stroke="#16A34A" strokeWidth="1" />
          <text x="410" y="214" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#16A34A">SINK</text>

          {/* Bathroom */}
          <rect x="560" y="55" width="270" height="180" fill="#2563EB" opacity="0.03" stroke="#2563EB" strokeWidth="1.5" rx="4" />
          <text x="695" y="80" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#2563EB" fontWeight="700">BATHROOM</text>
          {/* Toilet */}
          <rect x="580" y="110" width="40" height="50" rx="6" fill="#2563EB" opacity="0.06" stroke="#2563EB" strokeWidth="1" />
          <text x="600" y="140" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5" fill="#2563EB">WC</text>
          {/* Grab bars */}
          <line x1="577" y1="115" x2="577" y2="155" stroke="#2563EB" strokeWidth="2.5" opacity="0.2" />
          <line x1="583" y1="107" x2="617" y2="107" stroke="#2563EB" strokeWidth="2.5" opacity="0.2" />
          {/* Roll-in shower */}
          <rect x="660" y="100" width="80" height="80" rx="4" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 2" />
          <text x="700" y="145" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#2563EB">ROLL-IN</text>
          <text x="700" y="155" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#2563EB">SHOWER</text>
          {/* Lav */}
          <rect x="770" y="110" width="50" height="35" rx="10" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" />
          <text x="795" y="131" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5" fill="#2563EB">LAV</text>

          {/* Bedroom */}
          <rect x="280" y="260" width="260" height="220" fill="#D97706" opacity="0.03" stroke="#D97706" strokeWidth="1.5" rx="4" />
          <text x="410" y="285" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#D97706" fontWeight="700">BEDROOM</text>
          {/* Bed */}
          <rect x="330" y="310" width="160" height="120" rx="6" fill="#D97706" opacity="0.06" stroke="#D97706" strokeWidth="1" />
          <text x="410" y="375" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#D97706">BED</text>
          {/* Clear space both sides */}
          <rect x="290" y="310" width="36" height="120" rx="2" fill="#D97706" opacity="0.05" stroke="#D97706" strokeWidth="1" strokeDasharray="3 2" />
          <text x="308" y="375" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5" fill="#D97706" transform="rotate(-90,308,375)">{d('36', '915')} min</text>
          <rect x="494" y="310" width="36" height="120" rx="2" fill="#D97706" opacity="0.05" stroke="#D97706" strokeWidth="1" strokeDasharray="3 2" />
          <text x="512" y="375" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5" fill="#D97706" transform="rotate(-90,512,375)">{d('36', '915')} min</text>

          {/* Living area */}
          <rect x="560" y="260" width="270" height="220" fill="#94A3B8" opacity="0.03" stroke="#94A3B8" strokeWidth="1" rx="4" />
          <text x="695" y="370" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#94A3B8" fontWeight="600">LIVING AREA</text>

          {/* Controls marker */}
          <rect x="68" y="140" width="8" height="8" rx="2" fill="#7C3AED" stroke="#7C3AED" strokeWidth="1" />
          <text x="84" y="148" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#7C3AED">switch</text>
          <rect x="68" y="340" width="8" height="8" rx="2" fill="#7C3AED" stroke="#7C3AED" strokeWidth="1" />
          <text x="84" y="348" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#7C3AED">outlet</text>
          <rect x="830" y="440" width="8" height="8" rx="2" fill="#7C3AED" stroke="#7C3AED" strokeWidth="1" />
          <text x="824" y="448" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#7C3AED">thermostat</text>

          {/* Route arrows */}
          <defs><marker id="resArr" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto"><polygon points="0 0,7 2.5,0 5" fill="#C2410C" /></marker></defs>
          <line x1="270" y1="255" x2="320" y2="255" stroke="#C2410C" strokeWidth="1.5" markerEnd="url(#resArr)" />
          <line x1="270" y1="255" x2="270" y2="150" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="270" y1="150" x2="320" y2="150" stroke="#C2410C" strokeWidth="1.5" markerEnd="url(#resArr)" />
          <line x1="270" y1="150" x2="270" y2="100" stroke="#C2410C" strokeWidth="1.5" />
          <line x1="270" y1="100" x2="570" y2="100" stroke="#C2410C" strokeWidth="1.5" markerEnd="url(#resArr)" />
          <line x1="270" y1="255" x2="270" y2="370" stroke="#C2410C" strokeWidth="1.5" markerEnd="url(#resArr)" />

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.color : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.color}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="510" fontFamily="Manrope, sans-serif" fontSize="9" fill="#94A3B8">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'resFade .25s ease-out' }}>
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
      <style>{`@keyframes resFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}