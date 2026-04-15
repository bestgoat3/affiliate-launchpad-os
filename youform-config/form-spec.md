# YouForm Lead Form Configuration
## Affiliate Launchpad — Application Form Spec

**Last updated:** April 13, 2026
**Status:** Ready to build

---

## Purpose

This form is the first touchpoint in the Affiliate Launchpad sales funnel. It serves as a **soft, low-friction application** designed to:

- Pre-qualify leads before they book a strategy call
- Warm up the prospect by priming them to think about their goals and readiness
- Filter out window-shoppers from serious buyers before Karl invests 30 minutes on a call
- Create micro-commitment: the act of filling out an application increases psychological investment
- Pass intent signals to Calendly so Karl walks into every call informed

The form should feel like an **exclusive opportunity**, not a contact form. The language and design must reinforce that we are selective about who we work with.

---

## YouForm Field Setup Table

Build the form in YouForm exactly as specified below. All fields are presented in order.

| Field # | Label | Field Type | Required? | Options / Notes |
|---------|-------|------------|-----------|-----------------|
| 1 | First Name | Text (short) | Yes | Placeholder: "Your first name" |
| 2 | Last Name | Text (short) | Yes | Placeholder: "Your last name" |
| 3 | Email Address | Email | Yes | Placeholder: "you@example.com" — used for Calendly pre-fill |
| 4 | Phone Number | Phone / Tel | Yes | Placeholder: "+1 (555) 000-0000" — include country code note |
| 5 | How did you find us? | Dropdown | Yes | TikTok / Instagram / YouTube / Friend or Referral / Other |
| 6 | What is your current monthly income from online business? | Dropdown | Yes | $0 — just starting / $1–$500/mo / $500–$2K/mo / $2K–$5K/mo / $5K+/mo |
| 7 | What's your #1 goal in the next 90 days? | Short Text | Yes | Placeholder: "Be specific — what does success look like for you?" |
| 8 | Are you ready to invest in yourself to reach that goal? | Single Choice (Radio) | Yes | Yes, definitely / I need to learn more first |

**Notes on field logic:**
- Field 8 is a soft commitment qualifier. Both answers allow submission — do not gate the form. The answer informs how Karl frames the call.
- Keep Field 7 as short text (not multi-line) to reduce friction. One compelling sentence is enough.
- On mobile, ensure the phone field triggers a numeric keypad.

---

## Form Settings

Configure these settings in your YouForm dashboard under the form's **Settings** tab.

