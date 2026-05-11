import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';

import { createAppLaunchPlan, formatAppLaunchMessage, resolveWorkspaceRoot } from '../src/app-command.js';

describe('app command launch planning', () => {
  it('plans backend and dashboard dev commands with one app URL', () => {
    const plan = createAppLaunchPlan({
      repoRoot: '/workspace/world-harness',
      projectRoot: '/workspace/demo',
      host: '127.0.0.1',
      backendPort: 8787,
      dashboardPort: 5173,
      open: false,
    });

    expect(plan.url).toBe('http://127.0.0.1:5173/?mode=home&api=http%3A%2F%2F127.0.0.1%3A8787');
    expect(plan.backend.command).toBe('pnpm');
    expect(plan.backend.args).toEqual(['--filter', '@world-harness/server', 'dev']);
    expect(plan.backend.env).toMatchObject({
      PORT: '8787',
      WORLD_HARNESS_ROOT: '/workspace/demo',
    });
    expect(plan.dashboard.command).toBe('pnpm');
    expect(plan.dashboard.args).toEqual(['--filter', '@world-harness/dashboard', 'dev', '--host', '127.0.0.1', '--port', '5173', '--strictPort']);
    expect(plan.dashboard.env).toMatchObject({
      VITE_WORLD_HARNESS_API_URL: 'http://127.0.0.1:8787',
    });
  });

  it('defaults to the current working directory as the project root', () => {
    const plan = createAppLaunchPlan({ repoRoot: '/workspace/world-harness' });

    expect(plan.projectRoot).toBe(resolve(process.cwd()));
    expect(plan.host).toBe('127.0.0.1');
    expect(plan.backendPort).toBe(8787);
    expect(plan.dashboardPort).toBe(5173);
    expect(plan.open).toBe(false);
  });

  it('resolves the workspace root even when pnpm starts from the cli package directory', () => {
    expect(resolveWorkspaceRoot(process.cwd())).toBe(resolve(process.cwd(), '..', '..'));
  });

  it('keeps the dashboard port strict so the printed URL stays usable', () => {
    const plan = createAppLaunchPlan({ repoRoot: '/workspace/world-harness' });

    expect(plan.dashboard.args).toContain('--strictPort');
  });

  it('formats a compact launch message around a single URL', () => {
    const plan = createAppLaunchPlan({
      repoRoot: '/workspace/world-harness',
      projectRoot: '/workspace/demo',
      host: '127.0.0.1',
      backendPort: 8787,
      dashboardPort: 5173,
      open: true,
    });

    expect(formatAppLaunchMessage(plan)).toContain('[hidecode] App URL: http://127.0.0.1:5173/?mode=home&api=');
    expect(formatAppLaunchMessage(plan)).toContain('[hidecode] Backend: http://127.0.0.1:8787');
    expect(formatAppLaunchMessage(plan)).toContain('[hidecode] Browser: opening automatically');
  });
});
