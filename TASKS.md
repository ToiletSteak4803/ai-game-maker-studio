# Project Execution Plan (Claude Code)

## 1) Business Summary
This project is for a yet-to-be-specified business (intake is blank), so the goal is to deliver a clean, one-page marketing site that can be quickly updated once the business name, services, and contact details are provided.

## 2) Required Pages/Sections (One-Page Site)
- Header with logo, navigation, and primary CTA
- Hero section with headline, subheadline, and primary CTA
- Services overview (3–5 service cards)
- Why choose us / value props
- Process or “How it works”
- Testimonials or trust signals
- Contact section with phone/email/hours (placeholders if missing)
- Footer with basic info

## 3) Concrete Copy Blocks (No Lorem Ipsum)
**Site Name (placeholder):** Your Business Name  
**Tagline (hero headline):** Local service, done right the first time.  
**Hero subheadline:** We provide fast, reliable help for homes and small businesses in your area—clear pricing, friendly crews, and dependable results.  
**Primary CTA:** Get a Free Quote  
**Secondary CTA:** Call Now  

**Services Section Headline:** Services that solve the real problems  
**Services Subheadline:** Simple, flexible options tailored to your needs.

**Service Card 1**  
- Title: Residential Service  
- Blurb: Repairs, installs, and upgrades for homeowners who want it done quickly and correctly.

**Service Card 2**  
- Title: Commercial Service  
- Blurb: Dependable support for offices and storefronts—scheduled work or urgent fixes.

**Service Card 3**  
- Title: Maintenance Plans  
- Blurb: Proactive checkups that prevent costly surprises and keep everything running smoothly.

**Why Choose Us Headline:** Why customers choose us  
**Value Props:**  
- Transparent estimates with no surprises  
- On-time arrivals and respectful crews  
- Quality work backed by clear guarantees  

**Process Headline:** How it works  
**Steps:**  
1) Tell us what you need  
2) We provide a clear quote and timeline  
3) We complete the work and follow up  

**Trust Signals Headline:** Trusted by local clients  
**Trust Copy:** “On time, professional, and the result was better than expected.” — Happy Customer  

**Contact Headline:** Ready to get started?  
**Contact Copy:** Reach out today and we’ll reply within one business day.  
**Contact Details (placeholders):**  
- Phone: (000) 000-0000  
- Email: hello@yourbusiness.com  
- Hours: Mon–Fri, 8am–5pm  

**Footer Copy:** © 2025 Your Business Name. All rights reserved.

## 4) Strict Rules for Claude
- Do not add dependencies.  
- Do not modify config files unless explicitly required.  
- Use Tailwind only.  
- Prefer minimal edits and reuse existing structure.  
- Stop after Phase 1 unless told otherwise.

## 5) Phased Prompts

### Phase 1 — Implement UI + Copy
**Goal:** Build the one-page UI and insert the copy above.  
**Files that may be edited:**  
- `src/app/page.tsx`  
- `src/components/*` (new files only if needed)

### Phase 2 — Metadata + SEO Basics
**Goal:** Add metadata and basic SEO scaffolding.  
**Files that may be edited:**  
- `src/app/layout.tsx`  
- `src/app/sitemap.ts` (if present)  
- `src/app/robots.ts` (if present)

### Phase 3 — QA Pass Checklist
**Goal:** Verify layout, content, responsiveness, and asset usage.  
**Files that may be edited:**  
- None (report findings only unless asked to fix)

**QA Checklist:**  
- Logo renders in header (SVG preferred)  
- All copy matches plan, no placeholder lorem ipsum  
- Mobile layout stacks correctly and remains readable  
- Buttons and links are reachable and styled consistently  
- Contact info is present (placeholders ok if still missing)
