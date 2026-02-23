import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { base44 } from '@/api/base44Client';
import { Send, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';
import LogoBrand from '../LogoBrand';
import AutoCiteLinks from './AutoCiteLinks';

const CONTENT_MAP = [
  { id: "ch3-turning", title: "Turning Space (§304)", page: "StandardsCh3", section: "304", desc: "60-inch diameter or T-shaped turning space", keywords: "turning space wheelchair circle t-shape maneuver", diagram: true },
  { id: "ch3-clearfloor", title: "Clear Floor Space (§305)", page: "StandardsCh3", section: "305", desc: "30×48 inch minimum clear floor space", keywords: "clear floor space ground approach forward parallel", diagram: true },
  { id: "ch3-kneetoe", title: "Knee & Toe Clearance (§306)", page: "StandardsCh3", section: "306", desc: "Clearance under counters, desks, lavatories", keywords: "knee toe clearance under counter desk lavatory", diagram: true },
  { id: "ch3-protruding", title: "Protruding Objects (§307)", page: "StandardsCh3", section: "307", desc: "Wall-mounted objects, cane detection limits", keywords: "protruding objects wall mounted cane detection fire extinguisher", diagram: true },
  { id: "ch3-reach", title: "Reach Ranges (§308)", page: "StandardsCh3", section: "308", desc: "Forward and side reach: 15-48 inches", keywords: "reach range forward side height controls switches", diagram: true },
  { id: "ch3-operable", title: "Operable Parts (§309)", page: "StandardsCh3", section: "309", desc: "One-hand operation, 5 lbs max force", keywords: "operable parts controls switches knobs lever force", diagram: true },
  { id: "ch4-doors", title: "Doors & Gates (§404)", page: "StandardsCh4", section: "404", desc: "32-inch clear width, 5 lbs force, lever hardware", keywords: "door doorway gate width opening force hardware maneuvering clearance", diagram: true },
  { id: "ch4-ramps", title: "Ramps (§405)", page: "StandardsCh4", section: "405", desc: "1:12 max slope, 36 inches wide, landings", keywords: "ramp slope rise run landing handrail grade", diagram: true },
  { id: "ch4-curbramps", title: "Curb Ramps (§406)", page: "StandardsCh4", section: "406", desc: "Detectable warnings, flared sides, transitions", keywords: "curb ramp sidewalk street crossing detectable warning truncated dome", diagram: true },
  { id: "ch4-elevators", title: "Elevators (§407)", page: "StandardsCh4", section: "407", desc: "Cab dimensions, controls, signals, door timing", keywords: "elevator lift cab controls signals braille door timing", diagram: true },
  { id: "ch5-parking", title: "Parking Spaces (§502)", page: "StandardsCh5", section: "502", desc: "Van 132in wide, car 96in, scoping table", keywords: "parking space accessible van car access aisle how many scoping", diagram: true },
  { id: "ch5-loading", title: "Loading Zones (§503)", page: "StandardsCh5", section: "503", desc: "96 inches wide, 20 feet long, vertical clearance", keywords: "loading zone passenger drop-off pick-up vehicle", diagram: true },
  { id: "ch5-stairs", title: "Stairways (§504)", page: "StandardsCh5", section: "504", desc: "Uniform risers, nosings, handrails both sides", keywords: "stairs stairway steps riser tread nosing", diagram: true },
  { id: "ch5-handrails", title: "Handrails (§505)", page: "StandardsCh5", section: "505", desc: "34-38 inches high, extensions, graspable", keywords: "handrail railing grip height extension diameter", diagram: true },
  { id: "ch6-toilets", title: "Toilet Compartments (§604)", page: "StandardsCh6", section: "604", desc: "Centerline, grab bars, seat height", keywords: "toilet water closet bathroom restroom stall compartment grab bar", diagram: true },
  { id: "ch6-lavatories", title: "Lavatories & Sinks (§606)", page: "StandardsCh6", section: "606", desc: "34-inch max height, knee clearance, pipe protection", keywords: "lavatory sink bathroom faucet pipe protection knee clearance", diagram: true },
  { id: "ch6-bathtubs", title: "Bathtubs (§607)", page: "StandardsCh6", section: "607", desc: "Clearance, grab bars, seat, shower spray", keywords: "bathtub tub grab bar seat shower spray clearance", diagram: true },
  { id: "ch6-showers", title: "Shower Compartments (§608)", page: "StandardsCh6", section: "608", desc: "Transfer 36x36, roll-in 60x30, grab bars", keywords: "shower transfer roll-in grab bar seat compartment", diagram: true },
  { id: "ch6-grabbars", title: "Grab Bar Details (§609)", page: "StandardsCh6", section: "609", desc: "Diameter, wall clearance, 250 lbs strength", keywords: "grab bar diameter clearance mounting strength installation", diagram: true },
  { id: "ch6-fountains", title: "Drinking Fountains (§611)", page: "StandardsCh6", section: "611", desc: "Wheelchair and standing height units", keywords: "drinking fountain water cooler bottle filler", diagram: true },
  { id: "ch7-signs", title: "Signs (§703)", page: "StandardsCh7", section: "703", desc: "Raised characters, Braille, mounting height", keywords: "sign signage braille raised characters mounting height room", diagram: true },
  { id: "ch8-assembly", title: "Assembly Seating (§802)", page: "StandardsCh8", section: "802", desc: "Wheelchair spaces, sightlines, companion seats", keywords: "assembly seating wheelchair space companion sightline theater stadium", diagram: true },
  { id: "ch8-dressing", title: "Dressing Rooms (§803)", page: "StandardsCh8", section: "803", desc: "Turning space, bench, mirror, door swing", keywords: "dressing fitting locker room changing room bench mirror", diagram: true },
  { id: "ch8-kitchen", title: "Kitchens (§804)", page: "StandardsCh8", section: "804", desc: "Work surface height, clearance, appliances", keywords: "kitchen kitchenette counter sink appliance clearance", diagram: true },
  { id: "ch8-guestroom", title: "Guest Rooms (§806)", page: "StandardsCh8", section: "806", desc: "Accessible route, bed clearance, bathroom", keywords: "hotel guest room lodging transient bed clearance bathroom", diagram: true },
  { id: "ch8-detention", title: "Detention Cells (§807)", page: "StandardsCh8", section: "807", desc: "3% mobility, 2% communication, dispersed", keywords: "detention cell jail prison correctional holding", diagram: true },
  { id: "ch9-dining", title: "Dining Surfaces (§902)", page: "StandardsCh9", section: "902", desc: "28-34 inches high, knee clearance, 5% accessible", keywords: "dining table work surface desk counter height knee clearance", diagram: true },
  { id: "ch9-benches", title: "Benches (§903)", page: "StandardsCh9", section: "903", desc: "17-19 inches high, back support, 250 lbs", keywords: "bench seat locker room shower pool", diagram: true },
  { id: "ch9-counters", title: "Sales Counters (§904)", page: "StandardsCh9", section: "904", desc: "36 inches max height, checkout aisle width", keywords: "counter sales service checkout register cash", diagram: true },
  { id: "ch10-play", title: "Play Areas (§1008)", page: "StandardsCh10", section: "1008", desc: "Transfer platform, ground-level, elevated", keywords: "playground play area equipment transfer platform ground elevated", diagram: true },
  { id: "ch10-pool", title: "Swimming Pools (§1009)", page: "StandardsCh10", section: "1009", desc: "Pool lift, sloped entry, transfer wall", keywords: "pool swimming wading spa hot tub lift sloped entry", diagram: true },
  { id: "guide-intro", title: "Introduction to the ADA", page: "GuideIntroToAda", desc: "What the ADA covers, who it protects, five titles", keywords: "what is ada introduction overview basics titles" },
  { id: "guide-complaint", title: "How to File an ADA Complaint", page: "GuideFilingComplaint", desc: "Step-by-step instructions for filing with DOJ", keywords: "file complaint report violation doj department justice" },
  { id: "guide-protections", title: "ADA Protections", page: "GuideAdaProtections", desc: "Who is protected, what counts as a disability", keywords: "who protected disability rights qualified individual" },
  { id: "guide-service", title: "Service Animals", page: "GuideServiceAnimals", desc: "Rules for service dogs, emotional support animals", keywords: "service animal dog emotional support animal pet" },
  { id: "guide-mobility", title: "Mobility Devices", page: "GuideMobilityDevices", desc: "Wheelchairs, scooters, other power-driven devices", keywords: "wheelchair scooter mobility device power segway" },
  { id: "guide-modifications", title: "Reasonable Modifications", page: "GuideReasonableModifications", desc: "When businesses must modify policies", keywords: "reasonable modification accommodation policy change" },
  { id: "guide-communication", title: "Effective Communication", page: "GuideEffectiveCommunication", desc: "Sign language, Braille, auxiliary aids", keywords: "communication interpreter sign language braille auxiliary aids deaf blind" },
  { id: "guide-parking-req", title: "Parking Requirements Guide", page: "GuideParkingRequirements", desc: "Complete guide to accessible parking rules", keywords: "parking accessible van space how many required lot" },
  { id: "guide-parking", title: "Parking Design", page: "GuideParking", desc: "Design details for accessible parking spaces", keywords: "parking design layout stripe marking sign" },
  { id: "guide-restrooms", title: "Restroom Requirements", page: "GuideRestrooms", desc: "Complete guide to accessible restrooms", keywords: "restroom bathroom toilet accessible stall grab bar" },
  { id: "guide-ramps", title: "Ramp Requirements", page: "GuideRamps", desc: "Slope, width, landings, handrails", keywords: "ramp slope width landing handrail rise" },
  { id: "guide-entrances", title: "Entrances", page: "GuideEntrances", desc: "Accessible entrances, doors, vestibules", keywords: "entrance door vestibule entry accessible front" },
  { id: "guide-signage", title: "Signage Guide", page: "GuideSignage", desc: "Braille signs, room signs, directional signs", keywords: "sign signage braille room directory wayfinding" },
  { id: "guide-smallbiz", title: "Small Business Guide", page: "GuideSmallBusiness", desc: "ADA essentials for small business owners", keywords: "small business owner store shop compliance" },
  { id: "guide-restaurant", title: "Restaurants & Retail", page: "GuideRestaurantsRetail", desc: "ADA rules for restaurants, stores, retail", keywords: "restaurant retail store bar cafe dining accessible" },
  { id: "guide-hotel", title: "Hotels & Lodging", page: "GuideHotelsLodging", desc: "Accessible guest room requirements", keywords: "hotel motel lodging guest room inn resort" },
  { id: "guide-medical", title: "Medical Facilities", page: "GuideMedicalFacilities", desc: "ADA rules for doctors, hospitals, clinics", keywords: "medical hospital doctor clinic dentist healthcare" },
  { id: "guide-newconstruction", title: "New Construction", page: "GuideNewConstruction", desc: "Requirements for new buildings", keywords: "new construction building built design architect" },
  { id: "guide-barriers", title: "Barrier Removal", page: "GuideBarrierRemoval", desc: "Existing buildings, readily achievable standard", keywords: "barrier removal existing building renovation alteration readily achievable" },
  { id: "guide-tax", title: "Tax Incentives", page: "GuideTaxIncentives", desc: "Tax credits and deductions for ADA compliance", keywords: "tax credit deduction incentive 5000 cost" },
  { id: "guide-reach", title: "Reach Ranges & Controls", page: "GuideReachRanges", desc: "Height limits for controls and switches", keywords: "reach range controls height switch outlet thermostat" },
  { id: "guide-turning", title: "Turning Space & Handrails", page: "GuideTurningHandrails", desc: "Wheelchair turning and handrail requirements", keywords: "turning space handrail wheelchair circle t-shape" },
  { id: "guide-wcag", title: "WCAG Explained", page: "GuideWcagExplained", desc: "Web Content Accessibility Guidelines overview", keywords: "wcag web accessibility guidelines perceivable operable" },
  { id: "guide-webrule", title: "ADA Web Accessibility Rule", page: "GuideWebRule", desc: "DOJ's 2024 web accessibility rule for Title II", keywords: "web accessibility rule title ii website digital" },
  { id: "guide-webfirst", title: "Web Accessibility First Steps", page: "GuideWebFirstSteps", desc: "Getting started with web accessibility", keywords: "web accessibility start begin first steps how" },
  { id: "guide-webtesting", title: "Web Testing Tools", page: "GuideWebTesting", desc: "Tools for testing website accessibility", keywords: "web testing tools audit scan accessibility checker" },
  { id: "guide-social", title: "Social Media Accessibility", page: "GuideSocialMedia", desc: "Making social media posts accessible", keywords: "social media instagram facebook twitter alt text caption" },
  { id: "guide-documents", title: "Accessible Documents", page: "GuideAccessibleDocuments", desc: "Making PDFs, Word docs, presentations accessible", keywords: "document pdf word accessible heading alt text reading order" },
  { id: "guide-titleii", title: "Title II Overview", page: "GuideTitleII", desc: "State and local government obligations", keywords: "title ii 2 government state local city county municipal" },
  { id: "guide-programaccess", title: "Program Access", page: "GuideProgramAccess", desc: "Government program accessibility requirements", keywords: "program access government service activity" },
  { id: "guide-coordinators", title: "ADA Coordinators", page: "GuideAdaCoordinators", desc: "Government ADA coordinator requirements", keywords: "ada coordinator officer government designated employee" },
  { id: "guide-voting", title: "Voting Accessibility", page: "GuideVoting", desc: "Accessible polling places and voting", keywords: "voting poll election ballot accessible" },
  { id: "guide-education", title: "Education", page: "GuideEducation", desc: "ADA in schools and higher education", keywords: "school education university college student classroom" },
  { id: "guide-criminal", title: "Criminal Justice", page: "GuideCriminalJustice", desc: "ADA in courts, jails, law enforcement", keywords: "court jail prison law enforcement police criminal justice" },
  { id: "guide-emergency", title: "Emergency Management", page: "GuideEmergencyManagement", desc: "Accessible emergency planning and shelters", keywords: "emergency evacuation shelter disaster plan" },
];

const CONTENT_INDEX = Object.fromEntries(CONTENT_MAP.map(c => [c.id, c]));

const SYSTEM_PROMPT = `You are the ADA Standards Assistant for ADA Legal Link. Your job is to give a BRIEF direct answer and identify which pages on our site the user should visit for full details.

RESPONSE FORMAT — You MUST respond in this exact JSON format:
{
  "answer": "Your brief 2-4 sentence answer here. Include key measurements. Use §xxx format for section references.",
  "results": ["content_id_1", "content_id_2", "content_id_3"]
}

The "results" array should contain 2-4 content IDs from this list (pick the most relevant):
${CONTENT_MAP.map(c => `${c.id}: ${c.title} - ${c.desc}`).join('\n')}

RULES:
- answer: Be direct. Lead with the specific measurement or requirement. Max 3-4 sentences.
- answer: Always cite §section numbers.
- answer: Never say "check with local authorities" — these are FEDERAL standards.
- results: Pick 2-4 most relevant content IDs. Put the single best match first.
- results: If a diagram exists for the topic, prioritize that content ID.
- If asked for legal advice, say "For legal advice, consult an ADA attorney" and still show relevant content pages.
- If the question is not about ADA, say so politely and suggest what you can help with.`;

const STARTERS = [
  "How many accessible parking spaces does my lot need?",
  "What are the grab bar requirements for bathrooms?",
  "What width must accessible doorways be?",
  "I'm renovating a restaurant — what ADA rules apply?"
];

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', padding: '16px 0' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          width: '7px', height: '7px', borderRadius: '50%', background: '#94A3B8',
          display: 'inline-block',
          animation: `adaPulse 1.2s ease-in-out ${i * 0.2}s infinite`
        }} />
      ))}
    </div>
  );
}

