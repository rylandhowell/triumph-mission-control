"use client";

import { useEffect, useMemo, useState } from "react";

type SubRecord = {
  id: string;
  name: string;
  trade: string;
};

export function JobSubsPicker({ jobId }: { jobId: string }) {
  const [subs, setSubs] = useState<SubRecord[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const localKey = `job-subs-${jobId}`;

    const localRaw = localStorage.getItem(localKey);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        setSelected(new Set(Array.isArray(parsed) ? parsed : []));
      } catch {
        // ignore
      }
    }

    const load = async () => {
      try {
        const [subsRes, selectedRes] = await Promise.all([
          fetch("/api/subs-insurance", { cache: "no-store" }),
          fetch(`/api/job-subs?jobId=${encodeURIComponent(jobId)}`, { cache: "no-store" }),
        ]);

        const subsData = subsRes.ok ? await subsRes.json() : { rows: [] };
        const selectedData = selectedRes.ok ? await selectedRes.json() : { subIds: [] };

        if (!active) return;
        const next = new Set<string>(
          Array.isArray(selectedData.subIds) ? selectedData.subIds.filter((x: unknown): x is string => typeof x === "string") : []
        );
        setSubs(Array.isArray(subsData.rows) ? subsData.rows : []);
        setSelected(next);
        localStorage.setItem(localKey, JSON.stringify(Array.from(next)));
      } finally {
        if (active) setLoaded(true);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [jobId]);

  const selectedList = useMemo(
    () => subs.filter((s) => selected.has(s.id) && (s.name || s.trade)),
    [subs, selected]
  );

  const toggle = async (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);

    const subIds = Array.from(next);
    localStorage.setItem(`job-subs-${jobId}`, JSON.stringify(subIds));

    try {
      await fetch("/api/job-subs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, subIds }),
      });
    } catch {
      // ignore
    }
  };

  if (!loaded) return <p className="text-sm text-zinc-500">Loading sub assignments...</p>;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Planned subs</p>
        <h3 className="mt-1 text-xl font-semibold">Sub list for this job</h3>
      </div>

      {selectedList.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedList.map((sub) => (
            <span key={sub.id} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-100">
              {sub.name || "Unnamed sub"} {sub.trade ? `· ${sub.trade}` : ""}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">No subs selected yet.</p>
      )}

      <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3">
        {subs.length ? (
          subs.map((sub) => (
            <label key={sub.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-white/5">
              <div>
                <p className="text-sm text-zinc-100">{sub.name || "Unnamed sub"}</p>
                <p className="text-xs text-zinc-500">{sub.trade || "No trade set"}</p>
              </div>
              <input
                type="checkbox"
                checked={selected.has(sub.id)}
                onChange={() => void toggle(sub.id)}
                className="h-4 w-4 accent-emerald-500"
              />
            </label>
          ))
        ) : (
          <p className="text-sm text-zinc-500">No subs found. Add them in the Subs tab.</p>
        )}
      </div>
    </div>
  );
}
