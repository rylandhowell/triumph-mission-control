import { AppShell } from "@/components/app-shell";
import { JobCostClient } from "@/components/job-cost-client";

export default function JobCostPage() {
  return (
    <AppShell currentPath="/job-cost">
      <JobCostClient />
    </AppShell>
  );
}
