"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EditableJob } from "@/components/editable-job";
import { Checklist } from "@/components/checklist";
import { PhotoGallery } from "@/components/photo-gallery";
import { getJobBySlug, buildChecklist } from "@/lib/mission-data";
import { sendTelegram } from "@/lib/telegram";

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const job = getJobBySlug(id);

  if (!job) {
    notFound();
  }

  const storageKey = `task-done-${job.id}`;
  const [doneTaskIds, setDoneTaskIds] = useState<Set<string>>(new Set(job.tasks.filter((t) => t.status === "Done").map((t) => t.id)));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        setDoneTaskIds(new Set(parsed));
      } catch {
        // ignore
      }
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(doneTaskIds)));
  }, [doneTaskIds, loaded, storageKey]);

  const taskStatus = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of job.tasks) {
      map.set(t.id, doneTaskIds.has(t.id) ? "Done" : t.status);
    }
    return map;
  }, [doneTaskIds, job.tasks]);

  const toggleTaskDone = (taskId: string) => {
    const task = job.tasks.find((t) => t.id === taskId);
    if (!task) return;

    setDoneTaskIds((prev) => {
      const next = new Set(prev);
      const wasDone = next.has(taskId);

      if (wasDone) {
        next.delete(taskId);
      } else {
        next.add(taskId);
        const assignedBy = task.assignedBy ?? "Ryland";
        void sendTelegram(
          `✅ <b>Task Completed</b>\n\n<b>${job.name}</b>\nTask: ${task.title}\nAssigned to: ${task.owner}\nAssigned by: ${assignedBy}`
        );
      }

      return next;
    });
  };

  return (
    <AppShell currentPath="/">
      <section className="mission-panel p-5 sm:p-6">
        <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">
          ← Back to overview
        </Link>
        <div className="mt-4">
          <EditableJob job={job} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="mission-panel p-5 sm:p-6">
            <PhotoGallery jobId={job.id} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="mission-panel p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Tasks</p>
            <h3 className="mt-1 text-xl font-semibold">Current work</h3>
            <div className="mt-5 space-y-3">
              {job.tasks.map((task) => {
                const isDone = doneTaskIds.has(task.id);
                return (
                  <div key={task.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleTaskDone(task.id)}
                          className="mt-1 h-4 w-4 cursor-pointer accent-emerald-500"
                          aria-label={`Mark ${task.title} complete`}
                        />
                        <div>
                          <p className={`font-medium ${isDone ? "text-zinc-500 line-through" : "text-white"}`}>{task.title}</p>
                          <p className="mt-1 text-sm text-zinc-400">Assigned to: {task.owner}</p>
                          <p className="mt-1 text-xs text-zinc-500">Assigned by: {task.assignedBy ?? "Ryland"}</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
                        {taskStatus.get(task.id)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-zinc-500">Due: {task.due}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mission-panel p-5 sm:p-6">
            <Checklist items={buildChecklist} jobId={job.id} jobName={job.name} />
          </div>
        </div>
      </section>
    </AppShell>
  );
}
