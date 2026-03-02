import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, X, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';
import { loadPreferences } from '../a11y/DisplaySettings';

/**
 * ADA Standards AI Helper
 * 
 * An accessible, inline conversational AI component that helps visitors
 * understand ADA standards in context. Designed for WCAG 2.2 AAA compliance.
 * 
 * Persona constraints (built into design):
 * - Maria (blind, VoiceOver): Structured responses, proper ARIA live regions
 * - James (quad, switch access): Voice input option, big targets, minimal typing
 * - Denise (low vision, 400% zoom): Short responses, no horizontal scroll
 * - Robert (tremor): Large buttons, suggested questions, no auto-submit
 * - Aisha (deaf): All text-based, no audio-only features
 * - Tom (TBI): One question at a time, plain language, clear single action
 */

const SUGGESTED_QUESTIONS = {
  default: [
    'Does this apply to my situation?',
    'What should I do if I found a violation?',
    'Explain this in simpler terms',
  ],
  physical: [
    'Does this apply to existing buildings?',
    'What if the business says it\'s too expensive to fix?',
    'How do I report this violation?',
  ],
  digital: [
    'Does this apply to private businesses?',
    'What accessibility standard do websites need to meet?',
    'Can I sue over a website that doesn\'t work with my screen reader?',
  ],
};

function buildSystemPrompt(pageContext, readingLevel) {
  const levelInstructions = {
    simple: `READING LEVEL: SIMPLE MODE — The user has selected "Simple" reading level, meaning they need the clearest, most accessible language possible. Use short sentences (under 15 words each). No legal terms whatsoever — if you must reference a section number, explain it immediately. Use concrete, everyday words. Aim for a 4th-5th grade reading level. One idea per sentence. If the answer is complex, break it into the smallest possible pieces.`,
    standard: `READING LEVEL: STANDARD — Use plain language. Avoid legal jargon but you can reference ADA section numbers (§XXX) with a brief explanation. Aim for a 6th-8th grade reading level. Keep sentences clear and direct.`,
    professional: `READING LEVEL: PROFESSIONAL — The user has selected "Professional" reading level, meaning they are comfortable with legal terminology. You can use ADA section numbers, legal terms, and reference specific regulatory language. Still be concise, but don't oversimplify. Include relevant citations and regulatory references.`,
  };

  return `You are the ADA Standards Helper on ADA Legal Link — a platform co-founded by Gina, a J.D. and ADA rights advocate with 20 years of lived experience navigating ADA barriers as a quadriplegic.

YOUR ROLE: Help visitors understand ADA accessibility standards. You are warm, clear, and direct. You are NOT a lawyer and cannot give legal advice — but you can explain what the law says and what options exist.

CURRENT PAGE CONTEXT:
${pageContext}

${levelInstructions[readingLevel] || levelInstructions.standard}

RESPONSE RULES — THESE ARE CRITICAL:
1. KEEP RESPONSES SHORT. Maximum 3-4 sentences for the main answer. Most users have disabilities that make long text difficult — screen readers drone, 400% zoom creates scroll walls, cognitive disabilities cause overload.
2. Answer the question FIRST in one sentence. Then provide brief supporting detail.
3. End with exactly ONE clear next step or action — never multiple options.
4. If someone describes a violation they experienced, validate them first ("That shouldn't have happened — the ADA requires..."), explain their rights briefly, then direct them to the Rights Pathway.
5. If you're unsure, say so. Never make up legal information.
6. Do NOT use bullet points, numbered lists, or markdown formatting. Write in natural sentences.
7. Never say "I'm just an AI" or "I can't help with that." Always provide something useful.
8. If someone needs an attorney, don't say "call a lawyer." Say "You can use our Rights Pathway to understand your options and connect with an attorney — no cost to you."

TONE: Like a knowledgeable friend who happens to understand disability law. Not clinical. Not overly formal. Not preachy. Just clear and helpful.`;
}

function Message({ role, content, isLoading }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
        marginBottom: '12px',
      }}
    >
      <div
        role={role === 'assistant' ? 'status' : undefined}
        className={`ada-ai-bubble ada-ai-bubble-${role}`}
        style={{
          maxWidth: '85%',
          padding: '12px 16px',
          borderRadius: role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: role === 'user' ? 'var(--accent)' : 'var(--page-bg-subtle)',
          color: role === 'user' ? 'white' : 'var(--slate-800, #1E293B)',
          border: role === 'user' ? 'none' : '1px solid var(--slate-200, #E2E8F0)',
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.9rem',
          lineHeight: 1.7,
          wordBreak: 'break-word',
        }}
      >
        {isLoading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--slate-600, #4B5563)' }}>
            <Loader2 size={16} style={{ animation: 'ada-ai-spin 1s linear infinite' }} aria-hidden="true" />
            Thinking...
          </span>
        ) : (
          formatResponse(content)
        )}
      </div>
    </div>
  );
}

