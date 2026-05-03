# Changelog

## [2.0.0] — 2026-05-02 · Rebrand: Affiliate Launchpad → Noble Transformation

### Summary
Full niche pivot from TikTok Shop affiliate coaching to premium 90-day body recomposition coaching. Every brand element, copy block, color treatment, and image placeholder replaced. Conversion architecture, section ordering, form endpoints, Calendly wiring, GHL chat widget, and all JS behaviors preserved.

### Changed
- **Brand identity** — New "Noble Transformation" name, crest logo (inline SVG `<symbol id="nt-logo">`), red/gray palette replacing gold/black
- **Color system** — `--bg-0/#0c0d0f` · `--bg-1/#141518` · `--bg-2/#1c1d20` · `--red/#c8102e` · `--red-bright/#e53e4e` replacing all gold variables
- **Typography accent** — Playfair Display headings retain serif; `<em>` inside headlines now renders in `--red-bright` instead of gold gradient
- **Meta tags** — Title: `Noble Transformation | Apply Now`; description and OG tags updated to fitness offer
- **VSL embed** — Replaced prior YouTube ID with `De__teSfbho` (`https://www.youtube.com/embed/De__teSfbho?rel=0&modestbranding=1&playsinline=1`)
- **Hero** — New eyebrow pill, headline, lead caption, 4-up stat strip (1,200+ members / 15,000+ lbs lost / 4.9★ / 21 days)
- **Trust bar** — NSCA / Precision Nutrition / Verified Results / Top 1% Coaching Program
- **Real Member Results** — 3-card grid with DEXA-verified stats (−24 lbs / −31 lbs / −19 lbs), progress-photo placeholders, member quotes
- **Problem section** — 4 pain cards: consistency, wasted spend, conflicting advice, no accountability
- **What's Included** — 8-item bordered checklist: training plan, nutrition blueprint, 1-on-1 check-ins, community, onboarding call, travel protocol, grocery templates, DEXA scans + roadmap
- **Is This You?** — 5 yes / 5 no qualifier items with green/red tint columns
- **Testimonials** — 3 verified 90-day grad cards (James H. / Priya M. / Ryan C.)
- **Coach section** — Karl bio rewritten for fitness expertise; credentials: CSCS, PN2, 1,200+ clients, −42 lbs personal transformation badge
- **Final CTA** — Two-step layout: YouForm application → Calendly strategy call; urgency pill (7 of 10 spots)
- **FAQ** — 6 items: time commitment, gym vs. home, visible change timeline, injuries, course vs. coaching, pricing
- **Footer** — NT LLC address/phone/email; results disclaimer; SMS consent paragraph
- **Privacy policy modal** — Entity renamed to Noble Transformation LLC; contact updated to karl@nobletransformation.com
- **`privacy-policy.html`** — Full standalone page updated: entity name, contact email, domain, all references
- **`favicon.svg`** — Replaced rocket with NT crest (circular border, crown, laurels, N lettermark)
- **`logo.svg`** — New standalone 200×48 SVG with crest mark + two-line wordmark

### Preserved
- `YOUFORM_URL` → `https://app.youform.com/forms/6oxwjnne`
- `CALENDLY_URL` → `https://calendly.com/goatecommgmt/book`
- GHL Chat Widget (`data-widget-id="69e74a7a06d5d5e258e21556"`)
- Sticky nav hide/show scroll behavior
- Scroll reveal animation system
- FAQ accordion (first item open by default)
- Privacy modal (footer triggers + CTA triggers + Esc/click-outside close)
- Anchor IDs: `#hero`, `#results`, `#problem`, `#benefits`, `#qualifier`, `#testimonials`, `#coach`, `#apply`, `#faq`
- YouTube IFrame API integration for unmute button
- All responsive breakpoints (380px / 768px / 1280px)
