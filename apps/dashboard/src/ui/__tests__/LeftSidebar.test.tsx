import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { BackendSessionSummary } from '../../data/backend';
import type { RecentProject } from '../../data/projects';
import LeftSidebar from '../components/LeftSidebar';

const selectedProject: RecentProject = {
  id: 'hidecode',
  name: 'hidecode',
  path: '/workspace/hidecode',
  description: 'GUI-first coding workspace',
  lastOpened: 'Just now',
};

const sessionSummaries: BackendSessionSummary[] = [
  {
    id: 'sess-new',
    title: 'Fix tests',
    projectPath: '/workspace/hidecode',
    createdAt: '2026-05-12T09:00:00.000Z',
    updatedAt: '2026-05-12T09:05:00.000Z',
    messageCount: 2,
    eventCount: 8,
  },
  {
    id: 'sess-old',
    title: 'Explain codebase',
    projectPath: '/workspace/hidecode',
    createdAt: '2026-05-11T09:00:00.000Z',
    updatedAt: '2026-05-11T09:05:00.000Z',
    messageCount: 1,
    eventCount: 3,
  },
];

describe('LeftSidebar', () => {
  it('renders recent backend session summaries for the selected project', () => {
    render(<LeftSidebar selectedProject={selectedProject} sessionSummaries={sessionSummaries} />);

    expect(screen.getByText('Recent sessions')).toBeInTheDocument();
    expect(screen.getByText('Fix tests')).toBeInTheDocument();
    expect(screen.getByText('sess-new')).toBeInTheDocument();
    expect(screen.getByText('2 messages')).toBeInTheDocument();
    expect(screen.getByText('8 events')).toBeInTheDocument();
    expect(screen.getByText('Explain codebase')).toBeInTheDocument();
  });
});
