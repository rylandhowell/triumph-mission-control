"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Job } from "@/lib/mission-data";

type AssignedTask = {
  id: string;
  title: string;
  assignee: string;
  assignedBy: "Ryland" | "JohnHowell";
};

type PersonalChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

const ASSIGNED_TASKS_KEY = "mission-assigned-tasks";
const RYAN_CHECKLIST_KEY = "mission-ryan-personal-checklist";
const ALLOWED_ASSIGNERS: Array<AssignedTask["assignedBy"]> = ["Ryland", "JohnHowell"];

export function DashboardClient({
  jobs,
}: {
  jobs: Job[];
}) {
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("Ryland");
  const [newAssignedBy, setNewAssignedBy] = useState<"Ryland" | "JohnHowell">("Ryland");
  const [ryanJobId, setRyanJobId] = useState<string>(jobs[0]?.id ?? "");
  const [ryanNewItem, setRyanNewItem] = useState("");
  const [ryanChecklist, setRyanChecklist] = useState<Record<string, PersonalChecklistItem[]>>({});

  const selectedJob = selectedJobId === "all" ? null : jobs.find((job) => job.id === selectedJobId) ?? null;

  const filteredJobs = selectedJob ? [selectedJob] : jobs;

  const urgentTasks = useMemo(
    () => filteredJobs.flatMap((job) => job.tasks.map((task) => ({ ...task, job: job.name, slug: job.slug })))
      .filter((task) => task.status === "At risk" || task.due === "Today")
      .slice(0, 4),
    [filteredJobs],
  );

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ASSIGNED_TASKS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const safe = parsed.filter((t) => t && ALLOWED_ASSIGNERS.includes(t.assignedBy));
          setAssignedTasks(safe);
        }
      }

      const ryanRaw = localStorage.getItem(RYAN_CHECKLIST_KEY);
      if (ryanRaw) {
        const parsedRyan = JSON.parse(ryanRaw);
        if (parsedRyan && typeof parsedRyan === "object") {
          setRyanChecklist(parsedRyan as Record<string, PersonalChecklistItem[]>);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ASSIGNED_TASKS_KEY, JSON.stringify(assignedTasks));
  }, [assignedTasks]);

  useEffect(() => {
    localStorage.setItem(RYAN_CHECKLIST_KEY, JSON.stringify(ryanChecklist));
  }, [ryanChecklist]);

  const metrics = useMemo(() => {
    const allTasks = filteredJobs.flatMap((job) => job.tasks);
    return {
      activeJobs: filteredJobs.length,
      atRisk: allTasks.filter((task) => task.status === "At risk").length,
      dueToday: allTasks.filter((task) => task.due === "Today").length,
      avgProgress: filteredJobs.length
        ? Math.round(filteredJobs.reduce((sum, job) => sum + job.progress, 0) / filteredJobs.length)
        : 0,
    };
  }, [filteredJobs]);

  return (
    <>
      <section className="mission-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-zinc-400">Decision-first command view for houses, schedule, risks, and next moves.</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Build smarter. Miss less.</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              onClick={() => setSelectedJobId("all")}
              className={`rounded-2xl px-4 py-2 transition ${selectedJobId === "all" ? "bg-white text-zinc-950" : "border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10"}`}
            >
              All Houses
            </button>
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className={`rounded-2xl px-4 py-2 transition ${selectedJobId === job.id ? "bg-white text-zinc-950" : "border border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10"}`}
              >
                {job.name}
              </button>
            ))}
            <Link href="/calendar" className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-cyan-200">
              Open calendar
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Active jobs", value: metrics.activeJobs, detail: selectedJob ? selectedJob.name : "Master view" },
          { label: "Due today", value: metrics.dueToday, detail: "Fastest path to action" },
          { label: "At risk", value: metrics.atRisk, detail: "Needs attention now" },
          { label: "Avg progress", value: `${metrics.avgProgress}%`, detail: "Across selected work" },
        ].map((item) => (
          <div key={item.label} className="mission-panel p-5">
            <p className="text-sm text-zinc-400">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold">{item.value}</p>
            <p className="mt-2 text-sm text-zinc-500">{item.detail}</p>
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <div className="mission-panel p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Board</p>
              <h3 className="mt-1 text-xl font-semibold">Active jobs</h3>
            </div>
            <p className="text-sm text-zinc-500">Click any card to open house details.</p>
          </div>

          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <div className="mb-3 flex justify-end">
                  <Link href="/calendar" className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-100 hover:bg-cyan-500/20">
                    Calendar
                  </Link>
                </div>
                <Link
                  href={`/jobs/${job.slug}`}
                  className="block transition hover:-translate-y-0.5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${job.color}`} />
                        <h4 className="text-lg font-medium">{job.name}</h4>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-zinc-400">{job.location}</span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">{job.stage} · {job.status}</p>
                      <p className="mt-1 text-sm text-zinc-500">Next: {job.next}</p>
                    </div>

                    <div className="min-w-56 lg:text-right">
                      <div className="mb-2 flex items-center justify-between text-sm text-zinc-400 lg:justify-end lg:gap-3">
                        <span>Progress</span>
                        <span>{job.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${job.color}`} style={{ width: `${job.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="mission-panel p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Attention queue</p>
              <h3 className="mt-1 text-xl font-semibold">What needs action first</h3>
            </div>
          </div>
          <div className="space-y-3">
            {urgentTasks.map((task) => (
              <div key={task.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{task.title}</p>
                    <p className="mt-1 text-sm text-zinc-400">{task.job} · {task.owner}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-400">{task.status}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">Due: {task.due}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mission-panel p-5 sm:p-6">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Assigned Tasks</p>
            <h3 className="mt-1 text-xl font-semibold">Assignments</h3>
          </div>

          <div className="mb-4 grid gap-2 md:grid-cols-4">
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task"
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            />
            <select
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            >
              <option value="Ryland">Ryland</option>
              <option value="JohnHowell">JohnHowell</option>
              <option value="RyanBarnhill">RyanBarnhill</option>
            </select>
            <select
              value={newAssignedBy}
              onChange={(e) => setNewAssignedBy(e.target.value as "Ryland" | "JohnHowell")}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            >
              <option value="Ryland">Assigned by Ryland</option>
              <option value="JohnHowell">Assigned by JohnHowell</option>
            </select>
            <button
              type="button"
              onClick={() => {
                const title = newTaskTitle.trim();
                if (!title) return;
                if (!ALLOWED_ASSIGNERS.includes(newAssignedBy)) return;
                setAssignedTasks((prev) => [
                  {
                    id: crypto.randomUUID(),
                    title,
                    assignee: newAssignee,
                    assignedBy: newAssignedBy,
                  },
                  ...prev,
                ]);
                setNewTaskTitle("");
              }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Assign
            </button>
          </div>

          <div className="space-y-3">
            {assignedTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{task.title}</p>
                  <p className="text-sm text-zinc-400">Assigned to: {task.assignee}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignedTasks((prev) => prev.filter((x) => x.id !== task.id))}
                  className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mission-panel p-5 sm:p-6">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">RyanBarnhill</p>
            <h3 className="mt-1 text-xl font-semibold">Personal Checklist</h3>
          </div>

          <div className="mb-3 grid gap-2 md:grid-cols-[1fr_2fr_auto]">
            <select
              value={ryanJobId}
              onChange={(e) => setRyanJobId(e.target.value)}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            >
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.name}</option>
              ))}
            </select>
            <input
              value={ryanNewItem}
              onChange={(e) => setRyanNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                const text = ryanNewItem.trim();
                if (!text || !ryanJobId) return;
                setRyanChecklist((prev) => ({
                  ...prev,
                  [ryanJobId]: [{ id: crypto.randomUUID(), text, done: false }, ...(prev[ryanJobId] ?? [])],
                }));
                setRyanNewItem("");
              }}
              placeholder="Add checklist item..."
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                const text = ryanNewItem.trim();
                if (!text || !ryanJobId) return;
                setRyanChecklist((prev) => ({
                  ...prev,
                  [ryanJobId]: [{ id: crypto.randomUUID(), text, done: false }, ...(prev[ryanJobId] ?? [])],
                }));
                setRyanNewItem("");
              }}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Add
            </button>
          </div>

          <div className="space-y-2">
            {(ryanChecklist[ryanJobId] ?? []).map((item) => (
              <label key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={(e) => {
                      const done = e.target.checked;
                      setRyanChecklist((prev) => ({
                        ...prev,
                        [ryanJobId]: (prev[ryanJobId] ?? []).map((x) => (x.id === item.id ? { ...x, done } : x)),
                      }));
                    }}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  <span className={`text-sm ${item.done ? "text-zinc-500 line-through" : "text-zinc-200"}`}>{item.text}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRyanChecklist((prev) => ({
                      ...prev,
                      [ryanJobId]: (prev[ryanJobId] ?? []).filter((x) => x.id !== item.id),
                    }));
                  }}
                  className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
                >
                  Remove
                </button>
              </label>
            ))}
            {(ryanChecklist[ryanJobId] ?? []).length === 0 ? (
              <p className="text-sm text-zinc-500">No items yet for this house.</p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
