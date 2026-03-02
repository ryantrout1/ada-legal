import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Clock, AlertTriangle } from 'lucide-react';
import ShareCardButton from './ShareCardButton';

export default function ResourceCard({ card }) {
  const { title, type, dotColor, description, meta, tags, href } = card;
  const isInternal = href && href.startsWith('/');
  const pageName = isInternal ? href.slice(1) : null;

  return (
    <div className="sg-resource-card" style={{
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: '28px', position: 'relative',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)'
    }}>
      {/* Type label + share */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span aria-hidden="true" style={{
            width: '6px', height: '6px', borderRadius: '50%', background: dotColor
          }} />
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--section-label)'
          }}>
            {type}
          </span>
        </div>
        <ShareCardButton href={isInternal ? createPageUrl(pageName) : href} />
      </div>

      {/* Title as stretched link */}
      <h3 style={{
        fontFamily: 'Fraunces, serif', fontSize: '1.0625rem', fontWeight: 600,
        color: 'var(--heading)', margin: '0 0 8px', lineHeight: 1.3
      }}>
        {isInternal ? (
          <Link to={createPageUrl(pageName)} className="sg-card-link" style={{
            color: 'inherit', textDecoration: 'none'
          }}>
            {title}
          </Link>
        ) : (
          <a href={href} className="sg-card-link" style={{
            color: 'inherit', textDecoration: 'none'
          }}>
            {title}
          </a>
        )}
      </h3>

      {/* Description */}
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
        color: 'var(--body)', lineHeight: 1.6, margin: 0
      }}>
        {description}
      </p>

      {/* Meta row */}
      {meta && (
        <div style={{
          borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '12px',
          display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'
        }}>
          {meta.map((item, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: 'var(--body-secondary)'
            }}>
              {item.warning
                ? <AlertTriangle size={14} style={{ color: 'var(--section-label)' }} aria-hidden="true" />
                : <Clock size={14} aria-hidden="true" />
              }
              {item.text}
            </span>
          ))}
        </div>
      )}

      {/* Tags row */}
      {tags && tags.length > 0 && (
        <div style={{
          display: 'flex', gap: '6px', flexWrap: 'wrap',
          marginTop: meta ? '10px' : '16px'
        }}>
          {tags.map((tag, i) => (
            <span key={i} style={{
              background: 'var(--border-lighter)', padding: '3px 10px', borderRadius: '100px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600,
              color: 'var(--body)'
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
