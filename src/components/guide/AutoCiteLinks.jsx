import React from 'react';

const DESIGN_STANDARDS_BASE = 'https://www.ada.gov/law-and-regs/design-standards/2010-stds/';
const TITLE_II_URL = 'https://www.ada.gov/law-and-regs/regulations/title-ii-2010-regulations/';
const TITLE_III_URL = 'https://www.ada.gov/law-and-regs/regulations/title-iii-regulations/';
const ADA_STATUTE_URL = 'https://www.ada.gov/law-and-regs/ada/';
const WCAG_URL = 'https://www.w3.org/TR/WCAG21/';

const SECTION_ANCHORS = {
  '101':'101-purpose','102':'102-dimensions-for-adults-and-children','103':'103-equivalent-facilitation','104':'104-conventions','105':'105-referenced-standards','106':'106-definitions',
  '201':'201-application','202':'202-existing-buildings-and-facilities','203':'203-general-exceptions','204':'204-protruding-objects','205':'205-operable-parts','206':'206-accessible-routes','207':'207-accessible-means-of-egress','208':'208-parking-spaces','209':'209-passenger-loading-zones-and-bus-stops','210':'210-stairways','211':'211-drinking-fountains','212':'212-kitchens-kitchenettes-and-sinks','213':'213-toilet-facilities-and-bathing-facilities','214':'214-washing-machines-and-clothes-dryers','215':'215-fire-alarm-systems','216':'216-signs','217':'217-telephones','218':'218-transportation-facilities','219':'219-assistive-listening-systems','220':'220-automatic-teller-machines-and-fare-machines','221':'221-assembly-areas','222':'222-dressing-fitting-and-locker-rooms','223':'223-medical-care-and-long-term-care-facilities','224':'224-transient-lodging-guest-rooms','225':'225-storage','226':'226-dining-surfaces-and-work-surfaces','227':'227-sales-and-service','228':'228-depositories-vending-machines-change-machines-mail-boxes-and-fuel-dispensers','229':'229-windows','230':'230-two-way-communication-systems','231':'231-judicial-facilities','232':'232-detention-facilities-and-correctional-facilities','233':'233-residential-facilities','234':'234-amusement-rides','235':'235-recreational-boating-facilities','236':'236-exercise-machines-and-equipment','237':'237-fishing-piers-and-platforms','238':'238-golf-facilities','239':'239-miniature-golf-facilities','240':'240-play-areas','241':'241-saunas-and-steam-rooms','242':'242-swimming-pools-wading-pools-and-spas','243':'243-shooting-facilities-with-firing-positions',
  '301':'301-general','302':'302-floor-or-ground-surfaces','303':'303-changes-in-level','304':'304-turning-space','305':'305-clear-floor-or-ground-space','306':'306-knee-and-toe-clearance','307':'307-protruding-objects','308':'308-reach-ranges','309':'309-operable-parts',
  '401':'401-general','402':'402-accessible--routes','403':'403-walking-surfaces','404':'404-doors-doorways-and-gates','405':'405-ramps','406':'406-curb-ramps','407':'407-elevators','408':'408-limited-use-limited-application-elevators','409':'409-private-residence-elevators','410':'410-platform-lifts',
  '501':'501-general','502':'502-parking-spaces','503':'503-passenger-loading-zones','504':'504-stairways','505':'505-handrails',
  '601':'601-general','602':'602-drinking-fountains','603':'603-toilet-and-bathing-rooms','604':'604-water-closets-and-toilet-compartments','605':'605-urinals','606':'606-lavatories-and-sinks','607':'607-bathtubs','608':'608-shower-compartments','609':'609-grab-bars','610':'610-seats','611':'611-washing-machines-and-clothes-dryers','612':'612-saunas-and-steam-rooms',
  '701':'701-general','702':'702-fire-alarm-systems','703':'703-signs','704':'704-telephones','705':'705-detectable-warnings','706':'706-assistive-listening-systems','707':'707-automatic-teller-machines-and-fare-machines','708':'708-two-way-communication-systems',
  '801':'801-general','802':'802-wheelchair-spaces-companion-seats-and-designated-aisle-seats','803':'803-dressing-fitting-and-locker-rooms','804':'804-kitchens-and-kitchenettes','805':'805-medical-care-and-long-term-care-facilities','806':'806-transient-lodging-guest-rooms','807':'807-holding-cells-and-housing-cells','808':'808-courtrooms','809':'809-detention-facilities-and-correctional-facilities','810':'810-transportation-facilities','811':'811-storage',
  '901':'901-general','902':'902-dining-surfaces-and-work-surfaces','903':'903-benches','904':'904-check-out-aisles-and-sales-and-service-counters',
  '1001':'1001-general','1002':'1002-amusement-rides','1003':'1003-recreational-boating-facilities','1004':'1004-exercise-machines-and-equipment','1005':'1005-fishing-piers-and-platforms','1006':'1006-golf-facilities','1007':'1007-miniature-golf-facilities','1008':'1008-play-areas','1009':'1009-swimming-pools-wading-pools-and-spas','1010':'1010-shooting-facilities-with-firing-positions'
};

