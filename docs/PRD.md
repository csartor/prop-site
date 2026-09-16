# PRD: Cosplay Commission MVP

## Product overview

This product is a curated commission intake and quote-routing platform for custom cosplay props, helmets, armor parts, and related maker work. The MVP is intentionally narrower than a full marketplace: it is designed to test whether structured buyer briefs and curated maker routing produce better commission outcomes than Facebook, Instagram DMs, or Etsy custom-order flows.[1][2][3]

The product does **not** begin as a payments-heavy marketplace. It starts as a lightweight software layer plus concierge operations, with the goal of learning whether buyers submit serious project requests, makers respond with usable quotes, and some requests convert into real matches.[4][5]

## Product goal

The MVP should answer three business questions:

1. Will buyers submit quote-ready custom fabrication requests?
2. Will qualified makers respond through a structured quoting flow?
3. Will buyers choose makers often enough to justify a deeper product investment?

If these three conditions are not met, adding payment infrastructure, compliance-heavy moderation, or marketplace automation will not fix the core business problem.

## Problem statement

Today, cosplay commission work is fragmented across Etsy, Instagram, Facebook groups, Discord, and direct email. Etsy supports custom orders, but the flow starts from a seller shop or listing and generally assumes the buyer already knows which maker to contact.[1][2][6]

That works reasonably well for repeatable or semi-custom products. It is weaker for harder commission jobs where a buyer needs to describe a specific build, compare multiple makers, and understand differences in timeline, materials, finish quality, and scope.[1][3]

## User segments

### Buyers

Primary buyer personas:

- Cosplayers who need a custom prop, helmet, armor part, or wearable piece.
- Buyers who have reference art or a character in mind but do not know which maker to hire.
- Buyers who need local pickup, fitting, resizing, or a specific deadline.
- Buyers who want to compare quotes without manually managing multiple DM threads.

### Makers

Primary maker personas:

- 3D-print and finishing specialists.
- Foam armor and prop fabricators.
- Electronics-integrated prop makers.
- Multi-process costume and armor builders.
- Local makers who rely on Instagram, Facebook, conventions, or referrals for leads.

## Product scope

### In scope for MVP

- Structured buyer project request form.
- Curated maker application and profile system.
- Internal admin dashboard for request review and routing.
- Structured quote submission form for makers.
- Buyer quote comparison output.
- Basic funnel and conversion analytics.
- Manual moderation, manual routing, manual quality control.

### Out of scope for MVP

- Escrow or milestone payment handling.
- In-app messaging or chat.
- Full public searchable marketplace with advanced filtering.
- Review and reputation system.
- Automated fraud detection.
- Automated IP classification or moderation.
- Shipping labels, tax handling, customs, or dispute management.
- Mobile app.

## Success criteria

The MVP is successful if it shows signal on both sides of the marketplace.[7][8]

| Metric | Target signal | Why it matters |
|---|---|---|
| Buyer requests per month | 20–50 | Shows real demand exists |
| Quote-ready request rate | 50%+ | Proves the intake form creates usable briefs |
| Average makers invited per request | 3–5 | Gives buyers meaningful choice |
| Average quotes returned per request | 2–3+ | Indicates maker liquidity |
| Time to first quote | Under 72 hours | Strongly affects buyer confidence |
| Buyer selection rate | 15%–30%+ | Core test of whether routing adds value |
| Maker repeat participation | 50%+ of active makers | Suggests the workflow is worth their time |

## User journey

### Buyer journey

1. Buyer lands on the site.
2. Buyer submits a structured commission request.
3. Internal admin reviews the request.
4. Approved request is routed to a small set of relevant makers.
5. Makers submit standardized quotes.
6. Buyer receives a normalized comparison.
7. Buyer selects a maker or abandons the request.
8. Admin logs outcome and learns from the result.

### Maker journey

1. Maker applies to join the curated network.
2. Admin reviews maker fit and portfolio quality.
3. Approved maker receives routed project opportunities.
4. Maker submits quotes through a structured form.
5. Maker may be selected by buyer.
6. Admin records conversion and optional completion status.

## Functional requirements

## 1. Buyer request form

### Purpose

The buyer request form is the most important part of the MVP. It replaces vague commission inquiries with a structured job brief that a maker can realistically quote.

### Required fields

- Project title
- Project category, for example helmet, prop, armor part, full suit component, display piece
- Reference images or links
- Description of what needs to be made
- Wearable or display-only
- Finish level, such as raw print, assembled, primed, painted, premium finish
- Functional requirements, such as electronics, lightweight, con-safe, kid-safe
- Deadline and flexibility
- Budget range
- Shipping destination or local pickup city
- Existing file or STL ownership status
- Measurements or size requirements if relevant
- Contact information

### Validation rules

