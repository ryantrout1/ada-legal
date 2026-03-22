import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import AdminPageHeader from '../components/admin/shared/AdminPageHeader';
import { Camera, Upload, AlertTriangle, CheckCircle, Info, Clock, ChevronDown, ChevronUp, Plus, X, Trash2 } from 'lucide-react';
import { useReadingLevel } from '../components/a11y/ReadingLevelContext';
import { useAnnounce } from '../components/a11y/LiveAnnouncer';

const ADA_SYSTEM_PROMPT = `You are a senior ADA accessibility compliance analyst with deep expertise in the 2010 ADA Standards for Accessible Design and the ADA Accessibility Guidelines (ADAAG). Your role is to examine photos of physical locations and identify ALL potential ADA compliance concerns — be thorough and specific.

You are analyzing a SET of photos from the SAME location. Look for cross-photo patterns: e.g. a ramp in one photo may lead to a door shown in another. Note when concerns span multiple photos or when photos together reveal a compliance chain issue.

Respond ONLY with valid JSON in exactly this shape — no markdown, no preamble:
{
  "summary": "2-3 sentence overall assessment covering the location holistically across all photos",
  "overallRisk": "HIGH" | "MEDIUM" | "LOW" | "NONE",
  "crossPhotoFindings": "Optional: note any patterns or compliance chains observed across multiple photos. Omit if only one photo.",
  "photos": [
    {
      "photoIndex": 0,
      "description": "What you see in this photo — be specific about the space type and features visible",
      "concerns": [
        {
          "title": "Short concern title",
          "detail": "Specific detail with measurement estimates where visible and ADA standard section (e.g. §404.2.3)",
          "severity": "HIGH" | "MEDIUM" | "LOW",
          "remediation": "Concrete recommended fix with target spec (e.g. 'Widen doorway to minimum 32 inches clear')",
          "bbox": { "x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0 }
        }
      ],
      "positiveFindings": ["Specific compliant feature observed — be concrete, not generic"]
    }
  ]
}

For the "bbox" field on each concern: provide the approximate bounding box of where the issue is visible in the photo, as fractions of the image dimensions (0.0 to 1.0). x and y are the top-left corner, w and h are width and height. For example, a door threshold in the lower-center of the frame might be { "x": 0.3, "y": 0.7, "w": 0.4, "h": 0.2 }. If you cannot locate the concern visually, use { "x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0 } to indicate the full frame.

COMPREHENSIVE STANDARDS TO CHECK — evaluate every applicable standard for each photo:

ACCESSIBLE ROUTES & PATHWAYS (Chapter 4):
- Pathway min width 36" continuous, 60" passing space every 200ft (§403.5)
- Running slope max 1:20 (5%), cross slope max 1:48 (§403.3)
- Surface must be firm, stable, slip-resistant — note cracks, gaps, lips, gravel (§402.2)
- Protruding objects max 4" protrusion above 27", must have cane-detectable base if overhead (§307)
- Changes in level: max 1/4" vertical, 1/4"–1/2" beveled 1:2, over 1/2" requires ramp (§303)

RAMPS (§405):
- Max slope 1:12 (8.33%), max cross slope 1:48
- Min width 36" between handrails
- Landings min 60"×60" at top and bottom
- Handrails required both sides if rise >6" (§505): 34"–38" height, graspable, 12" extensions
- Edge protection required (§405.9)

DOORS & DOORWAYS (§404):
- Min 32" clear width when door open 90° (§404.2.3)
- Max threshold 1/2" (1/4" vertical, beveled if 1/4"–1/2") (§404.2.5)
- Hardware: lever/loop/push — no tight grasping/twisting required (§404.2.7)
- Maneuvering clearance required on both sides (§404.2.4): note approach direction
- Closing speed: min 5 seconds from 90° to 12° (§404.2.8)
- Double-leaf: one leaf must meet 32" clear width
- Vestibules: 48" + door width min space between doors

PARKING (§502):
- Standard accessible space: min 96" wide + 60" access aisle (§502.2)
- Van-accessible: min 132" wide OR 96" + 96" aisle (§502.2)
- One in every 6 accessible spaces must be van-accessible (§208.2)
- Max slope 1:48 in all directions (§502.4)
- ISA (International Symbol of Accessibility) required (§502.6)
- Signage: min 60" above finish floor to bottom of sign (§502.6)
- Access aisle must connect to accessible route (§502.3)

SIGNAGE (§703):
- Tactile/Braille required at permanent rooms and spaces (§703.1)
- Mounting: 60" AFF to centerline of tactile characters (§703.4.1)
- Located on latch side of door, 18"–60" AFF (§703.4.2)
- Visual characters: min 5/8" uppercase height, non-glare finish (§703.5)
- Pictograms: 6" min field height with verbal description below (§703.6)
- Accessible parking: ISA at each space, van-accessible designation

RESTROOMS (§603–§609):
- Clear floor space 60"×60" turning radius (§603.2.1)
- Accessible stall: min 60" wide × 56" deep (wall-mounted) / 59" (floor-mounted) (§604.3)
- Grab bars: rear wall 36" min, side wall 42" min, 33"–36" AFF (§604.5)
- Toilet centerline: 16"–18" from side wall (§604.2)
- Toilet seat height: 17"–19" AFF (§604.4)
- Lavatory: max 34" AFF rim, knee clearance 27" H × 30" W × 19" D (§606)
- Faucets: lever, push, touch, or auto — no tight grasping (§606.4)
- Mirror: bottom edge max 40" AFF (§603.3)
- Dispensers/accessories: 15"–48" AFF reach range (§308)

COUNTERS & SERVICE AREAS (§904):
- Transaction counter max 36" AFF, min 36" wide section (§904.4)
- Parallel approach: 28"–34" AFF knee clearance (§904.4.2)
- Check-out aisles: min 36" wide (§904.3)
- Point-of-sale devices: must be within reach range 15"–48" AFF

STAIRS (§504):
- Handrails both sides: 34"–38" AFF, graspable, 12" horizontal extensions (§505)
- Riser height 4"–7", tread depth min 11" (§504.2)
- Open risers not permitted
- Nosing: max 1.5" projection, 60° to 75° underside slope (§504.5)
- Detectable warning surface at top of exterior stairs (§705)

ELEVATORS & LIFTS (§407–§410):
- Call button min 3/4" in smallest dimension, centerline 42" AFF (§407.2.1)
- Door min 36" clear width (§407.4.1)
- Car size: min 80" deep × 68" wide (center opening) (§407.4.1)
- Floor designation: tactile/Braille on both jambs at 60" AFF (§407.4.7)
- Platform lift: 30"×48" min clear floor space (§410.3)

REACH RANGES & OPERABLE PARTS (§308–§309):
- Forward reach: 15"–48" AFF unobstructed; 15"–44" over obstruction
- Side reach: 15"–48" AFF; 15"–46" over obstruction
- Operable parts: max 5 lbf activation force, no tight grasping/twisting

POOLS, RECREATION, ASSEMBLY (§220–§243):
- Pool lifts or sloped entry required for swimming pools
- Assistive listening systems in assembly areas >50 seats
- Accessible routes to all spectator areas

GROUND & FLOOR SURFACES:
- Carpet: max 1/2" pile, firmly secured, level cut pile preferred
- Grates: max 1/2" opening perpendicular to travel direction
- Note any surface discontinuities, lips, or hazards

LIGHTING & VISIBILITY (best practice, not strictly ADAAG):
- Note extremely poor lighting that would impede wayfinding for low-vision users
- Glare sources that could impede navigation

For each photo, check ALL applicable categories above. Do not skip categories just because they seem less obvious. If you cannot fully assess a standard from the photo (e.g. cannot measure exact width), note it as a potential concern with "cannot confirm from photo — recommend on-site measurement."

For positiveFindings, be specific: not just "door looks wide enough" but "Door appears to exceed 32-inch minimum clear width requirement (§404.2.3)" — cite the standard.

This analysis is informational only, not a professional inspection. Be thorough and flag anything that warrants on-site verification.`;


function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function SeverityBadge({ severity }) {
  const MAP = {
    HIGH:   { label: 'HIGH',   icon: '⚠', color: 'var(--err-fg)',  bg: 'var(--err-bg)',  border: 'var(--err-bd)'  },
    MEDIUM: { label: 'MEDIUM', icon: '▲', color: 'var(--wrn-fg)',  bg: 'var(--wrn-bg)',  border: 'var(--wrn-bd)'  },
    LOW:    { label: 'LOW',    icon: '●', color: 'var(--inf-fg)',  bg: 'var(--inf-bg)',  border: 'var(--inf-bd)'  },
  };
  const c = MAP[severity] || MAP.LOW;
  return (
    <span role="img" aria-label={c.label + ' severity'} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
      color: c.color, background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 4, padding: '2px 8px', fontFamily: 'Manrope, sans-serif',
    }}>
      {c.icon} {c.label}
    </span>
  );
}

