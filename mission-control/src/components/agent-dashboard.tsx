"use client";

import { AgentRun } from "@/lib/agent-config";
import { Progress } from "@/components/ui/progress";

type Props = {
  runs: AgentRun[];
};

export function AgentDashboard({ runs }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {runs.map((run) => (
          <div key={run.id} className="mission-panel p-5">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${run.color}`} />
              <h3 className="text-lg font-medium">{run.name}</h3>
              <span className="ml-auto rounded-full bg-white/5 px-2 py-1 text-xs">
                {run.tokensUsed} tokens
              </span>
            </div>
            
            <div className="mt-4 space-y-2">
              <Progress value={run.progress} className="h-2" />
              <p className="text-sm text-zinc-400">{run.name}</p>
              <p className="text-xs text-zinc-500">
                Updated: {new Date(run.updatedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
