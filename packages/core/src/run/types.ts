import type { z } from 'zod';
import type { RunManifestSchema } from './schema.js';
export type RunManifest = z.infer<typeof RunManifestSchema>;
