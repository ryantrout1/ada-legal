import React from 'react';
import GuideStyles from '../components/guide/GuideStyles';
import GuideHeroBanner from '../components/guide/GuideHeroBanner';
import GuideSection from '../components/guide/GuideSection';
import GuideLegalCallout from '../components/guide/GuideLegalCallout';
import GuideReportCTA from '../components/guide/GuideReportCTA';
import GuideReadingLevelBar from '../components/guide/GuideReadingLevelBar';

export default function GuideEmergencyManagement() {
  return (
    <>
      <GuideStyles />
      <GuideHeroBanner
        title="Emergency Management & Disability"
        typeBadge="Guide"
        badgeColor="var(--section-label)"
      />

      <div className="guide-content-wrap">
        <div className="guide-content">
          <GuideReadingLevelBar />

          <GuideSection
            id="overview"
            title="The ADA Applies in Emergencies"
            simpleContent={
              <><p>The ADA still applies during emergencies like storms, fires, and disasters.</p><p>Emergency shelters, warnings, and transportation must be accessible to people with disabilities.</p></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.130(a)</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  "No qualified individual with a disability shall, on the
                  basis of disability, be excluded from participation in or be
                  denied the benefits of the services, programs, or activities
                  of a public entity."
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.149</strong>
                </p>
                <p style={{ margin: 0 }}>
                  The program access requirement applies to all government
                  programs, services, and activities — including emergency
                  preparedness, response, and recovery programs.
                </p>
              </>
            }
          >
            <p>
              The ADA does not take a break during emergencies. People with
              disabilities are <strong>disproportionately affected</strong> by
              disasters — and government emergency programs must include them
              at every stage.
            </p>
            <p>
              The ADA's Title II requirements — program access, effective
              communication, reasonable modifications — apply fully to:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>Emergency planning and preparedness</li>
              <li style={{ marginBottom: '8px' }}>Evacuation procedures</li>
              <li style={{ marginBottom: '8px' }}>Emergency shelters and temporary housing</li>
              <li style={{ marginBottom: '8px' }}>Disaster relief and recovery programs</li>
              <li style={{ marginBottom: '8px' }}>Emergency alerts and notifications</li>
            </ul>
          </GuideSection>

          <GuideSection
            id="shelters"
            title="Accessible Emergency Shelters"
            simpleContent={
              <><p>Emergency shelters must be accessible. This means:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Wheelchair-accessible entrances and restrooms</li><li style={{ marginBottom: "6px" }}>Cots at wheelchair height</li><li style={{ marginBottom: "6px" }}>A quiet space for people with sensory needs</li><li style={{ marginBottom: "6px" }}>Sign language interpreters or communication help</li></ul></>
            }
            legalContent={
              <>
                <p style={{ margin: '0 0 12px' }}>
                  <strong>28 CFR §35.150 — Existing Facilities</strong>
                </p>
                <p style={{ margin: '0 0 12px' }}>
                  Emergency shelters operated by or on behalf of state or local
                  governments must be accessible as part of the program access
                  requirement. The shelter program, "when viewed in its
                  entirety," must be readily accessible.
                </p>
                <p style={{ margin: 0 }}>
                  <strong>ADA.gov Guidance:</strong> "People with disabilities
                  have the right to be admitted to an emergency shelter and to
                  not be turned away because of their disability."
                </p>
              </>
            }
          >
            <p>
              Emergency shelters must be <strong>physically accessible</strong>
              and provide accommodations for people with all types of
              disabilities:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Physical access:</strong> Accessible entrances, pathways
                wide enough for wheelchairs, accessible restrooms and showers,
                and sleeping areas that accommodate mobility devices
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Cots and sleeping:</strong> Standard cots may be too
                low or unstable for some people. Accessible cots (higher, with
                rails) or allowing individuals to sleep in their wheelchairs
                must be options.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Refrigeration for medications:</strong> People with
                diabetes, organ transplants, or other conditions may need
                refrigerated medication storage
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Quiet spaces:</strong> For individuals with autism,
                PTSD, psychiatric disabilities, or sensory sensitivities who
                may be overwhelmed by the noise and chaos of a large shelter
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>No segregation:</strong> People with disabilities
                should not be separated into a "special needs shelter" unless
                they require medical care that can only be provided in a
                medical facility. General population shelters must be
                accessible.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="evacuation"
            title="Evacuation Plans for People with Disabilities"
            simpleContent={
              <><p>Buildings and cities must have plans to evacuate people with disabilities.</p><p>This includes people in wheelchairs, blind people, deaf people, and people who need help moving.</p><p>Fire alarms must have both sound and flashing lights.</p></>
            }
          >
            <p>
              Government evacuation plans must <strong>specifically
              address</strong> the needs of people with disabilities:
            </p>
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden', margin: '16px 0'
            }}>
              {[
                { need: 'Mobility impairments', plan: 'Accessible transportation vehicles (lift-equipped buses, paratransit). Evacuation routes that avoid stairs. Assistance for people who cannot walk long distances.' },
                { need: 'Deaf and hard of hearing', plan: 'Visual alerts (flashing lights, text messages) in addition to sirens. Sign language interpreters at evacuation staging areas. Written instructions.' },
                { need: 'Blind and low vision', plan: 'Audio alerts and verbal instructions. Guides or escorts available at evacuation points. Accessible route information in advance.' },
                { need: 'Cognitive disabilities', plan: 'Simple, clear instructions. Visual step-by-step guides. Trained personnel who can assist calmly and patiently.' },
                { need: 'People in institutions', plan: 'Nursing homes, group homes, and psychiatric facilities must have evacuation plans that account for every resident\'s needs.' }
              ].map((item, i, arr) => (
                <div key={i} style={{
                  padding: '14px 20px',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none'
                }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: 'var(--heading)' }}>{item.need}</p>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--body)', lineHeight: 1.7 }}>{item.plan}</p>
                </div>
              ))}
            </div>
          </GuideSection>

          <GuideSection
            id="notifications"
            title="Accessible Emergency Notifications"
            simpleContent={
              <><p>Emergency warnings must reach everyone, including people who are deaf or blind:</p><ul style={{ paddingLeft: "1.25rem", margin: "8px 0" }}><li style={{ marginBottom: "6px" }}>Text alerts and visual warnings for deaf people</li><li style={{ marginBottom: "6px" }}>Audio alerts for blind people</li><li style={{ marginBottom: "6px" }}>Easy-to-understand language for people with learning disabilities</li></ul></>
            }
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
                  This applies to all emergency communications, including
                  alerts, warnings, evacuation orders, shelter information, and
                  recovery assistance announcements.
                </p>
              </>
            }
          >
            <p>
              Emergency alerts that only use one communication method — like
              sirens or radio broadcasts — will miss people with certain
              disabilities. Notifications must be provided in <strong>multiple
              formats</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Visual alerts:</strong> Text messages, social media posts,
                scrolling TV chyrons, email, and flashing emergency beacons for
                people who are deaf or hard of hearing
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Audio alerts:</strong> Sirens, radio broadcasts, phone
                calls, and public address systems for people who are blind
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Plain language:</strong> Clear, simple wording that
                people with cognitive disabilities can understand. Avoid
                jargon and abbreviations.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Multiple languages:</strong> While not an ADA
                requirement specifically, reaching the broadest audience is a
                best practice
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Television broadcasts:</strong> Emergency press
                conferences must include <strong>sign language
                interpreters</strong> and <strong>open captions</strong>
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="service-animals"
            title="Service Animals in Shelters"
            simpleContent={
              <><p>Service animals must be allowed in emergency shelters. They cannot be separated from their owners.</p><p>Other pets may go to a separate area, but service animals stay with the person.</p></>
            }
          >
            <p>
              People with disabilities must be allowed to bring their <strong>
              service animals</strong> into emergency shelters — period. This is
              required by the ADA's reasonable modification obligation.
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                A "no pets" shelter policy must be modified to <strong>allow
                service animals</strong>
              </li>
              <li style={{ marginBottom: '10px' }}>
                The service animal must remain with its handler — it cannot be
                confined to a separate animal area
              </li>
              <li style={{ marginBottom: '10px' }}>
                Shelter staff may only ask two questions: (1) Is this a service
                animal required because of a disability? (2) What work or task
                has the dog been trained to perform?
              </li>
              <li style={{ marginBottom: '10px' }}>
                If another shelter resident has a severe allergy to dogs, the
                shelter must accommodate <strong>both</strong> individuals — for
                example, by placing them in different areas
              </li>
            </ul>

            <GuideLegalCallout citation="28 CFR §35.136">
              <p style={{ margin: 0 }}>
                "A public entity shall modify its policies, practices, or
                procedures to permit the use of a service animal by an individual
                with a disability." This obligation applies fully in emergency
                shelters and disaster relief settings.
              </p>
            </GuideLegalCallout>
          </GuideSection>

          <GuideSection
            id="dme-medications"
            title="Medical Equipment & Medications"
            simpleContent={
              <><p>People with disabilities may need their medical equipment and medicine during an emergency.</p><p>Shelters must plan for things like wheelchairs, oxygen tanks, and refrigerated medicine.</p><p>Power must be available for equipment that needs electricity.</p></>
            }
          >
            <p>
              Many people with disabilities depend on <strong>durable medical
              equipment</strong> (DME) and medications that can be lost,
              damaged, or left behind during an emergency:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Wheelchairs and mobility devices:</strong> Shelters must
                accommodate wheelchairs, scooters, walkers, and other devices.
                If someone's wheelchair is lost in a disaster, government
                programs should help replace it.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Oxygen and respiratory equipment:</strong> Shelters must
                have electrical outlets and support for oxygen concentrators,
                CPAP machines, and nebulizers.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Medication access:</strong> Emergency pharmacies or
                partnerships with pharmacies to provide emergency medication
                supplies. Refrigeration for insulin and other
                temperature-sensitive medications.
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Communication devices:</strong> People who use
                augmentative and alternative communication (AAC) devices need
                power to charge them and space to use them.
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="transportation"
            title="Accessible Emergency Transportation"
            simpleContent={
              <><p>Emergency transportation must include accessible vehicles.</p><p>People who use wheelchairs cannot be left behind because buses are not accessible.</p><p>Plans must include how to move people who cannot walk or drive.</p></>
            }
          >
            <p>
              Evacuation transportation must be <strong>accessible</strong>:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '10px' }}>
                <strong>Lift-equipped vehicles:</strong> Evacuation bus fleets
                must include wheelchair-accessible vehicles with lifts or ramps
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Paratransit coordination:</strong> Existing paratransit
                services should be integrated into evacuation plans
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Pick-up for homebound individuals:</strong> People who
                cannot get to an evacuation point need door-to-door pick-up
                service
              </li>
              <li style={{ marginBottom: '10px' }}>
                <strong>Accessible route information:</strong> People must be
                told which evacuation routes are accessible and which
                transportation pick-up points have accessible vehicles
              </li>
            </ul>
          </GuideSection>

          <GuideSection
            id="fema-resources"
            title="FEMA Partnership & Resources"
            simpleContent={
              <><p>FEMA works with disability groups to improve emergency plans.</p><p>They provide guides and training to help communities include people with disabilities in their emergency planning.</p><p>You can request accessible FEMA services if you have a disability.</p></>
            }
          >
            <p>
              FEMA and the DOJ work together to ensure disaster response
              includes people with disabilities:
            </p>
            <ul style={{ paddingLeft: '1.25rem', margin: '8px 0 16px' }}>
              <li style={{ marginBottom: '8px' }}>
                <strong>FEMA's Office of Disability Integration and
                Coordination (ODIC)</strong> provides guidance and technical
                assistance to state and local emergency managers
              </li>
              <li style={{ marginBottom: '8px' }}>
                <strong>FEMA disaster relief programs</strong> (housing
                assistance, individual assistance) must be accessible to people
                with disabilities — including application processes, inspection
                visits, and temporary housing
              </li>
              <li style={{ marginBottom: '8px' }}>
                The DOJ has entered into <strong>settlement agreements</strong>
                with jurisdictions that failed to include people with
                disabilities in emergency planning
              </li>
            </ul>

            <GuideLegalCallout citation="Important Note">
              <p style={{ margin: 0 }}>
                This guide provides general information about ADA requirements
                in emergency management. Emergency preparedness involves federal,
                state, and local laws and regulations. For legal advice about
                your rights during an emergency or your entity's obligations,
                connect with an experienced ADA attorney.
              </p>
            </GuideLegalCallout>
          </GuideSection>

        </div>
      </div>

      <GuideReportCTA />
    </>
  );
}