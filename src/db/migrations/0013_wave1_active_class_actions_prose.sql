-- Plan B, Phase B3a: Wave 1 active class actions prose (2 rows + 1 reclassification).
--
-- Applied live against Neon project ancient-star-00703098 main on 2026-05-19
-- as part of /shipit Phase B3a. Verified via row-level RETURNING clauses.
--
-- This phase was originally scoped for 5 rows. Research surfaced that 3 of
-- those rows were data-quality issues:
--
--   1. NFB-CA v. Uber (5673e9ab-...) — SETTLED Dec 2016, currently in
--      ongoing-monitoring compliance phase. Belongs in Wave B4 (compliance),
--      not Wave B3 (active). Deferred to B4.
--
--   2. Adams v. Kentucky (e5ca543c-...) — SETTLED May 2015. Belongs in B4.
--      Deferred to B4.
--
--   3. EEOC v. Union Pacific (9f8cb570-...) — The slug references the "1%
--      Rule" but the actual 1% Rule litigation is Harris v. Union Pacific
--      Railroad Co. (D. Neb., 8:16-cv-00381), not an EEOC-filed case. The
--      Harris class was certified Feb 2019 but DECERTIFIED by the Eighth
--      Circuit in March 2020 (Harris v. UP, 953 F.3d 1030) for lack of
--      commonality. Case formally terminated Nov 2021. The underlying ADA
--      Title I theory continues through dozens of individual actions
--      (Sanders, DeFries, Donahue, Zaragoza, Mlsna). This row is therefore
--      reclassified status='closed' with identity corrected to Harris v.
--      Union Pacific.
--
-- The 2 rows that genuinely belong in active surface and get full prose:
--
--   1. Bryant v. Harris County (b4e97c92-...) — newly filed Feb 3, 2026.
--      Putative class, early pleadings. Identity corrections applied: court,
--      legal_theory (added Section 504), filing_date (corrected from Feb 11
--      to Feb 3 per court records).
--
--   2. Alcazar v. Fashion Nova (0f092870-...) — settlement pending, with
--      DOJ Statement of Interest opposing as of Feb 2, 2026. Genuinely in
--      active-litigation posture (settlement not approved). Kept in active.
--
-- Voice approach matches B2 (Niles): Standard = legal-but-accessible
-- canonical voice; Simple = plain words, short sentences; Professional =
-- precise legal terminology, CFR/USC citations.
--
-- Sources:
--   - Bryant: DRTx press release (disabilityrightstx.org), NFB press
--     release, Brown Goldstein Levy press release, Houston Public Media
--     (Feb 5, 2026), Democracy Docket, click2houston.
--   - Alcazar: DOJ Statement of Interest (Feb 2, 2026), DOJ press release,
--     CPT Group settlement administrator notices, Hinckley Allen analysis,
--     Lainey Feingold blog, ADA Title III blog (Seyfarth), Converge
--     Accessibility analysis.
--   - Harris/UP: 8th Circuit decertification opinion (Harris v. UP, 953
--     F.3d 1030), DeFries v. UP 9th Circuit opinion, Impact Fund amicus
--     filings, Understanding the ADA blog.

-- ────────────────────────────────────────────────────────────────────
-- Row 1: Bryant v. Harris County (identity corrections + full prose)
-- ────────────────────────────────────────────────────────────────────

UPDATE litigation_listings
SET
  court = 'U.S. District Court, Southern District of Texas, Houston Division',
  legal_theory = 'ADA Title II + Section 504',
  filing_date = '2026-02-03',

  short_description_simple = $sds$Harris County won't let blind voters mark their own mail-in ballots. Other voters can.$sds$,
  short_description_professional = $sdp$Putative class action alleging Harris County's paper-only vote-by-mail system violates Title II of the ADA and Section 504 by denying voters with print disabilities equal access to an independent, private ballot through a Remote Accessible Vote-by-Mail (RAVBM) system already provided to military, overseas, and astronaut voters.$sdp$,

  full_description = $fd$This is a federal class-action lawsuit filed in early 2026 against Harris County, Texas, and County Clerk Teneshia Hudspeth. Four Harris County voters with print disabilities — Cedric Bryant, Ted Galanos, Louis Maher, and Michael McCulloch — together with the National Federation of the Blind of Texas (NFB-TX), are suing because Harris County only provides paper mail-in ballots to voters with disabilities. The lawsuit is heard in the U.S. District Court for the Southern District of Texas, Houston Division.

The plaintiffs say a paper ballot is impossible for them to read and mark on their own. They have to ask a sighted friend or family member to help — which means giving up the right to a secret ballot that every other voter gets. Harris County already runs an electronic Remote Accessible Vote-by-Mail (RAVBM) system for military and overseas voters, and even used it to deliver ballots to astronauts on the International Space Station in 2024. The lawsuit argues there's no legal or practical reason Harris County can't extend that same system to voters with print disabilities.

In October 2024, plaintiff Michael McCulloch asked for an accessible ballot as a disability accommodation. The Clerk's Office denied the request, saying Texas law prohibited electronic ballots for disabled voters. The lawsuit says that legal position is simply wrong — federal disability-rights law requires public entities to provide accessible electronic documents when needed for equal access, and a federal court in 2023 already ordered Bexar County, Texas to do exactly that in a similar lawsuit.

