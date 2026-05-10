import type { Task, ToolRequest } from '@world-harness/core';

export type ModelStep = { kind: 'tool'; request: ToolRequest } | { kind: 'final'; summary: string };
export interface ModelAdapter { name: string; next(task: Task, observations: unknown[]): Promise<ModelStep>; }

export class ScriptedModelAdapter implements ModelAdapter {
  name = 'scripted-local';
  private index = 0;
  constructor(private readonly script: ModelStep[]) {}
  async next(): Promise<ModelStep> { return this.script[this.index++] ?? { kind: 'final', summary: 'No further scripted steps.' }; }
}
