/**
 * Who to contact — the contacts we hold, or the government route.
 *
 * Every contact renders with its scope note directly beneath it, never
 * beside it and never optional. Contacts are bounded to places — the
 * Seattle curb-ramp line, the Harris County voters line — but the
 * directory shows every case to everyone regardless of where they are.
 * The database will not store a contact without a scope note, and this
 * renders the note next to the number, so the two halves of that rule
 * meet on the page.
 *
 * When there are no contacts, this shows the government route rather than
 * nothing. Twenty-six of the thirty-nine cases have nobody to call, so
 * "nothing" would be the common case, and the whole point is that a
 * person's search should not end here.
 *
 * Accessibility: a real heading and a list, so this is navigable by
 * structure. Contact kind is a word, never a colour. Links reach 44px
 * through padding. Nothing here collects input — Ada is still the only
 * front door.
 */

import type { CSSProperties } from 'react';
import {
  routeForCategory,
  COMPLAINT_IS_NOT_REPRESENTATION,
  STATE_PA_DIRECTORY,
} from '../../lib/governmentRoute.js';

export interface DisplayContact {
  id: string;
  contactKind: string;
  orgName: string;
  personName: string | null;
  phone: string | null;
  tty: string | null;
  email: string | null;
  url: string | null;
  address: string | null;
  scopeNote: string;
  intakeOpen: boolean;
}

const KIND_LABELS: Record<string, string> = {
  class_counsel: 'Lawyers on this case',
  settlement_administrator: 'Settlement administrator',
  government_agency: 'Government agency',
  state_pa: 'Disability rights agency',
  referral_firm: 'Law firm',
  defendant_process: 'Official complaint route',
};

const card: CSSProperties = {
  border: '1px solid var(--color-control-border)',
  borderRadius: 10,
  padding: '1rem 1.15rem',
  marginBottom: '0.85rem',
  background: 'var(--card-bg)',
};

const kindStyle: CSSProperties = {
  fontFamily: 'Manrope, sans-serif',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--body-secondary)',
  margin: '0 0 0.3rem',
};

const orgStyle: CSSProperties = {
  fontFamily: 'Manrope, sans-serif',
  fontSize: '1.02rem',
  fontWeight: 700,
  color: 'var(--heading)',
  margin: '0 0 0.15rem',
};

const scopeStyle: CSSProperties = {
  fontSize: '0.92rem',
  color: 'var(--body)',
  margin: '0.5rem 0 0',
  lineHeight: 1.55,
};

const lineStyle: CSSProperties = {
  fontSize: '0.94rem',
  color: 'var(--body)',
  margin: '0.35rem 0 0',
};

/** 44px minimum target without changing the visual line height. */
const linkStyle: CSSProperties = {
  display: 'inline-block',
  padding: '0.6rem 0',
  minHeight: 44,
  color: 'var(--link)',
  textDecoration: 'underline',
  textUnderlineOffset: 2,
};

function ContactCard({ contact }: { contact: DisplayContact }) {
  return (
    <li style={card}>
      <p style={kindStyle}>{KIND_LABELS[contact.contactKind] ?? 'Contact'}</p>
      <p style={orgStyle}>{contact.orgName}</p>
      {contact.personName && <p style={lineStyle}>{contact.personName}</p>}

      {contact.intakeOpen && (
        <p style={{ ...lineStyle, fontWeight: 600 }}>
          Taking enquiries about this case.
        </p>
      )}

      {contact.phone && (
        <p style={lineStyle}>
          Phone{' '}
          <a href={`tel:${contact.phone.replace(/[^\d+]/g, '')}`} style={linkStyle}>
            {contact.phone}
          </a>
        </p>
      )}
      {contact.tty && (
        <p style={lineStyle}>
          TTY{' '}
          <a href={`tel:${contact.tty.replace(/[^\d+]/g, '')}`} style={linkStyle}>
            {contact.tty}
          </a>
        </p>
      )}
      {contact.email && (
        <p style={lineStyle}>
          <a href={`mailto:${contact.email}`} style={linkStyle}>
            {contact.email}
          </a>
        </p>
      )}
      {contact.url && (
        <p style={lineStyle}>
          <a href={contact.url} style={linkStyle} rel="noopener noreferrer">
            {contact.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
          </a>
        </p>
      )}
      {contact.address && <p style={lineStyle}>{contact.address}</p>}

      {/* The guardrail. Always rendered, because a contact cannot be
          stored without one. */}
      <p style={scopeStyle}>{contact.scopeNote}</p>
    </li>
  );
}

function GovernmentRoute({ category }: { category: string | null | undefined }) {
  const route = routeForCategory(category);
  return (
    <li style={card}>
      <p style={kindStyle}>Government agency</p>
      <p style={orgStyle}>{route.agency}</p>
      <p style={scopeStyle}>{route.what}</p>

      {route.law && <p style={scopeStyle}>{route.law}</p>}

      {route.phone && (
        <p style={lineStyle}>
          Phone{' '}
          <a href={`tel:${route.phone.replace(/[^\d+]/g, '')}`} style={linkStyle}>
            {route.phone}
          </a>
        </p>
      )}
      {route.tty && (
        <p style={lineStyle}>
          TTY{' '}
          <a href={`tel:${route.tty.replace(/[^\d+]/g, '')}`} style={linkStyle}>
            {route.tty}
          </a>
        </p>
      )}
      <p style={lineStyle}>
        <a href={route.url} style={linkStyle} rel="noopener noreferrer">
          {route.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        </a>
      </p>

      {route.alsoTry && <p style={scopeStyle}>{route.alsoTry}</p>}

      {route.urgentNote && (
        <p style={{ ...scopeStyle, fontWeight: 600 }} role="note">
          {route.urgentNote}
        </p>
      )}

      <p style={scopeStyle}>{COMPLAINT_IS_NOT_REPRESENTATION}</p>

      <p style={scopeStyle}>
        {STATE_PA_DIRECTORY.what}{' '}
        <a href={STATE_PA_DIRECTORY.url} style={linkStyle} rel="noopener noreferrer">
          Find yours
        </a>
      </p>
    </li>
  );
}

export default function ContactBlock({
  contacts,
  category,
  headingId = 'contact-heading',
}: {
  contacts?: readonly DisplayContact[];
  category?: string | null;
  headingId?: string;
}) {
  const list = contacts ?? [];
  const hasContacts = list.length > 0;

  return (
    <section aria-labelledby={headingId} style={{ marginTop: '2rem' }}>
      <h2
        id={headingId}
        style={{
          fontFamily: 'Manrope, sans-serif',
          fontSize: '1.15rem',
          fontWeight: 700,
          color: 'var(--heading)',
          margin: '0 0 0.4rem',
        }}
      >
        Who to contact
      </h2>

      <p style={{ ...scopeStyle, margin: '0 0 1rem' }}>
        {hasContacts
          ? 'Check who each contact can help before you call — most of them cover one place or one group of people.'
          : 'Nobody is running an intake for this one. You can still report what happened.'}
      </p>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {hasContacts
          ? list.map((c) => <ContactCard key={c.id} contact={c} />)
          : <GovernmentRoute category={category} />}
      </ul>
    </section>
  );
}
