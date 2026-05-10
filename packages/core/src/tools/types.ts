import type { z } from 'zod';
import type { ToolRequestSchema, ToolResultSchema, ToolRiskSchema } from './schema.js';
export type ToolRisk = z.infer<typeof ToolRiskSchema>;
export type ToolRequest = z.infer<typeof ToolRequestSchema>;
export type ToolResult = z.infer<typeof ToolResultSchema>;
export interface TypedTool<I = unknown, O = unknown> { name: string; risks: ToolRisk[]; run(input: I): Promise<ToolResult & { output?: O }>; }
