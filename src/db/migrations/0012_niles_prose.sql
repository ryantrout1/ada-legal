-- Plan B, Phase B2: Niles full prose payload.
--
-- This migration fills the A1 prose fields for the worked-example
-- litigation row: Niles v. Hilton Worldwide Holdings Inc.
-- (slug: niles-v-hilton-bed-heights, id: 3bb10e4e-8654-45e7-ba1f-cea12e9cecfc)
--
-- STATUS WHEN THIS FILE LANDED: applied live against Neon project
-- ancient-star-00703098 main on 2026-05-19 as part of /shipit Phase B2.
-- Verified via live API at /api/public/litigation/niles-v-hilton-bed-heights.
--
-- What this fills:
--   - short_description_simple, short_description_professional
--   - full_description (canonical), full_description_simple, full_description_professional
--   - eligibility (canonical), eligibility_simple, eligibility_professional
--   - documentation_required_simple, documentation_required_professional
--   - no_documentation_path_simple, no_documentation_path_professional
--   - evidence_guidance_simple, evidence_guidance_professional
--   - what_this_is_not_simple, what_this_is_not_professional
--   - key_dates (JSONB: complaint filed / class cert / defendant response / status)
--   - ada_qualifying_questions (JSONB: 6 questions + voice_guidance)
--   - related_listing_ids (JSONB: links to DOJ 2010 consent decree)
--
-- Voice:
--   - Standard (canonical): legal-but-accessible default voice
--   - Simple: plain words, short sentences, drops jargon
--   - Professional: precise legal terminology, citations to CFR/USC
--
-- Source for case facts: complaint summary (topclassactions.com, Feb 25, 2026)
-- and the DOJ 2010 consent decree (1:10-cv-01902, D.D.C.).
--
-- Class period assumed approximately 2022-present pending plaintiff's
-- class-certification motion. Update once the docket pins it down.

UPDATE litigation_listings
SET
  short_description_simple = $sds$Hilton's accessible hotel rooms often have beds that are too high to safely move into from a wheelchair.$sds$,
  short_description_professional = $sdp$Class action alleges Hilton's designated mobility-accessible rooms contain bed surfaces that prevent safe, independent wheelchair-to-bed transfer, and Hilton fails to disclose bed-height information at the time of reservation.$sdp$,

  full_description = $fd$This is a federal class-action lawsuit. Christopher Niles, a wheelchair user, sued Hilton Worldwide Holdings, Hilton Management LLC, and Hilton Management Services in February 2026 in Pennsylvania federal court. The case is being heard in the U.S. District Court for the Western District of Pennsylvania.

The lawsuit alleges that when Hilton designates a room as "accessible" or "mobility-accessible," the bed in that room is often too high or too low for a wheelchair user to safely and independently transfer to. A standard wheelchair seat sits 18-20 inches from the floor; a typical hotel mattress surface sits 25-30 inches or higher. That gap can make an otherwise accessible room unusable. The complaint also alleges that Hilton's website and call-center don't tell guests the bed height in advance, so wheelchair users can't tell whether a so-called "accessible" room will actually work for them until they've already arrived and checked in.

The lawsuit covers Hilton's full brand family — Hilton, Conrad, DoubleTree, Embassy Suites, Hampton Inn, Hilton Garden Inn, Homewood Suites, Home2 Suites, Waldorf Astoria, Hilton Grand Vacations, and others operated under the Hilton corporate umbrella. The plaintiff is seeking declaratory and injunctive relief — meaning, an order from the court requiring Hilton to fix the problem — plus class certification on behalf of similarly affected travelers. No monetary damages have been sought for individual class members at this stage.

The case is in its early phases. It has been filed but has not yet been certified as a class action, and Hilton has not yet been required to answer the complaint formally.$fd$,

  full_description_simple = $fds$This is a class-action lawsuit against Hilton hotels. The lawsuit was filed in February 2026 in a federal court in Pennsylvania.

