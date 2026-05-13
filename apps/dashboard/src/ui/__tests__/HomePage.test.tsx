import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import HomePage from '../modes/HomePage';

describe('HomePage', () => {
  it('renders the hidecode first-open project picker', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Build with hidecode' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Folder' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clone Repository' })).toBeInTheDocument();
    expect(screen.getByText('Drag a project folder here')).toBeInTheDocument();
  });

  it('shows a manual project form when Open Folder is clicked', () => {
    render(<HomePage />);

    expect(screen.queryByLabelText('Project path')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Folder' }));

    expect(screen.getByRole('form', { name: 'Open project folder manually' })).toBeInTheDocument();
    expect(screen.getByLabelText('Project path')).toBeInTheDocument();
    expect(screen.getByLabelText('Project name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Project' })).toBeDisabled();
  });

  it('submits a typed path and uses the explicit project name', () => {
    const onOpenProject = vi.fn();
    render(<HomePage onOpenProject={onOpenProject} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Folder' }));
    fireEvent.change(screen.getByLabelText('Project path'), { target: { value: '/tmp/manual-app' } });
    fireEvent.change(screen.getByLabelText('Project name'), { target: { value: 'Manual App' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open Project' }));

    expect(onOpenProject).toHaveBeenCalledWith({
      id: 'manual-app',
      name: 'Manual App',
      path: '/tmp/manual-app',
      description: 'Manually opened project',
      lastOpened: 'Just now',
    });
  });

  it('derives a project name from the typed path when name is left blank', () => {
    const onOpenProject = vi.fn();
    render(<HomePage onOpenProject={onOpenProject} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Folder' }));
    fireEvent.change(screen.getByLabelText('Project path'), { target: { value: '/tmp/manual-app/' } });
    fireEvent.click(screen.getByRole('button', { name: 'Open Project' }));

    expect(onOpenProject).toHaveBeenCalledWith(expect.objectContaining({
      id: 'manual-app',
      name: 'manual-app',
      path: '/tmp/manual-app',
    }));
  });

  it('shows recent projects and quick-start coding tasks', () => {
    render(<HomePage />);

    expect(screen.getByText('hidecode')).toBeInTheDocument();
    expect(screen.getByText('world-harness')).toBeInTheDocument();
    expect(screen.getByText('ljquant')).toBeInTheDocument();
    expect(screen.getByText('Fix failing tests')).toBeInTheDocument();
    expect(screen.getByText('Review current diff')).toBeInTheDocument();
    expect(screen.getByText('Explain this codebase')).toBeInTheDocument();
    expect(screen.getByText('Plan a new feature')).toBeInTheDocument();
  });

  it('shows model and safety setup status', () => {
    render(<HomePage />);

    expect(screen.getByText('GPT-5.5')).toBeInTheDocument();
    expect(screen.getByText('Local CPA')).toBeInTheDocument();
    expect(screen.getByText('Guarded sandbox')).toBeInTheDocument();
    expect(screen.getByText('Runtime offline')).toBeInTheDocument();
  });
});
