"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EditableJob } from "@/components/editable-job";
import { Checklist } from "@/components/checklist";
import { PhotoGallery } from "@/components/photo-gallery";
import { JobSubsPicker } from "@/components/job-subs-picker";
import { CurrentTasksEditor } from "@/components/current-tasks-editor";
import { CustomerContactCard } from "@/components/customer-contact";
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm text-zinc-500 transition hover:text-zinc-300">
            ← Back to overview
          </Link>
          <Link
            href="/calendar"
            className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-500/20"
          >
            Open all-jobs calendar
          </Link>
        </div>
        <div className="mt-4">
          <EditableJob job={job} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="mission-panel p-5 sm:p-6">
          <PhotoGallery jobId={job.id} />
        </div>

        <div className="mission-panel p-5 sm:p-6">
          <CurrentTasksEditor jobId={job.id} initialTasks={job.tasks} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="mission-panel p-5 sm:p-6">
          <JobSubsPicker jobId={job.id} />
        </div>

        <div className="mission-panel p-5 sm:p-6">
          <Checklist items={buildChecklist} jobId={job.id} jobName={job.name} />
        </div>
      </section>

      <CustomerContactCard jobId={job.id} />
    </AppShell>
  );
}
