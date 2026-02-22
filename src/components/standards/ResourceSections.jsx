import React from 'react';
import { Shield, Home, Monitor, Users, FileText } from 'lucide-react';
import ResourceSection from './ResourceSection';
import ChapterNavigator from './ChapterNavigator';

const SECTIONS = [
  {
    id: 'rights',
    icon: Shield,
    iconBg: '#D4570A',
    title: 'Know Your Rights',
    count: 8,
    cards: [
      {
        title: 'Introduction to the ADA',
        type: 'Overview', dotColor: '#D4570A',
        href: '/GuideIntroToAda',
        description: "What the ADA covers, who it protects, and how it's structured across five titles. Start here if you're new to disability rights law.",
        meta: [{ text: '5 min read' }, { text: 'Plain language' }]
      },
      {
        title: 'How to File an ADA Complaint',
        type: 'Guide', dotColor: '#D4570A',
        href: '/GuideFilingComplaint',
        description: 'Step-by-step instructions for reporting disability rights violations to the Department of Justice, including what to expect after filing.',
        meta: [{ text: '8 min read' }, { text: 'Actionable steps' }]
      },
      {
        title: 'Service Animals & the ADA',
        type: 'Reference', dotColor: '#D4570A',
        href: '/GuideServiceAnimals',
        description: "What qualifies as a service animal, where they're allowed, what businesses can and cannot ask, and your rights if denied access.",
        tags: ['Title II', 'Title III', 'FAQ included']
      },
      {
        title: 'Effective Communication',
        type: 'Guide', dotColor: '#D4570A',
        href: '/GuideEffectiveCommunication',
        description: 'How the ADA requires businesses and governments to communicate effectively with people who have vision, hearing, or speech disabilities.',
        tags: ['Title II', 'Title III', 'Auxiliary Aids']
      },
      {
        title: 'Reasonable Modifications',
        type: 'Guide', dotColor: '#D4570A',
        href: '/GuideReasonableModifications',
        description: 'When and how businesses and government entities must modify their policies, practices, and procedures for people with disabilities.',
        tags: ['Title II', 'Title III', '§35.130']
      },
      {
        title: 'Wheelchairs & Mobility Devices',
        type: 'Reference', dotColor: '#D4570A',
        href: '/GuideMobilityDevices',
        description: 'Your right to use wheelchairs, scooters, and other power-driven mobility devices in public spaces under the ADA.',
        tags: ['OPDMDs', '§35.137']
      },
      {
        title: 'Who the ADA Protects',
        type: 'Overview', dotColor: '#D4570A',
        href: '/GuideAdaProtections',
        description: "Understanding the ADA's definition of disability, who qualifies for protection, and what 'regarded as' means.",
        tags: ['ADAAA 2008', '§12102']
      }
    ]
  },
  {
    id: 'business',
    icon: Home,
    iconBg: '#9A3412',
    title: 'Business Compliance',
    count: 12,
    cards: [
      {
        title: 'Small Business ADA Primer',
        type: 'Primer', dotColor: '#9A3412',
        href: '/GuideSmallBusiness',
        description: 'A plain-language walkthrough of what the ADA requires from small businesses — barrier removal, reasonable modifications, and effective communication.',
        meta: [{ text: '12 min read' }, { text: 'Most popular' }]
      },
      {
        title: 'Accessible Parking Requirements',
        type: 'Checklist', dotColor: '#9A3412',
        href: '/GuideParking',
        description: "How many accessible spaces you need, van-accessible requirements, signage, dimensions, and where to locate them. Includes the scoping table from §208.",
        tags: ['§208', '§502', 'Scoping table']
      },
      {
        title: "Barrier Removal: What's Readily Achievable?",
        type: 'Legal Standard', dotColor: '#9A3412',
        href: '/GuideBarrierRemoval',
        description: 'Understanding the legal standard for removing architectural barriers in existing facilities, with practical examples and cost considerations.',
        tags: ['Title III', '§36.304']
      }
    ]
  },
  {
    id: 'design-standards',
    icon: FileText,
    iconBg: '#2D6A4F',
    title: 'Design Standards',
    count: 10,
    hasChapterNav: true,
    cards: []
  },
  {
    id: 'web-access',
    icon: Monitor,
    iconBg: '#5B2C6F',
    title: 'Web & Digital Accessibility',
    count: 6,
    cards: [
      {
        title: 'Title II Web & Mobile App Accessibility Rule',
        type: 'New Rule', dotColor: '#5B2C6F',
        href: '#guide/title-ii-web-rule',
        description: 'The April 2024 rule requiring state and local governments to meet WCAG 2.1 Level AA — deadlines, exceptions, and what to do now.',
        meta: [{ text: 'Deadlines active', warning: true }]
      },
      {
        title: 'WCAG 2.1 Level AA — What It Requires',
        type: 'Standard', dotColor: '#5B2C6F',
        href: '#guide/wcag-21',
        description: 'A practical breakdown of the Web Content Accessibility Guidelines — perceivable, operable, understandable, and robust.',
        tags: ['WCAG 2.1', 'Level AA', 'Checklist']
      },
      {
        title: 'First Steps Toward Web Compliance',
        type: 'Action Plan', dotColor: '#5B2C6F',
        href: '#guide/web-first-steps',
        description: 'Practical guidance for getting started — audit your site, prioritize fixes, work with vendors, and build accessibility into contracts.',
        tags: ['Title II', 'Vendor contracts']
      }
    ]
  },
  {
    id: 'government',
    icon: Users,
    iconBg: '#8B1A1A',
    title: 'Government (Title II)',
    count: 7,
    cards: [
      {
        title: 'Title II: State & Local Government Obligations',
        type: 'Overview', dotColor: '#8B1A1A',
        href: '#guide/title-ii-overview',
        description: 'What Title II requires — program access, effective communication, reasonable modifications, and the integration mandate.',
        meta: [{ text: '10 min read' }]
      },
      {
        title: 'Voting & Election Accessibility',
        type: 'Specialized', dotColor: '#8B1A1A',
        href: '#guide/voting-accessibility',
        description: 'ADA requirements for polling places, ballot accessibility, and ensuring full and equal opportunity to vote for people with disabilities.',
        tags: ['Title II', 'Elections']
      }
    ]
  }
];

export default function ResourceSections() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {SECTIONS.map(section => (
        <React.Fragment key={section.id}>
          {section.hasChapterNav ? (
            <section id={section.id} aria-labelledby={`${section.id}-heading`} style={{ scrollMarginTop: '96px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingBottom: '16px', borderBottom: '2px solid var(--slate-200)',
                marginBottom: '20px', flexWrap: 'wrap', gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '10px',
                    background: section.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <section.icon size={22} style={{ color: 'white' }} aria-hidden="true" />
                  </div>
                  <h2 id={`${section.id}-heading`} style={{
                    fontFamily: 'Fraunces, serif', fontSize: '1.375rem', fontWeight: 700,
                    color: 'var(--slate-900)', margin: 0
                  }}>
                    {section.title}
                  </h2>
                </div>
                <span style={{
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.8125rem',
                  color: 'var(--slate-500)'
                }}>
                  {section.count} chapters
                </span>
              </div>
              <ChapterNavigator />
            </section>
          ) : (
            <ResourceSection
              id={section.id}
              icon={section.icon}
              iconBg={section.iconBg}
              title={section.title}
              count={section.count}
              cards={section.cards}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}