Plaintiffs are asking the court to declare the current paper-only system unlawful, order Harris County to implement an accessible electronic vote-by-mail system, and award attorneys' fees and costs. The lawsuit doesn't seek individual money damages. Disability Rights Texas estimates more than 100,000 Harris County voters have print disabilities that could keep them from independently voting by mail. The case is in its early phases and is expected to take years to resolve.$fd$,

  full_description_simple = $fds$This is a lawsuit against Harris County, Texas. It was filed in February 2026 in a federal court in Houston.

Four blind or print-disabled voters from Harris County are suing. They want to be able to vote by mail in a way they can do themselves — without having to ask someone else to read and mark their ballot for them. The National Federation of the Blind of Texas is also a plaintiff.

Right now, Harris County only sends paper mail-in ballots. A paper ballot can't be read by a screen reader. It can't be marked by someone whose hands don't work. So blind and print-disabled voters have to ask a sighted helper to read each question and mark their answer. That means giving up the secret ballot that everyone else gets.

Harris County already has the technology to send ballots people can mark electronically — using a screen reader, a braille display, or other tools. They use it for military and overseas voters, and they even used it to send ballots to astronauts in space in 2024. The lawsuit says there is no good reason Harris County can't use that same system for voters with disabilities here in Texas.

The lawsuit asks the court to make Harris County offer accessible electronic ballots to voters with print disabilities. The lawsuit is not asking for money for individual voters. The case is brand new and is expected to take years.$fds$,

  full_description_professional = $fdp$National Federation of the Blind of Texas, et al. v. Hudspeth, et al. (commonly referenced as Bryant v. Harris County), filed Feb. 3, 2026 in the U.S. District Court for the Southern District of Texas, Houston Division, is a putative class action alleging violations of Title II of the Americans with Disabilities Act, 42 U.S.C. § 12131 et seq., and Section 504 of the Rehabilitation Act of 1973, 29 U.S.C. § 794, by Harris County and its County Clerk in her official capacity.

Plaintiffs Cedric Bryant, Ted Galanos, Louis Maher, and Michael McCulloch — together with the National Federation of the Blind of Texas (NFB-TX) — allege that Harris County's vote-by-mail program is administered exclusively through paper ballots, which are inaccessible to voters with print disabilities relying on screen-reader software, refreshable Braille displays, mouth-stick styluses, adaptive switches, and analogous assistive technologies. Plaintiffs allege that paper-only delivery and return forecloses the independent and private exercise of the franchise guaranteed by federal disability-rights law and by the Texas Election Code's secret-ballot provisions.

The complaint pleads that Harris County concurrently operates a Remote Accessible Vote-by-Mail (RAVBM) system for voters covered by the Uniformed and Overseas Citizens Absentee Voting Act (UOCAVA), and successfully transmitted electronic ballots to NASA astronauts aboard the International Space Station during the 2024 general election. Plaintiffs allege that the County's refusal to extend RAVBM to voters with print disabilities, despite a documented year-plus of pre-suit negotiation by Disability Rights Texas and despite a 2023 federal-court order requiring Bexar County, Texas to provide an analogous system, constitutes a continuing failure to provide auxiliary aids and services under 28 C.F.R. § 35.160 and a denial of meaningful access under Title II's program-access standard.

Plaintiffs seek declaratory relief that the paper-only system violates Title II and Section 504, permanent injunctive relief requiring implementation of an accessible electronic vote-by-mail system, attorneys' fees and costs under 42 U.S.C. § 12205 and 29 U.S.C. § 794a(b), and class certification under Fed. R. Civ. P. 23(b)(2). The matter is pending; class certification has not yet been briefed. Plaintiffs are represented by Disability Rights Texas (Sashi Nisankarao, supervising attorney) and Brown Goldstein & Levy LLP (Eve Hill, Lauren Kelleher, Marisa Leib-Neri).$fdp$,

  eligibility = $el$This case is for Harris County voters with print disabilities who can't read or mark a paper mail-in ballot independently.

You may be part of the class if all of the following apply:
- You're a registered voter in Harris County, Texas.
- You have a disability that affects your ability to read, hold, or mark printed material — including blindness, low vision, finger or hand impairments, paralysis, or other conditions that make handling a paper ballot difficult or impossible without help.
- You're eligible to vote by mail under Texas law.

You don't need to have already tried to vote by mail and been turned away. The lawsuit covers anyone in this group of voters, not just the four named plaintiffs.

If the lawsuit succeeds, accessible electronic vote-by-mail would become available to all Harris County voters in this group going forward. Disability Rights Texas estimates more than 100,000 Harris County voters fit the class definition.$el$,

  eligibility_simple = $els$This case is for you if all these are true:
- You live in Harris County, Texas, and you're registered to vote.
- You have a disability that makes it hard or impossible to read, hold, or mark a paper ballot by yourself. That includes blindness, low vision, finger or hand problems, paralysis, or other conditions.
- You qualify to vote by mail in Texas.

You don't need to have tried to vote by mail and been turned down. If the case wins, voters like you in Harris County could vote by mail electronically going forward.$els$,

  eligibility_professional = $elp$The putative class as pleaded comprises all registered Harris County voters who: (1) possess a qualifying disability under 42 U.S.C. § 12102 and 29 U.S.C. § 705(9)(B) that materially impedes the independent reading, marking, or handling of printed materials; and (2) are eligible under Texas Election Code § 82.001 et seq. to cast a ballot by mail.

