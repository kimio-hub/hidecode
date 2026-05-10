import type { z } from 'zod';
import type { TraceEventSchema, TraceEventTypeSchema } from './schema.js';
export type TraceEventType = z.infer<typeof TraceEventTypeSchema>;
export type TraceEvent = z.infer<typeof TraceEventSchema>;
