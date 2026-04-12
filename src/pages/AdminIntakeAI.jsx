import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Send, CheckCircle, ChevronRight, Camera } from 'lucide-react';
import AdminPageHeader from '../components/admin/shared/AdminPageHeader';
import { useReadingLevel } from '../components/a11y/ReadingLevelContext';
import { useAnnounce } from '../components/a11y/LiveAnnouncer';
import SuccessStep from '../components/intake/SuccessStep';

// ─── System prompt — adapts to reading level ──────────────────────────────────
function buildSystemPrompt(readingLevel) {
  const TONE = {
    simple: `COMMUNICATION STYLE — SIMPLE (5th grade):
- Use very short sentences. One idea per sentence.
- Never use legal terms. Say "business" not "establishment". Say "couldn't get in" not "denied access".
- Be warm and reassuring. "That sounds really frustrating." "You did the right thing by reporting this."
- Ask only ONE thing at a time. Keep your messages to 2-3 sentences max.
- Avoid any jargon. If you must use a term, explain it immediately in plain words.`,
    standard: `COMMUNICATION STYLE — STANDARD (8th grade):
- Plain, direct language. Conversational but professional.
- Briefly validate their experience before moving on.
- Ask one or two things at a time. Keep responses to 2-4 sentences.
- You can use common terms like "ADA violation" or "accessible entrance" without over-explaining.`,
    professional: `COMMUNICATION STYLE — PROFESSIONAL (legal/technical):
- Precise, efficient language. Assume legal literacy.
- Use correct ADA terminology: "Title III", "barrier to access", "place of public accommodation", "2010 ADA Standards".
- You may reference specific ADA sections if relevant (e.g., §4.3, §502).
- Still ask questions one topic at a time, but you can be more direct and dense.
- Minimal emotional validation — focus on facts and legal elements.`,
  };

  return `You are Ada, an ADA intake specialist for ADA Legal Link. Your job is to help someone report an ADA violation by having a warm, conversational exchange — NOT a form. Your name is Ada — use it naturally when introducing yourself but don't repeat it unnecessarily.

${TONE[readingLevel] || TONE.standard}

Your goals in order:
1. Understand what happened (Title II vs Title III vs Title I)
2. If Title III (private business): gather the structured data needed for a case
3. If Title II (government): explain the DOJ complaint process and provide the link
4. If Title I (employment): explain the EEOC process and provide the link
5. Produce a structured JSON extraction when you have enough info

TITLE ROUTING RULES:
- Title III (private business: restaurants, stores, hotels, medical, websites/apps) → proceed with intake
- Title II (government: city buildings, public schools, transit, courthouses, DMVs) → say "This sounds like a government accessibility issue, which falls under Title II of the ADA. We can't connect you with an attorney for this type of claim, but you can file directly with the DOJ at ADAcompliance@usdoj.gov or ada.gov/filing-a-complaint. Would you like me to explain how that process works?"
- Title I (employment/workplace) → say "Workplace disability discrimination falls under Title I of the ADA, which is handled through the EEOC. We can't connect you with an attorney through our platform for employment claims, but you can file at eeoc.gov/filing-charge-discrimination. Would you like help understanding that process?"

FOR TITLE III INTAKES, collect in natural conversation (don't ask all at once):
- Business name and type
- City, state, street address
- What happened (narrative)
- Approximate incident date
- Whether they've been there before
- Their name, email, phone, preferred contact method
- Photo (ask once: "Do you have a photo of the barrier? It strengthens your case significantly.")

WHEN YOU HAVE ENOUGH INFO FOR TITLE III, end your message with a JSON block like this (ONLY when ready to submit):
<EXTRACT>
{
  "ready": true,
  "violation_type": "physical_space",
  "business_name": "",
  "business_type": "",
  "city": "",
  "state": "",
  "street_address": "",
  "violation_subtype": "",
  "incident_date": "",
  "visited_before": "",
  "narrative": "",
  "contact_name": "",
  "contact_email": "",
  "contact_phone": "",
  "contact_preference": "",
  "title": "III",
  "case_strength": "STRONG|MODERATE|UNCLEAR",
  "case_strength_reason": ""
}
</EXTRACT>

violation_subtype options: "Path of Travel", "Parking", "Entrance/Exit", "Restroom", "Service Animal Denial", "Website/App", "Other"
business_type options: "Restaurant", "Retail Store", "Hotel/Lodging", "Medical Office", "Government Building", "Education", "Transportation", "Entertainment Venue", "Website/App", "Other"
visited_before options: "yes", "no", "first_time"
contact_preference options: "phone", "email", "no_preference"

IMPORTANT: Do not include the <EXTRACT> block until you have: business_name, city, state, narrative (50+ words), contact_name, contact_email, contact_phone.`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseExtract(text) {
  const match = text.match(/<EXTRACT>([\s\S]*?)<\/EXTRACT>/);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); } catch { return null; }
}

