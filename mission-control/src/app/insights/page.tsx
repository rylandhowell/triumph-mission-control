import { AppShell } from "@/components/app-shell";
import { LeadsInsightsClient } from "@/components/leads-insights-client";

export default function InsightsPage() {
  return (
    <AppShell currentPath="/insights">
      <LeadsInsightsClient />
    </AppShell>
  );
}
