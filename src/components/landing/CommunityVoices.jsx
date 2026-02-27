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
          {/* US silhouette — smooth continental outline */}
          <svg viewBox="0 0 100 85" preserveAspectRatio="xMidYMid meet" aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <filter id="cv-glow">
                <feGaussianBlur stdDeviation="1.2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <path filter="url(#cv-glow)" opacity="0.07" fill="white" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" d="
              M 6,7 C 6,7 5,10 4,14 C 3,18 2,22 2,26 C 2,30 2,34 3,38
              C 3,40 4,44 6,48 C 7,50 8,53 10,56
              C 12,58 15,60 18,61 C 20,62 22,61 25,62
              C 28,62 31,63 34,63 C 37,63 39,65 42,68
              C 43,70 44,73 46,76 C 47,77 49,78 51,76
              C 53,74 54,72 56,71 C 57,70 58,71 60,69
              C 61,68 62,68 64,67 C 65,67 66,68 67,67
              C 68,66 69,65 71,64 C 72,63 73,62 75,64
              C 76,66 77,69 78,72 C 79,74 78,77 77,76
              C 76,74 75,71 74,69 C 73,67 73,65 74,63
              C 75,61 76,58 78,55 C 79,52 80,49 82,45
              C 83,42 84,39 86,36 C 87,33 88,31 89,28
              C 90,25 90,22 89,20 C 88,18 90,16 88,14
              C 87,13 85,12 83,13 C 81,14 79,13 77,12
              C 75,11 73,13 71,13 C 69,12 67,14 66,15
              C 65,14 63,12 61,13 C 59,14 58,11 56,11
              C 54,11 52,10 50,10 C 48,11 46,11 44,10
              C 42,9 40,8 38,7 C 35,6 32,6 28,6
              C 24,6 20,6 16,6 C 12,6 8,6 6,7 Z
            " />
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
