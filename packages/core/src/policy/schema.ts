import { z } from 'zod';
export const PolicyDecisionSchema = z.object({ decision: z.enum(['allow', 'deny', 'ask']), reason: z.string(), matchedRule: z.string().optional() });
export const PolicySchema = z.object({
  id: z.string().min(1),
  allow: z.array(z.string()).default([]),
  deny: z.array(z.string()).default([]),
  ask: z.array(z.string()).default(['network', 'execute'])
});
