import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

const CARDS = [
  {
    title: 'Title III',
    subtitle: 'Private Businesses & Public Accommodations',
    accentColor: '#C45D3E',
    iconBg: '#FFF7ED',
    icon: '🏪',
    badge: { text: 'We handle this', bg: '#ECFDF5', color: '#047857', border: '#D1FAE5' },
    body: 'Covers any private business open to the public — their physical spaces, websites, and apps. If a store, restaurant, hotel, doctor\'s office, or website wasn\'t accessible, this is your Title.',
    tags: ['Restaurants', 'Hotels', 'Retail stores', 'Websites', 'Doctor\'s offices', 'Theaters'],
    tagsLabel: 'Examples covered by Title III',
    filingIcon: '⚖️',
    filingIconBg: '#FFF7ED',
    filingText: <><strong style={{ color: 'var(--slate-700)' }}>File through us</strong> — we connect you with a vetted ADA attorney at no cost to you</>,
    subtitleColor: '#C2410C'
  },
  {
    title: 'Title II',
    subtitle: 'State & Local Government Services',
    accentColor: '#2563EB',
    iconBg: '#EFF6FF',
    icon: '🏛️',
    badge: { text: "We'll guide you", bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
    body: 'Covers all services, programs, and facilities of state and local governments — courthouses, public transit, DMVs, public schools, parks, and voting locations.',
    tags: ['Courthouses', 'Public transit', 'DMVs', 'Public schools', 'Parks', 'Voting locations'],
    tagsLabel: 'Examples covered by Title II',
    filingIcon: '📋',
    filingIconBg: '#EFF6FF',
    filingText: <><strong style={{ color: 'var(--slate-700)' }}>File with the DOJ</strong> — we'll walk you through the complaint process step by step</>,
    subtitleColor: '#2563EB'
  },
  {
    title: 'Title I',
    subtitle: 'Employment Discrimination',
    accentColor: '#D97706',
    iconBg: '#FFFBEB',
    icon: '💼',
    badge: { text: "We'll guide you", bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
    body: 'Covers hiring, firing, promotions, and reasonable accommodations at work. Applies to employers with 15 or more employees. Has a strict 180-day filing deadline.',
    tags: ['Hiring bias', 'Denied accommodations', 'Wrongful termination', 'Harassment', 'Promotion denial'],
    tagsLabel: 'Examples covered by Title I',
    filingIcon: '⏰',
    filingIconBg: '#FFFBEB',
    filingText: <><strong style={{ color: 'var(--slate-700)' }}>File with the EEOC</strong> — we'll explain the process and critical deadlines</>,
    subtitleColor: '#D97706'
  }
];

function RightsCard({ card }) {
  return (
    <div
      tabIndex={0}
      style={{
        background: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        padding: 0,
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.2s',
        cursor: 'default'
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ height: '4px', background: card.accentColor, borderRadius: '16px 16px 0 0' }} />
      <div style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px', background: card.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0
          }}>
            <span aria-hidden="true">{card.icon}</span>
          </div>
          <span style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.68rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            background: card.badge.bg, color: card.badge.color, border: `1px solid ${card.badge.border}`,
            padding: '3px 10px', borderRadius: '100px'
          }}>
            {card.badge.text}
          </span>
        </div>

        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)', margin: '0 0 4px' }}>
          {card.title}
        </h3>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', fontWeight: 600, color: card.subtitleColor, margin: '0 0 12px' }}>
          {card.subtitle}
        </p>
        <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#475569', lineHeight: 1.65, margin: '0 0 16px' }}>
          {card.body}
        </p>

        <div role="list" aria-label={card.tagsLabel} style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
          {card.tags.map(tag => (
            <span key={tag} role="listitem" style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 500,
              padding: '4px 10px', borderRadius: '100px', background: 'white',
              border: '1px solid #E2E8F0', color: '#475569'
            }}>
              {tag}
            </span>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', background: card.filingIconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0
          }}>
            <span aria-hidden="true">{card.filingIcon}</span>
          </div>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
            {card.filingText}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function KnowYourRightsSection() {
  return (
    <section
      aria-labelledby="kyr-heading"
      style={{
        background: '#FFFFFF',
        borderTop: '1px solid #F1F5F9',
        borderBottom: '1px solid #F1F5F9',
        padding: '80px 24px'
      }}
    >
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C45D3E',
            margin: '0 0 12px'
          }}>
            Know Your Rights
          </p>
          <h2 id="kyr-heading" style={{
            fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 700,
            color: 'var(--slate-900)', margin: '0 0 16px'
          }}>
            The ADA protects you in three key areas
          </h2>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '1.05rem', color: '#475569',
            maxWidth: '620px', margin: '0 auto', lineHeight: 1.6
          }}>
            The Americans with Disabilities Act is organized into Titles, each covering a different type of discrimination. Understanding which Title applies to your situation determines where you file and what happens next.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '24px'
        }} className="kyr-cards-grid">
          {CARDS.map(card => <RightsCard key={card.title} card={card} />)}
        </div>

        <div style={{ textAlign: 'center', maxWidth: '700px', margin: '40px auto 0' }}>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.92rem', color: '#94A3B8',
            lineHeight: 1.65, marginBottom: '24px'
          }}>
            Not sure which one applies? That's completely normal — many situations overlap. Our intake form asks simple questions to determine the right path for you. No legal knowledge required.
          </p>
          <Link
            to={createPageUrl('Intake')}
            style={{
              display: 'inline-block', fontFamily: 'Manrope, sans-serif', fontSize: '1rem',
              fontWeight: 600, color: 'white', background: '#C45D3E', padding: '14px 28px',
              borderRadius: '10px', textDecoration: 'none', transition: 'background 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#A3401C'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(194,65,12,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#C45D3E'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            Report a Violation →
          </Link>
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.82rem', color: '#94A3B8',
            fontStyle: 'italic', lineHeight: 1.55, textAlign: 'center',
            maxWidth: '700px', margin: '24px auto 0'
          }}>
            The ADA also includes Title IV (telecommunications relay services, handled by the FCC) and Title V (anti-retaliation protections and other provisions). These apply in specific circumstances — Titles I, II, and III cover the vast majority of individual ADA claims.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .kyr-cards-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}