A man who uses a wheelchair stayed in Hilton rooms that the hotel said were "accessible." The beds in those rooms were too high. He could not safely get from his wheelchair into the bed. A standard wheelchair seat is about 18 to 20 inches off the floor. Most hotel mattresses are 25 to 30 inches off the floor — or even higher. That makes the bed too high to use.

The lawsuit also says Hilton's website and phone reservations don't tell people how high the beds are. So a wheelchair user can't know in advance if the bed will work for them.

The lawsuit covers all Hilton brands — including Hilton, Hampton Inn, Embassy Suites, DoubleTree, Hilton Garden Inn, Homewood Suites, and Waldorf Astoria. The plaintiff is asking the court to make Hilton fix this. He is not asking for money for individual class members yet.

The case has been filed. It has not yet been certified as a class action by the judge.$fds$,

  full_description_professional = $fdp$Niles v. Hilton Worldwide Holdings Inc., et al., 2:26-cv-00258 (W.D. Pa., filed Feb. 12, 2026), is a putative class action under Title III of the Americans with Disabilities Act, 42 U.S.C. § 12181 et seq., and its implementing regulations, 28 C.F.R. Part 36.

The complaint alleges that Hilton's mobility-accessible guest rooms across its brand portfolio contain bed surfaces whose vertical height renders safe, independent wheelchair-to-bed transfer impracticable for guests dependent on standard manual or power wheelchairs (seat heights of approximately 18-20 inches). Plaintiff alleges this constitutes a failure to provide an "equal opportunity" to use the lodging services provided to nondisabled guests, in violation of 42 U.S.C. § 12182(a) and the ADA Standards for Accessible Design as incorporated into 28 C.F.R. § 36.406.

The complaint further alleges that Hilton's online reservation systems and telephonic reservation channels fail to provide accurate accessibility information regarding bed dimensions sufficient to enable wheelchair users to assess whether a designated accessible room will, in fact, be accessible to them — implicating Hilton's obligations under 28 C.F.R. § 36.302(e) (reservations) and the 2010 DOJ Consent Decree, United States v. Hilton Worldwide Inc., 1:10-cv-01902 (D.D.C.).

Plaintiff seeks declaratory and injunctive relief, certification of a nationwide class of persons with qualifying mobility disabilities who rely on standard wheelchairs and have accessed Hilton's reservation channels seeking accessibility information, attorneys' fees and costs under 42 U.S.C. § 12205, and a jury trial. The matter has been assigned to the U.S. District Court for the Western District of Pennsylvania.$fdp$,

  eligibility = $el$This case is for travelers who rely on a wheelchair for mobility and who have looked into staying — or actually stayed — at a Hilton-brand hotel since 2022. The putative class as defined in the complaint covers anyone with a qualifying mobility disability who uses a standard-sized wheelchair and who has accessed Hilton's website or called a Hilton hotel seeking information about the accessibility of its rooms.

You may be part of the class if all of the following apply:
- You use a wheelchair (manual or power) as your primary means of mobility.
- You have a qualifying mobility-related disability.
- You looked at booking, attempted to book, or actually stayed in a Hilton-brand hotel — including Hilton, Hampton Inn, Embassy Suites, DoubleTree, Hilton Garden Inn, Homewood Suites, Home2 Suites, Waldorf Astoria, Conrad, or Hilton Grand Vacations — during a period the lawsuit is expected to cover (approximately 2022 to the present).
- You either could not safely transfer to the bed in a designated "accessible" room, or you avoided booking because Hilton wouldn't tell you the bed height in advance.

You don't need to have been physically injured to be part of this case. The harm the lawsuit recognizes includes being denied equal access, not just physical injury.$el$,

  eligibility_simple = $els$This case is for you if all of these are true:
- You use a wheelchair to get around.
- You have a disability that affects your mobility.
- You tried to book a stay at a Hilton-brand hotel — Hilton, Hampton Inn, Embassy Suites, DoubleTree, Hilton Garden Inn, Homewood Suites, Waldorf Astoria, or others.
- You either:
  - couldn't safely get into the bed in the "accessible" room, OR
  - didn't book because Hilton wouldn't tell you how high the bed was.