function RiskPill({ risk }) {
  const MAP = {
    HIGH:   { label: 'High Risk',   color: 'var(--err-fg)',  bg: 'var(--err-bg)',  border: 'var(--err-bd)'  },
    MEDIUM: { label: 'Medium Risk', color: 'var(--wrn-fg)',  bg: 'var(--wrn-bg)',  border: 'var(--wrn-bd)'  },
    LOW:    { label: 'Low Risk',    color: 'var(--inf-fg)',  bg: 'var(--inf-bg)',  border: 'var(--inf-bd)'  },
    NONE:   { label: 'No Issues',   color: 'var(--suc-fg)',  bg: 'var(--suc-bg)',  border: 'var(--suc-bd)'  },
  };
  const c = MAP[risk] || MAP.NONE;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 12, fontWeight: 700, color: c.color,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 6, padding: '3px 10px', fontFamily: 'Manrope, sans-serif',
    }}>{c.label}</span>
  );
}

function HistoryRow({ record, onSelect, isSelected, onDelete }) {
  const result = (() => { try { return typeof record.analysis_result === 'string' ? JSON.parse(record.analysis_result) : (record.analysis_result || {}); } catch { return {}; } })();
  // Fall back to top-level record.image_url if uploadedUrls not in analysis_result
  const thumbUrl = result.uploadedUrls?.[0] || (record.image_url && record.image_url !== 'none' ? record.image_url : null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleDeleteClick(e) {
    e.stopPropagation();
    if (confirmDelete) { onDelete(record); } else { setConfirmDelete(true); }
  }

  function handleThumbClick(e) {
    e.stopPropagation();
    if (!thumbUrl) return;
    const a = document.createElement('a');
    a.href = thumbUrl;
    a.download = (record.location_label || 'photo') + '_1.jpg';
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <article
      aria-label={'Analysis: ' + (record.location_label || 'Unlabeled')}
      aria-current={isSelected ? 'true' : undefined}
      onClick={() => { setConfirmDelete(false); onSelect(record); }}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect(record)}
      tabIndex={0}
      role="button"
      style={{
        padding: '12px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 6,
        background: isSelected ? 'var(--card-bg-tinted)' : 'var(--card-bg)',
        border: '1px solid ' + (isSelected ? 'var(--accent)' : 'var(--card-border)'),
        outline: 'none', position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        {thumbUrl && (
          <button
            onClick={handleThumbClick}
            aria-label="Download photo"
            title="Click to download"
            style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer', borderRadius: 6, flexShrink: 0, position: 'relative' }}
          >
            <img src={thumbUrl} alt="Download photo" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--card-border)', display: 'block' }} />
            <span aria-hidden="true" style={{ position: 'absolute', bottom: 2, right: 2, fontSize: 9, background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 3, padding: '1px 3px', lineHeight: 1.2, fontFamily: 'Manrope, sans-serif' }}>↓</span>
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {record.location_label || 'Unlabeled'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--body-secondary)', marginTop: 2, fontFamily: 'Manrope, sans-serif' }}>
            <time dateTime={record.created_date}>{formatDate(record.created_date)}</time>
            {' · '}{record.photo_count || 1} photo{record.photo_count !== 1 ? 's' : ''}
          </div>
        </div>
        <RiskPill risk={result.overallRisk} />
      </div>
      {result.summary && (
        <p style={{ fontSize: 12, color: 'var(--body-secondary)', margin: '6px 0 0', lineHeight: 1.4, fontFamily: 'Manrope, sans-serif', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {result.summary}
        </p>
      )}
      {/* Delete button */}
      <button
        onClick={handleDeleteClick}
        onBlur={() => setConfirmDelete(false)}
        aria-label={confirmDelete ? 'Confirm delete' : 'Delete this analysis'}
        title={confirmDelete ? 'Click again to confirm' : 'Delete'}
        style={{
          position: 'absolute', bottom: 8, right: 8,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: confirmDelete ? '6px 10px' : '6px 8px',
          minHeight: 36, minWidth: 36,
          borderRadius: 6, border: '1px solid',
          background: confirmDelete ? 'var(--err-bg)' : 'transparent',
          borderColor: confirmDelete ? 'var(--err-bd)' : 'transparent',
          color: confirmDelete ? 'var(--err-fg)' : 'var(--body-secondary)',
          cursor: 'pointer', fontSize: 12, fontFamily: 'Manrope, sans-serif', fontWeight: 600,
          transition: 'all 0.15s',
        }}
      >
        <Trash2 size={12} aria-hidden="true" />
        {confirmDelete && 'Delete?'}
      </button>
    </article>
  );
}

function ConcernCard({ concern }) {
  const [open, setOpen] = useState(true);
  const SEV_BORDER = { HIGH: 'var(--err-bd)', MEDIUM: 'var(--wrn-bd)', LOW: 'var(--inf-bd)' };
  const SEV_BG     = { HIGH: 'var(--err-bg)', MEDIUM: 'var(--wrn-bg)', LOW: 'var(--inf-bg)' };
  const sectionMatch = concern.detail?.match(/§[\d.]+/);
  const adaSection = sectionMatch ? sectionMatch[0] : null;
  return (
    <div style={{ borderRadius: 8, border: '1px solid ' + (SEV_BORDER[concern.severity] || SEV_BORDER.LOW), background: SEV_BG[concern.severity] || SEV_BG.LOW, marginBottom: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 44 }}
      >
        <SeverityBadge severity={concern.severity} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif', lineHeight: 1.3 }}>{concern.title}</div>
          {adaSection && (
            <div style={{ fontSize: 11, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', marginTop: 2, fontWeight: 500 }}>{adaSection}</div>
          )}
        </div>
        {open ? <ChevronUp size={16} aria-hidden="true" style={{ color: 'var(--body-secondary)', flexShrink: 0 }} />
               : <ChevronDown size={16} aria-hidden="true" style={{ color: 'var(--body-secondary)', flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid ' + (SEV_BORDER[concern.severity] || SEV_BORDER.LOW) }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)', lineHeight: 1.6, margin: '12px 0 0', fontFamily: 'Manrope, sans-serif' }}>{concern.detail}</p>
          {concern.remediation && (
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span aria-hidden="true" style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>🔧</span>
              <p style={{ fontSize: 12, color: 'var(--heading)', margin: 0, lineHeight: 1.6, fontFamily: 'Manrope, sans-serif' }}>
                <strong style={{ fontWeight: 700 }}>Fix: </strong>{concern.remediation}
              </p>
            </div>
          )}
          {concern.confidence && (
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif' }}>
                Visual confidence:
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'Manrope, sans-serif', letterSpacing: '0.05em',
                padding: '1px 6px', borderRadius: 4,
                color: concern.confidence === 'HIGH' ? 'var(--suc-fg)' : concern.confidence === 'LOW' ? 'var(--wrn-fg)' : 'var(--body-secondary)',
                background: concern.confidence === 'HIGH' ? 'var(--suc-bg)' : concern.confidence === 'LOW' ? 'var(--wrn-bg)' : 'var(--slate-100)',
                border: '1px solid ' + (concern.confidence === 'HIGH' ? 'var(--suc-bd)' : concern.confidence === 'LOW' ? 'var(--wrn-bd)' : 'var(--card-border)'),
              }}>
                {concern.confidence === 'LOW' ? '⚠ Estimated — verify on-site' : concern.confidence === 'HIGH' ? '✓ Clearly visible' : '~ Likely — verify on-site'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PositiveFindingsList({ findings }) {
  if (!findings?.length) return null;
  return (
    <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--suc-bg)', border: '1px solid var(--suc-bd)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--suc-fg)', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        ✓ Compliant Features
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {findings.map((f, i) => (
          <li key={i} style={{ fontSize: 12, color: 'var(--suc-fg)', fontFamily: 'Manrope, sans-serif', lineHeight: 1.5, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <span aria-hidden="true" style={{ flexShrink: 0 }}>✓</span>{f}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhotoCard({ url, onLightbox }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
      <button
        onClick={onLightbox}
        aria-label="View full size"
        style={{ padding: 0, background: 'none', border: 'none', cursor: 'zoom-in', borderRadius: 8, flexShrink: 0 }}
      >
        <img
          src={url}
          alt="Location photo"
          style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--card-border)', display: 'block' }}
        />
      </button>
      <a
        href={url}
        download="photo.jpg"
        target="_blank"
        rel="noopener"
        aria-label="Download photo"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 6, background: 'var(--page-bg-subtle)', border: '1px solid var(--card-border)', color: 'var(--body-secondary)', textDecoration: 'none', fontSize: 12, fontWeight: 600, fontFamily: 'Manrope, sans-serif', alignSelf: 'flex-end' }}
      >
        ↓ Save
      </a>
    </div>
  );
}


function PhotoLightbox({ url, alt, onClose }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Full size photo"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        cursor: 'zoom-out',
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close photo"
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Manrope, sans-serif', lineHeight: 1,
        }}
      >
        ×
      </button>
      <img
        src={url}
        alt={alt || 'Full size photo'}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '100%', maxHeight: '90vh',
          objectFit: 'contain', borderRadius: 8,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
          cursor: 'default',
        }}
      />
    </div>
  );
}

function AnalysisResults({ result, photoUrls, onReport }) {
  if (!result) return null;
  const { readingLevel } = useReadingLevel();
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [mode, setMode] = useState('report');
  const [expandedConcerns, setExpandedConcerns] = useState({});
  const [showCompliant, setShowCompliant] = useState(false);

  const SEV_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const allConcerns = (result.photos || []).flatMap((p, pi) =>
    (p.concerns || []).map(c => ({ ...c, photoIndex: pi, photoUrl: photoUrls?.[pi] }))
  ).sort((a, b) => (SEV_ORDER[a.severity] ?? 2) - (SEV_ORDER[b.severity] ?? 2));

  const allPositive = (result.photos || []).flatMap(p => p.positiveFindings || []);
  const totalConcerns = allConcerns.length;
  const highCount = allConcerns.filter(c => c.severity === 'HIGH').length;
  const medCount = allConcerns.filter(c => c.severity === 'MEDIUM').length;
  const photoCount = result.photos?.length || 0;
  const topConcerns = allConcerns.slice(0, 3); // top 3 for Pathways

  const RISK_CONFIG = {
    HIGH:   { label: 'High Risk',   bg: 'var(--err-bg)',  color: 'var(--err-fg)',  border: 'var(--err-bd)',  icon: '⚠' },
    MEDIUM: { label: 'Medium Risk', bg: 'var(--wrn-bg)',  color: 'var(--wrn-fg)',  border: 'var(--wrn-bd)',  icon: '▲' },
    LOW:    { label: 'Low Risk',    bg: 'var(--inf-bg)',  color: 'var(--inf-fg)',  border: 'var(--inf-bd)',  icon: '●' },
    NONE:   { label: 'No Issues',   bg: 'var(--suc-bg)',  color: 'var(--suc-fg)',  border: 'var(--suc-bd)',  icon: '✓' },
  };
  const risk = RISK_CONFIG[result.overallRisk] || RISK_CONFIG.NONE;
  const hasViolations = result.overallRisk && result.overallRisk !== 'NONE';

  // Reading-level aware plain language translations
  const PLAIN = {
    simple: {
      verdict: hasViolations ? 'We found problems here.' : 'This place looks okay.',
      verdictSub: hasViolations
        ? 'This location may be breaking the law. People with disabilities might have trouble here.'
        : 'We didn\'t see any obvious problems for people with disabilities.',
      foundIssues: 'Problems we found:',
      noIssues: 'No problems found.',
      whatNext: 'What can you do?',
      ctaLabel: 'Report This Violation',
      ctaDesc: 'Tell us what happened. We\'ll connect you with a free lawyer.',
      highMeans: 'Serious problem',
      medMeans: 'Problem',
      lowMeans: 'Minor issue',
      rightsBanner: 'You have rights. The ADA says public places must be accessible to everyone.',
    },
    standard: {
      verdict: hasViolations ? 'Potential ADA violation found.' : 'No violations detected.',
      verdictSub: hasViolations
        ? 'Our analysis identified accessibility barriers that may violate the Americans with Disabilities Act.'
        : 'Our analysis did not identify apparent ADA violations in this location.',
      foundIssues: 'Issues identified:',
      noIssues: 'No accessibility concerns were identified.',
      whatNext: 'Your next steps',
      ctaLabel: 'File a Violation Report',
      ctaDesc: 'Submit this documentation to connect with an ADA attorney at no cost to you.',
      highMeans: 'Likely violation',
      medMeans: 'Possible violation',
      lowMeans: 'Minor concern',
      rightsBanner: 'Under the ADA, you have the right to access public accommodations. Filing a report is free.',
    },
    professional: {
      verdict: hasViolations ? 'ADA noncompliance indicators identified.' : 'No noncompliance indicators detected.',
      verdictSub: hasViolations
        ? `Photo analysis indicates ${highCount} HIGH and ${medCount} MEDIUM severity findings under the 2010 ADA Standards for Accessible Design.`
        : 'Photo analysis did not identify apparent violations of the 2010 ADA Standards for Accessible Design.',
      foundIssues: 'Findings:',
      noIssues: 'No findings.',
      whatNext: 'Recommended action',
      ctaLabel: 'Initiate Violation Report',
      ctaDesc: 'Submit documented findings to initiate attorney referral under Title II/III of the ADA.',
      highMeans: 'Probable violation',
      medMeans: 'Potential violation',
      lowMeans: 'Technical deficiency',
      rightsBanner: 'Title II and Title III of the ADA mandate accessible design in public accommodations and government facilities.',
    },
  };

  const lang = PLAIN[readingLevel] || PLAIN.standard;

  // Plain language translations for individual concern titles
  function plainTitle(concern) {
    if (readingLevel === 'professional') return concern.title;
    const t = concern.title?.toLowerCase() || '';
    if (t.includes('door clear width') || t.includes('door clearance')) return readingLevel === 'simple' ? 'Door too narrow for wheelchairs' : 'Door width too narrow for wheelchair access';
    if (t.includes('threshold')) return readingLevel === 'simple' ? 'Raised bump at door that could trip you' : 'Door threshold creates a trip/roll hazard';
    if (t.includes('ramp slope') || t.includes('running slope')) return readingLevel === 'simple' ? 'Ramp is too steep' : 'Ramp slope exceeds accessible design limits';
    if (t.includes('drop-off') || t.includes('level change') || t.includes('abrupt')) return readingLevel === 'simple' ? 'Dangerous drop at the entrance' : 'Abrupt level change creates fall/tipping hazard';
    if (t.includes('parking')) return readingLevel === 'simple' ? 'Accessible parking space problems' : 'Accessible parking does not meet requirements';
    if (t.includes('signage') || t.includes('braille') || t.includes('tactile')) return readingLevel === 'simple' ? 'Missing signs for blind or low-vision people' : 'Signage lacks tactile/Braille identification';
    if (t.includes('hardware')) return readingLevel === 'simple' ? 'Door handle is hard to use' : 'Door hardware requires tight grip or twisting';
    if (t.includes('maneuvering') || t.includes('clearance')) return readingLevel === 'simple' ? 'Not enough space to open the door' : 'Insufficient space to approach and open door';
    if (t.includes('pathway') || t.includes('route') || t.includes('accessible route')) return readingLevel === 'simple' ? 'Path may block wheelchair users' : 'Accessible route may be obstructed or non-compliant';
    if (t.includes('grab bar')) return readingLevel === 'simple' ? 'Missing grab bar in restroom' : 'Required grab bar absent or incorrectly positioned';
    if (t.includes('slip') || t.includes('surface')) return readingLevel === 'simple' ? 'Slippery or uneven ground' : 'Surface condition creates slip/trip hazard';
    if (t.includes('detectable warning')) return readingLevel === 'simple' ? 'Missing warning bumps for blind pedestrians' : 'Detectable warning surface absent at hazard boundary';
    return concern.title;
  }

  function handleFileReport() {
    // Pre-fill intake with top violation
    const topViolation = topConcerns[0];
    const description = topConcerns.map(c => plainTitle(c)).join('; ');
    window.location.href = createPageUrl('Intake') + '?prefill=' + encodeURIComponent(description);
  }

  function toggleConcern(key) { setExpandedConcerns(p => ({ ...p, [key]: !p[key] })); }

  return (
    <>
    {lightboxUrl && <PhotoLightbox url={lightboxUrl} alt="Analysis photo full size" onClose={() => setLightboxUrl(null)} />}
    <section aria-label="Analysis results">

      {/* ── Hero verdict bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 10, background: risk.bg, border: '1px solid ' + risk.border, marginBottom: 16 }}>
        <div style={{ fontSize: 28, lineHeight: 1 }}>{risk.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: risk.color, fontFamily: 'Fraunces, serif', lineHeight: 1.2 }}>{risk.label}</div>
          {result.summary && <div style={{ fontSize: 13, color: risk.color, opacity: 0.85, marginTop: 4, fontFamily: 'Manrope, sans-serif', lineHeight: 1.5 }}>{result.summary}</div>}
        </div>
        <div style={{ display: 'flex', gap: 12, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {[
            { v: photoCount, l: 'Photos' },
            { v: totalConcerns, l: 'Concerns' },
            { v: highCount, l: 'HIGH' },
          ].map(({ v, l }) => (
            <div key={l} style={{ textAlign: 'center', minWidth: 40 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: risk.color, fontFamily: 'Fraunces, serif', lineHeight: 1 }}>{v}</div>
              <div style={{ fontSize: 10, color: risk.color, opacity: 0.75, fontFamily: 'Manrope, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mode toggle ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {[['report', '📋 Compliance'], ['pathways', '🧭 Pathways']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m} style={{ padding: '8px 14px', borderRadius: 6, border: '1.5px solid', fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 44, transition: 'all 0.15s', borderColor: mode === m ? 'var(--accent)' : 'var(--card-border)', background: mode === m ? 'var(--card-bg-tinted)' : 'transparent', color: mode === m ? 'var(--accent)' : 'var(--body-secondary)' }}>{label}</button>
        ))}
      </div>

      {/* ── TRIAGE MODE ── */}
      {mode === 'triage' && (
        <div>
          {/* Photos — full width, stacked */}
          {photoUrls?.length > 0 && (
            <div>
              {photoUrls.map((url, pi) => (
                <PhotoCard key={pi} url={url} onLightbox={() => setLightboxUrl(url)} />
              ))}
            </div>
          )}

          {result.crossPhotoFindings && (
            <div style={{ fontSize: 12, color: 'var(--inf-fg)', lineHeight: 1.5, marginBottom: 12, padding: '10px 12px', background: 'var(--inf-bg)', border: '1px solid var(--inf-bd)', borderRadius: 8, fontFamily: 'Manrope, sans-serif', display: 'flex', gap: 8 }}>
              <Info size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
              <span><strong>Cross-location: </strong>{result.crossPhotoFindings}</span>
            </div>
          )}

          {/* Concern cards — large, thumb-friendly */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            {totalConcerns} Issue{totalConcerns !== 1 ? 's' : ''} Found
          </div>
          <div role="list" aria-label="All concerns by severity" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {allConcerns.map((c, i) => {
              const isOpen = expandedConcerns[i];
              const SEV_BORDER = { HIGH: 'var(--err-bd)', MEDIUM: 'var(--wrn-bd)', LOW: 'var(--inf-bd)' };
              const SEV_BG = { HIGH: 'var(--err-bg)', MEDIUM: 'var(--wrn-bg)', LOW: 'var(--inf-bg)' };
              const SEV_FG = { HIGH: 'var(--err-fg)', MEDIUM: 'var(--wrn-fg)', LOW: 'var(--inf-fg)' };
              const SEV_ICON = { HIGH: '⚠', MEDIUM: '▲', LOW: '●' };
              const sectionMatch = c.detail?.match(/§[\d.]+/);
              return (
                <div key={i} role="listitem" style={{ borderRadius: 10, border: '1.5px solid ' + (SEV_BORDER[c.severity] || SEV_BORDER.LOW), background: isOpen ? (SEV_BG[c.severity] || SEV_BG.LOW) : 'var(--card-bg)', overflow: 'hidden', transition: 'background 0.15s' }}>
                  <button
                    onClick={() => toggleConcern(i)}
                    aria-expanded={isOpen}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 56 }}
                  >
                    {/* Severity icon — large enough for Gina */}
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: SEV_BG[c.severity] || SEV_BG.LOW, border: '1.5px solid ' + (SEV_BORDER[c.severity] || SEV_BORDER.LOW), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, color: SEV_FG[c.severity] || SEV_FG.LOW }}>
                      {SEV_ICON[c.severity] || '●'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif', lineHeight: 1.35 }}>{c.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: SEV_FG[c.severity] || 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.severity}</span>
                        {sectionMatch && <span style={{ fontSize: 11, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif' }}>{sectionMatch[0]}</span>}
                      </div>
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: isOpen ? (SEV_BG[c.severity] || SEV_BG.LOW) : 'var(--page-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: 'var(--body-secondary)', border: '1px solid var(--card-border)' }}>
                      {isOpen ? '▲' : '▼'}
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid ' + (SEV_BORDER[c.severity] || SEV_BORDER.LOW) }}>
                      <p style={{ fontSize: 14, color: 'var(--heading)', lineHeight: 1.7, margin: '12px 0 0', fontFamily: 'Manrope, sans-serif' }}>{c.detail}</p>
                      {c.remediation && (
                        <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>🔧 Recommended Fix</div>
                          <p style={{ fontSize: 13, color: 'var(--heading)', margin: 0, lineHeight: 1.6, fontFamily: 'Manrope, sans-serif' }}>{c.remediation}</p>
                        </div>
                      )}
                      {c.confidence && (
                        <div style={{ marginTop: 8, fontSize: 12, color: SEV_FG[c.severity] || 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', opacity: 0.8 }}>
                          {c.confidence === 'HIGH' ? '✓ Clearly visible in photo' : c.confidence === 'LOW' ? '⚠ Estimated — on-site verification needed' : '~ Likely — on-site verification recommended'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {allPositive.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button onClick={() => setShowCompliant(p => !p)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--suc-bd)', background: 'var(--suc-bg)', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--suc-fg)', width: '100%', textAlign: 'left', minHeight: 52 }}>
                <span style={{ fontSize: 16 }}>✓</span>
                <span>{allPositive.length} Compliant Feature{allPositive.length !== 1 ? 's' : ''}</span>
                <span aria-hidden="true" style={{ marginLeft: 'auto', fontSize: 11 }}>{showCompliant ? '▲' : '▼'}</span>
              </button>
              {showCompliant && (
                <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {allPositive.map((f, i) => (
                    <li key={i} style={{ fontSize: 13, color: 'var(--suc-fg)', fontFamily: 'Manrope, sans-serif', lineHeight: 1.6, padding: '10px 14px', background: 'var(--suc-bg)', borderRadius: 8, border: '1px solid var(--suc-bd)', display: 'flex', gap: 8 }}>
                      <span aria-hidden="true" style={{ flexShrink: 0 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── COMPLIANCE REPORT MODE ── */}
      {mode === 'report' && (
        <div>
          <div style={{ padding: '14px 16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 8, marginBottom: 16, fontFamily: 'Manrope, sans-serif' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--body-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Notice of ADA Noncompliance</div>
            <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.7 }}>
              This assessment identifies <strong>{totalConcerns} potential ADA compliance concern{totalConcerns !== 1 ? 's' : ''}</strong> across {photoCount} photo{photoCount !== 1 ? 's' : ''}, including <strong>{highCount} HIGH</strong> and <strong>{medCount} MEDIUM</strong> severity findings. All items below require attention to meet the 2010 ADA Standards for Accessible Design.
            </div>
            <div style={{ fontSize: 11, color: 'var(--body-secondary)', marginTop: 8 }}>
              Assessment date: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} · For informational purposes only — not a professional ADA inspection.
            </div>
          </div>

          {result.photos?.map((photo, idx) => (
            <div key={idx} style={{ marginBottom: 20, borderRadius: 10, border: '1px solid var(--card-border)', background: 'var(--card-bg)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', background: 'var(--slate-100)', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                {photoUrls?.[idx] && (
                  <PhotoCard url={photoUrls[idx]} onLightbox={() => setLightboxUrl(photoUrls[idx])} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Photo {idx + 1}</div>
                  <div style={{ fontSize: 12, color: 'var(--body)', fontFamily: 'Manrope, sans-serif', marginTop: 2, lineHeight: 1.4 }}>{photo.description}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--err-fg)', fontFamily: 'Manrope, sans-serif', flexShrink: 0 }}>{photo.concerns?.length || 0} issue{photo.concerns?.length !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                {(photo.concerns || []).map((c, ci) => (
                  <div key={ci} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: ci < photo.concerns.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                      <SeverityBadge severity={c.severity} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif' }}>{c.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', marginTop: 1 }}>{c.detail?.match(/§[\d.]+/)?.[0]}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--body)', lineHeight: 1.6, margin: '0 0 6px', fontFamily: 'Manrope, sans-serif' }}>{c.detail}</p>
                    {c.remediation && (
                      <div style={{ padding: '6px 10px', borderRadius: 5, background: 'var(--page-bg-subtle)', border: '1px solid var(--card-border)', fontSize: 12, color: 'var(--body)', fontFamily: 'Manrope, sans-serif', lineHeight: 1.5 }}>
                        <strong>Required action: </strong>{c.remediation}
                      </div>
                    )}
                  </div>
                ))}
                {(photo.positiveFindings?.length > 0) && (
                  <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, background: 'var(--suc-bg)', border: '1px solid var(--suc-bd)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--suc-fg)', fontFamily: 'Manrope, sans-serif', marginBottom: 4 }}>✓ Compliant features observed</div>
                    {photo.positiveFindings.map((f, i) => <div key={i} style={{ fontSize: 12, color: 'var(--suc-fg)', fontFamily: 'Manrope, sans-serif', lineHeight: 1.5 }}>• {f}</div>)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PATHWAYS MODE ── */}
      {mode === 'pathways' && (
        <div>
          {/* Rights banner */}
          <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--inf-bg)', border: '1px solid var(--inf-bd)', marginBottom: 16, fontFamily: 'Manrope, sans-serif', fontSize: 13, color: 'var(--inf-fg)', lineHeight: 1.6 }}>
            <strong>🛡 Your rights matter. </strong>{lang.rightsBanner}
          </div>

          {/* Photo */}
          {photoUrls?.length > 0 && (
            <div>
              {photoUrls.map((url, i) => (
                <PhotoCard key={i} url={url} onLightbox={() => setLightboxUrl(url)} />
              ))}
            </div>
          )}

          {/* Plain-language verdict */}
          <div style={{ padding: '20px', borderRadius: 10, background: risk.bg, border: '2px solid ' + risk.border, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: readingLevel === 'simple' ? 24 : 20, fontWeight: 800, color: risk.color, fontFamily: 'Fraunces, serif', lineHeight: 1.2, marginBottom: 8 }}>
              {lang.verdict}
            </div>
            <div style={{ fontSize: readingLevel === 'simple' ? 15 : 13, color: risk.color, opacity: 0.9, fontFamily: 'Manrope, sans-serif', lineHeight: 1.6 }}>
              {lang.verdictSub}
            </div>
          </div>

          {/* Top concerns in plain language */}
          {hasViolations && topConcerns.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif', marginBottom: 10 }}>{lang.foundIssues}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topConcerns.map((c, i) => {
                  const SEV_BG = { HIGH: 'var(--err-bg)', MEDIUM: 'var(--wrn-bg)', LOW: 'var(--inf-bg)' };
                  const SEV_FG = { HIGH: 'var(--err-fg)', MEDIUM: 'var(--wrn-fg)', LOW: 'var(--inf-fg)' };
                  const SEV_BD = { HIGH: 'var(--err-bd)', MEDIUM: 'var(--wrn-bd)', LOW: 'var(--inf-bd)' };
                  const severityLabel = { HIGH: lang.highMeans, MEDIUM: lang.medMeans, LOW: lang.lowMeans };
                  return (
                    <div key={i} style={{ padding: '14px 16px', borderRadius: 8, background: SEV_BG[c.severity] || SEV_BG.LOW, border: '1px solid ' + (SEV_BD[c.severity] || SEV_BD.LOW), display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>
                        {c.severity === 'HIGH' ? '⚠️' : c.severity === 'MEDIUM' ? '⚠' : 'ℹ️'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: readingLevel === 'simple' ? 16 : 14, fontWeight: 700, color: SEV_FG[c.severity] || SEV_FG.LOW, fontFamily: 'Manrope, sans-serif', lineHeight: 1.3, marginBottom: 4 }}>
                          {plainTitle(c)}
                        </div>
                        <div style={{ fontSize: 11, color: SEV_FG[c.severity], opacity: 0.75, fontFamily: 'Manrope, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {severityLabel[c.severity]}
                        </div>
                        {readingLevel === 'professional' && c.detail && (
                          <div style={{ fontSize: 12, color: 'var(--body)', fontFamily: 'Manrope, sans-serif', marginTop: 6, lineHeight: 1.5 }}>{c.detail}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {allConcerns.length > 3 && (
                <div style={{ fontSize: 12, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', marginTop: 8, textAlign: 'center' }}>
                  + {allConcerns.length - 3} more concern{allConcerns.length - 3 !== 1 ? 's' : ''} — switch to Triage View for full details
                </div>
              )}
            </div>
          )}

          {!hasViolations && (
            <div style={{ padding: '20px', borderRadius: 10, background: 'var(--suc-bg)', border: '1px solid var(--suc-bd)', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 14, color: 'var(--suc-fg)', fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>{lang.noIssues}</div>
            </div>
          )}

          {/* What next */}
          <div style={{ padding: '16px', borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--card-border)', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', fontFamily: 'Fraunces, serif', marginBottom: 12 }}>{lang.whatNext}</div>

            {hasViolations && onReport && (
              <button
                onClick={handleFileReport}
                style={{ width: '100%', minHeight: 56, padding: '14px 20px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: readingLevel === 'simple' ? 17 : 15, fontWeight: 800, border: 'none', cursor: 'pointer', marginBottom: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
              >
                <span>{lang.ctaLabel}</span>
                <span style={{ fontSize: 12, opacity: 0.85, fontWeight: 400 }}>{lang.ctaDesc}</span>
              </button>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                readingLevel === 'simple'
                  ? '📸 Take more photos if you can — closer shots of the problems help.'
                  : '📸 Additional photos of specific barriers will strengthen any legal filing.',
                readingLevel === 'simple'
                  ? '📍 Write down the address and date you visited.'
                  : '📍 Document the location address, date of visit, and any witnesses.',
                readingLevel === 'simple'
                  ? '💬 You don\'t have to pay anything to report a violation.'
                  : '💬 ADA violations can be reported at no cost — attorney fees are typically covered by the defendant.',
              ].map((tip, i) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--body)', fontFamily: 'Manrope, sans-serif', lineHeight: 1.5, padding: '10px 12px', background: 'var(--page-bg-subtle)', borderRadius: 7, border: '1px solid var(--card-border)' }}>{tip}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CTA (Triage + Report modes only) ── */}
      {mode === 'report' && totalConcerns > 0 && onReport && (
        <div style={{ padding: '14px 18px', borderRadius: 8, background: 'var(--card-bg-tinted)', border: '1px solid var(--accent)', marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif' }}>Potential violation documented</div>
            <div style={{ fontSize: 12, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', marginTop: 2 }}>Ready to submit a formal report? Connect with an ADA attorney.</div>
          </div>
          <button onClick={onReport} style={{ padding: '10px 20px', borderRadius: 8, background: 'var(--accent)', color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', minHeight: 44 }}>
            File a Report
          </button>
        </div>
      )}

      <aside aria-label="Legal disclaimer" style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--banner-info-bg)', border: '1px solid var(--banner-info-border)', display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 12 }}>
        <Info size={14} aria-hidden="true" style={{ color: 'var(--banner-info-text)', flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: 'var(--banner-info-text)', lineHeight: 1.6, margin: 0, fontFamily: 'Manrope, sans-serif' }}>
          <strong>Disclaimer:</strong> This AI-powered analysis is informational only and does not constitute a professional ADA inspection or legal advice. Actual compliance determinations require on-site assessment by a qualified ADA consultant. For legal guidance, connect with an attorney through ADA Legal Link.
        </p>
      </aside>
    </section>
    </>
  );
}

function BatchReanalysisModal({ history, onClose, onComplete, runAnalysisForRecord }) {
  const [jobs, setJobs] = useState(() =>
    history.map(r => {
      const parsed = (() => { try { return typeof r.analysis_result === 'string' ? JSON.parse(r.analysis_result) : (r.analysis_result || {}); } catch { return {}; } })();
      const urls = parsed.uploadedUrls
        || (r.image_url && r.image_url !== 'none' ? [r.image_url] : null)
        || (parsed.image_url && parsed.image_url !== 'none' ? [parsed.image_url] : []);
      return { record: r, urls, status: urls.length ? 'pending' : 'skipped', error: null };
    })
  );
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const totalEligible = jobs.filter(j => j.status !== 'skipped').length;
  const completed = jobs.filter(j => j.status === 'done').length;
  const failed = jobs.filter(j => j.status === 'error').length;

  async function runAll() {
    setRunning(true);
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      if (job.status === 'skipped') continue;
      setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: 'running' } : j));
      try {
        await runAnalysisForRecord(job.record, job.urls);
        setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: 'done' } : j));
      } catch (e) {
        setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, status: 'error', error: e?.message || 'Failed' } : j));
      }
    }
    setRunning(false);
    setDone(true);
    onComplete();
  }

  const STATUS_ICON = { pending: '○', running: '⟳', done: '✓', error: '✗', skipped: '—' };
  const STATUS_COLOR = { pending: 'var(--body-secondary)', running: 'var(--accent)', done: 'var(--suc-fg)', error: 'var(--err-fg)', skipped: 'var(--body-secondary)' };

  return (
    <div role="dialog" aria-modal="true" aria-label="Reanalyze all records" onClick={e => e.stopPropagation()}
      style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 28, maxWidth: 540, width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 12px 48px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--heading)', fontFamily: 'Fraunces, serif' }}>Reanalyze All Records</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif' }}>
              Your photos are safe — only the analysis text will be updated using the new vision model.
            </p>
          </div>
          {!running && (
            <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--body-secondary)', fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
          )}
        </div>

        {/* Progress bar */}
        {running || done ? (
          <div style={{ marginBottom: 14 }}>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--slate-200)', overflow: 'hidden', marginBottom: 6 }}>
              <div style={{ height: '100%', borderRadius: 3, background: done && failed === 0 ? 'var(--suc-fg)' : 'var(--accent)', transition: 'width 0.4s', width: `${totalEligible ? Math.round((completed + failed) / totalEligible * 100) : 0}%` }} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', margin: 0 }}>
              {done ? `Complete — ${completed} updated, ${failed} failed, ${jobs.filter(j=>j.status==='skipped').length} skipped`
                     : `${completed + failed} of ${totalEligible} processed…`}
            </p>
          </div>
        ) : (
          <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 8, background: 'var(--wrn-bg)', border: '1px solid var(--wrn-bd)' }}>
            <p style={{ fontSize: 13, color: 'var(--wrn-fg)', fontFamily: 'Manrope, sans-serif', margin: 0, fontWeight: 600 }}>
              ⚠ This will rerun analysis on {totalEligible} record{totalEligible !== 1 ? 's' : ''} using Claude vision. This may take a minute. Do not close the page.
            </p>
          </div>
        )}

        {/* Job list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {jobs.map((job, i) => {
            const label = job.record.location_label || 'Unlabeled';
            const date = formatDate(job.record.created_date);
            return (
              <div key={job.record.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, background: 'var(--page-bg-subtle)', border: '1px solid var(--card-border)' }}>
                <span aria-hidden="true" style={{ fontSize: 14, fontWeight: 700, color: STATUS_COLOR[job.status], flexShrink: 0, width: 16, textAlign: 'center', animation: job.status === 'running' ? 'spin 1s linear infinite' : 'none' }}>{STATUS_ICON[job.status]}</span>
                {job.urls[0] && <img src={job.urls[0]} alt="" aria-hidden="true" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 5, flexShrink: 0, border: '1px solid var(--card-border)' }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif' }}>
                    {date} · {job.urls.length} photo{job.urls.length !== 1 ? 's' : ''}
                    {job.status === 'skipped' && ' · no photos found'}
                    {job.status === 'error' && <span style={{ color: 'var(--err-fg)' }}> · {job.error}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 18, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          {!running && !done && (
            <>
              <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--body)', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={runAll} disabled={totalEligible === 0} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, cursor: totalEligible === 0 ? 'not-allowed' : 'pointer', minHeight: 44 }}>
                Run Vision Analysis on {totalEligible} Record{totalEligible !== 1 ? 's' : ''}
              </button>
            </>
          )}
          {done && (
            <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>Done</button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function AdminPhotoAnalyzer() {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [locationLabel, setLocationLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyRiskFilter, setHistoryRiskFilter] = useState('ALL');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const announce = useAnnounce();
  const fileInputRef = useRef();
  const resultsRef = useRef();
  const errorRef = useRef();

  useEffect(() => {
    async function init() {
      try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') { window.location.href = createPageUrl('Home'); return; }
      } catch (e) { window.location.href = createPageUrl('Home'); return; }
      setPageLoading(false);
      loadHistory();
    }
    init();
  }, []);

  useEffect(() => { if (error && errorRef.current) errorRef.current.focus(); }, [error]);

  async function loadHistory() {
    setHistoryLoading(true);
    try { setHistory((await base44.entities.PhotoAnalysis.list('-created_date', 50)) || []); }
    catch (e) { console.warn('History load failed:', e); }
    setHistoryLoading(false);
  }

  function handleFiles(incoming) {
    const valid = Array.from(incoming).filter(f => f.type.startsWith('image/')).slice(0, 5);
    setFiles(valid);
    setResult(null); setSelectedRecord(null); setError('');
    previews.forEach(u => URL.revokeObjectURL(u));
    setPreviews(valid.map(f => URL.createObjectURL(f)));
  }

  function removeFile(idx) {
    URL.revokeObjectURL(previews[idx]);
    setFiles(files.filter((_, i) => i !== idx));
    setPreviews(previews.filter((_, i) => i !== idx));
  }

  const handleDrop = useCallback(e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }, [previews]);

  // Strip verbose fields before DB storage to stay under Base44's field size limit.
  // The full result (with remediation, long descriptions) lives in React state for display.
  // On reload, we reconstruct from the lean stored version — display fields are still shown,
  // just without remediation text (which users see on fresh analyses anyway).
  function compressForStorage(parsedWithUrls) {
    return JSON.stringify({
      summary: parsedWithUrls.summary,
      overallRisk: parsedWithUrls.overallRisk,
      crossPhotoFindings: parsedWithUrls.crossPhotoFindings,
      uploadedUrls: parsedWithUrls.uploadedUrls,
      photos: (parsedWithUrls.photos || []).map(p => ({
        photoIndex: p.photoIndex,
        description: p.description,
        positiveFindings: p.positiveFindings,
        concerns: (p.concerns || []).map(c => ({
          title: c.title,
          severity: c.severity,
          confidence: c.confidence,
          // Truncate detail and drop remediation to save space
          detail: c.detail ? c.detail.slice(0, 200) : c.detail,
        })),
      })),
    });
  }

  async function runAnalysis() {
    if (!files.length) { setError('Please upload at least one photo before running the analysis.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      // Step 1: Upload each photo to Base44 CDN to get accessible URLs
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (file_url) uploadedUrls.push(file_url);
      }
      if (!uploadedUrls.length) throw new Error('Photo upload failed — no URLs returned.');

      // Step 2: Call Claude vision model via Base44 InvokeLLM
      // file_urls passes the uploaded CDN images directly to the vision model
      // response_json_schema ensures structured output without regex parsing
      const multiPhotoNote = uploadedUrls.length > 1
        ? `\nIMPORTANT: You are receiving ${uploadedUrls.length} photos from the SAME physical location. Analyze them holistically as a set. Look for cross-photo compliance chains (e.g. a ramp in one photo leads to a door in another). Populate crossPhotoFindings when you observe patterns spanning multiple photos.\n`
        : '';

      const fullPrompt = `${ADA_SYSTEM_PROMPT}

Location being assessed: ${locationLabel || 'Not specified'}
Number of photos: ${uploadedUrls.length}
${multiPhotoNote}
Carefully examine each attached photo. Use your vision to assess what is actually visible. For each concern, note whether you can see it clearly or are estimating based on context.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        model: 'claude_sonnet_4_6',
        file_urls: uploadedUrls,
        add_context_from_internet: false,
      });

      // Parse JSON from text response — response_json_schema conflicts with file_urls in Base44
      const rawText = typeof response === 'string' ? response : (response?.result || response?.text || JSON.stringify(response));
      const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      const parsedWithUrls = { ...parsed, uploadedUrls };
      setResult(parsedWithUrls);
      const totalConcerns = (parsed.photos || []).reduce((s, p) => s + (p.concerns?.length || 0), 0);
      const highCount = (parsed.photos || []).reduce((s, p) => s + (p.concerns?.filter(c => c.severity === 'HIGH').length || 0), 0);
      announce(`Analysis complete. ${parsed.overallRisk || 'No'} risk. ${totalConcerns} concern${totalConcerns !== 1 ? 's' : ''} found, ${highCount} high severity.`, 'assertive');
      setTimeout(() => resultsRef.current?.focus(), 100);

      try {
        const saved = await base44.entities.PhotoAnalysis.create({ location_label: locationLabel || 'Unlabeled', photo_count: files.length, analysis_result: compressForStorage(parsedWithUrls), image_url: uploadedUrls[0] || 'none', overall_risk: parsed.overallRisk || 'NONE' });
        setHistory(prev => [saved, ...prev]);
        setSelectedRecord(saved);
      } catch (dbErr) { console.warn('DB persist failed:', dbErr); }
    } catch (e) { setError('Analysis failed — ' + (e?.message || 'please check your connection and try again.')); console.error(e); }
    setLoading(false);
  }

  function selectRecord(record) {
    const parsed = (() => { try { return typeof record.analysis_result === 'string' ? JSON.parse(record.analysis_result) : (record.analysis_result || null); } catch { return null; } })();
    setSelectedRecord(record); setResult(parsed);
    setFiles([]); previews.forEach(u => URL.revokeObjectURL(u)); setPreviews([]);
    setLocationLabel(record.location_label || ''); setError('');
    setShowHistory(false); // close mobile drawer on selection
  }

  function startNew() {
    setSelectedRecord(null); setResult(null);
    setFiles([]); previews.forEach(u => URL.revokeObjectURL(u)); setPreviews([]);
    setLocationLabel(''); setError('');
  }

  async function deleteRecord(record) {
    try {
      await base44.entities.PhotoAnalysis.delete(record.id);
      setHistory(prev => prev.filter(r => r.id !== record.id));
      if (selectedRecord?.id === record.id) startNew();
    } catch (e) { console.error('Delete failed:', e); }
  }

  async function reanalyzeRecord(record, uploadedUrls) {
    const multiPhotoNote = uploadedUrls.length > 1
      ? `\nIMPORTANT: You are receiving ${uploadedUrls.length} photos from the SAME physical location. Analyze them holistically as a set. Look for cross-photo compliance chains. Populate crossPhotoFindings when you observe patterns spanning multiple photos.\n`
      : '';
    const locationLabel = record.location_label || 'Not specified';
    const fullPrompt = `${ADA_SYSTEM_PROMPT}

Location being assessed: ${locationLabel}
Number of photos: ${uploadedUrls.length}
${multiPhotoNote}
Carefully examine each attached photo. Use your vision to assess what is actually visible. For each concern, note whether you can see it clearly or are estimating based on context.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      model: 'claude_sonnet_4_6',
      file_urls: uploadedUrls,
      add_context_from_internet: false,
    });

    const rawText = typeof response === 'string' ? response : (response?.result || response?.text || JSON.stringify(response));
    const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());

    // Guard: if vision returned no photos, something went wrong — don't overwrite good data
    if (!parsed.photos || parsed.photos.length === 0) {
      throw new Error('Vision model returned empty analysis — photos may be inaccessible. Original data preserved.');
    }

    const parsedWithUrls = { ...parsed, uploadedUrls };

    // Update the DB record — only update analysis_result (preserve all other fields)
    // overall_risk is intentionally omitted — Base44 may reject unknown fields in update
    await base44.entities.PhotoAnalysis.update(record.id, {
      analysis_result: compressForStorage(parsedWithUrls),
    });

    // Update in-memory history with compressed version (matches what's in DB)
    setHistory(prev => prev.map(r => r.id === record.id
      ? { ...r, analysis_result: compressForStorage(parsedWithUrls), overall_risk: parsed.overallRisk || 'NONE' }
      : r
    ));

    // If this record is currently selected, refresh the displayed result
    if (selectedRecord?.id === record.id) setResult(parsedWithUrls);
  }

  if (pageLoading) return (
    <div role="status" aria-label="Loading ADA Photo Analyzer" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}>
      <div className="a11y-spinner" aria-hidden="true" />
      <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)' }}>Loading…</p>
    </div>
  );

  return (
    <div aria-busy={loading} style={{ backgroundColor: 'var(--page-bg)', minHeight: 'calc(100vh - 200px)', padding: 'clamp(0.75rem, 3vw, 1.5rem)' }}>
      {showBatchModal && (
        <BatchReanalysisModal
          history={history}
          onClose={() => setShowBatchModal(false)}
          onComplete={() => loadHistory()}
          runAnalysisForRecord={reanalyzeRecord}
        />
      )}
      <style>{`
        /* Severity semantic tokens — AAA-verified (≥7:1) in light + dark + high-contrast */
        :root {
          --err-fg: #991B1B; --err-bg: #FEF2F2; --err-bd: #FCA5A5;
          --wrn-fg: #78350F; --wrn-bg: #FFFBEB; --wrn-bd: #FCD34D;
          --inf-fg: #1E3A8A; --inf-bg: #EFF6FF; --inf-bd: #93C5FD;
          --suc-fg: #14532D; --suc-bg: #F0FDF4; --suc-bd: #86EFAC;
        }
        /* Dark mode overrides — sourced from DisplaySettings token map */
        body[data-mode="dark"] :root, html.dark :root,
        [data-display-pref="dark"] {
          --err-fg: #FCA5A5 !important; --err-bg: #3B0808 !important; --err-bd: #7F1D1D !important;
          --wrn-fg: #FDE68A !important; --wrn-bg: #2D1A00 !important; --wrn-bd: #78350F !important;
          --inf-fg: #93C5FD !important; --inf-bg: #0C1A3D !important; --inf-bd: #1E3A8A !important;
          --suc-fg: #86EFAC !important; --suc-bg: #052E16 !important; --suc-bd: #14532D !important;
        }
        /* High contrast */
        @media (prefers-contrast: more) {
          :root {
            --err-fg: #7F0000 !important; --err-bg: #FFF0F0 !important; --err-bd: #7F0000 !important;
            --wrn-fg: #4A2000 !important; --wrn-bg: #FFFAEB !important; --wrn-bd: #4A2000 !important;
            --inf-fg: #001A7F !important; --inf-bg: #EFF4FF !important; --inf-bd: #001A7F !important;
            --suc-fg: #004020 !important; --suc-bg: #F0FFF5 !important; --suc-bd: #004020 !important;
          }
          button, input, textarea { border-width: 2px !important; }
        }
        /* Focus ring — consistent with globals.css */
        *:focus-visible { outline: 3px solid var(--accent-light) !important; outline-offset: 2px !important; }
        *:focus:not(:focus-visible) { outline: none !important; }
        .drop-zone:focus-visible { outline: 3px solid var(--accent) !important; outline-offset: 3px !important; }
        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; } }
        /* Mobile-first responsive layout */
        @media (max-width: 700px) {
          .photo-grid { grid-template-columns: 1fr !important; }
          .history-panel { display: none; }
          .history-panel.open { display: block !important; position: fixed; inset: 0; z-index: 9990; background: var(--card-bg); overflow-y: auto; padding: 16px; }
        }
        @media (min-width: 701px) {
          .history-toggle { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <AdminPageHeader
          title="ADA Photo Analyzer"
          actionButton={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="history-toggle" onClick={() => setShowHistory(p => !p)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 14px', minHeight: 44, borderRadius: 8, background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Manrope, sans-serif' }}>
                📋 History ({history.length})
              </button>
              {history.length > 0 && !historyLoading && (
                <button onClick={() => setShowBatchModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 16px', minHeight: 44, borderRadius: 8, background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent)', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Manrope, sans-serif' }}>
                  ⟳ Reanalyze All
                </button>
              )}
              {selectedRecord && (
                <button onClick={startNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 20px', minHeight: 44, borderRadius: 8, background: 'var(--accent)', color: '#FFFFFF', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', fontFamily: 'Manrope, sans-serif' }}>
                  <Plus size={16} aria-hidden="true" /> New Analysis
                </button>
              )}
            </div>
          }
        />

        <div className="photo-grid" style={{ display: 'grid', gridTemplateColumns: 'clamp(240px, 28%, 300px) 1fr', gap: 20, alignItems: 'start' }}>

          {/* ── Sidebar: History ── */}
          <aside aria-label="Analysis history" className={`history-panel${showHistory ? ' open' : ''}`}>
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h2 style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Past Analyses
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif' }}>
                    {history.length} record{history.length !== 1 ? 's' : ''}
                  </span>
                  <button className="history-toggle" onClick={() => setShowHistory(false)} aria-label="Close history" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--body-secondary)', fontSize: 20, lineHeight: 1, padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              </div>

              {/* Search */}
              <input
                type="search"
                aria-label="Search analyses by location"
                placeholder="Search location…"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', padding: '7px 10px', marginBottom: 8, borderRadius: 6, fontFamily: 'Manrope, sans-serif', fontSize: 12, background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--body)', outline: 'none' }}
              />

              {/* Risk filter pills */}
              <div role="group" aria-label="Filter by risk level" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                {['ALL','HIGH','MEDIUM','LOW','NONE'].map(r => {
                  const active = historyRiskFilter === r;
                  const colors = { HIGH: 'var(--err-fg)', MEDIUM: 'var(--wrn-fg)', LOW: 'var(--inf-fg)', NONE: 'var(--suc-fg)', ALL: 'var(--heading)' };
                  const bgs    = { HIGH: 'var(--err-bg)', MEDIUM: 'var(--wrn-bg)', LOW: 'var(--inf-bg)', NONE: 'var(--suc-bg)', ALL: 'var(--card-bg-tinted)' };
                  const bds    = { HIGH: 'var(--err-bd)', MEDIUM: 'var(--wrn-bd)', LOW: 'var(--inf-bd)', NONE: 'var(--suc-bd)', ALL: 'var(--card-border)' };
                  return (
                    <button
                      key={r}
                      onClick={() => setHistoryRiskFilter(r)}
                      aria-pressed={active}
                      style={{
                        padding: '2px 8px', borderRadius: 5, border: '1px solid',
                        fontSize: 10, fontWeight: 700, fontFamily: 'Manrope, sans-serif',
                        cursor: 'pointer', letterSpacing: '0.04em',
                        color: active ? colors[r] : 'var(--body-secondary)',
                        background: active ? bgs[r] : 'transparent',
                        borderColor: active ? bds[r] : 'var(--card-border)',
                      }}
                    >{r}</button>
                  );
                })}
              </div>

              {historyLoading ? (
                <div role="status" style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div className="a11y-spinner" aria-hidden="true" style={{ width: '1.5rem', height: '1.5rem' }} />
                  <p style={{ fontSize: 13, color: 'var(--body-secondary)', marginTop: 8, fontFamily: 'Manrope, sans-serif' }}>Loading…</p>
                </div>
              ) : (() => {
                const filtered = history.filter(r => {
                  const parsed = (() => { try { return typeof r.analysis_result === 'string' ? JSON.parse(r.analysis_result) : (r.analysis_result || {}); } catch { return {}; } })();
                  const matchesRisk = historyRiskFilter === 'ALL' || parsed.overallRisk === historyRiskFilter;
                  const matchesSearch = !historySearch.trim() || (r.location_label || '').toLowerCase().includes(historySearch.trim().toLowerCase());
                  return matchesRisk && matchesSearch;
                });
                if (filtered.length === 0) return (
                  <p style={{ fontSize: 12, color: 'var(--body-secondary)', textAlign: 'center', padding: '20px 0', fontFamily: 'Manrope, sans-serif' }}>
                    {history.length === 0 ? 'No analyses yet. Upload photos to get started.' : 'No results match your filter.'}
                  </p>
                );
                return (
                  <div role="list" aria-label="Past analyses">
                    {filtered.map(r => <div key={r.id} role="listitem"><HistoryRow record={r} onSelect={selectRecord} isSelected={selectedRecord?.id === r.id} onDelete={deleteRecord} /></div>)}
                  </div>
                );
              })()}
            </div>
          </aside>

          {/* ── Main: Upload + Results ── */}
          <main aria-label="Photo analysis workspace">

            {/* Upload panel */}
            {!selectedRecord && (
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', fontFamily: 'Fraunces, serif' }}>
                  New Analysis
                </h2>

                {/* Location label */}
                <div style={{ marginBottom: 16 }}>
                  <label htmlFor="location-label" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--heading)', marginBottom: 6, fontFamily: 'Manrope, sans-serif' }}>
                    Location Label
                  </label>
                  <input
                    id="location-label"
                    type="text"
                    value={locationLabel}
                    onChange={e => setLocationLabel(e.target.value)}
                    placeholder="e.g. Desert Valley Medical — Main Entrance"
                    aria-describedby="location-hint"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 14px', minHeight: 44, borderRadius: 8, fontFamily: 'Manrope, sans-serif', fontSize: 14, background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--body)', outline: 'none' }}
                  />
                  <p id="location-hint" style={{ fontSize: 12, color: 'var(--body-secondary)', margin: '4px 0 0', fontFamily: 'Manrope, sans-serif' }}>
                    Optional — helps identify this analysis in your history.
                  </p>
                </div>

                {/* Drop zone */}
                <div
                  className="drop-zone"
                  role="button"
                  tabIndex={0}
                  aria-label="Upload photos. Click or drag and drop up to 5 images."
                  aria-describedby="upload-hint"
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
                  style={{ border: '2px dashed ' + (dragOver ? 'var(--accent)' : 'var(--slate-200)'), borderRadius: 10, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'var(--card-bg-tinted)' : 'var(--page-bg-subtle)' }}
                >
                  <Camera size={32} aria-hidden="true" style={{ color: 'var(--terra-400)', marginBottom: 10 }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', margin: '0 0 4px', fontFamily: 'Manrope, sans-serif' }}>
                    Drop photos here or click to upload
                  </p>
                  <p id="upload-hint" style={{ fontSize: 12, color: 'var(--body-secondary)', margin: 0, fontFamily: 'Manrope, sans-serif' }}>
                    Up to 5 images — entrances, parking, restrooms, signage, pathways
                  </p>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple aria-label="Choose photos to upload" onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
                </div>

                {/* Previews */}
                {previews.length > 0 && (
                  <div role="list" aria-label="Selected photos" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                    {previews.map((url, i) => (
                      <div key={i} role="listitem" style={{ position: 'relative' }}>
                        <img src={url} alt={'Selected photo ' + (i + 1) + ': ' + (files[i]?.name || '')} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--card-border)', display: 'block' }} />
                        <button onClick={() => removeFile(i)} aria-label={'Remove photo ' + (i + 1)} style={{ position: 'absolute', top: -10, right: -10, width: 32, height: 32, minWidth: 32, minHeight: 32, borderRadius: '50%', background: '#DC2626', border: '2px solid var(--surface)', color: '#FFFFFF', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <X size={12} aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div ref={errorRef} role="alert" tabIndex={-1} style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: 'var(--err-bg)', border: '1px solid var(--err-bd)', display: 'flex', gap: 8, alignItems: 'flex-start', outline: 'none' }}>
                    <AlertTriangle size={16} aria-hidden="true" style={{ color: 'var(--err-fg)', flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 13, color: 'var(--err-fg)', margin: 0, fontFamily: 'Manrope, sans-serif' }}>{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={runAnalysis}
                  disabled={loading || !files.length}
                  aria-busy={loading}
                  aria-disabled={!files.length}
                  style={{ marginTop: 18, width: '100%', minHeight: 48, borderRadius: 8, fontWeight: 700, fontSize: '0.9375rem', fontFamily: 'Manrope, sans-serif', cursor: loading || !files.length ? 'not-allowed' : 'pointer', background: loading || !files.length ? 'var(--slate-300)' : 'var(--accent)', color: loading || !files.length ? 'var(--slate-700)' : '#FFFFFF', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading
                    ? <><div className="a11y-spinner" aria-hidden="true" style={{ width: '1rem', height: '1rem', borderWidth: 2 }} /> Analyzing…</>
                    : <><Upload size={17} aria-hidden="true" /> Analyze Photos</>}
                </button>
              </div>
            )}

            {/* Viewing a saved record */}
            {selectedRecord && (
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: 'var(--heading)', fontFamily: 'Fraunces, serif' }}>
                  {selectedRecord.location_label || 'Unlabeled Analysis'}
                </h2>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={12} aria-hidden="true" />
                  <time dateTime={selectedRecord.created_date}>{formatDate(selectedRecord.created_date)}</time>
                  {' · '}{selectedRecord.photo_count} photo{selectedRecord.photo_count !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Results */}
            {result && (
              <div ref={resultsRef} tabIndex={-1} aria-label="Analysis results" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10, padding: 20, outline: 'none' }}>
                <AnalysisResults result={result} photoUrls={result?.uploadedUrls} onReport={() => window.location.href = '/Intake'} />
              </div>
            )}

            {/* Empty state */}
            {!result && !loading && !selectedRecord && (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 10 }}>
                <Camera size={48} aria-hidden="true" style={{ color: 'var(--slate-400)', marginBottom: 16 }} />
                <p style={{ fontSize: 14, color: 'var(--body-secondary)', maxWidth: 380, margin: '0 auto', fontFamily: 'Manrope, sans-serif', lineHeight: 1.6 }}>
                  Upload photos of a physical location to receive an AI-powered ADA compliance assessment, or select a past analysis from the history panel.
                </p>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}
