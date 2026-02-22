import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideCriminalJustice() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Criminal Justice & the ADA"
        typeBadge="Guide"
        badgeColor="#8B1A1A"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="overview"
            title="The ADA Applies Throughout the Justice System"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.130(a)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "No qualified individual with a disability shall, on the
                  basis of disability, be excluded from participation in or
                  be denied the benefits of the services, programs, or
                  activities of a public entity."
                </p>
                <p style={{ margin: 0 }}>
                  Law enforcement agencies, courts, jails, prisons, and
                  probation/parole offices are all "public entities" under
                  Title II and must comply with all ADA requirements.
                </p>
              </>
            }
          >
            <p>
              Every part of the criminal justice system — from a police
              encounter on the street to a courtroom hearing to a prison
              cell — is operated by state or local government. That means
              <strong> Title II of the ADA applies at every stage</strong>.
            </p>
            <p>
              People with disabilities are significantly overrepresented in
              the criminal justice system. Studies estimate that <strong>nearly
              40% of people in state prisons</strong> have at least one
              disability. The ADA requires that these individuals receive
              equal access to all programs, services, and activities.
            </p>
          </GuideSection>

          <GuideSection
            id="law-enforcement"
            title="Law Enforcement Encounters"
          >
            <p>
              Police officers interact with people with disabilities every
              day — people who are deaf, have mental health conditions, use
              wheelchairs, have intellectual disabilities, or are on the
              autism spectrum. The ADA requires officers to:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { duty: 'Recognize signs of disability', desc: 'A person who doesn\'t respond to verbal commands may be deaf, not defiant. Repetitive behaviors or difficulty making eye contact may indicate autism. Confusion may indicate an intellectual or cognitive disability, not intoxication.' },
                { duty: 'Communicate effectively', desc: 'Officers must find a way to communicate with people who are deaf (written notes, sign language interpreter, pointing to a visual communication card), blind (verbal descriptions), or who have speech disabilities (patience, communication devices).' },
                { duty: 'Modify standard procedures', desc: 'Ordering a person with a mobility disability to "get on the ground" may be impossible. Handcuffing a person behind the back may be medically dangerous for some. Officers must adapt standard procedures when a disability makes compliance impossible or dangerous.' },
                { duty: 'De-escalate appropriately', desc: 'A person in a mental health crisis needs a different approach than a person who is deliberately threatening. Many departments now use Crisis Intervention Teams (CIT) trained to respond to mental health situations.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--slate-900)' }}>{item.duty}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>

            <GuideLegalCallout citation="DOJ Guidance on Law Enforcement">
              <p style={{ margin: 0 }}>
                The DOJ has published guidance emphasizing that "law enforcement
                agencies must make reasonable modifications in their policies,
                practices, and procedures that are necessary to ensure
                accessibility for individuals with disabilities, unless making
                such modifications would fundamentally alter the program." This
                includes modifying standard operating procedures during
                arrests, investigations, and emergency responses.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="arrests"
            title="Arrests & Mobility Devices"
          >
            <p>
              Arresting a person who uses a wheelchair, prosthetic limb, cane,
              or other mobility device raises specific ADA issues:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Keep the device with the person:</strong> A wheelchair
                is not just equipment — it's the person's <strong>means of
                movement</strong>. Taking it away is like taking away someone's
                legs. The device should travel with the person to booking and
                detention.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Accessible transport:</strong> Standard patrol cars may
                not accommodate a wheelchair. Departments must have a plan for
                accessible transportation.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Modified restraint techniques:</strong> Standard
                handcuffing behind the back may be impossible or medically
                harmful for some people. Officers should use front-cuffing or
                other alternatives when appropriate.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Medications:</strong> If the person has critical
                medications (insulin, seizure medication, psychiatric
                medication), these must be kept with the person or administered
                promptly.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="courts"
            title="Court Accessibility"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.160 — Effective Communication</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "(a)(1) A public entity shall take appropriate steps to
                  ensure that communications with applicants, participants,
                  members of the public, and companions with disabilities are
                  as effective as communications with others."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.160(b)(1)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity shall furnish appropriate auxiliary aids and
                  services where necessary to afford individuals with
                  disabilities… an equal opportunity to participate in, and
                  enjoy the benefits of, a service, program, or activity of
                  a public entity."
                </p>
              </>
            }
          >
            <p>
              Courts must be <strong>fully accessible</strong> to people with
              disabilities — whether they are defendants, witnesses, jurors,
              attorneys, or spectators:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Sign language interpreters:</strong> Required for deaf
                defendants, witnesses, and jurors at all proceedings. The court
                pays — not the individual.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Assistive listening devices:</strong> For people who
                are hard of hearing. Many courtrooms have hearing loop systems.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Physical access:</strong> Courtrooms, jury boxes,
                witness stands, attorney tables, and public seating must be
                wheelchair accessible. If a historic courthouse is not fully
                accessible, the court must relocate proceedings.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Documents in accessible formats:</strong> Court filings,
                notices, and forms must be available in large print, Braille,
                or electronic formats when needed.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Jury service:</strong> People with disabilities cannot
                be automatically excluded from jury duty. Courts must provide
                accommodations (interpreters, accessible seating, materials in
                alternate formats) to enable jury participation.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="jails-prisons"
            title="Jails & Prisons"
          >
            <p>
              People with disabilities don't lose their ADA rights when
              incarcerated. Jails and prisons must provide:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { area: 'Accessible cells', desc: 'A sufficient number of cells must meet accessibility standards — wide enough for wheelchairs, with accessible fixtures, grab bars, and lower bunks. People with disabilities should not be housed in medical units solely because of a lack of accessible cells.' },
                { area: 'Medical care', desc: 'Adequate medical and mental health care for disabilities. This includes medications, therapy, durable medical equipment (wheelchairs, prosthetics, hearing aids), and specialist referrals.' },
                { area: 'Effective communication', desc: 'Deaf inmates need access to sign language interpreters for disciplinary hearings, medical appointments, educational programs, and communication with attorneys. Written notes are not sufficient for complex communications.' },
                { area: 'Programs & activities', desc: 'Work programs, educational classes, religious services, recreation, and visitation must all be accessible. A facility cannot simply exclude people with disabilities from programming.' },
                { area: 'Grievance procedures', desc: 'Inmates must be able to file grievances and ADA complaints in accessible formats. A blind inmate cannot be handed a printed form and told to "fill it out."' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--slate-900)' }}>{item.area}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="parole-probation"
            title="Parole & Probation"
          >
            <p>
              Parole and probation offices are government programs subject to
              Title II. <strong>Reasonable modifications</strong> must be
              provided:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Accessible offices:</strong> Probation offices must be
                in accessible buildings, or home visits must be offered as an
                alternative
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Communication access:</strong> Interpreters for deaf
                parolees at check-in meetings and hearings
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Modified conditions:</strong> Standard conditions may
                need to be modified — for example, a person with a cognitive
                disability may need simplified written instructions, or a
                person with a mobility disability may need transportation
                assistance to attend required meetings
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Drug testing:</strong> Procedures must accommodate
                people with physical disabilities who may have difficulty
                providing samples in standard ways
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="enforcement"
            title="DOJ Enforcement Actions"
          >
            <p>
              The DOJ has brought numerous enforcement actions in the criminal
              justice context:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                Settlements with <strong>county jail systems</strong> requiring
                accessible housing, communication access, and policy changes
              </li>
              <li style={{ marginBottom: '10px' }}>
                Actions against <strong>police departments</strong> for
                excessive force against people with mental health disabilities
              </li>
              <li style={{ marginBottom: '10px' }}>
                Settlements with <strong>state court systems</strong> for
                failing to provide sign language interpreters
              </li>
              <li style={{ marginBottom: '10px' }}>
                Investigations of <strong>state prison systems</strong> for
                systemic failures to accommodate inmates with disabilities
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA requirements
                in the criminal justice system. If you or someone you know has
                experienced disability discrimination in a law enforcement
                encounter, court proceeding, or correctional facility, connect
                with an experienced disability rights attorney for legal advice.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}