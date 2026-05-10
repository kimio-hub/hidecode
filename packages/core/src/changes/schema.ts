import { z } from 'zod';
export const ChangeSchema = z.object({ path: z.string(), beforeHash: z.string().optional(), afterHash: z.string().optional(), summary: z.string() });
export const ChangeSetSchema = z.object({ changeSetId: z.string(), taskId: z.string(), changes: z.array(ChangeSchema), rollbackHint: z.string().optional() });
