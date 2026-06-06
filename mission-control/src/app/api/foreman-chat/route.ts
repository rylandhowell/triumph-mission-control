import { NextResponse } from "next/server";

const allowed = new Set(["ryland", "johnhowell"]);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = String(body?.text || "").trim();
    const profile = String(body?.profile || "").toLowerCase();

    if (!allowed.has(profile)) {
      return NextResponse.json({ error: "Access denied for this profile." }, { status: 403 });
    }
    if (!text) {
      return NextResponse.json({ error: "Message required." }, { status: 400 });
    }

    // Real bridge mode: proxy to a Mac-side bridge service if configured.
    const bridgeUrl = process.env.OPENCLAW_BRIDGE_URL;
    const bridgeToken = process.env.OPENCLAW_BRIDGE_TOKEN;

    if (bridgeUrl) {
      const res = await fetch(bridgeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(bridgeToken ? { Authorization: `Bearer ${bridgeToken}` } : {}),
        },
        body: JSON.stringify({ text, profile, source: "mission-control" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json({ error: data?.error || "Bridge error" }, { status: 502 });
      }
      return NextResponse.json({ ok: true, reply: data?.reply || "No reply." });
    }

    return NextResponse.json({
      ok: true,
      reply:
        "Bridge not connected yet. Set OPENCLAW_BRIDGE_URL (and optional OPENCLAW_BRIDGE_TOKEN) in project env to route this chat to the real OpenClaw runtime on your Mac.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
