"use client";

import { useState, useEffect, useRef } from "react";
import { ChecklistItem } from "@/lib/mission-data";
import { sendTelegram, msgChecklist, checkMilestone, msgMilestone } from "@/lib/telegram";

interface ChecklistProps {
  items: ChecklistItem[];
  jobId: string;
  jobName: string;
}

export function Checklist({ items, jobId, jobName }: ChecklistProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const prevCount = useRef<number>(0);
  const canSave = useRef(false);
  const skipFirstSave = useRef(true);

  // Load checklist state (local first, then server)
  useEffect(() => {
    let active = true;
    const localKey = `checklist-${jobId}`;

    const localRaw = localStorage.getItem(localKey);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        const localSet = new Set<string>(Array.isArray(parsed) ? parsed : []);
        setCheckedItems(localSet);
        prevCount.current = localSet.size;
      } catch {
        // ignore
      }
    }

    const load = async () => {
      try {
        const res = await fetch(`/api/checklist-state?jobId=${encodeURIComponent(jobId)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const parsed = Array.isArray(data?.checked) ? data.checked : [];
        const set = new Set<string>(parsed);
        if (active) {
          setCheckedItems(set);
          prevCount.current = set.size;
          localStorage.setItem(localKey, JSON.stringify(Array.from(set)));
        }
      } catch {
        // ignore
      } finally {
        if (active) {
          canSave.current = true;
          setIsLoaded(true);
        }
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [jobId]);

  // Save shared checklist state
  useEffect(() => {
    if (!isLoaded || !canSave.current) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }

    const checked = Array.from(checkedItems);
    localStorage.setItem(`checklist-${jobId}`, JSON.stringify(checked));

    const save = async () => {
      try {
        await fetch("/api/checklist-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId, checked }),
        });
      } catch {
        // ignore
      }
    };

    void save();
  }, [checkedItems, jobId, isLoaded]);

  const categoryOrder = [
    "Pre-construction", "Foundation", "Framing", "Roofing", "Exterior",
    "Rough-in", "Insulation", "Interior", "Electrical", "Plumbing",
    "Mechanical", "Site", "Inspections", "Finish",
  ];

  const sortedItems = [...items].sort((a, b) => {
    const aChecked = checkedItems.has(a.id);
    const bChecked = checkedItems.has(b.id);
    if (aChecked !== bChecked) return aChecked ? 1 : -1;

    const aCat = categoryOrder.indexOf(a.category);
    const bCat = categoryOrder.indexOf(b.category);
    if (aCat !== bCat) return aCat - bCat;

    return 0;
  });

  const toggleItem = (item: ChecklistItem) => {
    const next = new Set(checkedItems);
    const wasChecked = next.has(item.id);

    if (wasChecked) {
      next.delete(item.id);
    } else {
      next.add(item.id);
    }

    const prevPct = Math.round((prevCount.current / items.length) * 100);
    const nextPct = Math.round((next.size / items.length) * 100);

    // Send checklist update on check (not uncheck)
    if (!wasChecked) {
      sendTelegram(msgChecklist(jobName, item.text, next.size, items.length));

      // Check for milestone
      const milestone = checkMilestone(prevPct, nextPct);
      if (milestone) {
        sendTelegram(msgMilestone(jobName, milestone));
      }
    }

    prevCount.current = next.size;
    setCheckedItems(next);
  };

  if (!isLoaded) {
    return <div className="p-5 text-zinc-500">Loading checklist...</div>;
  }

  const completedCount = checkedItems.size;
  const totalCount = items.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Build Checklist</h3>
          <p className="mt-1 text-sm text-zinc-400">
            {completedCount} of {totalCount} items completed
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-emerald-400">{progress}%</span>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-white/10 bg-black/20">
        <div className="divide-y divide-white/5">
          {sortedItems.map((item) => {
            const isChecked = checkedItems.has(item.id);
            return (
              <label
                key={item.id}
                className="flex cursor-pointer items-start gap-3 px-4 py-2.5 transition hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleItem(item)}
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-emerald-500"
                />
                <div>
                  <p className={`select-none text-sm ${isChecked ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
                    {item.text}
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-zinc-500">{item.category}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
