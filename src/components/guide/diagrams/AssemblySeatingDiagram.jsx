import React, { useState, useRef, useEffect, useCallback } from 'react';

const SEAT_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#802-wheelchair-spaces-companion-seats-and-designated-aisle-seats';
const CALLOUTS = [
  { id: 1, label: 'Wheelchair Space Size', section: '§802.1', color: '#C2410C', x: 100, y: 42,
    plain: 'Each wheelchair space must be 36 inches wide minimum. Depth depends on entry direction: 48 inches minimum for front or rear entry, 60 inches minimum for side entry. The space must be level (max 1:48 slope) with a firm, stable surface. Multiple wheelchair spaces can be adjacent or separated; when adjacent, they must be separated by an armrest or fixed companion seat.',
    legal: '"Wheelchair spaces shall be 36 inches wide minimum." Depth: "48 inches minimum where entered from the front or rear; 60 inches minimum where entered from the side."', citation: '§802.1' },
  { id: 2, label: 'Companion Seat', section: '§802.3', color: '#16A34A', x: 300, y: 42,
    plain: 'At least one companion seat must be provided directly adjacent to each wheelchair space, at the same elevation and in the same row. The companion and wheelchair user should be shoulder-to-shoulder. The companion seat must be equivalent in comfort and amenities to surrounding seats. It cannot be a folding chair placed in the aisle.',
    legal: '"At least one companion seat complying with §802.3 shall be provided for each wheelchair space." Adjacent, same row, shoulder alignment.', citation: '§802.3' },
  { id: 3, label: 'Sightlines — Seated', section: '§802.2.1.1', color: '#2563EB', x: 500, y: 42,
    plain: 'Wheelchair users must have lines of sight to the performance area or playing field comparable to those of seated spectators in surrounding seats. This means wheelchair spaces cannot be placed behind tall barriers, columns, or in obstructed locations. The line of sight must be over the heads of seated spectators in front.',
    legal: '"Where spectators are expected to remain seated… lines of sight to the screen, performance area, or playing field for spectators in wheelchair spaces shall be comparable to those provided for spectators in surrounding seats."', citation: '§802.2.1.1' },
  { id: 4, label: 'Sightlines — Standing', section: '§802.2.1.2', color: '#7C3AED', x: 100, y: 260,
    plain: 'At venues where spectators regularly stand (concerts, sporting events), wheelchair spaces must be elevated enough that the wheelchair user can see over standing spectators in the row immediately ahead. This typically requires raising the wheelchair platform to a height where the seated user\'s eye level (approximately 43-51 inches) clears the standing spectator\'s head.',
    legal: '"Where spectators are expected to stand… lines of sight over standing spectators in the row immediately in front… shall be provided."', citation: '§802.2.1.2' },
  { id: 5, label: 'Dispersion', section: '§221.2.3', color: '#D97706', x: 300, y: 260,
    plain: 'Wheelchair spaces must be dispersed throughout the venue — different sections, different viewing angles, and different price points. They cannot all be clustered in one area (e.g., all in the back row or all on one side). This ensures wheelchair users have the same range of experience and ticket options as other patrons.',
    legal: '"Wheelchair spaces shall be dispersed." Multiple locations, viewing angles, and price categories required.', citation: '§221.2.3' },
  { id: 6, label: 'Integration', section: '§802.1', color: '#DB2777', x: 500, y: 260,
    plain: 'Wheelchair spaces must be an integral part of the seating layout — not isolated platforms, not behind barriers, not in separate "accessible sections." They must be adjacent to companion seats at the same level, integrated into the flow of the seating bowl, and connected by an accessible route.',
    legal: '"Wheelchair spaces shall adjoin accessible routes." Integration: spaces must be part of the general seating plan, not segregated.', citation: '§802.1' },
  { id: 7, label: 'Scoping', section: '§221.2', color: '#0EA5E9', x: 700, y: 150,
    plain: 'The number of wheelchair spaces required depends on total seating: 4–25 seats = 1 space; 26–50 = 2; 51–150 = 4; 151–300 = 5; 301–500 = 6; 501–5,000 = 6 plus 1 for each 150 over 500; 5,001+ = 36 plus 1 for each 200 over 5,000. Each wheelchair space must have a companion seat.',
    legal: '§221.2.1 Table: "4 to 25 = 1; 26 to 50 = 2; 51 to 150 = 4; 151 to 300 = 5; 301 to 500 = 6; 501 to 5000 = 6 + 1/150; 5001+ = 36 + 1/200."', citation: '§221.2' }
];

