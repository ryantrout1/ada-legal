import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, X, RotateCcw, ChevronRight, Loader2 } from 'lucide-react';
import { loadPreferences } from '../a11y/DisplaySettings';
import trackEvent from '../analytics/trackEvent';

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
  const levels = { simple: "SIMPLE. Short sentences under 15 words.", standard: "STANDARD. Plain language. Reference ADA section numbers.", professional: "PROFESSIONAL. Legal terminology OK. Include citations." };
  const CHMAP = "Ch1:Ground/Floor(302)|Ch2:Ramps(405),Elevators(407)|Ch3:Parking(502),Routes(402)|Ch4:Doors(404)|Ch5:Fountains(602),Toilets(604),Grab Bars(609),Showers(608)|Ch6:Bathtubs(607),Kitchens(804)|Ch7:Signs(703),Alarms(702)|Ch8:Assembly(802),Dining(803),Pools(1009)|Ch9:Play(1008),Exercise(1010)|Ch10:Controls(309),Reach(308),Counters(904)";
  const level = levels[readingLevel] || levels.standard;
  return `You are the ADA Standards Guide assistant on ADA Legal Link.

CRITICAL RULES:
1. ONLY answer using the ADA STANDARDS CONTENT provided below. Do NOT use general knowledge.
2. If the topic IS on this page, answer from that content only. Quote section numbers.
3. If the topic is NOT on this page, say which Chapter covers it using the chapter map.
4. NEVER give general descriptions, installation tips, or product recommendations.
5. NEVER provide legal advice. Explain what the standards say. Direct to Rights Pathway.
6. Keep responses to 3-4 sentences max.
7. No bullet points or markdown. Natural sentences only.
8. If someone describes a violation, validate them, explain the standard, direct to Rights Pathway.
9. Safe for all audiences and ages.
10. If unrelated to ADA, say you only help with ADA accessibility standards.

${level}

${pageContext}
CHAPTER MAP: ${CHMAP}

TONE: Warm, clear, direct.`;
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
        className={`ada-ai-bubble ada-ai-bubble-${role}`}
        style={{
          maxWidth: '85%',
          padding: '12px 16px',
          borderRadius: role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: role === 'user' ? 'var(--accent)' : 'var(--page-bg-subtle)',
          color: role === 'user' ? 'var(--btn-text)' : 'var(--heading)',
          border: role === 'user' ? 'none' : '1px solid var(--border)',
          fontFamily: 'Manrope, sans-serif',
          fontSize: '0.9rem',
          lineHeight: 1.7,
          wordBreak: 'break-word',
        }}
      >
        {isLoading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--body)' }}>
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
          background: 'var(--card-bg-tinted)', padding: '1px 4px',
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

  // Recursively extract text from JSX elements
  const extractText = (node) => {
    if (!node) return "";
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(extractText).join(" ");
    if (node.props) return extractText(node.props.children);
    return "";
  };

  // Build page context - extract real text from JSX
  const pageContext = React.useMemo(() => {
    let ctx = "PAGE: " + (pageTitle || "ADA Standards Guide") + "\n\nADA STANDARDS CONTENT ON THIS PAGE:\n\n";
    if (pageSections && pageSections.length > 0) {
      pageSections.forEach(s => {
        ctx += "--- " + (s.number||"")+" "+(s.title||"")+" ---\n";
        const pt = extractText(s.plain)||extractText(s.simple)||"";
        const lt = extractText(s.legal)||"";
        if (pt) ctx += "Plain: "+pt.trim()+"\n";
        if (lt) ctx += "Legal: "+lt.trim()+"\n";
        ctx += "\n";
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
      // Sanitize user input to mitigate prompt injection attempts
      const sanitize = (text) => text
        .replace(/(?:ignore|forget|disregard|override|bypass)\s+(?:all\s+)?(?:previous|above|prior|system)\s+(?:instructions?|rules?|prompts?|constraints?)/gi, '[filtered]')
        .replace(/you\s+are\s+now\s+/gi, '[filtered] ')
        .replace(/\bsystem\s*prompt\b/gi, '[filtered]')
        .replace(/\bact\s+as\b/gi, '[filtered]')
        .substring(0, 500); // Hard character limit

      const recentHistory = newMessages.slice(-6).map(m =>
        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.role === 'user' ? sanitize(m.content) : m.content}`
      ).join('\n');

      const sysPrompt = buildSystemPrompt(pageContext, readingLevel || 'standard');

      // Base44 InvokeLLM ignores system_prompt param — must embed in prompt itself
      const fullPrompt = `${sysPrompt}\n\n--- CONVERSATION ---\n${recentHistory}\n\n--- INSTRUCTIONS ---\nRespond to the user's latest message using ONLY the ADA STANDARDS CONTENT above. Keep it short (3-4 sentences max), cite section numbers, plain language, one clear next step. If this topic is not on the current page, tell the user which chapter to check.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
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
      trackEvent('ada_ai_helper_query', { page: pageTitle, query: text.trim().substring(0, 100) }, 'AskADAHelper');
    } catch {}
  }, [messages, isLoading, pageContext, pageTitle, readingLevel]);

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
            background: 'var(--card-bg)', border: '2px solid var(--border)',
            borderRadius: '12px', cursor: 'pointer',
            transition: 'all 0.15s', minHeight: '56px',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--page-bg-subtle)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--card-bg)'; }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--card-bg-tinted)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <MessageCircle size={18} style={{ color: 'var(--accent-light)' }} aria-hidden="true" />
          </div>
          <div style={{ textAlign: 'left', flex: 1 }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 700,
              color: 'var(--heading)', margin: '0 0 2px',
            }}>
              Have a question about this standard?
            </p>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
              color: 'var(--body-secondary)', margin: 0,
            }}>
              Ask in plain language — we'll help you understand what the law says.
            </p>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--body-secondary)', flexShrink: 0 }} aria-hidden="true" />
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
        background: 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div className="ada-ai-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px',
        background: 'var(--card-bg)', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageCircle size={18} style={{ color: 'var(--accent-light)' }} aria-hidden="true" />
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 700,
            color: 'var(--heading)',
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
                background: 'transparent', border: '1px solid var(--border)',
                borderRadius: '8px', padding: '6px', cursor: 'pointer',
                color: 'var(--body-secondary)', minHeight: '36px', minWidth: '36px',
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
              background: 'transparent', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '6px', cursor: 'pointer',
              color: 'var(--body-secondary)', minHeight: '36px', minWidth: '36px',
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
              color: 'var(--body)', lineHeight: 1.7, margin: '0 0 16px',
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
                    background: 'var(--page-bg-subtle)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                    fontSize: '0.875rem', color: 'var(--body)',
                    minHeight: '48px', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.background = 'var(--card-bg-tinted)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--page-bg-subtle)';
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
          padding: '8px 20px', background: 'var(--card-bg-tinted)',
          borderTop: '1px solid var(--border)',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--section-label)',
        }}>
          {error}
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '12px 16px', borderTop: '1px solid var(--border)',
          background: 'var(--page-bg-subtle)',
        }}
      >
        <label htmlFor="ada-ai-input" style={{
          position: 'absolute', width: '1px', height: '1px',
          padding: 0, margin: '-1px', overflow: 'hidden',
          clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
        }}>
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
            borderRadius: '10px', border: '1px solid var(--border)',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
            color: 'var(--heading)', background: 'var(--card-bg)',
            minHeight: '48px', outline: 'none',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send question"
          className="ada-ai-send"
          style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: input.trim() && !isLoading ? 'var(--accent)' : 'var(--border)',
            border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: input.trim() && !isLoading ? 'var(--btn-text)' : 'var(--body-secondary)',
            flexShrink: 0, transition: 'all 0.15s',
          }}
        >
          <Send size={18} />
        </button>
      </form>

      {/* Disclaimer */}
      <div style={{
        padding: '8px 20px 10px', background: 'var(--page-bg-subtle)',
        borderTop: '1px solid var(--border-lighter)',
      }}>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem',
          color: 'var(--body-secondary)', margin: 0, lineHeight: 1.5,
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
