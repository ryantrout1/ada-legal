import React from 'react';
import ChapterPageLayout from '../components/guide/ChapterPageLayout';
import PoolDiagram from '../components/guide/diagrams/PoolDiagram';
import PlayAreaDiagram from '../components/guide/diagrams/PlayAreaDiagram';

const sections = [
  {
    number: '§1002', title: 'Amusement Rides',
    plain: <><p>New and altered amusement rides must provide accessible boarding:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>At least one wheelchair space</strong> on the ride, OR a ride seat designed for transfer from a wheelchair, OR a transfer device (platform) for boarding</li><li style={{marginBottom:'6px'}}><strong>Accessible route</strong> to the ride loading area</li><li style={{marginBottom:'6px'}}><strong>Transfer platforms:</strong> If used, must be 24 inches wide minimum at seat height (14–24 inches)</li></ul><p><strong>Exception:</strong> Rides designed for one rider (like a mechanical bull) or rides that require the rider to walk/climb as part of the experience may be exempt.</p></>,
    legal: <p>§1002.2 "Amusement rides shall provide at least one wheelchair space complying with §1002.4, or at least one amusement ride seat designed for transfer complying with §1002.5, or at least one transfer device complying with §1002.6." §1002.3 "An accessible route complying with Chapter 4 shall be provided to accessible amusement rides."</p>
  },
  {
    number: '§1003', title: 'Recreational Boating Facilities',
    plain: <><p>Marinas and boat launch facilities must have accessible boat slips and boarding piers:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Accessible slips:</strong> Based on total number — 1 accessible slip for the first 25, then 1 per additional 50</li><li style={{marginBottom:'6px'}}><strong>Gangways:</strong> Maximum slope of 1:12 (but when the total length would exceed 80 feet, a 1:10 slope or 80-foot max length is allowed as an exception)</li><li style={{marginBottom:'6px'}}><strong>Cleats and other edge protection:</strong> Shall not protrude into the accessible route on the pier</li></ul></>,
    legal: <p>§1003.2 "Boat slips complying with §1003.3 shall be provided in accordance with Table 1003.2." §1003.3.1 Clear pier space: "60 inches wide minimum and at least as long as the slip." Gangways: §1003.2.1 "Where gangway slope exceeds 1:12, the gangway shall be 80 feet long minimum."</p>
  },
  {
    number: '§1004', title: 'Exercise Machines & Equipment',
    plain: <><p>Fitness centers and gyms must provide an accessible route to <strong>at least one of each type</strong> of exercise machine:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}>One accessible treadmill, one accessible weight machine, one accessible stationary bike, etc.</li><li style={{marginBottom:'6px'}}><strong>Clear floor space:</strong> 30 × 48 inches at each accessible machine</li></ul><p><strong>Example:</strong> A hotel gym with three treadmills and two stationary bikes needs at least one treadmill and one bike on an accessible route with clear floor space. The machines themselves don't need to be modified — just reachable.</p></>,
    legal: <p>§1004.1 "At least one of each type of exercise machine and equipment shall comply with §1004." §236.1 scoping: "At least one of each type shall be on an accessible route and shall have clear floor or ground space complying with §305."</p>
  },
  {
    number: '§1005', title: 'Fishing Piers & Platforms',
    plain: <><p>Accessible fishing piers and platforms must include:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Railing height:</strong> 34 inches maximum along at least 25% of the railings (low enough for a seated person to cast a fishing line over)</li><li style={{marginBottom:'6px'}}><strong>Edge protection:</strong> A curb or barrier to prevent wheelchairs from rolling off</li><li style={{marginBottom:'6px'}}><strong>Clear floor space:</strong> 30 × 48 inches at the accessible fishing positions</li><li style={{marginBottom:'6px'}}><strong>Bait and tackle:</strong> If dispensers are provided, at least one must be within reach range</li></ul></>,
    legal: <p>§1005.1 "At least 25 percent of railings… shall be 34 inches maximum above the ground or deck surface." §1005.2 "Where provided, at least one of each type of dispenser, tackle storage, or device shall comply with §309." §1005.3 Edge protection: "12 inches high minimum."</p>
  },
  {
    number: '§1006', title: 'Golf Facilities',
    plain: <><p>Accessible golf facilities must provide:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Teeing grounds:</strong> Accessible route to each teeing ground</li><li style={{marginBottom:'6px'}}><strong>Putting greens:</strong> Accessible route to each putting green</li><li style={{marginBottom:'6px'}}><strong>Practice ranges:</strong> Accessible route to at least one practice station</li><li style={{marginBottom:'6px'}}><strong>Weather shelters:</strong> Accessible route and clear floor space</li><li style={{marginBottom:'6px'}}>Golf car passages may serve as accessible routes where the course permits golf car use</li></ul></>,
    legal: <p>§1006.2 "An accessible route complying with Chapter 4 shall connect accessible elements within the boundary of the golf course." §1006.3 "Golf car passages complying with §1006.3 shall be permitted to be used as accessible routes." Width: "48 inches wide minimum."</p>
  },
  {
    number: '§1007', title: 'Miniature Golf Facilities',
    plain: <><p>Miniature golf courses must make <strong>at least 50%</strong> of their holes accessible:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}>Accessible holes must be consecutive or connected by an accessible route</li><li style={{marginBottom:'6px'}}>The accessible route can include carpet/turf if firm and stable</li><li style={{marginBottom:'6px'}}>Slopes on the playing surface steeper than 1:4 are exempt from accessibility requirements</li><li style={{marginBottom:'6px'}}>The start of play area must be 48 × 60 inches minimum</li></ul></>,
    legal: <p>§1007.2 "At least 50 percent of holes on miniature golf courses shall comply with §1007.3." §1007.3 "Accessible routes serving miniature golf holes shall comply with Chapter 4 except as modified by §1007.3." §1007.3.1 "Start of play areas shall be 48 inches minimum by 60 inches minimum."</p>
  },
  {
    number: '§1008', title: 'Play Areas',
    plain: <><p>Playgrounds and play areas must provide accessible ground-level and elevated play components:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Ground-level:</strong> At least one of each type of ground-level play component must be on an accessible route</li><li style={{marginBottom:'6px'}}><strong>Elevated:</strong> At least 50% of elevated play components must be connected by an accessible route (ramp system)</li><li style={{marginBottom:'6px'}}><strong>Transfer platforms:</strong> Allowed as an alternative to ramps for elevated components — 14 inches high, 24 × 24 inches minimum</li><li style={{marginBottom:'6px'}}><strong>Ground surfaces:</strong> Must comply with ASTM F1951 (accessibility) and F1292 (impact attenuation)</li></ul></>,
    legal: <p>§1008.2 "At least one of each type of ground level play component that is present shall be on an accessible route." §1008.3 "Where elevated play components are provided, at least 50 percent shall be on an accessible route." §1008.2.6 Ground surfaces: "shall comply with ASTM F1951."</p>,
    diagram: <PlayAreaDiagram />
  },
  {
    number: '§1009', title: 'Swimming Pools, Wading Pools & Spas',
    plain: <><p>Pools and spas require accessible means of entry (also covered in §811):</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Pool lifts:</strong> Must support 300 lbs, seat at 16 inches wide minimum, lower to 18 inches below water level, operable without assistance</li><li style={{marginBottom:'6px'}}><strong>Sloped entries:</strong> Extend to 24–30 inches below water with handrails on both sides</li><li style={{marginBottom:'6px'}}><strong>Transfer walls:</strong> 12 to 16 inches wide, 16 to 19 inches above the deck</li><li style={{marginBottom:'6px'}}><strong>Wading pools:</strong> Must have a sloped entry into the water</li><li style={{marginBottom:'6px'}}><strong>Spas:</strong> At least one accessible means of entry — lift, transfer wall, or accessible steps</li></ul></>,
    legal: <p>§1009.2 Pool lifts: "seat shall be 16 inches wide minimum, immerse to 18 inches below the stationary water level." §1009.3 Sloped entries: "extend to 24 inches minimum and 30 inches maximum below the stationary water level." §1009.4 Transfer walls: "12 inches wide minimum and 16 inches wide maximum, 16 inches high minimum and 19 inches high maximum."</p>,
    diagram: <PoolDiagram />
  },
  {
    number: '§1010', title: 'Shooting Facilities with Firing Positions',
    plain: <><p>At least 5% of shooting positions (but no fewer than one) must be accessible:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Turning space:</strong> 60-inch diameter at the firing position</li><li style={{marginBottom:'6px'}}><strong>Surface:</strong> Level, firm, and stable</li><li style={{marginBottom:'6px'}}>Controls and ammunition storage within reach range</li></ul></>,
    legal: <p>§1010.1 "Where firing positions are provided at shooting facilities, at least 5 percent, but no fewer than one, of each type of firing position shall comply with §1010." Accessible positions must provide turning space per §304 and clear floor space per §305.</p>
  }
];

export default function StandardsCh10() {
  return (
    <ChapterPageLayout
      chapterNum={10}
      title="Recreation Facilities"
      range="§1001–1010"
      overview={<p>Chapter 10 covers accessibility for <strong>recreational facilities</strong> — amusement rides, boating facilities, exercise equipment, fishing piers, golf courses, miniature golf, play areas, swimming pools, and shooting ranges. These standards ensure that people with disabilities can enjoy the same recreational opportunities as everyone else.</p>}
      sections={sections}
    />
  );
}