function getStdUrl(num) {
  const parent = num.split('.')[0];
  const anchor = SECTION_ANCHORS[parent];
  return anchor ? `${DESIGN_STANDARDS_BASE}#${anchor}` : DESIGN_STANDARDS_BASE;
}

const lnk = { color: '#9A3412', textDecoration: 'none', borderBottom: '1px dotted #9A3412' };
const arrow = { fontSize: '0.65em', marginLeft: '1px', verticalAlign: 'super' };

function makeLink(text, url, label) {
  return (
    <a key={Math.random()} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} style={lnk}>
      {text}<span aria-hidden="true" style={arrow}>↗</span>
    </a>
  );
}

/**
 * Processes a string and replaces citation patterns with links.
 * Patterns matched (in order):
 * - 28 CFR §35.xxx or 28 CFR Part 35
 * - 28 CFR §36.xxx or 28 CFR Part 36  
 * - 42 U.S.C. §12xxx
 * - §xxx.x.x (design standards)
 * - WCAG 2.1
 */
function linkifyString(str) {
  // Combined regex matching all citation patterns
  const pattern = /(28\s*CFR\s*(?:§|Part\s*)35[\w.–\-()\/]*|28\s*CFR\s*(?:§|Part\s*)36[\w.–\-()\/]*|42\s*U\.S\.C\.\s*§[\d–\-,\s()]+|§\d{3,4}(?:\.\d+)*(?:\.\d+)*(?:\([a-zA-Z0-9]+\))*|WCAG\s*2\.1)/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = pattern.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.slice(lastIndex, match.index));
    }
    const m = match[0];
    
    if (/28\s*CFR.*35/i.test(m)) {
      parts.push(makeLink(m, TITLE_II_URL, `${m} — Title II Regulations on ADA.gov (opens in new tab)`));
    } else if (/28\s*CFR.*36/i.test(m)) {
      parts.push(makeLink(m, TITLE_III_URL, `${m} — Title III Regulations on ADA.gov (opens in new tab)`));
    } else if (/42\s*U\.S\.C/i.test(m)) {
      parts.push(makeLink(m, ADA_STATUTE_URL, `${m} — ADA Statute on ADA.gov (opens in new tab)`));
    } else if (/WCAG/i.test(m)) {
      parts.push(makeLink(m, WCAG_URL, `${m} on W3C (opens in new tab)`));
    } else if (/^§/.test(m)) {
      const num = m.replace(/§/, '').split(/[(\s]/)[0];
      parts.push(makeLink(m, getStdUrl(num), `${m} on ADA.gov 2010 Standards (opens in new tab)`));
    } else {
      parts.push(m);
    }
    
    lastIndex = match.index + m.length;
  }
  
  if (lastIndex < str.length) {
    parts.push(str.slice(lastIndex));
  }
  
  return parts.length > 1 ? parts : str;
}

/**
 * Recursively processes React children, finding text nodes and converting
 * citation patterns to clickable links. Skips elements that are already links.
 */
function processChildren(children) {
  return React.Children.map(children, child => {
    if (typeof child === 'string') {
      const result = linkifyString(child);
      if (Array.isArray(result)) {
        return <>{result}</>;
      }
      return child;
    }
    if (React.isValidElement(child)) {
      // Don't process inside existing links
      if (child.type === 'a') return child;
      // Process children of other elements
      if (child.props && child.props.children) {
        return React.cloneElement(child, {}, processChildren(child.props.children));
      }
    }
    return child;
  });
}

/**
 * Wrap any content with <AutoCiteLinks> to auto-hyperlink legal citations.
 * 
 * Usage: <AutoCiteLinks>{children}</AutoCiteLinks>
 */
export default function AutoCiteLinks({ children }) {
  return <>{processChildren(children)}</>;
}