function formatResponse(text) {
  if (!text) return null;
  // Convert §XXX references to styled spans and detect Rights Pathway mentions
  const parts = text.split(/(§\d{3,4}(?:\.\d+)*|Rights Pathway)/g);
  return parts.map((part, i) => {
    if (/^§\d{3,4}/.test(part)) {
      return (
        <span key={i} style={{
          fontWeight: 600, color: 'var(--section-label)',
          background: 'rgba(194,65,12,0.08)', padding: '1px 4px',
          borderRadius: '3px', fontSize: '0.85rem',
        }}>{part}</span>
      );
    }
    if (part === 'Rights Pathway') {
      return (
        <Link
          key={i}
          to={createPageUrl('RightsPathway')}
          style={{
            color: 'var(--section-label)', fontWeight: 600,
            textDecoration: 'underline', textUnderlineOffset: '2px',
          }}
        >
          Rights Pathway
        </Link>
      );
    }
    return part;
  });
}


export default function AskADAHelper({ pageTitle, pageSections, pageType, readingLevel: readingLevelProp }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use prop if provided, otherwise read from display preferences
  const readingLevel = readingLevelProp || (() => {
    try { return loadPreferences().readingLevel || 'standard'; } catch { return 'standard'; }
  })();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const openBtnRef = useRef(null);

  // Build page context for the system prompt
  const pageContext = React.useMemo(() => {
    let ctx = `Page: ${pageTitle || 'ADA Standards Guide'}\n`;
    if (pageSections && pageSections.length > 0) {
      ctx += 'Sections on this page:\n';
      pageSections.forEach(s => {
        ctx += `- ${s.number || ''} ${s.title}: ${s.plain || s.legal || ''}\n`;
      });
    }
    return ctx;
  }, [pageTitle, pageSections]);

  const suggestedQuestions = SUGGESTED_QUESTIONS[pageType] || SUGGESTED_QUESTIONS.default;

  // Scroll to bottom on new messages — within the chat panel only
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Trap focus in panel when open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        openBtnRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history for context (last 6 messages max)
      const recentHistory = newMessages.slice(-6).map(m =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `${recentHistory}\n\nRespond to the user's latest message. Remember: keep it short (3-4 sentences max), answer first, plain language, one clear next step.`,
        system_prompt: buildSystemPrompt(pageContext, readingLevel || 'standard'),
        temperature: 0.3,
      });

      const assistantMessage = {
        role: 'assistant',
        content: typeof response === 'string' ? response : response?.result || response?.text || 'I wasn\'t able to process that. Could you try rephrasing your question?',
      };

      setMessages([...newMessages, assistantMessage]);
    } catch (err) {
      console.error('ADA AI Helper error:', err);
      setError('Something went wrong. Please try again.');
      // Remove the loading state but keep user message
      setMessages(newMessages);
    } finally {
      setIsLoading(false);
    }

    // Track usage
    try {
      base44.analytics.track({
        eventName: 'ada_ai_helper_query',
        properties: { page: pageTitle, query: text.trim().substring(0, 100) },
      });
    } catch {}
  }, [messages, isLoading, pageContext, pageTitle]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (question) => {
    sendMessage(question);
  };

  const handleReset = () => {
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  };

  // Closed state — the trigger button
  if (!isOpen) {
    return (
      <div style={{ margin: '24px 0' }}>
        <button
          ref={openBtnRef}
          onClick={() => setIsOpen(true)}
          aria-expanded="false"
          aria-controls="ada-ai-panel"
          className="brand-icon ada-ai-trigger"
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            width: '100%', padding: '16px 20px',
            background: 'var(--dark-bg)', border: '2px solid rgba(194,65,12,0.25)',
            borderRadius: '12px', cursor: 'pointer',
            transition: 'all 0.15s', minHeight: '56px',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = '#253040'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(194,65,12,0.25)'; e.currentTarget.style.background = '#1E293B'; }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(194,65,12,0.15)', border: '1px solid rgba(194,65,12,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <MessageCircle size={18} style={{ color: 'var(--accent-light)' }} aria-hidden="true" />
          </div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 700,
              color: 'var(--dark-heading)', margin: '0 0 2px',
            }}>
              Have a question about this standard?
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
              color: 'var(--dark-muted)', margin: 0,
            }}>
              Ask in plain language — we'll help you understand what the law says.
            </p>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--dark-muted)', flexShrink: 0 }} aria-hidden="true" />
        </button>
      </div>
    );
  }

  // Open state — the conversation panel
  return (
    <div
      id="ada-ai-panel"
      ref={panelRef}
      role="region"
      aria-label="ADA Standards Helper"
      className="ada-ai-panel"
      style={{
        margin: '24px 0',
        background: 'white',
        border: '1px solid var(--slate-200)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div className="ada-ai-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        background: 'var(--dark-bg)', borderBottom: '1px solid #334155',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageCircle size={18} style={{ color: 'var(--accent-light)' }} aria-hidden="true" />
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
            color: 'var(--dark-heading)',
          }}>
            Ask About This Standard
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {messages.length > 0 && (
            <button
              onClick={handleReset}
              aria-label="Start over"
              title="Start over"
              style={{
                background: 'transparent', border: '1px solid #475569',
                borderRadius: '8px', padding: '6px', cursor: 'pointer',
                color: 'var(--dark-muted)', minHeight: '36px', minWidth: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <RotateCcw size={14} />
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close helper"
            style={{
              background: 'transparent', border: '1px solid #475569',
              borderRadius: '8px', padding: '6px', cursor: 'pointer',
              color: 'var(--dark-muted)', minHeight: '36px', minWidth: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        aria-live="polite"
        aria-relevant="additions"
        style={{
          padding: '16px 20px',
          maxHeight: '360px',
          overflowY: 'auto',
          minHeight: messages.length === 0 ? 'auto' : '120px',
        }}
      >
        {messages.length === 0 && !isLoading ? (
          /* Welcome + suggested questions */
          <div>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
              color: 'var(--slate-600)', lineHeight: 1.7, margin: '0 0 16px',
            }}>
              Ask anything about the standards on this page. You can type your question or tap one below.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(q)}
                  className="ada-ai-suggestion"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    width: '100%', textAlign: 'left',
                    padding: '12px 16px', borderRadius: '10px',
                    background: 'var(--slate-50, #F8FAFC)',
                    border: '1px solid var(--slate-200, #E2E8F0)',
                    cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                    fontSize: '0.875rem', color: 'var(--slate-700, #334155)',
                    minHeight: '48px', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.background = '#FFF7ED';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--slate-200, #E2E8F0)';
                    e.currentTarget.style.background = 'var(--slate-50, #F8FAFC)';
                  }}
                >
                  <ChevronRight size={14} style={{ color: 'var(--section-label)', flexShrink: 0 }} aria-hidden="true" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m, i) => (
              <Message key={i} role={m.role} content={m.content} />
            ))}
            {isLoading && <Message role="assistant" content="" isLoading />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div role="alert" style={{
          padding: '8px 20px', background: '#FEF2F2',
          borderTop: '1px solid #FECACA',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: '#991B1B',
        }}>
          {error}
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 16px', borderTop: '1px solid var(--slate-200)',
          background: 'var(--slate-50, #F8FAFC)',
        }}
      >
        <label htmlFor="ada-ai-input" className="sr-only">
          Type your question about ADA standards
        </label>
        <input
          id="ada-ai-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your question..."
          disabled={isLoading}
          autoComplete="off"
          className="ada-ai-input"
          style={{
            flex: 1, padding: '12px 16px',
            borderRadius: '10px', border: '1px solid var(--slate-300, #CBD5E1)',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
            color: 'var(--slate-800)', background: 'white',
            minHeight: '48px', outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--slate-300, #CBD5E1)'; }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send question"
          className="ada-ai-send"
          style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: input.trim() && !isLoading ? '#C2410C' : 'var(--slate-200, #E2E8F0)',
            border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: input.trim() && !isLoading ? 'white' : 'var(--slate-500)',
            flexShrink: 0, transition: 'all 0.15s',
          }}
        >
          <Send size={18} />
        </button>
      </form>

      {/* Disclaimer */}
      <div style={{
        padding: '8px 20px 10px', background: 'var(--slate-50, #F8FAFC)',
        borderTop: '1px solid var(--slate-100, #F1F5F9)',
      }}>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem',
          color: '#475569', margin: 0, lineHeight: 1.5,
        }}>
          This helper explains ADA standards — it does not provide legal advice. For your specific situation, use the{' '}
          <Link to={createPageUrl('RightsPathway')} style={{ color: 'var(--section-label)', textDecoration: 'underline' }}>
            Rights Pathway
          </Link>.
        </p>
      </div>

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes ada-ai-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
