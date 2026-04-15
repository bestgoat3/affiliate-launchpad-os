'use strict';

const nodemailer = require('nodemailer');

// ─── Transporter (lazy init) ─────────────────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const {
    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('SMTP not configured — email notifications disabled');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587', 10),
    secure: parseInt(SMTP_PORT || '587', 10) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

/**
 * Send a generic email notification.
 * Silently fails if SMTP is not configured.
 */
async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();
  if (!transport) return;

  const from = `Affiliate Launchpad OS <${process.env.SMTP_USER}>`;
  const toAddress = to || process.env.NOTIFY_EMAIL;

  try {
    const info = await transport.sendMail({ from, to: toAddress, subject, html, text });
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

/**
 * Notify admin when a new lead arrives via webhook.
 */
async function notifyNewLead(lead) {
  const subject = `New Lead: ${lead.first_name} ${lead.last_name}`;
  const html = `
    <h2>New Lead Captured</h2>
    <table>
      <tr><td><strong>Name:</strong></td><td>${lead.first_name} ${lead.last_name}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${lead.email || 'N/A'}</td></tr>
      <tr><td><strong>Phone:</strong></td><td>${lead.phone || 'N/A'}</td></tr>
      <tr><td><strong>Source:</strong></td><td>${lead.source || 'N/A'}</td></tr>
      <tr><td><strong>Monthly Revenue:</strong></td><td>${lead.monthly_revenue || 'N/A'}</td></tr>
      <tr><td><strong>Budget:</strong></td><td>${lead.budget || 'N/A'}</td></tr>
      <tr><td><strong>Investment Ready:</strong></td><td>${lead.investment_ready || 'N/A'}</td></tr>
    </table>
    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/leads/${lead.id}">View Lead</a></p>
  `;

  return sendEmail({
    to:      process.env.NOTIFY_EMAIL,
    subject,
    html,
    text: `New lead: ${lead.first_name} ${lead.last_name} | ${lead.email}`,
  });
}

/**
 * Notify team when a deal is closed.
 */
async function notifyClosedWon(lead, repName) {
  const subject = `CLOSED WON: ${lead.first_name} ${lead.last_name}`;
  const html = `
    <h2 style="color:#10b981;">Deal Closed!</h2>
    <table>
      <tr><td><strong>Client:</strong></td><td>${lead.first_name} ${lead.last_name}</td></tr>
      <tr><td><strong>Email:</strong></td><td>${lead.email || 'N/A'}</td></tr>
      <tr><td><strong>Rep:</strong></td><td>${repName || 'N/A'}</td></tr>
      <tr><td><strong>Closed At:</strong></td><td>${new Date().toLocaleString()}</td></tr>
    </table>
    <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/leads/${lead.id}">View Lead</a></p>
  `;

  return sendEmail({
    to:      process.env.NOTIFY_EMAIL,
    subject,
    html,
    text: `CLOSED WON: ${lead.first_name} ${lead.last_name} — Rep: ${repName}`,
  });
}

module.exports = { sendEmail, notifyNewLead, notifyClosedWon };
