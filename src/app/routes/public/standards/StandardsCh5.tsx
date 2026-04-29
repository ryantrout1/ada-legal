import ChapterPageLayout from '../../../components/standards/ChapterPageLayout.js';
import ParkingDiagram from '../../../components/standards/diagrams/ParkingDiagram.jsx';
import HandrailDiagram from '../../../components/standards/diagrams/HandrailDiagram.jsx';
import StairwayDiagram from '../../../components/standards/diagrams/StairwayDiagram.jsx';
import LoadingZoneDiagram from '../../../components/standards/diagrams/LoadingZoneDiagram.jsx';

const sections = [
  {
    number: '§501', title: 'General',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>This chapter covers things outside the building — parking, drop-off zones, stairs, and handrails.</li><li style={{marginBottom:"6px"}}>These are the first things you encounter when arriving at a business.</li><li style={{marginBottom:"6px"}}>If you can't get from the parking lot to the door, nothing else inside matters.</li></ul></>,
    plain: <p>Chapter 5 covers <strong>site-wide elements</strong> that aren't part of the accessible route itself but connect to it — parking, passenger loading zones, and stairways. These are the features you encounter before you even enter a building.</p>,
    legal: <p>§501.1 "The provisions of Chapter 5 shall apply where required by Chapter 2 or where referenced by a requirement in this document."</p>
  },
  {
    number: '§502', title: 'Parking Spaces',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Accessible parking spaces must be at least 8 feet wide with a 5-foot striped aisle next to them.</li><li style={{marginBottom:"6px"}}>Van spaces need more room — 11 feet wide or 8 feet with an 8-foot aisle.</li><li style={{marginBottom:"6px"}}>Each space needs a sign on a post at least 5 feet off the ground.</li><li style={{marginBottom:"6px"}}>Look for: faded or missing stripes, no sign, cars parked in the aisle, surfaces that aren't level.</li></ul></>,
    plain: <><p>Accessible parking spaces have precise dimension requirements:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Car spaces:</strong> 96 inches (8 feet) wide minimum</li><li style={{marginBottom:'6px'}}><strong>Van spaces:</strong> 132 inches (11 feet) wide minimum, or 96 inches with a 96-inch access aisle</li><li style={{marginBottom:'6px'}}><strong>Access aisles:</strong> 60 inches (5 feet) wide minimum, marked to discourage parking</li><li style={{marginBottom:'6px'}}><strong>Vertical clearance:</strong> 98 inches (8 feet 2 inches) minimum for van spaces (the route to/from the space must also have this clearance)</li><li style={{marginBottom:'6px'}}><strong>Surface:</strong> Firm, stable, and slip-resistant; slopes not steeper than 1:48 in any direction</li><li style={{marginBottom:'6px'}}><strong>Signs:</strong> 60 inches minimum above the ground to the bottom of the sign; van spaces marked "van accessible"</li></ul></>,
    legal: <p>§502.2 "Car parking spaces shall be 96 inches wide minimum." §502.3.1 "Access aisles shall be 60 inches wide minimum." §502.4 "Parking spaces and access aisles shall comply with §302. Access aisles shall be at the same level as the parking spaces they serve." §502.6 "Parking space identification signs shall include the International Symbol of Accessibility… 60 inches minimum above the finish ground."</p>,
    diagram: <ParkingDiagram />
  },
  {
    number: '§503', title: 'Passenger Loading Zones',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Drop-off areas (like at hotels or hospitals) need a flat loading zone at least 5 feet wide and 20 feet long.</li><li style={{marginBottom:"6px"}}>There must be enough overhead clearance (9.5 feet) for wheelchair vans.</li><li style={{marginBottom:"6px"}}>Look for: drop-off zones with no flat area, curbs blocking van ramp deployment.</li></ul></>,
    plain: <><p>Passenger loading zones (hotel drop-offs, medical facility entrances, transit stops) must include:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Access aisle:</strong> 60 inches wide minimum, 20 feet long minimum, at the same level as the vehicle pull-up space</li><li style={{marginBottom:'6px'}}><strong>Vertical clearance:</strong> 114 inches (9 feet 6 inches) minimum at vehicle pull-up spaces for van accessibility</li><li style={{marginBottom:'6px'}}>The access aisle must connect to an accessible route into the building</li></ul><p><strong>Example:</strong> A hotel's porte-cochère must have a level loading area with enough room for a side-loading wheelchair van ramp to deploy.</p></>,
    legal: <p>§503.2 "Passenger loading zones shall provide a vehicular pull-up space 96 inches wide minimum and 20 feet long minimum." §503.3 "Access aisles shall be 60 inches wide minimum, 20 feet long minimum, at the same level as the vehicle pull-up space, and shall connect to an accessible route." §503.4 "Vehicle pull-up spaces shall provide a vertical clearance of 114 inches minimum."</p>,
    diagram: <LoadingZoneDiagram />
  },
  {
    number: '§504', title: 'Stairways',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Stair treads must be at least 11 inches deep. Risers must be 4 to 7 inches high.</li><li style={{marginBottom:"6px"}}>No open risers — feet and canes can get caught.</li><li style={{marginBottom:"6px"}}>Step edges must be rounded, not sharp or abrupt.</li><li style={{marginBottom:"6px"}}>Look for: uneven step heights, sharp nosings, open-riser stairs on accessible routes.</li></ul></>,
    plain: <><p>Stairways along accessible routes must be designed for safety:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Treads:</strong> 11 inches minimum depth</li><li style={{marginBottom:'6px'}}><strong>Risers:</strong> 4 to 7 inches high; must be uniform within each flight</li><li style={{marginBottom:'6px'}}><strong>Nosings:</strong> Can't project more than 1½ inches and must be curved or angled (not abrupt) to prevent tripping</li><li style={{marginBottom:'6px'}}><strong>Open risers:</strong> Not permitted on accessible routes (a cane can go through and a foot can get caught)</li></ul></>,
    legal: <p>§504.2 "Treads shall be 11 inches deep minimum." §504.3 "Risers shall be 4 inches high minimum and 7 inches high maximum." §504.4 "Open risers are not permitted." §504.5 "The radius of curvature at the leading edge of the tread shall be ½ inch maximum."</p>,
    diagram: <StairwayDiagram />
  },
  {
    number: '§505', title: 'Handrails',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Handrails must be on both sides of stairs and ramps, 34 to 38 inches high.</li><li style={{marginBottom:"6px"}}>They must be round enough to grip (1.25 to 2 inches across) with 1.5 inches of wall clearance.</li><li style={{marginBottom:"6px"}}>They must extend 12 inches past the top and bottom of stairs/ramps.</li><li style={{marginBottom:"6px"}}>Look for: handrails on only one side, handrails that are too thick or thin, handrails that end abruptly.</li></ul></>,
    plain: <><p>Handrails are critical for people with mobility and balance impairments. Requirements:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Height:</strong> 34 to 38 inches above the walking surface or stair nosing</li><li style={{marginBottom:'6px'}}><strong>Gripping surface:</strong> Circular cross section 1¼ to 2 inches diameter, or non-circular with perimeter 4 to 6¼ inches</li><li style={{marginBottom:'6px'}}><strong>Clearance:</strong> 1½ inches minimum between the handrail and the wall</li><li style={{marginBottom:'6px'}}><strong>Extensions:</strong> At ramps: 12 inches beyond the top and bottom. At stairs: 12 inches beyond the top riser, extending the slope beyond the bottom riser.</li><li style={{marginBottom:'6px'}}><strong>Continuous:</strong> Handrails must be continuous within the full length of stair flights and ramp runs</li></ul></>,
    legal: <p>§505.4 "Top of gripping surfaces of handrails shall be 34 inches minimum and 38 inches maximum above walking surfaces, stair nosings, and ramp surfaces." §505.5 "Handrail gripping surfaces with a circular cross section shall have an outside diameter of 1¼ inches minimum and 2 inches maximum." §505.10 Extensions shall extend 12 inches minimum beyond top and bottom.</p>,
    diagram: <HandrailDiagram />
  }
];

export default function StandardsCh5() {
  return (
    <ChapterPageLayout
      chapterNum={5}
      title="General Site & Building Elements"
      range="§501–505"
      tldr={<>
        <p style={{ margin: 0 }}><strong>What this chapter covers:</strong> What you encounter before going inside — parking spaces, drop-off zones, outdoor stairs, and handrails.</p>
        <p style={{ margin: '8px 0 0' }}><strong>The most important thing:</strong> Accessibility starts in the parking lot. If a wheelchair user can't get out of their car, the rest doesn't help.</p>
      </>}
      overview={<p>Chapter 5 covers the <strong>site-level elements</strong> people encounter before and as they approach a building — parking spaces, passenger loading zones, stairways, and handrails. These requirements work together with Chapter 4 (Accessible Routes) to ensure the full journey from parking lot to building entrance to upper floors is accessible.</p>}
      sections={sections}
    />
  );
}
