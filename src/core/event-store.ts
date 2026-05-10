import { mkdir, readFile, appendFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { EventSchema, type HarnessEvent } from './schemas.js';

export class JsonlEventStore {
  constructor(public readonly filePath: string) {}

  async append(event: HarnessEvent): Promise<void> {
    const parsed = EventSchema.parse(event);
    await mkdir(dirname(this.filePath), { recursive: true });
    await appendFile(this.filePath, `${JSON.stringify(parsed)}\n`, 'utf8');
  }

  async readAll(): Promise<HarnessEvent[]> {
    try {
      const content = await readFile(this.filePath, 'utf8');
      return content
        .split('\n')
        .filter(Boolean)
        .map((line) => EventSchema.parse(JSON.parse(line)));
    } catch (error: any) {
      if (error?.code === 'ENOENT') return [];
      throw error;
    }
  }
}
