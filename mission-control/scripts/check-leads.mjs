#!/usr/bin/env node
/**
 * Check for new lead submissions - called by OpenClaw cron
 * Returns JSON with new leads found
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';

const API_URL = 'https://triumphhomesinc.com/api/leads-submissions';
const STATE_FILE = '/Users/rylandsmacmini/.openclaw/workspace/mission-control/.lead-check-state.json';

async function fetchSubmissions() {
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data?.submissions) ? data.submissions : [];
  } catch (err) {
    console.error('Failed to fetch:', err.message);
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
  } catch {}
}

function formatLeadSummary(sub) {
  const date = new Date(sub.createdAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  return `• ${sub.name || 'Unknown'} - ${sub.email || 'no email'} - ${sub.buildLocation || 'no location'} (${date})`;
}

async function main() {
  const submissions = await fetchSubmissions();
  if (!submissions) {
    console.log(JSON.stringify({ newLeads: [], error: 'fetch_failed' }));
    process.exit(1);
  }

  const state = loadState();
  const currentIds = submissions.map(s => s.id);
  const newSubmissions = submissions.filter(s => !state.knownIds.includes(s.id));

  // Update state regardless
  saveState({
    lastCheck: new Date().toISOString(),
    knownIds: currentIds
  });

  if (newSubmissions.length === 0) {
    console.log(JSON.stringify({ newLeads: [], count: 0 }));
    process.exit(0);
  }

  const result = {
    newLeads: newSubmissions,
    count: newSubmissions.length,
    summary: newSubmissions.map(formatLeadSummary).join('\n')
  };

  console.log(JSON.stringify(result));
  process.exit(0);
}

main().catch(err => {
  console.log(JSON.stringify({ newLeads: [], error: err.message }));
  process.exit(1);
});
