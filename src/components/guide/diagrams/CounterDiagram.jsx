import React, { useState, useRef, useEffect, useCallback } from 'react';

const CTR_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#904-sales-and-service-counters';
const CALLOUTS = [
  { id: 1, label: 'Checkout Aisle Width', section: '§904.3', color: '#C2410C', x: 100, y: 42,
    plain: 'Accessible checkout aisles must be 36 inches wide minimum, measured between the counter edge and any opposing fixture or display. At least one checkout aisle in each checkout area must be accessible and on an accessible route. The aisle must be wide enough for a wheelchair to pass through its entire length without obstruction.',
    legal: '"Checkout aisles shall have a clear width of 36 inches (915 mm) minimum." At least one aisle per checkout area shall be accessible.',
    citation: '§904.3' },
  { id: 2, label: 'Sales Counter Height', section: '§904.4', color: '#16A34A', x: 300, y: 42,
    plain: 'A portion of the sales counter must be no higher than 36 inches above the floor and at least 36 inches long. This lowered section allows wheelchair users to write checks, sign receipts, exchange money, and conduct business at a comfortable height. The lowered section must be the same depth as the rest of the counter surface.',
    legal: '"A portion of the counter surface that is 36 inches (915 mm) long minimum and 36 inches (915 mm) high maximum above the finish floor shall be provided."',
    citation: '§904.4' },
  { id: 3, label: 'Service Counter', section: '§904.4.1', color: '#2563EB', x: 500, y: 42,
    plain: 'Where customers are expected to sit (bank teller windows, consultation desks), the accessible counter must be 28 to 34 inches high with knee and toe clearance underneath per §306. The accessible section must be at least 30 inches wide. This configuration allows a wheelchair user to pull up under the counter for extended interaction.',
    legal: '"Where a forward approach is provided, the counter shall be 28 inches minimum and 34 inches maximum above the finish floor. Knee and toe clearance complying with §306 shall be provided."',
    citation: '§904.4.1' },
  { id: 4, label: 'Food Service Lines', section: '§904.5', color: '#7C3AED', x: 100, y: 260,
    plain: 'In cafeterias and buffets, tray slides must be 28 to 34 inches above the floor and continuous along the full length of the service line. Self-service shelves must be within reach range per §308 (15 to 48 inches). At least 50% of each type of self-service shelf must comply. The queue width must be at least 36 inches.',
    legal: '"Tray slides shall be 28 inches minimum and 34 inches maximum above the finish floor." Self-service: "at least 50 percent of each type shall comply with §308."',
    citation: '§904.5' },
  { id: 5, label: 'Approach', section: '§904.3.1', color: '#D97706', x: 300, y: 260,
    plain: 'A clear floor space of 30 × 48 inches must be provided for either a forward or parallel approach at the accessible counter section. For checkout aisles, the clear space must be on an accessible route. The approach path must be free of merchandise displays, floor mats, or other obstructions that could block wheelchair access.',
    legal: '"A clear floor or ground space complying with §305 shall be provided." Must be positioned for forward or parallel approach and on an accessible route.',
    citation: '§904.3.1' },
  { id: 6, label: 'Counter Edge', section: 'Advisory §904', color: '#DB2777', x: 500, y: 260,
    plain: 'While not a strict code requirement, the advisory recommends rounded or eased edges on accessible counter sections. Sharp metal edges on lowered counter sections can injure wheelchair users whose arms or hands are at counter height. Rounded edges with a minimum ¼-inch radius are recommended for safety.',
    legal: 'Advisory §904: Rounded or eased edges are recommended on accessible counter sections to prevent injury. No sharp or abrasive edges.',
    citation: '§904' },
  { id: 7, label: 'Scoping', section: '§227', color: '#0EA5E9', x: 700, y: 150,
    plain: 'At least one of each type of sales or service counter must be accessible. For checkout aisles, the number required depends on total count: 1–4 aisles = 1 accessible; 5–8 = 2 accessible; 9–15 = 3 accessible; 16 or more = at least 50% but no fewer than 3. The accessible aisles must be identified with the International Symbol of Accessibility.',
    legal: '§227.2 Checkout aisles scoping: "1 to 4 total = 1 accessible; 5 to 8 = 2; 9 to 15 = 3; over 15 = 50 percent but not fewer than 3." §227.3 "At least one of each type of sales counter and service counter shall be accessible."',
    citation: '§227' }
];

