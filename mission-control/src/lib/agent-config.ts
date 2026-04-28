// Temporary stub for AgentRun
export type AgentRun = {
  id: string;
  name: string;
  color: string;
  tokensUsed: number;
  progress: number;
  status: 'running' | 'paused' | 'completed' | 'failed';
  updatedAt: string | number;
};