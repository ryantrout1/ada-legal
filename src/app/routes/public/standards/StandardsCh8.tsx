import ChapterPageLayout from '../../../components/standards/ChapterPageLayout.js';
import AssemblySeatingDiagram from '../../../components/standards/diagrams/AssemblySeatingDiagram.jsx';
import GuestRoomDiagram from '../../../components/standards/diagrams/GuestRoomDiagram.jsx';
import KitchenDiagram from '../../../components/standards/diagrams/KitchenDiagram.jsx';
import DressingRoomDiagram from '../../../components/standards/diagrams/DressingRoomDiagram.jsx';
import DetentionCellDiagram from '../../../components/standards/diagrams/DetentionCellDiagram.jsx';
import TransportationDiagram from '../../../components/standards/diagrams/TransportationDiagram.jsx';
import ResidentialUnitDiagram from '../../../components/standards/diagrams/ResidentialUnitDiagram.jsx';

const sections = [
  {
    number: '§802', title: 'Wheelchair Spaces, Companion Seats & Lines of Sight',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Theaters and stadiums must have wheelchair seats that are at least 36 inches wide.</li><li style={{marginBottom:"6px"}}>A companion seat must be right next to each wheelchair spot — shoulder to shoulder.</li><li style={{marginBottom:"6px"}}>Wheelchair users must be able to see the stage or field, even when people in front stand up.</li><li style={{marginBottom:"6px"}}>Look for: all wheelchair spots in one bad location, no companion seat, blocked sightlines.</li></ul></>,
    plain: <><p>In assembly areas (theaters, stadiums, auditoriums):</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Wheelchair space size:</strong> 36 inches wide × 48 inches deep (forward/rear entry) or 60 inches deep (side entry)</li><li style={{marginBottom:'6px'}}><strong>Companion seat:</strong> Must be directly adjacent — shoulder-to-shoulder with the wheelchair user</li><li style={{marginBottom:'6px'}}><strong>Lines of sight:</strong> Wheelchair users must be able to see over standing spectators when others in front stand up. Wheelchair locations must be <strong>dispersed</strong> — not all clustered in one spot.</li></ul><p><strong>Example:</strong> In a stadium where fans regularly stand, wheelchair seating in the front row isn't sufficient — the view is blocked. Seats must be elevated or positioned to maintain sightlines.</p></>,
    legal: <p>§802.1.2 "Wheelchair spaces shall be 36 inches wide minimum." §802.1.3 "Where a wheelchair space can be entered from the front or rear, the wheelchair space shall be 48 inches deep minimum. Where entered from the side, 60 inches deep minimum." §802.2 Lines of sight: "Where spectators are expected to stand, wheelchair spaces shall provide a line of sight over standing spectators."</p>,
    diagram: <AssemblySeatingDiagram />
  },
  {
    number: '§803', title: 'Dressing, Fitting & Locker Rooms',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>At least one fitting room or dressing room of each type must be big enough for a wheelchair.</li><li style={{marginBottom:"6px"}}>It needs a 5-foot turning space, an accessible bench, and hooks within reach.</li><li style={{marginBottom:"6px"}}>Look for: all fitting rooms too small, no bench, hooks mounted above 4 feet.</li></ul></>,
    plain: <><p>Where dressing rooms or fitting rooms are provided, at least one of each type must be accessible:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Turning space:</strong> 60-inch diameter clear space</li><li style={{marginBottom:'6px'}}><strong>Door:</strong> Cannot swing into the room (or must provide clear space beyond the door swing)</li><li style={{marginBottom:'6px'}}><strong>Bench:</strong> 24 inches wide minimum, 48 inches long minimum, at 17–19 inches height</li><li style={{marginBottom:'6px'}}><strong>Coat hooks and shelves:</strong> Within reach range</li></ul><p><strong>Example:</strong> A retail store with six fitting rooms must make at least one large enough for a wheelchair with an accessible bench.</p></>,
    legal: <p>§803.1 "Where dressing rooms, fitting rooms, or locker rooms are provided, at least one of each type shall comply." §903.3 Benches: "24 inches wide minimum and 48 inches long minimum. The seat shall be at a height of 17 inches minimum and 19 inches maximum above the finish floor." Per §803.4 coat hooks at 48 inches max.</p>,
    diagram: <DressingRoomDiagram />
  },
  {
    number: '§805', title: 'Medical Care & Long-Term Care Patient Rooms',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Hospitals and nursing homes must have accessible patient rooms — at least 10% of them.</li><li style={{marginBottom:"6px"}}>There must be 36 inches of clear space on each side of the bed.</li><li style={{marginBottom:"6px"}}>The room's bathroom must have grab bars and accessible fixtures.</li></ul></>,
    plain: <><p>In hospitals, clinics, and long-term care facilities, accessible patient rooms must include:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Clear floor space:</strong> At least 36 inches on each side of the bed that patients use</li><li style={{marginBottom:'6px'}}><strong>Turning space:</strong> 60-inch turning radius</li><li style={{marginBottom:'6px'}}><strong>Accessible toilet rooms:</strong> Private toilet room with grab bars, accessible fixtures</li><li style={{marginBottom:'6px'}}><strong>Accessible route to bed:</strong> No raised thresholds or obstructions</li></ul><p>At least <strong>10% of patient bedrooms</strong> must provide mobility features. Outpatient facilities must have accessible exam rooms.</p></>,
    legal: <p>§805.1 "Patient bedrooms or resident sleeping rooms required to provide mobility features shall comply with §805." §805.4 "An accessible route complying with §402 shall be provided to each side of the bed with patient access." Toilet rooms must comply with §603.</p>
  },
  {
    number: '§807', title: 'Holding Cells & Housing Cells',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>At least 3% of jail and prison cells must be accessible.</li><li style={{marginBottom:"6px"}}>Accessible cells need turning space, an accessible toilet, and clear space at the bed.</li><li style={{marginBottom:"6px"}}>Holding cells must have accessible benches.</li></ul></>,
    plain: <><p>Accessible jail and prison cells must include:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Turning space:</strong> 60-inch diameter</li><li style={{marginBottom:'6px'}}><strong>Clear floor space:</strong> At beds, desks, and fixtures</li><li style={{marginBottom:'6px'}}><strong>Beds:</strong> Clear space on at least one side</li><li style={{marginBottom:'6px'}}><strong>Toilet:</strong> Accessible water closet with grab bars</li><li style={{marginBottom:'6px'}}><strong>Benches:</strong> In holding cells, accessible benches must be provided</li></ul><p>At least <strong>3% of cells</strong> must be accessible (per §232 scoping).</p></>,
    legal: <p>§807.2 Housing cells: "shall provide mobility features complying with §805." §807.2.2 "Turning space complying with §304 shall be provided within cells." Holding cells: §807.1 "where benches are provided, at least one shall comply with §903."</p>,
    diagram: <DetentionCellDiagram />
  },
  {
    number: '§808', title: 'Courtrooms',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Courtrooms must have wheelchair access to the jury box, witness stand, and attorney tables.</li><li style={{marginBottom:"6px"}}>Spectator seating must include wheelchair spaces.</li><li style={{marginBottom:"6px"}}>Look for: raised jury boxes or witness stands with no ramp access.</li></ul></>,
    plain: <><p>Every courtroom must provide accessible routes and clear floor spaces at:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Jury boxes:</strong> Accessible route to the jury box with wheelchair space inside</li><li style={{marginBottom:'6px'}}><strong>Witness stands:</strong> Accessible route and clear floor space</li><li style={{marginBottom:'6px'}}><strong>Attorney tables:</strong> Clear floor space for a wheelchair</li><li style={{marginBottom:'6px'}}><strong>Spectator seating:</strong> Wheelchair spaces per §221 (assembly area scoping)</li><li style={{marginBottom:'6px'}}><strong>Judges' benches, clerks' stations:</strong> Accessible for employees with disabilities</li></ul></>,
    legal: <p>§808.2 "In each courtroom, at least one of each type of fixed seating area serving a function shall be on an accessible route." §808.3 "Accessible stations shall have clear floor or ground space complying with §305." Per §231, all courtroom components must have accessible features.</p>
  },
  {
    number: '§810', title: 'Transportation Facilities',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Bus stops need a firm, flat boarding area at least 8 feet long and 5 feet wide.</li><li style={{marginBottom:"6px"}}>Train platforms need bumpy warning pads along the full edge.</li><li style={{marginBottom:"6px"}}>Route signs must have large, high-contrast text.</li><li style={{marginBottom:"6px"}}>Look for: bus stops with no paved pad, platforms with no tactile warnings at the edge.</li></ul></>,
    plain: <><p>Bus stops, rail stations, and transit platforms must be accessible:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Bus boarding areas:</strong> Firm, stable surface with a clear area 96 inches long (parallel to the bus) and 60 inches wide (perpendicular), at the same height as the street</li><li style={{marginBottom:'6px'}}><strong>Rail platforms:</strong> Detectable warnings (truncated domes) along the full length of the platform edge</li><li style={{marginBottom:'6px'}}><strong>Level boarding:</strong> Platform height should match the vehicle floor where possible</li><li style={{marginBottom:'6px'}}><strong>Signage:</strong> Route identification signs with visual characters meeting §703</li></ul></>,
    legal: <p>§810.2 Bus boarding areas: "96 inches long minimum perpendicular to the curb or vehicle roadway edge, and 60 inches wide minimum." §810.5.2 "Detectable warning surfaces shall be provided at the boarding edge of each platform." §810.4 Rail platforms: "shall comply with §810.5 through §810.10."</p>,
    diagram: <TransportationDiagram />
  },
  {
    number: '§811', title: 'Swimming Pools, Wading Pools & Spas',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Large pools (over 300 feet of wall) need two ways for disabled people to get in — usually a pool lift and a sloped entry or ramp.</li><li style={{marginBottom:"6px"}}>Smaller pools need at least one accessible entry.</li><li style={{marginBottom:"6px"}}>Pool lifts must work without staff help and hold at least 300 lbs.</li><li style={{marginBottom:"6px"}}>Look for: no pool lift, lift that's broken or locked away, no sloped entry.</li></ul></>,
    plain: <><p>Pools require specific means of accessible entry:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Large pools (300+ linear feet of wall):</strong> Two accessible means of entry required — at least one must be a pool lift or sloped entry</li><li style={{marginBottom:'6px'}}><strong>Smaller pools:</strong> One accessible means of entry</li><li style={{marginBottom:'6px'}}><strong>Pool lifts:</strong> Must be capable of unassisted operation, support 300 lbs, lower to 18 inches below water surface</li><li style={{marginBottom:'6px'}}><strong>Sloped entries:</strong> Must extend to 24–30 inches below water surface with handrails on both sides</li><li style={{marginBottom:'6px'}}><strong>Spas:</strong> At least one accessible means of entry — a pool lift, transfer wall, or accessible steps</li></ul></>,
    legal: <p>§811.1 "Where a pool has over 300 linear feet of pool wall, at least two accessible means of entry shall be provided. Where a pool has 300 or fewer linear feet, at least one shall be provided." §811.2 Pool lifts: "shall be located where the water level does not exceed 48 inches." Seat: "16 inches wide minimum, lower to 18 inches below the stationary water level."</p>
  },
  {
    number: '§806', title: 'Transient Lodging Guest Rooms',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Accessible hotel rooms need a clear 36-inch path from the door to the bed, bathroom, and closet.</li><li style={{marginBottom:"6px"}}>There must be 36 inches of space on both sides of the bed.</li><li style={{marginBottom:"6px"}}>The bathroom needs an accessible shower or tub, and all switches must be within reach.</li><li style={{marginBottom:"6px"}}>Communication rooms need visual alerts for the door knock, phone ring, and fire alarm.</li></ul></>,
    plain: <><p>Accessible hotel and motel guest rooms must include:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Accessible route:</strong> 36 inches clear from entry to all elements (bed, bathroom, desk, closet)</li><li style={{marginBottom:'6px'}}><strong>Bed clearance:</strong> 36 inches on both sides of beds in double-bed rooms</li><li style={{marginBottom:'6px'}}><strong>Bathroom:</strong> Accessible toilet, tub or roll-in shower, lavatory</li><li style={{marginBottom:'6px'}}><strong>Controls:</strong> All switches, thermostats, outlets within reach range</li></ul></>,
    legal: <p>§806.2.2 "An accessible route complying with §402 shall connect all accessible spaces." §806.2.3 "Clear floor space 36 inches wide minimum shall be provided along both sides of a bed." §806.3 Communication features: visible notification for door, phone, alarm.</p>,
    diagram: <><GuestRoomDiagram /><ResidentialUnitDiagram /></>
  },
  {
    number: '§804', title: 'Kitchens & Kitchenettes',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Accessible kitchens need a work surface no higher than 34 inches with knee space underneath.</li><li style={{marginBottom:"6px"}}>At least 40 inches of clearance between counters (60 inches for U-shaped kitchens).</li><li style={{marginBottom:"6px"}}>Appliance controls must be on the front, and the sink must be accessible.</li></ul></>,
    plain: <><p>Accessible kitchens require:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Work surface:</strong> 34 inches max with knee clearance underneath</li><li style={{marginBottom:'6px'}}><strong>Clearance:</strong> 40 inches between opposing counters (60 inches for U-shaped)</li><li style={{marginBottom:'6px'}}><strong>Sink:</strong> 34 inches max with knee clearance</li><li style={{marginBottom:'6px'}}><strong>Appliances:</strong> Clear floor space at each, front-mounted controls</li></ul></>,
    legal: <p>§804.3 "At least one work surface 34 inches maximum." §804.2.1 "Clearance between opposing base cabinets: 40 inches minimum." U-shaped: 60 inches for turning. §804.4 Sinks per §606.</p>,
    diagram: <KitchenDiagram />
  }
];

export default function StandardsCh8() {
  return (
    <ChapterPageLayout
      chapterNum={8}
      title="Special Rooms, Spaces & Elements"
      range="§801–811"
      overview={<p>Chapter 8 addresses accessibility for <strong>specific types of rooms and spaces</strong> — assembly areas, dressing rooms, medical facilities, detention cells, courtrooms, transportation facilities, and swimming pools. Each space type has unique requirements based on how people use it.</p>}
      sections={sections}
    />
  );
}
