# Calendly Strategy Call Setup Guide
## Affiliate Launchpad — Complete Configuration Reference

**Last updated:** April 13, 2026
**Status:** Ready to configure

---

## Overview

This guide contains every setting, every piece of copy, and every configuration decision needed to stand up the Affiliate Launchpad strategy call booking flow in Calendly. Everything is written for immediate copy-paste use — nothing needs to be rewritten before entering it into Calendly.

---

## Event Type Settings

Log into Calendly → **Create Event Type** → **One-on-One** and configure as follows.

| Setting | Value |
|---------|-------|
| Event Name | Affiliate Launchpad Strategy Call |
| Duration | 30 minutes |
| Location | Zoom (enter your personal Zoom link in the "Custom" location field, or connect Calendly's native Zoom integration for auto-generated unique links) |
| Color | Yellow / Gold (select the closest yellow or amber swatch Calendly offers — typically labeled "Yellow" or "Warm") |
| URL Slug | `strategy-call` (result: `calendly.com/YOUR_USERNAME/strategy-call`) |
| Max Invitees Per Event | 1 (one-on-one only) |
| Buffer Time Before | 10 minutes (gives Karl breathing room between calls) |
| Buffer Time After | 10 minutes |
| Minimum Scheduling Notice | 4 hours (prevents last-minute bookings with no prep time) |
| Date Range | Rolling — 7 days into the future (creates urgency; adjust to 14 days if needed) |
| Require Confirmation | Off — auto-confirm to reduce friction |

**Location note:** Go to Event Type → Edit → Location → Add Location → Zoom. If you have Calendly's Zoom integration connected, it will auto-generate a unique Zoom link for each booking. If not, select "Custom" and paste your personal Zoom room URL. The latter is acceptable for low volume; the former is recommended as you scale.

---

## Event Description

Copy-paste this text into the **Description** field of the event type. This is what prospects see on the booking page before they pick a time.

```
This is your free 30-minute Affiliate Launchpad Strategy Call with Karl.

On this call, we'll map out your personal path to $10K/month with TikTok Shop affiliate marketing — no fluff, no pitch decks, just a real conversation about where you are now and exactly what it would take to get you there. Come prepared with your current income numbers, your biggest obstacles, and your questions. We move fast and we respect your time.

Spots are strictly limited. If you're here, it means your application stood out — show up ready to have an honest conversation about your goals.
```

---

## Intake Questions

Add these questions in order under the **Invitee Questions** section of the event type. Calendly auto-fills Name and Email from the booking flow — configure them as shown and add the remaining questions manually.

---

**Question 1**
- Label: `Name`
- Type: Name field (built-in)
- Required: Yes
- Notes: Auto-filled from Calendly's booking form. Ensure it is enabled and set to required.

---

**Question 2**
- Label: `Email`
- Type: Email (built-in)
- Required: Yes
- Notes: Auto-filled. Ensure it is enabled. This is used for all automated email sequences.

---

**Question 3**
- Label: `Phone Number`
- Type: Phone number
- Required: Yes
- Notes: Used for SMS reminders if you enable Calendly's SMS feature, and for Karl to reach no-shows.

---

**Question 4**
- Label: `What is your current monthly revenue from any online business?`
- Type: Dropdown (single select)
- Required: Yes
- Options (enter each on its own line):
  - $0 (just starting)
  - $1–$500/month
  - $500–$2K/month
  - $2K–$5K/month
  - $5K–$10K/month
  - $10K+/month

---

**Question 5**
- Label: `How long have you been trying to make money online?`
- Type: Dropdown (single select)
- Required: Yes
- Options:
  - Less than 3 months
  - 3–6 months
  - 6–12 months
  - 1–2 years
  - 2+ years

---

**Question 6**
- Label: `What platforms are you currently active on?`
- Type: Checkboxes (multi-select)
- Required: No (optional)
- Options:
  - TikTok
  - Instagram
  - YouTube
  - Facebook
  - None yet

---

**Question 7**
- Label: `Have you invested in a course or coaching program before?`
- Type: Radio buttons (single select) or Dropdown
- Required: Yes
- Options:
  - Yes
  - No

---

**Question 8**
- Label: `What is your monthly budget available to invest in your business right now?`
- Type: Dropdown (single select)
- Required: Yes
- Options:
  - Under $500
  - $500–$1K
  - $1K–$3K
  - $3K–$5K
  - $5K+

---

**Question 9**
- Label: `What is your biggest obstacle to hitting $10K/month?`
- Type: Multi-line text
- Required: Yes
- Placeholder text (if supported): `Be honest and specific — this helps Karl prepare for your call.`

---

**Question 10**
- Label: `On a scale of 1–10, how serious are you about changing your financial situation in the next 90 days?`
- Type: Dropdown (single select)
- Required: Yes
- Options:
  - 1
  - 2
  - 3
  - 4
  - 5
  - 6
  - 7
  - 8
  - 9
  - 10

---

**Question 11**
- Label: `Are you the decision-maker for your finances, or do you need to consult a partner?`
- Type: Radio buttons (single select)
- Required: Yes
- Options:
  - I decide alone
  - I'll need to discuss with my partner

---

## Email Copy

### Confirmation Email (sent immediately after booking)

Configure this under **Event Type → Notifications & Cancellation Policy → Confirmation Email**. In Calendly, you can customize the subject and body of the confirmation email sent to the invitee.

---

**Subject line:**
```
You're in, [First Name] — here's what to do before our call
```

*(Calendly supports the `[First Name]` merge tag in the subject line on paid plans. If not available, use: "You're booked — here's what to do before our strategy call")*

---

**Email body:**

```
Hey [First Name],

You just took a real step. Most people talk about changing their situation — you actually did something about it. Your strategy call with Karl is confirmed, and I'm genuinely looking forward to connecting.

Here are your call details:

   Date & Time: [Event Date & Time]
   Duration: 30 minutes
   Zoom Link: [Location / Join URL]

Add it to your calendar now so you don't miss it. The link above is your unique Zoom link — it won't work for anyone else.

---

Before our call, do these three things:

1. Know your numbers. What's your current monthly income from any source? What are your monthly expenses? You don't need a spreadsheet — just a ballpark.

2. Get clear on your #1 goal. Not a vague wish like "make more money." Something specific: "I want to replace my $4,000/month job income within 6 months using TikTok Shop."

3. Come ready to be honest. The more real you are with me about where you're at and what's held you back, the more useful this call will be. There's no judgment — just strategy.

---

What this call IS:
A focused 30-minute session where we look at your situation, talk through the TikTok Shop affiliate opportunity, and figure out if Affiliate Launchpad is the right fit for you.

What this call is NOT:
A sales pitch, a webinar, or a waste of your time.

I built Affiliate Launchpad because I found a system that actually works, and I want to help serious people replicate it. If that's you, I'll see you on the call.

If anything comes up and you need to reschedule, please do so at least 24 hours in advance using the link below. Same-day cancellations and no-shows will not be rebooked automatically.

   Reschedule or Cancel: [Reschedule / Cancel Link]

See you soon,

Karl
Affiliate Launchpad

P.S. — If you have a specific question you want to make sure we cover, reply to this email and let me know. I read every response.
```

---

### Reminder Email (24 hours before the call)

Configure this under **Event Type → Notifications → Reminder Email**. Set the timing to **24 hours before**.

---

**Subject line:**
```
Your call with Karl is tomorrow — are you ready?
```

---

**Email body:**

```
Hey [First Name],

Quick reminder: your Affiliate Launchpad Strategy Call with Karl is tomorrow.

   Date & Time: [Event Date & Time]
   Zoom Link: [Location / Join URL]

Click the Zoom link above at your scheduled time. The call will start on time — out of respect for everyone's schedule, I won't be waiting past the first 5 minutes.

---

Here's your pre-call checklist:

✓  You know your current monthly income (even if it's $0 — that's fine)
✓  You have your #1 goal clearly in mind
✓  You've thought about what's actually been stopping you
✓  You're in a quiet place where you can talk freely for 30 minutes
✓  You're showing up as a decision-maker, ready to hear what's possible

---

I look at these calls as real conversations, not pitches. Come ready to talk, ask questions, and be honest about where you're at. If Affiliate Launchpad is a fit for you, we'll know by the end of the 30 minutes.

If you need to reschedule, please do it now — at least 24 hours in advance — so that time slot can go to someone else who's waiting.

   Reschedule or Cancel: [Reschedule / Cancel Link]

See you tomorrow,

Karl
Affiliate Launchpad

P.S. — Spots on my calendar are genuinely limited. If you've made it this far, you have something most people don't: you actually took action. Don't waste it by no-showing.
```

---

## Cancellation and Rescheduling Policy

Paste this into **Event Type → Notifications & Cancellation Policy → Cancellation Policy** field. This text will appear on the booking confirmation page and in emails.

```
Cancellation & Rescheduling Policy

We respect your time and ask that you respect ours.

• Reschedule or cancel at least 24 hours before your call. You can do this at any time using the link in your confirmation email.

• Same-day cancellations and no-shows will not be automatically rebooked. If you miss your call without notice, you will need to reapply to secure another time.

• Spots on Karl's calendar are limited by design. When you cancel, that time becomes available to another applicant who is serious and ready. If you're not ready, please free up the spot.

If something urgent comes up, email us before the call and we'll do our best to work with you.
```

---

## Post-Call Follow-Up Framework

The following is an operational reference for what happens after each call. These are not Calendly settings — they are workflow notes for Karl and any future team member managing the pipeline.

---

### Outcome A: Ready to Close

The prospect is qualified, engaged, and ready to invest.

1. While still on the call (or immediately after), send the payment link directly — do not wait. Every hour of delay reduces close rate.
2. Follow up by text within 15 minutes of the call ending if payment was not completed on the call: *"Hey [First Name], great call — here's the link again: [PAYMENT_LINK]. Let me know if you have any questions."*
3. If no response within 24 hours, send one final follow-up: *"Hey [First Name], just checking in — the offer we discussed is still available for the next 48 hours. Happy to answer any last questions."*
4. After 48 hours with no action, move to the Nurture Sequence (see Outcome C).

---

### Outcome B: No-Show

The prospect booked but did not attend.

1. Send a text within 30 minutes of the missed call: *"Hey [First Name], I was on Zoom waiting for you — looks like something came up. I have limited spots, but if you're still serious, reply here and I'll see if we can find another time."*
2. If no response within 24 hours, send a single re-engagement email:

   Subject: `You missed our call, [First Name] — still want in?`

   Body: *"Hey [First Name], I held your spot and showed up — but it looks like something got in the way. That happens. If you're still serious about making TikTok Shop work for you, reply to this email and I'll see what I can do. If I don't hear back within 48 hours, I'll assume your situation has changed and will move on. No hard feelings either way. — Karl"*

3. If still no response, add to the No-Show Re-engagement email sequence (3-part, spaced 3 days apart) and remove from active pipeline.
4. Do not re-book automatically. The prospect must reply and demonstrate renewed intent before getting another call.

---

### Outcome C: Not Ready / Needs More Nurturing

The prospect is interested but not yet at the decision-making point (budget concerns, needs to "think about it," needs partner approval, etc.).

1. Note the specific objection in your CRM or a simple spreadsheet.
2. Add them to the Nurture Email Sequence — a 5–7 email sequence spaced over 14 days that includes:
   - Social proof / student wins specific to their income level or concern
   - Content that directly addresses their stated objection (e.g., "Can I really do this with only 30 minutes a day?")
   - A low-friction re-entry offer: *"When you're ready to revisit the conversation, here's my calendar: [CALENDLY_URL]"*
3. Continue engaging them via your organic content on TikTok and Instagram — they are a warm audience and will often self-select back into the pipeline.
4. Do not force or pressure. A prospect who comes back on their own terms closes at a much higher rate and churns at a much lower rate.

---

## Setup Checklist

Before making the Calendly link live, verify each item:

- [ ] Event name is "Affiliate Launchpad Strategy Call"
- [ ] Duration is set to 30 minutes
- [ ] Zoom is configured as the location (integration or manual link)
- [ ] Event color is set to yellow/gold
- [ ] Event description is copy-pasted and previewed
- [ ] All 11 intake questions are added in order
- [ ] All required fields are marked as required
- [ ] Dropdown options match exactly (watch for en-dashes vs hyphens)
- [ ] Confirmation email subject and body are configured
- [ ] 24-hour reminder email is enabled and configured
- [ ] Cancellation policy text is entered
- [ ] Minimum scheduling notice is set to 4 hours
- [ ] Availability windows are set correctly (only show times Karl is actually available)
- [ ] Buffer times (before and after) are enabled
- [ ] Date range is set to rolling 7 days
- [ ] Live test: book a test appointment, verify all emails arrive, verify Zoom link works, then cancel the test booking
- [ ] Calendly URL is pasted into YouForm's redirect setting (see `youform-config/form-spec.md`)

---

*End of Calendly Setup Guide — Affiliate Launchpad*
