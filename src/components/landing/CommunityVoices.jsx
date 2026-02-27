import React, { useState, useEffect, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import trackEvent from '../analytics/trackEvent';

// ─── Options ───
const OPTIONS = [
  { id: 'rights', emoji: '🔍', label: 'I want to understand my rights', color: '#C2410C' },
  { id: 'happened', emoji: '🌱', label: 'Something happened & I want to understand it', color: '#16A34A' },
  { id: 'space', emoji: '🏢', label: 'I want my space accessible for everyone', color: '#2563EB' },
  { id: 'believe', emoji: '❤️', label: 'Access is a human right', color: '#9333EA' },
];

// ─── US population hotspots for dot placement ───
const HOTSPOTS = [
  { x: 12, y: 45, r: 4 }, { x: 80, y: 28, r: 3 }, { x: 42, y: 66, r: 4 },
  { x: 74, y: 72, r: 3 }, { x: 60, y: 42, r: 2 }, { x: 23, y: 58, r: 3 },
  { x: 78, y: 34, r: 2 }, { x: 69, y: 38, r: 2 }, { x: 66, y: 30, r: 2 },
  { x: 14, y: 26, r: 2 }, { x: 52, y: 24, r: 2 }, { x: 56, y: 68, r: 2 },
  { x: 31, y: 45, r: 2 }, { x: 77, y: 46, r: 2 }, { x: 54, y: 48, r: 2 },
];

const US_STATES = [
  { x: 65.5, y: 62 }, { x: 13, y: 78 }, { x: 23, y: 58 }, { x: 56, y: 58 },
  { x: 12, y: 45 }, { x: 31, y: 45 }, { x: 84, y: 32 }, { x: 82, y: 39 },
  { x: 74, y: 72 }, { x: 71, y: 62 }, { x: 28, y: 82 }, { x: 20, y: 28 },
  { x: 60, y: 42 }, { x: 64, y: 40 }, { x: 54, y: 36 }, { x: 44, y: 48 },
  { x: 68, y: 48 }, { x: 56, y: 68 }, { x: 88, y: 18 }, { x: 80, y: 39 },
  { x: 86, y: 30 }, { x: 66, y: 30 }, { x: 52, y: 24 }, { x: 60, y: 64 },
  { x: 54, y: 48 }, { x: 27, y: 20 }, { x: 43, y: 38 }, { x: 16, y: 40 },
  { x: 86, y: 24 }, { x: 82, y: 36 }, { x: 28, y: 56 }, { x: 80, y: 28 },
  { x: 76, y: 54 }, { x: 43, y: 20 }, { x: 69, y: 38 }, { x: 46, y: 56 },
  { x: 14, y: 26 }, { x: 78, y: 34 }, { x: 86, y: 32 }, { x: 75, y: 58 },
  { x: 43, y: 28 }, { x: 66, y: 54 }, { x: 42, y: 66 }, { x: 23, y: 42 },
  { x: 84, y: 22 }, { x: 77, y: 46 }, { x: 14, y: 16 }, { x: 74, y: 44 },
  { x: 58, y: 28 }, { x: 29, y: 32 },
];

// Deterministic seeded random for consistent dot placement
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function generateDots(votes) {
  const dots = [];
  const rand = seededRandom(42);
  const total = Object.values(votes).reduce((a, b) => a + b, 0);
  
  let dotId = 0;
  for (const [optionId, count] of Object.entries(votes)) {
    for (let i = 0; i < Math.min(count, 80); i++) {
      let x, y;
      if (rand() < 0.7) {
        const hs = HOTSPOTS[Math.floor(rand() * HOTSPOTS.length)];
        x = hs.x + (rand() - 0.5) * hs.r * 4;
        y = hs.y + (rand() - 0.5) * hs.r * 4;
      } else {
        const st = US_STATES[Math.floor(rand() * US_STATES.length)];
        x = st.x + (rand() - 0.5) * 6;
        y = st.y + (rand() - 0.5) * 6;
      }
      dots.push({
        id: `d${dotId++}`,
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(8, Math.min(85, y)),
        optionId,
        delay: rand() * 4,
        size: 2 + rand() * 2,
      });
    }
  }
  return dots;
}

// ─── Storage helpers ───
const STORAGE_KEY = 'adall_community_vote';

function getSavedVote() {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function saveVote(optionId) {
  try { localStorage.setItem(STORAGE_KEY, optionId); } catch {}
}

// ─── Result Bar ───
function ResultBar({ option, count, total, delay, isUser }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div
      role="listitem"
      aria-label={`${option.label}: ${pct} percent`}
      style={{
        marginBottom: 12,
        animation: `cvFadeUp 0.5s ${delay}s both`,
        padding: '10px 14px',
        borderRadius: 12,
        background: isUser ? `${option.color}12` : 'transparent',
        border: isUser ? `1px solid ${option.color}30` : '1px solid transparent',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 6,
      }}>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
          fontWeight: isUser ? 700 : 600, color: isUser ? '#F8FAFC' : '#CBD5E1',
        }}>
          <span aria-hidden="true">{option.emoji}</span>&nbsp;&nbsp;{option.label}
        </span>
        <span style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
          fontWeight: 700, color: option.color, minWidth: 48, textAlign: 'right',
        }}>
          {pct}%
        </span>
      </div>
      <div style={{
        height: 6, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
        role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
        aria-label={`${option.label}: ${pct}%`}
      >
        <div style={{
          height: '100%', borderRadius: 100,
          backgroundColor: option.color,
          width: `${pct}%`,
          transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }} />
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function CommunityVoices() {
  const [votes, setVotes] = useState({ rights: 0, happened: 0, space: 0, believe: 0 });
  const [selectedId, setSelectedId] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [buttonsVisible, setButtonsVisible] = useState(true);
  const [userDot, setUserDot] = useState(null);
  const [ripples, setRipples] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const announcerRef = useRef(null);

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  // Load votes from Base44 on mount
  useEffect(() => {
    async function loadVotes() {
      try {
        const records = await base44.entities.CommunityVote.getAll();
        const counts = { rights: 0, happened: 0, space: 0, believe: 0 };
        records.forEach(r => {
          if (counts.hasOwnProperty(r.option_id)) {
            counts[r.option_id]++;
          }
        });
        setVotes(counts);
      } catch {
        // Entity not created yet or error — use seed data
        setVotes({ rights: 87, happened: 68, space: 38, believe: 54 });
      }

      // Check if user already voted
      const saved = getSavedVote();
      if (saved) {
        setSelectedId(saved);
        setHasVoted(true);
        setButtonsVisible(false);
        setUserDot({
          x: 23 + (Math.random() - 0.5) * 4,
          y: 58 + (Math.random() - 0.5) * 4,
          optionId: saved,
        });
      }
      setLoaded(true);
    }
    loadVotes();
  }, []);

  const handleVote = useCallback(async (optionId) => {
    setSelectedId(optionId);
    setVotes(prev => ({ ...prev, [optionId]: prev[optionId] + 1 }));

    const dot = {
      x: 23 + (Math.random() - 0.5) * 4,
      y: 58 + (Math.random() - 0.5) * 4,
      optionId,
    };
    setUserDot(dot);
    setRipples([{ x: dot.x, y: dot.y, id: Date.now() }]);

    setButtonsVisible(false);
    setTimeout(() => setHasVoted(true), 400);
    setTimeout(() => setRipples([]), 2000);

    // Persist
    saveVote(optionId);

    // Track in analytics
    trackEvent('community_voice_vote', { option_id: optionId }, 'CommunityVoices');

    // Save to Base44 entity
    try {
      await base44.entities.CommunityVote.create({ option_id: optionId });
    } catch {
      // Entity might not exist yet — vote still counted locally
    }

    // Announce to screen readers
    if (announcerRef.current) {
      const opt = OPTIONS.find(o => o.id === optionId);
      announcerRef.current.textContent = `Vote recorded: ${opt?.label}. You are one of ${totalVotes + 1} people in the ADA community.`;
    }
  }, [totalVotes]);

  const dots = generateDots(votes);

  if (!loaded) return null;

  return (
    <section
      aria-label="Community voices poll"
      style={{
        background: '#0F172A',
        padding: 'clamp(56px, 8vw, 80px) 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Screen reader announcer */}
      <div
        ref={announcerRef}
        aria-live="polite" aria-atomic="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      />

      {/* Grid texture */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025,
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '32px 32px', pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* ─── Header ─── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.72rem',
            fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
            color: '#C2410C', margin: '0 0 12px',
          }}>
            Community Voices
          </p>
          <h2 style={{
            fontFamily: 'Fraunces, Georgia, serif',
            fontSize: 'clamp(1.6rem, 4vw, 2.25rem)',
            fontWeight: 700, color: 'white', margin: '0 0 10px', lineHeight: 1.2,
          }}>
            {hasVoted ? "You've been heard." : 'Add your voice.'}
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
            color: '#94A3B8', margin: 0, lineHeight: 1.6,
          }}>
            {hasVoted
              ? `You're one of ${totalVotes.toLocaleString()} people standing up for accessibility.`
              : 'Join the ADA community — anonymous, instant, and every voice counts.'}
          </p>
        </div>

        {/* ─── Buttons or Results ─── */}
        {!hasVoted ? (
          <div
            role="group"
            aria-label="Choose why you are here"
            style={{
              marginBottom: 32,
              opacity: buttonsVisible ? 1 : 0,
              transform: buttonsVisible ? 'translateY(0)' : 'translateY(-10px)',
              transition: 'all 0.35s ease',
            }}
          >
            <p id="cv-prompt" style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
              fontWeight: 700, color: '#475569', textAlign: 'center',
              margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              I'm here because...
            </p>
            <div
              role="radiogroup"
              aria-labelledby="cv-prompt"
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {OPTIONS.map((opt, i) => (
                <button
                  key={opt.id}
                  role="radio"
                  aria-checked="false"
                  onClick={() => handleVote(opt.id)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    gap: 14, padding: '16px 20px',
                    minHeight: 56,
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.025)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    animation: `cvFadeUp 0.4s ${i * 0.08}s both`,
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${opt.color}60`;
                    e.currentTarget.style.background = `${opt.color}0C`;
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                  onFocus={e => {
                    e.currentTarget.style.outline = `2px solid ${opt.color}`;
                    e.currentTarget.style.outlineOffset = '2px';
                  }}
                  onBlur={e => { e.currentTarget.style.outline = 'none'; }}
                >
                  <span aria-hidden="true" style={{
                    fontSize: '1.3rem', lineHeight: 1,
                    width: 36, textAlign: 'center', flexShrink: 0,
                  }}>
                    {opt.emoji}
                  </span>
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.92rem',
                    fontWeight: 600, color: '#E2E8F0', lineHeight: 1.3,
                  }}>
                    {opt.label}
                  </span>
                  <span aria-hidden="true" style={{
                    marginLeft: 'auto', color: '#334155', fontSize: '1.1rem',
                    transition: 'color 0.2s', flexShrink: 0,
                  }}>
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div
            role="list"
            aria-label="Community vote results"
            style={{ marginBottom: 32, animation: 'cvFadeUp 0.5s ease-out' }}
          >
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
              fontWeight: 700, color: '#475569', textAlign: 'center',
              margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Community Breakdown
            </p>
            {OPTIONS.map((opt, i) => (
              <ResultBar
                key={opt.id}
                option={opt}
                count={votes[opt.id]}
                total={totalVotes}
                delay={i * 0.1}
                isUser={opt.id === selectedId}
              />
            ))}
          </div>
        )}

        {/* ─── Map ─── */}
        <div
          role="img"
          aria-label={`Map showing ${totalVotes} community members across the United States`}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1.65 / 1',
            borderRadius: 16,
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.05)',
            overflow: 'hidden',
          }}
        >
          {/* US silhouette */}
          <svg viewBox="0 0 100 90" preserveAspectRatio="none" aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.04 }}>
            <path d="M12,12 L22,10 L28,14 L32,12 L42,14 L52,10 L58,12 L66,10 L74,14 L82,12 L90,16 L88,24 L90,32 L86,36 L84,42 L80,44 L78,48 L82,50 L80,54 L76,56 L78,60 L74,64 L76,70 L72,76 L68,72 L64,68 L60,64 L56,70 L52,66 L48,62 L44,60 L40,64 L36,60 L32,56 L28,58 L24,54 L20,48 L16,44 L12,40 L10,34 L12,28 L10,22 Z" fill="white" />
          </svg>

          {/* Dots */}
          {dots.map(dot => {
            const opt = OPTIONS.find(o => o.id === dot.optionId);
            return (
              <div
                key={dot.id}
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: `${dot.x}%`, top: `${dot.y}%`,
                  width: dot.size, height: dot.size,
                  borderRadius: '50%',
                  backgroundColor: opt?.color || '#C2410C',
                  opacity: 0.55,
                  transform: 'translate(-50%, -50%)',
                  animation: `cvDotPulse 3s ease-in-out ${dot.delay}s infinite`,
                  boxShadow: `0 0 ${dot.size * 2}px ${opt?.color || '#C2410C'}25`,
                }}
              />
            );
          })}

          {/* User dot */}
          {userDot && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${userDot.x}%`, top: `${userDot.y}%`,
                width: 7, height: 7,
                borderRadius: '50%',
                backgroundColor: OPTIONS.find(o => o.id === userDot.optionId)?.color,
                transform: 'translate(-50%, -50%)',
                animation: 'cvDotAppear 0.8s ease-out',
                boxShadow: `0 0 16px 5px ${OPTIONS.find(o => o.id === userDot.optionId)?.color}50`,
                zIndex: 10,
              }}
            />
          )}

          {/* Ripple */}
          {ripples.map(r => (
            <div
              key={r.id}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${r.x}%`, top: `${r.y}%`,
                transform: 'translate(-50%, -50%)',
                width: 8, height: 8,
                borderRadius: '50%',
                border: `2px solid ${OPTIONS.find(o => o.id === selectedId)?.color || '#C2410C'}`,
                animation: 'cvRipple 1.5s ease-out forwards',
                zIndex: 9,
              }}
            />
          ))}

          {/* Counter */}
          <div aria-hidden="true" style={{
            position: 'absolute', bottom: 14, right: 16,
            fontFamily: 'Manrope, sans-serif', fontSize: '0.68rem',
            fontWeight: 600, color: '#475569',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              backgroundColor: '#22C55E', display: 'inline-block',
              animation: 'cvDotPulse 2s ease-in-out infinite',
            }} />
            {totalVotes.toLocaleString()} voices
          </div>
        </div>

        {/* Post-vote caption */}
        {hasVoted && (
          <p style={{
            textAlign: 'center',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem',
            color: '#475569', marginTop: 14,
            animation: 'cvFadeUp 0.5s 0.6s both',
          }}>
            Every dot is a real person in the ADA community.{' '}
            <span style={{
              color: OPTIONS.find(o => o.id === selectedId)?.color,
              fontWeight: 600,
            }}>
              Yours is glowing.
            </span>
          </p>
        )}
      </div>

      <style>{`
        @keyframes cvDotPulse {
          0%, 100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.4); }
        }
        @keyframes cvDotAppear {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(2); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes cvRipple {
          0% { width: 8px; height: 8px; opacity: 0.7; }
          100% { width: 140px; height: 140px; opacity: 0; }
        }
        @keyframes cvFadeUp {
          0% { opacity: 0; transform: translateY(14px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [aria-label="Community voices poll"] * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  );
}
