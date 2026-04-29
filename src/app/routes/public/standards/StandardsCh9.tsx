import ChapterPageLayout from '../../../components/standards/ChapterPageLayout.js';
import CounterDiagram from '../../../components/standards/diagrams/CounterDiagram.jsx';
import DiningSurfaceDiagram from '../../../components/standards/diagrams/DiningSurfaceDiagram.jsx';
import BenchDiagram from '../../../components/standards/diagrams/BenchDiagram.jsx';

const sections = [
  {
    number: '§902', title: 'Dining Surfaces & Work Surfaces',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>At least 5% of tables in restaurants, cafeterias, and workplaces must work for wheelchair users.</li><li style={{marginBottom:"6px"}}>Accessible tables must be 28 to 34 inches high with knee space underneath.</li><li style={{marginBottom:"6px"}}>Look for: all high-top tables, booths only, or tables with solid bases that block wheelchair access.</li></ul></>,
    plain: <><p>Accessible tables, counters, and work surfaces in restaurants, cafeterias, libraries, and workplaces must allow a wheelchair user to pull up comfortably:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Height:</strong> 28 to 34 inches above the floor</li><li style={{marginBottom:'6px'}}><strong>Knee clearance:</strong> 27 inches high minimum, 17 inches deep, and 30 inches wide under the surface</li><li style={{marginBottom:'6px'}}><strong>Toe clearance:</strong> 9 inches high, 17 inches deep under the surface</li></ul><p><strong>At least 5%</strong> of dining and work surfaces must be accessible (per §226 scoping).</p><p><strong>Example:</strong> A restaurant with 20 tables needs at least one with proper height and clearance — not just "any table without a booth."</p></>,
    legal: <p>§902.3 "The tops of dining surfaces and work surfaces shall be 28 inches minimum and 34 inches maximum above the finish floor or ground." §902.2 "Clear floor space complying with §305, positioned for a forward approach, shall be provided. Knee and toe clearance shall be provided complying with §306."</p>,
    diagram: <DiningSurfaceDiagram />
  },
  {
    number: '§903', title: 'Benches',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Benches in locker rooms and dressing rooms must be at least 2 feet wide and 4 feet long.</li><li style={{marginBottom:"6px"}}>The seat must be 17 to 19 inches high with back support.</li><li style={{marginBottom:"6px"}}>There must be clear space at the end for transferring from a wheelchair.</li></ul></>,
    plain: <><p>Accessible benches in dressing rooms, locker rooms, and other areas must meet these specs:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Size:</strong> 24 inches wide minimum, 48 inches long minimum</li><li style={{marginBottom:'6px'}}><strong>Seat height:</strong> 17 to 19 inches above the floor</li><li style={{marginBottom:'6px'}}><strong>Back support:</strong> Must extend from 2 inches above the seat to 18 inches above the seat</li><li style={{marginBottom:'6px'}}><strong>Structural strength:</strong> Must support 250 pounds of force</li><li style={{marginBottom:'6px'}}><strong>Clear floor space:</strong> 30 × 48 inches positioned at the end of the bench for a parallel transfer from a wheelchair</li></ul></>,
    legal: <p>§903.3 "Benches shall have seats that are 24 inches minimum in depth and 48 inches minimum in length." §903.5 Height: "17 inches minimum and 19 inches maximum above the finish floor or ground." §903.4 Back support: "shall be 42 inches minimum in length, extend from a point 2 inches maximum above the seat to a point 18 inches minimum above the seat." §903.6 "250 pounds applied at any point on the seat."</p>,
    diagram: <BenchDiagram />
  },
  {
    number: '§904.3', title: 'Sales & Service Counters',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Service counters (like hotel check-in or pharmacy windows) must have a section no higher than 36 inches.</li><li style={{marginBottom:"6px"}}>The lowered section must be at least 36 inches long.</li><li style={{marginBottom:"6px"}}>Look for: counters that are all above chest height with no lowered section for wheelchair users.</li></ul></>,
    plain: <><p>Counters where business is transacted must have an accessible portion:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Height:</strong> 36 inches maximum above the floor</li><li style={{marginBottom:'6px'}}><strong>Length:</strong> 36 inches minimum, extending the same depth as the sales/service counter top</li><li style={{marginBottom:'6px'}}><strong>Clear floor space:</strong> 30 × 48 inches for either forward or parallel approach</li></ul><p><strong>Example:</strong> A hotel check-in desk at 42 inches is too high. A lowered section of at least 36 inches must be provided so a wheelchair user can interact face-to-face, sign papers, and exchange cards or keys.</p></>,
    legal: <p>§904.3.1 "A portion of the counter surface that is 36 inches long minimum and 36 inches high maximum above the finish floor shall be provided." §904.3 "Where a counter or window serves a function that requires the customer to exchange objects with the service provider, the accessible portion of the counter shall be positioned to accommodate both forward and parallel approaches."</p>,
    diagram: <CounterDiagram />
  },
  {
    number: '§904.4', title: 'Checkout Aisles',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>At least one checkout aisle must be wide enough for a wheelchair — 36 inches minimum.</li><li style={{marginBottom:"6px"}}>The counter at checkout can't be higher than 38 inches.</li><li style={{marginBottom:"6px"}}>Self-checkout stations must also be accessible and within reach.</li><li style={{marginBottom:"6px"}}>Look for: narrow checkout lanes, card readers mounted too high, no accessible self-checkout.</li></ul></>,
    plain: <><p>At least one checkout aisle in each checkout area must be accessible:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Width:</strong> 36 inches minimum clear width</li><li style={{marginBottom:'6px'}}><strong>Counter height:</strong> 38 inches maximum at the checkout counter</li><li style={{marginBottom:'6px'}}><strong>Self-checkout:</strong> At least one must be on an accessible route with controls within reach range</li></ul><p>Where multiple checkout aisles are provided (grocery stores, big box retailers), the scoping table requires accessible aisles based on the total number.</p></>,
    legal: <p>§904.4 "Checkout aisles shall comply with §904.4." §904.4.1 "Aisle width shall be 36 inches minimum." §904.4.2 "Counter surfaces at checkout aisles shall be 38 inches maximum above the finish floor." Per §227.2 scoping: 1 accessible aisle per 1–4 total; 2 for 5–8 total; 3 for 9–15; etc.</p>
  },
  {
    number: '§904.5', title: 'Food Service Lines',
    simple: <><ul style={{paddingLeft:"1.25rem",margin:0}}><li style={{marginBottom:"6px"}}>Buffet lines and cafeteria trays must be at 28 to 34 inches high.</li><li style={{marginBottom:"6px"}}>Self-service items must be within reach (48 inches max).</li><li style={{marginBottom:"6px"}}>The line must be at least 36 inches wide for a wheelchair.</li><li style={{marginBottom:"6px"}}>Look for: sneeze guards that make food unreachable, narrow buffet aisles, tray slides too high.</li></ul></>,
    plain: <><p>Cafeteria-style service lines, buffets, and salad bars must be accessible:</p><ul style={{paddingLeft:'1.25rem',margin:'8px 0'}}><li style={{marginBottom:'6px'}}><strong>Tray slides:</strong> If provided, must be at 28 to 34 inches above the floor and continuous along the line</li><li style={{marginBottom:'6px'}}><strong>Self-service shelves:</strong> Must be within reach range (48 inches max from the floor)</li><li style={{marginBottom:'6px'}}><strong>Width:</strong> The queue must be at least 36 inches wide</li></ul><p><strong>Example:</strong> A cafeteria buffet where the sneeze guard creates a reach depth of over 20 inches makes it impossible for a wheelchair user to serve themselves. The counter design must allow a forward reach within the limits of §308.</p></>,
    legal: <p>§904.5.1 "Where self-service shelves are provided, at least 50 percent of each type shall comply with §308 (reach ranges)." §904.5.2 Tray slides: "28 inches minimum and 34 inches maximum above the finish floor, shall be continuous and shall extend the full length of the food service line."</p>
  }
];

export default function StandardsCh9() {
  return (
    <ChapterPageLayout
      chapterNum={9}
      title="Built-In Elements"
      range="§901–904"
      tldr={<>
        <p style={{ margin: 0 }}><strong>What this chapter covers:</strong> Tables, counters, benches, checkout aisles, and food service lines that people interact with at fixed heights.</p>
        <p style={{ margin: '8px 0 0' }}><strong>The most important thing:</strong> Counter and table heights show up in almost every retail and dining ADA complaint. They're easy to get wrong.</p>
      </>}
      overview={<p>Chapter 9 covers <strong>built-in furnishings and fixtures</strong> — the tables, counters, benches, checkout aisles, and food service lines that people interact with inside buildings. These elements are frequently cited in ADA complaints, especially in restaurants, retail stores, and service counters where a wheelchair user must interact at counter height.</p>}
      sections={sections}
    />
  );
}