- Budget is required
- Deadline is required
- At least one usable reference is required
- Category is required
- Contact method is required
- Form should flag impossible combinations, such as a premium rush build at a very low budget

### Output

A saved buyer request record with status `new`.

### Build prompt

```text
Build a buyer request form for a custom cosplay commission platform.

Requirements:
- Use a multi-step form to reduce abandonment.
- Collect: project title, category, description, reference images/links, wearable/display-only, finish tier, deadline, budget range, buyer location, shipping vs pickup, measurements, electronics/functionality needs, existing STL/file ownership, and contact details.
- Require budget, deadline, category, and at least one reference.
- Save data to the database as a buyer_request record.
- Add simple admin-review flags such as incomplete, unrealistic budget, urgent, local-only.
- Optimize for clarity, not visual complexity.
- Use responsive design and keep the mobile flow smooth.
```

## 2. Maker application form

### Purpose

The maker application form creates the initial curated supply base. The goal is not open signups; it is filtering for credible makers who can quote real jobs.

### Required fields

- Maker name or business name
- Email and contact links
- Location
- Services offered
- Materials/processes used
- Portfolio images or links
- Typical price range
- Average lead time
- Regions served
- What jobs they will not accept
- Optional notes on specialties

### Review criteria

- Portfolio quality
- Clarity of specialization
- Professionalism and responsiveness
- Ability to serve at least one meaningful category of demand

### Output

A maker application record that can be approved into a maker profile.

### Build prompt

```text
Build a maker application form for a curated cosplay commission network.

Requirements:
- Collect maker/business name, location, contact info, service categories, process tags, portfolio links/images, lead time, typical budget range, shipping/pickup regions, and jobs they do not accept.
- Save applications to the database separately from approved maker profiles.
- Include an admin-only review status: pending, approved, rejected, needs follow-up.
- Allow upload or URL-based portfolio examples.
- Keep the form short enough that strong makers will actually complete it.
```

## 3. Maker profile system

### Purpose

Maker profiles are the supply-side records used for internal routing and, later, buyer-facing discovery. In the MVP, they can be relatively simple but must be structured enough for matching.

### Profile fields

- Display name
- Location
- Bio
- Specialties
- Process tags
- Portfolio gallery
- Availability status
- Typical project budget band
- Regions served
- Links to social/contact pages
- Admin notes

### Build prompt

```text
Build a maker profile system for a custom commission platform.

Requirements:
- Approved maker applications should convert into structured maker profiles.
- Include fields for location, specialties, process tags, portfolio items, budget band, lead time, and service region.
- Add an availability status such as open, limited, or closed.
- Profiles should be visible in the admin dashboard and optionally on a simple public page.
- Keep the schema flexible enough for future filtering and matching.
```

## 4. Admin routing dashboard

### Purpose

This is the internal operating layer. It does not need to look polished. Its purpose is to let the operator review requests, reject bad ones, route good ones to makers, and track outcomes.

### Core capabilities

- View all incoming buyer requests
- Filter by category, budget, deadline, and location
- Review attached references
- Mark request status
- Assign selected makers to a request
- Track quote submissions and final outcomes
- Leave internal notes

### Build prompt

```text
Build an internal admin dashboard for a concierge-style commission platform.

Requirements:
- Show a list of all buyer requests with filters for category, budget range, urgency, location, and status.
- Allow admin to open a request detail view with references and all submitted data.
- Allow admin to assign a request to multiple makers.
- Track lifecycle states: new, reviewed, routed, quoted, selected, lost, completed.
- Add internal notes and lightweight flags.
- This tool should optimize for operator efficiency, not aesthetics.
```

## 5. Request-to-maker routing

### Purpose

Routing is the mechanism that turns a buyer brief into a real quoting opportunity. In the MVP, routing should be manual or semi-manual.

### Behavior

- Admin selects 3–5 relevant makers
- Platform notifies makers by email with a private quote link
- Request record stores who was invited and when
- Request detail shows pending vs submitted quotes

### Build prompt

```text
Build a manual routing workflow that connects approved buyer requests to selected makers.

Requirements:
- From the admin dashboard, allow a request to be assigned to 3 to 5 makers.
- Generate a private quote link for each maker-request pair.
- Send an email notification to each assigned maker with project summary and quote deadline.
- Track invitation status: sent, opened, quoted, declined, expired.
- Show routing activity inside the admin request detail page.
```

## 6. Maker quote form

### Purpose

The maker quote form standardizes quote structure so buyers can compare offers meaningfully. This is one of the MVP’s most important differentiators from informal DMs.

### Required fields

- Estimated price or price range
- Estimated turnaround time
- Scope included
- Scope excluded
- Assumptions
- Questions for buyer
- Optional rush fee
- Shipping notes

