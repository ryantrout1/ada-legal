/**
 * Per-route SEO copy for every page that is prerendered into static HTML.
 *
 * ONE table, three readers:
 *   - src/app/components/RouteSeo.tsx   renders it as <title>, description,
 *                                       canonical and social tags
 *   - scripts/prerender.mjs             decides which routes get a static file
 *   - api/sitemap.ts                    lists the same routes for crawlers
 *
 * Because they all read this file, a page cannot be prerendered without a
 * title and description, and the sitemap cannot drift from what is served.
 *
 * Rules (enforced by tests/unit/routeMeta.test.ts):
 *   - title       60 characters or fewer, unique across the table
 *   - description 155 characters or fewer, unique across the table
 *   - every string is written from what the page itself says; nothing here
 *     is a claim the page does not make
 *
 * Plain TypeScript only. This module is imported by Node (the sitemap
 * lambda and the prerender build step), so no React, no Vite-only imports,
 * relative `.js` specifiers (docs/DO_NOT_TOUCH.md, Rule 13).
 */

import { CHAPTER_META } from '../../app/routes/public/chapterMeta.js';
import { PAGE_COPY } from './pageCopy.js';

export interface RouteMeta {
  /** URL path, no trailing slash except for "/". */
  path: string;
  title: string;
  description: string;
  /** Open Graph type. Guides and chapters are articles; the rest websites. */
  ogType: 'website' | 'article';
}

const BRAND = 'ADA Legal Link';

const STATIC_META: Omit<RouteMeta, 'ogType'>[] = [
  {
    path: '/',
    title: 'ADA Legal Link — Know the Law. Know Your Rights.',
    description:
      'If a barrier shut you out, we help you understand what happened and connect you with someone who can help.',
  },
  {
    path: '/ada',
    title: `Talk to Ada, the ADA Intake Assistant | ${BRAND}`,
    description:
      'Talk to Ada, the AI assistant at ADA Legal Link. Describe what happened and see your next step. Informational only; Ada is not a lawyer.',
  },
  {
    path: '/lawsuits',
    title: `Active ADA Lawsuits and Class Actions | ${BRAND}`,
    description:
      "ADA class actions, enforcement actions, consent decrees, and other accessibility matters we're tracking. Open any case to see who it may affect.",
  },
  {
    path: '/standards-guide',
    title: `ADA Standards Guide in Plain Language | ${BRAND}`,
    description:
      'The 2010 ADA Standards for Accessible Design, reorganized by topic with plain-language explanations and interactive diagrams. Free and fully accessible.',
  },
  {
    path: '/spot',
    title: `Spot: Free ADA Photo Check | ${BRAND}`,
    description:
      'Upload one photo of a doorway, ramp, parking space or restroom. Spot reads it against the ADA standards and names what stands out. A screening read, free.',
  },
  {
    path: '/attorneys',
    title: `Find an ADA Attorney | ${BRAND}`,
    description:
      'Browse experienced ADA attorneys in our network. Reach out directly to discuss your situation.',
  },
  {
    path: '/for-attorneys',
    title: `For ADA Attorneys | ${BRAND}`,
    description:
      'ADA Legal Link is a free intake and triage service for people facing access barriers. Learn how our small, vetted attorney network works. No referral fees.',
  },
  {
    path: '/glossary',
    title: `ADA Glossary: Plain-Language Definitions | ${BRAND}`,
    description:
      'Plain-language definitions of the acronyms, legal terms and concepts used across ADA Legal Link, explained without jargon.',
  },
  {
    path: '/accessibility',
    title: `Accessibility Statement | ${BRAND}`,
    description:
      'We target WCAG 2.2 Level AAA. If a disability keeps you from using this site, email accessibility@adalegallink.com. We reply within two business days.',
  },
  {
    path: '/about-ada',
    title: `About Ada: Why She's Called Ada | ${BRAND}`,
    description:
      'Ada is named for Ada Lovelace, who imagined what computers could become, and for the law that said nobody gets shut out. Meet the assistant.',
  },
  {
    path: '/privacy',
    title: `Privacy Policy | ${BRAND}`,
    description:
      'What information ADA Legal Link collects, what we do with it, who we share it with, how long we keep it, and your rights. Plain language and legal text.',
  },
  {
    path: '/terms',
    title: `Terms of Service | ${BRAND}`,
    description:
      'The terms for using ADA Legal Link: Ada gives information, not legal advice; the service is free; and any attorney relationship is between you and them.',
  },
];

