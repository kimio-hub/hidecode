import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, parse, resolve } from 'node:path';

export interface AppLaunchOptions {
  repoRoot: string;
  projectRoot?: string;
  host?: string;
  backendPort?: number;
  dashboardPort?: number;
  open?: boolean;
}

export interface AppProcessPlan {
  name: 'backend' | 'dashboard';
  command: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
}

export interface AppLaunchPlan {
  repoRoot: string;
  projectRoot: string;
  host: string;
  backendPort: number;
  dashboardPort: number;
  backendUrl: string;
  url: string;
  open: boolean;
  backend: AppProcessPlan;
  dashboard: AppProcessPlan;
}

export function resolveWorkspaceRoot(cwd = process.cwd()): string {
  let current = resolve(cwd);
  const root = parse(current).root;

  while (true) {
    if (existsSync(resolve(current, 'pnpm-workspace.yaml'))) return current;
    if (current === root) return resolve(cwd);
    current = dirname(current);
  }
}

function parsePort(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value !== undefined && value > 0 ? Math.trunc(value) : fallback;
}

export function createAppLaunchPlan(options: AppLaunchOptions): AppLaunchPlan {
  const repoRoot = resolve(options.repoRoot);
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const host = options.host ?? '127.0.0.1';
  const backendPort = parsePort(options.backendPort, 8787);
  const dashboardPort = parsePort(options.dashboardPort, 5173);
  const backendUrl = `http://${host}:${backendPort}`;
  const dashboardBaseUrl = `http://${host}:${dashboardPort}`;
  const url = `${dashboardBaseUrl}/?mode=home&api=${encodeURIComponent(backendUrl)}`;

  return {
    repoRoot,
    projectRoot,
    host,
    backendPort,
    dashboardPort,
    backendUrl,
    url,
    open: options.open ?? false,
    backend: {
      name: 'backend',
      command: 'pnpm',
      args: ['--filter', '@world-harness/server', 'dev'],
      cwd: repoRoot,
      env: {
        PORT: String(backendPort),
        WORLD_HARNESS_ROOT: projectRoot,
      },
    },
    dashboard: {
      name: 'dashboard',
      command: 'pnpm',
      args: ['--filter', '@world-harness/dashboard', 'dev', '--host', host, '--port', String(dashboardPort), '--strictPort'],
      cwd: repoRoot,
      env: {
        VITE_WORLD_HARNESS_API_URL: backendUrl,
      },
    },
  };
}

export function formatAppLaunchMessage(plan: AppLaunchPlan): string {
  return [
    `[hidecode] App URL: ${plan.url}`,
    `[hidecode] Backend: ${plan.backendUrl}`,
    `[hidecode] Project: ${plan.projectRoot}`,
    `[hidecode] Browser: ${plan.open ? 'opening automatically' : 'not opened (--open to launch)'}`,
  ].join('\n');
}

function spawnPlannedProcess(plan: AppProcessPlan): ChildProcess {
  const child = spawn(plan.command, plan.args, {
    cwd: plan.cwd,
    env: { ...process.env, ...plan.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  child.stdout?.on('data', (chunk) => process.stdout.write(`[${plan.name}] ${chunk}`));
  child.stderr?.on('data', (chunk) => process.stderr.write(`[${plan.name}] ${chunk}`));
  return child;
}

async function openBrowser(url: string): Promise<void> {
  const platform = process.platform;
  const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, { stdio: 'ignore', detached: true });
  child.unref();
}

export async function runAppCommand(options: AppLaunchOptions): Promise<void> {
  const plan = createAppLaunchPlan(options);
  const children = [spawnPlannedProcess(plan.backend), spawnPlannedProcess(plan.dashboard)];

  console.log(formatAppLaunchMessage(plan));
  console.log('[hidecode] Press Ctrl+C to stop backend and dashboard.');

  if (plan.open) {
    await openBrowser(plan.url);
  }

  const shutdown = () => {
    for (const child of children) child.kill('SIGTERM');
  };
  process.once('SIGINT', () => {
    shutdown();
    process.exit(130);
  });
  process.once('SIGTERM', () => {
    shutdown();
    process.exit(143);
  });

  await new Promise<void>((resolvePromise, reject) => {
    for (const child of children) {
      child.once('exit', (code, signal) => {
        shutdown();
        if (code === 0 || signal) resolvePromise();
        else reject(new Error(`App process exited: ${code}`));
      });
      child.once('error', reject);
    }
  });
}
