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
                  "No qualified individual with a disability shall, on the basis
                  of disability, be excluded from participation in or be denied
                  the benefits of the services, programs, or activities of a
                  public entity, or be subjected to discrimination by any such
                  entity."
                </p>
                <p style={{ margin: 0 }}>
                  Law enforcement agencies, courts, jails, prisons, and
                  probation offices are all "public entities" under Title II
                  and must comply with this requirement.
                </p>
              </>
            }
          >
            <p>
              Every part of the criminal justice system is run by state or
              local government — which means <strong>Title II of the ADA
              applies at every stage</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>Police encounters and arrests</li>
              <li style={{ marginBottom: '8px' }}>Booking and detention</li>
              <li style={{ marginBottom: '8px' }}>Court appearances and trials</li>
              <li style={{ marginBottom: '8px' }}>Jail and prison incarceration</li>
              <li style={{ marginBottom: '8px' }}>Probation and parole supervision</li>
              <li style={{ marginBottom: '8px' }}>Diversion and reentry programs</li>
            </ul>
            <p>
              People with disabilities are <strong>significantly
              overrepresented</strong> in the criminal justice system.
              Estimates suggest that 40% or more of incarcerated people have
              at least one disability. The ADA requires that every part of the
              system be accessible and non-discriminatory.
            </p>
          </GuideSection>

          <GuideSection
            id="law-enforcement"
            title="Law Enforcement Encounters"
          >
            <p>
              Police interactions with people with disabilities can be
              dangerous when officers <strong>don't recognize or
              understand</strong> a disability. The ADA and DOJ guidance
              require:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { situation: 'Recognizing disability', guidance: 'Officers must be trained to recognize signs of disability — a person who is deaf may not respond to verbal commands, a person with autism may avoid eye contact, a person with an intellectual disability may not understand complex instructions.' },
                { situation: 'Effective communication', guidance: 'Officers must communicate effectively — this may mean using written notes for a deaf person, speaking slowly and clearly for someone with a cognitive disability, or calling a sign language interpreter for a formal interview.' },
                { situation: 'De-escalation', guidance: 'Behaviors caused by disability — like rocking, pacing, not making eye contact, or not following commands — should not be treated as threatening. Officers must use de-escalation techniques before force.' },
                { situation: 'Reasonable modifications', guidance: 'Standard procedures may need modification. A person with a mobility disability may not be able to get on the ground. A deaf person won\'t hear "stop" or "hands up." A person with autism may panic during a pat-down.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--slate-900)' }}>{item.situation}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7 }}>{item.guidance}</p>
                </div>
              ))}
            </div>

            <GuideLegalCallout citation="DOJ Guidance on Law Enforcement">
              <p style={{ margin: 0 }}>
                "Law enforcement agencies must modify their policies, practices,
                and procedures to ensure that individuals with disabilities are
                not subjected to discrimination. This includes making
                modifications during arrests, interrogations, and other law
                enforcement activities."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="arrests-mobility"
            title="Arrests & Mobility Devices"
          >
            <p>
              When arresting or detaining someone who uses a <strong>wheelchair,
              walker, prosthetic limb, or other mobility device</strong>,
              officers must:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Keep the person with their device:</strong> A wheelchair
                user must not be separated from their wheelchair. It is their
                means of mobility — taking it away is like taking away someone's
                ability to walk.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Transport accessibility:</strong> If the person needs a
                wheelchair-accessible vehicle for transport, one must be provided
                — even if it causes a delay.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Handcuffing modifications:</strong> Standard behind-the-
                back handcuffing may not be possible or may cause injury for some
                people. Alternative restraint methods should be used.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Accessible holding cells:</strong> The detention facility
                must have accessible cells — including a wheelchair-accessible
                toilet and enough space for a wheelchair to maneuver.
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
                  "A public entity shall take appropriate steps to ensure that
                  communications with applicants, participants, members of the
                  public, and companions with disabilities are as effective as
                  communications with others."
                </p>
                <p style={{ margin: 0 }}>
                  Courts must provide auxiliary aids and services, and must give
                  "primary consideration to the requests of individuals with
                  disabilities" regarding the type of aid or service needed.
                </p>
              </>
            }
          >
            <p>
              Courts must be <strong>fully accessible</strong> — both
              physically and in terms of communication:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Physical access:</strong> Courtrooms, witness stands,
                jury boxes, attorney tables, and public seating areas must be
                wheelchair-accessible
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Sign language interpreters:</strong> Must be provided
                for deaf parties, witnesses, jurors, and spectators at no cost
                to the individual. The court pays.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Assistive listening systems:</strong> For people who are
                hard of hearing in courtrooms and hearing rooms
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Real-time captioning (CART):</strong> For complex
                proceedings where assistive listening is not sufficient
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Accessible documents:</strong> Court filings, notices,
                and forms must be available in accessible formats (large print,
                Braille, electronic text) upon request
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Jury service:</strong> People with disabilities cannot
                be automatically excused from jury duty because of their
                disability. The court must provide accommodations.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="jails-prisons"
            title="Jails & Prisons"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.152 — Jails, Detention, and
                  Correctional Facilities</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "(a) Public entities shall ensure that qualified inmates or
                  detainees with disabilities shall not, because a facility is
                  inaccessible to or unusable by individuals with disabilities,
                  be excluded from participation in, or be denied the benefits
                  of, the services, programs, or activities of a public entity."
                </p>
                <p style={{ margin: 0 }}>
                  "(b)(1) …Public entities shall ensure that inmates or
                  detainees with disabilities are housed in the most integrated
                  setting appropriate to the needs of the individuals."
                </p>
              </>
            }
          >
            <p>
              Incarcerated people retain their <strong>ADA rights</strong>.
              Jails and prisons must provide:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Accessible cells:</strong> Cells with adequate space for
                wheelchairs, grab bars in the toilet area, and accessible beds.
                The 2010 Standards specify scoping requirements for correctional
                facilities.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Medical care:</strong> Adequate treatment for
                disability-related conditions, access to medications, accessible
                medical equipment, and continuity of care
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Effective communication:</strong> Sign language
                interpreters for disciplinary hearings, medical appointments,
                and legal visits. Written materials in accessible formats.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Program access:</strong> Educational programs, work
                assignments, recreation, religious services, and commissary
                access must be available to inmates with disabilities
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Integration:</strong> People with disabilities should
                not be housed in medical or segregation units solely because of
                their disability when they could be in general population with
                accommodations
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="probation-parole"
            title="Probation & Parole"
          >
            <p>
              Probation and parole offices are government programs and must
              make <strong>reasonable modifications</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Reporting requirements:</strong> If a person with a
                mobility disability can't travel to the probation office, phone
                or video check-ins may be a reasonable modification
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Community service:</strong> Assignments must account for
                the person's disability — a wheelchair user shouldn't be
                assigned roadside cleanup
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Drug testing:</strong> Procedures may need modification
                for people with mobility or dexterity impairments
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Programs and classes:</strong> Court-ordered classes
                (anger management, substance abuse) must be held in accessible
                locations with communication accommodations
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="enforcement"
            title="DOJ Enforcement Actions"
          >
            <p>
              The DOJ has been <strong>actively enforcing</strong> ADA
              requirements in criminal justice settings:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { area: 'Jails and prisons', examples: 'Settlement agreements requiring accessible cells, medical care, sign language interpreters, and staff training. Multiple county jails have been required to overhaul their disability policies.' },
                { area: 'Police departments', examples: 'Consent decrees requiring crisis intervention training (CIT), deaf communication protocols, and policies for interacting with people with mental health conditions.' },
                { area: 'Courts', examples: 'Settlements requiring accessible courtrooms, interpreter services, assistive listening devices, and accessible electronic filing systems.' },
                { area: 'Use of force', examples: 'DOJ investigations into excessive force against individuals whose disability-related behavior was misinterpreted as non-compliance or aggression.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--slate-900)' }}>{item.area}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.7 }}>{item.examples}</p>
                </div>
              ))}
            </div>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA requirements
                in the criminal justice system. If you or someone you know has
                experienced disability discrimination during a law enforcement
                encounter, in court, or while incarcerated, connect with an
                experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}