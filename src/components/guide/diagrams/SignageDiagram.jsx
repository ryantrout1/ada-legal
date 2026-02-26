import React, { useState, useRef, useEffect, useCallback } from 'react';

const SIGN_URL = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#703-signs';
const CALLOUTS = [
  { id: 1, label: 'Mounting Location', section: '§703.4.1', color: '#C2410C', textColor: '#8B2E08', x: 80, y: 42,
    plain: 'Room identification signs must be mounted on the wall on the latch side of the door. If the door has a closer, the sign must be at least 18 inches from the centerline of the door frame, so a person reading the sign in Braille is not hit by the opening door. If there is no wall space on the latch side, the sign goes on the nearest adjacent wall. For double doors, the sign goes to the right of the right-hand door.',
    legal: '"Where a tactile sign is provided at a door, the sign shall be located alongside the door at the latch side." Where the door has a closer: "18 inches minimum from the centerline of the door."',
    citation: '§703.4.1' },
  { id: 2, label: 'Mounting Height', section: '§703.4.1', color: '#16A34A', textColor: '#14532D', x: 280, y: 42,
    plain: 'The baseline of the lowest line of tactile characters must be 48 inches minimum above the floor, and the baseline of the highest line must be 60 inches maximum. This puts the Braille and raised text within comfortable reach for someone reading with their fingertips. This height applies only to permanent room identification signs — not to directional or informational signs.',
    legal: '"Tactile characters on signs shall be located 48 inches minimum above the finish floor or ground surface, measured from the baseline of the lowest tactile character and 60 inches maximum above the finish floor or ground surface, measured from the baseline of the highest tactile character."',
    citation: '§703.4.1' },
  { id: 3, label: 'Raised Characters', section: '§703.2', color: '#2563EB', textColor: '#1E3A8A', x: 480, y: 42,
    plain: 'Tactile characters must be raised 1/32 inch minimum above their background. They must be uppercase, sans serif (or simple serif), and between 5/8 inch and 2 inches high. The stroke width must be appropriate for the character height. Characters must be spaced 1/8 inch minimum between the two closest points. These requirements ensure someone reading by touch can distinguish each letter.',
    legal: '"Tactile characters shall be raised 1/32 inch minimum above their background." Characters: "uppercase… sans serif." Height: "5/8 inch minimum and 2 inches maximum based on the uppercase letter I."',
    citation: '§703.2' },
  { id: 4, label: 'Braille', section: '§703.3', color: '#7C3AED', textColor: '#5B21B6', x: 80, y: 250,
    plain: 'Grade 2 (contracted) Braille must be provided below the corresponding raised text. The Braille must be separated from the raised characters by 3/8 inch minimum. Braille dots have a base diameter of 0.059 to 0.063 inches and are domed. Dot spacing is 0.090 to 0.100 inches on center within a cell. Braille must be positioned so it can be read without interfering with other sign elements.',
    legal: '"Braille shall be contracted (Grade 2) and shall comply with §703.3." Dot base: "0.059 inch to 0.063 inch." Separation from text: "3/8 inch minimum."',
    citation: '§703.3' },
  { id: 5, label: 'Finish & Contrast', section: '§703.5', color: '#D97706', textColor: '#78350F', x: 280, y: 250,
    plain: 'Characters and their background must have a non-glare finish. Characters must contrast with their background — either light characters on a dark background, or dark on light. The contrast requirement applies to both visual and tactile characters. Highly reflective or glossy finishes create glare that makes signs unreadable for people with low vision.',
    legal: '"Characters and their background shall have a non-glare finish. Characters shall contrast with their background with either light characters on a dark background or dark characters on a light background."',
    citation: '§703.5' },
  { id: 6, label: 'Visual Characters', section: '§703.5', color: '#DB2777', textColor: '#9D174D', x: 480, y: 250,
    plain: 'For directional and informational signs (overhead signs, wall-mounted wayfinding), character height is based on viewing distance. The minimum character height equals the viewing distance divided by 40 (e.g., at 20 feet, characters must be 6 inches high). Stroke width must be 10% to 30% of the character height. These signs do not need Braille or raised text.',
    legal: '"Character height shall be based on the height of the uppercase letter I. Viewing distance shall be measured as the horizontal distance between the character and an obstruction preventing further approach." Stroke width: "10 percent minimum and 30 percent maximum."',
    citation: '§703.5' },
  { id: 7, label: 'Pictograms', section: '§703.6', color: '#0EA5E9', textColor: '#0C4A6E', x: 680, y: 140,
    plain: 'When a pictogram (symbol) is used to identify a room or space — like the restroom symbol or the International Symbol of Accessibility — it must be in a field at least 6 inches high. A text descriptor must appear directly below the pictogram field. Both the text descriptor and its Braille equivalent are required. The pictogram field cannot contain text — the text goes below it.',
    legal: '"Pictograms shall have a field height of 6 inches minimum." Text descriptors: "directly below the pictogram field. Raised characters and Braille shall be provided."',
    citation: '§703.6' }
];

