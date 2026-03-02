import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';

export default function GuideTitleII() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Title II: State & Local Government Obligations"
        typeBadge="Overview"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">

          <GuideSection
            id="scope"
            title="Who Title II Covers"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12131 — Definitions</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "The term 'public entity' means — (A) any State or local
                  government; (B) any department, agency, special purpose district,
                  or other instrumentality of a State or States or local
                  government."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>42 U.S.C. §12132 — Discrimination</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "No qualified individual with a disability shall, by reason of
                  such disability, be excluded from participation in or be denied
                  the benefits of the services, programs, or activities of a
                  public entity, or be subjected to discrimination by any such
                  entity."
                </p>
              </>
            }
          >
            <p>
              Title II of the ADA applies to <strong>every state and local
              government entity</strong> in the United States — regardless of
              size. This includes:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>State agencies and departments</li>
              <li style={{ marginBottom: '8px' }}>City and county governments</li>
              <li style={{ marginBottom: '8px' }}>Public school districts and state universities</li>
              <li style={{ marginBottom: '8px' }}>Public transit authorities</li>
              <li style={{ marginBottom: '8px' }}>Courts, jails, and law enforcement agencies</li>
              <li style={{ marginBottom: '8px' }}>Public libraries, parks, and recreation programs</li>
              <li style={{ marginBottom: '8px' }}>Public hospitals and health departments</li>
              <li style={{ marginBottom: '8px' }}>Licensing and regulatory agencies</li>
            </ul>
            <p>
              The rule is simple: <strong>all</strong> services, programs, and
              activities of a public entity must be accessible to people with
              disabilities. There is no exemption for small governments.
            </p>
          </GuideSection>

          <GuideSection
            id="program-access"
            title="Program Access"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.150 — Existing Facilities</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "(a) A public entity shall operate each service, program, or
                  activity so that the service, program, or activity, when viewed
                  in its entirety, is readily accessible to and usable by
                  individuals with disabilities."
                </p>
                <p style={{ margin: 0 }}>
                  "(b)(1) A public entity is not required to make each of its
                  existing facilities accessible to and usable by individuals
                  with disabilities."
                </p>
              </>
            }
          >
            <p>
              <strong>Program access</strong> is Title II's core requirement for
              existing facilities. It means the government's programs must be
              accessible <strong>overall</strong> — but not necessarily in every
              single building.
            </p>
            <p>
              <strong>Example:</strong> A city offers voter registration at 10
              locations. Three buildings have stairs and no elevator. The city
              doesn't have to renovate all 10 buildings — but it must ensure
              that enough locations are accessible so a person with a disability
              can register to vote with the same convenience as everyone else.
            </p>
            <p>
              Methods to achieve program access include:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>Moving a program to an accessible location</li>
              <li style={{ marginBottom: '8px' }}>Offering home visits or online alternatives</li>
              <li style={{ marginBottom: '8px' }}>Making structural modifications to buildings</li>
              <li style={{ marginBottom: '8px' }}>Reassigning staff or services to accessible floors</li>
            </ul>
          </GuideSection>

          <GuideSection
            id="effective-communication"
            title="Effective Communication"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.160 — General</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "(a)(1) A public entity shall take appropriate steps to ensure
                  that communications with applicants, participants, members of
                  the public, and companions with disabilities are as effective
                  as communications with others."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.160(b)(2)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "The type of auxiliary aid or service necessary to ensure
                  effective communication will vary… A public entity shall give
                  primary consideration to the requests of individuals with
                  disabilities."
                </p>
              </>
            }
          >
            <p>
              Government entities must communicate <strong>effectively</strong>
              with people who have disabilities that affect hearing, vision, or
              speech. This includes providing <strong>auxiliary aids and
              services</strong> at no cost to the individual:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>Sign language interpreters</strong> for deaf individuals
                at court hearings, public meetings, or service appointments
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Documents in Braille or large print</strong> for people
                with vision disabilities
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Assistive listening devices</strong> at public meetings
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Captioning</strong> for government videos and live events
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>Accessible websites and digital content</strong>
              </li>
            </ul>
            <p>
              The government must give <strong>primary consideration</strong> to
              the individual's preferred format — you can't just hand everyone a
              written note when they've requested a sign language interpreter.
            </p>
          </GuideSection>

          <GuideSection
            id="reasonable-modifications"
            title="Reasonable Modifications"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.130(b)(7)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity shall make reasonable modifications in
                  policies, practices, or procedures when the modifications are
                  necessary to avoid discrimination on the basis of disability,
                  unless the public entity can demonstrate that making the
                  modifications would fundamentally alter the nature of the
                  service, program, or activity."
                </p>
              </>
            }
          >
            <p>
              Government entities must <strong>modify their rules</strong> when
              needed so people with disabilities can participate equally.
            </p>
            <p>
              <strong>Examples:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                A "no animals" policy must be modified to allow <strong>service
                animals</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                A permit office that requires in-person visits must allow a
                person who can't travel to <strong>submit by mail or online</strong>
              </li>
              <li style={{ marginBottom: '8px' }}>
                A parks department must modify a "no motorized vehicles" rule
                to allow <strong>power wheelchairs</strong> on trails
              </li>
              <li style={{ marginBottom: '8px' }}>
                Extended time on written tests administered by the government
              </li>
            </ul>
            <p>
              The only exception: modifications that would <strong>fundamentally
              alter</strong> the nature of the program or service.
            </p>
          </GuideSection>

          <GuideSection
            id="self-evaluation"
            title="Self-Evaluation & Transition Plans"
          >
            <p>
              Title II requires every public entity to:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Self-evaluation:</strong> Review all policies, practices,
                and programs to identify barriers for people with disabilities.
                This should have been completed within one year of the ADA's
                effective date (January 26, 1993), but the obligation is ongoing.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Transition plan:</strong> If structural changes to
                buildings are needed for program access, the entity must develop
                a plan with specific timelines for making those changes. The plan
                must be available for public review.
              </li>
            </ul>

            <GuideLegalCallout citation="28 CFR §35.150(d)">
              <p style={{ margin: 0 }}>
                "A public entity that employs 50 or more persons shall develop a
                transition plan setting forth the steps necessary to complete
                structural changes… The plan shall, at a minimum: (1) Identify
                physical obstacles… (2) Describe… the methods to be used to make
                the facilities accessible; (3) Specify the schedule for taking
                the steps necessary; and (4) Indicate the official responsible."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="ada-coordinator"
            title="ADA Coordinator & Grievance Procedures"
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.107(a)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "A public entity that employs 50 or more persons shall
                  designate at least one employee to coordinate its efforts to
                  comply with and carry out its responsibilities under this part,
                  including any investigation of any complaint."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.107(b)</strong>
                </p>
                <p style={{ margin: 0 }}>
                  "A public entity that employs 50 or more persons shall adopt
                  and publish grievance procedures providing for prompt and
                  equitable resolution of complaints alleging any action that
                  would be prohibited by this part."
                </p>
              </>
            }
          >
            <p>
              Public entities with <strong>50 or more employees</strong> must:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Designate an ADA Coordinator:</strong> A specific person
                responsible for overseeing ADA compliance. Their name, office
                address, and phone number must be publicly available.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Adopt grievance procedures:</strong> A formal process
                where people with disabilities can file complaints about
                accessibility barriers. The process must be prompt and fair.
              </li>
            </ul>
            <p>
              <strong>Even entities with fewer than 50 employees</strong> must
              comply with all other Title II requirements — they just aren't
              required to formally designate an ADA Coordinator or adopt written
              grievance procedures.
            </p>
          </GuideSection>

          <GuideSection
            id="integration-mandate"
            title="The Integration Mandate (Olmstead)"
          >
            <p>
              Title II includes an <strong>integration mandate</strong> — the
              requirement that government services be provided in the most
              integrated setting appropriate. This was strengthened by the
              landmark <strong>Olmstead v. L.C.</strong> Supreme Court decision
              in 1999.
            </p>
            <p>
              <strong>What this means in practice:</strong>
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                People with disabilities have the right to live and receive
                services in the <strong>community</strong> rather than in
                institutions, when appropriate
              </li>
              <li style={{ marginBottom: '8px' }}>
                States must develop plans to move people out of institutional
                settings when they can live in the community
              </li>
              <li style={{ marginBottom: '8px' }}>
                Government programs cannot unnecessarily <strong>segregate</strong>
                people with disabilities from the general public
              </li>
            </ul>

            <GuideLegalCallout citation="28 CFR §35.130(d)">
              <p style={{ margin: 0 }}>
                "A public entity shall administer services, programs, and
                activities in the most integrated setting appropriate to the
                needs of qualified individuals with disabilities."
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="construction"
            title="New Construction & Alterations"
          >
            <p>
              When a public entity builds a <strong>new facility</strong> or
              makes <strong>alterations</strong> to an existing one, different
              (and stricter) rules apply:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>New construction:</strong> Facilities designed and
                built for first occupancy after January 26, 1992 must be
                <strong> fully accessible</strong> and comply with the 2010
                ADA Standards for Accessible Design.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Alterations:</strong> When an entity renovates a
                facility, the altered portions must be made accessible to the
                maximum extent feasible. If the alteration affects an area's
                usability, the <strong>path of travel</strong> to that area
                must also be made accessible (up to 20% of the alteration cost).
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about Title II
                obligations. State and local governments may also have additional
                requirements under state law. For legal advice about specific
                obligations or rights, connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}