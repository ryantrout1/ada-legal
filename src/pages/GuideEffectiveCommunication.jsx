import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideEffectiveCommunication() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Effective Communication"
        typeBadge="Guide"
        badgeColor="#D4570A"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          {/* Section 1: What It Means */}
          <GuideSection
            id="what-it-means"
            title="What Is Effective Communication?"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.160(a)(1) — Title II</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "A public entity shall take appropriate steps to ensure that
                  communications with applicants, participants, members of the public,
                  and companions with disabilities are as effective as communications
                  with others."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §36.303(c) — Title III</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public accommodation shall furnish appropriate auxiliary aids and
                  services where necessary to ensure effective communication with
                  individuals with disabilities."
                </p>
              </>
            }
          >
            <p>
              Under the ADA, both government agencies and businesses must
              communicate <strong>effectively</strong> with people who have hearing,
              vision, or speech disabilities. This doesn't mean identical
              communication — it means the person must be able to understand and
              participate equally.
            </p>
            <p>
              For example, a deaf patient at a hospital must be able to understand
              their diagnosis and treatment plan just as well as a hearing patient.
              A blind person at a government office must be able to access the same
              forms and documents as a sighted person.
            </p>
          </GuideSection>

          {/* Section 2: Auxiliary Aids */}
          <GuideSection
            id="auxiliary-aids"
            title="Auxiliary Aids and Services"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.104 — Definitions</strong>
                </p>
                <p style={{ margin: '0 0 8px' }}>
                  "Auxiliary aids and services" includes:
                </p>
                <p style={{ margin: '0 0 6px', paddingLeft: '12px' }}>
                  (1) Qualified interpreters on-site or through video remote
                  interpreting (VRI) services; notetakers; real-time
                  computer-aided transcription services; written materials;
                  exchange of written notes; telephone handset amplifiers;
                  assistive listening devices; telephones compatible with hearing
                  aids; closed caption decoders; open and closed captioning,
                  including real-time captioning; voice, text, and video-based
                  telecommunications products and systems…
                </p>
                <p style={{ margin: 0, paddingLeft: '12px' }}>
                  (2) Qualified readers; taped texts; audio recordings; Braille
                  materials and displays; screen reader software; magnification
                  software; optical readers; secondary auditory programs (SAP);
                  large print materials; accessible electronic and information
                  technology; or other effective methods of making visually
                  delivered materials available to individuals who are blind or
                  have low vision.
                </p>
              </>
            }
          >
            <p>
              <strong>Auxiliary aids and services</strong> are the tools and
              methods used to make communication effective. The right aid depends
              on the person's disability and the situation. Common examples include:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { group: 'Hearing disabilities', items: 'Sign language interpreters, real-time captioning (CART), assistive listening devices, written notes, video relay' },
                { group: 'Vision disabilities', items: 'Braille materials, large print, screen readers, audio recordings, qualified readers, accessible PDFs' },
                { group: 'Speech disabilities', items: 'Writing materials, communication boards, text-based communication, speech-to-text software' }
              ].map((row, i) => (
                <div key={row.group} style={{
                  padding: '14px 20px',
                  borderBottom: i < 2 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--slate-900)' }}>
                    {row.group}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                    {row.items}
                  </p>
                </div>
              ))}
            </div>
          </GuideSection>

          {/* Section 3: Primary Consideration */}
          <GuideSection
            id="primary-consideration"
            title="Primary Consideration"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.160(b)(2)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "The type of auxiliary aid or service necessary to ensure effective
                  communication will vary… A public entity shall give primary
                  consideration to the requests of individuals with disabilities.
                  In order to be effective, auxiliary aids and services must be
                  provided in accessible formats, in a timely manner, and in such
                  a way as to protect the privacy and independence of the individual
                  with a disability."
                </p>
              </>
            }
          >
            <p>
              The ADA requires that the person with a disability gets <strong>primary
              consideration</strong> in choosing which auxiliary aid or service to
              use. In practice, this means:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                The business or agency must <strong>consult</strong> with the person
                about what they need
              </li>
              <li style={{ marginBottom: '8px' }}>
                The person's preference should be honored unless the entity can show
                that another equally effective method exists, or that providing the
                requested aid would be an <strong>undue burden</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                You cannot force a person to use a family member or friend as an
                interpreter — they have the right to a qualified interpreter
              </li>
            </ul>
          </GuideSection>

          {/* Section 4: Companion Rules */}
          <GuideSection
            id="companions"
            title="Communication with Companions"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.160(a)(2)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity shall ensure that interested persons, including
                  persons with impaired vision or hearing, can obtain information as
                  to the existence and location of accessible services, activities,
                  and facilities."
                </p>
              </>
            }
          >
            <p>
              The ADA doesn't only protect the person directly receiving
              services — it also covers <strong>companions</strong>. A companion is
              someone with a disability who accompanies another person to a business
              or government agency.
            </p>
            <p>
              For example, if a deaf parent accompanies their child to a doctor's
              appointment, the doctor's office must provide effective communication
              for the parent — not just the patient. Similarly, if a blind spouse
              accompanies someone to a bank, the bank must communicate effectively
              with the spouse about relevant account matters.
            </p>
          </GuideSection>

          {/* Section 5: When Is an Interpreter Required */}
          <GuideSection
            id="interpreter-required"
            title="When Is an Interpreter Required?"
          >
            <p>
              Not every interaction requires a sign language interpreter. The
              appropriate aid depends on the <strong>complexity, length, and
              importance</strong> of the communication:
            </p>
            <div style={{
              background: 'white', border: '1px solid var(--slate-200)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { situation: 'Simple transaction (ordering food, buying a ticket)', aid: 'Written notes, pointing, gestures — usually sufficient' },
                { situation: 'Medical appointment, legal proceeding, financial consultation', aid: 'Qualified interpreter likely required — complex information, serious consequences' },
                { situation: 'Emergency room or urgent care', aid: 'Interpreter required as soon as possible; written notes as interim measure' },
                { situation: 'Lecture, class, or group meeting', aid: 'Interpreter, real-time captioning (CART), or assistive listening device' }
              ].map((row, i) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < 3 ? '1px solid var(--slate-200)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--slate-900)', fontSize: '0.9rem' }}>
                    {row.situation}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--slate-600)', lineHeight: 1.6 }}>
                    {row.aid}
                  </p>
                </div>
              ))}
            </div>
          </GuideSection>

          {/* Section 6: VRI */}
          <GuideSection
            id="vri"
            title="Video Remote Interpreting (VRI)"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.160(d) — VRI Performance Standards</strong>
                </p>
                <p style={{ margin: '0 0 6px' }}>
                  When VRI is used, it must provide:
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (1) Real-time, full-motion video and audio over a dedicated
                  high-speed, wide-bandwidth video connection;
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (2) A sharply delineated image large enough to display the
                  interpreter's face, arms, hands, and fingers, and the
                  participating individual's face, arms, hands, and fingers;
                </p>
                <p style={{ margin: '0 0 4px', paddingLeft: '12px' }}>
                  (3) A clear, audible transmission of voices; and
                </p>
                <p style={{ margin: 0, paddingLeft: '12px' }}>
                  (4) Adequate staff training to ensure quick set-up and proper
                  operation.
                </p>
              </>
            }
          >
            <p>
              <strong>Video Remote Interpreting (VRI)</strong> uses video
              conferencing to connect a sign language interpreter remotely. It can
              be a practical alternative when an on-site interpreter is not
              immediately available.
            </p>
            <p>
              However, VRI has strict quality requirements — it's not enough to just
              set up a video call. The connection must be reliable, the image must
              be clear and large enough to see the interpreter's hands and face, and
              staff must be trained to use it properly.
            </p>
            <p>
              VRI is <strong>not always appropriate</strong>. For long or complex
              communications (like a surgery consultation), or when the person
              requests an on-site interpreter, VRI may not meet the effective
              communication standard.
            </p>
          </GuideSection>

          {/* Section 7: Limits */}
          <GuideSection
            id="limits"
            title="Undue Burden and Fundamental Alteration"
          >
            <p>
              A business or government agency does not have to provide a specific
              aid if it would result in an <strong>undue burden</strong> (significant
              difficulty or expense) or a <strong>fundamental alteration</strong> of
              the service or program.
            </p>
            <p>
              However, this is a high bar. The entity must still provide an
              <strong> alternative</strong> auxiliary aid that ensures effective
              communication to the maximum extent possible. They cannot simply do
              nothing.
            </p>

            <GuideLegalCallout citation="28 CFR §35.164">
              <p style={{ margin: 0 }}>
                "When a public entity determines that an action would result in a
                fundamental alteration in the nature of a service, program, or
                activity or in undue financial and administrative burdens, the head
                of the public entity or his or her designee shall… take any other
                action that would not result in such an alteration or such burdens
                but would nevertheless ensure that, to the maximum extent possible,
                individuals with disabilities receive the benefits or services
                provided by the public entity."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          {/* Section 8: Telecom Relay */}
          <GuideSection
            id="relay-services"
            title="Telecommunications Relay Services"
          >
            <p>
              <strong>Title IV</strong> of the ADA requires telephone companies to
              provide <strong>telecommunications relay services (TRS)</strong> so
              that people who are deaf, hard of hearing, or have speech disabilities
              can communicate by phone.
            </p>
            <p>
              Relay services include:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '6px' }}>
                <strong>TTY relay:</strong> An operator relays typed messages to
                the hearing person and types back their response.
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>Video Relay Service (VRS):</strong> A sign language
                interpreter relays between ASL and spoken English via video.
              </li>
              <li style={{ marginBottom: '6px' }}>
                <strong>IP Relay:</strong> Similar to TTY relay, but uses the
                internet instead of a TTY device.
              </li>
            </ul>
            <p>
              All relay services are free to the user and available 24 hours a day,
              7 days a week, by dialing 711.
            </p>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA effective
                communication requirements. The right auxiliary aid depends on the
                specific situation. For guidance about your situation, connect with
                an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}