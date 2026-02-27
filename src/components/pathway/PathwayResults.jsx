import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import AutoCiteLinks from '../guide/AutoCiteLinks';
import { ArrowRight, ExternalLink, RotateCcw } from 'lucide-react';

const urgencyColors = {
  green: { border: '#16A34A', bg: '#F0FDF4', text: '#14532D', label: 'You have time' },
  yellow: { border: '#D97706', bg: '#FFFBEB', text: '#7C2D12', label: 'Act soon' },
  red: { border: '#DC2626', bg: '#FEF2F2', text: '#991B1B', label: 'Urgent' }
};

function Card({ title, children }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--slate-200)', borderRadius: '16px',
      padding: '28px 32px', marginBottom: '16px'
    }}>
      <h2 style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 700,
        color: 'var(--slate-900)', margin: '0 0 16px'
      }}>{title}</h2>
      {children}
    </div>
  );
}

export default function PathwayResults({ results, answers, onStartOver }) {
  const urgency = urgencyColors[results.deadline.urgency] || urgencyColors.yellow;
  const intakeParams = new URLSearchParams({ source: 'pathway', type: answers.category || '', location: answers.location || '', timing: answers.timing || '', barrier: answers.barrier || '' }).toString();

  return (
    <div>
      {/* Header */}
      <div style={{
        background: '#1A1F2B', borderRadius: '16px', padding: '32px',
        marginBottom: '16px', position: 'relative', overflow: 'hidden'
      }}>
        <div aria-hidden="true" style={{
          position: 'absolute', top: '-30%', right: '-10%', width: '300px', height: '300px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(194,65,12,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{ position: 'relative' }}>
          <span style={{
            display: 'inline-block', background: '#C2410C', color: 'white',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: '100px', marginBottom: '12px'
          }}>
            Your Personalized Rights Summary
          </span>
          <h1 style={{
            fontFamily: 'Fraunces, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 700, color: 'white', margin: '0 0 12px', lineHeight: 1.2
          }}>
            {results.title}
          </h1>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
            color: '#CBD5E1', lineHeight: 1.7, margin: 0, maxWidth: '640px'
          }}>
            {results.summary}
          </p>
        </div>
      </div>

      {/* Law Applies */}
      <Card title="What Law Applies">
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem', color: 'var(--slate-700)', lineHeight: 1.75, margin: 0 }}>
          <AutoCiteLinks>{results.lawApplies}</AutoCiteLinks>
        </p>
      </Card>

      {/* Relevant Standards */}
      <Card title="Relevant Standards">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {results.sections.map((s, i) => (
            <div key={i} style={{
              background: 'var(--slate-50)', border: '1px solid var(--slate-200)',
              borderRadius: '10px', padding: '14px 18px'
            }}>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
                color: '#9A3412', margin: '0 0 4px', letterSpacing: '0.02em'
              }}>
                <AutoCiteLinks>{s.section}</AutoCiteLinks>
              </p>
              <p style={{
                fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 600,
                color: 'var(--slate-900)', margin: '0 0 4px'
              }}>{s.title}</p>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem',
                color: 'var(--slate-600)', lineHeight: 1.6, margin: 0
              }}>
                <AutoCiteLinks>{s.description}</AutoCiteLinks>
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Deadline */}
      <div style={{
        background: urgency.bg, border: `1px solid ${urgency.border}20`,
        borderLeft: `4px solid ${urgency.border}`,
        borderRadius: '0 16px 16px 0', padding: '24px 28px', marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <h2 style={{
            fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 700,
            color: urgency.text, margin: 0
          }}>Your Deadline</h2>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
            color: urgency.border, background: `${urgency.border}18`,
            padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>{urgency.label}</span>
        </div>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
          color: urgency.text, lineHeight: 1.7, margin: 0
        }}>
          {results.deadline.text}
        </p>
      </div>

      {/* Remedies */}
      <Card title="What You Can Recover">
        <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
          {results.remedies.map((r, i) => (
            <li key={i} style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
              color: 'var(--slate-700)', lineHeight: 1.7, marginBottom: '6px'
            }}>{r}</li>
          ))}
        </ul>
      </Card>

      {/* Best Next Step */}
      <div style={{
        background: 'var(--terra-100)', border: '1px solid #C2410C20',
        borderRadius: '16px', padding: '28px 32px', marginBottom: '16px'
      }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.2rem', fontWeight: 700,
          color: '#9A3412', margin: '0 0 8px'
        }}>
          Recommended: {results.bestNextStep.action}
        </h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
          color: 'var(--slate-700)', lineHeight: 1.7, margin: 0
        }}>
          {results.bestNextStep.description}
        </p>
      </div>

      {/* Filing Paths */}
      <Card title="Where to File">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {results.filingPaths.map((fp, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              gap: '12px', background: 'var(--slate-50)', border: '1px solid var(--slate-200)',
              borderRadius: '10px', padding: '14px 18px'
            }}>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 700,
                  color: 'var(--slate-900)', margin: '0 0 4px'
                }}>{fp.agency}</p>
                <p style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
                  color: 'var(--slate-600)', lineHeight: 1.5, margin: 0
                }}>{fp.description}</p>
              </div>
              {fp.url ? (
                <a href={fp.url} target="_blank" rel="noopener noreferrer"
                  aria-label={`${fp.agency} (opens in new tab)`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 600,
                    color: '#C2410C', textDecoration: 'none', flexShrink: 0, marginTop: '2px',
                    minHeight: '44px', padding: '0 8px'
                  }}>
                  Visit <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : fp.agency.toLowerCase().includes('attorney') ? (
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
                  color: '#64748B', fontStyle: 'italic'
                }}>
                  Coming soon
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      {/* Guide Links */}
      <Card title="Learn More">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
          {results.guideLinks.map((gl, i) => (
            <Link key={i} to={createPageUrl(gl.page)} style={{
              display: 'block', background: 'var(--slate-50)', border: '1px solid var(--slate-200)',
              borderRadius: '10px', padding: '14px 16px', textDecoration: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s', outline: 'none'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C2410C'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.boxShadow = 'none'; }}
            onFocus={e => { e.currentTarget.style.borderColor = '#C2410C'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(194,65,12,0.4)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--slate-200)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 700,
                color: '#9A3412', margin: '0 0 4px'
              }}>{gl.title}</p>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
                color: 'var(--slate-600)', lineHeight: 1.5, margin: 0
              }}>{gl.description}</p>
            </Link>
          ))}
        </div>
      </Card>

      {/* CTA */}
      <div style={{
        background: '#1A1F2B', borderRadius: '16px', padding: 'clamp(24px, 4vw, 40px) clamp(20px, 4vw, 32px)',
        textAlign: 'center', marginBottom: '16px'
      }}>
        <h2 style={{
          fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: 700,
          color: 'white', margin: '0 0 8px'
        }}>Ready to take action?</h2>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
          color: '#94A3B8', margin: '0 0 24px'
        }}>
          Explore the ADA standards that apply to your situation, or review your rights assessment results above.
        </p>
        <Link to={createPageUrl('StandardsGuide')} style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: '#C2410C', color: 'white',
          fontFamily: 'Manrope, sans-serif', fontSize: '1rem', fontWeight: 700,
          padding: '16px 32px', borderRadius: '10px', textDecoration: 'none',
          minHeight: '44px', transition: 'background 0.15s'
        }}>
          Explore the ADA Standards Guide →
        </Link>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem',
          color: '#64748B', marginTop: '16px', marginBottom: 0, fontStyle: 'italic'
        }}>
          Attorney-connected violation reporting — launching soon.
        </p>
      </div>

      {/* Start Over */}
      <div style={{ textAlign: 'center', paddingBottom: '32px' }}>
        <button onClick={onStartOver} style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'transparent', border: '1px solid var(--slate-200)',
          borderRadius: '10px', padding: '12px 24px', cursor: 'pointer',
          fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', fontWeight: 600,
          color: 'var(--slate-600)', minHeight: '44px', transition: 'border-color 0.15s'
        }}>
          <RotateCcw size={16} aria-hidden="true" /> Start Over
        </button>
      </div>
    </div>
  );
}