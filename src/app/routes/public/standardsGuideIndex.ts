/**
 * Guide index — shared metadata for all 46 Standards Guide deep-dive
 * pages. This is the single source of truth for:
 *
 *   - Slug → dynamic-import map (lazy-loaded route dispatcher)
 *   - Slug → user-facing title (link grid on /standards-guide)
 *   - Topic groupings (how we arrange the link grid)
 *
 * URL slug format is kebab-case lowercase, derived from the PascalCase
 * Guide<X> filename with the "Guide" prefix removed. Slugs kept stable
 * for SEO — changing a slug invalidates backlinks.
 */

import { lazy, type LazyExoticComponent, type ComponentType } from 'react';

export interface GuideMeta {
  slug: string;
  title: string;
  // Whether this guide has an embedded interactive diagram (used to
  // tag cards visually in the link grid).
  hasDiagram?: boolean;
}

export interface GuideTopic {
  id: string;
  heading: string;
  blurb: string;
  guides: GuideMeta[];
}

/** Dynamic-import map for React.lazy() routing. */
export const GUIDE_LOADERS: Record<string, LazyExoticComponent<ComponentType>> = {
  'accessible-documents': lazy(() => import('./standards/guides/GuideAccessibleDocuments.jsx')),
  'ada-coordinators': lazy(() => import('./standards/guides/GuideAdaCoordinators.jsx')),
  'ada-protections': lazy(() => import('./standards/guides/GuideAdaProtections.jsx')),
  'barrier-removal': lazy(() => import('./standards/guides/GuideBarrierRemoval.jsx')),
  'criminal-justice': lazy(() => import('./standards/guides/GuideCriminalJustice.jsx')),
  'digital-barriers': lazy(() => import('./standards/guides/GuideDigitalBarriers.jsx')),
  'education': lazy(() => import('./standards/guides/GuideEducation.jsx')),
  'effective-communication': lazy(() => import('./standards/guides/GuideEffectiveCommunication.jsx')),
  'emergency-management': lazy(() => import('./standards/guides/GuideEmergencyManagement.jsx')),
  'employment': lazy(() => import('./standards/guides/GuideEmployment.jsx')),
  'entrances': lazy(() => import('./standards/guides/GuideEntrances.jsx')),
  'filing-complaint': lazy(() => import('./standards/guides/GuideFilingComplaint.jsx')),
  'hotels-lodging': lazy(() => import('./standards/guides/GuideHotelsLodging.jsx')),
  'housing': lazy(() => import('./standards/guides/GuideHousing.jsx')),
  'intro-to-ada': lazy(() => import('./standards/guides/GuideIntroToAda.jsx')),
  'legal-options': lazy(() => import('./standards/guides/GuideLegalOptions.jsx')),
  'medical-facilities': lazy(() => import('./standards/guides/GuideMedicalFacilities.jsx')),
  'mobility-devices': lazy(() => import('./standards/guides/GuideMobilityDevices.jsx')),
  'new-construction': lazy(() => import('./standards/guides/GuideNewConstruction.jsx')),
  'parking': lazy(() => import('./standards/guides/GuideParking.jsx')),
  'parking-requirements': lazy(() => import('./standards/guides/GuideParkingRequirements.jsx')),
  'playgrounds': lazy(() => import('./standards/guides/GuidePlaygrounds.jsx')),
  'program-access': lazy(() => import('./standards/guides/GuideProgramAccess.jsx')),
  'ramps': lazy(() => import('./standards/guides/GuideRamps.jsx')),
  'reach-ranges': lazy(() => import('./standards/guides/GuideReachRanges.jsx')),
  'reasonable-modifications': lazy(() => import('./standards/guides/GuideReasonableModifications.jsx')),
  'restaurants-retail': lazy(() => import('./standards/guides/GuideRestaurantsRetail.jsx')),
  'restrooms': lazy(() => import('./standards/guides/GuideRestrooms.jsx')),
  'service-animals': lazy(() => import('./standards/guides/GuideServiceAnimals.jsx')),
  'sidewalks': lazy(() => import('./standards/guides/GuideSidewalks.jsx')),
  'signage': lazy(() => import('./standards/guides/GuideSignage.jsx')),
  'small-business': lazy(() => import('./standards/guides/GuideSmallBusiness.jsx')),
  'social-media': lazy(() => import('./standards/guides/GuideSocialMedia.jsx')),
  'swimming-pools': lazy(() => import('./standards/guides/GuideSwimmingPools.jsx')),
  'tax-incentives': lazy(() => import('./standards/guides/GuideTaxIncentives.jsx')),
  'title-i': lazy(() => import('./standards/guides/GuideTitleI.jsx')),
  'title-ii': lazy(() => import('./standards/guides/GuideTitleII.jsx')),
  'title-iii': lazy(() => import('./standards/guides/GuideTitleIII.jsx')),
  'turning-handrails': lazy(() => import('./standards/guides/GuideTurningHandrails.jsx')),
  'voting': lazy(() => import('./standards/guides/GuideVoting.jsx')),
  'wcag-explained': lazy(() => import('./standards/guides/GuideWcagExplained.jsx')),
  'web-first-steps': lazy(() => import('./standards/guides/GuideWebFirstSteps.jsx')),
  'web-rule': lazy(() => import('./standards/guides/GuideWebRule.jsx')),
  'web-testing': lazy(() => import('./standards/guides/GuideWebTesting.jsx')),
  'what-to-expect': lazy(() => import('./standards/guides/GuideWhatToExpect.jsx')),
  'why-attorney': lazy(() => import('./standards/guides/GuideWhyAttorney.jsx')),
};

