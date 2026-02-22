import React from 'react';
import ChapterPageLayout from '../components/guide/ChapterPageLayout';
import TurningSpaceDiagram from '../components/guide/diagrams/TurningSpaceDiagram';
import ReachRangeDiagram from '../components/guide/diagrams/ReachRangeDiagram';
import ClearFloorDiagram from '../components/guide/diagrams/ClearFloorDiagram';

const sections = [
  {
    number: '§302', title: 'Floor or Ground Surfaces',
    plain: <><p>All floor and ground surfaces along accessible routes must be <strong>stable, firm, and slip-resistant</strong>. This means no loose gravel, deep carpet, or slippery tile on paths people use to get around.</p><p><strong>Example:</strong> A hotel can't have thick, plush carpet in the hallway leading to accessible rooms that would make wheelchair travel difficult.</p></>,
    legal: <p>§302.1 "Floor and ground surfaces shall be stable, firm, and slip resistant, and shall comply with §302." Changes in level between ¼ inch and ½ inch must be beveled at 1:2. Changes greater than ½ inch must be treated as ramps (§302.3).</p>
  },
  {
    number: '§303', title: 'Changes in Level',
    plain: <><p>Small <strong>bumps and steps</strong> in floor surfaces are a tripping and wheelchair hazard:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}>Up to <strong>¼ inch</strong>: OK as-is (vertical)</li><li style={{marginBottom:'6px'}}><strong>¼ to ½ inch</strong>: Must be beveled (angled) at no steeper than 1:2</li><li style={{marginBottom:'6px'}}>Over <strong>½ inch</strong>: Must be treated as a ramp or curb ramp</li></ul></>,
    legal: <p>§303.2 "Changes in level of ¼ inch high maximum shall be permitted to be vertical." §303.3 "Changes in level between ¼ inch high minimum and ½ inch high maximum shall be beveled with a slope not steeper than 1:2." §303.4 "Changes in level greater than ½ inch high shall be ramped."</p>
  },
  {
    number: '§304', title: 'Turning Space',
    plain: <><p>A wheelchair user needs room to <strong>turn around</strong>. Two options are allowed:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Circular:</strong> A 60-inch diameter circle (5 feet across)</li><li style={{marginBottom:'6px'}}><strong>T-shaped:</strong> A T-shape where each arm is at least 36 inches wide</li></ul><p>This space must be provided anywhere a wheelchair user might need to reverse direction — like at the end of a hallway, in a restroom, or in front of an elevator.</p></>,
    legal: <p>§304.3.1 "The turning space shall be a space complying with §304.3.1 (circular) or §304.3.2 (T-shaped)." Circular: "The turning space shall be a 60 inch minimum diameter circle." T-shaped: "The turning space shall be a T-shaped space within a 60 inch minimum square, with arms and base 36 inches wide minimum."</p>,
    diagram: <TurningSpaceDiagram />
  },
  {
    number: '§305', title: 'Clear Floor or Ground Space',
    plain: <><p>Wherever someone in a wheelchair needs to <strong>use a control, reach something, or park beside an element</strong>, there must be a clear floor space of at least <strong>30 inches by 48 inches</strong> (2.5 feet × 4 feet). This can be positioned for either a forward or a parallel (side) approach.</p></>,
    legal: <p>§305.3 "The clear floor or ground space shall be 30 inches minimum by 48 inches minimum." §305.5 "Unless otherwise specified, clear floor or ground space shall permit either forward or parallel approach to an element." §305.7 Maneuvering clearance: "If clear floor space is in an alcove, additional maneuvering clearance is required."</p>,
    diagram: <ClearFloorDiagram />
  },
  {
    number: '§306', title: 'Knee & Toe Clearance',
    plain: <><p>When a wheelchair user needs to <strong>pull up under</strong> a counter, desk, or lavatory:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Toe clearance:</strong> At least 9 inches high and 17 inches deep under the element</li><li style={{marginBottom:'6px'}}><strong>Knee clearance:</strong> At least 27 inches high and 11 inches deep minimum, extending to 25 inches deep at 9 inches above the floor</li></ul><p><strong>Example:</strong> A reception desk must have a section low enough (34 inches max) with knee space underneath so a wheelchair user can pull up and interact face-to-face.</p></>,
    legal: <p>§306.2 Toe Clearance: "minimum 9 inches above the finish floor, 17 inches minimum deep, and 30 inches minimum wide." §306.3 Knee Clearance: "27 inches high minimum, 25 inches deep maximum, and 30 inches wide minimum."</p>
  },
  {
    number: '§307', title: 'Protruding Objects',
    plain: <><p>Objects mounted on walls or posts cannot stick out into walkways where a <strong>person using a cane or who is blind</strong> might walk into them:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}>Objects between <strong>27 and 80 inches</strong> above the floor can protrude no more than <strong>4 inches</strong> from the wall</li><li style={{marginBottom:'6px'}}>Objects below <strong>27 inches</strong> can protrude any amount (a cane will detect them)</li><li style={{marginBottom:'6px'}}>Freestanding objects on posts can protrude no more than <strong>12 inches</strong></li></ul><p><strong>Example:</strong> A wall-mounted fire extinguisher cabinet installed at 30 inches above the floor can only stick out 4 inches. A drinking fountain at 24 inches can protrude further because a cane can detect it.</p></>,
    legal: <p>§307.2 "Objects with leading edges more than 27 inches and not more than 80 inches above the finish floor or ground shall protrude 4 inches maximum horizontally into the circulation path." §307.3 Post-mounted objects: "12 inches maximum beyond the post."</p>
  },
  {
    number: '§308', title: 'Reach Ranges',
    plain: <><p>Controls and operable parts must be within reach of a person in a wheelchair:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Forward reach (no obstruction):</strong> 15 inches minimum to 48 inches maximum above the floor</li><li style={{marginBottom:'6px'}}><strong>Side reach (no obstruction):</strong> 15 inches minimum to 48 inches maximum above the floor</li><li style={{marginBottom:'6px'}}>If reaching over an obstruction (counter or shelf), maximum height decreases based on depth</li></ul><p><strong>Example:</strong> A thermostat mounted at 60 inches (5 feet) is too high. It needs to be at 48 inches (4 feet) or lower.</p></>,
    legal: <p>§308.2.1 Forward reach unobstructed: "15 inches minimum and 48 inches maximum above the finish floor." §308.3.1 Side reach unobstructed: "15 inches minimum and 48 inches maximum above the finish floor." §308.2.2 Over obstruction: maximum height decreases based on obstruction depth.</p>,
    diagram: <ReachRangeDiagram />
  },
  {
    number: '§309', title: 'Operable Parts',
    plain: <><p>Every control, handle, switch, or mechanism that people use must be <strong>operable with one hand</strong> and without tight grasping, pinching, or twisting of the wrist:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}>No more than <strong>5 pounds of force</strong> to operate</li><li style={{marginBottom:'6px'}}>Round doorknobs fail this test — <strong>lever handles</strong> are required</li><li style={{marginBottom:'6px'}}>Light switches, faucet handles, thermostats, elevator buttons — all must comply</li></ul></>,
    legal: <p>§309.4 "Operable parts shall be operable with one hand and shall not require tight grasping, pinching, or twisting of the wrist. The force required to activate operable parts shall be 5 pounds maximum."</p>
  }
];

export default function StandardsCh3() {
  return (
    <ChapterPageLayout
      chapterNum={3}
      title="Building Blocks"
      range="§301–309"
      overview={<p>Chapter 3 defines the <strong>fundamental building blocks</strong> of accessibility that are referenced throughout all other chapters. Floor surfaces, turning spaces, clear floor space, reach ranges, and operable parts — these are the measurements and requirements that form the basis of every accessible design. Understand these, and the rest of the Standards make much more sense.</p>}
      sections={sections}
    />
  );
}