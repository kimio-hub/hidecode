import { z } from 'zod';

export const TaskModeSchema = z.enum(['ask', 'plan', 'patch', 'debug', 'review', 'autonomous']);

export const TaskSchema = z.object({
  taskId: z.string().min(1),
  goal: z.string().min(1),
  repo: z.string().min(1),
  mode: TaskModeSchema,
  constraints: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.string()).default([]),
  budget: z.object({
    maxSteps: z.number().int().positive().optional(),
    timeoutSeconds: z.number().int().positive().optional(),
    maxCostUsd: z.number().nonnegative().optional()
  }).optional(),
  policy: z.string().optional()
});
