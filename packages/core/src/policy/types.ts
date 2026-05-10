import type { z } from 'zod';
import type { PolicyDecisionSchema, PolicySchema } from './schema.js';
export type Policy = z.infer<typeof PolicySchema>;
export type PolicyDecision = z.infer<typeof PolicyDecisionSchema>;
