import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Search, ArrowRight, X, Ruler } from 'lucide-react';

const CONTENT = [
  // Chapter 3: Building Blocks
  { id: "ch3-turning", title: "Turning Space", section: "§304", page: "StandardsCh3", desc: "60-inch diameter or T-shaped turning space for wheelchairs", keywords: "turning space wheelchair circle t-shape maneuver rotate 60 inch diameter", category: "Design Standards", diagram: true },
  { id: "ch3-clearfloor", title: "Clear Floor Space", section: "§305", page: "StandardsCh3", desc: "30×48 inch minimum clear floor space for wheelchair approach", keywords: "clear floor space ground approach forward parallel 30 48 wheelchair", category: "Design Standards", diagram: true },
  { id: "ch3-kneetoe", title: "Knee & Toe Clearance", section: "§306", page: "StandardsCh3", desc: "Clearance envelope under counters, desks, and lavatories", keywords: "knee toe clearance under counter desk lavatory table sink 27 inches", category: "Design Standards", diagram: true },
  { id: "ch3-protruding", title: "Protruding Objects", section: "§307", page: "StandardsCh3", desc: "Wall-mounted objects, cane detection limits — 4 inch max projection", keywords: "protruding objects wall mounted cane detection fire extinguisher 4 inch 27 80", category: "Design Standards", diagram: true },
  { id: "ch3-reach", title: "Reach Ranges", section: "§308", page: "StandardsCh3", desc: "Forward and side reach: 15–48 inches above floor", keywords: "reach range forward side height controls switches outlets 15 48 inches", category: "Design Standards", diagram: true },
  { id: "ch3-operable", title: "Operable Parts", section: "§309", page: "StandardsCh3", desc: "One-hand operation, no tight grasping, 5 lbs max force", keywords: "operable parts controls switches knobs lever force one hand 5 pounds", category: "Design Standards", diagram: true },

  // Chapter 4: Accessible Routes
  { id: "ch4-doors", title: "Doors & Doorways", section: "§404", page: "StandardsCh4", desc: "32-inch clear width, 5 lbs max force, lever hardware", keywords: "door doorway gate width opening force hardware maneuvering clearance 32 inches lever handle", category: "Design Standards", diagram: true },
  { id: "ch4-ramps", title: "Ramps", section: "§405", page: "StandardsCh4", desc: "1:12 max slope, 36 inches wide, landings, handrails", keywords: "ramp slope rise run landing handrail grade 1:12 36 inches 30 inch rise", category: "Design Standards", diagram: true },
  { id: "ch4-curbramps", title: "Curb Ramps", section: "§406", page: "StandardsCh4", desc: "Detectable warnings, flared sides, sidewalk transitions", keywords: "curb ramp sidewalk street crossing detectable warning truncated dome flared", category: "Design Standards", diagram: true },
  { id: "ch4-elevators", title: "Elevators", section: "§407", page: "StandardsCh4", desc: "Cab dimensions, controls, signals, door timing", keywords: "elevator lift cab controls signals braille door timing hall call", category: "Design Standards", diagram: true },

  // Chapter 5: General Site
  { id: "ch5-parking", title: "Parking Spaces", section: "§502", page: "StandardsCh5", desc: "Van spaces 132\" wide, car spaces 96\", access aisle 60\", scoping table", keywords: "parking space accessible van car access aisle how many scoping lot striping sign 132 96 60", category: "Design Standards", diagram: true },
  { id: "ch5-loading", title: "Passenger Loading Zones", section: "§503", page: "StandardsCh5", desc: "96 inches wide, 20 feet long, vertical clearance", keywords: "loading zone passenger drop-off pick-up vehicle curb 96 20 feet", category: "Design Standards", diagram: true },
  { id: "ch5-stairs", title: "Stairways", section: "§504", page: "StandardsCh5", desc: "Uniform risers 4–7 inches, nosings, handrails both sides", keywords: "stairs stairway steps riser tread nosing uniform", category: "Design Standards", diagram: true },
  { id: "ch5-handrails", title: "Handrails", section: "§505", page: "StandardsCh5", desc: "34–38 inches high, 1.25–2 inch diameter, extensions required", keywords: "handrail railing grip height extension diameter 34 38 graspable", category: "Design Standards", diagram: true },

  // Chapter 6: Plumbing
  { id: "ch6-toilets", title: "Toilet Compartments", section: "§604", page: "StandardsCh6", desc: "Centerline 16–18\" from wall, grab bars, seat height 17–19\"", keywords: "toilet water closet bathroom restroom stall compartment grab bar centerline seat height 17 19", category: "Design Standards", diagram: true },
  { id: "ch6-lavatories", title: "Lavatories & Sinks", section: "§606", page: "StandardsCh6", desc: "34-inch max height, knee clearance underneath, pipe protection", keywords: "lavatory sink bathroom faucet pipe protection knee clearance 34 inches", category: "Design Standards", diagram: true },
  { id: "ch6-bathtubs", title: "Bathtubs", section: "§607", page: "StandardsCh6", desc: "30×60 clearance, grab bars, removable seat, 59\" shower spray", keywords: "bathtub tub grab bar seat shower spray clearance 30 60", category: "Design Standards", diagram: true },
  { id: "ch6-showers", title: "Shower Compartments", section: "§608", page: "StandardsCh6", desc: "Transfer shower 36×36, roll-in 60×30, grab bars, folding seat", keywords: "shower transfer roll-in grab bar seat compartment 36 60 30 folding", category: "Design Standards", diagram: true },
  { id: "ch6-grabbars", title: "Grab Bar Details", section: "§609", page: "StandardsCh6", desc: "1.25–2\" diameter, 1.5\" from wall, support 250 lbs", keywords: "grab bar diameter clearance mounting strength installation 250 pounds 1.25 2 inch", category: "Design Standards", diagram: true },
  { id: "ch6-fountains", title: "Drinking Fountains", section: "§611", page: "StandardsCh6", desc: "Wheelchair unit 36\" max, standing unit 38–43\"", keywords: "drinking fountain water cooler bottle filler 36 38 43 wheelchair standing", category: "Design Standards", diagram: true },

  // Chapter 7: Communication
  { id: "ch7-signs", title: "Signs & Signage", section: "§703", page: "StandardsCh7", desc: "Raised characters, Grade 2 Braille, mounting height 48–60\"", keywords: "sign signage braille raised characters mounting height room tactile 48 60", category: "Design Standards", diagram: true },

  // Chapter 8: Special Rooms
  { id: "ch8-assembly", title: "Assembly Seating", section: "§802", page: "StandardsCh8", desc: "Wheelchair spaces, sightlines over standing spectators, companion seats", keywords: "assembly seating wheelchair space companion sightline theater stadium arena 36 48 60", category: "Design Standards", diagram: true },
  { id: "ch8-dressing", title: "Dressing & Fitting Rooms", section: "§803", page: "StandardsCh8", desc: "60\" turning space, bench 24×48, door swings out, full-length mirror", keywords: "dressing fitting locker room changing bench mirror door swing out", category: "Design Standards", diagram: true },
  { id: "ch8-kitchen", title: "Kitchens & Kitchenettes", section: "§804", page: "StandardsCh8", desc: "Work surface 34\" max, 60\" U-turn, 40\" galley clearance", keywords: "kitchen kitchenette counter sink appliance clearance work surface 34 60 40 U-shaped galley", category: "Design Standards", diagram: true },
  { id: "ch8-guestroom", title: "Hotel Guest Rooms", section: "§806", page: "StandardsCh8", desc: "36\" accessible route, bed clearance, accessible bathroom, scoping", keywords: "hotel guest room lodging transient bed clearance bathroom accessible scoping how many", category: "Design Standards", diagram: true },
  { id: "ch8-detention", title: "Detention & Holding Cells", section: "§807", page: "StandardsCh8", desc: "3% mobility features, 2% communication, dispersed among units", keywords: "detention cell jail prison correctional holding 3 percent mobility communication", category: "Design Standards", diagram: true },

  // Chapter 9: Built-in Elements
  { id: "ch9-dining", title: "Dining & Work Surfaces", section: "§902", page: "StandardsCh9", desc: "28–34\" height, knee clearance underneath, 5% of seats accessible", keywords: "dining table work surface desk counter height knee clearance 28 34 5 percent accessible", category: "Design Standards", diagram: true },
  { id: "ch9-benches", title: "Benches", section: "§903", page: "StandardsCh9", desc: "Seat 17–19\" high, 42\" long min, back support, 250 lbs capacity", keywords: "bench seat locker room shower pool 17 19 42 back support 250", category: "Design Standards", diagram: true },
  { id: "ch9-counters", title: "Sales & Service Counters", section: "§904", page: "StandardsCh9", desc: "36\" max height, accessible checkout aisle width", keywords: "counter sales service checkout register cash aisle 36 height accessible", category: "Design Standards", diagram: true },

  // Chapter 10: Recreation
  { id: "ch10-play", title: "Play Areas", section: "§1008", page: "StandardsCh10", desc: "Transfer platform 14\" high, 50% of elevated via ramp, ground-level access", keywords: "playground play area equipment transfer platform ground elevated ramp children 14 50 percent", category: "Design Standards", diagram: true },
  { id: "ch10-pool", title: "Swimming Pools & Spas", section: "§1009", page: "StandardsCh10", desc: "Pool lift, sloped entry, transfer wall — 2 means for large pools", keywords: "pool swimming wading spa hot tub lift sloped entry transfer wall steps 300 linear feet", category: "Design Standards", diagram: true },

  // Know Your Rights
  { id: "guide-intro", title: "Introduction to the ADA", page: "GuideIntroToAda", desc: "What the ADA covers, who it protects, how it's structured across five titles", keywords: "what is ada introduction overview basics titles five structure history", category: "Know Your Rights" },
  { id: "guide-protections", title: "ADA Protections & Who Is Covered", page: "GuideAdaProtections", desc: "Who counts as a person with a disability under the ADA", keywords: "who protected disability rights qualified individual covered definition", category: "Know Your Rights" },
  { id: "guide-service", title: "Service Animals", page: "GuideServiceAnimals", desc: "Rules for service dogs in businesses and public places", keywords: "service animal dog emotional support pet allowed business store restaurant", category: "Know Your Rights" },
  { id: "guide-mobility", title: "Mobility Devices", page: "GuideMobilityDevices", desc: "Wheelchairs, scooters, and other power-driven mobility devices", keywords: "wheelchair scooter mobility device power segway electric", category: "Know Your Rights" },
  { id: "guide-modifications", title: "Reasonable Modifications", page: "GuideReasonableModifications", desc: "When and how businesses must modify their policies", keywords: "reasonable modification accommodation policy change business", category: "Know Your Rights" },
  { id: "guide-communication", title: "Effective Communication", page: "GuideEffectiveCommunication", desc: "Sign language interpreters, Braille, auxiliary aids and services", keywords: "communication interpreter sign language braille auxiliary aids deaf blind hearing", category: "Know Your Rights" },
  { id: "guide-complaint", title: "How to File an ADA Complaint", page: "GuideFilingComplaint", desc: "Step-by-step instructions for reporting violations to the DOJ", keywords: "file complaint report violation doj department justice how sue enforcement", category: "Know Your Rights" },
  { id: "guide-employment", title: "Employment & the ADA (Title I)", page: "GuideEmployment", desc: "Reasonable accommodation, hiring protections, the interactive process, and how to file EEOC complaints", keywords: "employment job work hire fire reasonable accommodation title I EEOC complaint disability workplace ADA", category: "Know Your Rights" },
  { id: "guide-housing", title: "Housing, Apartments & the ADA", page: "GuideHousing", desc: "Which laws apply to housing, Fair Housing Act design requirements, reasonable accommodations for tenants, and filing complaints", keywords: "housing apartment rental tenant landlord fair housing FHA reasonable accommodation modification public housing section 504 grab bar service animal emotional support", category: "Know Your Rights" },
  { id: "guide-legal-options", title: "Your Legal Options After an ADA Violation", page: "GuideLegalOptions", desc: "Compare filing with DOJ, EEOC, HUD vs. hiring a private ADA attorney — what you can recover, deadlines, and which path is right for your situation", keywords: "legal options lawsuit sue attorney lawyer complaint DOJ EEOC HUD file report rights damages fees contingency title I II III fair housing", category: "Know Your Rights" },
  { id: "guide-what-to-expect", title: "What to Expect: The ADA Legal Process", page: "GuideWhatToExpect", desc: "Step-by-step walkthrough from documenting a violation to attorney review, demand letter, settlement, and court — timelines, costs, and common questions", keywords: "legal process what expect demand letter settlement lawsuit court attorney fees timeline cost contingency standing how long", category: "Know Your Rights" },
  { id: "guide-sidewalks", title: "Sidewalks & Pedestrian Access", page: "GuideSidewalks", desc: "Sidewalk width, curb ramps, detectable warnings, pedestrian signals, and filing complaints about broken sidewalks", keywords: "sidewalk curb ramp pedestrian crosswalk detectable warning truncated dome signal crossing street APS", category: "Government" },
  { id: "guide-playgrounds", title: "Accessible Playgrounds", page: "GuidePlaygrounds", desc: "Ground-level and elevated play components, accessible surfaces, transfer platforms, and what parents should look for", keywords: "playground play area park children kids swing slide transfer platform accessible surface rubber wood fiber", category: "Business Compliance" },
  { id: "guide-pools", title: "Swimming Pool Accessibility", page: "GuideSwimmingPools", desc: "Pool lifts, sloped entries, spa access requirements, and obligations for existing hotel and public pools", keywords: "swimming pool spa hot tub wading pool lift sloped entry transfer wall hotel aquatic water park", category: "Business Compliance" },

  // Business Compliance
  { id: "guide-smallbiz", title: "Small Business ADA Guide", page: "GuideSmallBusiness", desc: "ADA essentials every small business owner needs to know", keywords: "small business owner store shop compliance what do I need requirements", category: "Business Compliance" },
  { id: "guide-restaurant", title: "Restaurants & Retail", page: "GuideRestaurantsRetail", desc: "ADA requirements for restaurants, bars, cafes, and retail stores", keywords: "restaurant retail store bar cafe dining accessible table menu counter", category: "Business Compliance" },
  { id: "guide-hotel", title: "Hotels & Lodging", page: "GuideHotelsLodging", desc: "Accessible guest room requirements and scoping", keywords: "hotel motel lodging guest room inn resort bed bathroom accessible", category: "Business Compliance" },
  { id: "guide-medical", title: "Medical Facilities", page: "GuideMedicalFacilities", desc: "ADA rules for hospitals, clinics, doctor and dentist offices", keywords: "medical hospital doctor clinic dentist healthcare office patient exam", category: "Business Compliance" },
  { id: "guide-newconstruction", title: "New Construction Requirements", page: "GuideNewConstruction", desc: "What's required when building new facilities", keywords: "new construction building built design architect permit plan", category: "Business Compliance" },
  { id: "guide-barriers", title: "Barrier Removal", page: "GuideBarrierRemoval", desc: "Existing buildings — what's readily achievable to fix", keywords: "barrier removal existing building renovation alteration readily achievable old", category: "Business Compliance" },
  { id: "guide-tax", title: "ADA Tax Incentives", page: "GuideTaxIncentives", desc: "Tax credits and deductions for accessibility improvements", keywords: "tax credit deduction incentive 5000 cost money save irs", category: "Business Compliance" },
  { id: "guide-parking-req", title: "Parking Requirements Guide", page: "GuideParkingRequirements", desc: "Complete guide to how many accessible parking spaces you need", keywords: "parking accessible van space how many required lot number count", category: "Business Compliance" },
  { id: "guide-parking", title: "Parking Space Design", page: "GuideParking", desc: "Design details — striping, signs, access aisles, slopes", keywords: "parking design layout stripe marking sign access aisle slope surface", category: "Business Compliance" },
  { id: "guide-restrooms", title: "Accessible Restrooms", page: "GuideRestrooms", desc: "Complete guide to building compliant restrooms", keywords: "restroom bathroom toilet accessible stall grab bar lavatory sink", category: "Business Compliance" },
  { id: "guide-ramps", title: "Ramp Requirements", page: "GuideRamps", desc: "Slopes, widths, landings, and handrail specifications", keywords: "ramp slope width landing handrail rise run build install", category: "Business Compliance" },
  { id: "guide-entrances", title: "Accessible Entrances", page: "GuideEntrances", desc: "Door widths, thresholds, vestibules, and approach clearances", keywords: "entrance door vestibule entry accessible front threshold approach", category: "Business Compliance" },
  { id: "guide-signage", title: "Signage Requirements", page: "GuideSignage", desc: "Braille signs, room identification, directional and informational signs", keywords: "sign signage braille room directory wayfinding exit tactile", category: "Business Compliance" },
  { id: "guide-reach", title: "Reach Ranges & Controls", page: "GuideReachRanges", desc: "Height requirements for controls, outlets, switches, and dispensers", keywords: "reach range controls height switch outlet thermostat dispenser", category: "Business Compliance" },
  { id: "guide-turning", title: "Turning Spaces & Handrails", page: "GuideTurningHandrails", desc: "Wheelchair turning clearances and handrail specifications", keywords: "turning space handrail wheelchair circle t-shape maneuvering grip", category: "Business Compliance" },

  // Web & Digital
  { id: "guide-wcag", title: "WCAG 2.1 Explained", page: "GuideWcagExplained", desc: "Web Content Accessibility Guidelines — the four principles", keywords: "wcag web accessibility guidelines perceivable operable understandable robust 2.1", category: "Web & Digital" },
  { id: "guide-webrule", title: "ADA Web Accessibility Rule", page: "GuideWebRule", desc: "DOJ's web accessibility rule for state and local government (Title II)", keywords: "web accessibility rule title ii website digital government 2024 doj", category: "Web & Digital" },
  { id: "guide-webfirst", title: "Web Accessibility First Steps", page: "GuideWebFirstSteps", desc: "Getting started making your website accessible", keywords: "web accessibility start begin first steps how website fix", category: "Web & Digital" },
  { id: "guide-webtesting", title: "Web Accessibility Testing Tools", page: "GuideWebTesting", desc: "Free and paid tools for testing your website", keywords: "web testing tools audit scan accessibility checker wave axe lighthouse", category: "Web & Digital" },
  { id: "guide-social", title: "Social Media Accessibility", page: "GuideSocialMedia", desc: "Making posts accessible on Instagram, Facebook, X, and more", keywords: "social media instagram facebook twitter alt text caption video image", category: "Web & Digital" },
  { id: "guide-documents", title: "Accessible Documents", page: "GuideAccessibleDocuments", desc: "Making PDFs, Word docs, and presentations accessible", keywords: "document pdf word accessible heading alt text reading order powerpoint", category: "Web & Digital" },
  { id: "guide-digital-barriers", title: "Website & App Barriers: Your Rights", page: "GuideDigitalBarriers", desc: "What counts as a digital ADA violation, how to document website barriers, your legal options, lawsuit trends, and why accessibility overlays don't help", keywords: "website app digital barrier screen reader keyboard caption alt text accessibility overlay widget inaccessible online WCAG 2.1 lawsuit", category: "Web & Digital" },

  // Government
  { id: "guide-titleii", title: "Title II — State & Local Government", page: "GuideTitleII", desc: "Government obligations under Title II of the ADA", keywords: "title ii 2 government state local city county municipal public", category: "Government" },
  { id: "guide-programaccess", title: "Program Access", page: "GuideProgramAccess", desc: "Making government programs and services accessible", keywords: "program access government service activity building department", category: "Government" },
  { id: "guide-coordinators", title: "ADA Coordinators", page: "GuideAdaCoordinators", desc: "When and how to designate a government ADA coordinator", keywords: "ada coordinator officer government designated employee 50 required", category: "Government" },
  { id: "guide-voting", title: "Accessible Voting", page: "GuideVoting", desc: "Polling place accessibility and voting rights", keywords: "voting poll election ballot accessible booth machine curbside", category: "Government" },
  { id: "guide-education", title: "Education & Schools", page: "GuideEducation", desc: "ADA requirements in K-12 schools and higher education", keywords: "school education university college student classroom campus", category: "Government" },
  { id: "guide-criminal", title: "Criminal Justice", page: "GuideCriminalJustice", desc: "ADA in courts, jails, and law enforcement encounters", keywords: "court jail prison law enforcement police criminal justice arrest", category: "Government" },
  { id: "guide-emergency", title: "Emergency Management", page: "GuideEmergencyManagement", desc: "Accessible emergency plans, shelters, and evacuations", keywords: "emergency evacuation shelter disaster plan fire alarm notification", category: "Government" },
];

