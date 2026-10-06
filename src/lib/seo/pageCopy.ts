/**
 * Search copy for the pages Miloe drafted from the SEO roadmap (Oct 2026).
 *
 * Each entry carries the title and meta description that replace the ones in
 * routeMeta.ts, and a block of markdown that SeoCopy renders at the end of the
 * page. routeMeta.ts applies the title and description; SeoCopy applies the body.
 *
 * Edits made to the drafts when they were brought in:
 *   - hashtag lines removed; a stray character removed
 *   - /standards-guide/guide/entrances: sliding-door threshold claim dropped
 *     (the 3/4 inch figure is for existing or altered thresholds, not sliding doors)
 *   - /standards-guide/guide/employment: job complaints do not go to the DOJ
 *   - /standards-guide/guide/filing-complaint: deadlines now match the guide itself
 *     (180 days; 300 in some states for jobs; DOJ may accept later)
 *   - /standards-guide/guide/digital-barriers: Title II web rule dates updated to the
 *     April 2026 extension (April 26, 2027 and April 26, 2028)
 *   - education and accessibility descriptions shortened to fit 155 characters
 *   - Spot price and photo count are placeholders filled from the live offer
 *     ({{SPOT_PRICE}}, {{SPOT_PHOTOS}}) so this copy cannot drift from the price
 *
 * Plain TypeScript, no imports: routeMeta.ts is read by Node (sitemap lambda,
 * prerender build) as well as by the app.
 */

export interface PageCopy {
  title: string;
  description: string;
  body: string;
}

