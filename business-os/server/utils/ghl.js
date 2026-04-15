'use strict';

const fetch = require('node-fetch');

/**
 * GoHighLevel API helper
 * Docs: https://highlevel.stoplight.io/docs/integrations
 */

const GHL_BASE_URL = 'https://rest.gohighlevel.com/v1';

/**
 * Generic GHL API request
 */
async function ghlRequest(method, endpoint, body = null) {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) {
    throw new Error('GHL_API_KEY not configured');
  }

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Version: '2021-07-28',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const url = `${GHL_BASE_URL}${endpoint}`;
  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GHL API error ${response.status}: ${text}`);
  }

  return response.json();
}

/**
 * Fire outbound webhook to GHL when a lead is Closed Won.
 * POSTs to the GHL_WEBHOOK_URL configured in .env.
 */
async function fireClosedWonWebhook(lead, assignedRepName) {
  const webhookUrl = process.env.GHL_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn('GHL_WEBHOOK_URL not configured — skipping outbound webhook');
    return null;
  }

  const payload = {
    event:       'lead.closed_won',
    leadId:      String(lead.id),
    email:       lead.email || '',
    name:        `${lead.first_name} ${lead.last_name}`.trim(),
    phone:       lead.phone || '',
    closedAt:    new Date().toISOString(),
    assignedRep: assignedRepName || '',
  };

  try {
    const response = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const text = await response.text();
    console.log(`GHL outbound webhook fired: ${response.status} — ${text}`);
    return { status: response.status, body: text };
  } catch (err) {
    console.error('Failed to fire GHL outbound webhook:', err.message);
    return null;
  }
}

/**
 * Create or update a GHL contact
 */
async function upsertGHLContact(contactData) {
  return ghlRequest('POST', '/contacts/', contactData);
}

/**
 * Get a GHL contact by email
 */
async function getGHLContactByEmail(email) {
  return ghlRequest('GET', `/contacts/?email=${encodeURIComponent(email)}`);
}

/**
 * Add a tag to a GHL contact
 */
async function addGHLTag(contactId, tags) {
  return ghlRequest('POST', `/contacts/${contactId}/tags/`, { tags });
}

module.exports = {
  ghlRequest,
  fireClosedWonWebhook,
  upsertGHLContact,
  getGHLContactByEmail,
  addGHLTag,
};