Class membership does not require contemporaneous attempt to access the County's mail-ballot system; injury under Title II's program-access standard is established by the County's facially inaccessible service delivery, irrespective of an individual class member's specific attempt-and-denial history. Standing is grounded in the equal-access and informational injuries recognized in Spokeo, Inc. v. Robins, 578 U.S. 330 (2016), and in the dignitary interest in independent and private exercise of the franchise.

Plaintiffs estimate the class size at over 100,000 Harris County voters; satisfaction of Fed. R. Civ. P. 23(a) numerosity, commonality, typicality, and adequacy is not seriously in dispute given the uniform character of the challenged policy.$elp$,

  documentation_required_simple = $drs$What helps if you have it:
- Your voter registration card, or proof you're registered in Harris County.
- Notes from a doctor, eye doctor, or other clinician about your disability.
- Any letter from the Harris County Clerk's Office responding to a request for an accessible ballot (if you ever asked).
- Records of any election where you needed sighted help to vote by mail.

You don't need all of this to be part of the class. Class membership is based on who you are (a Harris County voter with a print disability who's eligible to vote by mail) — not on having a paper trail.$drs$,

  documentation_required_professional = $drp$The following documentation, while not required for class membership, supports the class-membership inquiry and any individualized relief:
- Voter registration records establishing Harris County residency and current registration status.
- Medical, ophthalmological, or rehabilitation documentation establishing the qualifying disability and its functional impact on reading, marking, or handling printed materials.
- Correspondence with the Harris County Clerk's Office evidencing prior accommodation requests and the County's responses (or non-responses).
- Records of mail-in voting attempts requiring sighted or third-party assistance, including election dates and the nature of the assistance required.
- Documentation of any use of assistive technology (screen readers, Braille displays, adaptive switches) that would enable independent access to an electronic ballot.

Class membership is established by status (qualified Harris County voter with a print disability eligible to vote by mail), not by documentary proof of attempt-and-denial. Counsel will request such documentation when needed to perfect individualized relief.$drp$,

  no_documentation_path_simple = $nds$You don't need any paperwork to be part of this case. The class is defined by who you are, not what you can prove on paper.

If you don't have documentation:
- Just being a Harris County voter with a print disability is enough to be in the class.
- If your disability is one a doctor would diagnose (like blindness or low vision), you can get current documentation through your regular healthcare provider.
- For finger or hand impairments, an occupational therapist or your primary care doctor can document it.

You can also:
- Contact Disability Rights Texas directly. They're the attorneys for the plaintiffs and can talk to you about whether your situation fits.
- File a complaint with the U.S. Department of Justice if you feel your voting rights have been denied.

Talk to Ada about your situation if you're not sure where you fit.$nds$,

  no_documentation_path_professional = $ndp$Absence of documentary records does not foreclose class membership. The class definition is status-based — Harris County registration plus qualifying print disability plus mail-ballot eligibility — and does not require documented prior attempts to access the mail-ballot system.

Class members who lack contemporaneous records should consider these parallel avenues:
- Direct contact with Disability Rights Texas (class counsel) at disabilityrightstx.org, which is actively building the class member list and can advise on individual fit.
- Filing an administrative complaint with the DOJ Civil Rights Division, Disability Rights Section under 28 C.F.R. § 35.170, or with the Voting Section under the Voting Rights Act and Help America Vote Act enforcement authorities. DOJ has independent enforcement authority over Title II voting-access claims and previously reached a 2019 settlement with Harris County addressing polling-place accessibility.
- Submitting an accommodation request to the Harris County Clerk's Office in writing to create a contemporaneous record. Even if denied, the request establishes facts useful to the litigation.
- Documenting current and future mail-ballot needs prospectively: requesting an accessible ballot for each upcoming election and preserving the County's response.$ndp$,

  evidence_guidance_simple = $egs$If you want to help build the record for this case:

When the next election comes up:
- Request a mail-in ballot from the Harris County Clerk's Office. Specifically ask for one that's accessible — meaning, one you can read and mark on your own using whatever technology you use (screen reader, braille display, etc.).
- Save whatever they send back. Email reply, letter, screenshot, voicemail — anything.
- If you have to ask someone for help to fill out a paper ballot, note who helped you, when, and what they had to do.

If you've had problems before:
- Write down what happened, when, and who was involved.
- If you have any emails or letters from the Clerk's Office about ballots, save them.

Keep everything in one folder. Even small details help.$egs$,

  evidence_guidance_professional = $egp$For class members documenting current or prospective experience with Harris County's mail-ballot system:

At ballot request:
- Submit a written request to the Harris County Clerk's Office specifying the need for an accessible electronic ballot as a reasonable accommodation. Reference 28 C.F.R. § 35.160 and Title II's program-access obligation.
- Preserve all written correspondence, including email headers, postmarks, and any electronic-delivery confirmations.

At ballot receipt and marking:
- Document the format received (paper only, or accessible electronic).
- If reliance on sighted assistance was necessary, log the assistant's identity, the time and duration of assistance, and the nature of the marking process (whether the assistant read aloud, marked at direction, or both).
- Photograph or scan any ballot materials received, redacting marked selections after submission.