| Setting | Value |
|---------|-------|
| Form Title | Apply to Affiliate Launchpad |
| Form Description | Fill out this short application to see if you qualify for our coaching program. Takes less than 2 minutes. |
| Submit Button Label | Submit Application → |
| After Submit Action | Redirect to URL |
| Redirect URL | `CALENDLY_URL` *(replace with your full Calendly scheduling link, e.g., https://calendly.com/karl/strategy-call)* |
| Confirmation Message | You're one step closer. Book your free strategy call on the next page. |
| Progress Bar | Enabled |
| Show field numbers | Optional — disable for a cleaner look |
| Branding / Powered by YouForm | Disable if on paid plan |

---

## YouForm Custom CSS

Paste this into YouForm's **Custom CSS** field (Settings > Appearance > Custom CSS). This matches the Affiliate Launchpad brand: dark background, gold accents, Inter typeface.

```css
/* ============================================
   Affiliate Launchpad — YouForm Custom CSS
   Brand: Dark #0A0A0A | Gold #C9A84C | Inter
   ============================================ */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Global reset to brand */
body,
.youform-wrapper,
.youform-container {
  background-color: #0A0A0A !important;
  font-family: 'Inter', sans-serif !important;
  color: #FFFFFF !important;
}

/* Form card / panel */
.youform-form,
.form-card,
[class*="form-container"] {
  background-color: #141414 !important;
  border: 1px solid #2A2A2A !important;
  border-radius: 12px !important;
  padding: 40px !important;
  max-width: 640px !important;
  margin: 0 auto !important;
  box-shadow: 0 0 40px rgba(201, 168, 76, 0.08) !important;
}

/* Form title */
.youform-title,
[class*="form-title"],
h1 {
  color: #C9A84C !important;
  font-size: 28px !important;
  font-weight: 700 !important;
  letter-spacing: -0.5px !important;
  margin-bottom: 8px !important;
}

/* Form description */
.youform-description,
[class*="form-description"],
p.description {
  color: #A0A0A0 !important;
  font-size: 15px !important;
  line-height: 1.6 !important;
  margin-bottom: 32px !important;
}

/* Field labels */
label,
.field-label,
[class*="question-label"] {
  color: #FFFFFF !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  margin-bottom: 8px !important;
  display: block !important;
}

/* Input fields */
input[type="text"],
input[type="email"],
input[type="tel"],
input[type="phone"],
textarea,
select,
.youform-input,
[class*="input-field"] {
  background-color: #1E1E1E !important;
  border: 1px solid #333333 !important;
  border-radius: 8px !important;
  color: #FFFFFF !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 15px !important;
  padding: 12px 16px !important;
  width: 100% !important;
  box-sizing: border-box !important;
  transition: border-color 0.2s ease !important;
}

input:focus,
textarea:focus,
select:focus,
[class*="input-field"]:focus {
  border-color: #C9A84C !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15) !important;
}

input::placeholder,
textarea::placeholder {
  color: #555555 !important;
}

/* Dropdown arrow override */
select {
  appearance: none !important;
  -webkit-appearance: none !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23C9A84C' d='M6 8L0 0h12z'/%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: right 16px center !important;
  padding-right: 40px !important;
}

/* Radio / single choice buttons */
.radio-option,
[class*="choice-option"],
[class*="radio-label"] {
  background-color: #1E1E1E !important;
  border: 1px solid #333333 !important;
  border-radius: 8px !important;
  color: #FFFFFF !important;
  padding: 12px 16px !important;
  margin-bottom: 8px !important;
  cursor: pointer !important;
  transition: border-color 0.2s ease, background-color 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
}

.radio-option:hover,
[class*="choice-option"]:hover {
  border-color: #C9A84C !important;
  background-color: #1A1A12 !important;
}

.radio-option.selected,
[class*="choice-option"].selected,
input[type="radio"]:checked + label {
  border-color: #C9A84C !important;
  background-color: rgba(201, 168, 76, 0.1) !important;
  color: #C9A84C !important;
}

/* Progress bar */
.youform-progress,
[class*="progress-bar-container"] {
  background-color: #2A2A2A !important;
  border-radius: 999px !important;
  height: 6px !important;
  margin-bottom: 32px !important;
}

.youform-progress-fill,
[class*="progress-bar-fill"] {
  background-color: #C9A84C !important;
  border-radius: 999px !important;
  transition: width 0.4s ease !important;
}

/* Submit button */
button[type="submit"],
.youform-submit-btn,
[class*="submit-button"] {
  background-color: #C9A84C !important;
  color: #0A0A0A !important;
  font-family: 'Inter', sans-serif !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  letter-spacing: 0.3px !important;
  border: none !important;
  border-radius: 8px !important;
  padding: 14px 32px !important;
  width: 100% !important;
  cursor: pointer !important;
  transition: background-color 0.2s ease, transform 0.1s ease !important;
  margin-top: 8px !important;
}

button[type="submit"]:hover,
.youform-submit-btn:hover {
  background-color: #E0BC60 !important;
  transform: translateY(-1px) !important;
}

button[type="submit"]:active {
  transform: translateY(0) !important;
}

/* Error states */
.field-error,
[class*="error-message"] {
  color: #FF6B6B !important;
  font-size: 13px !important;
  margin-top: 4px !important;
}

input.error,
select.error,
textarea.error {
  border-color: #FF6B6B !important;
}

/* Required asterisk */
.required-indicator,
[class*="required"] {
  color: #C9A84C !important;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .youform-form,
  .form-card,
  [class*="form-container"] {
    padding: 24px 20px !important;
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
  }

  .youform-title,
  h1 {
    font-size: 22px !important;
  }
}
```

---

## Standalone HTML Form Page

This is a fully self-contained fallback page that can be hosted anywhere (Netlify, GitHub Pages, your own server) or used as a design reference. It mirrors the YouForm fields exactly, includes client-side validation, and redirects to `CALENDLY_URL` after a successful submission.

**To deploy:** Replace `CALENDLY_URL` on line ~10 with your actual Calendly link, then upload the file.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Apply to Affiliate Launchpad</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

  <script>
    // REPLACE THIS with your actual Calendly scheduling link
    const CALENDLY_URL = "https://calendly.com/YOUR_USERNAME/strategy-call";
  </script>

  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --bg: #0A0A0A;
      --surface: #141414;
      --surface-2: #1E1E1E;
      --border: #2A2A2A;
      --border-active: #C9A84C;
      --gold: #C9A84C;
      --gold-hover: #E0BC60;
      --text: #FFFFFF;
      --text-muted: #A0A0A0;
      --text-placeholder: #555555;
      --error: #FF6B6B;
      --radius: 8px;
    }

    html, body {
      min-height: 100vh;
      background-color: var(--bg);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--text);
      line-height: 1.5;
    }

    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 16px;
    }

    /* Progress bar */
    .progress-wrapper {
      width: 100%;
      max-width: 640px;
      margin-bottom: 32px;
    }

    .progress-label {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 8px;
      font-weight: 500;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .progress-track {
      width: 100%;
      height: 5px;
      background: var(--border);
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--gold);
      border-radius: 999px;
      transition: width 0.4s ease;
      width: 0%;
    }

    /* Card */
    .form-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 48px 40px;
      width: 100%;
      max-width: 640px;
      box-shadow: 0 0 60px rgba(201, 168, 76, 0.06);
    }

    /* Header */
    .form-header {
      margin-bottom: 40px;
    }

    .badge {
      display: inline-block;
      background: rgba(201, 168, 76, 0.12);
      border: 1px solid rgba(201, 168, 76, 0.3);
      color: var(--gold);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      padding: 4px 12px;
      border-radius: 999px;
      margin-bottom: 16px;
    }

    .form-title {
      font-size: 30px;
      font-weight: 700;
      color: var(--text);
      letter-spacing: -0.5px;
      line-height: 1.2;
      margin-bottom: 12px;
    }

    .form-title span {
      color: var(--gold);
    }

    .form-description {
      color: var(--text-muted);
      font-size: 15px;
      line-height: 1.65;
    }

    /* Fields */
    .field-group {
      margin-bottom: 24px;
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 8px;
    }

    .required-star {
      color: var(--gold);
      margin-left: 2px;
    }

    input[type="text"],
    input[type="email"],
    input[type="tel"],
    textarea,
    select {
      width: 100%;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--text);
      font-family: 'Inter', sans-serif;
      font-size: 15px;
      padding: 12px 16px;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
      appearance: none;
      -webkit-appearance: none;
    }

    select {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='7' viewBox='0 0 12 7'%3E%3Cpath fill='%23C9A84C' d='M6 7L0 0h12z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 16px center;
      padding-right: 42px;
      cursor: pointer;
    }

    input::placeholder,
    textarea::placeholder {
      color: var(--text-placeholder);
    }

    input:focus,
    textarea:focus,
    select:focus {
      border-color: var(--border-active);
      box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15);
    }

    input.error,
    select.error,
    textarea.error {
      border-color: var(--error);
    }

    .error-msg {
      display: none;
      color: var(--error);
      font-size: 13px;
      margin-top: 5px;
      font-weight: 500;
    }

    .error-msg.visible {
      display: block;
    }

    /* Radio choices */
    .choices {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .choice-option {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 13px 16px;
      cursor: pointer;
      transition: border-color 0.2s, background-color 0.2s;
      font-size: 15px;
      color: var(--text);
      font-weight: 400;
      user-select: none;
    }

    .choice-option:hover {
      border-color: var(--border-active);
      background: #1A1A12;
    }

    .choice-option input[type="radio"] {
      width: 18px;
      height: 18px;
      min-width: 18px;
      border-radius: 50%;
      border: 2px solid #444;
      background: transparent;
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
      transition: border-color 0.2s;
      padding: 0;
      box-shadow: none;
    }

    .choice-option input[type="radio"]:checked {
      border-color: var(--gold);
      background: var(--gold);
      box-shadow: inset 0 0 0 3px var(--surface-2);
    }

    .choice-option:has(input[type="radio"]:checked) {
      border-color: var(--gold);
      background: rgba(201, 168, 76, 0.08);
      color: var(--gold);
      font-weight: 600;
    }

    /* Divider */
    .divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: 32px 0;
    }

    /* Submit button */
    .btn-submit {
      display: block;
      width: 100%;
      background: var(--gold);
      color: #0A0A0A;
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.3px;
      border: none;
      border-radius: var(--radius);
      padding: 15px 32px;
      cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
      margin-top: 8px;
      text-align: center;
    }

    .btn-submit:hover {
      background: var(--gold-hover);
      transform: translateY(-1px);
    }

    .btn-submit:active {
      transform: translateY(0);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    /* Fine print */
    .fine-print {
      text-align: center;
      color: var(--text-muted);
      font-size: 13px;
      margin-top: 20px;
      line-height: 1.6;
    }

    /* Success state */
    .success-overlay {
      display: none;
      text-align: center;
      padding: 48px 24px;
    }

    .success-overlay.visible {
      display: block;
    }

    .success-icon {
      width: 72px;
      height: 72px;
      background: rgba(201, 168, 76, 0.12);
      border: 2px solid var(--gold);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      font-size: 32px;
    }

    .success-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 12px;
    }

    .success-body {
      color: var(--text-muted);
      font-size: 15px;
      line-height: 1.6;
    }

    /* Responsive */
    @media (max-width: 600px) {
      body {
        padding: 24px 12px;
      }

      .form-card {
        padding: 32px 20px;
        border-radius: 10px;
      }

      .field-row {
        grid-template-columns: 1fr;
      }

      .form-title {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>

  <!-- Progress bar -->
  <div class="progress-wrapper" id="progressWrapper">
    <div class="progress-label">Application Progress</div>
    <div class="progress-track">
      <div class="progress-fill" id="progressFill"></div>
    </div>
  </div>

  <!-- Form card -->
  <div class="form-card">

    <!-- Success message (hidden until submit) -->
    <div class="success-overlay" id="successOverlay">
      <div class="success-icon">✓</div>
      <h2 class="success-title">You're one step closer.</h2>
      <p class="success-body">Book your free strategy call on the next page. Redirecting you now…</p>
    </div>

    <!-- Actual form -->
    <form id="applicationForm" novalidate>

      <div class="form-header">
        <div class="badge">Limited Spots Available</div>
        <h1 class="form-title">Apply to <span>Affiliate Launchpad</span></h1>
        <p class="form-description">Fill out this short application to see if you qualify for our coaching program. Takes less than 2 minutes.</p>
      </div>

      <!-- Name row -->
      <div class="field-row">
        <div class="field-group">
          <label for="firstName">First Name <span class="required-star">*</span></label>
          <input type="text" id="firstName" name="firstName" placeholder="Your first name" autocomplete="given-name" />
          <span class="error-msg" id="err-firstName">Please enter your first name.</span>
        </div>
        <div class="field-group">
          <label for="lastName">Last Name <span class="required-star">*</span></label>
          <input type="text" id="lastName" name="lastName" placeholder="Your last name" autocomplete="family-name" />
          <span class="error-msg" id="err-lastName">Please enter your last name.</span>
        </div>
      </div>

      <!-- Email -->
      <div class="field-group">
        <label for="email">Email Address <span class="required-star">*</span></label>
        <input type="email" id="email" name="email" placeholder="you@example.com" autocomplete="email" />
        <span class="error-msg" id="err-email">Please enter a valid email address.</span>
      </div>

      <!-- Phone -->
      <div class="field-group">
        <label for="phone">Phone Number <span class="required-star">*</span></label>
        <input type="tel" id="phone" name="phone" placeholder="+1 (555) 000-0000" autocomplete="tel" inputmode="tel" />
        <span class="error-msg" id="err-phone">Please enter your phone number.</span>
      </div>

      <hr class="divider" />

      <!-- Source -->
      <div class="field-group">
        <label for="source">How did you find us? <span class="required-star">*</span></label>
        <select id="source" name="source">
          <option value="" disabled selected>Select an option…</option>
          <option value="tiktok">TikTok</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="referral">Friend / Referral</option>
          <option value="other">Other</option>
        </select>
        <span class="error-msg" id="err-source">Please select how you found us.</span>
      </div>

      <!-- Income -->
      <div class="field-group">
        <label for="income">What is your current monthly income from online business? <span class="required-star">*</span></label>
        <select id="income" name="income">
          <option value="" disabled selected>Select an option…</option>
          <option value="zero">$0 — just starting</option>
          <option value="1-500">$1–$500/mo</option>
          <option value="500-2k">$500–$2K/mo</option>
          <option value="2k-5k">$2K–$5K/mo</option>
          <option value="5k+">$5K+/mo</option>
        </select>
        <span class="error-msg" id="err-income">Please select your current income range.</span>
      </div>

      <!-- Goal -->
      <div class="field-group">
        <label for="goal">What's your #1 goal in the next 90 days? <span class="required-star">*</span></label>
        <input type="text" id="goal" name="goal" placeholder="Be specific — what does success look like for you?" />
        <span class="error-msg" id="err-goal">Please share your #1 goal.</span>
      </div>

      <!-- Commitment -->
      <div class="field-group">
        <label>Are you ready to invest in yourself to reach that goal? <span class="required-star">*</span></label>
        <div class="choices" id="commitChoices">
          <label class="choice-option">
            <input type="radio" name="commitment" value="yes" />
            Yes, definitely
          </label>
          <label class="choice-option">
            <input type="radio" name="commitment" value="learning" />
            I need to learn more first
          </label>
        </div>
        <span class="error-msg" id="err-commitment">Please select an option.</span>
      </div>

      <hr class="divider" />

      <button type="submit" class="btn-submit" id="submitBtn">
        Submit Application →
      </button>

      <p class="fine-print">
        By submitting, you agree to be contacted by the Affiliate Launchpad team.<br />
        Your information is kept private and never sold.
      </p>

    </form>
  </div>

  <script>
    // ── Progress bar tracking ──────────────────────────────────────────────
    const trackableFields = [
      'firstName', 'lastName', 'email', 'phone',
      'source', 'income', 'goal'
    ];
    const totalFields = trackableFields.length + 1; // +1 for commitment radio

    function updateProgress() {
      let filled = 0;
      trackableFields.forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value.trim() !== '') filled++;
      });
      if (document.querySelector('input[name="commitment"]:checked')) filled++;
      const pct = Math.round((filled / totalFields) * 100);
      document.getElementById('progressFill').style.width = pct + '%';
    }

    document.getElementById('applicationForm').addEventListener('input', updateProgress);
    document.getElementById('applicationForm').addEventListener('change', updateProgress);

    // ── Validation ──────────────────────────────────────────────────────────
    function showError(fieldId, show) {
      const field = document.getElementById(fieldId);
      const err   = document.getElementById('err-' + fieldId);
      if (!field || !err) return;
      if (show) {
        field.classList.add('error');
        err.classList.add('visible');
      } else {
        field.classList.remove('error');
        err.classList.remove('visible');
      }
    }

    function validateForm() {
      let valid = true;

      // Text / email / tel fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'source', 'income', 'goal'];
      requiredFields.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const empty = el.value.trim() === '';
        const invalidEmail = (id === 'email') && el.value.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        if (empty || invalidEmail) {
          showError(id, true);
          valid = false;
        } else {
          showError(id, false);
        }
      });

      // Radio — commitment
      const committed = document.querySelector('input[name="commitment"]:checked');
      const commitErr = document.getElementById('err-commitment');
      if (!committed) {
        commitErr.classList.add('visible');
        valid = false;
      } else {
        commitErr.classList.remove('visible');
      }

      return valid;
    }

    // Clear errors on input
    ['firstName', 'lastName', 'email', 'phone', 'source', 'income', 'goal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => showError(id, false));
        el.addEventListener('change', () => showError(id, false));
      }
    });

    document.querySelectorAll('input[name="commitment"]').forEach(radio => {
      radio.addEventListener('change', () => {
        document.getElementById('err-commitment').classList.remove('visible');
      });
    });

    // ── Submit ──────────────────────────────────────────────────────────────
    document.getElementById('applicationForm').addEventListener('submit', function(e) {
      e.preventDefault();

      if (!validateForm()) {
        // Scroll to first error
        const firstErr = document.querySelector('.error-msg.visible');
        if (firstErr) {
          firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Disable button and show loading state
      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      btn.textContent = 'Submitting…';

      // Collect form data (for optional webhook / API call)
      const formData = {
        firstName:  document.getElementById('firstName').value.trim(),
        lastName:   document.getElementById('lastName').value.trim(),
        email:      document.getElementById('email').value.trim(),
        phone:      document.getElementById('phone').value.trim(),
        source:     document.getElementById('source').value,
        income:     document.getElementById('income').value,
        goal:       document.getElementById('goal').value.trim(),
        commitment: document.querySelector('input[name="commitment"]:checked').value,
        submittedAt: new Date().toISOString()
      };

      console.log('Affiliate Launchpad Application:', formData);
      // ↑ Replace this with a fetch() call to your webhook / CRM if needed.

      // Show success state, then redirect
      document.getElementById('applicationForm').style.display = 'none';
      document.getElementById('progressWrapper').style.display = 'none';
      document.getElementById('successOverlay').classList.add('visible');
      document.getElementById('progressFill').style.width = '100%';

      // Redirect after short delay so the user sees the confirmation
      setTimeout(function() {
        window.location.href = CALENDLY_URL;
      }, 2200);
    });
  </script>
</body>
</html>
```

---

## Integration Checklist

Before going live, verify all of the following:

- [ ] All 8 fields are added in the correct order in YouForm
- [ ] All required fields are marked required
- [ ] Dropdown options match exactly (copy-paste from the table above)
- [ ] `CALENDLY_URL` is replaced with your live Calendly link in both the YouForm redirect setting and the standalone HTML file
- [ ] Custom CSS is pasted into YouForm's CSS field and previewed on mobile
- [ ] Progress bar is enabled in YouForm settings
- [ ] Submit button label reads "Submit Application →"
- [ ] Test submission end-to-end: fill form → submit → confirm redirect lands on Calendly booking page
- [ ] Verify form data appears in YouForm responses dashboard
- [ ] If using the standalone HTML page: deploy to your host and test on mobile Safari and Chrome

---

*End of YouForm Form Spec — Affiliate Launchpad*
