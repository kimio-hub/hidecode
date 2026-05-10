import type { z } from 'zod';
import type { TaskModeSchema, TaskSchema } from './schema.js';
export type TaskMode = z.infer<typeof TaskModeSchema>;
export type Task = z.infer<typeof TaskSchema>;