function makeLink(t) { return (<a href={SIGN_URL} target="_blank" rel="noopener noreferrer" style={{ color: '#C2410C', textColor: '#8B2E08', textDecoration: 'none', borderBottom: '1px dotted #C2410C' }}>{t}<span aria-hidden="true" style={{ fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' }}>↗</span></a>); }
function parseCite(t) { return t.split(/(§\d{3,4}(?:\.\d+)*)/g).map((p, i) => /^§\d{3,4}/.test(p) ? <React.Fragment key={i}>{makeLink(p)}</React.Fragment> : p); }

export default function SignageDiagram() {
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>§703 Signs</h3>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--slate-500)' }}>Units:</span>
          {['Imperial', 'Metric'].map(u => { const isA = u === 'Metric' ? metric : !metric; return (<button key={u} onClick={() => setMetric(u === 'Metric')} aria-pressed={isA} style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: isA ? 700 : 500, padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--slate-200)', background: isA ? '#1A1F2B' : 'white', color: isA ? 'white' : 'var(--slate-600)', cursor: 'pointer', minHeight: '28px' }}>{u}</button>); })}
        </div>
      </div>
      <div style={{ background: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden' }}>
        <svg viewBox="0 0 900 480" role="img" aria-labelledby="sign-title" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <title id="sign-title">ADA §703 Signs — Wall Elevation with Detail Insets</title>
          <rect width="900" height="480" fill="#FAFAF9" />

          {/* MAIN VIEW: Door + Sign */}
          <text x="250" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">WALL ELEVATION</text>
          {/* Wall */}
          <rect x="40" y="40" width="440" height="400" fill="#E7E5E4" opacity="0.15" stroke="#94A3B8" strokeWidth="1" rx="2" />
          {/* Door */}
          <rect x="120" y="80" width="160" height="360" rx="4" fill="white" stroke="#94A3B8" strokeWidth="2" />
          <circle cx="260" cy="270" r="6" fill="#94A3B8" opacity="0.4" />
          <text x="200" y="70" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fill="#4B5563">DOOR</text>
          {/* Door frame */}
          <line x1="118" y1="78" x2="118" y2="442" stroke="#64748B" strokeWidth="3" />
          <line x1="282" y1="78" x2="282" y2="442" stroke="#64748B" strokeWidth="3" />
          <line x1="118" y1="78" x2="282" y2="78" stroke="#64748B" strokeWidth="3" />
          {/* Latch side label */}
          <text x="350" y="70" fontFamily="Manrope, sans-serif" fontSize="7" fill="#8B2E08" fontWeight="600">LATCH SIDE →</text>

          {/* Sign on wall (latch side) */}
          <rect x="320" y="195" width="100" height="120" rx="6" fill="#1A1F2B" stroke="#64748B" strokeWidth="1.5" />
          {/* Room number on sign */}
          <text x="370" y="245" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="22" fontWeight="700" fill="white">204</text>
          {/* Braille dots */}
          {[0,1,2].map(i => [0,1].map(j => <circle key={`b${i}${j}`} cx={345 + i * 18} cy={275 + j * 8} r="2" fill="white" opacity="0.6" />))}
          <text x="370" y="305" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6" fill="#4B5563">BRAILLE</text>

          {/* 18" from frame dim */}
          <line x1="282" y1="330" x2="370" y2="330" stroke="#C2410C" strokeWidth="1" />
          <line x1="282" y1="324" x2="282" y2="336" stroke="#C2410C" strokeWidth="1" />
          <line x1="370" y1="324" x2="370" y2="336" stroke="#C2410C" strokeWidth="1" />
          <rect x="298" y="334" width="56" height="13" rx="3" fill="#C2410C" />
          <text x="326" y="343" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fontWeight="700" fill="white">{d('18', '455')} min</text>

          {/* Height dims: 48-60" */}
          <line x1="440" y1="195" x2="440" y2="440" stroke="#16A34A" strokeWidth="1" />
          <line x1="434" y1="195" x2="446" y2="195" stroke="#16A34A" strokeWidth="1" />
          <line x1="434" y1="315" x2="446" y2="315" stroke="#16A34A" strokeWidth="1" />
          <line x1="434" y1="440" x2="446" y2="440" stroke="#16A34A" strokeWidth="1" />
          <rect x="448" y="208" width="38" height="12" rx="3" fill="#16A34A" />
          <text x="467" y="217" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('60', '1525')}</text>
          <rect x="448" y="348" width="38" height="12" rx="3" fill="#16A34A" />
          <text x="467" y="357" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fontWeight="700" fill="white">{d('48', '1220')}</text>
          {/* Floor */}
          <line x1="40" y1="440" x2="480" y2="440" stroke="#94A3B8" strokeWidth="2" />

          {/* DIVIDER */}
          <line x1="510" y1="30" x2="510" y2="470" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />

          {/* INSET A: Raised Characters */}
          <text x="640" y="28" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fontWeight="700" fill="#4B5563" letterSpacing=".08em">DETAIL INSETS</text>
          <rect x="530" y="45" width="180" height="160" rx="8" fill="white" stroke="#2563EB" strokeWidth="1.5" />
          <text x="620" y="62" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#1E3A8A">(A) RAISED CHARACTERS</text>
          {/* Sample character */}
          <rect x="570" y="80" width="100" height="70" rx="4" fill="#1A1F2B" />
          <text x="620" y="130" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="36" fontWeight="700" fill="white">Ab</text>
          {/* Height dim */}
          <line x1="555" y1="88" x2="555" y2="142" stroke="#2563EB" strokeWidth="1" />
          <line x1="549" y1="88" x2="561" y2="88" stroke="#2563EB" strokeWidth="1" />
          <line x1="549" y1="142" x2="561" y2="142" stroke="#2563EB" strokeWidth="1" />
          <text x="548" y="120" textAnchor="end" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#1E3A8A" fontWeight="600">{d('⅝–2', '16–50')}</text>
          {/* Raised detail */}
          <text x="620" y="170" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#1E3A8A">Uppercase · Sans Serif · Raised 1/32" min</text>
          <text x="620" y="195" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563">High contrast with background</text>

          {/* INSET B: Braille */}
          <rect x="530" y="220" width="180" height="160" rx="8" fill="white" stroke="#7C3AED" strokeWidth="1.5" />
          <text x="620" y="237" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#5B21B6">(B) GRADE 2 BRAILLE</text>
          {/* Braille cell enlarged */}
          <rect x="565" y="250" width="110" height="80" rx="4" fill="#1A1F2B" />
          {/* Enlarged dots */}
          {[0,1,2].map(r => [0,1].map(c => <circle key={`bd${r}${c}`} cx={595 + c * 24} cy={268 + r * 20} r="5" fill="white" opacity={[1,0.6,1,0.6,1,0.6][r*2+c]} />))}
          <text x="650" y="273" fontFamily="Manrope, sans-serif" fontSize="5.5" fill="#78350F" fontWeight="600">← 0.090–0.100"</text>
          {/* Dot size */}
          <text x="620" y="345" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#5B21B6">Dome Ø 0.059–0.063" · 3/8" min below text</text>
          <text x="620" y="370" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="7" fill="#4B5563">Grade 2 contracted Braille</text>

          {/* PICTOGRAM note */}
          <rect x="730" y="90" width="150" height="110" rx="8" fill="#0EA5E9" opacity="0.04" stroke="#0EA5E9" strokeWidth="1" />
          <text x="805" y="110" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="8" fontWeight="700" fill="#0C4A6E">PICTOGRAM</text>
          {/* Simple restroom icon */}
          <circle cx="805" cy="135" r="8" fill="none" stroke="#0EA5E9" strokeWidth="1.5" />
          <line x1="805" y1="143" x2="805" y2="168" stroke="#0EA5E9" strokeWidth="1.5" />
          <line x1="790" y1="155" x2="820" y2="155" stroke="#0EA5E9" strokeWidth="1.5" />
          <line x1="805" y1="168" x2="793" y2="185" stroke="#0EA5E9" strokeWidth="1.5" />
          <line x1="805" y1="168" x2="817" y2="185" stroke="#0EA5E9" strokeWidth="1.5" />
          <text x="805" y="195" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="6.5" fill="#0C4A6E">{d('6', '150')} min field height</text>

          {/* Callouts */}
          {CALLOUTS.map(c => (
            <g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={active === c.id} onClick={() => toggle(c.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(c.id); } }} style={{ cursor: 'pointer', outline: 'none' }}>
              {active === c.id && <circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity=".3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite" /><animate attributeName="opacity" from=".4" to="0" dur="1.2s" repeatCount="indefinite" /></circle>}
              <circle cx={c.x} cy={c.y} r="13" fill={active === c.id ? c.color : 'white'} stroke={c.color} strokeWidth="2" />
              <text x={c.x} y={c.y + 4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={active === c.id ? 'white' : c.textColor}>{c.id}</text>
            </g>
          ))}
          <text x="30" y="470" fontFamily="Manrope, sans-serif" fontSize="9" fill="#4B5563">Click or tap numbered callouts for details</text>
        </svg>
      </div>
      <div aria-live="polite" className="sr-only">{ac ? `Showing callout ${ac.id}: ${ac.label}` : ''}</div>
      {ac && (
        <div ref={panelRef} style={{ marginTop: '12px', background: 'white', border: '1px solid var(--slate-200)', borderRadius: '12px', overflow: 'hidden', animation: 'signFade .25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--slate-200)', background: '#FAFAF9', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: ac.color, color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 700 }}>{ac.id}</span>
              <span style={{ fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>{ac.label}</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 600, color: ac.color, background: `${ac.color}15`, padding: '2px 8px', borderRadius: '4px' }}>{ac.section}</span>
            </div>
            <button onClick={() => setActive(null)} aria-label="Close" style={{ background: 'none', border: '1px solid var(--slate-200)', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, color: 'var(--slate-600)', minHeight: 44 }}>Close <span aria-hidden="true">✕</span></button>
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
      <style>{`@keyframes signFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}        @media (prefers-reduced-motion: reduce) {
          .ada-diagram-wrap * { animation: none !important; transition: none !important; }
        }
      `}</style>
    </div>
  );
}