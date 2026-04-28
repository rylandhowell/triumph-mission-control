"use client";

import { useMemo, useState } from "react";
import type { Job, ScheduleItem } from "@/lib/mission-data";

const days = ["Mon", "Tue", "Wed"];

function jobMatchesSchedule(item: ScheduleItem, job: Job) {
  const house = item.house.toLowerCase();
  return house === "all houses" || house.includes(job.name.split(" ")[0].toLowerCase()) || house.includes(job.slug.split("-")[0]);
}

export function CalendarClient({ jobs, schedule }: { jobs: Job[]; schedule: ScheduleItem[] }) {
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const selectedJob = selectedJobId === "all" ? null : jobs.find((job) => job.id === selectedJobId) ?? null;

  const filteredSchedule = useMemo(() => {
    return selectedJob ? schedule.filter((item) => jobMatchesSchedule(item, selectedJob)) : schedule;
  }, [schedule, selectedJob]);

  const upcoming = filteredSchedule.slice(0, 3);

  return (
    <>
      <section className="mission-panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-zinc-400">Master calendar with per-house filtering and color-coded event types.</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Calendar</h2>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <button
              onClick={() => setSelectedJobId("all")}
              className={`rounded-2xl px-4 py-2 ${selectedJobId === "all" ? "bg-white text-zinc-950" : "border border-white/10 bg-white/5 text-zinc-300"}`}
            >
              All Houses
            </button>
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className={`rounded-2xl px-4 py-2 ${selectedJobId === job.id ? "bg-white text-zinc-950" : "border border-white/10 bg-white/5 text-zinc-300"}`}
              >
                {job.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="mission-panel p-5 sm:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {days.map((day) => {
              const dayItems = filteredSchedule.filter((item) => item.day === day);
              return (
                <div key={day} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium">{day}</h3>
                    <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">{dayItems.length} items</span>
                  </div>

                  <div className="space-y-3">
                    {dayItems.length ? dayItems.map((item) => (
                      <div key={item.id} className={`rounded-2xl border p-4 ${item.tone}`}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span>{item.house}</span>
                          <span>{item.time}</span>
                        </div>
                        <p className="mt-2 font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-current/80">{item.type}</p>
                      </div>
                    )) : <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-zinc-500">No items for this day.</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <section className="mission-panel p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Upcoming</p>
            <h3 className="mt-1 text-xl font-semibold">Next critical moves</h3>
            <div className="mt-5 space-y-3 text-sm text-zinc-300">
              {upcoming.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span>{item.title}</span>
                    <span className="text-zinc-500">{item.day} · {item.time}</span>
                  </div>
                  <p className="mt-2 text-zinc-500">{item.house} · {item.type}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mission-panel p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Legend</p>
            <h3 className="mt-1 text-xl font-semibold">House legend</h3>
            <div className="mt-5 space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${job.color}`} />
                    <span className="text-sm text-zinc-200">{job.name}</span>
                  </div>
                  <span className="text-sm text-zinc-500">{job.stage}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
