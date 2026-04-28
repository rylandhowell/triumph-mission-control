import { AppShell } from "@/components/app-shell";
import { DashboardClient } from "@/components/dashboard-client";
import { henrySteps, jobs, schedule } from "@/lib/mission-data";

export default function Home() {
  return (
    <AppShell currentPath="/">
      <DashboardClient jobs={jobs} schedule={schedule} henrySteps={henrySteps} />
    </AppShell>
  );
}
