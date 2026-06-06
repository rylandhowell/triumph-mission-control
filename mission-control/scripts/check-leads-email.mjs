#!/usr/bin/env node
/**
 * Check for new lead submissions and email notifications
 * Run via cron every 5-10 minutes
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const API_URL = 'https://triumphhomesinc.com/api/leads-submissions';
const STATE_FILE = '/Users/rylandsmacmini/.openclaw/workspace/mission-control/.lead-check-state.json';
const TO_EMAIL = 'triumphhomes@yahoo.com';
const FROM_EMAIL = 'notifications@triumphhomesinc.com';

async function fetchSubmissions() {
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data?.submissions) ? data.submissions : [];
  } catch (err) {
    console.error('Failed to fetch submissions:', err.message);
    return null;
  }
}

function loadState() {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, 'utf8'));
    }
  } catch {}
  return { lastCheck: null, knownIds: [] };
}

function saveState(state) {
  try {
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('Failed to save state:', err.message);
  }
}

function formatSubmissionEmail(submission) {
  const date = new Date(submission.createdAt).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  return `To: ${TO_EMAIL}
From: ${FROM_EMAIL}
Subject: New Lead Inquiry - ${submission.name || 'Unknown'}
Content-Type: text/plain; charset=utf-8

NEW LEAD INQUIRY
================

Name: ${submission.name || 'Not provided'}
Phone: ${submission.phone || 'Not provided'}
Email: ${submission.email || 'Not provided'}
Build Location: ${submission.buildLocation || 'Not specified'}
Submitted: ${date}

DETAILS:
${submission.details || 'No details provided'}

---
View all leads: https://triumph-mission-control.vercel.app/insights
`;
}

function sendEmail(message) {
  try {
    // Use himalaya to send email
    const result = execSync('himalaya template send', {
      input: message,
      encoding: 'utf8',
      timeout: 30000
    });
    console.log('Email sent:', result);
    return true;
  } catch (err) {
    console.error('Failed to send email:', err.message);
    return false;
  }
}

async function main() {
  console.log(`[${new Date().toISOString()}] Checking for new leads...`);

  const submissions = await fetchSubmissions();
  if (!submissions) {
    console.log('Could not fetch submissions, will retry next run');
    process.exit(1);
  }

  const state = loadState();
  const currentIds = submissions.map(s => s.id);

  // Find new submissions (not in knownIds)
  const newSubmissions = submissions.filter(s => !state.knownIds.includes(s.id));

  if (newSubmissions.length === 0) {
    console.log('No new submissions');
    // Still update state in case old ones were deleted
    saveState({ lastCheck: new Date().toISOString(), knownIds: currentIds });
    process.exit(0);
  }

  console.log(`Found ${newSubmissions.length} new submission(s)`);

  // Send email for each new submission
  for (const sub of newSubmissions) {
    console.log(`Sending email for: ${sub.name} (${sub.email})`);
    const email = formatSubmissionEmail(sub);
    sendEmail(email);
    // Small delay between emails
    await new Promise(r => setTimeout(r, 1000));
  }

  // Update state with all current IDs
  saveState({
    lastCheck: new Date().toISOString(),
    knownIds: currentIds
  });

  console.log('Done');
  process.exit(0);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
