import React, { useState, useRef, useEffect, useCallback } from 'react';

const DF_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#602-drinking-fountains';
const CALLOUTS = [
  { id: 1, label: 'Wheelchair Height', section: '§602.4', color: '#C2410C', textColor: '#8B2E08', x: 100, y: 42,
    plain: 'The spout of the wheelchair-accessible fountain must be no higher than 36 inches above the finish floor. The spout must be at the front of the unit and the water flow must be at least 4 inches high to allow insertion of a cup or bottle. The spout direction must be nearly parallel to the front of the unit so a person in a wheelchair can drink without tilting their head awkwardly.',
    legal: '"Spout outlets of drinking fountains for wheelchair users shall be 36 inches maximum above the finish floor or ground." Water flow: "4 inches high minimum."', citation: '§602.4' },
  { id: 2, label: 'Standing Height', section: '§602.5', color: '#15803D', textColor: '#14532D', x: 300, y: 42,
    plain: 'The standing-height fountain has a spout between 38 and 43 inches above the floor. This serves people who have difficulty bending down — including many elderly individuals and people with back or joint conditions. A clear floor space for a parallel approach (30 × 48 inches alongside) must be provided.',
    legal: '"Spout outlets of drinking fountains for standing persons shall be 38 inches minimum and 43 inches maximum above the finish floor."', citation: '§602.5' },
  { id: 3, label: 'Knee Clearance', section: '§602.4 / §306', color: '#2563EB', textColor: '#1E3A8A', x: 500, y: 42,
    plain: 'The wheelchair-height fountain must provide knee and toe clearance underneath for a forward approach. Knee clearance: 27 inches high minimum, 8 inches deep minimum at that height. Toe clearance below 9 inches. All pipes must be insulated to prevent burns. The clearance space must be 30 inches wide minimum.',
    legal: '"Drinking fountains for wheelchair users shall have knee clearance complying with §306." 27 inches high, 8 inches deep at knee, insulated pipes.', citation: '§306' },
  { id: 4, label: 'Clear Floor Space', section: '§602.2', color: '#7C3AED', textColor: '#5B21B6', x: 100, y: 260,
    plain: 'Wheelchair fountain: 30 × 48 inches, forward approach, centered on the unit. Standing fountain: 30 × 48 inches, parallel approach, alongside the unit. For a hi-lo unit, both clear floor spaces may overlap. The floor must be level (max 1:48 slope) and slip-resistant.',
    legal: '"A clear floor space complying with §305, positioned for a forward approach, shall be provided." Standing: parallel approach. Floor per §302.', citation: '§602.2' },
  { id: 5, label: 'Flow & Controls', section: '§602.6', color: '#92400E', textColor: '#78350F', x: 300, y: 260,
    plain: 'Water flow must be at least 4 inches high to allow a cup or bottle to be filled. Controls must be front-mounted or side-mounted on the front half of the unit. They must be operable with one hand with no more than 5 pounds of force, and must not require tight grasping, pinching, or twisting. Push-button and lever controls comply; twist knobs do not.',
    legal: '"The spout shall provide a flow of water 4 inches high minimum." Controls: "comply with §309… operable with one hand, 5 pounds maximum force."', citation: '§602.6' },
  { id: 6, label: 'Scoping', section: '§211', color: '#BE185D', textColor: '#9D174D', x: 500, y: 260,
    plain: 'Where drinking fountains are provided on a floor, at least two must be offered: one at wheelchair height and one at standing height. A single hi-lo unit satisfies both requirements. If only one fountain exists on a floor, it must be the wheelchair-accessible type. In exterior sites, at least one of each type per cluster.',
    legal: '§211.2 "Where drinking fountains are provided… no fewer than two shall be provided." One at wheelchair height per §602.4, one at standing height per §602.5.', citation: '§211' },
  { id: 7, label: 'Bottle Fillers', section: 'Advisory', color: '#0E7490', textColor: '#0C4A6E', x: 700, y: 150,
    plain: 'Bottle filler stations are increasingly common. If provided in addition to drinking fountains, accessible bottle fillers should be at wheelchair height with clear floor space for a forward approach. A bottle filler alone does not substitute for an accessible drinking fountain — both must be provided if fountains are required. Controls must be operable with one hand.',
    legal: 'Advisory: Bottle fillers provided in addition to fountains should comply with reach range and clear floor space requirements. Not a substitute for accessible drinking fountains.', citation: '§602' }
];