You don't need to have fallen or been hurt to be part of this case. The harm is being shut out, even if nothing bad physically happened to you.$els$,

  eligibility_professional = $elp$The putative class, as pleaded, comprises all persons in the United States who: (1) possess a qualifying mobility disability within the meaning of 42 U.S.C. § 12102; (2) rely on a standard-sized wheelchair as a primary means of locomotion; and (3) during the class period have accessed Hilton's online reservation system or telephonic reservation channel seeking information regarding the accessibility of designated mobility-accessible rooms at any Hilton-branded property (including, without limitation, properties operating under the Hilton, Conrad, DoubleTree, Embassy Suites, Hampton Inn, Hilton Garden Inn, Homewood Suites, Home2 Suites, Waldorf Astoria, and Hilton Grand Vacations brands).

Class certification under Fed. R. Civ. P. 23(a) and (b)(2) is sought. Standing is grounded in the dignitary and equal-access injuries recognized by the ADA framework; physical injury is not a prerequisite. Class membership does not require a completed stay — a wheelchair user who was deterred from booking because Hilton failed to provide accessibility information sufficient to make an informed reservation may also fall within the class definition.$elp$,

  documentation_required_simple = $drs$What helps your case if you have it:
- The dates and locations of Hilton-brand hotels you stayed at or tried to book.
- Reservation confirmations or emails from Hilton.
- Photos of the bed in an "accessible" room — especially photos that show the height (a tape measure or wheelchair next to it is great).
- Any messages where you asked Hilton about the bed height and they couldn't or wouldn't tell you.
- Notes from a doctor or therapist about the wheelchair you use and why.

You don't need all of these. Even one or two of these things can be enough to be part of the class. The lawsuit isn't asking you to prove the legal case yourself — the lawyers do that — they just need to confirm you fit the class definition.$drs$,

  documentation_required_professional = $drp$The following documentation, while not strictly required for class membership, will substantially strengthen a class member's position:
- Reservation records, booking confirmations, or stay receipts from any Hilton-branded property identifying dates and room designations.
- Photographic evidence of the inaccessible bed surface, ideally with scale reference (e.g., wheelchair adjacent to bed, tape measure, or comparison object).
- Written communications with Hilton reservation channels evidencing inquiries about bed-height or transfer-surface accessibility and Hilton's responses (or non-responses).
- Medical or rehabilitation documentation establishing the qualifying mobility disability and wheelchair dependence (typically a treating physician's note, prosthetist or DME provider records, or VA disability rating documentation).
- A narrative description of the access barrier encountered or the basis for deterred booking.

Class members are not required to litigate or prove the substantive Title III violation; the named plaintiff and class counsel carry that burden. Documentation supports the class-membership inquiry and any individualized relief that may eventually be available.$drp$,

  no_documentation_path_simple = $nds$You may still be part of this case even if you don't have receipts, photos, or messages saved.

If you remember roughly when and where you tried to book a Hilton room or stayed at one, and you couldn't safely use the bed because of your wheelchair, that's still a real experience the lawyers want to hear about. They can sometimes pull records from Hilton's own systems through the legal process.

If you don't have documentation, you might also consider:
- Filing a complaint with the U.S. Department of Justice about Hilton specifically. The DOJ has gone after Hilton before on accessibility issues.
- Writing to Hilton directly about what happened. Even if nothing comes of it, it creates a record.

Talk to Ada about your situation. She can help you figure out what makes sense for you.$nds$,

  no_documentation_path_professional = $ndp$Absence of documentary evidence does not foreclose class membership. The class definition pleaded by Plaintiff is intentionally broad: it encompasses individuals who accessed Hilton's reservation channels seeking accessibility information, whether or not a reservation was ultimately consummated and whether or not the prospective guest preserved contemporaneous records.

Class members who lack contemporaneous documentation should nonetheless consider the following parallel avenues:
- Filing an administrative complaint with the U.S. Department of Justice, Civil Rights Division, Disability Rights Section, under 28 C.F.R. § 36.502. The DOJ retains independent enforcement authority over Title III public accommodations and has a documented enforcement history with Hilton (see United States v. Hilton Worldwide Inc., 1:10-cv-01902 (D.D.C. 2010) consent decree).
- Submitting a direct demand letter to Hilton's general counsel describing the access barrier encountered. While such a letter is not a substitute for litigation participation, it may preserve a colorable individual claim and, in some jurisdictions, satisfy pre-suit notice obligations under analogous state public-accommodations statutes.
- Documenting the experience contemporaneously going forward: dates, locations, room designations, and any communications with Hilton reservation channels.

These avenues do not require contemporaneous documentation of past stays.$ndp$,

  evidence_guidance_simple = $egs$If you're documenting a stay at a Hilton hotel right now, or planning one, here's what helps most:

When you reserve:
- Use the Hilton website or call. Ask specifically about bed height in their mobility-accessible rooms. Save the answer (screenshot the chat, take notes from the call with the date and the agent's name if you can).

When you arrive:
- Take photos of the bed BEFORE you change anything. Show the floor-to-mattress height. A tape measure helps a lot. So does putting your wheelchair next to it for scale.
- Take photos of the rest of the room too — bathroom grab bars, the entry, the path between the bed and bathroom.
- Write down the room number, the date, and what brand the hotel is (Hilton, Hampton Inn, etc.).

If you try to ask for help:
- Take notes on who you spoke to at the front desk and what they offered (or didn't).
- If they tell you they can't lower the bed or move you to a different room, write that down too.

Save everything in one place — emails, photos, notes. If your phone has a "favorites" folder for photos, use it.$egs$,

  evidence_guidance_professional = $egp$For documentation of an active stay or a recent encounter:

At reservation:
- Capture screenshots of the Hilton reservation interface depicting the accessibility-information surfaces (or their absence). Note any specific bed-height representations made.
- If reserving by telephone, log the date, time, agent name (or call-center identifier), and the substance of any accessibility inquiry and response.

At check-in and during stay:
- Photograph the bed surface from a perspective that establishes vertical height. Recommended: side-elevation view with a measuring tape extended from floor to mattress top, or wheelchair positioned adjacent with seat-height reference visible.
- Capture room-designation signage and reservation confirmation showing the room was designated mobility-accessible.
- Document the entire room: bathroom grab bars and clearance, path of travel, doorway widths, transfer-surface heights at toilet and shower/tub.
- Note the property's brand and street address; many Hilton brands are managed by third-party operators, and brand identification matters for the class definition.

When raising the issue with hotel staff:
- Log staff names and titles, date and time, the specific accommodation requested, and the response.
- If alternate accommodations (different room, alternative property, supplemental equipment) are offered, document the offer; if not, document the absence.

Preserve all such records in a single dated folder or cloud archive. Class counsel typically request such records when opting in or for individualized relief proceedings.$egp$,

  what_this_is_not_simple = $wns$A few things this case does NOT cover:
- Hotels that are not Hilton-brand. Marriott, Hyatt, Best Western, Choice Hotels, and independent hotels are not part of this lawsuit.
- Other accessibility problems at Hilton that don't involve the bed — like a missing grab bar, a narrow doorway, or a broken elevator. Those might still be valid ADA issues but aren't part of THIS lawsuit.
- Service-animal denials, shuttle access, pool lifts, parking — also separate.
- Money damages for past stays. The lawsuit is asking the court to make Hilton fix the problem going forward, not to pay each class member.
- Hospital beds or medical-equipment beds in any setting. The case is about regular hotel beds in regular guest rooms.

If your situation involves something other than bed height at a Hilton hotel, Ada can help you find the right path — there are other cases and complaint channels.$wns$,

  what_this_is_not_professional = $wnp$Scope limitations of this action:
- The defendants are limited to Hilton Worldwide Holdings Inc., Hilton Management LLC, and Hilton Management Services Inc. and the Hilton-branded properties subject to their control. Properties operated under non-Hilton flags (Marriott, Hyatt, IHG, Choice, Wyndham, Best Western, independent hotels) are outside the class definition.
- The alleged violation is narrowly bounded to bed-surface accessibility and the related reservation-disclosure failure. Other Title III violations at Hilton properties — restroom non-compliance under 28 C.F.R. § 36.406 / ADA Standards § 9.1, communication-access failures under 28 C.F.R. § 36.303, service-animal denials under 28 C.F.R. § 36.302(c), transportation-services denials, parking and path-of-travel barriers — are not pleaded in this complaint and would require separate enforcement.
- The relief sought is declaratory and injunctive; individualized compensatory damages are not pleaded under Title III, which does not provide for them. Title III does provide for attorneys' fees and costs.
- The complaint addresses guest-room bed surfaces in commercial lodging. It does not extend to medical, residential, or institutional sleeping surfaces governed by different regulatory frameworks.

For barriers outside this case's scope, parallel enforcement avenues include direct DOJ complaints, state public-accommodations claims, and analogous private actions under state civil-rights statutes such as California's Unruh Civil Rights Act, New York Human Rights Law, or the Pennsylvania Human Relations Act.$wnp$,

  key_dates = $kd${"Complaint filed": "2026-02-12", "Class certification": "Not yet scheduled", "Defendant's response": "Not yet filed", "Status": "Early pleadings"}$kd$::jsonb,

  ada_qualifying_questions = $aqq${"questions": [{"id": "uses_wheelchair", "prompt": "Do you use a wheelchair as your main way to get around?", "kind": "yes_no", "purpose": "Class definition requires standard-wheelchair dependence."}, {"id": "mobility_disability", "prompt": "Is your wheelchair use because of a long-term disability, not a temporary injury?", "kind": "yes_no", "purpose": "ADA qualifying disability inquiry."}, {"id": "hilton_brand_stay_or_attempt", "prompt": "Have you tried to book a stay, or actually stayed, at a Hilton-brand hotel since 2022? (Includes Hilton, Hampton Inn, Embassy Suites, DoubleTree, Hilton Garden Inn, Homewood Suites, Home2 Suites, Waldorf Astoria, Conrad, or Hilton Grand Vacations.)", "kind": "yes_no", "purpose": "Class definition requires Hilton-system contact during class period."}, {"id": "bed_transfer_problem", "prompt": "Was the bed in the accessible room too high or too low for you to safely move into from your wheelchair?", "kind": "yes_no_with_detail", "purpose": "Core factual allegation."}, {"id": "reservation_info_failure", "prompt": "When you tried to find out the bed height before booking, was Hilton unable or unwilling to tell you?", "kind": "yes_no_with_detail", "purpose": "Secondary factual allegation — reservation-disclosure failure."}, {"id": "documentation_available", "prompt": "Do you still have any reservations, emails, photos, or notes from those stays or booking attempts?", "kind": "yes_no_with_detail", "purpose": "Drives documentation_required vs no_documentation_path routing in conversation."}], "voice_guidance": "Ask questions one at a time. Confirm understanding before moving to the next. If the user says no to question 1 or 2, gently explain this specific case might not be a fit and offer to discuss other accessibility cases. If they say yes to questions 1-3, lean into the bed-height story. If yes on 4 or 5, validate the experience and explain what happens next. If no on 6, route to the no-documentation off-ramp and offer the DOJ-complaint path."}$aqq$::jsonb,

  related_listing_ids = $rli$["3e206686-2a29-458d-a255-78bfb82d6e01"]$rli$::jsonb,

  updated_at = now()
WHERE slug = 'niles-v-hilton-bed-heights'
  AND id = '3bb10e4e-8654-45e7-ba1f-cea12e9cecfc';