function makeLink(t) { return (<a href={CTR_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function CounterDiagram() {
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(false);
  const panelRef = useRef(null);
  const toggle = useCallback(id => setActive(p => p === id ? null : id), []);
  useEffect(() => { if (active && panelRef.current) panelRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  useEffect(() => { const h = e => { if (e.key === 'Escape') setActive(null); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);
  const d = (imp, met) => metric ? `${met} mm` : `${imp}"`;
  const ac = CALLOUTS.find(c => c.id === active);

  return (
    <div style={{ margin: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§904 Sales & Service Counters</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: 28 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 420" role="img" aria-labelledby="ctr-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="ctr-title">ADA §904 Counters — Plan View and Front Elevation</title>
          <rect width="900" height="420" fill="#FAFAF9" />

          {/* LEFT: Plan View */}
          <text x="200" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#94A3B8" letterSpacing=".08em">PLAN VIEW — CHECKOUT AISLE</text>
          <rect x="60" y="50" width="120" height="300" rx="4" fill="#E7E5E4" opacity="0.2" stroke="#94A3B8" strokeWidth="1.5" />
          <text x="120" y="200" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#94A3B8" fontWeight="500">COUNTER</text>
          <rect x="230" y="50" width="80" height="300" rx="4" fill="#E7E5E4" opacity="0.1" stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 3" />
          <text x="270" y="200" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#94A3B8">MERCHANDISE</text>
          {/* Aisle */}
          <rect x="180" y="50" width="50" height="300" rx="0" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="205" y="150" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#C2410C" fontWeight="600" transform="rotate(-90 205 150)">AISLE</text>
          {/* Width dim */}
          <line x1="180" y1="365" x2="230" y2="365" stroke="#C2410C" strokeWidth="1" />
          <line x1="180" y1="359" x2="180" y2="371" stroke="#C2410C" strokeWidth="1" />
          <line x1="230" y1="359" x2="230" y2="371" stroke="#C2410C" strokeWidth="1" />
          <rect x="182" y="370" width="46" height="12" rx="3" fill="#C2410C" />
          <text x="205" y="379" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('36', '915')}</text>
          {/* Wheelchair silhouette in aisle */}
          <circle cx="205" cy="280" r="12" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />
          <rect x="193" y="260" width="24" height="15" rx="3" fill="none" stroke="#64748B" strokeWidth="1" />
          <circle cx="195" cy="295" r="6" fill="none" stroke="#64748B" strokeWidth="0.8" />
          <circle cx="215" cy="295" r="6" fill="none" stroke="#64748B" strokeWidth="0.8" />

          {/* DIVIDER */}
          <line x1="380" y1="20" x2="380" y2="410" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />

          {/* RIGHT: Front Elevation */}
          <text x="640" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#94A3B8" letterSpacing=".08em">FRONT ELEVATION — COUNTER TYPES</text>
          {/* Floor */}
          <line x1="390" y1="380" x2="870" y2="380" stroke="#94A3B8" strokeWidth="2" />

          {/* (A) Sales counter — 36" high, 36" wide section */}
          <rect x="410" y="180" width="120" height="200" rx="2" fill="#E7E5E4" opacity="0.15" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="410" y="210" width="120" height="8" rx="1" fill="#16A34A" opacity="0.15" stroke="#16A34A" strokeWidth="1.5" />
          <text x="470" y="200" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#16A34A" fontWeight="700">(A) SALES</text>
          <line x1="395" y1="210" x2="395" y2="380" stroke="#16A34A" strokeWidth="1" />
          <rect x="396" y="285" width="38" height="12" rx="3" fill="#16A34A" />
          <text x="415" y="294" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('36', '915')}</text>
          <text x="470" y="300" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#16A34A">{d('36', '915')} wide min</text>

          {/* (B) Service counter — 28-34" with knee clearance */}
          <rect x="560" y="220" width="120" height="160" rx="2" fill="#E7E5E4" opacity="0.15" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="560" y="240" width="120" height="8" rx="1" fill="#2563EB" opacity="0.15" stroke="#2563EB" strokeWidth="1.5" />
          <text x="620" y="233" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#2563EB" fontWeight="700">(B) SERVICE</text>
          {/* Knee clearance zone */}
          <rect x="565" y="253" width="110" height="122" rx="2" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="0.8" strokeDasharray="3 2" />
          <text x="620" y="325" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#2563EB">Knee clearance</text>
          <line x1="545" y1="240" x2="545" y2="380" stroke="#2563EB" strokeWidth="1" />
          <rect x="535" y="300" width="46" height="12" rx="3" fill="#2563EB" />
          <text x="558" y="309" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" fill="white">{d('28–34', '710–865')}</text>

          {/* (C) Food service — tray slide */}
          <rect x="710" y="240" width="120" height="140" rx="2" fill="#E7E5E4" opacity="0.15" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="710" y="250" width="120" height="6" rx="1" fill="#7C3AED" opacity="0.2" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="770" y="242" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#7C3AED" fontWeight="700">(C) FOOD SERVICE</text>
          <line x1="840" y1="250" x2="840" y2="380" stroke="#7C3AED" strokeWidth="1" />
          <rect x="842" y="305" width="46" height="12" rx="3" fill="#7C3AED" />
          <text x="865" y="314" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fontWeight="700" fill="white">{d('28–34', '710–865')}</text>

          {/* Callouts */}
          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.color : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.color}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="410" fontFamily="Manrope, sans-serif" fontSize="9" fill="#94A3B8">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'ctrFade .25s ease-out' }}>
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
      <style>{`@keyframes ctrFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}