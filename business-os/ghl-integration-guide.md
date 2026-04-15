# GoHighLevel ↔ Affiliate Launchpad OS — Integration Guide

## Overview

Two-way sync between GoHighLevel (GHL) and the Affiliate Launchpad Business OS:

| Direction | Trigger | Action |
|-----------|---------|--------|
| **GHL → OS** | New contact created or form submitted in GHL | Lead auto-created in OS pipeline at "New Lead" stage |
| **OS → GHL** | Lead marked **Closed Won** in OS | POST to GHL webhook → triggers your onboarding automation |

---

## Part 1 — Inbound: GHL → Business OS

### How it works
When a new lead comes into GHL (from your landing page form, ad, or manual entry), GHL fires a webhook POST to your OS. The OS creates the lead and places it in the **New Lead** pipeline stage.

### Step 1 — Deploy the Business OS
Ensure your Business OS is deployed and accessible at a public URL (e.g., `https://your-app.railway.app`). The inbound endpoint is:

```
POST https://your-app.railway.app/api/leads/inbound
```

### Step 2 — Set your webhook secret
In your OS `server/.env`:
```env
GHL_WEBHOOK_SECRET=my_super_secret_value_123
```

### Step 3 — Configure the webhook in GHL
1. Go to **GHL Dashboard → Settings → Integrations → Webhooks**
2. Click **+ Add Webhook**
3. Set:
   - **URL:** `https://your-app.railway.app/api/leads/inbound`
   - **Events:** Select `Contact Created` and/or `Opportunity Created`
4. Add a **custom header:**
   - Header name:  `x-webhook-secret`
   - Header value: `my_super_secret_value_123` ← must match your `.env`
5. Click **Save & Test**

### Step 4 — Test the webhook
GHL's test button will send a sample payload. Check your Railway logs for:
```
[INFO] Inbound lead received: Jane Smith (jane@example.com)
```

### Inbound Payload Format
GHL will send (or you can configure a custom payload in GHL workflows):

```json
{
  "firstName": "Jane",
  "lastName":  "Smith",
  "email":     "jane@example.com",
  "phone":     "+15550001234",
  "source":    "TikTok",
  "tags":      ["tiktok-ad", "vsl-viewer"],
  "customFields": {
    "monthly_revenue":  "$0 — just starting",
    "budget":           "$1K–$3K",
    "goal_90_days":     "Reach $5K/month",
    "investment_ready": "Yes, definitely"
  }
}
```

### Field Mapping (GHL → OS)

| GHL Field | OS Lead Field |
|-----------|---------------|
| `firstName` | `first_name` |
| `lastName` | `last_name` |
| `email` | `email` |
| `phone` | `phone` |
| `source` | `source` |
| `tags` | `tags` (JSON array) |
| `customFields.monthly_revenue` | `monthly_revenue` |
| `customFields.budget` | `budget` |
| `customFields.goal_90_days` | `goal_90_days` |
| `customFields.investment_ready` | `investment_ready` |

---

## Part 2 — Outbound: Business OS → GHL (Closed Won)

### How it works
When you drag a lead to **Closed Won** in the OS pipeline (or use the "Move Stage" button), the OS automatically fires a POST to your GHL webhook URL. In GHL, this triggers your onboarding automation workflow.

### Step 1 — Set the GHL webhook URL in your .env
```env
GHL_WEBHOOK_URL=https://hooks.gohighlevel.com/hooks/catch/YOUR_ACCOUNT_ID/YOUR_HOOK_ID
```

### Step 2 — Create the GHL webhook receiver
1. Go to **GHL → Automations → + New Workflow**
2. Choose trigger: **Webhook**
3. Copy the generated webhook URL → paste it into your OS `.env` as `GHL_WEBHOOK_URL`
4. Add workflow actions:
   - **Tag contact:** "Closed Won"
   - **Move to pipeline:** "Clients" pipeline, "Onboarding" stage
   - **Send onboarding email sequence**
   - **Notify assigned rep**
5. Save and publish the workflow

### Outbound Payload (OS → GHL)

The Business OS sends this JSON payload:

```json
{
  "event":        "lead.closed_won",
  "leadId":       42,
  "email":        "jane@example.com",
  "name":         "Jane Smith",
  "phone":        "+15550001234",
  "closedAt":     "2026-04-13T18:00:00.000Z",
  "assignedRep":  "Karl",
  "source":       "TikTok",
  "budget":       "$1K–$3K",
  "monthlyRevenue": "$0 — just starting"
}
```

### Step 3 — Map the payload in GHL
In your GHL workflow, use custom values to map the incoming webhook data:
- `{{contact.email}}` → use webhook field `email`
- `{{contact.name}}`  → use webhook field `name`
- `{{contact.phone}}` → use webhook field `phone`

---

## Part 3 — YouForm Alternative (Direct to OS)

If you want YouForm to push leads directly to the OS (bypassing GHL):

**Webhook URL:**
```
POST https://your-app.railway.app/api/webhooks/youform
```

**Header:**
```
x-webhook-secret: your_ghl_webhook_secret_value
```

The YouForm webhook payload is automatically mapped to a lead record.

---

## Part 4 — Calendly Booking Webhook

When a lead books a call via Calendly, you can have Calendly automatically move them to **Booked Call** in the OS:

1. Go to **Calendly → Integrations → Webhooks**
2. Add webhook URL: `https://your-app.railway.app/api/webhooks/calendly`
3. Subscribe to events: `invitee.created`, `invitee.canceled`
4. The OS will find the lead by email and update their stage + call date automatically

---

## Testing the Full Flow

```bash
# 1. Test inbound webhook (simulates a GHL lead)
curl -X POST https://your-app.railway.app/api/leads/inbound \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your_secret_here" \
  -d '{
    "firstName": "Test",
    "lastName": "Lead",
    "email": "test@example.com",
    "phone": "+15550009999",
    "source": "TikTok",
    "customFields": {
      "monthly_revenue": "$0 — just starting",
      "budget": "$1K–$3K"
    }
  }'

# Expected response:
# {"success": true, "leadId": 5}

# 2. Check the lead appeared in the OS
# Login to http://localhost:5173 → Pipeline → "New Lead" column

# 3. Move the lead to Closed Won in the UI
# → Watch your GHL workflow fire (check GHL execution history)
```

---

## Troubleshooting

| Problem | Check |
|---------|-------|
| Inbound webhook returns 401 | `x-webhook-secret` header doesn't match `GHL_WEBHOOK_SECRET` in `.env` |
| Lead not appearing in OS | Check Railway logs for errors; verify the payload includes `firstName` |
| Closed Won webhook not firing | Check `GHL_WEBHOOK_URL` is set correctly in `.env`; check `server/utils/ghl.js` |
| Calendly not moving lead | Lead email in Calendly must match email in OS exactly (case-sensitive) |
| CORS errors from frontend | Ensure `FRONTEND_URL` in `.env` matches your deployed frontend URL exactly |
