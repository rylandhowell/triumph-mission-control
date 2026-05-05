"use client";

import { useState, useEffect, useRef } from "react";
import { ChecklistItem } from "@/lib/mission-data";
import { sendTelegram, msgChecklist, checkMilestone, msgMilestone } from "@/lib/telegram";
import { recoveryChecklistByJob } from "@/lib/recovery-snapshot";

interface ChecklistProps {
  items: ChecklistItem[];
  jobId: string;
  jobName: string;
}

const categoryOrder = [
  "Pre-construction", "Foundation", "Framing", "Roofing", "Exterior",
  "Rough-in", "Insulation", "Interior", "Electrical", "Plumbing",
  "Mechanical", "Site", "Inspections", "Finish",
];

export function Checklist({ items, jobId, jobName }: ChecklistProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(items);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  const [newItem, setNewItem] = useState({ text: "", category: categoryOrder[0] });
  const prevCount = useRef<number>(0);
  const canSave = useRef(false);
  const skipFirstSave = useRef(true);
  const checkedRef = useRef<Set<string>>(new Set());
  const writeSeqRef = useRef(0);
  const ackSeqRef = useRef(0);

  const pushChecklist = async (checked: string[], seq: number) => {
    try {
      const res = await fetch("/api/checklist-state", {
        method: "POST",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, checked }),
      });
      if (res.ok) ackSeqRef.current = Math.max(ackSeqRef.current, seq);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let active = true;
    const checkedKey = `checklist-${jobId}`;
    const backupKey = `checklist-backup-${jobId}`;
    const itemsKey = `checklist-items-${jobId}`;
    let localSet = new Set<string>();

    const savedItems = localStorage.getItem(itemsKey);
    if (savedItems) {
      try {
        const parsed = JSON.parse(savedItems);
        if (Array.isArray(parsed) && parsed.length) {
          setChecklistItems(parsed);
        }
      } catch {
        // ignore
      }
    }

    const localRaw = localStorage.getItem(checkedKey);
    if (localRaw) {
      try {
        const parsed = JSON.parse(localRaw);
        localSet = new Set<string>(Array.isArray(parsed) ? parsed : []);
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
        const serverSet = new Set<string>(parsed);

        if (active) {
          const backupRaw = localStorage.getItem(backupKey);
          let backupSet = new Set<string>();
          if (backupRaw) {
            try {
              const b = JSON.parse(backupRaw);
              backupSet = new Set<string>(Array.isArray(b) ? b : []);
            } catch {
              // ignore
            }
          }

          const recoverySet = new Set<string>(recoveryChecklistByJob[jobId] || []);

          if (serverSet.size === 0 && localSet.size > 0) {
            setCheckedItems(localSet);
            prevCount.current = localSet.size;
            localStorage.setItem(checkedKey, JSON.stringify(Array.from(localSet)));
            localStorage.setItem(backupKey, JSON.stringify(Array.from(localSet)));
            void pushChecklist(Array.from(localSet), ++writeSeqRef.current);
          } else if (serverSet.size === 0 && backupSet.size > 0) {
            setCheckedItems(backupSet);
            prevCount.current = backupSet.size;
            localStorage.setItem(checkedKey, JSON.stringify(Array.from(backupSet)));
            void pushChecklist(Array.from(backupSet), ++writeSeqRef.current);
          } else if (serverSet.size === 0 && recoverySet.size > 0) {
            setCheckedItems(recoverySet);
            prevCount.current = recoverySet.size;
            localStorage.setItem(checkedKey, JSON.stringify(Array.from(recoverySet)));
            localStorage.setItem(backupKey, JSON.stringify(Array.from(recoverySet)));
          } else {
            setCheckedItems(serverSet);
            prevCount.current = serverSet.size;
            localStorage.setItem(checkedKey, JSON.stringify(Array.from(serverSet)));
            if (serverSet.size > 0) {
              localStorage.setItem(backupKey, JSON.stringify(Array.from(serverSet)));
            }
          }
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

  useEffect(() => {
    if (!isLoaded || !canSave.current) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }

    const checked = Array.from(checkedItems);
    const seq = ++writeSeqRef.current;
    localStorage.setItem(`checklist-${jobId}`, JSON.stringify(checked));
    if (checked.length > 0) {
      localStorage.setItem(`checklist-backup-${jobId}`, JSON.stringify(checked));
    }
    void pushChecklist(checked, seq);
  }, [checkedItems, isLoaded, jobId]);

  useEffect(() => {
    if (!isLoaded) return;
    const iv = setInterval(async () => {
      try {
        const res = await fetch(`/api/checklist-state?jobId=${encodeURIComponent(jobId)}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const server = new Set<string>(Array.isArray(data?.checked) ? data.checked : []);
        const local = new Set<string>(checkedRef.current);
        const same = server.size === local.size && Array.from(server).every((id) => local.has(id));
        const hasPending = ackSeqRef.current < writeSeqRef.current;
        if (!same && !hasPending) {
          if (server.size === 0 && local.size > 0) return;
          setCheckedItems(server);
          prevCount.current = server.size;
          localStorage.setItem(`checklist-${jobId}`, JSON.stringify(Array.from(server)));
          if (server.size > 0) {
            localStorage.setItem(`checklist-backup-${jobId}`, JSON.stringify(Array.from(server)));
          }
        }
      } catch {
        // ignore
      }
    }, 500);

    return () => clearInterval(iv);
  }, [jobId, isLoaded]);

  useEffect(() => {
    checkedRef.current = checkedItems;
  }, [checkedItems]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(`checklist-items-${jobId}`, JSON.stringify(checklistItems));

    const validIds = new Set(checklistItems.map((i) => i.id));
    const cleaned = new Set(Array.from(checkedItems).filter((id) => validIds.has(id)));
    if (cleaned.size !== checkedItems.size) setCheckedItems(cleaned);
  }, [checklistItems, jobId, isLoaded, checkedItems]);

  const toggleItem = (item: ChecklistItem) => {
    const next = new Set(checkedItems);
    const wasChecked = next.has(item.id);

    if (wasChecked) next.delete(item.id);
    else next.add(item.id);

    const prevPct = checklistItems.length ? Math.round((prevCount.current / checklistItems.length) * 100) : 0;
    const nextPct = checklistItems.length ? Math.round((next.size / checklistItems.length) * 100) : 0;

    if (!wasChecked) {
      sendTelegram(msgChecklist(jobName, item.text, next.size, checklistItems.length));
      const milestone = checkMilestone(prevPct, nextPct);
      if (milestone) sendTelegram(msgMilestone(jobName, milestone));
    }

    prevCount.current = next.size;
    setCheckedItems(next);
  };

  const moveItem = (index: number, dir: -1 | 1) => {
    const nextIndex = index + dir;
    if (nextIndex < 0 || nextIndex >= checklistItems.length) return;
    setChecklistItems((prev) => {
      const next = [...prev];
      const [picked] = next.splice(index, 1);
      next.splice(nextIndex, 0, picked);
      return next;
    });
  };

  const updateItem = (id: string, patch: Partial<ChecklistItem>) => {
    setChecklistItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    setChecklistItems((prev) => prev.filter((i) => i.id !== id));
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const addItem = () => {
    const text = newItem.text.trim();
    if (!text) return;
    setChecklistItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, category: newItem.category, completed: false },
    ]);
    setNewItem((p) => ({ ...p, text: "" }));
  };

  if (!isLoaded) return <div className="p-5 text-zinc-500">Loading checklist...</div>;

  const completedCount = checkedItems.size;
  const totalCount = checklistItems.length;
  const progress = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  const displayItems = [...checklistItems].sort((a, b) => {
    const aChecked = checkedItems.has(a.id);
    const bChecked = checkedItems.has(b.id);
    if (aChecked === bChecked) return 0;
    return aChecked ? 1 : -1;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Build Checklist</h3>
          <p className="mt-1 text-sm text-zinc-400">{completedCount} of {totalCount} items completed</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-emerald-400">{progress}%</span>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="grid gap-2 md:grid-cols-[1fr_200px_auto]">
        <input
          value={newItem.text}
          onChange={(e) => setNewItem((p) => ({ ...p, text: e.target.value }))}
          placeholder="Add checklist item"
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        />
        <select
          value={newItem.category}
          onChange={(e) => setNewItem((p) => ({ ...p, category: e.target.value }))}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
        >
          {categoryOrder.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={addItem} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Add</button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-white/10 bg-black/20">
        <div className="divide-y divide-white/5">
          {displayItems.map((item) => {
            const index = checklistItems.findIndex((x) => x.id === item.id);
            const isChecked = checkedItems.has(item.id);
            return (
              <div key={item.id} className="px-4 py-2.5">
                <div className="grid gap-2 md:grid-cols-[auto_1fr_180px_auto_auto_auto] md:items-center">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleItem(item)}
                    className="h-4 w-4 cursor-pointer accent-emerald-500"
                  />
                  <input
                    value={item.text}
                    onChange={(e) => updateItem(item.id, { text: e.target.value })}
                    className={`rounded border border-white/10 bg-black/30 px-2 py-1 text-sm ${isChecked ? "text-zinc-500 line-through" : "text-zinc-200"}`}
                  />
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(item.id, { category: e.target.value })}
                    className="rounded border border-white/10 bg-black/30 px-2 py-1 text-sm"
                  >
                    {categoryOrder.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => moveItem(index, -1)} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs">↑</button>
                  <button onClick={() => moveItem(index, 1)} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs">↓</button>
                  <button onClick={() => removeItem(item.id)} className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-200">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
