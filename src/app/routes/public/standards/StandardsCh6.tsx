import ChapterPageLayout from '../../../components/standards/ChapterPageLayout.js';
import ToiletStallDiagram from '../../../components/standards/diagrams/ToiletStallDiagram.js';
import BathtubDiagram from '../../../components/standards/diagrams/BathtubDiagram.js';
import ShowerDiagram from '../../../components/standards/diagrams/ShowerDiagram.js';
import LavatoryDiagram from '../../../components/standards/diagrams/LavatoryDiagram.js';
import GrabBarDetailDiagram from '../../../components/standards/diagrams/GrabBarDetailDiagram.js';
import DrinkingFountainDiagram from '../../../components/standards/diagrams/DrinkingFountainDiagram.js';
import UrinalDiagram from '../../../components/standards/diagrams/UrinalDiagram.js';

const sections = [
  {
    number: '§602', title: 'Drinking Fountains',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>There must be two types of drinking fountains: one low enough for wheelchair users and one at standing height.</li><li style={{marginBottom:"6px"}}>The low one can't be higher than 36 inches with space underneath for a wheelchair.</li><li style={{marginBottom:"6px"}}>Look for: only one fountain height, no knee clearance, buttons too hard to push.</li></ul></>,
    plain: <><p>Where drinking fountains are provided, there must be <strong>two types</strong>:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Wheelchair accessible:</strong> Spout no higher than 36 inches, with knee and toe clearance underneath for a forward approach</li><li style={{marginBottom:'6px'}}><strong>Standing height:</strong> Spout 38 to 43 inches high for people who have difficulty bending</li></ul><p>Many buildings use a "hi-lo" combination unit that satisfies both requirements. The operable parts (button or lever) must be at the front and operable with one hand.</p></>,
    legal: <p>§602.4 "Spout outlets of drinking fountains for wheelchair users shall be 36 inches maximum above the finish floor." §602.5 "Spout outlets of drinking fountains for standing persons shall be 38 inches minimum and 43 inches maximum above the finish floor." §602.6 "Unit water flow shall be 4 inches high minimum."</p>,
    diagram: <DrinkingFountainDiagram />
  },
  {
    number: '§603', title: 'Toilet & Bathing Rooms',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Accessible restrooms need enough space to turn a wheelchair — a 5-foot circle.</li><li style={{marginBottom:"6px"}}>The door can't swing into the space needed at any fixture (toilet, sink).</li><li style={{marginBottom:"6px"}}>Mirrors must be low enough to see from a wheelchair — bottom of mirror at 40 inches or lower.</li><li style={{marginBottom:"6px"}}>Look for: coat hooks mounted too high, doors that bump into the toilet area.</li></ul></>,
    plain: <><p>Accessible toilet rooms must have:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Turning space:</strong> A 60-inch diameter circle or T-shaped space for wheelchair turning</li><li style={{marginBottom:'6px'}}><strong>Door swing:</strong> The door cannot swing into the required clear floor space at any fixture</li><li style={{marginBottom:'6px'}}><strong>Mirrors:</strong> Bottom edge of the reflecting surface no higher than 40 inches above the floor</li><li style={{marginBottom:'6px'}}><strong>Coat hooks and shelves:</strong> Within reach range — 15 to 48 inches above the floor</li></ul></>,
    legal: <p>§603.2.1 "Turning space complying with §304 shall be provided within the room." §603.2.3 "Doors shall not swing into the clear floor space or clearance required for any fixture." §603.3 "Mirrors… shall be installed with the bottom edge of the reflecting surface 40 inches maximum above the finish floor."</p>
  },
  {
    number: '§604', title: 'Water Closets & Toilet Compartments',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Accessible toilet stalls must be at least 60 inches wide.</li><li style={{marginBottom:"6px"}}>The toilet seat must be 17 to 19 inches high.</li><li style={{marginBottom:"6px"}}>The toilet must be 16 to 18 inches from the side wall (centerline).</li><li style={{marginBottom:"6px"}}>Look for: stalls too narrow for a wheelchair, toilets too close or too far from the wall, stall doors that swing inward.</li></ul></>,
    plain: <><p>The toilet itself and its compartment have detailed requirements:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Seat height:</strong> 17 to 19 inches above the floor</li><li style={{marginBottom:'6px'}}><strong>Centerline:</strong> 16 to 18 inches from the side wall</li><li style={{marginBottom:'6px'}}><strong>Standard compartment:</strong> 60 inches wide minimum, 56 inches deep minimum (wall-mounted) or 59 inches deep (floor-mounted)</li><li style={{marginBottom:'6px'}}><strong>Ambulatory compartment:</strong> 35 to 37 inches wide with grab bars on both sides — for people who can walk but need support</li><li style={{marginBottom:'6px'}}><strong>Door:</strong> Must be self-closing and have a pull on both sides; cannot swing into the required clearance</li></ul></>,
    legal: <p>§604.4 "The seat height of a water closet shall be 17 inches minimum and 19 inches maximum above the finish floor." §604.2 "The water closet shall be positioned with a wall or partition to the rear and to one side. The centerline shall be 16 inches minimum to 18 inches maximum from the side wall." §604.8.1.1 Standard compartment: "60 inches wide minimum."</p>,
    diagram: <ToiletStallDiagram />
  },
  {
    number: '§605', title: 'Urinals',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>At least one urinal must be mounted low — rim no higher than 17 inches from the floor.</li><li style={{marginBottom:"6px"}}>There must be a flat space in front for a wheelchair approach.</li><li style={{marginBottom:"6px"}}>Flush controls must be no higher than 44 inches.</li></ul></>,
    plain: <><p>Where urinals are provided, at least one must be accessible:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Type:</strong> Stall-type or wall-hung with elongated rim no higher than <strong>17 inches</strong> above the floor</li><li style={{marginBottom:'6px'}}><strong>Clear floor space:</strong> 30 × 48 inches for a forward approach</li><li style={{marginBottom:'6px'}}><strong>Flush controls:</strong> No higher than 44 inches above the floor</li></ul></>,
    legal: <p>§605.2 "Urinals shall be the stall-type or the wall-hung type with the rim 17 inches maximum above the finish floor or ground." §605.3 "A clear floor or ground space complying with §305 positioned for forward approach shall be provided." §605.4 "Flush controls shall be hand operated or automatic, and shall comply with §309. Flush controls shall be 44 inches maximum above the finish floor."</p>,
    diagram: <UrinalDiagram />
  },
  {
    number: '§606', title: 'Lavatories & Sinks',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>At least one bathroom sink must be low enough (34 inches max) with knee space underneath for a wheelchair.</li><li style={{marginBottom:"6px"}}>Faucets must work with one hand — lever or sensor, no twist knobs.</li><li style={{marginBottom:"6px"}}>Hot water pipes under the sink must be covered so they don't burn anyone's legs.</li></ul></>,
    plain: <><p>Accessible lavatories (bathroom sinks) must allow a <strong>forward approach</strong> in a wheelchair:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Rim height:</strong> 34 inches maximum above the floor</li><li style={{marginBottom:'6px'}}><strong>Knee and toe clearance:</strong> Must be provided underneath</li><li style={{marginBottom:'6px'}}><strong>Faucets:</strong> Operable with one hand, no tight grasping — lever, push, or sensor-operated</li><li style={{marginBottom:'6px'}}><strong>Exposed pipes:</strong> Hot water and drain pipes under the lavatory must be insulated or covered to prevent burns</li></ul></>,
    legal: <p>§606.3 "Lavatories and sinks shall be installed with the front of the higher of the rim or counter surface 34 inches maximum above the finish floor." §606.4 "Faucets shall comply with §309." §606.5 "Water supply and drain pipes under lavatories and sinks shall be insulated or otherwise configured to protect against contact."</p>,
    diagram: <LavatoryDiagram />
  },
  {
    number: '§607', title: 'Bathtubs',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Accessible bathtubs need grab bars, a seat, and clear floor space alongside the full length of the tub.</li><li style={{marginBottom:"6px"}}>A hand-held shower spray with a 59-inch hose is required.</li><li style={{marginBottom:"6px"}}>Look for: no grab bars, no removable seat, fixed showerhead with no hose.</li></ul></>,
    plain: <><p>Accessible bathtubs need grab bars along the back wall and head end wall, a removable or permanent seat, and clearance for a wheelchair alongside the full length of the tub:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Clear floor space:</strong> 30 × 60 inches alongside the tub, extending its full length</li><li style={{marginBottom:'6px'}}><strong>Seat:</strong> Permanent or removable, 15 inches deep minimum, at the head end</li><li style={{marginBottom:'6px'}}><strong>Grab bars:</strong> On back wall and head-end wall, at 33–36 inches above floor plus a lower bar 8–10 inches above the rim</li><li style={{marginBottom:'6px'}}><strong>Controls:</strong> Between the rim and grab bar, on the end wall opposite the seat</li><li style={{marginBottom:'6px'}}><strong>Shower spray:</strong> Hand-held with a 59-inch hose minimum</li></ul></>,
    legal: <p>§607.2 "A clearance in front of bathtubs shall extend the length of the bathtub and shall be 30 inches wide minimum." §607.4 Grab bars per §607.4.1 and §607.4.2. §607.5 "Controls, faucets, and shower spray units shall be installed on an end wall." §607.6 "A shower spray unit with a hose 59 inches long minimum… shall be provided."</p>,
    diagram: <BathtubDiagram />
  },
  {
    number: '§608', title: 'Shower Compartments',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Accessible showers come in two main types: transfer (36×36 inches with a seat) and roll-in (60×30 inches, no curb).</li><li style={{marginBottom:"6px"}}>Both types need grab bars, a hand-held spray, and controls between 38 and 48 inches high.</li><li style={{marginBottom:"6px"}}>There should be no curb or lip to roll over (½ inch max).</li><li style={{marginBottom:"6px"}}>Look for: high shower curbs, no grab bars, no hand-held spray, controls out of reach.</li></ul></>,
    plain: <><p>Accessible showers come in two standard types:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Transfer-type:</strong> 36 × 36 inches — the user transfers from a wheelchair onto a built-in seat</li><li style={{marginBottom:'6px'}}><strong>Standard roll-in:</strong> 60 × 30 inches — a wheelchair can roll directly in on the long side</li><li style={{marginBottom:'6px'}}><strong>Alternate roll-in:</strong> 36 × 60 inches with a 36-inch entry on the long side</li></ul><p>All types require grab bars, a hand-held shower spray with 59-inch hose, and controls operable with one hand between 38 and 48 inches above the floor. No curb or threshold (½ inch max if beveled).</p></>,
    legal: <p>§608.2.1 Transfer-type: "36 inches by 36 inches clear inside dimensions." §608.3.1 Standard roll-in: "30 inches minimum by 60 inches minimum clear inside dimensions." §608.6 "A shower spray unit with a hose 59 inches long minimum… shall be provided." §608.5 Controls: "38 inches minimum and 48 inches maximum above the shower floor."</p>,
    diagram: <ShowerDiagram />
  },
  {
    number: '§609', title: 'Grab Bars',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Grab bars must be 1.25 to 2 inches across and 1.5 inches from the wall.</li><li style={{marginBottom:"6px"}}>They must hold at least 250 pounds and not spin or rotate.</li><li style={{marginBottom:"6px"}}>They go at 33 to 36 inches above the floor.</li><li style={{marginBottom:"6px"}}>Look for: grab bars that are loose, too thin, too close to the wall, or missing entirely.</li></ul></>,
    plain: <><p>Grab bars are life-saving safety features. Requirements:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Diameter:</strong> 1¼ to 2 inches (circular) for a secure grip</li><li style={{marginBottom:'6px'}}><strong>Height:</strong> 33 to 36 inches above the floor</li><li style={{marginBottom:'6px'}}><strong>Wall clearance:</strong> 1½ inches from the wall</li><li style={{marginBottom:'6px'}}><strong>Structural strength:</strong> Must resist 250 pounds of force applied at any point</li><li style={{marginBottom:'6px'}}><strong>No rotation:</strong> Bars must not rotate within their fittings</li></ul></>,
    legal: <p>§609.2.1 Circular: "1¼ inches minimum and 2 inches maximum." §609.3 "The space between the wall and the grab bar shall be 1½ inches." §609.4 "Grab bars, seat walls and seats… shall be mounted at 33 inches minimum and 36 inches maximum above the finish floor." §609.8 "Grab bars… shall be capable of resisting a vertical or horizontal force of 250 pounds."</p>,
    diagram: <GrabBarDetailDiagram />
  },
  {
    number: '§610–612', title: 'Seats, Coat Hooks & Shelves',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Shower seats must hold 250 lbs and be 17 to 19 inches high.</li><li style={{marginBottom:"6px"}}>Coat hooks in restrooms and dressing rooms must be low enough to reach — 48 inches max.</li><li style={{marginBottom:"6px"}}>Look for: hooks mounted at head height, no seat in the shower, medicine cabinets too high.</li></ul></>,
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
