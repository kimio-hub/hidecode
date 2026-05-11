import { z } from 'zod';
export const ToolRiskSchema = z.enum(['read', 'write', 'execute', 'network', 'git']);
export const ToolRequestSchema = z.object({ tool: z.string().min(1), input: z.record(z.unknown()), risks: z.array(ToolRiskSchema).default([]) });
export const ToolResultSchema = z.object({ ok: z.boolean(), output: z.unknown().optional(), error: z.string().optional(), evidence: z.array(z.string()).default([]), sandbox: z.record(z.unknown()).optional() });
