import { AppShell } from "@/components/app-shell";
import { JobDashboard } from "@/components/job-dashboard";
import { getJobBySlug } from "@/lib/mission-data";
import { notFound } from 'next/navigation';

export default async function JobDashboardPage({
  params,
}: {
  params: { id: string };
}) {
  const job = getJobBySlug(params.id);

  if (!job) return notFound();

  return (
    <AppShell currentPath={`/jobs/${params.id}`}>
      <JobDashboard job={job} />
    </AppShell>
  );
}
