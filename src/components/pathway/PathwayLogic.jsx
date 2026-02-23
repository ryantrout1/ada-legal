const GUIDE_PAGES = {
  legalOptions: { title: 'Your Legal Options', page: 'GuideLegalOptions', description: 'Compare filing paths and understand what you can recover' },
  whatToExpect: { title: 'What to Expect', page: 'GuideWhatToExpect', description: 'Step-by-step walkthrough of the legal process' },
  whyAttorney: { title: 'Why You Need an Attorney', page: 'GuideWhyAttorney', description: 'How ADA enforcement works through private lawsuits' },
  filingComplaint: { title: 'How to File a Complaint', page: 'GuideFilingComplaint', description: 'Step-by-step instructions for government complaints' },
  barrierRemoval: { title: 'Barrier Removal Standards', page: 'GuideBarrierRemoval', description: 'What "readily achievable" means for businesses' },
  digitalBarriers: { title: 'Digital Barriers & Your Rights', page: 'GuideDigitalBarriers', description: 'Website and app accessibility rights' },
  webRule: { title: 'Title II Web Rule', page: 'GuideWebRule', description: 'Government website accessibility deadlines' },
  wcag: { title: 'WCAG 2.1 Explained', page: 'GuideWcagExplained', description: 'Web accessibility technical standards' },
  serviceAnimals: { title: 'Service Animals', page: 'GuideServiceAnimals', description: 'Your rights with service animals under the ADA' },
  parking: { title: 'Parking Requirements', page: 'GuideParkingRequirements', description: 'Accessible parking space standards' },
  restrooms: { title: 'Restroom Accessibility', page: 'GuideRestrooms', description: 'Accessible restroom standards and requirements' },
  ramps: { title: 'Ramp Standards', page: 'GuideRamps', description: 'Ramp slope, width, and landing requirements' },
  entrances: { title: 'Accessible Entrances', page: 'GuideEntrances', description: 'Door width, hardware, and entrance requirements' },
  communication: { title: 'Effective Communication', page: 'GuideEffectiveCommunication', description: 'Sign language, Braille, and communication aids' },
  titleII: { title: 'Title II Overview', page: 'GuideTitleII', description: 'State and local government obligations' },
  smallBusiness: { title: 'Small Business Primer', page: 'GuideSmallBusiness', description: 'What the ADA requires from businesses' },
  introAda: { title: 'Introduction to the ADA', page: 'GuideIntroToAda', description: 'Overview of the ADA and its five titles' },
  education: { title: 'Education & ADA', page: 'GuideEducation', description: 'Accessibility in schools and universities' },
  medical: { title: 'Medical Facilities', page: 'GuideMedicalFacilities', description: 'Hospital and clinic accessibility requirements' },
  hotels: { title: 'Hotels & Lodging', page: 'GuideHotelsLodging', description: 'Accessible guest room and service requirements' },
  restaurants: { title: 'Restaurants & Retail', page: 'GuideRestaurantsRetail', description: 'Dining and shopping accessibility' },
};