/**
 * The 46 Standards Guide deep dives. Keep in step with GUIDE_LOADERS in
 * src/app/routes/public/standardsGuideIndex.ts (that module imports
 * React.lazy and is not server-safe, so the list is repeated here; the
 * unit test fails if the two differ).
 *
 * Titles and descriptions are drawn from each guide's own h1 and section
 * headings.
 */
export const GUIDE_META: { slug: string; title: string; description: string }[] = [
  {
    slug: 'accessible-documents',
    title: 'Making Documents Accessible',
    description:
      'How to make PDFs, scanned documents, Word files and presentations accessible, and why agencies and businesses must post documents everyone can use.',
  },
  {
    slug: 'ada-coordinators',
    title: 'ADA Coordinators: Roles and Requirements',
    description:
      'Who must designate an ADA Coordinator, what the role involves, how to publish coordinator contact details, and how grievance procedures work.',
  },
  {
    slug: 'ada-protections',
    title: 'Who the ADA Protects',
    description:
      "The ADA's three-part definition of disability, major life activities, what 'substantially limits' means, episodic conditions, and the 'regarded as' prong.",
  },
  {
    slug: 'barrier-removal',
    title: 'Barrier Removal: Readily Achievable Rule',
    description:
      "What 'readily achievable' means for businesses under Title III, the factors that decide it, the priority order for removing barriers, and common examples.",
  },
  {
    slug: 'criminal-justice',
    title: 'Criminal Justice and the ADA',
    description:
      'How the ADA applies from police encounters and arrests to courts, jails and prisons, including mobility devices and accessible court facilities.',
  },
  {
    slug: 'digital-barriers',
    title: 'Website and App Barriers: Your Rights',
    description:
      'How the ADA covers websites and apps, what counts as a digital barrier, how to document one, and what you can do about it.',
  },
  {
    slug: 'education',
    title: 'Education and the ADA',
    description:
      'How the ADA applies in public K–12 schools, public universities, and private schools and colleges, plus testing accommodations.',
  },
  {
    slug: 'effective-communication',
    title: 'Effective Communication Under the ADA',
    description:
      'What effective communication means, auxiliary aids and services, the primary consideration rule, companions, and when an interpreter is required.',
  },
  {
    slug: 'emergency-management',
    title: 'Emergency Management and Disability',
    description:
      'How the ADA applies in emergencies: accessible shelters, evacuation plans, accessible emergency notifications, and service animals in shelters.',
  },
  {
    slug: 'employment',
    title: 'Employment and the ADA (Title I)',
    description:
      'Who Title I covers, what a reasonable accommodation is, the interactive process, what employers cannot do, and how to file a Title I complaint.',
  },
  {
    slug: 'entrances',
    title: 'Accessible Entrances and Doors',
    description:
      'Door clear width, maneuvering clearances, hardware and thresholds, and how many entrances must be accessible, with key numbers and a checklist.',
  },
  {
    slug: 'filing-complaint',
    title: 'How to File an ADA Complaint',
    description:
      'Who can file, where to file, the DOJ complaint process step by step, what to include in your complaint, and timelines and deadlines.',
  },
  {
    slug: 'hotels-lodging',
    title: 'Hotel and Lodging Accessibility',
    description:
      'How many accessible guest rooms hotels need, roll-in showers versus tub rooms, reservation system rules, room dispersion, and communication features.',
  },
  {
    slug: 'housing',
    title: 'Housing, Apartments and the ADA',
    description:
      'Which law applies to housing, Fair Housing Act design requirements, reasonable accommodations and modifications, and ADA Title II for public housing.',
  },
  {
    slug: 'intro-to-ada',
    title: 'Introduction to the ADA',
    description:
      'What the ADA is, who it protects, the five titles of the law, how it is enforced, and related laws you should know.',
  },
  {
    slug: 'legal-options',
    title: 'Your Legal Options After an ADA Violation',
    description:
      'A government complaint is not a lawyer. Your options under Title I (EEOC), Titles II and III (DOJ or a private lawsuit), and Fair Housing (HUD).',
  },
  {
    slug: 'medical-facilities',
    title: 'Medical Facility Accessibility',
    description:
      'Accessible exam rooms and medical equipment, effective communication in healthcare, and the scoping rules for medical care facilities.',
  },
  {
    slug: 'mobility-devices',
    title: 'Wheelchairs and Mobility Devices',
    description:
      'Wheelchairs are always allowed. Rules for other power-driven mobility devices, the five assessment factors, what staff may ask, and storage and handling.',
  },
  {
    slug: 'new-construction',
    title: 'New Construction and Alterations',
    description:
      'Accessibility rules for new buildings and alterations: which standards apply, what triggers compliance, and the path of travel rule.',
  },
  {
    slug: 'parking',
    title: 'Accessible Parking Rights',
    description:
      'Federal accessible parking rules: how many spaces are required, van-accessible spaces, signage, access aisles, and common parking violations.',
  },
  {
    slug: 'parking-requirements',
    title: 'Accessible Parking Requirements',
    description:
      'Space sizes and layout, signs, how many accessible spaces are required, and van space and access aisle dimensions, with key numbers and a checklist.',
  },
  {
    slug: 'playgrounds',
    title: 'Accessible Playgrounds',
    description:
      'What the ADA requires of playgrounds: ground-level and elevated play components, accessible routes within play areas, transfer platforms and steps.',
  },
  {
    slug: 'program-access',
    title: 'Program Accessibility',
    description:
      'How program access works for government facilities under Title II, ways to achieve it, transition plans, and the undue burden limit.',
  },
  {
    slug: 'ramps',
    title: 'Ramp and Slope Requirements',
    description:
      'Maximum ramp slope and rise per run, landings, handrails and edge protection, and when a ramp is required, with key numbers and a checklist.',
  },
  {
    slug: 'reach-ranges',
    title: 'Reach Ranges and Operable Parts',
    description:
      'Forward and side reach ranges, obstructed and unobstructed reach, and the rules for operable parts, with key numbers and measurements.',
  },
  {
    slug: 'reasonable-modifications',
    title: 'Reasonable Modifications',
    description:
      'What a reasonable modification is, how it differs from an accommodation, common examples, when one is not required, and the interactive process.',
  },
  {
    slug: 'restaurants-retail',
    title: 'Restaurants and Retail Accessibility',
    description:
      'Accessible dining surfaces, food service lines, sales and service counters, checkout aisles, and display aisles for restaurants and stores.',
  },
  {
    slug: 'restrooms',
    title: 'Accessible Restroom Requirements',
    description:
      'Accessible toilet stall layout and dimensions, grab bars, toilet height and position, and how many accessible restrooms are required.',
  },
  {
    slug: 'service-animals',
    title: 'Service Animals and the ADA',
    description:
      'What counts as a service animal, miniature horses, why emotional support animals are not service animals, and the two questions businesses may ask.',
  },
  {
    slug: 'sidewalks',
    title: 'Sidewalks and Pedestrian Access',
    description:
      'Government responsibility for accessible sidewalks, sidewalk requirements, curb ramps, pedestrian signals, and common barriers and complaints.',
  },
  {
    slug: 'signage',
    title: 'ADA Signage Requirements',
    description:
      'Room identification signs, raised characters and Braille, directional and informational signs, the International Symbol of Accessibility, and exit signs.',
  },
  {
    slug: 'small-business',
    title: 'Small Business ADA Primer',
    description:
      'Which businesses the ADA covers, three main obligations, new construction versus existing buildings, the readily achievable standard, and training.',
  },
  {
    slug: 'social-media',
    title: 'Accessible Social Media and Digital Content',
    description:
      'Why social media accessibility matters, with guidance on alt text for images, captions on video, audio description, and plain language in posts.',
  },
  {
    slug: 'swimming-pools',
    title: 'Swimming Pool Accessibility',
    description:
      'Which pools are covered, means of entry for large and small pools, pool lifts, and sloped entries under the ADA standards.',
  },
  {
    slug: 'tax-incentives',
    title: 'ADA Tax Incentives for Businesses',
    description:
      'The two federal accessibility tax incentives, the Section 44 Disabled Access Credit and the Section 190 barrier removal deduction, and what qualifies.',
  },
  {
    slug: 'title-i',
    title: 'Title I: Employment',
    description:
      'Who Title I covers, reasonable accommodation, hiring and interviews, and how to file an employment discrimination complaint under the ADA.',
  },
  {
    slug: 'title-ii',
    title: 'Title II: State and Local Government',
    description:
      'Title II duties for state and local governments: program access, effective communication, reasonable modifications, self-evaluation and transition plans.',
  },
  {
    slug: 'title-iii',
    title: 'Title III: Public Accommodations',
    description:
      'Who Title III covers, barrier removal, the 2010 ADA Standards, websites and digital access, and enforcement and remedies for businesses open to the public.',
  },
  {
    slug: 'turning-handrails',
    title: 'Turning Spaces and Handrail Profiles',
    description:
      'Turning space dimensions and where they are required, design tips, handrail profiles, and where handrails are required, with key numbers.',
  },
  {
    slug: 'voting',
    title: 'Voting and Election Accessibility',
    description:
      'Your right to vote accessibly: polling place access, accessible voting equipment, curbside voting, and effective communication at the polls.',
  },
  {
    slug: 'wcag-explained',
    title: 'WCAG 2.1 Level AA: What It Requires',
    description:
      'The four WCAG principles (perceivable, operable, understandable, robust) and what Level AA asks of websites and apps.',
  },
  {
    slug: 'web-first-steps',
    title: 'First Steps Toward Web Compliance',
    description:
      'A practical start: run an accessibility audit, prioritize issues by severity, create a remediation plan, and build accessibility into vendor contracts.',
  },
  {
    slug: 'web-rule',
    title: 'Title II Web and App Accessibility Rule',
    description:
      'The DOJ rule that sets a technical standard for government websites and mobile apps: what it requires, who it applies to, deadlines, and exceptions.',
  },
  {
    slug: 'web-testing',
    title: 'How to Test Your Website for Accessibility',
    description:
      'Why testing matters, automated testing tools, manual testing, screen reader testing, and the most common issues found.',
  },
  {
    slug: 'what-to-expect',
    title: 'What to Expect: The ADA Legal Process',
    description:
      'The steps of an ADA matter: document the violation, report it through ADA Legal Link, attorney review and demand letter, negotiation, and court.',
  },
  {
    slug: 'why-attorney',
    title: 'Why You Need an ADA Attorney',
    description:
      'Why the ADA is mostly enforced through private lawsuits, what an ADA attorney does that you cannot, the risks of going alone, and how we connect you.',
  },
];