export const PAGE_COPY: Record<string, PageCopy> = {
  '/about-ada': {
    title: 'About the ADA: The Law, Plain and Simple',
    description:
      'What the Americans with Disabilities Act is, what it covers and why it matters. Plain-language background on the ADA from ADA Legal Link.',
    body: `## What the ADA actually is

The Americans with Disabilities Act, or ADA, is a federal civil rights law. It says disabled people get the same access as everyone else: to buildings, to businesses, to government services, to transportation, and generally to websites and apps.

Access is a right under this law, not a favor a business chooses to offer.

## When it became law

President George H. W. Bush signed the ADA on July 26, 1990, on the South Lawn of the White House. He called it the world's first comprehensive declaration of equality for people with disabilities.

The law did not appear out of nowhere. Disabled activists won it, including the Capitol Crawl that same March, when activists got out of their wheelchairs and pulled themselves up the Capitol steps so Congress could see what inaccessibility means.

## What it covers

The ADA is organized into titles that cover different parts of daily life: private businesses open to the public, state and local government services, and public transportation, among others. It generally requires that doorways, ramps, restrooms, and parking spaces meet accessibility standards, and that new construction and alterations follow those rules. What applies in a given case depends on the type of place and the specific barrier.

The 2010 ADA Standards for Accessible Design spell out the measurements and rules in detail. If you want the plain-language version of those standards, read the [Standards Guide](/standards-guide).

## Why this page matters to you

If a building, a website, or a service shut you out, that was not your fault, and the ADA is often the reason it shouldn't have happened. Knowing the basics helps you recognize a barrier and figure out what to ask about next.

If you want to see how the ADA plays out in real situations, the cases we track show it filed, alleged, or settled, as each listing states.

## Where to go from here

This page covers background, not your specific situation. For what the standards say about a specific space, read the Standards Guide. For a quick read on a doorway, ramp, restroom, or parking space you've run into, Spot gives a free first look.

[Read the ADA Standards Guide](/standards-guide)`,
  },

  '/accessibility': {
    title: 'Website Accessibility Statement | ADA Legal Link',
    description:
      'Our accessibility statement: we target WCAG 2.2 Level AAA, test with axe-core and screen readers, and list known issues. Email us if a page fails you.',
    body: `## What an accessibility statement is for

This page explains how we build adalegallink.com so disabled people can actually use it. It covers what standard we aim for, how we test, what features we offer, and where we still fall short. An accessibility statement is not a certification. We're telling you what we do and inviting you to tell us when it doesn't work.

## The standard we target

We target WCAG 2.2 Level AAA, the highest of the three published web accessibility levels. We don't claim to be fully AAA compliant everywhere. We're telling you our target and tracking our gaps in the open, below.

## How we check our work

Every release runs through the axe-core accessibility engine at AAA level on every public page. Before anything ships, someone also checks it by hand with a keyboard and a screen reader. Automated tools generally only catch a portion of real accessibility problems, so human review is how we catch the rest. This also means you may run into something we haven't found yet, and that's useful for us to hear about.

## Features built into the site

* Voice input in every chat conversation with Ada
* Read-aloud answers, turned on in the chat header
* A plain-language reading level setting
* Saved conversations, so you can step away and come back within 30 days
* Downloadable conversation history
* Full keyboard navigation on every button, link and input
* Support for Windows High Contrast and macOS Increase Contrast
* Reduced motion when your operating system has that setting on

## Known issues right now

We list what's broken instead of hiding it. As of today, voice input does not work in Firefox, though it works in Chrome, Edge and Safari. We'll update this list as issues are fixed or found.

## If something doesn't work for you

If a disability keeps you from using any part of this site, email accessibility@adalegallink.com. Tell us what you were trying to do and what happened. We reply within two business days, and if you'd rather talk it through, say so in the email and we'll find a way.

This statement covers the adalegallink.com website itself. If you've hit a barrier at a building, a different website or a service and want to understand your rights, that's a separate question. You can [read the ADA Standards Guide](/standards-guide) for plain-language answers, or [get a free Spot read](/spot) of a photo if you're wondering about a specific space.`,
  },

  '/ada': {
    title: 'Know Your ADA Rights | What the ADA Law Covers',
    description:
      'What is the ADA and what rights does it give you. Plain language guide to the ADA law, then talk to Ada about what happened to you.',
    body: `## What is the ADA law

The Americans with Disabilities Act (ADA) is a federal civil rights law. It generally says disabled people have the right to access buildings, websites, and services the same as anyone else. If a place is open to the public, it generally has to be open to you too.

The ADA has five parts, called titles. They cover things like employment, state and local government services, and businesses open to the public. Which title applies depends on what happened and where. The [Standards Guide](/standards-guide) walks through the 2010 ADA Standards for Accessible Design, the federal rules that set out things like door width, ramp slope, and parking space size.

## Know your ADA rights

Access is a right, not a favor. If a building, a website, or a service shut you out when it was supposed to be open to you, that was not your fault. It may also not be legal, depending on the facts.

Some things that are generally true under the ADA:

- Businesses open to the public generally have to remove barriers when it's readily achievable.
- You generally have the right to bring a service animal into most public places.
- Government offices and services generally have to be accessible, under a separate part of the ADA.
- Websites and apps are a developing area; accessibility expectations generally apply, though the law here is less settled than for buildings.

Each of these depends on the specific situation. The [Standards Guide](/standards-guide) breaks these topics down by category, with plain-language explanations next to the official legal text.

## What to do if you hit a barrier

You don't have to figure this out alone. Talk to Ada below. Describe what happened, in your own words, at your own pace. She'll help you understand whether it looks like an ADA issue and point you to a next step, whether that's the Standards Guide, a complaint process, or an attorney.

If you want to check a specific spot first, like a doorway, ramp, restroom, or parking space, [get a free Spot read](/spot) instead. Spot names what stands out in one photo; it's a screening read, not a legal answer.

Ada is not a lawyer. This is informational only, not legal advice.`,
  },

  '/attorneys': {
    title: 'Find an ADA Attorney Near You | ADA Legal Link',
    description:
      'Looking for an ADA attorney near you? Browse our network and reach out directly to talk through what happened, in plain language.',
    body: `## Looking for an ADA attorney near you

If a building, a website, or a service shut you out, you may want to talk to someone who handles ADA cases for a living. This page connects you to attorneys in our network who take on ADA matters. Browse the list below and reach out directly to whoever fits your situation.

This isn't a law firm, and nothing here is legal advice. We're a bridge between people who hit barriers and attorneys who know this area of law well.

## How to find an ADA lawyer that fits

Every barrier is different, and so is every attorney's focus. Some work mostly on physical barriers, like steps, parking, or restrooms. Others focus on digital access, like websites and apps that don't work with a screen reader. When you reach out, say plainly what happened and where. That helps an attorney tell you quickly whether it's something they can take on.

It generally helps to have a few basics ready before you call or email:

- Where and when the barrier happened
- What kept you out, as specifically as you can describe it
- Any photos you already have
- Whether anyone else was there or saw it happen

You don't need all of this to reach out. An attorney can tell you what else they need.

## Not sure yet if this is an ADA issue

If you're still working out whether what happened is covered by the ADA, the Standards Guide walks through the rules in plain language, organized by topic so you can find the part that matches your situation.

[Read the ADA Standards Guide](/standards-guide)

If you want a straight read on a specific space, like a doorway, ramp, restroom, or parking spot, Spot gives a free screening read from one photo.

## What happens when you reach out

Attorneys in our network generally respond to talk through your situation directly. They'll ask what happened and help you understand your options from there. Nobody here can tell you in advance how a case will turn out. What they can do is listen, explain the process, and tell you honestly whether they think they can help.

This directory is informational only. It is not legal advice, and ADA Legal Link is not a law firm.`,
  },

  '/for-attorneys': {
    title: 'For Attorneys | ADA Legal Link Vetted Case Network',
    description:
      'Searching for an ADA attorney for your case? This page is for attorneys joining our network. Find legal help for your own barrier at /attorneys instead.',
    body: `## Looking for an ADA attorney for your case

If you hit a barrier and want an ADA attorney for your case, this page isn't the right stop. This page is for attorneys who want to join our vetted network, not for people who need legal help.

To find an ADA attorney for your case, use our [attorney directory](/attorneys). It lists approved attorneys you can reach out to directly about what happened. If you'd rather talk it through first, our intake assistant Ada can help you understand whether what you experienced looks like an ADA issue, and point you to the right place, including an attorney if that fits.

ADA Legal Link is informational only. We are not a law firm, and nothing here is legal advice. Whether an attorney takes your case, and what happens with it, is between you and that attorney.

## What this page covers

The rest of this page explains how we build our attorney network: a free, no-fee intake and triage service that pre-screens cases through Ada before introducing them to vetted attorneys who handle disability access work. If you're an attorney interested in joining, keep reading below. If you're someone who hit a barrier, head to [Find an Attorney](/attorneys) or go [talk to Ada](/ada) about what happened.

## Not sure it was a barrier

If you're not sure whether something you ran into counts as an ADA issue, you don't need to guess. Read the [ADA Standards Guide](/standards-guide) for a plain-language explanation of what the standards generally require, or check [cases we track](/lawsuits) to see how similar situations have been described as filed, alleged, or settled. These are starting points, not a verdict on your situation, since it depends on the facts.`,
  },

  '/glossary': {
    title: 'ADA Glossary: Terms Explained, Plus What ADA Compliant Means',
    description:
      'Plain-language ADA glossary. Look up Title I, II, III, DOJ, EEOC, and what people mean when they say a place is ADA compliant.',
    body: `## What does ADA compliant mean

People use "ADA compliant" to mean a place generally meets the 2010 ADA Standards for Accessible Design: things like ramp slope, door width, parking spaces, and restroom grab bars measured to spec.

There's a catch worth knowing. No agency hands out an ADA compliance certificate, and no inspector signs off and makes a place permanently compliant. The ADA is a civil rights law, not a licensing system. Whether a specific barrier breaks the law generally depends on the facility, when it was built, and what's feasible to fix, among other things. That's why you'll see us say a place "generally meets" or "looks like it follows" the standards, not that it "is compliant."

This is also why Spot never tells you a place is ADA compliant or non-compliant. Spot reads one photo and names what stands out, like a lip at the door or a ramp pitched too steep, and how serious it looks. That's a screening read, not an inspection or a certification.

If you want the actual measurements behind the term, the [ADA Standards Guide](/standards-guide) breaks them down by topic: parking, ramps, doors, restrooms, and more.

## More ADA glossary terms

**Title I.** The part of the ADA covering employment. Enforced by the Equal Employment Opportunity Commission (EEOC).

**Title II.** The part of the ADA covering state and local government services, programs, and activities.

**Title III.** The part of the ADA covering businesses open to the public, sometimes called public accommodations, such as stores, restaurants, and hotels.

**Public accommodation.** A business or facility open to the public that generally has to follow Title III rules, like a store, restaurant, theater, or doctor's office.

**Reasonable accommodation.** A change to a policy, practice, or workplace that generally lets a disabled person participate, as long as it doesn't create an undue burden.

**Auxiliary aids and services.** Tools like interpreters, captioning, or large-print materials that help with effective communication.

**Consent decree.** A court-approved agreement settling a case, often requiring specific changes over time. See examples on the [cases we track](/lawsuits).

If a term you're looking for isn't here yet, it's worth checking back, or asking Ada once she's live. For now, the fastest way to find a specific rule is the [ADA Standards Guide](/standards-guide).`,
  },

  '/lawsuits': {
    title: 'ADA Lawsuits and Class Actions We Track',
    description:
      'See active ADA lawsuits, enforcement actions, and investigations by topic and state. Learn how real cases work before you decide your next step.',
    body: `## Wondering if what happened to you is an ADA issue

Searching for an ADA lawsuit usually starts with one moment: a door that wouldn't open, a counter too high, a site that locked you out. You want to know what the law says and what other people in your spot have done.

This page tracks real cases. Each one is filed, alleged, or settled, exactly as the court or agency describes it. Reading them shows you what an ADA claim generally looks like, who brought it, and what happened next. It is not a prediction of what would happen with your own situation.

### What these cases can tell you

Each entry below names the barrier, who raised it, and where the case stands: active, under investigation, in compliance and monitoring, or tracking only. Open any case to read the details. Topics range from rideshare and air travel to healthcare offices, housing, and government services.

These are real, documented actions. We did not write them to predict an outcome, and reading them is not the same as getting advice about your own barrier.

### If you hit a barrier yourself

Whether a barrier is something the ADA covers depends on the place, the barrier, and the facts around it. The standards guide explains, in plain language, what the ADA generally requires in areas like parking, doorways, ramps, and restrooms.

If you want to talk through what happened to you specifically, Ada can listen and help you understand whether it looks like an ADA issue, in plain language and at your pace. She is opening soon.

If you run a business and want to check your own space before anyone else notices a problem, Spot gives a free read from one photo.

### Read the standards behind these cases

Many of the barriers named in these cases connect back to specific rules in the 2010 ADA Standards for Accessible Design. Reading the standards guide first can help you understand what a case is actually arguing, and why.

[Read the ADA Standards Guide](/standards-guide)`,
  },

  '/spot': {
    title: 'Spot: Check if a Building Looks ADA Accessible by Photo',
    description:
      "Check if a building is ADA compliant with a photo? Spot gives a free screening read, not a certification. Upload one photo and see what stands out.",
    body: `## Can a photo tell you if a building is ADA compliant

No single photo can certify a building as ADA compliant. Spot doesn't inspect or certify anything. What Spot does is give you a free screening read: point your camera at a doorway, ramp, parking space or restroom, and Spot names what stands out and how serious it looks.

A full compliance check usually means measurements, multiple angles and sometimes a professional survey. Spot is a faster first look, useful for spotting things worth a closer check, not a replacement for one.

## How the Spot photo check works

Spot reads your photo against the 2010 ADA Standards and only speaks to what's actually in the frame. For a parking space, that might mean the width of the access aisle. For a doorway, the clear width or a lip at the threshold. For a restroom, where the grab bar sits.

The free read covers one photo. If you want more, add a few more angles of that same spot and get the \${{SPOT_PRICE}} full report, covering up to {{SPOT_PHOTOS}} photos, with what each finding means and which rule it points to.

## What Spot won't tell you

Spot never calls a finding a violation, non-compliant, or illegal. It names a barrier and how serious it looks, nothing more. Whether a place is legally required to fix something generally depends on details Spot can't see in one photo, like when the building was built or altered. For that kind of question, the [ADA Standards Guide](/standards-guide) walks through what the standards generally require, and small business owners can start with the [small business primer](/standards-guide/guide/small-business).

If you hit a barrier yourself and want to know your rights, Spot isn't the right tool. Ada, our AI intake assistant, is opening soon for that.

## Before you take the photo

Stand back far enough to show the space around whatever you're checking. A lot of what matters to Spot's read is the room to approach, reach and turn, not just the door or ramp itself.

[Get a free Spot read](/spot)`,
  },

  '/standards-guide': {
    title: 'ADA Standards Guide in Plain Language | ADA Legal Link',
    description:
      'The 2010 ADA Standards for Accessible Design, reorganized by topic with plain-language explanations and interactive diagrams. Free and fully accessible.',
    body: `## What this guide is for

Searching for the ADA standards usually means hunting through dense federal text. This guide takes the 2010 ADA Standards for Accessible Design and sorts them by topic, in plain words, next to the official legal text. Look up parking spaces, grab bars, door width, ramp slope, restrooms, service animals, small business rules or web accessibility, all in one search.

## How to use it

Start with the topic that matches what you ran into. Each entry explains what the standard generally requires and links to the official Department of Justice (DOJ) text on ADA.gov. These are federal design rules, not a judgment about any one building or business. Whether a specific place meets them depends on the actual space, so treat each entry as a starting point for understanding the rule, not a verdict on what happened to you.

## If you hit a barrier

This guide tells you what the standard says. It does not tell you what your situation means or what to do next. For that, the next steps are:

- Read the section on your topic here to understand the rule
- Talk to Ada, our free intake assistant, opening soon, to walk through what happened in plain language
- Find an ADA attorney if you want to discuss your situation with someone who can advise you directly

For legal advice about your own situation, connect with an [ADA attorney](/attorneys). This guide is informational only. It is not legal advice and ADA Legal Link is not a law firm.

## Checking a building or space yourself

If you want a read on a specific doorway, ramp, restroom or parking space, Spot can look at one photo and name what stands out, as a screening read rather than a certification. [Get a free Spot read](/spot).

## Keep learning

[Read the full ADA Standards Guide](/standards-guide) to search all 118 sections by topic, or browse [the cases we track](/lawsuits) to see how these standards have come up in real, filed matters.`,
  },

  '/standards-guide/guide/accessible-documents': {
    title: 'ADA Accessible Documents Requirements | Plain Language',
    description:
      'What ADA accessible documents requirements mean for PDFs, Word files, and slides, plus who must follow WCAG 2.1 AA and how to check your own files.',
    body: `## What counts as an accessible document

ADA accessible documents requirements cover any file an agency or business posts online: PDFs, Word files, slideshows, spreadsheets and scanned forms. A document is generally accessible when someone using a screen reader, magnifier, or Braille display can get the same information as everyone else, in the same order, without help.

## Who this applies to

Under the ADA's Title II web rule, state and local government documents posted after the compliance date generally must meet WCAG 2.1 Level AA. Private businesses generally have obligations under Title III to provide accessible communications too, though what that looks like can depend on the business and the document. Read the [ADA Standards Guide](/standards-guide) for how these rules are organized by topic.

## Quick checklist for any document

Before you publish or share a file, check for these basics:

- Headings, lists and tables are tagged, not just styled to look that way
- Reading order matches how a sighted person would scan the page
- Every meaningful image has alt text; decorative images are marked so screen readers skip them
- Form fields have labels and a logical tab order
- Data tables mark header cells so a screen reader can announce row and column context
- Color isn't the only way information is conveyed

## Scanned documents need extra care

A scanned page saved as a PDF is just an image of text. A screen reader can't read it unless it's run through text recognition and then tagged. Scanning a form and posting it as-is generally doesn't meet the requirements above, even if a human can read it fine on screen.

## What to do if you hit an inaccessible document

If a government form, agenda, or business document you needed wasn't usable with your screen reader or magnifier, that's a real barrier, not a small inconvenience. You don't have to figure out on your own whether it's an ADA issue. Read more on the [small business primer](/standards-guide/guide/small-business) for how these rules often apply to private companies, or look up terms like WCAG or tagged PDF in the [glossary](/glossary).`,
  },

  '/standards-guide/guide/ada-coordinators': {
    title: 'ADA Coordinator Requirements: Who, What, and How',
    description:
      'ADA coordinator requirements explained in plain language: who must designate one, what the role covers, and how grievance procedures generally work.',
    body: `## What Does ADA Coordinator Requirements Mean in Practice

If you're asking about ADA coordinator requirements, the short answer is this: under Title II, a state or local government with 50 or more employees generally must name at least one ADA Coordinator. The job title can vary. What counts is that someone is actually designated, reachable, and responsible for the work.

This page lays out who has to designate a coordinator, what the role generally covers, and how the grievance process fits in. For the exact regulatory language, see the standard quoted above and the glossary if a term is unfamiliar.

## Posting Coordinator Contact Information

A public entity that must designate a coordinator generally also has to make that person's name, office, address, and phone number available to anyone who asks, and often publishes it on the entity's own website or in public materials. If you cannot find this information for an entity you're dealing with, that itself can be worth asking about directly.

## Grievance Procedures, in Plain Words

Entities with 50 or more employees generally must also adopt grievance procedures that provide for prompt and fair resolution of complaints alleging disability discrimination. This typically means a written process: how to file a complaint, who reviews it, and roughly how long it takes to get a response. The ADA Coordinator usually oversees this process, though the regulation does not spell out every detail of what it must contain.

If you've filed a complaint with a coordinator and heard nothing back, or the process itself seems to have no clear steps, that's a fact worth noting. It does not tell you whether the entity is breaking the law. It depends on the specifics.

## What This Page Does Not Tell You

This guide explains what the regulation generally requires. It cannot tell you whether a specific entity you're dealing with is meeting those requirements, and it is not legal advice. If you've run into a wall with an ADA Coordinator, or a public entity near you doesn't seem to have one, the next step is usually to ask directly or look at your options.

If you're trying to sort out whether a situation you experienced involves a Title II issue like this one, read the rest of the Standards Guide for related topics on complaints and the legal process.

[Read the ADA Standards Guide](/standards-guide)`,
  },

  '/standards-guide/guide/barrier-removal': {
    title: 'ADA Barrier Removal Requirements: Readily Achievable Rule',
    description:
      'What ADA barrier removal requirements mean for existing buildings, the priority order for fixes, who decides, and what counts as readily achievable.',
    body: `## Priority Order for Removing Barriers

ADA barrier removal requirements generally follow a priority order, since most businesses can't fix everything at once. The usual order is:

1. Getting people in the door: entrances, parking, and the path from the street.
2. Getting people to the services: aisles, routes inside, and access to the main offerings.
3. Access to restrooms, if restrooms are available to the public.
4. Anything else that helps people use the space fully, like signage or drinking fountains.

This order is a general guide, not a strict legal checklist. What a specific business must do still depends on the four factors above: cost, the resources of that location, the resources of any parent company, and the type of operation.

## Who Decides What's Required

There's no single government inspector who signs off on whether a business has met its barrier removal duty. It's judged case by case, often after someone raises a problem, using those same four factors. A business that removes barriers in a reasonable, planned way generally has a stronger position than one that does nothing.

## Common Low-Cost Fixes

Examples businesses often point to when barrier removal is readily achievable include:

- Installing a portable ramp at a single step
- Widening an aisle by rearranging shelving or furniture
- Adding grab bars in an existing restroom stall
- Lowering a paper towel dispenser or mirror
- Re-striping an accessible parking space

These examples show the kind of change that's often low-cost and simple to carry out. Whether a specific fix is required still depends on the business's own facts.

## What This Doesn't Cover

This page explains the general readily achievable standard for existing buildings under Title III. It doesn't cover new construction or major renovations, which must generally meet the full 2010 ADA Standards for Accessible Design. It also isn't a way to check whether a specific barrier has actually been removed or how serious it looks in person.

If you want a quick read on a specific doorway, ramp, restroom, or parking space, [get a free Spot read](/spot). It's a screening tool, not a compliance check, and it names what stands out in one photo.`,
  },

  '/standards-guide/guide/digital-barriers': {
    title: 'ADA Digital Accessibility Requirements: Plain Guide',
    description:
      'What the ADA requires for websites and apps, what counts as a digital barrier, and how to document one and decide your next step.',
    body: `## What ADA Digital Accessibility Requirements Generally Cover

If a screen reader failed, a keyboard couldn't move through a menu, or a form had no labels, that site or app likely wasn't built to current accessibility standards. The ADA generally requires public-facing websites and apps to work for people using assistive technology. Read the full breakdown on the [Standards Guide](/standards-guide).

### Businesses Open to the Public

Under Title III, the Department of Justice (DOJ) has said websites of public-facing businesses generally need to be accessible. Courts have found this applies clearly when a business also has a physical location, and some courts have extended it to online-only businesses too. Whether a given site falls short depends on the specific barriers found and how the site is used.

### Government Websites and Apps

Title II now spells this out directly. The DOJ's April 2024 rule requires state and local government websites and apps to meet WCAG 2.1 Level AA. In April 2026 the DOJ extended the deadlines: April 26, 2027 for governments serving 50,000 people or more, and April 26, 2028 for smaller ones and special districts. This covers school sites, court filing systems, benefit applications, voting information, and transit tools.

## How to Document a Digital Barrier

If you hit a problem using a site or app, write down what happened as close to the moment as you can:

- What you were trying to do, like checking out, filling a form, or watching a video
- What tool you were using, like a screen reader, keyboard-only navigation, or screen magnification
- What went wrong, such as a button with no label, a trap you couldn't tab out of, or captions that didn't match the audio
- The date, the page, and a screenshot if you can get one

This record is useful no matter what you decide to do next. It helps you describe the barrier clearly, whether you're reporting it, asking the business to fix it, or talking to an attorney.

## What To Do Next

Digital barriers show up constantly, and what they mean depends on the site, the barrier, and who runs it. The Standards Guide walks through how Title II and Title III generally apply, with links to the official DOJ text behind each rule.

If you want help sorting through what happened to you specifically, an ADA attorney can walk through the details with you directly.

[Find an ADA attorney](/attorneys)`,
  },

  '/standards-guide/guide/education': {
    title: 'ADA Education Requirements: Schools, Colleges, Testing',
    description:
      'Plain-language guide to ADA education requirements for schools, colleges, and testing accommodations, plus how Section 504 and IDEA fit in.',
    body: `## What counts as an ADA education requirement

People searching for ADA education requirements usually want one of two things: what a school generally has to do, or which law applies to their situation. Here is the short version, with more detail below.

Title II of the ADA generally applies to public K-12 schools and public colleges and universities, since they are run by state or local government. Title III generally applies to private schools and universities as places of public accommodation. Section 504 of the Rehabilitation Act applies to any school that takes federal funding, which is nearly all of them. IDEA is a separate law that gives eligible K-12 students an Individualized Education Program, or IEP.

## Private schools and colleges (Title III)

Private schools and universities generally count as places of public accommodation under Title III. That generally means they must provide auxiliary aids and services, make reasonable modifications to policies, and remove barriers where it's readily achievable, unless a specific exemption applies. Religious entities and organizations they control are generally exempt from Title III, though Section 504 may still apply if they take federal funds.

## Testing accommodations

Standardized tests and licensing exams, including those run by outside testing agencies, are generally covered by the ADA. Test providers generally must offer accommodations like extra time, a reader, or a separate room when a disability requires it. This applies whether the test is given by a public school, a private school, or an independent testing company.

## How these laws work together

These laws overlap but cover different things. IDEA covers eligibility and the IEP process for K-12 special education students. Section 504 covers accommodations for any student with a disability, tied to federal funding. The ADA covers physical access to buildings, effective communication, and policy changes, and applies regardless of funding. A student can have rights under all three at once.

## What this means for you

Whether a specific requirement applies to a specific school, grade, or test depends on the facts: public or private, funding, and the type of program. If you think a school or test denied you something it generally should have provided, read the standards guide for the specific rule, since it depends on the situation.

Read the full [ADA Standards Guide](/standards-guide) for the rules behind these requirements, including Title II, Title III, and effective communication standards.`,
  },

  '/standards-guide/guide/effective-communication': {
    title: 'ADA Effective Communication Requirements | ADA Legal Link',
    description:
      'ADA effective communication requirements explained in plain language: auxiliary aids, primary consideration, companions, and when an interpreter applies.',
    body: `## What Counts As An Interpreter Requirement

The ADA generally requires a qualified sign language interpreter when a written note or gesture won't let a deaf person follow something complex, like a medical diagnosis, a legal proceeding, or a long meeting. For a quick, simple exchange, like asking a question at a counter, writing back and forth may be enough. It depends on the length, complexity, and importance of the communication. See 28 CFR §36.303(c) on the [Standards Guide](/standards-guide).

## Primary Consideration Means The Person Chooses

Under the ADA, the person with a disability generally gets primary consideration when an auxiliary aid or service is chosen. A business or agency can offer an alternative, but it should give the requested aid or service primary weight unless it can show another option works just as well, or that the request would cause an undue burden or a fundamental change to what it offers. This isn't automatic agreement to every request, but the person's choice generally carries the most weight.

## Companions Have Rights Too

Effective communication requirements generally extend to companions, not just the person receiving a service. A hearing parent of a deaf child, or a sighted spouse accompanying a blind patient, may still need an aid or service to participate in a conversation about care or decisions. Title II and Title III both name companions with disabilities specifically. See 28 CFR §35.160(a)(1).

## When A Business Can Use A Different Aid

A business or agency doesn't have to provide the exact aid requested in every case. It generally can choose an effective alternative, especially where the requested aid would be an undue burden or isn't readily available on short notice. What matters is whether the alternative still lets the person understand and take part on equal footing, not just whether some aid was offered.

## Who This Applies To

These rules generally apply to government agencies under Title II and to businesses open to the public under Title III, including hospitals, clinics, stores, hotels, and government offices. It depends on the type of entity and the situation, so check the specific section that applies to you.

If you're a small business owner trying to understand your obligations in plain terms, the [small business primer](/standards-guide/guide/small-business) walks through this without the legal language.

If you hit a communication barrier yourself and want to understand what happened, read the rest of the [Standards Guide](/standards-guide).`,
  },

  '/standards-guide/guide/emergency-management': {
    title: 'ADA Emergency Management Requirements | ADA Legal Link',
    description:
      'What ADA emergency management requirements cover: shelters, evacuation plans, alerts, and service animals. Plain-language guide to Title II rules.',
    body: `## What ADA Emergency Management Requirements Cover

ADA emergency management requirements come mainly from Title II. They apply to state and local government emergency programs, not just buildings. That means planning, alerts, shelters, evacuation, and recovery all have to include disabled people, generally at every stage.

These requirements rest on two ideas: program access and effective communication. A shelter can be a tent or a gym, but the program as a whole has to be usable by people with disabilities.

## Emergency Alerts and Notifications

Government alerts generally have to reach people who are deaf, hard of hearing, blind, or have low vision. That can mean captioned emergency broadcasts, text-based alert systems, and accessible formats for public notices. An alert that only works as a siren or a spoken announcement can leave people out, depending on how it's delivered.

## Evacuation Plans for People with Disabilities

Evacuation plans generally have to address:

- How people who use wheelchairs or other mobility devices get out of multi-story buildings when elevators are out of service
- How people who are blind or have low vision get accurate, timely evacuation information
- How people who are deaf or hard of hearing receive evacuation orders, not just hear them
- Transportation during evacuation for people who do not drive
- Continuity of medical equipment, oxygen, and refrigerated medication during transit

A plan that works for most people but assumes everyone can see a posted sign, hear an alarm, or walk down a stairwell generally does not meet Title II's program access standard.

## Service Animals in Shelters

Service animals generally must be allowed into emergency shelters alongside their handlers, including general population shelters, not just separate areas. Shelters can ask the two questions allowed under the ADA's service animal rule, but they generally cannot turn someone away because they have a service animal.

## Disaster Relief and Recovery Programs

The same program access rule applies after the emergency ends. Disaster relief applications, temporary housing programs, and recovery assistance generally have to be accessible, including accessible formats for applications and accessible temporary housing units.

## If You Were Turned Away During an Emergency

If a shelter, evacuation plan, or recovery program left you out, what happened may be covered by the ADA facts above, but it depends on the specifics. Read the full [ADA Standards Guide](/standards-guide) for the sections on Title II and program access, or [see the cases we track](/lawsuits) for real examples of how these rules have played out.`,
  },

  '/standards-guide/guide/employment': {
    title: 'Employment and the ADA (Title I) | ADA Legal Link',
    description:
      'Plain-language guide to ADA employment rights: who Title I covers, reasonable accommodation, the interactive process, and how to file a complaint.',
    body: `## What counts as an ADA employment issue

If something happened at work and you think disability played a part, the first question is whether Title I applies at all. It generally covers employers with 15 or more employees, including hiring, firing, pay, promotions, training and benefits.

From there, it depends on the facts: what was asked for, what the employer said, and whether the job's essential functions were still met with or without an accommodation. This guide can help you understand the rule. It can't tell you what happened in your situation means for you, and nothing here is a legal conclusion about your job.

## Signs worth looking at closely

A few patterns often come up when people ask about Title I:

- A request for accommodation was ignored, delayed for a long time, or refused without any explanation of undue hardship
- Discipline, demotion or firing followed soon after disclosing a disability or asking for an accommodation
- A job offer was withdrawn after a medical exam or disability-related question
- Questions about disability came up in hiring before a conditional offer was made

None of these automatically mean the law was broken. They're just the kinds of facts that tend to matter, which is why the interactive process below exists: to work out, case by case, what's reasonable.

## If you've hit one of these at work

You have a few options, and they're not mutually exclusive:

- Ask your employer, in writing, to restart or document the interactive process
- Look up how filing a complaint works in the [Standards Guide](/standards-guide)
- Talk through what happened with [an ADA attorney](/attorneys), who can look at the specific facts and tell you what your options are

We can't review your employment situation or tell you what the outcome would be. An attorney who reviews the specific facts is the only one who can do that.

## Keep reading the Standards Guide

This page covers who's protected, what accommodation means, and how the interactive process generally works. For the full picture of how the ADA treats the built environment, complaints, and other titles, go back to the [ADA Standards Guide](/standards-guide).`,
  },

  '/standards-guide/guide/entrances': {
    title: 'ADA Entrance Requirements: Doors, Width & Access',
    description:
      'ADA entrance requirements explained in plain language: clear width, maneuvering clearance, hardware, thresholds, and how many entrances must be accessible.',
    body: `## What counts as an accessible entrance

ADA entrance requirements cover more than the door itself. An accessible entrance needs a clear path to reach it, enough room to maneuver a wheelchair or walker, a door that opens wide enough, hardware anyone can use, and a threshold that is not a tripping hazard.

The numbers below come from the 2010 ADA Standards. Whether a specific entrance has to meet them generally depends on the building and the entrance's role, so treat these as a starting point, not a final answer for one address.

## The core ADA entrance requirements

- Clear width: at least 32 inches when the door is open 90 degrees
- Opening force: no more than 5 pounds to open an interior door
- Closer speed: a door closer must take at least 5 seconds to swing from 90 degrees to 12 degrees
- Hardware: lever or push/pull handles mounted 34 to 48 inches high; round knobs do not meet this
- Threshold: no more than ½ inch high
- Smooth bottom: the push side needs a smooth surface for the bottom 10 inches, for wheelchair footrests

## Maneuvering clearance matters as much as width

A door can measure 32 inches and still be hard to use if there's no room to approach it in a wheelchair, pull it open, and get through before it swings shut. The standards set separate clearance requirements on both sides of a door, based on which way it swings and whether it has a closer. This is one of the most common things that gets missed, since the door itself can look fine.

## How many entrances must be accessible

At least 60 percent of all public entrances generally must be accessible, and certain entrances must always be, including:

- At least one entrance connected to an accessible route from parking, sidewalk, or transit
- Entrances to each tenant space in a multi-business building
- Entrances from parking garages, tunnels, or elevated walkways
- Employee-only entrances, if employees with disabilities use them

If the main entrance has steps and no ramp, there generally needs to be an accessible alternative with directional signage pointing to it.

## Wondering about a specific door

These rules depend on the building and the entrance in question. For the full detail on width, clearances, and citations, read the standards guide section on entrances. If you want a quick read on an actual doorway, Spot can look at one photo and name what stands out, as a free screening, not a compliance check.

[Get a free Spot read](/spot)`,
  },

  '/standards-guide/guide/filing-complaint': {
    title: 'How to File an ADA Complaint: Steps, Deadlines, Where',
    description:
      'How to file an ADA complaint: who can file, where to file by title, the DOJ process step by step, what to include, and filing deadlines.',
    body: `## What to Include in Your Complaint

A complaint goes further when it has details. Include:

- Your name and contact information, or the authorized representative's
- The name and address of the business, agency, or organization involved
- What happened, as specifically as you can describe it
- The date, or approximate date, it happened
- Names of anyone else involved or who witnessed it
- Any evidence you have, such as photos, emails, or letters

You don't need a complete case file. A clear, honest account of what happened is the starting point.

## Timelines and Deadlines

Deadlines depend on which title applies, so check which one fits your situation.

- Title I (employment): generally 180 days from the discrimination, or 300 days in states with their own anti-discrimination agency. Check this against the [Standards Guide](/standards-guide).
- Title II (government services) and Title III (businesses and public places): DOJ complaints should generally be filed within 180 days, though the DOJ may still accept a complaint later. Waiting can make a complaint harder to support with evidence.

If you're not sure which title covers your situation, the [Standards Guide](/standards-guide) walks through how the ADA is structured across titles.

## After You File

Once the DOJ has your complaint, it decides whether to investigate. Not every complaint leads to one. The DOJ generally prioritizes complaints that show a pattern of discrimination or a broad impact, rather than a single isolated incident. That doesn't mean a single incident doesn't matter. It means your individual complaint may be handled differently than one pointing to a wider pattern.

Filing a DOJ complaint is one path. Working with an ADA attorney is another, and the two aren't mutually exclusive. If you want to talk through your specific situation with someone, you can [find an ADA attorney](/attorneys) in our network.

## If You're Not Sure a Complaint Is the Right Step

This page explains the filing process. It doesn't tell you whether what happened to you is an ADA violation or whether a complaint will lead anywhere. That depends on the facts. If you hit a barrier at a specific place, like a step, a narrow door, or a counter you couldn't reach, you can get a free read on it by [getting a free Spot read](/spot) of a photo first. That can help you describe the barrier more clearly if you do decide to file.`,
  },

  '/standards-guide/guide/hotels-lodging': {
    title: 'ADA Requirements for Hotels: Rooms, Showers, Booking',
    description:
      'Plain-language guide to ADA requirements for hotels: how many accessible rooms, roll-in showers vs tubs, reservation rules, and room dispersion.',
    body: `## Reservation System Requirements

The ADA sets specific rules for how hotels handle reservations for accessible rooms. Generally, a hotel must let guests identify and book accessible rooms through the same reservation system used for any other room, whether that's by phone, website or a third-party booking site.

The reservation system generally must:

- Describe the accessible features of each room in enough detail for a guest to judge if a room meets their needs
- Let guests reserve a specific accessible room, not just request one and hope
- Hold accessible rooms for guests who book them, not release them to general inventory until all other rooms are gone
- Block out accessible rooms the same way as any other room type, so they show as unavailable once booked

This applies across phone lines, front desk booking and online reservation systems alike. See [Read the ADA Standards Guide](/standards-guide) for the full citation and more on how this section is written.

## Room Dispersion

Accessible rooms generally can't all be clustered in one wing or one floor. The ADA calls for dispersion across room types, price points and locations in the hotel, so a guest who needs an accessible room has close to the same range of choices as anyone else: ocean view versus parking lot view, suite versus standard room, ground floor versus upper floor with elevator access.

## What This Means for Guests and Owners

If you're a guest who hit a problem with a hotel, for example a room that was listed as accessible but wasn't, or a reservation system that wouldn't let you book one, the Standards Guide can help you understand what the rule generally says. It doesn't tell you whether any specific hotel broke the law. That depends on the full facts.

If you manage a hotel and want a straight read on your own space, [Get a free Spot read](/spot) of a doorway, ramp, restroom or parking spot. Spot names what looks like a barrier and how serious it looks. It's a screening tool, not an inspection, and it doesn't certify anything as meeting the standards.

For a wider look at how the ADA applies to day-to-day operations, the [Read the small business primer](/standards-guide/guide/small-business) covers more ground beyond guest rooms.`,
  },
};
