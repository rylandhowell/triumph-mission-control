"use client";

import { useState, useEffect } from "react";
import { Job } from "@/lib/mission-data";

interface EditableJobProps {
  job: Job;
}

type EditableJobData = {
  name: string;
  location: string;
  client: string;
  stage: string;
  progress: number;
  status: string;
  next: string;
  budget: string;
};

export function EditableJob({ job }: EditableJobProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<EditableJobData>({
    name: job.name,
    location: job.location,
    client: job.client,
    stage: job.stage,
    progress: job.progress,
    status: job.status,
    next: job.next,
    budget: job.budget,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved edits from localStorage
  useEffect(() => {
    const storageKey = `job-${job.id}-data`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData((prev) => ({ ...prev, ...parsed }));
      } catch {
        // ignore parse errors
      }
    }
    setIsLoaded(true);
  }, [job.id]);

  // Save to localStorage when data changes
  useEffect(() => {
    if (!isLoaded) return;
    const storageKey = `job-${job.id}-data`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, job.id, isLoaded]);

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleChange = (field: keyof EditableJobData, value: string | number) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  if (!isLoaded) {
    return <div className="p-5 text-zinc-500">Loading...</div>;
  }

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Job Details</h3>
          <button
            onClick={handleSave}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            Save Changes
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-zinc-500">Job Name</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500">Client</label>
            <input
              type="text"
              value={data.client}
              onChange={(e) => handleChange("client", e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500">Location</label>
            <input
              type="text"
              value={data.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500">Stage</label>
            <input
              type="text"
              value={data.stage}
              onChange={(e) => handleChange("stage", e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500">Status</label>
            <input
              type="text"
              value={data.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500">Budget</label>
            <input
              type="text"
              value={data.budget}
              onChange={(e) => handleChange("budget", e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-500">Progress (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={data.progress}
              onChange={(e) => handleChange("progress", parseInt(e.target.value) || 0)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-zinc-500">Next Milestone</label>
            <input
              type="text"
              value={data.next}
              onChange={(e) => handleChange("next", e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-semibold tracking-tight">{data.name}</h2>
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            {data.location} · {data.client} · {data.stage}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-zinc-400">
            {data.status}
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-300 transition hover:bg-white/10"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-zinc-500">Budget</p>
          <p className="mt-1 text-xl font-semibold">{data.budget}</p>
        </div>
        <div>
          <p className="text-sm text-zinc-500">Progress</p>
          <p className="mt-1 text-xl font-semibold">{data.progress}%</p>
        </div>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${data.progress}%` }}
        />
      </div>

      <p className="text-sm text-zinc-400">Next milestone: {data.next}</p>
    </div>
  );
}
