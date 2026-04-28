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

  // Load from localStorage on mount
  useEffect(() => {
    const storageKey = `checklist-${jobId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const set = new Set<string>(parsed);
        setCheckedItems(set);
        prevCount.current = set.size;
      } catch {
        // ignore
      }
    }
    setIsLoaded(true);
  }, [jobId]);

  // Save to localStorage + send Telegram on change
  useEffect(() => {
    if (!isLoaded) return;
    const storageKey = `checklist-${jobId}`;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(checkedItems)));
  }, [checkedItems, jobId, isLoaded]);

  const categoryOrder = [
    "Pre-construction", "Foundation", "Framing", "Roofing", "Exterior",
    "Rough-in", "Insulation", "Interior", "Electrical", "Plumbing",
    "Mechanical", "Site", "Inspections", "Finish",
  ];

  const grouped: [string, ChecklistItem[]][] = [];
  for (const cat of categoryOrder) {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length > 0) grouped.push([cat, catItems]);
  }

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
        {grouped.map(([category, catItems]) => {
          const catCompleted = catItems.filter((i) => checkedItems.has(i.id)).length;
          return (
            <div key={category} className="border-b border-white/10 last:border-b-0">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-zinc-900/90 px-4 py-2 backdrop-blur">
                <span className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  {category}
                </span>
                <span className="text-xs text-zinc-500">
                  {catCompleted}/{catItems.length}
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {catItems.map((item) => {
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
                      <span className={`select-none text-sm ${isChecked ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
                        {item.text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
