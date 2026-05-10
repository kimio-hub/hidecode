import { relative, resolve } from 'node:path';
import type { PolicyDecision, RiskLevel } from './schemas.js';

export interface PolicyConfig {
  workspace: string;
  allowRead?: string[];
  allowWrite?: string[];
  denyRead?: string[];
  denyWrite?: string[];
  allowCommands?: string[];
  askCommands?: string[];
  denyCommands?: string[];
}

const DEFAULT_DENY_COMMANDS = [
  'rm -rf /',
  'sudo',
  'git push --force',
  'curl * | sh',
  'wget * | sh',
  'mkfs',
  'dd if=',
];

const DEFAULT_SECRET_PATTERNS = ['.env', 'secrets/', '.ssh/', 'id_rsa', 'id_ed25519'];

export class PolicyEngine {
  constructor(private readonly config: PolicyConfig) {}

  decideFile(action: 'read' | 'write', path: string): PolicyDecision {
    const workspace = resolve(this.config.workspace);
    const target = resolve(workspace, path);
    const rel = relative(workspace, target);
    if (rel.startsWith('..') || rel === '') {
      return deny('file.outside_workspace', 'critical', `Refusing to ${action} outside workspace: ${path}`);
    }

    if (DEFAULT_SECRET_PATTERNS.some((pattern) => rel.includes(pattern))) {
      return deny('file.secret_path', 'high', `Refusing to ${action} likely secret path: ${rel}`);
    }

    const denyList = action === 'read' ? this.config.denyRead ?? [] : this.config.denyWrite ?? [];
    if (denyList.some((pattern) => rel.includes(pattern))) {
      return deny('file.config_deny', 'high', `Denied by policy: ${rel}`);
    }

    return { decision: 'allow', reason: `${action} allowed within workspace`, risk: action === 'read' ? 'low' : 'medium' };
  }

  decideCommand(command: string): PolicyDecision {
    const denyCommands = [...DEFAULT_DENY_COMMANDS, ...(this.config.denyCommands ?? [])];
    if (denyCommands.some((pattern) => commandMatches(command, pattern))) {
      return deny('command.dangerous', 'critical', `Dangerous command denied: ${command}`);
    }

    const allowCommands = this.config.allowCommands ?? ['git status', 'git diff', 'npm test', 'pnpm test', 'pytest', 'python -m pytest'];
    if (allowCommands.some((pattern) => commandMatches(command, pattern))) {
      return { decision: 'allow', reason: 'Command matches allowlist', risk: 'low' };
    }

    const askCommands = this.config.askCommands ?? ['npm install', 'pnpm install', 'pip install', 'docker'];
    if (askCommands.some((pattern) => commandMatches(command, pattern))) {
      return { decision: 'ask', reason: 'Command requires approval', risk: 'medium', ruleId: 'command.ask' };
    }

    return { decision: 'ask', reason: 'Unknown command requires approval', risk: 'medium', ruleId: 'command.unknown' };
  }
}

function commandMatches(command: string, pattern: string): boolean {
  if (pattern.includes('*')) {
    const regex = new RegExp(`^${pattern.split('*').map(escapeRegex).join('.*')}`);
    return regex.test(command);
  }
  return command.trim().startsWith(pattern);
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function deny(ruleId: string, risk: RiskLevel, reason: string): PolicyDecision {
  return { decision: 'deny', risk, reason, ruleId };
}
