import { AgentDashboard } from "@/components/agent-dashboard";
import { AppShell } from "@/components/app-shell";
import { getActiveAgentRuns } from "@/lib/agent-runs";

export default async function AgentsPage() {
  const activeRuns = await getActiveAgentRuns();
  
  return (
    <AppShell currentPath="/agents">
      <AgentDashboard runs={activeRuns} />
    </AppShell>
  );
}