/**
 * Topic groupings for the link grid on /standards-guide. Each topic
 * lists a subset of the 46 slugs in a deliberate reading order.
 *
 * Pages appear in at most one topic — no guide is listed twice.
 * Everything in GUIDE_LOADERS MUST be covered here so the link grid
 * surfaces all 46 guides.
 */
export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: 'foundations',
    heading: 'Foundations',
    blurb: 'Start here if you\'re new to the ADA.',
    guides: [
      { slug: 'intro-to-ada', title: 'Introduction to the ADA' },
      { slug: 'ada-protections', title: 'Who the ADA Protects' },
      { slug: 'title-i', title: 'Title I: Employment' },
      { slug: 'title-ii', title: 'Title II: State & Local Government' },
      { slug: 'title-iii', title: 'Title III: Public Accommodations' },
    ],
  },
  {
    id: 'physical-access',
    heading: 'Physical access',
    blurb: 'What the built environment has to provide.',
    guides: [
      { slug: 'ramps', title: 'Ramps & Slope Requirements', hasDiagram: true },
      { slug: 'entrances', title: 'Accessible Entrances & Doors', hasDiagram: true },
      { slug: 'restrooms', title: 'Accessible Restroom Requirements', hasDiagram: true },
      { slug: 'parking', title: 'Accessible Parking Rights' },
      { slug: 'parking-requirements', title: 'Accessible Parking Requirements', hasDiagram: true },
      { slug: 'turning-handrails', title: 'Turning Spaces & Handrail Profiles', hasDiagram: true },
      { slug: 'reach-ranges', title: 'Reach Ranges & Operable Parts', hasDiagram: true },
      { slug: 'sidewalks', title: 'Sidewalks & Pedestrian Access' },
      { slug: 'signage', title: 'ADA Signage Requirements' },
    ],
  },
  {
    id: 'places-and-programs',
    heading: 'Places & programs',
    blurb: 'Specific settings and the rules that apply to them.',
    guides: [
      { slug: 'hotels-lodging', title: 'Hotels & Lodging' },
      { slug: 'restaurants-retail', title: 'Restaurants & Retail' },
      { slug: 'medical-facilities', title: 'Medical Facilities' },
      { slug: 'education', title: 'Education' },
      { slug: 'housing', title: 'Housing & Apartments' },
      { slug: 'swimming-pools', title: 'Swimming Pools' },
      { slug: 'playgrounds', title: 'Playgrounds' },
      { slug: 'voting', title: 'Voting & Elections' },
      { slug: 'criminal-justice', title: 'Criminal Justice' },
      { slug: 'emergency-management', title: 'Emergency Management' },
      { slug: 'program-access', title: 'Program Accessibility' },
    ],
  },
  {
    id: 'digital-access',
    heading: 'Digital access',
    blurb: 'Websites, apps, and documents.',
    guides: [
      { slug: 'digital-barriers', title: 'Website & App Barriers' },
      { slug: 'web-rule', title: 'Title II Web Accessibility Rule' },
      { slug: 'wcag-explained', title: 'WCAG 2.1 AA — What It Requires' },
      { slug: 'web-first-steps', title: 'First Steps Toward Compliance' },
      { slug: 'web-testing', title: 'Testing Your Website' },
      { slug: 'social-media', title: 'Social Media & Digital Content' },
      { slug: 'accessible-documents', title: 'Making Documents Accessible' },
    ],
  },
  {
    id: 'rights-and-accommodations',
    heading: 'Rights & accommodations',
    blurb: 'Service animals, devices, and reasonable adjustments.',
    guides: [
      { slug: 'service-animals', title: 'Service Animals' },
      { slug: 'mobility-devices', title: 'Wheelchairs & Mobility Devices' },
      { slug: 'reasonable-modifications', title: 'Reasonable Modifications' },
      { slug: 'effective-communication', title: 'Effective Communication' },
      { slug: 'employment', title: 'Employment Accommodations' },
    ],
  },
  {
    id: 'business-obligations',
    heading: 'Business obligations',
    blurb: 'What owners and operators have to do.',
    guides: [
      { slug: 'barrier-removal', title: 'Barrier Removal: What\'s Readily Achievable?' },
      { slug: 'new-construction', title: 'New Construction & Alterations' },
      { slug: 'small-business', title: 'Small Business Primer' },
      { slug: 'tax-incentives', title: 'ADA Tax Incentives' },
      { slug: 'ada-coordinators', title: 'ADA Coordinators' },
    ],
  },
  {
    id: 'taking-action',
    heading: 'Taking action',
    blurb: 'What to do when your rights have been violated.',
    guides: [
      { slug: 'legal-options', title: 'Your Legal Options' },
      { slug: 'filing-complaint', title: 'Filing a Complaint' },
      { slug: 'what-to-expect', title: 'What to Expect from the Process' },
      { slug: 'why-attorney', title: 'Why You Need an Attorney' },
    ],
  },
];

/** Flat list of every guide with its title, derived from GUIDE_TOPICS. */
export const ALL_GUIDES: GuideMeta[] = GUIDE_TOPICS.flatMap((t) => t.guides);

/** Lookup a user-facing title by slug (for breadcrumbs, etc.). */
export function titleForSlug(slug: string): string | null {
  return ALL_GUIDES.find((g) => g.slug === slug)?.title ?? null;
}