At return:
- Preserve postmarks, delivery confirmations, and any return correspondence.

For systemic documentation:
- Maintain a running log of each election cycle and the County's response to accommodation requests.
- Preserve all communications with the Clerk's Office regardless of medium.

Class counsel (Disability Rights Texas, Brown Goldstein & Levy LLP) will request such records when perfecting individualized relief or supporting class-certification briefing.$egp$,

  what_this_is_not_simple = $wns$A few things this case does NOT cover:
- Voting in counties other than Harris County. Bexar County had its own lawsuit (and won) in 2023. Other Texas counties might also have problems, but this case is about Harris County only.
- In-person voting. Harris County does have accessible voting machines at polling places. The lawsuit is about MAIL-in voting, not voting at the polls.
- Other voting-rights issues — like ID requirements, polling location closures, voter roll purges, or signature matching. Those are real problems but not part of this case.
- Money damages for past elections where you couldn't vote privately. The lawsuit is asking the court to make Harris County fix the system going forward.
- Voters who can use paper ballots independently — even if they have some disability. The class is people who specifically can't read or mark printed material on their own.

If your voting problem is something else, Ada can help you figure out where to go.$wns$,

  what_this_is_not_professional = $wnp$Scope limitations of this action:
- Geographic scope is limited to Harris County, Texas. Parallel claims against other Texas counties or state-level claims against the Texas Secretary of State would require separate enforcement. (Note: a federal court already ordered Bexar County, Texas to provide accessible electronic ballots in 2023 in a separate, similar action.)
- The action addresses the mail-in voting program specifically. Polling-place accessibility, voter-machine accessibility (for which Harris County does provide accessible options under HAVA), and signature-matching practices are outside the pleaded scope. Polling-place barriers were addressed in part by a separate 2019 DOJ settlement with Harris County.
- Other Title II voting access issues — voter-roll maintenance, language-access claims under § 203 of the Voting Rights Act, ID-requirement challenges — are not pleaded here.
- Title II does not provide for compensatory damages absent proof of intentional discrimination under the Olmstead framework; the relief sought is declaratory and injunctive. Section 504 may provide for individualized compensatory remedies in cases of deliberate indifference.
- The class definition is constrained to print-disabled voters; voters with mobility, hearing, or cognitive impairments unrelated to reading or marking printed material are not within the pleaded class.

For barriers outside this case's scope, parallel enforcement avenues include DOJ administrative complaints, complaints to the Texas Secretary of State's office, and analogous private actions in state court under the Texas Election Code's accessibility provisions.$wnp$,

  key_dates = $kd${"Complaint filed": "2026-02-03", "Class certification": "Not yet briefed", "Defendant's response": "Pending", "Status": "Early pleadings", "Pre-suit negotiation": "2023-2024 (ended Nov 2024)", "Related precedent": "Bexar County RAVBM order, 2023"}$kd$::jsonb,

  ada_qualifying_questions = $aqq${"questions": [{"id": "harris_county_resident", "prompt": "Are you a registered voter in Harris County, Texas?", "kind": "yes_no", "purpose": "Class definition requires Harris County registration."}, {"id": "print_disability", "prompt": "Do you have a condition — blindness, low vision, finger or hand impairment, paralysis, or similar — that makes it hard or impossible to read or mark a paper ballot on your own?", "kind": "yes_no_with_detail", "purpose": "Class definition requires qualifying print disability."}, {"id": "mail_ballot_eligible", "prompt": "Are you eligible to vote by mail in Texas? (Generally: 65 or older, disabled, out of county on Election Day, in jail but eligible, or expected to give birth around Election Day.)", "kind": "yes_no", "purpose": "Class definition requires Texas mail-ballot eligibility."}, {"id": "prior_mail_ballot_experience", "prompt": "Have you ever tried to vote by mail in Harris County? If yes, did you need help from someone else to read or mark the ballot?", "kind": "yes_no_with_detail", "purpose": "Background, not strictly a class requirement."}, {"id": "accommodation_request_history", "prompt": "Have you ever asked Harris County for an accessible ballot? If yes, what happened?", "kind": "yes_no_with_detail", "purpose": "Strengthens evidence and supports individualized relief."}, {"id": "documentation_status", "prompt": "Do you have current documentation of your disability — from a doctor, eye doctor, or other clinician?", "kind": "yes_no_with_detail", "purpose": "Drives documentation_required vs no_documentation_path routing."}], "voice_guidance": "Ask one at a time. If user is not a Harris County voter, redirect: Bexar County won a similar case in 2023; other counties may have separate efforts. If user is Harris County but doesn't have print disability, gently explain class scope. If yes to all of 1-3, validate strong fit and explain class is being actively built by Disability Rights Texas. If yes to 4 or 5, validate the experience and confirm it strengthens evidence but isn't required. If no to 6, route to no-documentation path and offer DOJ complaint option as a parallel track."}$aqq$::jsonb,

  updated_at = now()
WHERE slug = 'bryant-v-harris-county-mail-ballots'
  AND id = 'b4e97c92-7cc3-402f-9bf4-f6d5e9c4cb36';

-- ────────────────────────────────────────────────────────────────────
-- Row 2: Alcazar v. Fashion Nova (full prose only — no identity changes)
-- ────────────────────────────────────────────────────────────────────