function getTimingDeadline(timing, adaTitle) {
  if (adaTitle === 'I') {
    if (timing === 'this_week' || timing === 'this_month') return { text: 'You have 180 days from the discriminatory act to file with the EEOC (300 days in most states). You have plenty of time, but don\'t delay.', urgency: 'green' };
    if (timing === '1_6_months') return { text: 'You have 180 days from the discriminatory act to file with the EEOC (300 days in most states). Time is passing — contact an attorney soon.', urgency: 'yellow' };
    if (timing === '6_12_months') return { text: 'The EEOC deadline is 180 days (300 in most states). You may be close to or past the federal deadline. Contact an attorney immediately.', urgency: 'red' };
    return { text: 'The EEOC filing deadline may have passed (180/300 days). An attorney can advise whether state-law options remain available.', urgency: 'red' };
  }
  if (adaTitle === 'II') {
    if (timing === 'this_week' || timing === 'this_month') return { text: 'For a DOJ complaint, you have 180 days. For a private lawsuit, the statute of limitations varies by state (typically 2-4 years). You have time, but acting sooner means better evidence.', urgency: 'green' };
    if (timing === '1_6_months') return { text: 'The DOJ complaint deadline is 180 days. A private lawsuit has a longer window (varies by state). Contact an attorney to protect your options.', urgency: 'yellow' };
    return { text: 'The DOJ 180-day deadline may have passed, but a private lawsuit may still be possible depending on your state\'s statute of limitations. Consult an attorney.', urgency: 'yellow' };
  }
  if (adaTitle === 'III') {
    if (timing === 'this_week' || timing === 'this_month') return { text: 'There is no federal filing deadline for ADA Title III private lawsuits. Acting quickly means fresher evidence and a stronger case.', urgency: 'green' };
    if (timing === '1_6_months') return { text: 'There is no federal filing deadline for Title III. State statutes of limitations (typically 1-3 years) apply. You have time, but don\'t wait indefinitely.', urgency: 'green' };
    return { text: 'There is no federal filing deadline, but state statutes of limitations apply (typically 1-3 years). An attorney can confirm your state\'s deadline.', urgency: 'yellow' };
  }
  if (adaTitle === 'FHA') {
    if (timing === 'this_week' || timing === 'this_month') return { text: 'You have 1 year to file with HUD and 2 years for a private lawsuit. You have plenty of time.', urgency: 'green' };
    if (timing === '1_6_months') return { text: 'HUD deadline: 1 year from the discriminatory act. Private lawsuit: 2 years. You have time but should document everything now.', urgency: 'green' };
    if (timing === '6_12_months') return { text: 'The HUD filing deadline (1 year) is approaching. A private lawsuit has 2 years. Consider acting soon.', urgency: 'yellow' };
    return { text: 'The HUD deadline (1 year) may have passed. A private lawsuit deadline is 2 years. Consult an attorney about your remaining options.', urgency: 'red' };
  }
  return { text: 'Filing deadlines vary. Contact an attorney to confirm your specific deadline.', urgency: 'yellow' };
}

function getSectionsForBarrier(barrier) {
  switch (barrier) {
    case 'no_ramp': case 'stairs_only':
      return [
        { section: '§405', title: 'Ramps', description: 'Maximum slope 1:12, minimum 36" width, level landings required.' },
        { section: '§206', title: 'Accessible Routes', description: 'At least one accessible route must connect accessible building entrances to all accessible elements.' }
      ];
    case 'no_parking': case 'parking_blocked':
      return [
        { section: '§502', title: 'Parking Spaces', description: 'Accessible spaces must be 96" wide min with 60" access aisle, van spaces 132" with 60" aisle.' },
        { section: '§208', title: 'Parking Scoping', description: 'Number of accessible spaces required based on total spaces in the lot.' }
      ];
    case 'restroom':
      return [
        { section: '§604', title: 'Water Closets & Toilet Compartments', description: 'Accessible stalls: 60" wide min, grab bars both sides, seat height 17-19".' },
        { section: '§609', title: 'Grab Bars', description: 'Grab bars required at toilet and in shower/tub, 1.25-2" diameter, specific mounting heights.' }
      ];
    case 'narrow_door': case 'entrance':
      return [
        { section: '§404', title: 'Doors, Doorways, and Gates', description: 'Clear width 32" minimum, accessible hardware, maneuvering clearance required.' },
        { section: '§206.4', title: 'Entrance Requirements', description: 'At least 60% of public entrances must be accessible.' }
      ];
    case 'elevator':
      return [{ section: '§407', title: 'Elevators', description: 'Call buttons, car controls, floor indicators, door timing, and car dimensions specified.' }];
    case 'counter_high':
      return [{ section: '§904', title: 'Sales & Service Counters', description: 'A portion of the counter must be 36" max height, or an alternative method of service provided.' }];
    default:
      return [{ section: '§206', title: 'Accessible Routes', description: 'The most commonly cited ADA standard — requires an accessible path through the facility.' }];
  }
}

