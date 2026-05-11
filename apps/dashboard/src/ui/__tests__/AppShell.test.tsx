import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AppShell from '../AppShell';

describe('AppShell', () => {
  it('renders the hidecode application frame with named regions', () => {
    render(
      <AppShell
        sidebar={<div>Project sidebar</div>}
        workspace={<div>Chat workspace</div>}
        inspector={<div>Run inspector</div>}
        status={<div>Sandbox guarded</div>}
      />,
    );

    expect(screen.getByRole('banner', { name: 'hidecode top bar' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Project sidebar' })).toHaveTextContent('Project sidebar');
    expect(screen.getByRole('main', { name: 'Workspace' })).toHaveTextContent('Chat workspace');
    expect(screen.getByRole('complementary', { name: 'Run inspector' })).toHaveTextContent('Run inspector');
    expect(screen.getByRole('contentinfo', { name: 'Workspace status' })).toHaveTextContent('Sandbox guarded');
  });

  it('renders default shell chrome for hidecode product identity', () => {
    render(
      <AppShell
        sidebar={<div />}
        workspace={<div />}
        inspector={<div />}
        status={<div />}
      />,
    );

    expect(screen.getByText('hidecode')).toBeInTheDocument();
    expect(screen.getByText('GUI-first coding workspace')).toBeInTheDocument();
  });
});
