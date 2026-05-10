import { z } from 'zod';

export const RunManifestSchema = z.object({
  runId: z.string().min(1),
  taskId: z.string().min(1),
  harnessVersion: z.string().min(1),
  model: z.object({ provider: z.string(), name: z.string() }),
  workspace: z.object({ repo: z.string(), checkpointId: z.string().optional() }),
  artifacts: z.object({ root: z.string(), trace: z.string(), report: z.string(), patch: z.string() }),
  summary: z.string().default('')
});
