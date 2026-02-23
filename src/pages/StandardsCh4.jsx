import React from 'react';
import ChapterPageLayout from '../components/guide/ChapterPageLayout';
import RampDiagram from '../components/guide/diagrams/RampDiagram';
import DoorDiagram from '../components/guide/diagrams/DoorDiagram';
import CurbRampDiagram from '../components/guide/diagrams/CurbRampDiagram';
import ElevatorDiagram from '../components/guide/diagrams/ElevatorDiagram';
import WalkingSurfaceDiagram from '../components/guide/diagrams/WalkingSurfaceDiagram';
import PlatformLiftDiagram from '../components/guide/diagrams/PlatformLiftDiagram';
import LULAElevatorDiagram from '../components/guide/diagrams/LULAElevatorDiagram';

const sections = [
  {
    number: '§402', title: 'Accessible Routes — General',
    plain: <><p>An accessible route is a <strong>continuous, unobstructed path</strong> connecting all accessible elements within a site or building. It must be at least <strong>36 inches wide</strong> (narrowing to 32 inches at a point for up to 24 inches in length). The route includes walking surfaces, ramps, curb ramps, elevators, and platform lifts.</p></>,
    legal: <p>§402.1 "Accessible routes shall comply with §402." They must consist of walking surfaces with running slope ≤1:20, doorways, ramps, curb ramps, elevators, or platform lifts as permitted.</p>
  },
  {
    number: '§403', title: 'Walking Surfaces',
    plain: <><p>Walking surfaces along accessible routes must meet these requirements:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Width:</strong> 36 inches minimum clear width</li><li style={{marginBottom:'6px'}}><strong>Running slope:</strong> No steeper than 1:20 (5%). Anything steeper is a ramp.</li><li style={{marginBottom:'6px'}}><strong>Cross slope:</strong> No steeper than 1:48 (about 2%)</li><li style={{marginBottom:'6px'}}><strong>Surface:</strong> Stable, firm, and slip-resistant</li></ul><p><strong>Example:</strong> A sidewalk to a building entrance can have a gentle slope (1:20) but not a steep hill. If it's steeper than 1:20, it must have ramp features (handrails, landings).</p></>,
    legal: <p>§403.3 "The running slope of walking surfaces shall not be steeper than 1:20." §403.5.1 "The clear width of walking surfaces shall be 36 inches minimum." §403.3 "The cross slope of walking surfaces shall not be steeper than 1:48."</p>,
    diagram: <WalkingSurfaceDiagram />
  },
  {
    number: '§404', title: 'Doors, Doorways & Gates',
    plain: <><p>This is one of the most detailed sections. Key requirements:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Clear width:</strong> 32 inches minimum when the door is open 90°</li><li style={{marginBottom:'6px'}}><strong>Maneuvering clearance:</strong> Enough space on both sides of the door for a wheelchair user to approach and open it</li><li style={{marginBottom:'6px'}}><strong>Threshold:</strong> ½ inch maximum height (¾ inch for sliding doors)</li><li style={{marginBottom:'6px'}}><strong>Hardware:</strong> Operable with one hand, no grasping/twisting — lever or push/pull handles</li><li style={{marginBottom:'6px'}}><strong>Opening force:</strong> Interior doors maximum 5 lbs (fire doors may be higher per code)</li><li style={{marginBottom:'6px'}}><strong>Closing speed:</strong> From 90° to 12° in 5 seconds minimum</li></ul></>,
    legal: <p>§404.2.3 "Door openings shall provide a clear width of 32 inches minimum." §404.2.4 Maneuvering clearances per Table 404.2.4.1. §404.2.7 "Thresholds shall be ½ inch high maximum." §404.2.9 "Opening force for interior doors shall be 5 pounds maximum."</p>,
    diagram: <DoorDiagram />
  },
  {
    number: '§405', title: 'Ramps',
    plain: <><p>When a route has a slope steeper than 1:20, it's a ramp and must comply:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Slope:</strong> Not steeper than <strong>1:12</strong> (for every 1 inch of rise, 12 inches of ramp). A 30-inch rise needs a 30-foot ramp.</li><li style={{marginBottom:'6px'}}><strong>Width:</strong> 36 inches minimum clear between handrails</li><li style={{marginBottom:'6px'}}><strong>Rise:</strong> Maximum 30 inches of rise per ramp run, then a landing is required</li><li style={{marginBottom:'6px'}}><strong>Landings:</strong> At least 60 inches long at the top, bottom, and where the ramp changes direction</li><li style={{marginBottom:'6px'}}><strong>Handrails:</strong> Required on both sides of ramp runs with more than 6 inches of rise</li><li style={{marginBottom:'6px'}}><strong>Edge protection:</strong> Curbs, walls, or rails to prevent wheelchairs from rolling off</li></ul></>,
    legal: <p>§405.2 "Ramp runs shall have a running slope not steeper than 1:12." §405.6 "The rise for any ramp run shall be 30 inches maximum." §405.7 Landings: "60 inches long minimum." §405.8 "Handrails complying with §505 shall be provided on both sides."</p>,
    diagram: <RampDiagram />
  },
  {
    number: '§406', title: 'Curb Ramps',
    plain: <><p>Curb ramps allow wheelchair users, stroller users, and others to transition between a sidewalk and street. Requirements:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Slope:</strong> Not steeper than 1:12</li><li style={{marginBottom:'6px'}}><strong>Width:</strong> 36 inches minimum</li><li style={{marginBottom:'6px'}}><strong>Flared sides:</strong> If the curb ramp is next to a walkway, sides must be flared at 1:10 maximum slope so pedestrians don't trip</li><li style={{marginBottom:'6px'}}><strong>Detectable warnings:</strong> Raised bumps (truncated domes) at the bottom where the ramp meets the street — they alert people who are blind that they're entering a roadway</li></ul></>,
    legal: <p>§406.1 "Curb ramps on accessible routes shall comply with §406." §406.3 "The running slope of curb ramp runs shall not be steeper than 1:12." §406.5 "Flared sides shall have a slope of 1:10 maximum." §406.13 Detectable warnings: "36 inches minimum in the direction of travel."</p>,
    diagram: <CurbRampDiagram />
  },
  {
    number: '§407–408', title: 'Elevators',
    plain: <><p>Both standard elevators and LULA (Limited Use/Limited Application) elevators have requirements:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Call buttons:</strong> 42 inches max above floor, with visual indicators</li><li style={{marginBottom:'6px'}}><strong>Hall signals:</strong> Audible and visible signals indicating car arrival and direction</li><li style={{marginBottom:'6px'}}><strong>Cab size:</strong> At least 51 inches deep × 68 inches wide (for standard), or 54 × 36 inches minimum for LULA</li><li style={{marginBottom:'6px'}}><strong>Controls:</strong> Within reach range, with Braille and raised characters</li><li style={{marginBottom:'6px'}}><strong>Door timing:</strong> Doors must remain open long enough for a person using a wheelchair to enter</li></ul></>,
    legal: <p>§407.2.1 Call buttons: "located 42 inches maximum above the finish floor." §407.4.1 Car dimensions: minimum inside dimensions per Table 407.4.1. §407.4.7 Floor designation: "provided in raised characters and Braille on both jambs."</p>,
    diagram: <><ElevatorDiagram /><LULAElevatorDiagram /></>
  },
  {
    number: '§409–410', title: 'Platform Lifts & Stairways',
    plain: <><p><strong>Platform lifts</strong> can be used as an alternative to ramps or elevators in certain situations — existing buildings, areas with limited space, performance stages, and speaker platforms. Key requirements include a clear floor space of 30 × 48 inches on the platform.</p><p><strong>Stairways</strong> on accessible routes (between floors served by elevators) need handrails on both sides extending 12 inches beyond the top and bottom risers.</p></>,
    legal: <p>§409.1 Platform lifts "shall comply with ASME A18.1." §410.1 Stairways: "Stairs on accessible routes shall comply with §210." §505.10 Handrail extensions: "at the top, 12 inches horizontally beyond the top riser; at the bottom, extending the slope of the stair flight beyond the bottom riser."</p>,
    diagram: <PlatformLiftDiagram />
  }
];

export default function StandardsCh4() {
  return (
    <ChapterPageLayout
      chapterNum={4}
      title="Accessible Routes"
      range="§401–410"
      overview={<p>Chapter 4 covers everything about <strong>getting from one place to another</strong> within a building or site. Walking surfaces, doors, ramps, curb ramps, elevators, platform lifts, and stairways — these are the elements that make up an accessible route. This is one of the most commonly cited chapters in ADA compliance reviews because if the route isn't accessible, nothing else matters.</p>}
      sections={sections}
    />
  );
}