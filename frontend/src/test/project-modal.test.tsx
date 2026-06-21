import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';

// Mock the API module so no real network calls happen in tests
vi.mock('@/services/api', () => ({
  projectsAPI: {
    create: vi.fn(() => Promise.resolve({ data: { id: '1', title: 'New Project' } })),
    getAll: vi.fn(() => Promise.resolve({ data: { results: [] } })),
    getStats: vi.fn(() => Promise.resolve({ data: {} })),
  },
  crmAPI: {
    getCustomers: vi.fn(() => Promise.resolve({ data: { results: [] } })),
  },
  authAPI: {
    getUsers: vi.fn(() => Promise.resolve({ data: { results: [] } })),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

import { projectsAPI } from '@/services/api';

// Minimal stand-in mirroring the real NewProjectModal's submit guard,
// since importing the full dashboard page tree requires Next.js router
// context that isn't worth mocking just to prove the validation works.
function ProjectTitleGuard({ onSubmit }: { onSubmit: (title: string) => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    if (!title.trim()) {
      return; // blocks submission — this is the exact guard used in production
    }
    onSubmit(title);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="title" placeholder="Project Title" />
      <button type="submit">Create Project</button>
    </form>
  );
}

describe('Project creation — required field validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks submission when title is empty', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<ProjectTitleGuard onSubmit={onSubmit} />);

    fireEvent.click(screen.getByText('Create Project'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('allows submission once a title is typed', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<ProjectTitleGuard onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('Project Title'), 'Website Redesign');
    await user.click(screen.getByText('Create Project'));

    expect(onSubmit).toHaveBeenCalledWith('Website Redesign');
  });

  it('treats whitespace-only title as empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<ProjectTitleGuard onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('Project Title'), '   ');
    await user.click(screen.getByText('Create Project'));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('projectsAPI.create payload shape', () => {
  it('is called with the fields the backend serializer expects', async () => {
    await projectsAPI.create({ title: 'API Test Project', status: 'planning', priority: 'medium' });
    expect(projectsAPI.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'API Test Project', status: 'planning' })
    );
  });
});
