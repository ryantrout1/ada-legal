import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Send, Upload, X, CheckCircle, AlertTriangle, ChevronRight, Camera } from 'lucide-react';
import AdminPageHeader from '../components/admin/shared/AdminPageHeader';
import { useReadingLevel } from '../components/a11y/ReadingLevelContext';

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

  return `You are an ADA intake specialist for ADA Legal Link. Your job is to help someone report an ADA violation by having a warm, conversational exchange — NOT a form.

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

WHEN YOU HAVE ENOUGH INFO FOR TITLE III, end your message with a JSON block like this (and ONLY when ready to submit):
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

IMPORTANT: Do not include the <EXTRACT> block until you have: business_name, city, state, narrative (50+ words), contact_name, contact_email, contact_phone. The narrative minimum is important — keep asking questions until you have a full picture.`;
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
  STRONG:   { color: 'var(--suc-fg)',  bg: 'var(--suc-bg)',  border: 'var(--suc-bd)',  icon: '✓', label: 'Strong Case' },
  MODERATE: { color: 'var(--wrn-fg)',  bg: 'var(--wrn-bg)',  border: 'var(--wrn-bd)',  icon: '~', label: 'Moderate Case' },
  UNCLEAR:  { color: 'var(--body-secondary)', bg: 'var(--card-bg-tinted)', border: 'var(--card-border)', icon: '?', label: 'Needs Review' },
};

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  const text = msg.role === 'assistant' ? stripExtract(msg.content) : msg.content;
  if (!text && !msg.photoPreview) return null;
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
      {!isUser && (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, flexShrink: 0, marginRight: 8, marginTop: 2, fontFamily: 'Fraunces, serif' }}>A</div>
      )}
      <div style={{ maxWidth: '78%' }}>
        {msg.photoPreview && (
          <div style={{ marginBottom: 6, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--card-border)' }}>
            <img src={msg.photoPreview} alt="Uploaded barrier photo" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', display: 'block' }} />
          </div>
        )}
        {text && (
          <div style={{
            padding: '10px 14px', borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
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
          {msg.time}
        </div>
      </div>
      {isUser && (
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--card-bg-tinted)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, marginLeft: 8, marginTop: 2 }}>👤</div>
      )}
    </div>
  );
}