function searchContent(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const qWords = q.split(/\s+/).filter(w => w.length >= 2);
  if (qWords.length === 0) return [];

  const scored = CONTENT.map(item => {
    const searchable = `${item.title} ${item.section || ''} ${item.desc} ${item.keywords} ${item.category}`.toLowerCase();
    let score = 0;
    if (searchable.includes(q)) score += 10;
    for (const word of qWords) {
      if (searchable.includes(word)) score += 2;
      const words = searchable.split(/\s+/);
      for (const sw of words) {
        if (sw.startsWith(word) && !searchable.includes(word)) score += 1;
      }
    }
    const sectionMatch = q.match(/§?\d{3,4}/);
    if (sectionMatch && item.section && item.section.includes(sectionMatch[0].replace('§', ''))) {
      score += 15;
    }
    if (item.diagram && score > 0) score += 1;
    return { ...item, score };
  })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return scored;
}

const CAT_COLORS = {
  "Design Standards": { bg: 'rgba(194,65,12,0.1)', text: '#C2410C', border: 'rgba(194,65,12,0.2)' },
  "Know Your Rights": { bg: 'rgba(22,163,98,0.1)', text: '#16A362', border: 'rgba(22,163,98,0.2)' },
  "Business Compliance": { bg: 'rgba(37,99,235,0.1)', text: '#2563EB', border: 'rgba(37,99,235,0.2)' },
  "Web & Digital": { bg: 'rgba(124,58,237,0.1)', text: '#7C3AED', border: 'rgba(124,58,237,0.2)' },
  "Government": { bg: 'rgba(217,119,6,0.1)', text: '#D97706', border: 'rgba(217,119,6,0.2)' },
};