function guideRoutes(): RouteMeta[] {
  return GUIDE_META.map((g) => ({
    path: `/standards-guide/guide/${g.slug}`,
    title: `${g.title} | ${BRAND}`,
    description: g.description,
    ogType: 'article' as const,
  }));
}

function chapterRoutes(): RouteMeta[] {
  return CHAPTER_META.map((c) => ({
    path: `/standards-guide/chapter/${c.num}`,
    title: `ADA Standards Chapter ${c.num}: ${c.title}`,
    description: c.description,
    ogType: 'article' as const,
  }));
}

/** Every prerendered route, in sitemap order: static pages, chapters, guides. */
export const ROUTE_META: RouteMeta[] = [
  ...STATIC_META.map((m) => ({ ...m, ogType: 'website' as const })),
  ...chapterRoutes(),
  ...guideRoutes(),
].map((r) => {
  // pageCopy.ts holds the reviewed search copy for the pages Miloe drafted.
  // Where a path has an entry, its title and description replace the ones above.
  const copy = PAGE_COPY[r.path];
  return copy ? { ...r, title: copy.title, description: copy.description } : r;
});

const BY_PATH = new Map(ROUTE_META.map((r) => [r.path, r]));

/** Look up a route's SEO copy. Accepts a trailing slash. */
export function routeMeta(pathname: string): RouteMeta | undefined {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  return BY_PATH.get(p);
}

/** Every path that gets a static prerendered HTML file. */
export function prerenderPaths(): string[] {
  return ROUTE_META.map((r) => r.path);
}
