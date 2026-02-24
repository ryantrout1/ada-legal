import React from 'react';
import { createPageUrl } from '../../utils';
import { ChevronRight } from 'lucide-react';

const TRIAGE_CARDS = [
  {
    id: 'title_iii',
    icon: '🏪',
    iconBg: '#FFF7ED',
    badge: { text: 'Attorney matching available', bg: '#ECFDF5', color: '#047857', border: '#D1FAE5', dot: '#16A34A' },
    heading: 'A business, restaurant, store, hotel, or website denied me access or wasn\'t accessible',
    description: 'This covers private businesses open to the public — physical locations and their websites or apps.',
    examples: 'Examples: no wheelchair ramp at a restaurant, website doesn\'t work with a screen reader, hotel won\'t accommodate service animal, store aisles too narrow for mobility device',
    action: 'intake'
  },
  {
    id: 'title_ii',
    icon: '🏛️',
    iconBg: '#EFF6FF',
    badge: { text: "We'll guide you to the right place", bg: '#EFF6FF', color: '#1D4ED8', border: '#DBEAFE' },
    heading: 'A government office, public transit, school, or public service was inaccessible',
    description: 'This covers state and local government services — courthouses, DMVs, public schools, transit systems, parks, and voting locations.',
    examples: 'Examples: courthouse with no elevator, public bus without a working lift, inaccessible polling station, public school without accommodations',
    action: 'title_ii'
  },
  {
    id: 'title_i',
    icon: '💼',
    iconBg: '#FFFBEB',
    badge: { text: "We'll guide you to the right place", bg: '#FFFBEB', color: '#B45309', border: '#FEF3C7' },
    heading: 'My employer didn\'t accommodate my disability or discriminated against me at work',
    description: 'This covers workplace discrimination — hiring, firing, promotions, reasonable accommodations, and harassment related to disability.',
    examples: 'Examples: denied a standing desk for a back injury, fired after disclosing a disability, employer refused to modify schedule for medical appointments',
    action: 'title_i'
  }
];

export default function TitleTriageStep({ onSelectTitleIII }) {
  const handleSelect = (card) => {
    if (card.action === 'intake') {
      onSelectTitleIII();
    } else if (card.action === 'title_ii') {
      window.location.href = createPageUrl('TitleIIPathway');
    } else if (card.action === 'title_i') {
      window.location.href = createPageUrl('TitleIPathway');
    }
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '1.02rem', color: '#475569',
          maxWidth: '560px', margin: '0 auto', lineHeight: 1.6
        }}>
          Your answer helps us connect you with the right resources. Select the option that best describes your situation.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '780px', margin: '0 auto' }}>
        {TRIAGE_CARDS.map(card => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleSelect(card)}
            style={{
              background: 'white', border: '2px solid #E2E8F0', borderRadius: '16px',
              padding: '24px', display: 'flex', alignItems: 'flex-start', gap: '20px',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
              outline: 'none'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#FB923C'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            onFocus={e => { e.currentTarget.style.borderColor = '#FB923C'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.2)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '14px', background: card.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', flexShrink: 0
            }}>
              <span aria-hidden="true">{card.icon}</span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.72rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.03em',
                background: card.badge.bg, color: card.badge.color,
                border: `1px solid ${card.badge.border}`,
                padding: '3px 10px', borderRadius: '100px', marginBottom: '10px'
              }}>
                {card.badge.dot && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: card.badge.dot }} aria-hidden="true" />}
                {card.badge.text}
              </span>

              <h2 style={{
                fontFamily: 'Fraunces, serif', fontSize: '1.1rem', fontWeight: 700,
                color: 'var(--slate-900)', margin: '0 0 8px', lineHeight: 1.35
              }}>
                {card.heading}
              </h2>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.92rem', color: '#475569',
                margin: '0 0 8px', lineHeight: 1.55
              }}>
                {card.description}
              </p>
              <p style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: '#94A3B8',
                margin: 0, lineHeight: 1.5, fontStyle: 'italic'
              }}>
                {card.examples}
              </p>
            </div>

            <div style={{ flexShrink: 0, alignSelf: 'center', transition: 'transform 0.2s, color 0.2s' }} className={`triage-chevron-${card.id}`}>
              <ChevronRight size={24} style={{ color: '#CBD5E1' }} aria-hidden="true" />
            </div>
          </button>
        ))}
      </div>
      <p style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: '#94A3B8',
        fontStyle: 'italic', lineHeight: 1.55, textAlign: 'center',
        maxWidth: '780px', margin: '20px auto 0'
      }}>
        The ADA also includes Title IV (telecommunications relay services, handled by the FCC) and Title V (anti-retaliation protections and other provisions). These apply in specific circumstances — the three options above cover the vast majority of individual ADA claims.
      </p>
    </div>
  );
}