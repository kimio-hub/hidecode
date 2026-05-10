import { z } from 'zod';

export const TraceEventTypeSchema = z.enum([
  'task.created', 'context.built', 'model.requested', 'model.completed', 'tool.requested',
  'policy.decided', 'approval.requested', 'approval.resolved', 'tool.started', 'tool.finished',
  'file.changed', 'verification.started', 'verification.finished', 'task.completed', 'task.failed'
]);

export const TraceEventSchema = z.object({
  eventId: z.string().min(1),
  runId: z.string().min(1),
  taskId: z.string().min(1),
  type: TraceEventTypeSchema,
  timestamp: z.string().datetime(),
  actor: z.string().default('runtime'),
  data: z.record(z.unknown()).default({})
});
