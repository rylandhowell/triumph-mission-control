"use client";

import { useEffect, useState } from "react";
import type { Task } from "@/lib/mission-data";

type EditableTask = Task;

const statuses: EditableTask["status"][] = ["Done", "In progress", "Queued", "At risk"];

export function CurrentTasksEditor({ jobId, initialTasks }: { jobId: string; initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<EditableTask[]>(initialTasks);
  const [draft, setDraft] = useState<EditableTask>({
    id: "",
    title: "",
    owner: "",
    due: "",
    status: "Queued",
  });

  const key = `job-${jobId}-current-tasks`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setTasks(parsed);
    } catch {
      // ignore
    }
  }, [key]);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(tasks));
  }, [key, tasks]);

  const setField = (id: string, field: keyof EditableTask, value: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const addTask = () => {
    if (!draft.title.trim()) return;
    setTasks((prev) => [
      {
        ...draft,
        id: crypto.randomUUID(),
        title: draft.title.trim(),
        owner: draft.owner.trim(),
        due: draft.due.trim(),
      },
      ...prev,
    ]);
    setDraft({ id: "", title: "", owner: "", due: "", status: "Queued" });
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Tasks</p>
      <h3 className="mt-1 text-xl font-semibold">Current work</h3>

      <div className="mt-4 grid gap-2 md:grid-cols-5">
        <input value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="Task" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" />
        <input value={draft.owner} onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))} placeholder="Owner" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" />
        <input value={draft.due} onChange={(e) => setDraft((d) => ({ ...d, due: e.target.value }))} placeholder="Due" className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" />
        <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as EditableTask["status"] }))} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" onClick={addTask} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Add</button>
      </div>

      <div className="mt-5 space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="grid gap-2 md:grid-cols-[2fr_1fr_1fr_1fr_auto]">
              <input value={task.title} onChange={(e) => setField(task.id, "title", e.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" />
              <input value={task.owner} onChange={(e) => setField(task.id, "owner", e.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" />
              <input value={task.due} onChange={(e) => setField(task.id, "due", e.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" />
              <select value={task.status} onChange={(e) => setField(task.id, "status", e.target.value)} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="button" onClick={() => setTasks((prev) => prev.filter((t) => t.id !== task.id))} className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">Delete</button>
            </div>
          </div>
        ))}
        {tasks.length === 0 ? <p className="text-sm text-zinc-500">No tasks yet.</p> : null}
      </div>
    </div>
  );
}
