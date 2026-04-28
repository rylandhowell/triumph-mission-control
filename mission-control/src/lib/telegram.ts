// ── Client-side Telegram helpers ──

export async function sendTelegram(text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: "Network error" };
  }
}

// ── Message builders ──

export function msgNewHouse(name: string, location: string, client: string) {
  return [
    `🏠 <b>New Build Added</b>`,
    ``,
    `<b>${name}</b>`,
    `📍 ${location}`,
    `👤 ${client}`,
  ].join("\n");
}

export function msgChecklist(jobName: string, item: string, done: number, total: number) {
  const pct = Math.round((done / total) * 100);
  const filled = Math.round(pct / 10);
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);
  return [
    `✅ <b>${jobName}</b>`,
    ``,
    `Completed: ${item}`,
    `${bar} ${pct}% (${done}/${total})`,
  ].join("\n");
}

export function msgMilestone(jobName: string, pct: number) {
  const emoji = pct >= 100 ? "🎉" : pct >= 75 ? "🔥" : pct >= 50 ? "💪" : "📊";
  return `${emoji} <b>${jobName}</b> hit <b>${pct}%</b> complete!`;
}

export function msgProgress(jobName: string, pct: number, stage: string) {
  return [
    `📊 <b>${jobName} Update</b>`,
    ``,
    `Stage: ${stage}`,
    `Progress: ${pct}%`,
  ].join("\n");
}

// ── Milestone detection ──

const MILESTONES = [25, 50, 75, 100];

export function checkMilestone(prev: number, next: number): number | null {
  for (const m of MILESTONES) {
    if (prev < m && next >= m) return m;
  }
  return null;
}