### Build prompt

```text
Build a structured maker quote form for project-specific commission requests.

Requirements:
- Each form should be tied to a specific request and maker.
- Collect estimated total price or range, completion timeline, included work, exclusions, assumptions, buyer questions, shipping notes, and optional rush fee.
- Save quotes in a normalized format so multiple maker responses can be compared side by side.
- Support draft and submitted states.
- Keep the form fast to complete on desktop and mobile.
```

## 7. Buyer quote comparison view

### Purpose

The quote comparison layer helps buyers compare offers based on scope, timing, and fit rather than just price.

### Required capabilities

- Show each maker clearly
- Normalize quote fields for comparison
- Highlight included vs excluded work
- Show turnaround and location/shipping context
- Allow buyer to indicate interest or select a maker

### Build prompt

```text
Build a buyer-facing quote comparison page for custom cosplay commission requests.

Requirements:
- Show all submitted quotes in a consistent card or table format.
- Display maker name, portfolio preview, price/range, timeline, included work, exclusions, shipping notes, and open questions.
- Make it easy for the buyer to compare quotes without reading long freeform messages.
- Add a clear action for selecting a preferred maker or requesting clarification.
- The page should feel trustworthy and easy to scan.
```

## 8. Outcome tracking

### Purpose

The MVP must track whether requests convert into selections and, optionally, whether work completes. Without this, the product cannot be evaluated honestly.

### Key states

- Request submitted
- Request reviewed
- Request routed
- Quotes received
- Buyer selected maker
- Buyer abandoned request
- Maker unavailable
- Completed off-platform

### Build prompt

```text
Build outcome tracking for a commission-routing MVP.

Requirements:
- Allow admin to update the status of each request through its lifecycle.
- Track which maker was selected, if any.
- Track whether the request closed without a match and the reason if known.
- Add optional completion tracking for off-platform fulfillment.
- Make this status data available for analytics reporting.
```

## 9. Basic analytics dashboard

### Purpose

This dashboard should answer whether the workflow is working. It should focus on funnel metrics, not vanity metrics.

### Metrics

- Number of buyer requests submitted
- Quote-ready request rate
- Requests routed
- Quotes submitted
- Time to first quote
- Buyer selection rate
- Maker participation rate
- Repeat maker participation
- Request loss reasons if available

### Build prompt

```text
Build a lightweight analytics dashboard for the commission MVP.

Requirements:
- Show request volume, routed requests, quote volume, average quotes per routed request, time to first quote, buyer selection rate, and maker participation rate.
- Add date filtering.
- Keep the interface simple and decision-oriented.
- Prioritize funnel metrics over pageview or traffic metrics.
```

## Non-functional requirements

### UX requirements

- Mobile-friendly for both buyers and makers
- Clear, low-friction forms
- Trustworthy but simple visual design
- Fast page loads and low complexity
- Clean distinction between buyer, maker, and admin flows

### Operational requirements

- Manual moderation supported everywhere
- Email-based notifications are enough for MVP
- File uploads must support reference images
- Internal notes must be easy to add and find

### Legal and compliance posture for MVP

This MVP should operate as a matching and workflow platform, not as a merchant of record. That means:

- No payment holding
- No escrow language
- No guarantee of delivery
- No representation that the platform certifies legality of commissioned IP-based work
- Basic takedown/reporting contact and terms

This approach still carries risk, but it is materially lighter than launching with embedded payments, dispute guarantees, and platform-managed fulfillment.[9][10][11]

## Suggested release plan

### Phase 1: Core intake and routing

- Buyer request form
- Maker application form
- Admin dashboard
- Request routing
- Maker quote form

### Phase 2: Buyer comparison and analytics

- Buyer quote comparison page
- Outcome tracking
- Basic analytics dashboard

### Phase 3: Optional polish after validation

- Public maker directory
- Better search/filtering
- Better onboarding copy
- Lightweight maker availability settings

## Product risks

### Demand risk

Buyers may still prefer Etsy, Instagram, or Facebook because those already have audience and habit. Etsy already supports custom-item requests and seller-created custom listings, which means the MVP must produce a meaningfully better quoting and matching experience to justify use.[1][2]

### Supply risk

Makers may not want to join another platform unless the leads are high quality or the workflow clearly saves them time. That is why maker curation and structured briefs are essential.

### Operational risk

Manual routing can become labor-intensive before the economics work. This is acceptable in MVP only if it produces learning faster than building automation.

## Decision rule after MVP

Continue building only if the product shows all three of the following:

- Buyers consistently submit serious, quote-ready requests.
- Makers consistently respond with quotes.
- A meaningful percentage of requests result in a buyer selecting a maker.

If one of these fails, the product should be narrowed, repositioned as a maker-side workflow tool, or stopped.