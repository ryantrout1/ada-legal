import React from 'react';
import ChapterPageLayout from '../components/guide/ChapterPageLayout';
import ToiletStallDiagram from '../components/guide/diagrams/ToiletStallDiagram';
import BathtubDiagram from '../components/guide/diagrams/BathtubDiagram';
import ShowerDiagram from '../components/guide/diagrams/ShowerDiagram';
import LavatoryDiagram from '../components/guide/diagrams/LavatoryDiagram';
import GrabBarDetailDiagram from '../components/guide/diagrams/GrabBarDetailDiagram';
import DrinkingFountainDiagram from '../components/guide/diagrams/DrinkingFountainDiagram';

const sections = [
  {
    number: '§602', title: 'Drinking Fountains',
    plain: <><p>Where drinking fountains are provided, there must be <strong>two types</strong>:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Wheelchair accessible:</strong> Spout no higher than 36 inches, with knee and toe clearance underneath for a forward approach</li><li style={{marginBottom:'6px'}}><strong>Standing height:</strong> Spout 38 to 43 inches high for people who have difficulty bending</li></ul><p>Many buildings use a "hi-lo" combination unit that satisfies both requirements. The operable parts (button or lever) must be at the front and operable with one hand.</p></>,
    legal: <p>§602.4 "Spout outlets of drinking fountains for wheelchair users shall be 36 inches maximum above the finish floor." §602.5 "Spout outlets of drinking fountains for standing persons shall be 38 inches minimum and 43 inches maximum above the finish floor." §602.6 "Unit water flow shall be 4 inches high minimum."</p>,
    diagram: <DrinkingFountainDiagram />
  },
  {
    number: '§603', title: 'Toilet & Bathing Rooms',
    plain: <><p>Accessible toilet rooms must have:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Turning space:</strong> A 60-inch diameter circle or T-shaped space for wheelchair turning</li><li style={{marginBottom:'6px'}}><strong>Door swing:</strong> The door cannot swing into the required clear floor space at any fixture</li><li style={{marginBottom:'6px'}}><strong>Mirrors:</strong> Bottom edge of the reflecting surface no higher than 40 inches above the floor</li><li style={{marginBottom:'6px'}}><strong>Coat hooks and shelves:</strong> Within reach range — 15 to 48 inches above the floor</li></ul></>,
    legal: <p>§603.2.1 "Turning space complying with §304 shall be provided within the room." §603.2.3 "Doors shall not swing into the clear floor space or clearance required for any fixture." §603.3 "Mirrors… shall be installed with the bottom edge of the reflecting surface 40 inches maximum above the finish floor."</p>
  },
  {
    number: '§604', title: 'Water Closets & Toilet Compartments',
    plain: <><p>The toilet itself and its compartment have detailed requirements:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Seat height:</strong> 17 to 19 inches above the floor</li><li style={{marginBottom:'6px'}}><strong>Centerline:</strong> 16 to 18 inches from the side wall</li><li style={{marginBottom:'6px'}}><strong>Standard compartment:</strong> 60 inches wide minimum, 56 inches deep minimum (wall-mounted) or 59 inches deep (floor-mounted)</li><li style={{marginBottom:'6px'}}><strong>Ambulatory compartment:</strong> 35 to 37 inches wide with grab bars on both sides — for people who can walk but need support</li><li style={{marginBottom:'6px'}}><strong>Door:</strong> Must be self-closing and have a pull on both sides; cannot swing into the required clearance</li></ul></>,
    legal: <p>§604.4 "The seat height of a water closet shall be 17 inches minimum and 19 inches maximum above the finish floor." §604.2 "The water closet shall be positioned with a wall or partition to the rear and to one side. The centerline shall be 16 inches minimum to 18 inches maximum from the side wall." §604.8.1.1 Standard compartment: "60 inches wide minimum."</p>,
    diagram: <ToiletStallDiagram />
  },
  {
    number: '§605', title: 'Urinals',
    plain: <><p>Where urinals are provided, at least one must be accessible:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Type:</strong> Stall-type or wall-hung with elongated rim no higher than <strong>17 inches</strong> above the floor</li><li style={{marginBottom:'6px'}}><strong>Clear floor space:</strong> 30 × 48 inches for a forward approach</li><li style={{marginBottom:'6px'}}><strong>Flush controls:</strong> No higher than 44 inches above the floor</li></ul></>,
    legal: <p>§605.2 "Urinals shall be the stall-type or the wall-hung type with the rim 17 inches maximum above the finish floor or ground." §605.3 "A clear floor or ground space complying with §305 positioned for forward approach shall be provided." §605.4 "Flush controls shall be hand operated or automatic, and shall comply with §309. Flush controls shall be 44 inches maximum above the finish floor."</p>
  },
  {
    number: '§606', title: 'Lavatories & Sinks',
    plain: <><p>Accessible lavatories (bathroom sinks) must allow a <strong>forward approach</strong> in a wheelchair:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Rim height:</strong> 34 inches maximum above the floor</li><li style={{marginBottom:'6px'}}><strong>Knee and toe clearance:</strong> Must be provided underneath</li><li style={{marginBottom:'6px'}}><strong>Faucets:</strong> Operable with one hand, no tight grasping — lever, push, or sensor-operated</li><li style={{marginBottom:'6px'}}><strong>Exposed pipes:</strong> Hot water and drain pipes under the lavatory must be insulated or covered to prevent burns</li></ul></>,
    legal: <p>§606.3 "Lavatories and sinks shall be installed with the front of the higher of the rim or counter surface 34 inches maximum above the finish floor." §606.4 "Faucets shall comply with §309." §606.5 "Water supply and drain pipes under lavatories and sinks shall be insulated or otherwise configured to protect against contact."</p>,
    diagram: <LavatoryDiagram />
  },
  {
    number: '§607', title: 'Bathtubs',
    plain: <><p>Accessible bathtubs need grab bars along the back wall and head end wall, a removable or permanent seat, and clearance for a wheelchair alongside the full length of the tub:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Clear floor space:</strong> 30 × 60 inches alongside the tub, extending its full length</li><li style={{marginBottom:'6px'}}><strong>Seat:</strong> Permanent or removable, 15 inches deep minimum, at the head end</li><li style={{marginBottom:'6px'}}><strong>Grab bars:</strong> On back wall and head-end wall, at 33–36 inches above floor plus a lower bar 8–10 inches above the rim</li><li style={{marginBottom:'6px'}}><strong>Controls:</strong> Between the rim and grab bar, on the end wall opposite the seat</li><li style={{marginBottom:'6px'}}><strong>Shower spray:</strong> Hand-held with a 59-inch hose minimum</li></ul></>,
    legal: <p>§607.2 "A clearance in front of bathtubs shall extend the length of the bathtub and shall be 30 inches wide minimum." §607.4 Grab bars per §607.4.1 and §607.4.2. §607.5 "Controls, faucets, and shower spray units shall be installed on an end wall." §607.6 "A shower spray unit with a hose 59 inches long minimum… shall be provided."</p>,
    diagram: <BathtubDiagram />
  },
  {
    number: '§608', title: 'Shower Compartments',
    plain: <><p>Accessible showers come in two standard types:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Transfer-type:</strong> 36 × 36 inches — the user transfers from a wheelchair onto a built-in seat</li><li style={{marginBottom:'6px'}}><strong>Standard roll-in:</strong> 60 × 30 inches — a wheelchair can roll directly in on the long side</li><li style={{marginBottom:'6px'}}><strong>Alternate roll-in:</strong> 36 × 60 inches with a 36-inch entry on the long side</li></ul><p>All types require grab bars, a hand-held shower spray with 59-inch hose, and controls operable with one hand between 38 and 48 inches above the floor. No curb or threshold (½ inch max if beveled).</p></>,
    legal: <p>§608.2.1 Transfer-type: "36 inches by 36 inches clear inside dimensions." §608.3.1 Standard roll-in: "30 inches minimum by 60 inches minimum clear inside dimensions." §608.6 "A shower spray unit with a hose 59 inches long minimum… shall be provided." §608.5 Controls: "38 inches minimum and 48 inches maximum above the shower floor."</p>,
    diagram: <ShowerDiagram />
  },
  {
    number: '§609', title: 'Grab Bars',
    plain: <><p>Grab bars are life-saving safety features. Requirements:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Diameter:</strong> 1¼ to 2 inches (circular) for a secure grip</li><li style={{marginBottom:'6px'}}><strong>Height:</strong> 33 to 36 inches above the floor</li><li style={{marginBottom:'6px'}}><strong>Wall clearance:</strong> 1½ inches from the wall</li><li style={{marginBottom:'6px'}}><strong>Structural strength:</strong> Must resist 250 pounds of force applied at any point</li><li style={{marginBottom:'6px'}}><strong>No rotation:</strong> Bars must not rotate within their fittings</li></ul></>,
    legal: <p>§609.2.1 Circular: "1¼ inches minimum and 2 inches maximum." §609.3 "The space between the wall and the grab bar shall be 1½ inches." §609.4 "Grab bars, seat walls and seats… shall be mounted at 33 inches minimum and 36 inches maximum above the finish floor." §609.8 "Grab bars… shall be capable of resisting a vertical or horizontal force of 250 pounds."</p>,
    diagram: <GrabBarDetailDiagram />
  },
  {
    number: '§610–612', title: 'Seats, Coat Hooks & Shelves',
    plain: <><p><strong>Shower/tub seats (§610):</strong> Must support 250 lbs and be mounted at 17–19 inches above the floor. Rectangular seats are 15–16 inches deep. L-shaped seats for roll-in showers extend along two walls.</p><p><strong>Coat hooks and shelves (§611):</strong> Must be within reach range — 15 to 48 inches above the floor. Often cited because hooks in toilet stalls and dressing rooms are mounted too high.</p><p><strong>Medicine cabinets (§612):</strong> Usable storage shelf must be 44 inches maximum above the floor.</p></>,
    legal: <p>§610.3 Seats "shall be designed and installed to support a vertical or horizontal force of 250 pounds." §610.3 Height: "17 inches minimum and 19 inches maximum above the finish floor." §611.1 "Coat hooks provided within accessible toilet compartments, or accessible bathing facilities shall be… within one of the reach ranges specified in §308."</p>
  }
];

export default function StandardsCh6() {
  return (
    <ChapterPageLayout
      chapterNum={6}
      title="Plumbing Elements & Facilities"
      range="§601–612"
      overview={<p>Chapter 6 covers all <strong>plumbing-related elements</strong> — drinking fountains, toilet rooms, water closets, urinals, lavatories, bathtubs, showers, grab bars, seats, and accessories. Restroom accessibility is one of the most commonly cited areas in ADA complaints, making this chapter essential for any facility.</p>}
      sections={sections}
    />
  );
}