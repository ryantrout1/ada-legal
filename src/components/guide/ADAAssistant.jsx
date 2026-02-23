import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, AlertCircle } from 'lucide-react';
import LogoBrand from '../LogoBrand';
import AutoCiteLinks from './AutoCiteLinks';

const SYSTEM_PROMPT = `You are the ADA Standards Assistant for ADA Legal Link.
You are an expert on the 2010 ADA Standards for Accessible Design
(28 CFR Part 36, Appendix B) and related ADA regulations.

YOUR ROLE:
- Answer questions about ADA accessibility requirements accurately
- Cite specific section numbers (e.g., §405.2, §604.5.1) in every answer
- Provide both the technical requirement AND a plain-language explanation
- When scoping tables apply (how many accessible elements are needed),
  give the specific numbers from the standards
- Cross-reference related sections when relevant

RESPONSE FORMAT:
- Start with a clear, direct answer to the question
- Use §xxx.x format for all section references
  (these will automatically become clickable links to ADA.gov)
- Use plain language first, then cite the official standard
- Keep responses concise but thorough — aim for 150-300 words
- Use markdown formatting: **bold** for key measurements,
  bullet points for lists of requirements
- End with "Related sections:" listing 2-3 connected standards

KEY STANDARDS KNOWLEDGE:

Chapter 1-2: Application & Scoping (§101-§243)
- §208: Parking spaces scoping table
- §213: Toilet/bathing facility scoping
- §221: Assembly area wheelchair space scoping
- §224: Transient lodging (hotel) room scoping

Chapter 3: Building Blocks (§301-§309)
- §304: Turning space — 60-inch diameter or T-shaped
- §305: Clear floor space — 30x48 inches minimum
- §306: Knee/toe clearance — 27 inches high at 8 inches deep
- §307: Protruding objects — 4 inches max between 27-80 inches height
- §308: Reach ranges — 15-48 inches (forward), 15-48 inches (side)
- §309: Operable parts — one hand, no tight grasping, 5 lbs max force

Chapter 4: Accessible Routes (§401-§410)
- §403: Walking surfaces — 36 inches wide, 1:20 max slope
- §404: Doors — 32 inches clear width, 5 lbs max force, lever hardware
- §405: Ramps — 1:12 max slope, 36 inches wide, 30-inch max rise per run
- §406: Curb ramps — detectable warnings, 1:12 max, flared sides 1:10
- §407: Elevators — cab sizes per Table 407.4.1, door timing, controls

Chapter 5: General Site & Building (§501-§505)
- §502: Parking — van spaces 132 inches wide, car 96 inches, access aisle 60 inches
  Scoping: 1-25 total = 1 accessible; 26-50 = 2; 51-75 = 3; etc.
  1 in every 6 accessible spaces must be van-accessible
- §503: Passenger loading zones — 96 inches wide, 20 feet long, 114 inches vertical
- §504: Stairways — uniform risers 4-7 inches, nosings, handrails both sides
- §505: Handrails — 34-38 inches high, 1.25-2 inch diameter, extensions

Chapter 6: Plumbing (§601-§612)
- §604: Water closets — centerline 16-18 inches from wall, seat 17-19 inches
  Grab bars: side wall 42 inches, rear wall 36 inches, 33-36 inches high
- §606: Lavatories — 34 inches max rim height, knee clearance, pipe protection
- §607: Bathtubs — clearance 30x60, grab bars, seat, 59-inch hose
- §608: Showers — transfer 36x36, roll-in 60x30, grab bars, seat in transfer
- §609: Grab bars — 1.25-2 inches diameter, 1.5 inches from wall, 250 lbs
- §611: Drinking fountains — wheelchair 36 inches max, standing 38-43 inches

Chapter 7: Communication (§701-§708)
- §703: Signs — raised characters 5/8-2 inches, Grade 2 Braille, 48-60 inches mounting

Chapter 8: Special Rooms (§801-§811)
- §802: Assembly seating — wheelchair space 36x48 (front) or 36x60 (side)
  Sightlines over standing spectators, companion seats adjacent
- §803: Dressing rooms — 60-inch turning, bench 24x48, door swings out
- §804: Kitchens — work surface 34 inches max, 60-inch U-turn, 40-inch galley
- §806: Guest rooms — 36-inch route, bed clearance, accessible bathroom
- §807: Detention cells — 3% mobility, 2% communication, dispersed

Chapter 9: Built-in Elements (§901-§904)
- §902: Dining surfaces — 28-34 inches high, knee clearance, 5% accessible
- §903: Benches — 17-19 inches high, 42 inches long, back support, 250 lbs
- §904: Counters — sales 36 inches max height x 36 inches long

Chapter 10: Recreation (§1001-§1010)
- §1008: Play areas — transfer platform 14 inches, 50% elevated via ramp
- §1009: Pools — large pools need 2 entries (1 primary: lift or sloped)

IMPORTANT RULES:
- NEVER provide legal advice. Say 'For legal advice specific to your
  situation, consult an ADA attorney.' if asked for legal opinions.
- If you're not sure about a specific measurement or requirement,
  say so rather than guessing.
- Always distinguish between NEW CONSTRUCTION and ALTERATIONS
  requirements when relevant — alterations have safe harbor provisions.
- Reference the scoping chapter (§201-§243) for 'how many' questions
  and the technical chapter (§301-§1010) for 'how to build' questions.
- When mentioning section numbers, always use the §xxx.x format so
  the site can auto-link them to ADA.gov.`;