// ─── Extracted case summary card ──────────────────────────────────────────────
function CaseSummaryCard({ data, onEdit, onSubmit, submitting, submitted }) {
  const strength = STRENGTH_CONFIG[data.case_strength] || STRENGTH_CONFIG.UNCLEAR;
  const isPhysical = data.violation_type === 'physical_space';

  if (submitted) {
    return (
      <div style={{ padding: '24px', borderRadius: 12, background: 'var(--suc-bg)', border: '1px solid var(--suc-bd)', textAlign: 'center' }}>
        <CheckCircle size={40} style={{ color: 'var(--suc-fg)', marginBottom: 12 }} />
        <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--suc-fg)', fontFamily: 'Fraunces, serif', marginBottom: 6 }}>Case Submitted</div>
        <div style={{ fontSize: 13, color: 'var(--suc-fg)', fontFamily: 'Manrope, sans-serif', opacity: 0.85 }}>This case is now in the review queue.</div>
      </div>
    );
  }

  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--card-border)', background: 'var(--card-bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', background: 'var(--card-bg-tinted)', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif' }}>Extracted Case Details</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: strength.bg, border: '1px solid ' + strength.border, fontSize: 11, fontWeight: 700, color: strength.color, fontFamily: 'Manrope, sans-serif' }}>
          {strength.icon} {strength.label}
        </div>
      </div>

      {/* Fields */}
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { label: 'Business', value: data.business_name },
          { label: 'Type', value: data.business_type },
          { label: 'Location', value: [data.street_address, data.city, data.state].filter(Boolean).join(', ') },
          { label: 'Barrier', value: data.violation_subtype },
          { label: 'Date', value: formatDate(data.incident_date) },
          { label: 'Visited before', value: data.visited_before === 'yes' ? 'Yes' : data.visited_before === 'no' ? 'No' : data.visited_before === 'first_time' ? 'First time' : '—' },
        ].map(({ label, value }) => value && value !== '—' && (
          <div key={label} style={{ display: 'flex', gap: 8, fontSize: 13, fontFamily: 'Manrope, sans-serif' }}>
            <span style={{ color: 'var(--body-secondary)', fontWeight: 600, minWidth: 90, flexShrink: 0 }}>{label}</span>
            <span style={{ color: 'var(--heading)' }}>{value}</span>
          </div>
        ))}

        {data.narrative && (
          <div style={{ fontSize: 13, fontFamily: 'Manrope, sans-serif' }}>
            <div style={{ color: 'var(--body-secondary)', fontWeight: 600, marginBottom: 4 }}>Description</div>
            <div style={{ color: 'var(--heading)', lineHeight: 1.6, padding: '8px 10px', background: 'var(--page-bg-subtle)', borderRadius: 6, border: '1px solid var(--card-border)' }}>{data.narrative}</div>
          </div>
        )}

        {data.case_strength_reason && (
          <div style={{ padding: '8px 10px', borderRadius: 6, background: strength.bg, border: '1px solid ' + strength.border, fontSize: 12, color: strength.color, fontFamily: 'Manrope, sans-serif', lineHeight: 1.5 }}>
            <strong>Case assessment: </strong>{data.case_strength_reason}
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: 10, marginTop: 2 }}>
          <div style={{ color: 'var(--body-secondary)', fontWeight: 600, marginBottom: 6, fontSize: 12, fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</div>
          {[
            { label: 'Name', value: data.contact_name },
            { label: 'Email', value: data.contact_email },
            { label: 'Phone', value: data.contact_phone },
            { label: 'Prefers', value: data.contact_preference },
          ].map(({ label, value }) => value && (
            <div key={label} style={{ display: 'flex', gap: 8, fontSize: 13, fontFamily: 'Manrope, sans-serif', marginBottom: 4 }}>
              <span style={{ color: 'var(--body-secondary)', fontWeight: 600, minWidth: 50, flexShrink: 0 }}>{label}</span>
              <span style={{ color: 'var(--heading)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button onClick={onEdit} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--body)', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>
          Edit in Form
        </button>
        <button onClick={onSubmit} disabled={submitting} aria-busy={submitting} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: submitting ? 'var(--card-border)' : 'var(--accent)', color: '#fff', fontFamily: 'Manrope, sans-serif', fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', gap: 6 }}>
          {submitting ? 'Submitting…' : <><CheckCircle size={15} /> Submit Case</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminIntakeAI() {
  const { readingLevel } = useReadingLevel();

  const OPENING = {
    simple: "Hi — I'm here to help you report an ADA problem. Tell me what happened. Where were you, and what made it hard for you?",
    standard: "Hi — I'm here to help you document an ADA accessibility violation. Tell me what happened. Where were you, and what made it hard for you to access the place or service?",
    professional: "Welcome. I'll help you document an ADA violation for potential case review. Please describe the incident — the location, the nature of the barrier, and when it occurred.",
  };

  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: OPENING[readingLevel] || OPENING.standard,
    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
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

  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    async function check() {
      try {
        const user = await base44.auth.me();
        if (!user || user.role !== 'admin') { window.location.href = createPageUrl('Home'); return; }
      } catch { window.location.href = createPageUrl('Home'); return; }
      setPageLoading(false);
    }
    check();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, extractedData]);

  function now() { return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); }

  async function handlePhotoUpload(file) {
    if (!file) return;
    setPhotoFile(file);
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);

    // Add photo message
    setMessages(prev => [...prev, {
      role: 'user',
      content: '',
      photoPreview: preview,
      time: now(),
    }]);

    // Upload to CDN
    setAnalyzingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);

      // Run vision analysis
      const ADA_PHOTO_PROMPT = `You are an ADA accessibility analyst. Analyze this photo of a location and identify potential ADA violations. 
Respond ONLY with valid JSON:
{
  "summary": "2-3 sentence assessment",
  "overallRisk": "HIGH|MEDIUM|LOW|NONE",
  "violations": ["plain language description of each violation found"],
  "violation_subtype": "Path of Travel|Parking|Entrance/Exit|Restroom|Service Animal Denial|Website/App|Other"
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: ADA_PHOTO_PROMPT,
        model: 'claude_sonnet_4_6',
        file_urls: [file_url],
        add_context_from_internet: false,
      });

      const rawText = typeof response === 'string' ? response : (response?.result || response?.text || JSON.stringify(response));
      const analysis = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      setPhotoAnalysis(analysis);

      // Inject AI message about the photo
      const violationList = analysis.violations?.length > 0
        ? `I can see ${analysis.violations.length} potential issue${analysis.violations.length !== 1 ? 's' : ''} in your photo:\n• ${analysis.violations.join('\n• ')}\n\nThis looks like a ${analysis.overallRisk?.toLowerCase()} risk situation.`
        : "I analyzed your photo but couldn't identify specific violations from the image. Your description will be the main evidence.";

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: violationList + "\n\nCan you tell me the name of this business and where it's located?",
        time: now(),
      }]);
    } catch (e) {
      console.error('Photo analysis failed:', e);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I received your photo — thanks. I had trouble analyzing it automatically, but it will still be attached to your case. Can you tell me the name of this business and where it's located?",
        time: now(),
      }]);
    }
    setAnalyzingPhoto(false);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: text, time: now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    // Build conversation history for API (exclude photo previews)
    const history = newMessages
      .filter(m => m.content)
      .map(m => ({ role: m.role, content: m.content }));

    // Inject photo analysis context if available
    const systemWithContext = photoAnalysis
      ? buildSystemPrompt(readingLevel) + `\n\nPHOTO ANALYSIS ALREADY DONE: The user uploaded a photo. Analysis found: ${JSON.stringify(photoAnalysis)}. Use this to inform your questions — you already know the violation type and subtype from the photo.`
      : buildSystemPrompt(readingLevel);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemWithContext,
          messages: history,
        }),
      });
      const data = await response.json();
      const aiText = data.content?.[0]?.text || "I'm sorry, something went wrong. Please try again.";

      const extracted = parseExtract(aiText);
      const displayText = stripExtract(aiText);

      setMessages(prev => [...prev, { role: 'assistant', content: displayText, time: now() }]);

      if (extracted?.ready) {
        // Attach photo URL if we have one
        if (photoUrl) extracted.photo_url = photoUrl;
        if (photoAnalysis) extracted.photo_analysis = photoAnalysis;
        setExtractedData(extracted);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong connecting to the AI. Please try again.", time: now() }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  async function handleSubmit() {
    if (!extractedData) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    try {
      const casePayload = {
        violation_type: extractedData.violation_type || 'physical_space',
        business_name: extractedData.business_name || 'Unknown',
        business_type: extractedData.business_type || 'Other',
        city: extractedData.city || '',
        state: extractedData.state || '',
        street_address: extractedData.street_address || '',
        violation_subtype: extractedData.violation_subtype || '',
        incident_date: extractedData.incident_date || '',
        visited_before: extractedData.visited_before || '',
        narrative: extractedData.narrative || '',
        contact_name: extractedData.contact_name || '',
        contact_email: extractedData.contact_email || '',
        contact_phone: extractedData.contact_phone || '',
        contact_preference: extractedData.contact_preference || 'no_preference',
        photos: extractedData.photo_url ? [extractedData.photo_url] : [],
        intake_source: 'ai_intake',
        status: 'submitted',
        submitted_at: now,
      };

      const newCase = await base44.entities.Case.create(casePayload);
      await base44.entities.TimelineEvent.create({
        case_id: newCase.id,
        event_type: 'submitted',
        event_description: 'Case submitted via AI-powered intake. AI case strength: ' + (extractedData.case_strength || 'N/A'),
        actor_role: 'system',
        visible_to_user: true,
        created_at: now,
      });
      setSubmitted(true);
    } catch (e) {
      console.error('Submit failed:', e);
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

  if (pageLoading) return (
    <div role="status" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)', gap: '1rem' }}>
      <div className="a11y-spinner" aria-hidden="true" />
      <p style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--body-secondary)' }}>Loading…</p>
    </div>
  );

  return (
    <div style={{ backgroundColor: 'var(--page-bg)', minHeight: 'calc(100vh - 200px)', padding: 'clamp(0.75rem, 3vw, 1.5rem)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        <AdminPageHeader
          title="AI Intake"
          actionButton={
            <a href={createPageUrl('Intake')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 16px', minHeight: 44, borderRadius: 8, background: 'transparent', color: 'var(--body-secondary)', border: '1px solid var(--card-border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', fontFamily: 'Manrope, sans-serif', textDecoration: 'none' }}>
              Switch to Form Intake <ChevronRight size={14} />
            </a>
          }
        />

        {/* Explainer banner */}
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--inf-bg)', border: '1px solid var(--inf-bd)', fontFamily: 'Manrope, sans-serif', fontSize: 13, color: 'var(--inf-fg)', lineHeight: 1.6 }}>
          <strong>AI-Powered Intake — Admin Demo.</strong> This conversational intake uses Claude to extract structured case data from natural conversation. Title I and Title II violations are automatically routed to the correct external channels. Title III (private business) violations proceed to case submission.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }} className="intake-ai-grid">

          {/* ── Chat panel ── */}
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: 12, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 260px)', minHeight: 500 }}>

            {/* Chat header */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, fontFamily: 'Fraunces, serif', flexShrink: 0 }}>A</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif' }}>ADA Intake Assistant</div>
                <div style={{ fontSize: 11, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif' }}>
                  {loading ? '⟳ Thinking…' : analyzingPhoto ? '⟳ Analyzing photo…' : '● Ready'}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                {photoPreview && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--suc-fg)', fontFamily: 'Manrope, sans-serif' }}>
                    <Camera size={14} /> Photo attached
                  </div>
                )}
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', padding: '3px 8px', borderRadius: 20, border: '1px solid var(--card-border)', background: 'var(--page-bg-subtle)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {readingLevel === 'simple' ? 'Simple' : readingLevel === 'professional' ? 'Professional' : 'Standard'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
              {(loading || analyzingPhoto) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, fontFamily: 'Fraunces, serif' }}>A</div>
                  <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--body-secondary)', animation: 'bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            {!submitted && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                {/* Photo upload */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!!photoFile || analyzingPhoto}
                  aria-label="Upload a photo"
                  title={photoFile ? 'Photo already attached' : 'Upload a photo of the barrier'}
                  style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--card-border)', background: photoFile ? 'var(--suc-bg)' : 'var(--page-bg-subtle)', color: photoFile ? 'var(--suc-fg)' : 'var(--body-secondary)', cursor: photoFile ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  {photoFile ? <CheckCircle size={18} /> : <Camera size={18} />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) handlePhotoUpload(e.target.files[0]); }} />

                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Tell me what happened…"
                  rows={1}
                  aria-label="Your message"
                  style={{ flex: 1, resize: 'none', border: '1px solid var(--card-border)', borderRadius: 10, padding: '10px 14px', fontFamily: 'Manrope, sans-serif', fontSize: 14, background: 'var(--page-bg-subtle)', color: 'var(--body)', outline: 'none', lineHeight: 1.5, minHeight: 44, maxHeight: 120 }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  style={{ width: 44, height: 44, borderRadius: 10, border: 'none', background: !input.trim() || loading ? 'var(--card-border)' : 'var(--accent)', color: '#fff', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>

          {/* ── Right panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {extractedData ? (
              <CaseSummaryCard
                data={extractedData}
                onEdit={handleEditInForm}
                onSubmit={handleSubmit}
                submitting={submitting}
                submitted={submitted}
              />
            ) : (
              <div style={{ padding: '20px', borderRadius: 12, background: 'var(--card-bg)', border: '1px solid var(--card-border)', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>💬</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--heading)', fontFamily: 'Manrope, sans-serif', marginBottom: 6 }}>Case details will appear here</div>
                <div style={{ fontSize: 12, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', lineHeight: 1.6 }}>As the conversation progresses, the AI will extract structured case data and display it for review before submission.</div>
              </div>
            )}

            {/* Tips */}
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--body-secondary)', fontFamily: 'Manrope, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>How it works</div>
              {[
                { icon: '💬', text: 'Describe what happened in plain language' },
                { icon: '📸', text: 'Upload a photo to strengthen your case' },
                { icon: '🔍', text: 'AI extracts structured case details automatically' },
                { icon: '⚖️', text: 'Title I & II violations route to the right channel' },
                { icon: '✓', text: 'Review extracted details before submitting' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8, fontSize: 12, color: 'var(--body)', fontFamily: 'Manrope, sans-serif', lineHeight: 1.5 }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
        @media (max-width: 768px) {
          .intake-ai-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
