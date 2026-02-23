import React from 'react';
import ChapterPageLayout from '../components/guide/ChapterPageLayout';
import SignageDiagram from '../components/guide/diagrams/SignageDiagram';
import TelephoneDiagram from '../components/guide/diagrams/TelephoneDiagram';
import AssistiveListeningDiagram from '../components/guide/diagrams/AssistiveListeningDiagram';
import ATMDiagram from '../components/guide/diagrams/ATMDiagram';

const sections = [
  {
    number: '§703', title: 'Signs',
    plain: <><p>Signage requirements are divided into two categories:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'8px'}}><strong>Tactile signs</strong> (room ID signs): Raised characters ≥ 1/32 inch high, Grade 2 Braille below the text, mounted on the latch side of the door at 48–60 inches above the floor. Characters must be sans serif, uppercase, and have high contrast.</li><li style={{marginBottom:'8px'}}><strong>Visual signs</strong> (directional, informational): Characters sized based on viewing distance — minimum ⅝ inch high for distances under 6 feet, scaling up. Must have a non-glare finish and high contrast with background.</li></ul><p><strong>Example:</strong> Room number signs at restrooms need Braille and raised letters. A "Restrooms →" directional sign does not need Braille but must have large, high-contrast text.</p></>,
    legal: <p>§703.2 Raised characters: "shall be 1/32 inch minimum above their background." §703.3 Braille: "shall be Grade 2." §703.4.1 "Characters on signs shall be based on the uppercase letter 'I.'" §703.4.2 Mounting: "48 inches minimum above the finish floor to the baseline of the lowest tactile character and 60 inches maximum above the finish floor to the baseline of the highest tactile character."</p>,
    diagram: <SignageDiagram />
  },
  {
    number: '§702', title: 'Fire Alarm Systems',
    plain: <><p>Where fire alarm systems are provided, they must include <strong>visual notification appliances</strong> (flashing strobe lights) so people who are deaf or hard of hearing are alerted:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}>In public and common-use areas of buildings</li><li style={{marginBottom:'6px'}}>In employee work areas</li><li style={{marginBottom:'6px'}}>In hotel guest rooms designated for hearing accessibility</li></ul><p>The strobes flash in a synchronized pattern to prevent triggering seizures and must be bright enough to be noticeable in daylight.</p></>,
    legal: <p>§702.1 "Fire alarm systems shall have permanently installed audible and visible alarms complying with NFPA 72." The visible component must be a xenon strobe or equivalent, synchronized within the field of view, flashing at a prescribed rate per NFPA 72.</p>
  },
  {
    number: '§704', title: 'Telephones',
    plain: <><p>Where public telephones are provided, at least one on each floor must be accessible:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Clear floor space:</strong> 30 × 48 inches for forward or parallel approach</li><li style={{marginBottom:'6px'}}><strong>Height:</strong> Operable parts within reach range (48 inches max)</li><li style={{marginBottom:'6px'}}><strong>Volume control:</strong> Must amplify sound 12 dB minimum above normal, up to 20 dB max</li><li style={{marginBottom:'6px'}}><strong>TTY:</strong> At least one per bank must have a text telephone (TTY) for people who are deaf</li></ul><p><em>Note: While pay phones are increasingly rare, these requirements also apply to courtesy phones and house phones in hotels.</em></p></>,
    legal: <p>§704.2.1 "A clear floor or ground space complying with §305 shall be provided." §704.3 "Volume controls shall be on 12 dB above normal." §704.4 "TTYs complying with §704.4 shall be provided at… all banks of telephones where four or more public pay telephones are provided."</p>,
    diagram: <TelephoneDiagram />
  },
  {
    number: '§705', title: 'Detectable Warnings',
    plain: <><p><strong>Detectable warnings</strong> are the textured "bumps" (truncated domes) you feel underfoot at curb ramps and transit platforms. They alert people who are blind that they're approaching a vehicular or rail hazard.</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}>Dome size: 0.9 inch base diameter, 0.2 inch high</li><li style={{marginBottom:'6px'}}>Spacing: 1.6 to 2.4 inches center-to-center</li><li style={{marginBottom:'6px'}}>Must contrast visually with the surrounding surface</li><li style={{marginBottom:'6px'}}>Required at curb ramps, rail platform edges, and reflecting pool edges</li></ul></>,
    legal: <p>§705.1 "Truncated domes shall have a base diameter of 0.9 inch minimum to 1.4 inch maximum, a top diameter of 50 percent of the base minimum to 65 percent of the base maximum, and a height of 0.2 inch." §705.1.2 "Dome spacing shall be 1.6 inches minimum and 2.4 inches maximum."</p>
  },
  {
    number: '§706', title: 'Assistive Listening Systems',
    plain: <><p>Assembly areas with audio amplification must provide <strong>assistive listening systems</strong> (ALS):</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}>Required in assembly areas where audio communication is integral (theaters, courtrooms, meeting rooms)</li><li style={{marginBottom:'6px'}}>Types include <strong>hearing loops</strong> (induction), <strong>FM systems</strong>, and <strong>infrared systems</strong></li><li style={{marginBottom:'6px'}}>At least 25% of receivers must be hearing-aid compatible (T-coil/neckloop)</li><li style={{marginBottom:'6px'}}>Signage with the International Symbol of Access for Hearing Loss must be posted</li></ul></>,
    legal: <p>§706.2 "Receivers required for use with an assistive listening system shall be hearing-aid compatible." §706.3 "Assistive listening systems shall be identified by the International Symbol of Access for Hearing Loss." System coverage must provide an adequate signal-to-noise ratio per design standards.</p>,
    diagram: <AssistiveListeningDiagram />
  },
  {
    number: '§707', title: 'ATMs & Fare Machines',
    plain: <><p>ATMs, ticket kiosks, and transit fare machines must be accessible to people with vision and mobility disabilities:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Speech output:</strong> Must provide speech for all functions — reads the screen aloud through a headphone jack</li><li style={{marginBottom:'6px'}}><strong>Braille instructions:</strong> Operating instructions in Braille</li><li style={{marginBottom:'6px'}}><strong>Input:</strong> Keypad with raised tactile dots on the "5" key (like a phone)</li><li style={{marginBottom:'6px'}}><strong>Reach:</strong> All controls within 48 inches above the floor</li><li style={{marginBottom:'6px'}}><strong>Privacy:</strong> Speech must have volume control and a mechanism (headphone jack) to prevent others from hearing PINs</li></ul></>,
    legal: <p>§707.5 "Machines shall be speech enabled. Operating instructions shall be provided in Braille." §707.6.1 "Input controls shall be tactilely discernible without activation." §707.5.1 "Speech output shall be delivered through a mechanism that is readily available to all users, including but not limited to, an industry standard connector or a telephone handset."</p>,
    diagram: <ATMDiagram />
  },
  {
    number: '§708', title: 'Two-Way Communication Systems',
    plain: <><p>Where a two-way communication system is provided for entry to a building (intercoms, call boxes), it must be accessible:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Audible and visual:</strong> Must provide both audio and visual signals so people who are deaf can use the system</li><li style={{marginBottom:'6px'}}><strong>Height:</strong> Call button within reach range at 48 inches max</li><li style={{marginBottom:'6px'}}><strong>Handset-free:</strong> Must be usable without picking up a handset</li></ul></>,
    legal: <p>§708.2 "Two-way communication systems shall provide both audible and visible signals." §708.3 "The system shall be usable with hearing aids… and shall not require voice communication." §708.4 "Devices used for two-way communication that also serve as a means of entry shall comply with §309.4 (operable parts)."</p>
  }
];

export default function StandardsCh7() {
  return (
    <ChapterPageLayout
      chapterNum={7}
      title="Communication Elements & Features"
      range="§701–708"
      overview={<p>Chapter 7 covers elements that help people <strong>receive and exchange information</strong> — signs, fire alarms, telephones, detectable warnings, assistive listening systems, ATMs and fare machines, and two-way communication systems. These requirements are critical for people who are blind, deaf, or hard of hearing.</p>}
      sections={sections}
    />
  );
}