function ResultCard({ item }) {
  return (
    <Link
      to={createPageUrl(item.page)}
      aria-label={`${item.title} — ${item.desc}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        className="ada-result-card"
        style={{
          background: 'white', border: '1px solid #E2E8F0',
          borderRadius: '12px', padding: '16px 20px',
          transition: 'all 0.2s', cursor: 'pointer'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = '#C2410C';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(194,65,12,0.1)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = '#E2E8F0';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'none';
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span style={{
                fontFamily: 'Fraunces, serif', fontSize: '1rem', fontWeight: 700,
                color: 'var(--slate-900)'
              }}>
                {item.title}
              </span>
              {item.diagram && (
                <span style={{
                  background: '#FEF1EC', color: '#C2410C',
                  fontFamily: 'Manrope, sans-serif', fontSize: '0.7rem', fontWeight: 700,
                  padding: '2px 8px', borderRadius: '100px',
                  whiteSpace: 'nowrap'
                }}>
                  📐 Interactive Diagram
                </span>
              )}
            </div>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
              color: '#64748B', margin: 0, lineHeight: 1.5
            }}>
              {item.desc}
            </p>
          </div>
          <ArrowRight size={18} style={{ color: '#C2410C', flexShrink: 0, marginTop: '2px' }} />
        </div>
      </div>
    </Link>
  );
}

export default function ADAAssistant() {
  const [query, setQuery] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [resultItems, setResultItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const hasResults = answer || resultItems.length > 0;

  const handleSubmit = async (text) => {
    const q = (text || query).trim();
    if (!q || loading) return;

    setLastQuestion(q);
    setQuery('');
    setAnswer('');
    setResultItems([]);
    setError(null);
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: q,
        system_prompt: SYSTEM_PROMPT,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            answer: { type: "string" },
            results: { type: "array", items: { type: "string" } }
          },
          required: ["answer", "results"]
        }
      });

      let answerText = '';
      let resultIds = [];

      try {
        let parsed;
        if (typeof response === 'string') {
          const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          parsed = JSON.parse(cleaned);
        } else {
          parsed = response;
        }
        answerText = parsed?.answer || '';
        resultIds = Array.isArray(parsed?.results) ? parsed.results : [];
      } catch (jsonErr) {
        answerText = typeof response === 'string' ? response : (response?.result || response?.answer || response?.text || String(response));
        resultIds = [];
      }

      if (resultIds.length === 0) {
        const qLower = q.toLowerCase();
        const scored = CONTENT_MAP.map(item => {
          const keywords = (item.keywords + ' ' + item.title + ' ' + item.desc).toLowerCase();
          let score = 0;
          const qWords = qLower.split(/\s+/).filter(w => w.length > 2);
          for (const word of qWords) {
            if (keywords.includes(word)) score += 1;
          }
          if (item.diagram && score > 0) score += 0.5;
          return { ...item, score };
        }).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 4);
        resultIds = scored.map(s => s.id);
      }

      const matched = resultIds
        .map(id => CONTENT_INDEX[id])
        .filter(Boolean)
        .slice(0, 4);

      setAnswer(answerText);
      setResultItems(matched);
    } catch (err) {
      setError('Unable to get a response. Please try again.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleReset = () => {
    setLastQuestion('');
    setAnswer('');
    setResultItems([]);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{ maxWidth: '520px', width: '100%' }}>
      <style>{`
        @keyframes adaPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Input */}
      <div role="search" aria-label="Ask about ADA standards">
        <label htmlFor="ada-assistant-input" className="sr-only">Ask about ADA standards</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            id="ada-assistant-input"
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any ADA standard... e.g. How wide must a doorway be?"
            aria-label="Ask about ADA standards"
            style={{
              width: '100%', padding: '14px 56px 14px 16px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.9375rem',
              background: 'rgba(255,255,255,0.06)', color: 'white',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '12px', outline: 'none',
              minHeight: '48px', boxSizing: 'border-box'
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(194,65,12,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!query.trim() || loading}
            aria-label="Send message"
            style={{
              position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
              background: query.trim() && !loading ? '#C2410C' : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: '8px',
              width: '36px', height: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: query.trim() && !loading ? 'pointer' : 'default',
              transition: 'background 0.2s'
            }}
          >
            <Send size={16} style={{ color: 'white' }} />
          </button>
        </div>
        <p style={{
          fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem',
          color: '#64748B', margin: '8px 0 0', fontStyle: 'italic'
        }}>
          AI-powered guidance based on the 2010 ADA Standards. For legal advice, consult an ADA attorney.
        </p>
      </div>

      {/* Starter chips — only before first result */}
      {!hasResults && !loading && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
          {STARTERS.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSubmit(q)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '100px', padding: '8px 16px',
                fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
                color: '#CBD5E1', cursor: 'pointer',
                transition: 'all 0.2s', lineHeight: 1.4
              }}
              onMouseEnter={e => { e.target.style.background = 'rgba(194,65,12,0.15)'; e.target.style.borderColor = 'rgba(194,65,12,0.3)'; e.target.style.color = '#FED7AA'; }}
              onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.06)'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.color = '#CBD5E1'; }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Results area */}
      <div
        ref={resultsRef}
        aria-live="polite"
        aria-busy={loading}
        style={{ marginTop: '20px' }}
      >
        {/* Loading */}
        {loading && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <LogoBrand size={24} style={{ flexShrink: 0 }} />
            <TypingDots />
            <span className="sr-only">Searching ADA standards...</span>
          </div>
        )}

        {/* Question label */}
        {lastQuestion && !loading && hasResults && (
          <p style={{
            fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem',
            color: '#94A3B8', margin: '0 0 12px',
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <span style={{ fontWeight: 600 }}>You asked:</span> {lastQuestion}
          </p>
        )}

        {/* AI Answer callout */}
        {answer && !loading && (
          <div style={{
            background: '#FFFBF7', borderLeft: '3px solid #C2410C',
            borderRadius: '0 12px 12px 0', padding: '16px 20px',
            marginBottom: '16px', position: 'relative'
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <LogoBrand size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{
                fontFamily: 'Manrope, sans-serif', fontSize: '0.9rem',
                color: 'var(--slate-700)', lineHeight: 1.7
              }}>
                <AutoCiteLinks>{answer}</AutoCiteLinks>
              </div>
            </div>
          </div>
        )}

        {/* Result cards */}
        {resultItems.length > 0 && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            <p style={{
              fontFamily: 'Manrope, sans-serif', fontSize: '0.75rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: '#94A3B8', margin: '0 0 4px'
            }}>
              Explore the full details
            </p>
            {resultItems.map(item => (
              <ResultCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)',
            borderRadius: '10px', padding: '10px 14px',
            fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem', color: '#FCA5A5'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Ask another */}
        {hasResults && !loading && (
          <button
            onClick={handleReset}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '100px', padding: '8px 20px',
              fontFamily: 'Manrope, sans-serif', fontSize: '0.85rem',
              color: '#CBD5E1', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#CBD5E1'; }}
          >
            <RotateCcw size={14} />
            Ask another question
          </button>
        )}
      </div>

      {/* Screen reader announcement */}
      <div aria-live="assertive" className="sr-only">
        {loading ? 'Searching ADA standards...' : ''}
      </div>
    </div>
  );
}