import React, { useState, useRef, useEffect, useCallback } from 'react';
const U = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/#802-wheelchair-spaces-companion-seats-and-designated-aisle-seats';
const CALLOUTS = [
  { id: 1, label: 'Wheelchair Spaces & Companions', section: '\u00a7802.1', color: '#C2410C', textColor: '#7C2D12', x: 100, y: 52, plain: 'Wheelchair spaces must be 36 inches wide minimum. Depth: 48 inches for front/rear entry, 60 inches for side entry. A companion seat must be directly adjacent \u2014 shoulder-to-shoulder, not in front or behind. The companion seat must be equivalent in comfort and price to surrounding seats. Spaces must be dispersed throughout the venue, not clustered in one location.', legal: '\u201CWheelchair spaces shall be 36 inches wide minimum.\u201D Depth: \u201C48 inches (front/rear entry) or 60 inches (side entry).\u201D Companion: \u201CAt least one companion seat shall be provided for each wheelchair space.\u201D \u201CCompanion seats shall be located to provide shoulder alignment.\u201D', citation: '\u00a7802.1, \u00a7802.3' },
  { id: 2, label: 'Sightlines & Dispersion', section: '\u00a7802.2', color: '#15803D', textColor: '#14532D', x: 470, y: 52, plain: 'Wheelchair users must see over standing spectators when the audience stands. This means wheelchair positions must be elevated or on a platform \u2014 front-row-only placement fails in venues where people stand. Spaces must be dispersed among different seating sections, price levels, and viewing angles. Clustering all wheelchair seats in one area is a violation, even if the sightlines are good.', legal: '\u201CWhere spectators are expected to stand, wheelchair spaces shall provide a line of sight over standing spectators.\u201D \u00a7221.2.3: \u201CWheelchair spaces shall be dispersed.\u201D \u201CWheelchair spaces shall provide a choice of admission prices and lines of sight comparable to those for the general public.\u201D', citation: '\u00a7802.2, \u00a7221.2.3' }
];
function makeLink(t){return(<a href={U} target="_blank" rel="noopener noreferrer" style={{color:'var(--section-label)',textDecoration:'none',borderBottom:'1px dotted var(--accent)'}} aria-label={`${t} on ADA.gov`}>{t}<span aria-hidden="true" style={{fontSize:'0.65em',marginLeft:'1px',verticalAlign:'super'}}>{'\u2197'}</span></a>)}
function pc(t){return t.split(/(\u00a7\d{3,4}(?:\.\d+)*)/g).map((p,i)=>/^\u00a7\d{3,4}/.test(p)?<React.Fragment key={i}>{makeLink(p)}</React.Fragment>:p)}
function CP({callout:c,onClose,panelRef}){if(!c)return null;return(<div ref={panelRef} style={{marginTop:'12px',background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden',animation:'asFade 0.25s ease-out'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:'1px solid var(--border)',background:'var(--page-bg-subtle)',flexWrap:'wrap',gap:'8px'}}><div style={{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap'}}><span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:'26px',height:'26px',borderRadius:'50%',background:c.color,color:'white',fontFamily:'Manrope, sans-serif',fontSize:'0.8rem',fontWeight:700}}>{c.id}</span><span style={{fontFamily:'Fraunces, serif',fontSize:'1.1rem',fontWeight:700,color:'var(--heading)'}}>{c.label}</span><span style={{fontFamily:'Manrope, sans-serif',fontSize:'0.75rem',fontWeight:600,color:c.color,background:`${c.color}15`,padding:'2px 8px',borderRadius:'4px'}}>{c.section}</span></div><button onClick={onClose} aria-label="Close panel" style={{background:'none',border:'1px solid var(--border)',borderRadius:'8px',padding:'8px 16px',cursor:'pointer',fontFamily:'Manrope, sans-serif',fontSize:'0.875rem',fontWeight:600,color:'var(--body)',minHeight:'44px'}}>Close <span aria-hidden="true">{'\u2715'}</span></button></div><div className="guide-two-col" style={{padding:'20px',gap:'24px',margin:0}}><div style={{flex:'1 1 55%',minWidth:0}}><p style={{fontFamily:'Manrope, sans-serif',fontSize:'0.9375rem',color:'var(--body)',lineHeight:1.75,margin:0}}>{c.plain}</p></div><aside style={{flex:'1 1 40%',minWidth:0}}><div style={{background:'var(--card-bg-tinted)',borderLeft:'3px solid var(--accent)',borderRadius:'0 10px 10px 0',padding:'16px 18px'}}><p style={{fontFamily:'Manrope, sans-serif',fontSize:'0.7rem',fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--body-secondary)',margin:'0 0 8px'}}>Official Standard {'\u2014'} {pc(c.citation)}</p><p style={{fontFamily:'Manrope, sans-serif',fontSize:'0.875rem',color:'var(--body)',lineHeight:1.7,margin:0,fontStyle:'italic'}}>{pc(c.legal)}</p></div></aside></div></div>)}
function KF({color:cl,number:n,children:ch}){return(<div style={{display:'flex',alignItems:'baseline',gap:'10px',padding:'6px 0'}}><span style={{background:cl,color:'white',fontFamily:'Manrope, sans-serif',fontSize:'0.95rem',fontWeight:700,minWidth:'60px',textAlign:'center',padding:'3px 10px',borderRadius:'6px',flexShrink:0,whiteSpace:'nowrap'}}>{n}</span><span style={{fontFamily:'Manrope, sans-serif',fontSize:'0.9rem',color:'var(--body)',lineHeight:1.6}}>{ch}</span></div>)}
function Dots({callouts:cs,active:a,toggle:tg}){return cs.map(c=>(<g key={c.id} tabIndex="0" role="button" aria-label={`Callout ${c.id}: ${c.label}`} aria-expanded={a===c.id} onClick={()=>tg(c.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tg(c.id)}}} style={{cursor:'pointer',outline:'none'}}>{a===c.id&&(<circle cx={c.x} cy={c.y} r="18" fill="none" stroke={c.color} strokeWidth="2" opacity="0.3"><animate attributeName="r" from="14" to="22" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.4" to="0" dur="1.2s" repeatCount="indefinite"/></circle>)}<circle cx={c.x} cy={c.y} r="13" fill={a===c.id?c.textColor:'white'} stroke={c.color} strokeWidth="2"/><text x={c.x} y={c.y+4} textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fontWeight="700" fill={a===c.id?'white':c.textColor}>{c.id}</text><circle cx={c.x} cy={c.y} r="16" fill="none" stroke="transparent" strokeWidth="2" className="as-fr"/></g>))}
export default function AssemblySeatingDiagram(){
  const[a,sa]=useState(null);const pr=useRef(null);const tg=useCallback(id=>sa(p=>p===id?null:id),[]);
  useEffect(()=>{if(a&&pr.current)pr.current.scrollIntoView({behavior:'smooth',block:'nearest'})},[a]);
  useEffect(()=>{const h=e=>{if(e.key==='Escape')sa(null)};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[]);
  const ac=CALLOUTS.find(c=>c.id===a);
  return(<div className="ada-diagram-wrap" style={{margin:'32px 0'}}>
    <div style={{marginBottom:'8px'}}><h3 style={{fontFamily:'Fraunces, serif',fontSize:'1.15rem',fontWeight:700,color:'var(--heading)',margin:0}}>Wheelchair Seating in Assembly Areas</h3></div>
    <div style={{background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:'12px',overflow:'hidden'}}>
      <svg viewBox="0 0 720 340" role="img" aria-labelledby="as-t" style={{width:'100%',height:'auto',display:'block'}}>
        <title id="as-t">Wheelchair Spaces in Assembly Areas</title>
        <rect width="720" height="340" fill="var(--page-bg-subtle)"/>
        <text x="170" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Space requirements</text>
        <text x="540" y="30" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="12" fontWeight="700" fill="var(--body-secondary)">Sightlines & placement</text>

        {/* LEFT: Space size */}
        <rect x="40" y="70" width="280" height="50" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5"/>
        <text x="180" y="92" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">36{'\u2033'} wide {'\u00d7'} 48{'\u2033'} deep (front entry)</text>
        <text x="180" y="108" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">or 60{'\u2033'} deep for side entry</text>

        <rect x="40" y="135" width="280" height="50" rx="10" fill="#7C3AED" opacity="0.04" stroke="#7C3AED" strokeWidth="1.5"/>
        <text x="180" y="157" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#5B21B6" fontWeight="600">Companion seat: shoulder-to-shoulder</text>
        <text x="180" y="173" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#5B21B6">directly adjacent, same comfort and price</text>

        <rect x="40" y="200" width="280" height="50" rx="10" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5"/>
        <text x="180" y="222" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">Dispersed throughout venue</text>
        <text x="180" y="238" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">different sections, price levels, angles</text>

        {/* DIVIDER */}
        <line x1="370" y1="20" x2="370" y2="320" stroke="#E2E8F0" strokeWidth="1.5" strokeDasharray="6 4"/>

        {/* RIGHT: Sightlines */}
        <rect x="400" y="70" width="280" height="60" rx="10" fill="#15803D" opacity="0.04" stroke="#15803D" strokeWidth="1.5"/>
        <text x="540" y="92" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#14532D" fontWeight="600">Must see over standing spectators</text>
        <text x="540" y="110" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">elevated or platform seating when audience stands</text>
        <text x="540" y="124" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#14532D">front row only is NOT enough</text>

        <rect x="400" y="148" width="280" height="50" rx="10" fill="#C2410C" opacity="0.04" stroke="#C2410C" strokeWidth="1.5"/>
        <text x="540" y="170" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#7C2D12" fontWeight="600">{'\u2718'} All seats in one spot = violation</text>
        <text x="540" y="186" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#7C2D12">even if sightlines are good from there</text>

        <rect x="400" y="215" width="280" height="50" rx="10" fill="#2563EB" opacity="0.04" stroke="#2563EB" strokeWidth="1.5"/>
        <text x="540" y="237" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="11" fill="#1E3A8A" fontWeight="600">{'\u2714'} Comparable choice of experience</text>
        <text x="540" y="253" textAnchor="middle" fontFamily="Manrope, sans-serif" fontSize="10" fill="#1E3A8A">same viewing quality as general public</text>

        <Dots callouts={CALLOUTS} active={a} toggle={tg}/>
        <text x="20" y="330" fontFamily="Manrope, sans-serif" fontSize="10" fill="var(--body-secondary)">Click or tap numbered callouts for details</text>
      </svg>
    </div>
    <div aria-live="polite" className="sr-only">{ac?`Showing: ${ac.label}`:''}</div>
    <CP callout={ac} onClose={()=>sa(null)} panelRef={pr}/>
    <div style={{background:'var(--card-bg)',border:'1px solid var(--border)',borderRadius:'12px',padding:'20px 24px',marginTop:'12px'}}>
      <p style={{fontFamily:'Fraunces, serif',fontSize:'1rem',fontWeight:700,color:'var(--heading)',margin:'0 0 12px'}}>Key numbers {'\u2014'} Assembly Seating</p>
      <KF color="#C2410C" number={`36\u2033`}>Minimum wheelchair space width</KF>
      <KF color="#7C3AED" number="Adjacent">Companion must be shoulder-to-shoulder</KF>
      <KF color="#15803D" number="Dispersed">Spaces spread across sections and price levels</KF>
      <KF color="#2563EB" number="Standing">Must see over spectators who stand up</KF>
    </div>
    <style>{`
      @keyframes asFade{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
      g[role="button"]:focus .as-fr{stroke:var(--accent);stroke-width:2.5}
      @media(max-width:768px){.guide-two-col{flex-direction:column!important;gap:16px!important}}
      @media(prefers-reduced-motion:reduce){.ada-diagram-wrap *{animation:none!important;transition:none!important}}
    `}</style>
  </div>)
}
