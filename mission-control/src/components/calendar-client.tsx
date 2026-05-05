"use client";

import { useEffect, useMemo, useState } from "react";
import type { Job, ScheduleItem } from "@/lib/mission-data";

type CalendarEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  jobId: string;
};

const dayNameToIndex: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function getJobForItem(item: ScheduleItem, jobs: Job[]) {
  const house = item.house.toLowerCase();
  return jobs.find((job) => house.includes(job.name.split(" ")[0].toLowerCase()) || house.includes(job.slug.split("-")[0])) ?? null;
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const CUSTOM_EVENTS_KEY = "mission-calendar-custom-events";
const HIDDEN_EVENTS_KEY = "mission-calendar-hidden-events";

export function CalendarClient({ jobs, schedule }: { jobs: Job[]; schedule: ScheduleItem[] }) {
  const now = new Date();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(ymd(now));
  const [form, setForm] = useState({ title: "", time: "08:00", jobId: "all" });

  const monthLabel = month.toLocaleString("en-US", { month: "long", year: "numeric" });

  const baseEvents = useMemo(() => {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    return schedule.map((item) => {
      const targetDow = dayNameToIndex[item.day] ?? 1;
      const firstDow = monthStart.getDay();
      const offset = (targetDow - firstDow + 7) % 7;
      const date = new Date(monthStart);
      date.setDate(1 + offset);

      const job = getJobForItem(item, jobs);
      return {
        id: item.id,
        date: ymd(date),
        time: item.time,
        title: item.title,
        jobId: job?.id ?? "all",
      } as CalendarEvent;
    });
  }, [jobs, month, schedule]);

  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>([]);
  const [hiddenEventIds, setHiddenEventIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const customRaw = localStorage.getItem(CUSTOM_EVENTS_KEY);
      if (customRaw) {
        const parsed = JSON.parse(customRaw);
        if (Array.isArray(parsed)) setCustomEvents(parsed);
      }
      const hiddenRaw = localStorage.getItem(HIDDEN_EVENTS_KEY);
      if (hiddenRaw) {
        const parsed = JSON.parse(hiddenRaw);
        if (Array.isArray(parsed)) setHiddenEventIds(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CUSTOM_EVENTS_KEY, JSON.stringify(customEvents));
  }, [customEvents]);

  useEffect(() => {
    localStorage.setItem(HIDDEN_EVENTS_KEY, JSON.stringify(hiddenEventIds));
  }, [hiddenEventIds]);

  const events = useMemo(
    () => [...baseEvents, ...customEvents].filter((e) => !hiddenEventIds.includes(e.id)),
    [baseEvents, customEvents, hiddenEventIds],
  );

  const calendarDays = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const days: Date[] = [];

    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());

    const gridEnd = new Date(end);
    gridEnd.setDate(end.getDate() + (6 - end.getDay()));

    for (const d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }
    return days;
  }, [month]);

  const selectedEvents = events
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const addEvent = () => {
    if (!form.title.trim()) return;
    setCustomEvents((prev) => [
      ...prev,
      { id: `evt-${Date.now()}`, date: selectedDate, time: form.time, title: form.title.trim(), jobId: form.jobId },
    ]);
    setForm((p) => ({ ...p, title: "" }));
  };

  const deleteEvent = (id: string) => {
    setCustomEvents((prev) => prev.filter((e) => e.id !== id));
    setHiddenEventIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <div className="space-y-6">
      <section className="mission-panel p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-400">Monthly scheduling view</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Calendar</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300">←</button>
            <span className="min-w-44 text-center text-sm text-zinc-200">{monthLabel}</span>
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300">→</button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="mission-panel p-5 sm:p-6">
          <div className="grid grid-cols-7 gap-2 text-xs text-zinc-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="px-2 py-1">{d}</div>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((d) => {
              const dateKey = ymd(d);
              const dayEvents = events.filter((e) => e.date === dateKey);
              const inMonth = d.getMonth() === month.getMonth();
              const active = dateKey === selectedDate;
              return (
                <button key={dateKey} onClick={() => setSelectedDate(dateKey)} className={`min-h-28 rounded-xl border p-2 text-left ${active ? "border-emerald-500/50 bg-emerald-500/10" : "border-white/10 bg-black/20"} ${inMonth ? "text-zinc-100" : "text-zinc-600"}`}>
                  <p className="text-xs">{d.getDate()}</p>
                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, 3).map((e) => {
                      const job = jobs.find((j) => j.id === e.jobId);
                      return <div key={e.id} className={`truncate rounded px-1 py-0.5 text-[11px] ${job?.color ? `${job.color} text-black` : "bg-zinc-700 text-zinc-100"}`}>{e.time} {e.title}</div>;
                    })}
                    {dayEvents.length > 3 ? <div className="text-[11px] text-zinc-500">+{dayEvents.length - 3} more</div> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <section className="mission-panel p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Schedule for {selectedDate}</h3>
            <div className="mt-4 space-y-2">
              {selectedEvents.length ? selectedEvents.map((e) => (
                <div key={e.id} className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-zinc-100">{e.time} · {e.title}</p>
                    <button
                      type="button"
                      onClick={() => deleteEvent(e.id)}
                      className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )) : <p className="text-sm text-zinc-500">No events yet.</p>}
            </div>
          </section>

          <section className="mission-panel p-5 sm:p-6">
            <h3 className="text-xl font-semibold">Add schedule item</h3>
            <div className="mt-4 space-y-3">
              <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Task / meeting" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" />
              <input type="time" value={form.time} onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" />
              <select value={form.jobId} onChange={(e) => setForm((p) => ({ ...p, jobId: e.target.value }))} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm">
                <option value="all">General / All jobs</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.name}</option>)}
              </select>
              <button onClick={addEvent} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500">Add to {selectedDate}</button>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