UPDATE litigation_listings
SET
  short_description_simple = $sds$Fashion Nova's website doesn't work with screen readers. Blind shoppers sued. A settlement is on the table, but the U.S. Department of Justice is fighting it.$sds$,
  short_description_professional = $sdp$Class action under ADA Title III and California Unruh Civil Rights Act alleging Fashion Nova's e-commerce website is inaccessible to legally blind users employing screen-reader software. Two classes certified Sept 2022. Proposed $5.15M settlement reached June 2025; DOJ filed Statement of Interest Feb 2, 2026 opposing final approval; outcome pending as of mid-2026.$sdp$,

  full_description = $fd$This is a federal class-action lawsuit against Fashion Nova, an online clothing retailer. The plaintiff, Juan Alcazar, is legally blind and uses screen-reader software to navigate websites. He sued in 2020 because Fashion Nova's website wasn't compatible with his screen reader — he couldn't shop, browse, or complete a purchase without barriers a sighted person doesn't face. The case is being heard in the U.S. District Court for the Northern District of California.

In September 2022, the court certified two classes: a nationwide class of all legally blind people who tried to access Fashion Nova's website with a screen reader, and a California subclass eligible for monetary damages under California's Unruh Civil Rights Act.

In June 2025, Fashion Nova and the plaintiffs agreed to a proposed settlement: $5.15 million total, up to $4,000 per eligible California class member, and a promise from Fashion Nova to bring its website into substantial conformance with WCAG 2.1 accessibility standards within 180 days. Any leftover money would go to the American Foundation for the Blind.

But the settlement has not been finalized. On February 2, 2026, the U.S. Department of Justice filed a Statement of Interest opposing the settlement. The DOJ argued that the proposed injunctive relief is too vague to actually fix the website, that it has no mechanism for monitoring or enforcement, and — strikingly — that the plaintiffs' own settlement-claims website is itself inaccessible to blind users. The court held a final-approval hearing on February 12, 2026, and set an additional evidentiary hearing for March 30, 2026 to investigate the DOJ's concerns about the claims website. As of mid-2026, the court has not yet ruled.

The deadline to file a claim was October 20, 2025. The case is unusual because most website-accessibility lawsuits settle quietly and individually; this one became a class action AND drew DOJ scrutiny. The outcome will affect how courts approach website-accessibility class settlements going forward.$fd$,

  full_description_simple = $fds$This is a class-action lawsuit against Fashion Nova, an online clothing store. It was filed in 2020 in a federal court in California.

The plaintiff is a man named Juan Alcazar. He's blind, and he uses screen-reader software to use websites. Screen readers turn what's on a screen into speech or braille so blind people can use a computer or phone. He sued Fashion Nova because their shopping website didn't work with screen readers. He couldn't shop on it the way sighted people could.

In 2022, the court agreed to let the case move forward as a class action — meaning, on behalf of all blind people who had tried to use the website.

In 2025, the two sides reached a settlement: Fashion Nova would pay $5.15 million and fix the website. Up to $4,000 of that money could go to each blind shopper in California who filed a claim.

But the judge has not approved the settlement yet. In February 2026, the U.S. Department of Justice stepped in and said the settlement was a bad deal — that it wouldn't actually fix the website, and that the lawyers running the claims process had set up a website that was itself not accessible to blind people. The judge held hearings in February and March 2026 to look into this. As of now, no final decision.

The deadline to file a claim was October 20, 2025.$fds$,

  full_description_professional = $fdp$Alcazar v. Fashion Nova, Inc., 4:20-cv-01434-JST (N.D. Cal., filed Feb. 26, 2020), is a class action under Title III of the Americans with Disabilities Act, 42 U.S.C. § 12181 et seq., and the California Unruh Civil Rights Act, Cal. Civ. Code §§ 51 & 52. Plaintiff Juan Alcazar alleges Fashion Nova's e-commerce website fails to comply with the ADA Standards for Accessible Design as applied to public-accommodation websites, denying screen-reader users full and equal access to the goods and services offered to sighted consumers.

On September 6, 2022, Judge Jon S. Tigar certified two classes pursuant to Fed. R. Civ. P. 23(b)(2) and (b)(3): a Nationwide Class for injunctive relief and a California Class for statutory damages under the Unruh Act. The Court denied an initial motion for preliminary approval of a proposed settlement on December 20, 2024 (Dkt. 198). The parties revised the proposed agreement and reached a settlement of $5.15 million in June 2025, with terms including (i) up to $4,000 per eligible California class member; (ii) injunctive relief requiring Fashion Nova to achieve substantial conformance with WCAG 2.1 within 180 days; (iii) approximately $2.52 million in attorneys' fees and costs; (iv) residual funds to the American Foundation for the Blind. The claims deadline was October 20, 2025.

On February 2, 2026, the U.S. Department of Justice filed a Statement of Interest opposing final approval. The DOJ argued (i) the proposed injunctive relief constitutes only a generic recitation of statutory obligations without enforceable accessibility standards or monitoring mechanisms; (ii) the disproportion between attorneys' fees and class-member benefits warrants scrutiny; and (iii) the settlement administrator's claims website itself contains accessibility barriers identified by a DOJ-retained expert, potentially impairing class members' ability to perfect their claims. The Court held its final-approval hearing on February 12, 2026, and set a further evidentiary hearing for March 30, 2026 to address the DOJ's claims-website allegations. Final approval remains pending. The matter is significant as one of the largest publicly known website-accessibility class settlements and is expected to inform DOJ scrutiny of future Title III class-action settlements involving public-accommodation websites.

