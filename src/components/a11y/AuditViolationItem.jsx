import React, { useState } from 'react';

export default function AuditViolationItem({ violation, index, config, onHighlight }) {
  const [expanded, setExpanded] = useState(false);
  const v = violation;

  return (
    <div style={{
      marginBottom: '0.5rem', border: `1px solid ${config?.color || '#ccc'}20`,
      borderLeft: `3px solid ${config?.color || '#ccc'}`,
      borderRadius: '6px', backgroundColor: '#FAFAFA'
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', textAlign: 'left', background: 'none', border: 'none',
          cursor: 'pointer', padding: '0.625rem 0.75rem', display: 'flex',
          alignItems: 'flex-start', gap: '0.5rem'
        }}
      >
        <span style={{
          flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%',
          backgroundColor: config?.bg || '#eee', color: config?.color || '#333',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.625rem', fontWeight: 700, marginTop: '1px'
        }}>
          {index + 1}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: 'inline-block', padding: '0.1rem 0.375rem', borderRadius: '3px',
            fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase',
            backgroundColor: config?.bg || '#eee', color: config?.color || '#333',
            marginBottom: '0.2rem'
          }}>
            {v.impact}
          </span>
          <p style={{
            margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: '#1E293B',
            lineHeight: 1.3
          }}>
            {v.help}
          </p>
          <p style={{
            margin: '0.15rem 0 0', fontSize: '0.6875rem', color: '#475569',
            fontFamily: 'monospace'
          }}>
            {v.id}
          </p>
        </div>
        <span style={{ color: '#434E5E', fontSize: '0.75rem', flexShrink: 0 }}>
          {expanded ? '▼' : '▶'} {v.nodes.length}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: '0 0.75rem 0.75rem 2.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: '#475569', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
            {v.description}
          </p>
          {v.helpUrl && (
            <a href={v.helpUrl} target="_blank" rel="noopener noreferrer" style={{
              fontSize: '0.6875rem', color: '#1E3A8A', marginBottom: '0.5rem', display: 'inline-block'
            }}>
              Learn more →
            </a>
          )}

          {v.nodes.map((node, ni) => (
            <div key={ni} style={{
              marginTop: '0.5rem', padding: '0.5rem',
              backgroundColor: 'white', borderRadius: '4px',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <code style={{
                  fontSize: '0.6875rem', color: '#7C3AED', backgroundColor: '#F5F3FF',
                  padding: '0.15rem 0.375rem', borderRadius: '3px', wordBreak: 'break-all',
                  flex: 1
                }}>
                  {node.target.join(', ')}
                </code>
                <button
                  onClick={() => onHighlight(node.target[0])}
                  style={{
                    flexShrink: 0, background: '#DC2626', color: 'white',
                    border: 'none', borderRadius: '3px', padding: '0.15rem 0.375rem',
                    fontSize: '0.625rem', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Show
                </button>
              </div>
              {node.failureSummary && (
                <p style={{
                  margin: '0.375rem 0 0', fontSize: '0.6875rem', color: '#475569',
                  lineHeight: 1.4, whiteSpace: 'pre-wrap'
                }}>
                  <strong style={{ color: '#1E293B' }}>Fix:</strong> {node.failureSummary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}