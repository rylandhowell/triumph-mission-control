"use client";

import { useEffect, useMemo, useState } from "react";

type Insights = { totals?: { formSubmits?: number } };

const STORAGE_KEY = "mc_last_form_submits";

export function LeadsSubmitNotifier() {
  const [newCount, setNewCount] = useState(0);

  const message = useMemo(() => {
    if (!newCount) return "";
    return newCount === 1
      ? "New lead form submitted."
      : `${newCount} new lead forms submitted.`;
  }, [newCount]);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const r = await fetch("/api/leads-insights", { cache: "no-store" });
        if (!r.ok) return;
        const data = (await r.json()) as Insights;
        const current = Number(data?.totals?.formSubmits || 0);

        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw == null) {
          localStorage.setItem(STORAGE_KEY, String(current));
          return;
        }

        const previous = Number(raw || 0);
        if (current > previous) {
          const diff = current - previous;
          localStorage.setItem(STORAGE_KEY, String(current));
          if (!mounted) return;
          setNewCount(diff);

          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification("Mission Control", { body: diff === 1 ? "New lead form submitted." : `${diff} new lead forms submitted.` });
            } else if (Notification.permission === "default") {
              Notification.requestPermission().then((perm) => {
                if (perm === "granted") {
                  new Notification("Mission Control", { body: diff === 1 ? "New lead form submitted." : `${diff} new lead forms submitted.` });
                }
              });
            }
          }
        } else if (current < previous) {
          localStorage.setItem(STORAGE_KEY, String(current));
        }
      } catch {}
    };

    check();
    const id = setInterval(check, 60000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  if (!newCount) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-emerald-300/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100 shadow-2xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <p>{message}</p>
        <button
          type="button"
          onClick={() => setNewCount(0)}
          className="rounded-md border border-emerald-200/40 px-2 py-0.5 text-xs hover:bg-emerald-400/20"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