Plaintiffs are represented by Thiago M. Coelho (Wilshire Law Firm PLC); Fashion Nova is represented by Amy P. Lally (Sidley Austin LLP).$fdp$,

  eligibility = $el$You may be a class member if all of the following apply:
- You're legally blind (or have a vision disability requiring screen-reader software for web access).
- You attempted to access Fashion Nova's website (www.fashionnova.com) using screen-reader software at any point from February 26, 2018 to the present.

There are two classes:
- A Nationwide Class — includes anyone in the US who fits the description above. The Nationwide Class is eligible for the injunctive relief (Fashion Nova fixing the website), but no individual cash payment.
- A California Class — includes Nationwide Class members who were in California when they tried to access the website. California Class members may receive up to $4,000 each under California's Unruh Civil Rights Act.

The claim filing deadline was October 20, 2025, so new cash-claim filings are closed. You can still be part of the Nationwide Class for purposes of injunctive relief if the settlement is approved, even without a claim filed. The case is on hold pending the court's approval decision.

If you tried to file a claim but couldn't because the claims website was inaccessible to you, that's exactly the issue the DOJ raised — write to Disability Rights Advocates or another disability-rights legal organization to ask about your options.$el$,

  eligibility_simple = $els$You may be in this class if:
- You're legally blind, or you use a screen reader to use websites.
- You tried to use Fashion Nova's website (www.fashionnova.com) any time from February 2018 to now.

There are two parts of the class:
- A nationwide group — anyone in the US who fits.
- A California group — anyone in the nationwide group who lives or was in California when they tried to use the site. The California group is the only group that can get money. Up to $4,000 each.

The deadline to file a claim was October 20, 2025. New claims aren't being accepted right now.

If you missed the deadline because the claims website didn't work with your screen reader, that's exactly what the U.S. Department of Justice complained about. Reach out to a disability rights lawyer or call Disability Rights Advocates to ask what to do.$els$,

  eligibility_professional = $elp$The certified Classes (Sept. 6, 2022) are:

(1) Nationwide Class (Fed. R. Civ. P. 23(b)(2), injunctive relief): All legally blind individuals who have attempted to access Fashion Nova's Website by the use of screen-reading software during the applicable limitations period (Feb. 26, 2018) up to and including final judgment.

(2) California Class (Fed. R. Civ. P. 23(b)(3), statutory damages under Unruh Act): All legally blind individuals in the State of California who have attempted to access Fashion Nova's Website by the use of screen-reading software during the applicable limitations period up to and including final judgment.

Standing under Title III is established by the dignitary and equal-access injuries recognized in the public-accommodations context; California Class members additionally possess standing for statutory damages under Cal. Civ. Code § 52(a) at $4,000 per offense, subject to the proposed settlement's $4,000 cap per class member. Class membership does not require completed purchase or attempted purchase; access attempt with screen-reader software is sufficient.

The claims-filing deadline expired October 20, 2025. Class members who failed to perfect claims due to the accessibility barriers in the settlement-administrator's claims website (the subject of DOJ's Feb. 2, 2026 Statement of Interest) should consult class counsel or independent disability-rights counsel; remedial measures may be available pending the Court's resolution of the DOJ-flagged claims-process concerns.$elp$,

  documentation_required_simple = $drs$What helps if you have it:
