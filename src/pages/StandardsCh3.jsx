import React from 'react';
import ChapterPageLayout from '../components/guide/ChapterPageLayout';
import TurningSpaceDiagram from '../components/guide/diagrams/TurningSpaceDiagram';
import ReachRangeDiagram from '../components/guide/diagrams/ReachRangeDiagram';
import ClearFloorDiagram from '../components/guide/diagrams/ClearFloorDiagram';
import KneeToeDiagram from '../components/guide/diagrams/KneeToeDiagram';
import ProtrudingObjectsDiagram from '../components/guide/diagrams/ProtrudingObjectsDiagram';
import OperablePartsDiagram from '../components/guide/diagrams/OperablePartsDiagram';

const sections = [
  {
    number: '§302', title: 'Floor or Ground Surfaces',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Floors and ground surfaces must be firm, stable, and not slippery.</li><li style={{marginBottom:"6px"}}>No loose gravel, deep carpet, or slick tile on paths people use.</li><li style={{marginBottom:"6px"}}>Small bumps over ¼ inch must be smoothed out. Over ½ inch = needs a ramp.</li></ul></>,
    plain: <><p>All floor and ground surfaces along accessible routes must be <strong>stable, firm, and slip-resistant</strong>. This means no loose gravel, deep carpet, or slippery tile on paths people use to get around.</p><p><strong>Example:</strong> A hotel can't have thick, plush carpet in the hallway leading to accessible rooms that would make wheelchair travel difficult.</p></>,
    legal: <p>§302.1 "Floor and ground surfaces shall be stable, firm, and slip resistant, and shall comply with §302." Changes in level between ¼ inch and ½ inch must be beveled at 1:2. Changes greater than ½ inch must be treated as ramps (§302.3).</p>
  },
  {
    number: '§303', title: 'Changes in Level',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Small bumps in the floor can stop a wheelchair or trip someone.</li><li style={{marginBottom:"6px"}}>Bumps up to ¼ inch are OK. Between ¼ and ½ inch must be angled smooth.</li><li style={{marginBottom:"6px"}}>Anything over ½ inch needs a ramp.</li><li style={{marginBottom:"6px"}}>Look for: uneven door thresholds, cracked sidewalk lips, raised tile edges.</li></ul></>,
    plain: <><p>Small <strong>bumps and steps</strong> in floor surfaces are a tripping and wheelchair hazard:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}>Up to <strong>¼ inch</strong>: OK as-is (vertical)</li><li style={{marginBottom:'6px'}}><strong>¼ to ½ inch</strong>: Must be beveled (angled) at no steeper than 1:2</li><li style={{marginBottom:'6px'}}>Over <strong>½ inch</strong>: Must be treated as a ramp or curb ramp</li></ul></>,
    legal: <p>§303.2 "Changes in level of ¼ inch high maximum shall be permitted to be vertical." §303.3 "Changes in level between ¼ inch high minimum and ½ inch high maximum shall be beveled with a slope not steeper than 1:2." §303.4 "Changes in level greater than ½ inch high shall be ramped."</p>
  },
  {
    number: '§304', title: 'Turning Space',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Wheelchair users need a 5-foot circle of open space to turn around.</li><li style={{marginBottom:"6px"}}>This space is needed in restrooms, hallway dead-ends, and elevator lobbies.</li><li style={{marginBottom:"6px"}}>If you can't turn your wheelchair around, that's a violation.</li></ul></>,
    plain: <><p>A wheelchair user needs room to <strong>turn around</strong>. Two options are allowed:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Circular:</strong> A 60-inch diameter circle (5 feet across)</li><li style={{marginBottom:'6px'}}><strong>T-shaped:</strong> A T-shape where each arm is at least 36 inches wide</li></ul><p>This space must be provided anywhere a wheelchair user might need to reverse direction — like at the end of a hallway, in a restroom, or in front of an elevator.</p></>,
    legal: <p>§304.3.1 "The turning space shall be a space complying with §304.3.1 (circular) or §304.3.2 (T-shaped)." Circular: "The turning space shall be a 60 inch minimum diameter circle." T-shaped: "The turning space shall be a T-shaped space within a 60 inch minimum square, with arms and base 36 inches wide minimum."</p>,
    diagram: <TurningSpaceDiagram />
  },
  {
    number: '§305', title: 'Clear Floor or Ground Space',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Anywhere you need to use something (a switch, a sink, an ATM), there must be a flat area at least 30 × 48 inches for a wheelchair.</li><li style={{marginBottom:"6px"}}>That's about 2.5 feet by 4 feet of clear space.</li><li style={{marginBottom:"6px"}}>Look for: furniture, trash cans, or displays blocking the space in front of controls.</li></ul></>,
    plain: <><p>Wherever someone in a wheelchair needs to <strong>use a control, reach something, or park beside an element</strong>, there must be a clear floor space of at least <strong>30 inches by 48 inches</strong> (2.5 feet × 4 feet). This can be positioned for either a forward or a parallel (side) approach.</p></>,
    legal: <p>§305.3 "The clear floor or ground space shall be 30 inches minimum by 48 inches minimum." §305.5 "Unless otherwise specified, clear floor or ground space shall permit either forward or parallel approach to an element." §305.7 Maneuvering clearance: "If clear floor space is in an alcove, additional maneuvering clearance is required."</p>,
    diagram: <ClearFloorDiagram />
  },
  {
    number: '§306', title: 'Knee & Toe Clearance',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Desks, counters, and sinks must have space underneath for a wheelchair user's knees and feet.</li><li style={{marginBottom:"6px"}}>Knees need at least 27 inches of height. Toes need at least 9 inches.</li><li style={{marginBottom:"6px"}}>Look for: solid-front desks with no space underneath, reception counters too high to reach.</li></ul></>,
    plain: <><p>When a wheelchair user needs to <strong>pull up under</strong> a counter, desk, or lavatory:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Toe clearance:</strong> At least 9 inches high and 17 inches deep under the element</li><li style={{marginBottom:'6px'}}><strong>Knee clearance:</strong> At least 27 inches high and 11 inches deep minimum, extending to 25 inches deep at 9 inches above the floor</li></ul><p><strong>Example:</strong> A reception desk must have a section low enough (34 inches max) with knee space underneath so a wheelchair user can pull up and interact face-to-face.</p></>,
    legal: <p>§306.2 Toe Clearance: "minimum 9 inches above the finish floor, 17 inches minimum deep, and 30 inches minimum wide." §306.3 Knee Clearance: "27 inches high minimum, 25 inches deep maximum, and 30 inches wide minimum."</p>,
    diagram: <KneeToeDiagram />
  },
  {
    number: '§307', title: 'Protruding Objects',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Things mounted on walls (like fire extinguisher boxes) can't stick out more than 4 inches into a hallway if they're above 27 inches from the floor.</li><li style={{marginBottom:"6px"}}>A person using a cane can detect objects below 27 inches but not higher ones.</li><li style={{marginBottom:"6px"}}>Look for: wall-mounted TVs, signs, shelves, or cabinets sticking out into walking paths.</li></ul></>,
    plain: <><p>Objects mounted on walls or posts cannot stick out into walkways where a <strong>person using a cane or who is blind</strong> might walk into them:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}>Objects between <strong>27 and 80 inches</strong> above the floor can protrude no more than <strong>4 inches</strong> from the wall</li><li style={{marginBottom:'6px'}}>Objects below <strong>27 inches</strong> can protrude any amount (a cane will detect them)</li><li style={{marginBottom:'6px'}}>Freestanding objects on posts can protrude no more than <strong>12 inches</strong></li></ul><p><strong>Example:</strong> A wall-mounted fire extinguisher cabinet installed at 30 inches above the floor can only stick out 4 inches. A drinking fountain at 24 inches can protrude further because a cane can detect it.</p></>,
    legal: <p>§307.2 "Objects with leading edges more than 27 inches and not more than 80 inches above the finish floor or ground shall protrude 4 inches maximum horizontally into the circulation path." §307.3 Post-mounted objects: "12 inches maximum beyond the post."</p>,
    diagram: <ProtrudingObjectsDiagram />
  },
  {
    number: '§308', title: 'Reach Ranges',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Switches, buttons, and controls must be between 15 and 48 inches from the floor.</li><li style={{marginBottom:"6px"}}>That means reachable from a wheelchair without stretching too high or bending too low.</li><li style={{marginBottom:"6px"}}>Look for: thermostats, light switches, or elevator buttons mounted above 4 feet.</li></ul></>,
    plain: <><p>Controls and operable parts must be within reach of a person in a wheelchair:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Forward reach (no obstruction):</strong> 15 inches minimum to 48 inches maximum above the floor</li><li style={{marginBottom:'6px'}}><strong>Side reach (no obstruction):</strong> 15 inches minimum to 48 inches maximum above the floor</li><li style={{marginBottom:'6px'}}>If reaching over an obstruction (counter or shelf), maximum height decreases based on depth</li></ul><p><strong>Example:</strong> A thermostat mounted at 60 inches (5 feet) is too high. It needs to be at 48 inches (4 feet) or lower.</p></>,
    legal: <p>§308.2.1 Forward reach unobstructed: "15 inches minimum and 48 inches maximum above the finish floor." §308.3.1 Side reach unobstructed: "15 inches minimum and 48 inches maximum above the finish floor." §308.2.2 Over obstruction: maximum height decreases based on obstruction depth.</p>,
    diagram: <ReachRangeDiagram />
  },
  {
    number: '§309', title: 'Operable Parts',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Every handle, switch, or button must work with one hand — no gripping, pinching, or twisting.</li><li style={{marginBottom:"6px"}}>Round doorknobs fail this rule. Lever handles pass.</li><li style={{marginBottom:"6px"}}>No more than 5 pounds of force to use any control.</li><li style={{marginBottom:"6px"}}>Look for: round knobs on doors, twist-style faucets, hard-to-push buttons.</li></ul></>,
    plain: <><p>Every control, handle, switch, or mechanism that people use must be <strong>operable with one hand</strong> and without tight grasping, pinching, or twisting of the wrist:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}>No more than <strong>5 pounds of force</strong> to operate</li><li style={{marginBottom:'6px'}}>Round doorknobs fail this test — <strong>lever handles</strong> are required</li><li style={{marginBottom:'6px'}}>Light switches, faucet handles, thermostats, elevator buttons — all must comply</li></ul></>,
    legal: <p>§309.4 "Operable parts shall be operable with one hand and shall not require tight grasping, pinching, or twisting of the wrist. The force required to activate operable parts shall be 5 pounds maximum."</p>,
    diagram: <OperablePartsDiagram />
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