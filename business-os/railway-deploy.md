# Deploying Affiliate Launchpad Business OS to Railway

This guide walks through deploying the Business OS to [Railway](https://railway.app) — a fully managed cloud platform that handles Node.js, persistent storage, and custom domains with minimal configuration.

---

## Prerequisites

- A [Railway account](https://railway.app) (free tier works for staging; Pro plan recommended for production)
- A [GitHub account](https://github.com) with the project pushed to a repository
- Node.js 18+ project confirmed working locally (`npm run dev`)

---

## Step 1: Prepare the Project

### 1.1 Create a GitHub Repository

```bash
# From inside the business-os directory
git init
git add .
git commit -m "Initial commit"
```

Go to [github.com/new](https://github.com/new) and create a new **private** repository (e.g., `affiliate-launchpad-os`).

```bash
git remote add origin https://github.com/YOUR_USERNAME/affiliate-launchpad-os.git
git branch -M main
git push -u origin main
```

### 1.2 Monorepo Structure Note

The project is structured as a monorepo with the root `package.json` coordinating both `server/` and `client/` subdirectories. Railway will use the root `package.json` and the `railway.json` config to:

1. Install root-level dependencies (`concurrently`)
2. Run the `start` script: `node server/index.js`

The React frontend should be **pre-built** before deployment (see Step 5). In production, Express serves the compiled static files from `client/dist/` directly — no separate Vite server is needed.

---

## Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and log in
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Authorize Railway to access your GitHub account if prompted
5. Select your `affiliate-launchpad-os` repository
6. Railway will automatically detect it as a Node.js project and begin the first deployment

> Railway reads `railway.json` at the root of your project and uses `node server/index.js` as the start command. If the build fails, check the **Build Logs** tab in the Railway dashboard.

---

## Step 3: Configure Environment Variables

In the Railway dashboard:

1. Click on your service (the card that appeared after connecting your repo)
2. Go to the **Variables** tab
3. Click **Add Variable** for each entry below

### Required Variables

| Variable             | Value / Instructions                                                                 |
|----------------------|--------------------------------------------------------------------------------------|
| `NODE_ENV`           | `production`                                                                         |
| `PORT`               | Leave unset — Railway injects this automatically. Your code must use `process.env.PORT`. |
| `JWT_SECRET`         | Generate with: `openssl rand -base64 32` — use a strong, unique value               |
| `DATABASE_PATH`      | `/app/data/affiliate_launchpad.db`                                                   |
| `GHL_WEBHOOK_SECRET` | The shared secret you configure in GHL (any strong random string)                   |
| `GHL_WEBHOOK_URL`    | Your GHL inbound webhook URL (from GHL Settings → Webhooks)                         |
| `GHL_API_KEY`        | Your GHL API key (from GHL Settings → API Keys)                                     |
| `SMTP_HOST`          | e.g., `smtp.gmail.com`                                                               |
| `SMTP_PORT`          | e.g., `587`                                                                          |
| `SMTP_SECURE`        | `false` for port 587, `true` for port 465                                            |
| `SMTP_USER`          | Your SMTP username / email address                                                   |
| `SMTP_PASS`          | Your SMTP password or Gmail App Password                                             |
| `NOTIFY_EMAIL`       | Admin notification email address                                                     |
| `FRONTEND_URL`       | Your Railway-provided URL (set after Step 6, e.g., `https://os.affiliatelaunchpad.com`) |

### Bulk Import Option

Railway supports importing variables from a `.env` file. Click **Raw Editor**, paste your variable block, and Railway will parse them all at once.

> Never commit your `.env` file to Git. The `.env.example` file is safe to commit — it contains no real secrets.

---

## Step 4: Add a Volume for SQLite Persistence

By default, Railway containers are ephemeral — the filesystem resets on every deploy. You must attach a **persistent volume** to preserve your SQLite database.

1. In the Railway dashboard, click on your service
2. Go to the **Volumes** tab
3. Click **Add Volume**
4. Set the **Mount Path** to: `/app/data`
5. Click **Create**

Railway will restart the service with the volume attached. Your database file at `/app/data/affiliate_launchpad.db` will now survive deploys, restarts, and crashes.

> The `DATABASE_PATH` environment variable must be set to `/app/data/affiliate_launchpad.db` to match this mount path.

---

## Step 5: Deploy the Frontend

You have two options for serving the React frontend.

---

### Option A: Serve Static Files from Express (Recommended)

Build the React app and let Express serve it. This keeps everything in one Railway service and one URL.

**Step A1: Add a build script to your server**

In `server/index.js`, add this block **after** defining all API routes:

```javascript
const path = require('path');

// Serve static React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '../client/dist');
  app.use(express.static(clientBuild));
  // Catch-all: send index.html for any non-API route (React Router support)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}
```

**Step A2: Add a build command to root `package.json`**

Update the `scripts` section to include a `build` script that Railway runs automatically:

```json
"build": "npm run install:all && npm run build:client"
```

**Step A3: Update `railway.json`**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "node server/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**Step A4: Set `FRONTEND_URL` to your Railway domain**

Once Railway generates your URL (e.g., `https://affiliate-launchpad-os-production.up.railway.app`), set:

```
FRONTEND_URL=https://affiliate-launchpad-os-production.up.railway.app
```

After completing Step 6 (custom domain), update this to your custom domain.

---

### Option B: Deploy Frontend to Vercel (Simpler for Teams)

Deploy the React frontend separately to Vercel. This is easier to manage if your team uses Vercel for other projects.

**Step B1: Push the `client/` folder (or full repo) to GitHub** — already done.

**Step B2: Deploy to Vercel**

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Set **Root Directory** to `client`
4. Vercel auto-detects Vite — accept the defaults
5. Add one environment variable:
   ```
   VITE_API_URL=https://YOUR_RAILWAY_DOMAIN/api
   ```
6. Click **Deploy**

**Step B3: Update CORS on Railway**

Set the Railway `FRONTEND_URL` variable to your Vercel domain:
```
FRONTEND_URL=https://your-app.vercel.app
```

**Step B4: Update your client API config**

In `client/src/api/client.js` (or equivalent), ensure the base URL reads from the env variable:

```javascript
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});
```

---

## Step 6: Custom Domain

### 6.1 Add Your Domain in Railway

1. In Railway → your service → **Settings** tab
2. Scroll to **Domains**
3. Click **Add Custom Domain**
4. Enter your domain: `os.affiliatelaunchpad.com`
5. Railway displays a `CNAME` target (e.g., `your-service.railway.app`)

### 6.2 Add DNS Record

In your DNS provider (Cloudflare, Namecheap, GoDaddy, etc.):

| Type  | Name  | Value                            | TTL  |
|-------|-------|----------------------------------|------|
| CNAME | os    | your-service.railway.app         | Auto |

DNS propagation typically takes 5–30 minutes. Check with:

```bash
dig os.affiliatelaunchpad.com CNAME
```

### 6.3 SSL Certificate

Railway provisions a **free TLS certificate** (via Let's Encrypt) automatically once DNS propagates. No additional configuration is needed.

### 6.4 Update Environment Variables

After the custom domain is active, update:

```
FRONTEND_URL=https://os.affiliatelaunchpad.com
```

Trigger a redeploy by pushing an empty commit or clicking **Redeploy** in the Railway dashboard.

---

## Step 7: Verify Deployment

### 7.1 Check Build and Runtime Logs

In Railway → your service → **Logs** tab. You should see:

```
Server running on port XXXX
Database initialized at /app/data/affiliate_launchpad.db
```

If you see errors, expand the log lines for stack traces.

### 7.2 Test the API

```bash
curl -X POST https://os.affiliatelaunchpad.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@affiliatelaunchpad.com","password":"admin123"}'
```

Expected response:
```json
{
  "token": "eyJhbGci...",
  "user": { "id": 1, "role": "admin", ... }
}
```

### 7.3 Test the Frontend

Open `https://os.affiliatelaunchpad.com` in your browser. The login screen should load.

Log in with:
- Email: `admin@affiliatelaunchpad.com`
- Password: `admin123`

---

## Production Checklist

Complete every item before going live:

- [ ] Change admin password (Settings → My Profile → Change Password)
- [ ] Set a strong, unique `JWT_SECRET` (32+ random bytes)
- [ ] Configure SMTP credentials and test email delivery
- [ ] Add `GHL_WEBHOOK_URL` and `GHL_WEBHOOK_SECRET`
- [ ] Set `FRONTEND_URL` to your production domain
- [ ] Verify SQLite volume is mounted at `/app/data`
- [ ] Test inbound GHL webhook with a test contact in GHL
- [ ] Test outbound (move a test lead to Closed Won, verify GHL receives the event)
- [ ] Set up custom domain and confirm SSL is active
- [ ] Review Railway spend limits / set a budget alert
- [ ] Ensure GitHub repo is **private**

---

## Updating the App

Every push to the `main` branch (or your configured deploy branch) triggers an automatic redeploy on Railway.

```bash
# Make your changes, then:
git add .
git commit -m "Your update message"
git push origin main
```

Railway will:
1. Pull the latest code
2. Run the build command (`npm run build`)
3. Replace the running container with the new build (zero-downtime rolling deploy)
4. Keep your persistent volume intact

### Rollback

If a deploy introduces a bug, click **Deployments** in the Railway dashboard, find the previous successful deploy, and click **Rollback**.

---

## Monitoring & Logs

| Feature        | Where to Find It                          |
|----------------|-------------------------------------------|
| Live logs      | Railway → service → Logs tab             |
| Metrics (CPU/RAM) | Railway → service → Metrics tab        |
| Deploy history | Railway → service → Deployments tab      |
| Volume usage   | Railway → service → Volumes tab          |
| Alerts         | Railway → Project Settings → Notifications |

---

*Railway deployment guide for Affiliate Launchpad Business OS — Internal Use Only*