function makeLink(t) { return (<a href={SEAT_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '.65em', marginLeft: 1, verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function AssemblySeatingDiagram() {
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
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§802 Assembly Seating — Wheelchair Spaces</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: 28 }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden' }}>
        <svg viewBox="0 0 900 420" role="img" aria-labelledby="asm-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="asm-title">ADA §802 Assembly Seating — Plan View and Sightline Elevation</title>
          <rect width="900" height="420" fill="#FAFAF9" />

          {/* LEFT: Plan View */}
          <text x="190" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#94A3B8" letterSpacing=".08em">PLAN VIEW</text>
          {/* Row of seats */}
          {[0,1,2].map(i => <rect key={`s${i}`} x={60 + i * 50} y="60" width="40" height="40" rx="6" fill="#E7E5E4" opacity="0.3" stroke="#94A3B8" strokeWidth="1" />)}
          {/* Wheelchair space */}
          <rect x="210" y="55" width="80" height="100" rx="4" fill="#C2410C" opacity="0.06" stroke="#C2410C" strokeWidth="2" />
          <text x="250" y="78" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#C2410C" fontWeight="700">WHEELCHAIR</text>
          <text x="250" y="90" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#C2410C" fontWeight="700">SPACE</text>
          {/* Wheelchair icon */}
          <circle cx="250" cy="120" r="10" fill="#E2E8F0" stroke="#475569" strokeWidth="1" />
          <circle cx="240" cy="135" r="5" fill="none" stroke="#64748B" strokeWidth="0.8" />
          <circle cx="260" cy="135" r="5" fill="none" stroke="#64748B" strokeWidth="0.8" />
          {/* Companion seat */}
          <rect x="300" y="60" width="40" height="40" rx="6" fill="#16A34A" opacity="0.1" stroke="#16A34A" strokeWidth="2" />
          <text x="320" y="83" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#16A34A" fontWeight="600">COMP.</text>
          {/* More seats */}
          {[0,1].map(i => <rect key={`s2${i}`} x={350 + i * 50} y="60" width="40" height="40" rx="6" fill="#E7E5E4" opacity="0.3" stroke="#94A3B8" strokeWidth="1" />)}

          {/* Dims */}
          <line x1="210" y1="165" x2="290" y2="165" stroke="#C2410C" strokeWidth="1" />
          <rect x="218" y="168" width="54" height="12" rx="3" fill="#C2410C" />
          <text x="245" y="177" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('36', '915')} wide</text>
          <line x1="295" y1="55" x2="295" y2="155" stroke="#C2410C" strokeWidth="1" />
          <rect x="296" y="95" width="52" height="12" rx="3" fill="#C2410C" />
          <text x="322" y="104" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('48–60', '1220')}</text>

          {/* Accessible aisle */}
          <rect x="60" y="110" width="380" height="35" rx="2" fill="#D97706" opacity="0.04" stroke="#D97706" strokeWidth="1" strokeDasharray="4 3" />
          <text x="250" y="132" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#D97706" fontWeight="500">ACCESSIBLE AISLE ({d('36', '915')} min)</text>

          {/* DIVIDER */}
          <line x1="450" y1="20" x2="450" y2="410" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />

          {/* RIGHT: Sightline Elevation */}
          <text x="670" y="24" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#94A3B8" letterSpacing=".08em">SIGHTLINE ELEVATION</text>
          {/* Tiered platforms */}
          <rect x="470" y="310" width="380" height="90" fill="#E7E5E4" opacity="0.1" stroke="#94A3B8" strokeWidth="1" />
          <rect x="470" y="240" width="380" height="70" fill="#E7E5E4" opacity="0.15" stroke="#94A3B8" strokeWidth="1" />
          <rect x="470" y="180" width="380" height="60" fill="#E7E5E4" opacity="0.2" stroke="#94A3B8" strokeWidth="1" />

          {/* Standing spectator in row ahead */}
          <circle cx="560" cy="235" r="9" fill="#E2E8F0" stroke="#475569" strokeWidth="1.2" />
          <line x1="560" y1="244" x2="560" y2="300" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <line x1="560" y1="300" x2="550" y2="340" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="560" y1="300" x2="570" y2="340" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
          <text x="560" y="355" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#94A3B8">Standing</text>
          <text x="560" y="365" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#94A3B8">spectator</text>

          {/* Wheelchair user on elevated platform behind */}
          <circle cx="700" cy="210" r="8" fill="#E2E8F0" stroke="#475569" strokeWidth="1.2" />
          <line x1="700" y1="218" x2="700" y2="252" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
          <circle cx="690" cy="268" r="12" fill="none" stroke="#64748B" strokeWidth="1" />
          <circle cx="710" cy="268" r="12" fill="none" stroke="#64748B" strokeWidth="1" />
          <rect x="688" y="240" width="24" height="16" rx="3" fill="none" stroke="#64748B" strokeWidth="1" />
          <text x="700" y="295" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#C2410C" fontWeight="600">Wheelchair user</text>

          {/* Sightline over standing spectator */}
          <line x1="708" y1="210" x2="480" y2="170" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="6 3" />
          <text x="530" y="165" fontFamily="Manrope, sans-serif" fontSize="7" fill="#7C3AED" fontWeight="600">Sightline clears standing head</text>
          {/* Performance area arrow */}
          <text x="485" y="180" fontFamily="Manrope, sans-serif" fontSize="7" fill="#94A3B8">← Stage / Field</text>

          {/* Companion next to wheelchair user */}
          <circle cx="760" cy="215" r="7" fill="#16A34A" opacity="0.2" stroke="#16A34A" strokeWidth="1" />
          <line x1="760" y1="222" x2="760" y2="260" stroke="#16A34A" strokeWidth="1.5" />
          <text x="760" y="278" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#16A34A" fontWeight="600">Comp.</text>

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
        <div ref={panelRef} style={{ marginTop: 12, background: 'white', border: '1px solid var(--slate-200)', borderRadius: 12, overflow: 'hidden', animation: 'asmFade .25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--slate-200)', background: '#FAFAF9', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: ac.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{ac.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>{ac.label}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: ac.color, background: `${ac.color}15`, padding: '2px 8px', borderRadius: 4 }}>{ac.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close" style={{ background: 'none', border: '1px solid var(--slate-200)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', color: 'var(--slate-500)', minHeight: 30 }}>Close ✕</button>
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
      <style>{`@keyframes asmFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}