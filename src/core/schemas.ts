import { z } from 'zod';

export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const TaskModeSchema = z.enum(['ask', 'plan', 'code', 'debug', 'review', 'autopilot']);
export type TaskMode = z.infer<typeof TaskModeSchema>;

export const TaskStatusSchema = z.enum(['pending', 'in_progress', 'blocked', 'completed', 'failed']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  goal: z.string(),
  workspace: z.string(),
  mode: TaskModeSchema.default('plan'),
  status: TaskStatusSchema.default('pending'),
  constraints: z.array(z.string()).default([]),
  successCriteria: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

export const PolicyDecisionSchema = z.object({
  decision: z.enum(['allow', 'ask', 'deny']),
  reason: z.string(),
  risk: RiskLevelSchema,
  ruleId: z.string().optional(),
});
export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;

export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  input: z.unknown(),
  risk: RiskLevelSchema,
});
export type ToolCall = z.infer<typeof ToolCallSchema>;

export const ToolResultSchema = z.object({
  ok: z.boolean(),
  summary: z.string(),
  data: z.unknown().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional(),
  exitCode: z.number().optional(),
  changedFiles: z.array(z.string()).default([]),
  durationMs: z.number(),
});
export type ToolResult = z.infer<typeof ToolResultSchema>;

export const ChangeSetSchema = z.object({
  id: z.string(),
  reason: z.string(),
  files: z.array(z.string()),
  diff: z.string(),
  createdAt: z.string(),
  reversible: z.boolean().default(true),
});
export type ChangeSet = z.infer<typeof ChangeSetSchema>;

export const EventSchema = z.object({
  id: z.string(),
  taskId: z.string().optional(),
  timestamp: z.string(),
  type: z.enum([
    'task.created',
    'task.updated',
    'model.requested',
    'model.responded',
    'tool.proposed',
    'policy.decided',
    'tool.started',
    'tool.finished',
    'file.changed',
    'verification.finished',
    'summary.created',
  ]),
  actor: z.string().default('system'),
  data: z.unknown().optional(),
});
export type HarnessEvent = z.infer<typeof EventSchema>;

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}
