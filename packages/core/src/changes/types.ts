import type { z } from 'zod';
import type { ChangeSchema, ChangeSetSchema } from './schema.js';
export type Change = z.infer<typeof ChangeSchema>;
export type ChangeSet = z.infer<typeof ChangeSetSchema>;
