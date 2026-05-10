import type { Task, ToolRequest } from '@world-harness/core';

// ─── Model Step Protocol ───────────────────────────────────────
export type ModelStep =
  | { kind: 'tool'; request: ToolRequest; reasoning?: string }
  | { kind: 'final'; summary: string }
  | { kind: 'plan'; subtasks: string[] };

export interface ModelAdapter {
  name: string;
  next(task: Task, observations: Observation[]): Promise<ModelStep>;
  /** Optional: stream tokens. Default falls back to next(). */
  stream?(task: Task, observations: Observation[]): AsyncIterable<string>;
}

export interface Observation {
  stepIndex: number;
  toolName?: string;
  ok: boolean;
  output?: unknown;
  error?: string;
}

// ─── Scripted (deterministic, for testing) ─────────────────────
export class ScriptedModelAdapter implements ModelAdapter {
  name = 'scripted-local';
  private index = 0;
  constructor(private readonly script: ModelStep[]) {}
  async next(): Promise<ModelStep> {
    return this.script[this.index++] ?? { kind: 'final', summary: 'No further scripted steps.' };
  }
}

// ─── OpenAI-compatible (real LLM) ──────────────────────────────
export interface OpenAIAdapterConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  /** System prompt template. Default: ReAct-style. */
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  maxSteps?: number;
}

const DEFAULT_SYSTEM_PROMPT = `You are a coding agent. You have access to tools.
Respond in one of two formats:

1. To use a tool:
\`\`\`json
{"tool": "<tool_name>", "input": {...}, "reasoning": "..."}
\`\`\`

2. When the task is done:
\`\`\`json
{"kind": "final", "summary": "..."}
\`\`\`

Available tools: read, search, patch, run, test, git_status, git_diff, git_commit.

Always explain your reasoning before calling a tool. Be precise and safe.`;

export class OpenAIModelAdapter implements ModelAdapter {
  readonly name: string;
  private config: Required<OpenAIAdapterConfig>;

  constructor(config: OpenAIAdapterConfig) {
    this.name = config.model;
    this.config = {
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
      maxTokens: 2048,
      temperature: 0.2,
      maxSteps: 20,
      ...config,
    };
  }

  async next(task: Task, observations: Observation[]): Promise<ModelStep> {
    const messages = this.buildMessages(task, observations);

    const res = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Model API error ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = await res.json() as { choices: { message: { content: string } }[] };
    const content = data.choices?.[0]?.message?.content ?? '';
    return this.parseResponse(content);
  }

  private buildMessages(task: Task, observations: Observation[]) {
    const messages: { role: string; content: string }[] = [
      { role: 'system', content: this.config.systemPrompt },
      { role: 'user', content: `Task: ${task.goal}\nWorkspace: ${task.repo}\nConstraints: ${task.constraints?.join(', ') ?? 'none'}` },
    ];

    // Interleave observations as tool results
    for (const obs of observations) {
      if (obs.toolName) {
        messages.push({
          role: 'assistant',
          content: `I called tool \`${obs.toolName}\` (step ${obs.stepIndex}).`,
        });
      }
      messages.push({
        role: 'user',
        content: obs.ok
          ? `Result: ${JSON.stringify(obs.output).slice(0, 2000)}`
          : `Error: ${obs.error}`,
      });
    }

    return messages;
  }

  private parseResponse(content: string): ModelStep {
    // Try to extract JSON block
    const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.tool) {
          return {
            kind: 'tool',
            request: { tool: parsed.tool, input: parsed.input ?? {}, risks: parsed.risks ?? [] },
            reasoning: parsed.reasoning,
          };
        }
        if (parsed.kind === 'final') {
          return { kind: 'final', summary: parsed.summary ?? content };
        }
      } catch { /* fall through */ }
    }

    // Fallback: treat as final answer
    return { kind: 'final', summary: content };
  }
}

// ─── Factory ───────────────────────────────────────────────────
export function createModelAdapter(config: { type: 'scripted'; script: ModelStep[] }): ScriptedModelAdapter;
export function createModelAdapter(config: { type: 'openai' } & OpenAIAdapterConfig): OpenAIModelAdapter;
export function createModelAdapter(config: { type: string } & Record<string, unknown>): ModelAdapter {
  if (config.type === 'scripted') return new ScriptedModelAdapter((config as { script: ModelStep[] }).script);
  if (config.type === 'openai') return new OpenAIModelAdapter(config as unknown as OpenAIAdapterConfig);
  throw new Error(`Unknown model adapter type: ${config.type}`);
}