function stripExtract(text) {
  return text.replace(/<EXTRACT>[\s\S]*?<\/EXTRACT>/g, '').trim();
}

function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return iso; }
}

const STRENGTH_CONFIG = {
  STRONG:   { color: 'var(--suc-fg)', bg: 'var(--suc-bg)', border: 'var(--suc-bd)', icon: '✓', label: 'Strong Case' },
  MODERATE: { color: 'var(--wrn-fg)', bg: 'var(--wrn-bg)', border: 'var(--wrn-bd)', icon: '~', label: 'Moderate Case' },
  UNCLEAR:  { color: 'var(--body-secondary)', bg: 'var(--card-bg-tinted)', border: 'var(--card-border)', icon: '?', label: 'Needs Review' },
};

// ─── Message bubble — WCAG AAA ────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const text = msg.role === 'assistant' ? stripExtract(msg.content) : msg.content;
  if (!text && !msg.photoPreview) return null;
  const senderLabel = isUser ? 'You' : 'Ada';

  return (
    <div
      role="listitem"
      aria-label={`${senderLabel}: ${text ? text.slice(0, 80) + (text.length > 80 ? '…' : '') : 'uploaded a photo'}`}
      style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}
    >
      {!isUser && (
        <div aria-hidden="true" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0, marginRight: 8, marginTop: 2, fontFamily: 'Fraunces, serif' }}>A</div>
      )}
      <div style={{ maxWidth: '78%' }}>
        <div aria-hidden="true" style={{ fontSize: 11, fontWeight: 700, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', marginBottom: 3, textAlign: isUser ? 'right' : 'left' }}>
          {senderLabel}
        </div>
        {msg.photoPreview && (
          <div style={{ marginBottom: 6, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
            <img src={msg.photoPreview} alt="Photo of the accessibility barrier you uploaded" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        {text && (
          <div style={{
            padding: '10px 14px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isUser ? 'var(--accent)' : 'var(--card-bg)',
            border: isUser ? 'none' : '1px solid var(--card-border)',
            color: isUser ? '#fff' : 'var(--body)',
            fontFamily: 'Manrope, sans-serif', fontSize: 14, lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {text}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', marginTop: 3, textAlign: isUser ? 'right' : 'left', paddingLeft: isUser ? 0 : 4 }}>
          <time dateTime={msg.isoTime}>{msg.time}</time>
        </div>
      </div>
      {isUser && (
        <div aria-hidden="true" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--card-bg-tinted)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginLeft: 8, marginTop: 2 }}>👤</div>
      )}
    </div>
  );
}

// ─── Case summary card — WCAG AAA ─────────────────────────────────────────────
function CaseSummaryCard({ data, photoAnalysis, onEdit, onSubmit, submitting, submitted, caseId, currentUser }) {
  const strength = STRENGTH_CONFIG[data.case_strength] || STRENGTH_CONFIG.UNCLEAR;
  const headingId = React.useId();

  // Full success screen — same experience as form intake
  if (submitted) {
    const caseData = {
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      violation_type: data.violation_type,
      business_name: data.business_name,
      incident_date: data.incident_date,
    };
    return (
      <div style={{ padding: '24px', borderRadius: 12, background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <SuccessStep
          caseData={caseData}
          caseId={caseId}
          isLoggedIn={!!currentUser}
        />
      </div>
    );
  }

  return (
    <section aria-labelledby={headingId} style={{ borderRadius: 12, border: '1px solid var(--card-border)', background: 'var(--card-bg)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', background: 'var(--card-bg-tinted)', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 id={headingId} style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif' }}>Extracted Case Details</h2>
        <div role="status" aria-label={`Case strength: ${strength.label}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: strength.bg, border: '1px solid ' + strength.border, fontSize: 11, fontWeight: 700, color: strength.color, fontFamily: 'Manrope, sans-serif' }}>
          <span aria-hidden="true">{strength.icon}</span> {strength.label}
        </div>
      </div>

      <dl style={{ padding: '14px 18px', margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Business', value: data.business_name },
          { label: 'Type', value: data.business_type },
          { label: 'Location', value: [data.street_address, data.city, data.state].filter(Boolean).join(', ') },
          { label: 'Barrier', value: data.violation_subtype },
          { label: 'Date', value: formatDate(data.incident_date) },
          { label: 'Visited before', value: data.visited_before === 'yes' ? 'Yes' : data.visited_before === 'no' ? 'No' : data.visited_before === 'first_time' ? 'First time' : null },
        ].filter(f => f.value).map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', gap: 8 }}>
            <dt style={{ fontSize: 13, fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)', fontWeight: 600, minWidth: 90, flexShrink: 0 }}>{label}</dt>
            <dd style={{ fontSize: 13, fontFamily: 'Manrope, sans-serif', color: 'var(--heading)', margin: 0 }}>{value}</dd>
          </div>
        ))}

        {data.narrative && (
          <div>
            <dt style={{ fontSize: 13, fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)', fontWeight: 600, marginBottom: 4 }}>Description</dt>
            <dd style={{ fontSize: 13, fontFamily: 'Manrope, sans-serif', color: 'var(--heading)', lineHeight: 1.6, margin: 0, padding: '8px 10px', background: 'var(--page-bg-subtle)', borderRadius: 6, border: '1px solid var(--card-border)' }}>{data.narrative}</dd>
          </div>
        )}

        {/* Evidence photo thumbnail */}
        {data.photo_url && (
          <div>
            <dt style={{ fontSize: 13, fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)', fontWeight: 600, marginBottom: 6 }}>Evidence Photo</dt>
            <dd style={{ margin: 0 }}>
              <a href={data.photo_url} target="_blank" rel="noopener noreferrer" aria-label="View full size evidence photo">
                <img
                  src={data.photo_url}
                  alt="Evidence photo of the accessibility barrier"
                  style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--card-border)', display: 'block' }}
                />
              </a>
            </dd>
          </div>
        )}

        {data.case_strength_reason && (
          <div role="note" aria-label="Case assessment" style={{ padding: '8px 10px', borderRadius: 6, background: strength.bg, border: '1px solid ' + strength.border, fontSize: 12, color: strength.color, fontFamily: 'Manrope, sans-serif', lineHeight: 1.5 }}>
            <strong>Case assessment: </strong>{data.case_strength_reason}
          </div>
        )}

        {/* Photo analysis summary — shown if a photo was analyzed */}
        {photoAnalysis && (() => {
          const RISK_COLORS = {
            HIGH:   { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
            MEDIUM: { bg: '#FFFBEB', border: '#FDE68A', text: '#92400E' },
            LOW:    { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' },
            NONE:   { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B' },
          };
          const concerns = (photoAnalysis.photos || []).flatMap(p => p.concerns || []);
          const highC = concerns.filter(c => c.severity === 'HIGH').length;
          const rc = RISK_COLORS[photoAnalysis.overallRisk] || RISK_COLORS.NONE;
          return (
            <div role="note" aria-label="Photo analysis summary" style={{ padding: '8px 10px', borderRadius: 6, background: rc.bg, border: '1px solid ' + rc.border, fontSize: 12, color: rc.text, fontFamily: 'Manrope, sans-serif', lineHeight: 1.5 }}>
              <strong>📸 Photo analysis: </strong>
              {photoAnalysis.overallRisk} risk · {concerns.length} concern{concerns.length !== 1 ? 's' : ''}
              {highC > 0 && ` (${highC} high severity)`}
            </div>
          );
        })()}

        <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 10, marginTop: 2 }}>
          <dt style={{ fontSize: 12, fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Contact</dt>
          {[
            { label: 'Name', value: data.contact_name },
            { label: 'Email', value: data.contact_email },
            { label: 'Phone', value: data.contact_phone },
            { label: 'Prefers', value: data.contact_preference },
          ].filter(f => f.value).map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
              <dt style={{ fontSize: 13, fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)', fontWeight: 600, minWidth: 50, flexShrink: 0 }}>{label}</dt>
              <dd style={{ fontSize: 13, fontFamily: 'Manrope, sans-serif', color: 'var(--heading)', margin: 0 }}>{value}</dd>
            </div>
          ))}
        </div>
      </dl>

      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button onClick={onEdit} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--body)', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>
          Edit in Form
        </button>
        <button onClick={onSubmit} disabled={submitting} aria-disabled={submitting} aria-busy={submitting} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: submitting ? 'var(--card-border)' : 'var(--accent)', color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', gap: 6 }}>
          {submitting ? 'Submitting…' : <><CheckCircle size={15} aria-hidden="true" /> Submit Case</>}
        </button>
      </div>
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminIntakeAI() {
  const { readingLevel } = useReadingLevel();
  const announce = useAnnounce();

  const OPENING = {
    simple: "Hi, I'm Ada — I'm here to help you report an ADA problem. Tell me what happened. Where were you, and what made it hard for you?",
    standard: "Hi, I'm Ada — I'm here to help you document an ADA accessibility violation. Tell me what happened. Where were you, and what made it hard for you to access the place or service?",
    professional: "Hello, I'm Ada. I'll help you document an ADA violation for potential case review. Please describe the incident — the location, the nature of the barrier, and when it occurred.",
  };

  function makeTime() {
    return {
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isoTime: new Date().toISOString(),
    };
  }

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: OPENING[readingLevel] || OPENING.standard,
    ...makeTime(),
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [caseId, setCaseId] = useState(null);

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const sendHintId = React.useId();

  // Auth check
  useEffect(() => {
    async function check() {
      try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') { window.location.href = createPageUrl('Home'); return; }
        setCurrentUser(user);
      } catch { window.location.href = createPageUrl('Home'); return; }
      setPageLoading(false);
      // Focus input immediately so cursor is ready
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    check();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, extractedData]);

  // Revoke object URL on cleanup to prevent memory leak
  useEffect(() => {
    return () => { if (photoPreview) URL.revokeObjectURL(photoPreview); };
  }, [photoPreview]);

  async function handlePhotoUpload(file) {
    if (!file) return;
    setPhotoFile(file);
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    announce('Photo uploaded. Analyzing image for ADA violations.', 'polite');
    setStatusMsg('Analyzing your photo…');

    setMessages(prev => [...prev, { role: 'user', content: '', photoPreview: preview, ...makeTime() }]);
    setAnalyzingPhoto(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);

      const ADA_PHOTO_PROMPT = `You are a senior ADA accessibility compliance analyst with deep expertise in the 2010 ADA Standards for Accessible Design and the ADA Accessibility Guidelines (ADAAG). Your role is to examine this photo of a physical location and identify ALL potential ADA compliance concerns — be thorough and specific.

Respond ONLY with valid JSON in exactly this shape — no markdown, no preamble:
{
  "summary": "2-3 sentence overall assessment",
  "overallRisk": "HIGH" | "MEDIUM" | "LOW" | "NONE",
  "violation_subtype": "Path of Travel|Parking|Entrance/Exit|Restroom|Service Animal Denial|Website/App|Other",
  "photos": [
    {
      "photoIndex": 0,
      "description": "What you see in this photo — be specific about the space type and features visible",
      "concerns": [
        {
          "title": "Short concern title",
          "detail": "Specific detail with measurement estimates where visible and ADA standard section (e.g. §404.2.3)",
          "severity": "HIGH" | "MEDIUM" | "LOW",
          "confidence": "HIGH" | "MEDIUM" | "LOW",
          "remediation": "Concrete recommended fix with target spec (e.g. 'Widen doorway to minimum 32 inches clear')",
          "bbox": { "x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0 }
        }
      ],
      "positiveFindings": ["Specific compliant feature observed — cite the standard"]
    }
  ]
}

COMPREHENSIVE STANDARDS TO CHECK:

ACCESSIBLE ROUTES & PATHWAYS (Chapter 4):
- Pathway min width 36" continuous, 60" passing space every 200ft (§403.5)
- Running slope max 1:20 (5%), cross slope max 1:48 (§403.3)
- Surface must be firm, stable, slip-resistant — note cracks, gaps, lips, gravel (§402.2)
- Protruding objects max 4" protrusion above 27" (§307)
- Changes in level: max 1/4" vertical, over 1/2" requires ramp (§303)

RAMPS (§405):
- Max slope 1:12 (8.33%), max cross slope 1:48
- Min width 36" between handrails, landings min 60"×60"
- Handrails required both sides if rise >6" (§505): 34"–38" height

DOORS & DOORWAYS (§404):
- Min 32" clear width when door open 90° (§404.2.3)
- Max threshold 1/2" (§404.2.5)
- Hardware: lever/loop/push — no tight grasping/twisting (§404.2.7)

PARKING (§502):
- Standard accessible space: min 96" wide + 60" access aisle
- Van-accessible: min 132" wide OR 96" + 96" aisle
- Max slope 1:48, ISA required, signage min 60" AFF

RESTROOMS (§603–§609):
- Clear floor space 60"×60" turning radius
- Grab bars: rear wall 36" min, side wall 42" min, 33"–36" AFF
- Toilet centerline: 16"–18" from side wall, seat height 17"–19" AFF

COUNTERS & SERVICE AREAS (§904):
- Transaction counter max 36" AFF, min 36" wide section

STAIRS (§504):
- Handrails both sides: 34"–38" AFF, 12" horizontal extensions
- Riser height 4"–7", tread depth min 11"

SIGNAGE (§703):
- Tactile/Braille required at permanent rooms, 60" AFF centerline
- Visual characters: min 5/8" uppercase height, non-glare finish

REACH RANGES & OPERABLE PARTS (§308–§309):
- Forward reach: 15"–48" AFF; max 5 lbf activation force

GROUND & FLOOR SURFACES:
- Carpet: max 1/2" pile, firmly secured
- Grates: max 1/2" opening perpendicular to travel direction

Check ALL applicable categories. If you cannot fully assess a standard from the photo, note it as a potential concern with "cannot confirm from photo — recommend on-site measurement." This analysis is informational only, not a professional inspection.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: ADA_PHOTO_PROMPT,
        model: 'claude_sonnet_4_6',
        file_urls: [file_url],
        add_context_from_internet: false,
      });

      const rawText = typeof response === 'string' ? response : (response?.result || response?.text || JSON.stringify(response));
      const analysis = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      setPhotoAnalysis(analysis);

      // Build a plain-language summary for the conversation
      const allConcerns = (analysis.photos || []).flatMap(p => p.concerns || []);
      const highCount = allConcerns.filter(c => c.severity === 'HIGH').length;
      const totalCount = allConcerns.length;
      const violationList = totalCount > 0
        ? `I can see ${totalCount} potential issue${totalCount !== 1 ? 's' : ''} in your photo${highCount > 0 ? `, including ${highCount} serious concern${highCount !== 1 ? 's' : ''}` : ''}:\n• ${allConcerns.slice(0, 3).map(c => c.title).join('\n• ')}${totalCount > 3 ? `\n• …and ${totalCount - 3} more` : ''}\n\nThis looks like a ${(analysis.overallRisk || 'LOW').toLowerCase()} risk situation.`
        : "I analyzed your photo but couldn't identify specific violations from the image. Your description will be the main evidence.";

      const aiMsg = violationList + "\n\nCan you tell me the name of this business and where it's located?";
      setMessages(prev => [...prev, { role: 'assistant', content: aiMsg, ...makeTime() }]);
      announce('Photo analysis complete. ' + violationList.replace(/\n/g, ' '), 'assertive');
    } catch (e) {
      console.error('Photo analysis failed:', e);
      const fallback = "I received your photo — thanks. I had trouble analyzing it automatically, but it will still be attached to your case. Can you tell me the name of this business and where it's located?";
      setMessages(prev => [...prev, { role: 'assistant', content: fallback, ...makeTime() }]);
      announce('Photo received. Could not auto-analyze.', 'polite');
    }

    setStatusMsg('');
    setAnalyzingPhoto(false);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setStatusMsg('AI is thinking…');

    const userMsg = { role: 'user', content: text, ...makeTime() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    announce('Message sent.', 'polite');

    const history = newMessages.filter(m => m.content).map(m => ({ role: m.role, content: m.content }));

    const systemWithContext = photoAnalysis
      ? buildSystemPrompt(readingLevel) + `\n\nPHOTO ANALYSIS ALREADY DONE: The user uploaded a photo. Overall risk: ${photoAnalysis.overallRisk}. Summary: ${photoAnalysis.summary}. Top concerns: ${(photoAnalysis.photos || []).flatMap(p => p.concerns || []).slice(0, 5).map(c => c.title + ' (' + c.severity + ')').join(', ')}. Use this to inform your questions.`
      : buildSystemPrompt(readingLevel);

    try {
      // Build conversation context as a single prompt for Base44 InvokeLLM
      const conversationHistory = history
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      const fullPrompt = `${systemWithContext}\n\n---CONVERSATION SO FAR---\n${conversationHistory}\n\n---\nNow respond as Ada. Continue the conversation naturally.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        model: 'claude_sonnet_4_6',
        add_context_from_internet: false,
      });

      const aiText = typeof response === 'string' ? response : (response?.result || response?.text || JSON.stringify(response));
      if (!aiText) throw new Error('Empty response from AI');

      const extracted = parseExtract(aiText);
      const displayText = stripExtract(aiText);

      setMessages(prev => [...prev, { role: 'assistant', content: displayText, ...makeTime() }]);
      announce('Ada: ' + displayText.slice(0, 120), 'polite');

      if (extracted?.ready) {
        if (photoUrl) extracted.photo_url = photoUrl;
        if (photoAnalysis) extracted.photo_analysis = photoAnalysis;
        setExtractedData(extracted);
        announce('Case details extracted. Please review and submit when ready.', 'assertive');
      }
    } catch (e) {
      console.error('AI call failed:', e);
      const errMsg = "Something went wrong connecting to the AI. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg, ...makeTime() }]);
      announce(errMsg, 'assertive');
    }

    setStatusMsg('');
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleSubmit() {
    if (!extractedData) return;
    setSubmitting(true);
    announce('Submitting case. Please wait.', 'polite');
    const now = new Date().toISOString();
    try {
      // photo_analysis: read from photoAnalysis state directly to avoid race condition where
      // extractedData was set before the upload finished. Falls back to the copy on extractedData.
      const resolvedPhotoAnalysis = photoAnalysis || extractedData.photo_analysis || null;

      // violation_subtype: prefer what the conversation AI extracted; fall back to what
      // the photo analysis detected (the photo prompt returns this at the top level).
      const resolvedViolationSubtype = extractedData.violation_subtype
        || resolvedPhotoAnalysis?.violation_subtype
        || '';

      const casePayload = {
        violation_type: extractedData.violation_type || 'physical_space',
        business_name: extractedData.business_name || 'Unknown',
        business_type: extractedData.business_type || 'Other',
        city: extractedData.city || '',
        state: extractedData.state || '',
        street_address: extractedData.street_address || '',
        violation_subtype: resolvedViolationSubtype,
        incident_date: extractedData.incident_date || '',
        visited_before: extractedData.visited_before || '',
        narrative: extractedData.narrative || '',
        contact_name: extractedData.contact_name || '',
        contact_email: extractedData.contact_email || '',
        contact_phone: extractedData.contact_phone || '',
        contact_preference: extractedData.contact_preference || 'no_preference',
        photos: extractedData.photo_url ? [extractedData.photo_url] : [],
        photo_analysis: resolvedPhotoAnalysis ? JSON.stringify(resolvedPhotoAnalysis) : null,
        case_strength: extractedData.case_strength || null,
        intake_source: 'ai_intake',
        status: 'submitted',
        submitted_at: now,
      };
      // Link to account if user is logged in
      if (currentUser?.id) casePayload.submitter_user_id = currentUser.id;

      const newCase = await base44.entities.Case.create(casePayload);
      setCaseId(newCase.id);
      const allConcerns = resolvedPhotoAnalysis
        ? (resolvedPhotoAnalysis.photos || []).flatMap(p => p.concerns || [])
        : [];
      const highCount = allConcerns.filter(c => c.severity === 'HIGH').length;
      const medCount  = allConcerns.filter(c => c.severity === 'MEDIUM').length;
      const photoSummary = resolvedPhotoAnalysis
        ? ` Photo analysis: ${resolvedPhotoAnalysis.overallRisk} risk, ${allConcerns.length} concern${allConcerns.length !== 1 ? 's' : ''} (${highCount} high, ${medCount} medium).`
        : '';

      await base44.entities.TimelineEvent.create({
        case_id: newCase.id,
        event_type: 'submitted',
        event_description: `Case submitted via AI-powered intake. AI case strength: ${extractedData.case_strength || 'N/A'}.${photoSummary}`,
        actor_role: 'system',
        visible_to_user: true,
        created_at: now,
      });
      setSubmitted(true);
      announce('Case submitted successfully. It is now in the review queue.', 'assertive');
    } catch (e) {
      console.error('Submit failed:', e);
      announce('Submission failed. Please try again.', 'assertive');
    }
    setSubmitting(false);
  }

  function handleEditInForm() {
    const params = new URLSearchParams({
      source: 'ai_intake',
      type: extractedData.violation_type === 'physical_space' ? 'physical_access' : 'digital_access',
    });
    window.location.href = createPageUrl('Intake') + '?' + params.toString();
  }

  const readingLevelLabel = readingLevel === 'simple' ? 'Simple' : readingLevel === 'professional' ? 'Professional' : 'Standard';
  const isTyping = loading || analyzingPhoto;

  if (pageLoading) return (
    <div role="status" aria-label="Loading AI Intake" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}>
      <div className="a11y-spinner" aria-hidden="true" />
      <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)' }}>Loading…</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: 'var(--page-bg)', padding: 'clamp(0.75rem, 3vw, 1.5rem)', minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>

      {/* Live status region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{statusMsg}</div>

      <div style={{ maxWidth: 1100, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

        <AdminPageHeader
          title="AI Intake"
          actionButton={
            <a href={createPageUrl('Intake')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 16px', minHeight: 44, borderRadius: 8, background: 'transparent', color: 'var(--body-secondary)', border: '1px solid var(--card-border)', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'Manrope, sans-serif', textDecoration: 'none' }}>
              Switch to Form Intake <ChevronRight size={14} aria-hidden="true" />
            </a>
          }
        />

        {/* Info banner — reading level shown here for admin demo context only */}
        <div role="note" style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--inf-bg)', border: '1px solid var(--inf-bd)', fontFamily: 'Manrope, sans-serif', fontSize: 13, color: 'var(--inf-fg)', lineHeight: 1.6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span><strong>AI-Powered Intake — Admin Demo.</strong> Conversational intake using Claude. Title I and Title II violations are automatically routed to the correct external channels. Title III (private business) violations proceed to case submission.</span>
          <span title="Change reading level via the eye icon in the navigation" style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, border: '1px solid var(--inf-bd)', background: 'var(--card-bg)', color: 'var(--inf-fg)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Reading: {readingLevelLabel}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'stretch', flex: 1 }} className="intake-ai-grid">

          {/* ── Chat panel ── */}
          <section aria-label="Intake conversation" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

            {/* Header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, fontFamily: 'Fraunces, serif', flexShrink: 0 }}>A</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif' }}>Ada</div>
                <div aria-hidden="true" style={{ fontSize: 11, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif' }}>
                  {isTyping ? 'Thinking…' : 'Here to help'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                {photoPreview && (
                  <div aria-label="Photo attached" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--suc-fg)', fontFamily: 'Manrope, sans-serif' }}>
                    <Camera size={14} aria-hidden="true" /> Photo attached
                  </div>
                )}
              </div>
            </div>

            {/* Message log */}
            <div
              role="log"
              aria-label="Conversation history"
              aria-live="polite"
              aria-relevant="additions"
              tabIndex={0}
              style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}
            >
              <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
                {messages.map((msg, i) => <MessageBubble key={msg.isoTime + '-' + i} msg={msg} />)}
              </ol>

              {/* Typing indicator */}
              {isTyping && (
                <div role="status" aria-label={analyzingPhoto ? 'Analyzing your photo' : 'AI is composing a response'} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div aria-hidden="true" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, fontFamily: 'Fraunces, serif' }}>A</div>
                  <div aria-hidden="true" style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--body-secondary)', animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                  <span className="sr-only">{analyzingPhoto ? 'Analyzing your photo, please wait.' : 'AI is thinking, please wait.'}</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            {!submitted && (
              <div style={{ padding: '12px 16px 16px', flexShrink: 0, marginTop: 'auto' }}>
                <p id={sendHintId} className="sr-only">Press Enter to send your message. Press Shift+Enter for a new line.</p>

                {/* Add photo — above textarea, subtle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                    Your reply
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!!photoFile || analyzingPhoto}
                    aria-label={photoFile ? 'Photo already attached to this case' : 'Attach a photo of the barrier'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '0 10px', height: 32, borderRadius: 6,
                      border: '1px solid var(--card-border)',
                      background: photoFile ? 'var(--suc-bg)' : 'transparent',
                      color: photoFile ? 'var(--suc-fg)' : 'var(--body-secondary)',
                      cursor: photoFile ? 'default' : 'pointer',
                      fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600,
                      minHeight: 44, minWidth: 44
                    }}
                  >
                    {photoFile
                      ? <><CheckCircle size={13} aria-hidden="true" /> Photo attached</>
                      : <><Camera size={13} aria-hidden="true" /> Add photo</>
                    }
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    aria-label="Choose a photo file to attach"
                    style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
                    onChange={e => { if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]); }}
                  />
                </div>

                {/* Full-width textarea */}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type your answer here…"
                  rows={3}
                  aria-label="Your reply to the intake assistant"
                  aria-describedby={sendHintId}
                  aria-required="true"
                  style={{ width: '100%', boxSizing: 'border-box', resize: 'none', border: 'none', borderRadius: 10, padding: '10px 14px', fontFamily: 'Manrope, sans-serif', fontSize: 15, background: 'var(--page-bg-subtle)', color: 'var(--body)', outline: 'none', lineHeight: 1.6, minHeight: 80, maxHeight: 160, display: 'block' }}
                />

                {/* Full-width send button */}
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  aria-label={loading ? 'Sending your reply, please wait' : 'Send your reply'}
                  aria-disabled={!input.trim() || loading}
                  aria-busy={loading}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    width: '100%', marginTop: 8,
                    height: 48, borderRadius: 10, border: 'none',
                    background: !input.trim() || loading ? 'var(--card-border)' : 'var(--accent)',
                    color: '#fff',
                    cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Manrope, sans-serif', fontSize: 15, fontWeight: 700,
                    transition: 'background 0.15s'
                  }}
                >
                  {loading
                    ? <><div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />)}
                      </div> Sending…</>
                    : <><Send size={16} aria-hidden="true" /> Send reply</>
                  }
                </button>
              </div>
            )}
          </section>

          {/* ── Right panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflowY: 'auto' }}>
            {extractedData ? (
              <CaseSummaryCard
                data={extractedData}
                photoAnalysis={photoAnalysis}
                onEdit={handleEditInForm}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitted={submitted}
                caseId={caseId}
                currentUser={currentUser}
              />
            ) : (
              <div role="status" style={{ padding: '20px', borderRadius: 12, background: 'var(--card-bg)', border: '1px solid var(--card-border)', textAlign: 'center' }}>
                <div aria-hidden="true" style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif', marginBottom: 6 }}>Case details will appear here</div>
                <div style={{ fontSize: 12, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', lineHeight: 1.6 }}>As the conversation progresses, the AI will extract structured case data and display it for review before submission.</div>
              </div>
            )}

            {/* How it works */}
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <h2 style={{ fontSize: 11, fontWeight: 700, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>How it works</h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {[
                  { icon: '💬', text: 'Describe what happened in plain language' },
                  { icon: '📸', text: 'Upload a photo to strengthen your case' },
                  { icon: '🔍', text: 'AI extracts structured case details automatically' },
                  { icon: '⚖️', text: 'Title I & II violations route to the right channel' },
                  { icon: '✓', text: 'Review extracted details before submitting' },
                ].map(({ icon, text }) => (
                  <li key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, fontSize: 12, color: 'var(--body)', fontFamily: 'Manrope, sans-serif', lineHeight: 1.5 }}>
                    <span aria-hidden="true" style={{ flexShrink: 0 }}>{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .sr-only {
          position: absolute !important; width: 1px !important; height: 1px !important;
          padding: 0 !important; margin: -1px !important; overflow: hidden !important;
          clip: rect(0,0,0,0) !important; white-space: nowrap !important; border: 0 !important;
        }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; transition: none !important; }
        }
        @media (prefers-contrast: more) {
          button, textarea, input { border-width: 2px !important; }
        }
        *:focus-visible { outline: 3px solid var(--accent-light) !important; outline-offset: 2px !important; }
        *:focus:not(:focus-visible) { outline: none !important; }
        @media (max-width: 768px) {
          .intake-ai-grid { grid-template-columns: 1fr !important; height: auto !important; }
        }
      `}</style>
    </div>
  );
}