export function generateResults(answers) {
  const { category, location, timing, barrier } = answers;

  // PHYSICAL — BUSINESS
  if (category === 'physical_access' && ['restaurant', 'store', 'hotel', 'medical', 'theater', 'gym', 'other_business'].includes(location)) {
    const guides = [GUIDE_PAGES.legalOptions, GUIDE_PAGES.whatToExpect, GUIDE_PAGES.barrierRemoval];
    if (barrier === 'no_ramp' || barrier === 'stairs_only') guides.push(GUIDE_PAGES.ramps);
    if (barrier === 'no_parking' || barrier === 'parking_blocked') guides.push(GUIDE_PAGES.parking);
    if (barrier === 'restroom') guides.push(GUIDE_PAGES.restrooms);
    if (barrier === 'narrow_door' || barrier === 'entrance') guides.push(GUIDE_PAGES.entrances);
    if (location === 'hotel') guides.push(GUIDE_PAGES.hotels);
    if (location === 'restaurant') guides.push(GUIDE_PAGES.restaurants);
    if (location === 'medical') guides.push(GUIDE_PAGES.medical);
    return {
      title: 'Your Rights Under ADA Title III', adaTitle: 'III',
      summary: 'Businesses open to the public — restaurants, stores, hotels, medical offices, theaters, and more — must remove architectural barriers when it\'s "readily achievable." This is a federal civil rights requirement, not a suggestion.',
      lawApplies: 'ADA Title III applies to "places of public accommodation" — essentially any business that serves the public. The 2010 ADA Standards for Accessible Design set the specific measurements and requirements.',
      sections: getSectionsForBarrier(barrier),
      deadline: getTimingDeadline(timing, 'III'),
      remedies: ['Injunctive relief — a court order requiring the business to fix the barrier', 'Attorney\'s fees — the business pays your attorney if the case succeeds', 'State damages may apply — California\'s Unruh Act provides $4,000+ per violation; other states vary', 'No monetary damages at the federal level for Title III (state law often fills this gap)'],
      bestNextStep: { action: 'Contact an ADA attorney', description: 'For Title III cases, a private attorney is the fastest and most effective path. Most ADA attorneys work on contingency — you pay nothing out of pocket.' },
      guideLinks: guides.slice(0, 5),
      filingPaths: [
        { agency: 'Private Attorney (Recommended)', url: null, description: 'Fastest path. Most cases resolve in 2-6 months. No cost to you.' },
        { agency: 'DOJ Complaint', url: 'https://civilrights.justice.gov/', description: 'For pattern/practice issues. DOJ rarely acts on individual cases.' }
      ]
    };
  }

  // PHYSICAL — GOVERNMENT
  if (category === 'physical_access' && ['government', 'school', 'court', 'transit', 'park', 'public_housing'].includes(location)) {
    const guides = [GUIDE_PAGES.legalOptions, GUIDE_PAGES.whatToExpect, GUIDE_PAGES.titleII];
    if (barrier === 'no_ramp' || barrier === 'stairs_only') guides.push(GUIDE_PAGES.ramps);
    if (barrier === 'restroom') guides.push(GUIDE_PAGES.restrooms);
    if (barrier === 'no_parking') guides.push(GUIDE_PAGES.parking);
    if (location === 'school') guides.push(GUIDE_PAGES.education);
    return {
      title: 'Your Rights Under ADA Title II', adaTitle: 'II',
      summary: 'State and local governments must make all programs, services, and activities accessible to people with disabilities. This includes physical buildings, programs, websites, and communication.',
      lawApplies: 'ADA Title II applies to all state and local government entities — cities, counties, public schools, courts, transit agencies, parks departments, and public housing authorities.',
      sections: getSectionsForBarrier(barrier),
      deadline: getTimingDeadline(timing, 'II'),
      remedies: ['Injunctive relief — requiring the government entity to fix the barrier', 'Compensatory damages — for emotional distress and other harm', 'Attorney\'s fees', 'Some circuits also allow punitive damages'],
      bestNextStep: { action: 'File a DOJ complaint and/or contact an attorney', description: 'You can file a DOJ complaint and pursue a private lawsuit simultaneously. Unlike Title I, no government complaint is required before suing.' },
      guideLinks: guides.slice(0, 5),
      filingPaths: [
        { agency: 'DOJ Complaint', url: 'https://civilrights.justice.gov/', description: 'File within 180 days. The DOJ may investigate or refer to another agency.' },
        { agency: 'Private Attorney', url: null, description: 'No need to file a complaint first. Can pursue damages and injunctive relief.' }
      ]
    };
  }

  // DIGITAL — BUSINESS
  if (category === 'digital_access' && ['business_website', 'app', 'ecommerce'].includes(location)) {
    return {
      title: 'Your Rights: Website & App Accessibility', adaTitle: 'III',
      summary: 'The DOJ has confirmed that websites of businesses open to the public must be accessible. Courts have consistently ruled that inaccessible websites violate the ADA. Website accessibility lawsuits make up roughly 28% of all ADA filings.',
      lawApplies: 'ADA Title III applies to websites and apps of businesses that serve the public. The technical standard courts reference is WCAG 2.1 Level AA.',
      sections: [
        { section: 'Title III', title: 'Public Accommodations', description: 'Businesses must provide equal access to goods and services, including through digital channels.' },
        { section: 'WCAG 2.1 AA', title: 'Technical Standard', description: 'The Web Content Accessibility Guidelines establish the accepted benchmark for website accessibility.' },
        { section: '28 CFR §36.201', title: 'General Prohibition', description: 'No individual shall be discriminated against on the basis of disability in the full and equal enjoyment of goods and services.' }
      ],
      deadline: getTimingDeadline(timing, 'III'),
      remedies: ['Injunctive relief — requiring the business to fix its website', 'Attorney\'s fees — the business pays your attorney', 'State damages may apply (California Unruh Act: $4,000+ per violation)', 'No federal monetary damages for Title III'],
      bestNextStep: { action: 'Document the barriers and contact an attorney', description: 'Take screenshots, note the URLs, and describe what assistive technology you use. Many attorneys specialize in website accessibility cases and take them on contingency.' },
      guideLinks: [GUIDE_PAGES.digitalBarriers, GUIDE_PAGES.legalOptions, GUIDE_PAGES.whatToExpect, GUIDE_PAGES.wcag],
      filingPaths: [
        { agency: 'Private Attorney (Recommended)', url: null, description: 'Most effective for individual website cases. Contingency fee = no cost to you.' },
        { agency: 'DOJ Complaint', url: 'https://civilrights.justice.gov/', description: 'DOJ rarely acts on individual website complaints.' }
      ]
    };
  }

  // DIGITAL — GOVERNMENT
  if (category === 'digital_access' && ['government_website', 'school_website', 'transit_app'].includes(location)) {
    return {
      title: 'Your Rights: Government Website Accessibility', adaTitle: 'II',
      summary: 'The DOJ published a rule in April 2024 explicitly requiring state and local government websites and mobile apps to meet WCAG 2.1 Level AA. Compliance deadlines are April 2026 and April 2027.',
      lawApplies: 'ADA Title II requires government websites to be accessible. The 2024 DOJ rule made WCAG 2.1 Level AA the explicit standard with enforceable deadlines.',
      sections: [
        { section: 'Title II', title: 'Government Services', description: 'All government programs and services — including those delivered online — must be accessible.' },
        { section: 'Title II Web Rule (2024)', title: 'WCAG 2.1 AA Required', description: 'DOJ final rule requiring government websites and apps to conform to WCAG 2.1 Level AA.' }
      ],
      deadline: getTimingDeadline(timing, 'II'),
      remedies: ['Injunctive relief — requiring the government to fix its website', 'Compensatory damages', 'Attorney\'s fees'],
      bestNextStep: { action: 'File a DOJ complaint and/or contact an attorney', description: 'Government website accessibility complaints are taken more seriously by the DOJ. Filing a complaint AND working with an attorney gives you the strongest position.' },
      guideLinks: [GUIDE_PAGES.webRule, GUIDE_PAGES.digitalBarriers, GUIDE_PAGES.legalOptions, GUIDE_PAGES.titleII, GUIDE_PAGES.wcag],
      filingPaths: [
        { agency: 'DOJ Complaint', url: 'https://civilrights.justice.gov/', description: 'Government websites are a DOJ enforcement priority.' },
        { agency: 'Private Attorney', url: null, description: 'Can pursue damages that a DOJ complaint cannot.' }
      ]
    };
  }

  // SERVICE ANIMAL
  if (category === 'service_animal') {
    const isGov = ['government', 'school', 'court', 'transit', 'park', 'public_housing'].includes(location);
    return {
      title: isGov ? 'Your Rights: Service Animal Refusal (Title II)' : 'Your Rights: Service Animal Refusal (Title III)',
      adaTitle: isGov ? 'II' : 'III',
      summary: 'Under the ADA, service animals must be allowed in all areas where the public is permitted to go. A business or government entity may only ask two questions: (1) Is this a service animal required because of a disability? (2) What work or task has the dog been trained to perform?',
      lawApplies: `ADA ${isGov ? 'Title II' : 'Title III'} and 28 CFR §${isGov ? '35.136' : '36.302(c)'} specifically address service animal rights.`,
      sections: [
        { section: isGov ? '28 CFR §35.136' : '28 CFR §36.302(c)', title: 'Service Animal Requirements', description: 'A service animal is a dog individually trained to do work or perform tasks for a person with a disability.' },
        { section: 'Two-Question Rule', title: 'What They Can Ask', description: 'Only: (1) Is this a service animal? (2) What task is it trained to perform? No documentation required.' }
      ],
      deadline: getTimingDeadline(timing, isGov ? 'II' : 'III'),
      remedies: isGov ? ['Injunctive relief', 'Compensatory damages', 'Attorney\'s fees'] : ['Injunctive relief', 'Attorney\'s fees', 'State damages may apply (e.g., California Unruh Act: $4,000+)'],
      bestNextStep: { action: 'Document what happened and contact an attorney', description: 'Note the date, location, what was said, and who was involved. Service animal refusal cases are straightforward — the law is clear.' },
      guideLinks: [GUIDE_PAGES.serviceAnimals, GUIDE_PAGES.legalOptions, GUIDE_PAGES.whatToExpect, GUIDE_PAGES.whyAttorney],
      filingPaths: [
        { agency: 'Private Attorney (Recommended)', url: null, description: 'Service animal cases are clear-cut. Most attorneys take them on contingency.' },
        { agency: 'DOJ Complaint', url: 'https://civilrights.justice.gov/', description: 'File if you want government enforcement in addition to private action.' }
      ]
    };
  }

  // EMPLOYMENT
  if (category === 'employment') {
    return {
      title: 'Your Rights Under ADA Title I (Employment)', adaTitle: 'I',
      summary: 'Employers with 15 or more employees cannot discriminate against qualified individuals with disabilities in hiring, firing, promotions, pay, or any term of employment. Employers must also provide reasonable accommodations unless it creates undue hardship.',
      lawApplies: 'ADA Title I covers employment discrimination. The EEOC enforces Title I. You MUST file with the EEOC before you can file a lawsuit.',
      sections: [
        { section: '42 U.S.C. §12112', title: 'Discrimination Prohibited', description: 'Employers cannot discriminate in job application procedures, hiring, advancement, discharge, compensation, or training.' },
        { section: '42 U.S.C. §12112(b)(5)', title: 'Reasonable Accommodation', description: 'Employers must make reasonable accommodations unless it causes undue hardship.' },
        { section: '42 U.S.C. §12117', title: 'Enforcement Through EEOC', description: 'Title I follows the same enforcement framework as Title VII — EEOC filing required before lawsuit.' }
      ],
      deadline: getTimingDeadline(timing, 'I'),
      remedies: ['Back pay and reinstatement', 'Compensatory damages (emotional distress)', 'Punitive damages (capped: $50,000-$300,000 based on employer size)', 'Attorney\'s fees'],
      bestNextStep: { action: 'File with the EEOC immediately', description: 'You MUST file an EEOC charge before you can sue. The deadline is 180 days (300 in most states). File first, then consult with an employment attorney.' },
      guideLinks: [GUIDE_PAGES.legalOptions, GUIDE_PAGES.whatToExpect, GUIDE_PAGES.whyAttorney, GUIDE_PAGES.filingComplaint],
      filingPaths: [
        { agency: 'EEOC (Required First Step)', url: 'https://www.eeoc.gov/filing-charge-discrimination', description: 'Must file within 180/300 days. Required before you can sue.' },
        { agency: 'Employment Attorney', url: null, description: 'Consult one now — they can help with the EEOC filing and prepare for litigation.' }
      ]
    };
  }

  // HOUSING
  if (category === 'housing') {
    return {
      title: 'Your Rights: Fair Housing & Disability', adaTitle: 'FHA',
      summary: 'The Fair Housing Act prohibits disability discrimination in housing — renting, buying, and the design of multifamily buildings. This includes the right to service animals, emotional support animals, reasonable modifications, and accessible design.',
      lawApplies: 'The Fair Housing Act (not the ADA) is the primary law for housing discrimination. If your housing involves a government program, ADA Title II may also apply.',
      sections: [
        { section: '42 U.S.C. §3604', title: 'Discrimination in Sale or Rental', description: 'It is unlawful to refuse to sell or rent based on disability.' },
        { section: '42 U.S.C. §3604(f)(3)(B)', title: 'Reasonable Modifications', description: 'Tenants may make reasonable modifications at their own expense.' },
        { section: 'Assistance Animals', title: 'Service & Support Animals', description: 'Both service animals and emotional support animals are protected in housing.' }
      ],
      deadline: getTimingDeadline(timing, 'FHA'),
      remedies: ['Actual damages (out-of-pocket costs, emotional distress)', 'Punitive damages', 'Attorney\'s fees', 'Injunctive relief (requiring the landlord to accommodate you)'],
      bestNextStep: { action: 'File with HUD and/or contact a fair housing attorney', description: 'You can file with HUD within 1 year, or file a private lawsuit within 2 years. You don\'t need to file with HUD before suing.' },
      guideLinks: [GUIDE_PAGES.legalOptions, GUIDE_PAGES.whatToExpect, GUIDE_PAGES.whyAttorney, GUIDE_PAGES.introAda],
      filingPaths: [
        { agency: 'HUD Complaint', url: 'https://www.hud.gov/program_offices/fair_housing_equal_opp/online-complaint', description: 'File within 1 year. HUD investigates and may refer to DOJ.' },
        { agency: 'Fair Housing Attorney', url: null, description: 'Can file a private lawsuit within 2 years. No HUD complaint required first.' }
      ]
    };
  }

  // COMMUNICATION
  if (category === 'communication') {
    const isGov = ['government', 'school', 'court', 'hospital_public'].includes(location);
    return {
      title: isGov ? 'Your Rights: Effective Communication (Title II)' : 'Your Rights: Effective Communication (Title III)',
      adaTitle: isGov ? 'II' : 'III',
      summary: 'The ADA requires both businesses and government entities to provide effective communication for people who are deaf, hard of hearing, blind, or have speech disabilities. This includes sign language interpreters, Braille, large print, captioning, and assistive listening devices.',
      lawApplies: `${isGov ? '28 CFR §35.160' : '28 CFR §36.303'} requires ${isGov ? 'government entities' : 'businesses'} to take appropriate steps to ensure effective communication.`,
      sections: [
        { section: isGov ? '28 CFR §35.160' : '28 CFR §36.303', title: 'Effective Communication', description: 'Must provide auxiliary aids and services to ensure equal access to communications.' },
        { section: 'Primary Consideration', title: 'Your Preference Matters', description: 'The entity must give primary consideration to the person\'s preferred method of communication.' }
      ],
      deadline: getTimingDeadline(timing, isGov ? 'II' : 'III'),
      remedies: isGov ? ['Injunctive relief', 'Compensatory damages', 'Attorney\'s fees'] : ['Injunctive relief', 'Attorney\'s fees', 'State damages may apply'],
      bestNextStep: { action: 'Document the communication failure and contact an attorney', description: 'Note what communication aid you needed, what you received (or didn\'t), and how it affected your ability to participate.' },
      guideLinks: [GUIDE_PAGES.communication, GUIDE_PAGES.legalOptions, GUIDE_PAGES.whatToExpect, GUIDE_PAGES.whyAttorney],
      filingPaths: [
        { agency: 'Private Attorney', url: null, description: 'Communication violation cases often have strong outcomes.' },
        { agency: 'DOJ Complaint', url: 'https://civilrights.justice.gov/', description: 'File for government entity violations.' }
      ]
    };
  }

  // FALLBACK
  return {
    title: 'Your Rights Under the ADA', adaTitle: 'General',
    summary: 'The Americans with Disabilities Act prohibits discrimination against people with disabilities in employment, government services, public accommodations, and telecommunications.',
    lawApplies: 'Based on your description, multiple ADA provisions may apply. An attorney can help determine which title and sections give you the strongest case.',
    sections: [{ section: 'ADA', title: 'Americans with Disabilities Act', description: 'Federal civil rights law prohibiting disability discrimination across five titles.' }],
    deadline: { text: 'Filing deadlines vary by title and state. Contact an attorney to confirm your specific deadline.', urgency: 'yellow' },
    remedies: ['Injunctive relief (requiring the barrier to be removed)', 'Attorney\'s fees', 'Damages (varies by title and state)'],
    bestNextStep: { action: 'Report it and let an attorney evaluate your case', description: 'The best way to determine your rights is to report what happened. An ADA attorney can analyze your situation and advise you on the strongest legal path.' },
    guideLinks: [GUIDE_PAGES.legalOptions, GUIDE_PAGES.introAda, GUIDE_PAGES.whatToExpect, GUIDE_PAGES.whyAttorney],
    filingPaths: [
      { agency: 'ADA Legal Link', url: null, description: 'Report through our intake form and we\'ll connect you with the right attorney.' },
      { agency: 'DOJ Complaint', url: 'https://civilrights.justice.gov/', description: 'Federal complaint for Title II and III violations.' }
    ]
  };
}