const STARTERS = [
  "How many accessible parking spaces does my lot need?",
  "What are the grab bar requirements for bathrooms?",
  "What width must accessible doorways be?",
  "I'm renovating a restaurant — what ADA rules apply?"
];

function parseMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      elements.push(<br key={`br-${i}`} />);
      i++;
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^(#+)/)[1].length;
      const content = line.replace(/^#+\s*/, '');
      elements.push(
        <p key={`h-${i}`} style={{ fontWeight: 700, fontSize: level === 1 ? '1.1rem' : '1rem', margin: '12px 0 4px' }}>
          <AutoCiteLinks>{applyInline(content)}</AutoCiteLinks>
        </p>
      );
      i++;
      continue;
    }

    if (/^\s*[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s*/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '8px 0', paddingLeft: '20px' }}>
          {items.map((item, j) => (
            <li key={j} style={{ marginBottom: '4px' }}>
              <AutoCiteLinks>{applyInline(item)}</AutoCiteLinks>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s*/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: '8px 0', paddingLeft: '20px' }}>
          {items.map((item, j) => (
            <li key={j} style={{ marginBottom: '4px' }}>
              <AutoCiteLinks>{applyInline(item)}</AutoCiteLinks>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    elements.push(
      <p key={`p-${i}`} style={{ margin: '4px 0' }}>
        <AutoCiteLinks>{applyInline(line)}</AutoCiteLinks>
      </p>
    );
    i++;
  }

  return elements;
}

function applyInline(text) {
  const parts = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length > 0 ? parts : text;
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
      <LogoBrand size={24} style={{ flexShrink: 0, marginTop: '4px' }} />
      <div style={{
        background: '#FFFBF7', border: '1px solid var(--slate-200)',
        borderRadius: '12px', padding: '14px 18px',
        display: 'flex', gap: '5px', alignItems: 'center'
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: '7px', height: '7px', borderRadius: '50%', background: '#94A3B8',
            display: 'inline-block',
            animation: `adaPulse 1.2s ease-in-out ${i * 0.2}s infinite`
          }} />
        ))}
      </div>
    </div>
  );
}

export default function ADAAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', text: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setError(null);
    setLoading(true);

    const historyText = newMessages.map(m =>
      m.role === 'user' ? `User: ${m.text}` : `Assistant: ${m.text}`
    ).join('\n\n');

    const fullPrompt = `${historyText}\n\nAssistant:`;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: fullPrompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            answer: { type: "string" }
          }
        }
      });

      const answer = typeof response === 'string' ? response : (response?.answer || response?.text || JSON.stringify(response));
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasConversation = messages.length > 0;

  return (
    <div style={{ maxWidth: '520px', width: '100%' }}>
      <style>{`
        @keyframes adaPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Input area */}
      <div role="search" aria-label="Ask about ADA standards" style={{ position: 'relative' }}>
        <label htmlFor="ada-assistant-input" className="sr-only">Ask about ADA standards</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            id="ada-assistant-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any ADA standard... e.g. How wide must a doorway be?"
            aria-label="Ask about ADA standards"
            style={{
              width: '100%', padding: '14px 56px 14px 16px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              background: 'rgba(255,255,255,0.06)', color: 'white',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px', outline: 'none',
              minHeight: '48px', boxSizing: 'border-box'
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(194,65,12,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            aria-label="Send message"
            style={{
              position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
              background: input.trim() && !loading ? '#C2410C' : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: '8px',
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              transition: 'background 0.2s'
            }}
          >
            <Send size={16} style={{ color: 'white' }} />
          </button>
        </div>

        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
          color: '#64748B', margin: '8px 0 0', fontStyle: 'italic'
        }}>
          AI-powered guidance based on the 2010 ADA Standards. For legal advice, consult an ADA attorney.
        </p>
      </div>

      {/* Starter chips */}
      {!hasConversation && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px'
        }}>
          {STARTERS.map((q, i) => (
            <button
              key={i}
              onClick={() => sendMessage(q)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '100px', padding: '8px 16px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
                color: '#CBD5E1', cursor: 'pointer',
                transition: 'all 0.2s', lineHeight: 1.4
              }}
              onMouseEnter={e => { e.target.style.background = 'rgba(194,65,12,0.15)'; e.target.style.borderColor = 'rgba(194,65,12,0.3)'; e.target.style.color = '#FED7AA'; }}
              onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = '#CBD5E1'; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Chat messages */}
      {hasConversation && (
        <div
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          style={{
            marginTop: '20px', maxHeight: '500px', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: '12px',
            padding: '4px 2px',
            scrollBehavior: 'smooth'
          }}
        >
          {messages.map((msg, i) => (
            msg.role === 'user' ? (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  background: '#C2410C', color: 'white',
                  borderRadius: '12px 12px 2px 12px',
                  padding: '12px 16px', maxWidth: '85%',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', lineHeight: 1.6
                }}>
                  {msg.text}
                </div>
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <LogoBrand size={24} style={{ flexShrink: 0, marginTop: '4px' }} />
                <div style={{
                  background: '#FFFBF7', border: '1px solid var(--slate-200)',
                  borderRadius: '12px 12px 12px 2px',
                  padding: '14px 18px', maxWidth: '85%',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                  color: 'var(--slate-700)', lineHeight: 1.7
                }}>
                  {parseMarkdown(msg.text)}
                </div>
              </div>
            )
          ))}

          {loading && <TypingIndicator />}

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: '10px', padding: '10px 14px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: '#FCA5A5'
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Screen reader announcement */}
      <div aria-live="assertive" className="sr-only">
        {loading ? 'Assistant is thinking...' : ''}
      </div>
    </div>
  );
}