const STARTERS = [
  { label: "Parking spaces", q: "parking spaces" },
  { label: "Grab bars", q: "grab bar" },
  { label: "Door width", q: "door width" },
  { label: "Ramp slope", q: "ramp slope" },
  { label: "Restrooms", q: "restroom bathroom" },
  { label: "Service animals", q: "service animal" },
  { label: "Small business", q: "small business" },
  { label: "Web accessibility", q: "web accessibility" },
];

export default function ADAAssistant() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const results = useMemo(() => searchContent(query), [query]);
  const showResults = (focused || query.length >= 2) && results.length > 0;
  const showStarters = !query && !showResults;

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setQuery('');
      setFocused(false);
      inputRef.current?.blur();
    }
  };

  const handleStarterClick = (text) => {
    setQuery(text);
    setFocused(true);
    inputRef.current?.focus();
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} style={{ maxWidth: '520px', width: '100%', position: 'relative' }}>
      {/* Search input */}
      <div role="search" aria-label="Search ADA standards">
        <label htmlFor="ada-search-input" className="sr-only">Search ADA standards and guides</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            color: '#64748B', pointerEvents: 'none'
          }} />
          <input
            id="ada-search-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search ADA standards, guides, diagrams..."
            aria-label="Search ADA standards and guides"
            aria-expanded={showResults}
            aria-controls="ada-search-results"
            role="combobox"
            autoComplete="off"
            style={{
              width: '100%', padding: '14px 44px 14px 44px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              background: 'rgba(255,255,255,0.06)', color: 'white',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px', outline: 'none',
              minHeight: '48px', boxSizing: 'border-box',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={e => e.target.style.borderColor = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'rgba(255,255,255,0.12)'; }}
          />
          {query && (
            <button
              onClick={clearSearch}
              aria-label="Clear search"
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px',
                width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer'
              }}
            >
              <X size={14} style={{ color: '#94A3B8' }} />
            </button>
          )}
        </div>
      </div>

      {/* Quick-jump topic chips */}
      {showStarters && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
          {STARTERS.map((s, i) => (
            <button
              key={i}
              onClick={() => handleStarterClick(s.q)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '100px', padding: '6px 14px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.78rem',
                color: '#CBD5E1', cursor: 'pointer',
                transition: 'all 0.2s', lineHeight: 1.4
              }}
              onMouseEnter={e => { e.target.style.background = 'rgba(194,65,12,0.15)'; e.target.style.borderColor = 'rgba(194,65,12,0.3)'; e.target.style.color = '#FED7AA'; }}
              onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = '#CBD5E1'; }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Live search results */}
      {showResults && (
        <div
          id="ada-search-results"
          role="listbox"
          aria-label="Search results"
          style={{
            marginTop: '8px',
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            maxHeight: '420px',
            overflowY: 'auto'
          }}
        >
          <div style={{
            padding: '10px 16px 6px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94A3B8'
          }}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </div>

          {results.map((item) => {
            const cat = CAT_COLORS[item.category] || CAT_COLORS["Design Standards"];
            return (
              <Link
                key={item.id}
                to={createPageUrl(item.page)}
                role="option"
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', textDecoration: 'none',
                  borderTop: '1px solid #F1F5F9',
                  transition: 'background 0.15s', cursor: 'pointer'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAF9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                onClick={() => { setQuery(''); setFocused(false); }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
                    <span style={{
                      fontFamily: 'Fraunces, serif', fontSize: '0.95rem', fontWeight: 700,
                      color: '#1A1F2B'
                    }}>
                      {item.title}
                    </span>
                    {item.section && (
                      <span style={{
                        fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 600,
                        color: '#C2410C', background: 'rgba(194,65,12,0.08)',
                        padding: '1px 6px', borderRadius: '4px'
                      }}>
                        {item.section}
                      </span>
                    )}
                    {item.diagram && (
                      <span style={{
                        fontFamily: 'Manrope, sans-serif', fontSize: '0.65rem', fontWeight: 600,
                        color: cat.text, background: cat.bg, border: `1px solid ${cat.border}`,
                        padding: '1px 6px', borderRadius: '4px',
                        display: 'inline-flex', alignItems: 'center', gap: '3px'
                      }}>
                        <Ruler size={10} /> Interactive Diagram
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
                    color: '#64748B', margin: 0, lineHeight: 1.4
                  }}>
                    {item.desc}
                  </p>
                  <span style={{
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.65rem', fontWeight: 600,
                    color: cat.text, marginTop: '2px', display: 'inline-block'
                  }}>
                    {item.category}
                  </span>
                </div>
                <ArrowRight size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
              </Link>
            );
          })}

          {/* Violation CTA */}
          <Link
            to={createPageUrl('Intake')}
            onClick={() => { setQuery(''); setFocused(false); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', textDecoration: 'none',
              borderTop: '1px solid #F1F5F9',
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBF7 100%)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#FFF7ED'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #FFF7ED 0%, #FFFBF7 100%)'}
          >
            <div>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', fontWeight: 600,
                color: '#C2410C'
              }}>
                Experienced a violation?
              </span>
              <span style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
                color: '#64748B', marginLeft: '6px'
              }}>
                Report it — we'll connect you with an attorney.
              </span>
            </div>
            <ArrowRight size={16} style={{ color: '#C2410C', flexShrink: 0 }} />
          </Link>
        </div>
      )}

      {/* No results message */}
      {query.length >= 2 && focused && results.length === 0 && (
        <div style={{
          marginTop: '8px', background: 'white', border: '1px solid #E2E8F0',
          borderRadius: '14px', padding: '20px', textAlign: 'center',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
        }}>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem', color: '#64748B', margin: 0 }}>
            No results for "{query}" — try different keywords or browse the categories below.
          </p>
        </div>
      )}

      {/* Screen reader live region */}
      <div aria-live="polite" className="sr-only">
        {showResults ? `${results.length} results found` : ''}
      </div>
    </div>
  );
}