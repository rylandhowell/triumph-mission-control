"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

const allowed = new Set(["ryland", "johnhowell"]);

export function ForemanChatClient() {
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const profile = (typeof window !== "undefined" ? localStorage.getItem("mission-active-profile") : "") || "ryland";

    setMsgs((m) => [...m, { role: "user", text }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/foreman-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, profile }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "assistant", text: data.reply || data.error || "No reply" }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "Chat bridge error. Try again." }]);
    } finally {
      setBusy(false);
    }
  };

  const profile = (typeof window !== "undefined" ? localStorage.getItem("mission-active-profile") : "") || "ryland";
  const blocked = !allowed.has(profile.toLowerCase());

  return (
    <section className="mission-panel p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Foreman Chat</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Chat with Foreman</h2>
      <p className="mt-2 text-sm text-zinc-400">Access allowed: Ryland, JohnHowell. RyanBarnhill is blocked.</p>

      {blocked ? (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
          Access denied for current profile.
        </div>
      ) : (
        <>
          <div className="mt-4 h-[420px] overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 space-y-3">
            {msgs.length === 0 ? <p className="text-sm text-zinc-500">Start a conversation…</p> : null}
            {msgs.map((m, i) => (
              <div key={i} className={`rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-cyan-500/20 text-cyan-100" : "bg-white/10 text-zinc-100"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
              placeholder="Type a message…"
              className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2"
            />
            <button onClick={() => void send()} disabled={busy} className="rounded-xl bg-emerald-600 px-4 py-2 text-white disabled:opacity-50">
              {busy ? "Sending…" : "Send"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
