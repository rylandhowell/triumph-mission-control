"use client";

import type { Job } from "@/lib/mission-data";

export function JobDashboard({ job }: { job: Job }) {
  return (
    <div className="space-y-6">
      <section className="mission-panel p-5 sm:p-6">
        <h2 className="text-2xl font-semibold">{job.name} Dashboard</h2>
        <p className="mt-2 text-zinc-400">{job.location} · {job.client}</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="mission-panel p-5 sm:p-6">
          <h3 className="text-lg font-medium">Tasks</h3>
          <div className="mt-4 space-y-3">
            {job.tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <input type="checkbox" className="h-5 w-5 rounded border-white/20" />
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-zinc-400">{task.owner} · Due: {task.due}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mission-panel p-5 sm:p-6">
          <h3 className="text-lg font-medium">Calendar</h3>
          <div className="mt-4 space-y-3">
            {/* Calendar events would go here */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-medium">Upcoming: {job.next}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
