"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EditableJob } from "@/components/editable-job";
import { Checklist } from "@/components/checklist";
import { PhotoGallery } from "@/components/photo-gallery";
import { JobSubsPicker } from "@/components/job-subs-picker";
import { getJobBySlug, buildChecklist } from "@/lib/mission-data";

export default function JobDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const job = getJobBySlug(id);

  if (!job) {
    notFound();
  }


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
              {job.tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="mt-1 text-sm text-zinc-400">Owner: {task.owner}</p>
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-zinc-400">
                      {task.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-500">Due: {task.due}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 2xl:grid-cols-2">
            <div className="mission-panel p-5 sm:p-6">
              <JobSubsPicker jobId={job.id} />
            </div>

            <div className="mission-panel p-5 sm:p-6">
              <Checklist items={buildChecklist} jobId={job.id} jobName={job.name} />
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
