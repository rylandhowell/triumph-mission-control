import type { AgentRun } from "./agent-config";

export async function getActiveAgentRuns(): Promise<AgentRun[]> {
  // In a real app, this would fetch from a database
  return [
    {
      id: "agent-1",
      name: "Coder",
      color: "bg-blue-500",
      progress: 65,
      tokensUsed: 1420,
      updatedAt: Date.now(),
      status: "running"
    },
    {
      id: "agent-2",
      name: "Designer",
      color: "bg-purple-500",
      progress: 40,
      tokensUsed: 890,
      updatedAt: Date.now() - 3600000,
      status: "running"
    },
    {
      id: "agent-3",
      name: "Organizer",
      color: "bg-green-500",
      progress: 30,
      tokensUsed: 670,
      updatedAt: Date.now() - 7200000,
      status: "running"
    },
  ];
}