- Email confirmation that you tried to make a Fashion Nova purchase (order confirmations, abandoned cart emails, etc.).
- Browser history or cookies showing you visited fashionnova.com (though most people don't keep these long).
- Notes about specific times you tried to shop and ran into problems — what the screen reader said, what you couldn't do, error messages.
- Documentation that you're legally blind or use a screen reader — from a doctor, an eye doctor, or vocational rehabilitation services.

You don't need all of these. The class was certified back in 2022 based on the fact that the website itself was inaccessible — proving you were affected wasn't hard. But the cash claim required some attestation, which was the part the DOJ said was harder than it should have been.$drs$,

  documentation_required_professional = $drp$Documentation supporting class membership and claims:
- Records of Fashion Nova website access attempts: order confirmations, customer-service correspondence, browser cache or cookies (if preserved), screen-reader logs identifying inaccessible content (announced labels, unlabeled buttons, table-navigation failures, etc.).
- Medical or rehabilitative documentation of legal blindness or visual impairment requiring screen-reader use, including ophthalmological records, Bureau of Services for the Blind (or analogous state vocational-rehabilitation) records, treating physician statements, or White Cane Law statutory registration where applicable.
- Records of screen-reader software in use (JAWS, NVDA, VoiceOver, TalkBack) and dates of attempted access.
- For California Class members, residency documentation establishing California presence during access attempts (driver's license, utility bills, voter registration).

Class membership was established on a classwide basis at certification; individualized proof of access barrier is not required for inclusion. The settlement's cash-claim process required a sworn attestation, which DOJ identified as problematic due to the claims-website's own accessibility deficits.$drp$,

  no_documentation_path_simple = $nds$You don't need much documentation to be part of the class. The court already certified the class — meaning, the court agreed the website was inaccessible to a group of people, and that's enough to be included as a group member.

If you don't have proof:
- You can still benefit from any injunctive relief (Fashion Nova fixing the website) if the settlement is approved.
- For California residents, the cash-claim deadline passed in October 2025. If you missed it because the claims website didn't work for you, contact a disability-rights legal organization.

You can also:
- File a complaint with the U.S. Department of Justice about Fashion Nova specifically, or about any other website you've struggled with. DOJ is currently more active on website-accessibility enforcement.
- File a complaint with your state attorney general or human-rights commission. Most states have parallel disability-rights laws.

Talk to Ada about your situation.$nds$,

  no_documentation_path_professional = $ndp$Absence of contemporaneous documentation does not foreclose class membership. The Court's Sept. 6, 2022 class certification order rested on the classwide inaccessibility of Fashion Nova's website, not on individualized proof of attempted purchase or access. Class members who lack records may nonetheless:

- Benefit from any injunctive relief obtained, regardless of individual claim status.
- For California Class members who failed to timely file claims due to the claims-website accessibility barriers identified by the DOJ's Statement of Interest, consult class counsel (Wilshire Law Firm PLC; Thiago M. Coelho) regarding the pending March 30, 2026 evidentiary proceedings and any remedial claims-process modifications the Court may order.
- File parallel administrative complaints under 28 C.F.R. § 36.502 with the DOJ Civil Rights Division regarding any other public-accommodation website encountered; DOJ has signaled heightened scrutiny of Title III digital accessibility violations and may pursue independent enforcement.
- Pursue analogous state-law remedies under California's Unruh Act, New York's State and City Human Rights Laws, the Massachusetts Public Accommodation Act, or similar statutes in states with parallel digital-accessibility enforcement.

The DOJ's intervention in this matter establishes that absence of perfected class claims due to accessibility barriers in the claims process is itself a cognizable injury warranting judicial scrutiny.$ndp$,

  evidence_guidance_simple = $egs$If you run into an inaccessible website now (Fashion Nova or any other):

When you encounter the problem:
- Take a screenshot of the page (or have someone do it for you).
- Note the date, time, URL, and what your screen reader was saying (or not saying).
- Note exactly what you couldn't do: complete a checkout, find a product, navigate menus, read a description.

Save the evidence:
- Email yourself the screenshots and notes so they're timestamped.
- If you contact customer service, save the conversation.

For Fashion Nova specifically:
- The claims deadline has passed. If you missed it because of the inaccessible claims website, write to Wilshire Law Firm or Disability Rights Advocates explaining what happened.

Beyond Fashion Nova:
- The DOJ is taking website accessibility complaints. Filing a complaint with them is free and doesn't require a lawyer.
- Many state attorneys general also accept disability discrimination complaints.$egs$,

  evidence_guidance_professional = $egp$For documentation of website accessibility barriers (Fashion Nova or analogous public-accommodation websites):

At the time of encounter:
- Capture screen-reader output: NVDA log, JAWS speech history, or video/audio capture of the access attempt where feasible.
- Record the specific WCAG 2.1 / 2.2 failures encountered: unlabeled form controls (1.3.1), missing alt text (1.1.1), keyboard inaccessibility (2.1.1), inadequate focus indicators (2.4.7), color-contrast failures (1.4.3), automated assistive-technology-defeating mechanisms (1.4.4, 4.1.2).
- Preserve URL, timestamp, browser/screen-reader version, and the specific user task that failed (product search, cart addition, checkout completion, account creation).

Documentation of communications:
- Customer service correspondence regarding accessibility issues — preserve full email threads, chat transcripts, and any acknowledgment or denial.
- Any prior demand letters or pre-litigation correspondence sent or received.

For Fashion Nova claims-process issues:
- Document the specific accessibility barriers encountered on the claims website (www.fashionnovaaccessibilitysettlement.com), including the dates of attempted use and the assistive technology employed. This evidence directly supports the DOJ-raised concerns being adjudicated in the March 30, 2026 evidentiary proceedings.

Beyond this case:
- DOJ accepts administrative complaints under 28 C.F.R. § 36.502; complaints may be filed online at ADA.gov.
- Where state law provides parallel remedies (Unruh, NYSHRL, NYCHRL, Massachusetts PAA), local enforcement venues may proceed more rapidly than federal litigation.$egp$,

  what_this_is_not_simple = $wns$A few things this case does NOT cover:
- Other clothing retailers. Many websites have similar problems. This case is just about Fashion Nova.
- Physical Fashion Nova stores or pop-ups. The lawsuit is about the website only.
- Accessibility problems beyond screen-reader access — like missing captions on videos, or color-contrast issues, or keyboard navigation. Some of those COULD be ADA issues, but they aren't part of this lawsuit.
- Past purchases. If you successfully bought something from Fashion Nova despite the barriers, the case doesn't refund those purchases.
- Cash for non-California class members. Only the California subclass gets money under California's specific law. Other state residents are only in the injunctive (website-fix) class.

If your accessibility issue is with another website or a physical store, Ada can help you find the right path.$wns$,

  what_this_is_not_professional = $wnp$Scope limitations of this action:
- Limited to Fashion Nova, Inc. (now Fashion Nova, LLC) as defendant. Other public-accommodation websites with analogous accessibility deficits require separate enforcement, although the procedural posture and DOJ scrutiny here may inform parallel actions.
- Pleaded claims are limited to screen-reader inaccessibility under WCAG criteria implicated by visual impairment. Claims sounding in cognitive accessibility (1.3.5 input purposes), motor-disability accessibility (2.5 input modalities), or auditory accessibility (1.2 time-based media) are not pleaded here.
- The action addresses the e-commerce website specifically; Fashion Nova's mobile application, in-store kiosks, and any physical retail locations are outside pleaded scope.
- Title III provides for injunctive relief and attorneys' fees, not compensatory damages. Statutory damages are available only to the California subclass under the Unruh Act. Class members domiciled in other states (Massachusetts, New York, Florida, Texas, etc.) with analogous statutory-damages provisions may pursue parallel state-law remedies, but those claims are not aggregated in this action.
- The settlement, if approved, provides for injunctive relief in the form of "substantial conformance with WCAG 2.1" — DOJ has criticized this as insufficiently specific. Class members concerned about the enforceability of the injunction should monitor the Court's resolution of the March 30, 2026 evidentiary hearing.

For barriers outside this case's scope, parallel enforcement avenues include DOJ administrative complaints under 28 C.F.R. § 36.502, state-court actions under Unruh / NYSHRL / NYCHRL / Massachusetts PAA, and individual Title III actions for injunctive relief and attorneys' fees.$wnp$,

  key_dates = $kd${"Complaint filed": "2020-02-26", "Class certified": "2022-09-06", "Preliminary approval denied (first attempt)": "2024-12-20", "Proposed settlement reached": "2025-06-20", "Claim deadline": "2025-10-20", "DOJ Statement of Interest filed": "2026-02-02", "Final approval hearing": "2026-02-12", "Evidentiary hearing (DOJ claims-website concerns)": "2026-03-30", "Status": "Final approval pending; outcome of evidentiary hearing not yet on record"}$kd$::jsonb,

  ada_qualifying_questions = $aqq${"questions": [{"id": "legally_blind", "prompt": "Are you legally blind, or do you use screen-reader software to access websites?", "kind": "yes_no", "purpose": "Class definition requires screen-reader use due to visual disability."}, {"id": "fashion_nova_access_attempt", "prompt": "Did you ever try to access Fashion Nova's website (www.fashionnova.com) using a screen reader between February 26, 2018 and now?", "kind": "yes_no_with_detail", "purpose": "Core class membership criterion."}, {"id": "california_resident", "prompt": "Were you living in or physically present in California during any of those access attempts?", "kind": "yes_no", "purpose": "California subclass eligibility for cash recovery."}, {"id": "claim_filed_status", "prompt": "Did you file a claim through the Fashion Nova settlement website before the October 20, 2025 deadline?", "kind": "yes_no_with_detail", "purpose": "Identifies which sub-population user falls into."}, {"id": "claims_website_barriers", "prompt": "If you tried to file a claim but couldn't, was it because the claims website itself was inaccessible to you?", "kind": "yes_no_with_detail", "purpose": "Identifies users affected by the DOJ-raised claims-process barriers."}, {"id": "specific_barriers_encountered", "prompt": "What kind of problems did you encounter on Fashion Nova's site? (Unlabeled buttons, products with no descriptions, can't complete checkout, etc.)", "kind": "short_text", "purpose": "Texture for the user's experience; supports systemic enforcement messaging."}], "voice_guidance": "Ask one at a time. If user isn't a screen-reader user, the case isn't a fit; redirect to other accessibility avenues. If yes to 1 and 2, validate class membership and explain the case's pending status. If yes to 3 and no to 4 (didn't file), express concern and suggest contacting Wilshire Law Firm — the DOJ's concerns about the claims website may open a remedial pathway. If yes to 3 and yes to 4, congratulate on timely filing and note outcome depends on final approval. If 5 = yes (claims-website barriers), strongly recommend documenting and contacting class counsel — they have a direct interest in DOJ's evidence. For question 6, use whatever the user describes to validate that the experience matches the litigation theory."}$aqq$::jsonb,

  related_listing_ids = '[]'::jsonb,

  updated_at = now()
WHERE slug = 'alcazar-v-fashion-nova-web-access'
  AND id = '0f092870-05e0-43c5-9317-f0ccf3d09b72';

-- ────────────────────────────────────────────────────────────────────
-- Row 3: Harris v. Union Pacific — reclassify to closed
-- ────────────────────────────────────────────────────────────────────

UPDATE litigation_listings
SET
  status = 'closed',
  case_name = 'Harris v. Union Pacific Railroad Co. (class action — decertified)',
  court = 'U.S. District Court, District of Nebraska',
  docket_number = '8:16-cv-00381',
  filing_date = '2016-08-08',
  short_description = $sd$Class action challenging Union Pacific's 1% Rule fitness-for-duty policy. Class certified Feb 2019, decertified by Eighth Circuit March 2020 for lack of commonality. Class action closed Nov 2021; the underlying ADA Title I theory continues to be litigated through dozens of individual actions (Sanders, DeFries, Donahue, Zaragoza, Mlsna).$sd$,
  updated_at = now()
WHERE slug = 'eeoc-v-union-pacific-one-percent-rule'
  AND id = '9f8cb570-417f-4f4b-ae8c-2729050b726a';