function makeLink(t) { return (<a href={DF_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function DrinkingFountainDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--heading)', margin: 0 }}>§602 Drinking Fountains</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: isA ? 'var(--dark-bg)' : 'white', color: isA ? 'white' : 'var(--body)', cursor: 'pointer', minHeight: 44 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 420" role="img" aria-labelledby="df-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="df-title">ADA §602 Drinking Fountains — Side Elevation</title>
          <rect width="900" height="420" fill="var(--page-bg-subtle)" />
          <text x="450" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">SIDE ELEVATION — HI-LO DRINKING FOUNTAIN</text>

          {/* Wall */}
          <rect x="80" y="40" width="12" height="340" fill="#94A3B8" rx="1" />
          {/* Floor */}
          <line x1="60" y1="380" x2="860" y2="380" stroke="#94A3B8" strokeWidth="2" />

          {/* LOW fountain (wheelchair) */}
          <rect x="92" y="200" width="120" height="10" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <path d="M 100 210 Q 110 245 152 245 Q 200 245 212 210" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="92" y="160" width="10" height="40" rx="2" fill="#94A3B8" opacity="0.3" />
          {/* Spout */}
          <rect x="150" y="192" width="20" height="10" rx="3" fill="#B45309" opacity="0.2" stroke="#B45309" strokeWidth="1" />
          {/* Water arc */}
          <path d="M 160 192 Q 165 178 172 182" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 2" />
          <text x="152" y="180" fontFamily="Manrope, sans-serif" fontSize="6" fill="#1E3A8A">{d('4', '100')}+ flow</text>
          {/* Knee clearance */}
          <rect x="100" y="215" width="112" height="165" rx="2" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1" strokeDasharray="4 3" />
          <text x="156" y="300" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A" fontWeight="500">Knee/Toe</text>
          <text x="156" y="312" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A" fontWeight="500">Clearance</text>
          {/* 36" height dim */}
          <line x1="68" y1="200" x2="68" y2="380" stroke="#C2410C" strokeWidth="1" />
          <line x1="62" y1="200" x2="74" y2="200" stroke="#C2410C" strokeWidth="1" />
          <line x1="62" y1="380" x2="74" y2="380" stroke="#C2410C" strokeWidth="1" />
          <rect x="45" y="282" width="42" height="13" rx="3" fill="#C2410C" />
          <text x="66" y="291" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('36', '915')}</text>
          <text x="156" y="155" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#8B2E08" fontWeight="700">LOW (Wheelchair)</text>

          {/* Wheelchair user */}
          <circle cx="340" cy="255" r="10" fill="#E2E8F0" stroke="#475569" strokeWidth="1.2" />
          <line x1="340" y1="265" x2="340" y2="310" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <circle cx="330" cy="345" r="18" fill="none" stroke="#64748B" strokeWidth="1.2" />
          <circle cx="365" cy="368" r="8" fill="none" stroke="#64748B" strokeWidth="0.8" />
          <line x1="328" y1="310" x2="320" y2="340" stroke="#64748B" strokeWidth="1.2" />
          <line x1="352" y1="310" x2="365" y2="360" stroke="#64748B" strokeWidth="1.2" />
          <line x1="340" y1="285" x2="220" y2="205" stroke="#475569" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          {/* Clear floor label */}
          <rect x="290" y="382" width="100" height="20" rx="4" fill="#7C3AED" opacity="0.06" stroke="#7C3AED" strokeWidth="1" />
          <text x="340" y="396" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#5B21B6" fontWeight="500">{d('30', '760')} × {d('48', '1220')} fwd</text>

          {/* DIVIDER */}
          <line x1="450" y1="40" x2="450" y2="400" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />

          {/* HIGH fountain (standing) */}
          <rect x="500" y="40" width="12" height="340" fill="#94A3B8" rx="1" />
          <rect x="512" y="155" width="130" height="10" rx="3" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
          <path d="M 520 165 Q 530 200 577 200 Q 630 200 642 165" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="512" y="110" width="10" height="45" rx="2" fill="#94A3B8" opacity="0.3" />
          <rect x="575" y="147" width="20" height="10" rx="3" fill="#B45309" opacity="0.2" stroke="#B45309" strokeWidth="1" />
          {/* 38-43" height */}
          <line x1="488" y1="155" x2="488" y2="380" stroke="#15803D" strokeWidth="1" />
          <line x1="482" y1="155" x2="494" y2="155" stroke="#15803D" strokeWidth="1" />
          <line x1="482" y1="380" x2="494" y2="380" stroke="#15803D" strokeWidth="1" />
          <rect x="462" y="260" width="50" height="13" rx="3" fill="#15803D" />
          <text x="487" y="269" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('38–43', '965–1090')}</text>
          <text x="577" y="105" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#14532D" fontWeight="700">HIGH (Standing)</text>

          {/* Standing person */}
          <circle cx="710" cy="155" r="12" fill="#E2E8F0" stroke="#475569" strokeWidth="1.2" />
          <line x1="710" y1="167" x2="710" y2="300" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="710" y1="300" x2="695" y2="375" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <line x1="710" y1="300" x2="725" y2="375" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <line x1="710" y1="220" x2="650" y2="163" stroke="#475569" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
          {/* Clear floor */}
          <rect x="670" y="382" width="100" height="20" rx="4" fill="#7C3AED" opacity="0.06" stroke="#7C3AED" strokeWidth="1" />
          <text x="720" y="396" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#5B21B6" fontWeight="500">{d('30', '760')} × {d('48', '1220')} ∥</text>

          {/* Hi-lo note */}
          <rect x="770" y="70" width="110" height="50" rx="6" fill="#0EA5E9" opacity="0.04" stroke="#0891B2" strokeWidth="1" />
          <text x="825" y="90" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#0C4A6E" fontWeight="600">Hi-Lo unit satisfies</text>
          <text x="825" y="104" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#0C4A6E" fontWeight="600">both requirements</text>

          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.textColor : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="410" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', animation: 'dfFade .25s ease-out' }}>
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
      <style>{`@keyframes dfFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}