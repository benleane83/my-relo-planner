import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Tasks from '@/pages/Tasks';
import type { Task } from '@/types';

const mockUseTasks = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('@/hooks/useApi', () => ({
  useTasks: () => mockUseTasks(),
  useDeleteTask: () => ({ mutate: mockDeleteMutate }),
}));

vi.mock('@/components/dialogs/TaskDialog', () => ({
  default: () => null,
}));

const tasks: Task[] = [
  {
    id: 'task-1',
    title: 'Secure visa appointment',
    category: 'Admin',
    status: 'blocked',
    priority: 'high',
    dueDate: '2026-04-16',
    notes: '',
  },
  {
    id: 'task-2',
    title: 'Book flights',
    category: 'Travel',
    status: 'todo',
    priority: 'medium',
    dueDate: '2026-04-20',
    notes: '',
  },
  {
    id: 'task-3',
    title: 'Reserve movers',
    category: 'Travel',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2026-04-18',
    notes: '',
  },
  {
    id: 'task-4',
    title: 'Collect pet records',
    category: 'Pets',
    status: 'done',
    priority: 'low',
    dueDate: '2026-04-10',
    notes: '',
  },
];

function renderTasksPage() {
  mockUseTasks.mockReturnValue({
    data: tasks,
    isLoading: false,
  });

  return render(<Tasks />);
}

function getActivePanel() {
  return screen.getByRole('tabpanel');
}

function getBoardColumn(panel: HTMLElement, label: string) {
  const columnTitle = within(panel).getByText(label);
  const column = columnTitle.closest('[data-slot="card"]');

  if (!column) {
    throw new Error(`Unable to find board column for ${label}`);
  }

  return column as HTMLElement;
}

describe('Tasks page views', () => {
  beforeEach(() => {
    mockUseTasks.mockReset();
    mockDeleteMutate.mockReset();
  });

  it('defaults to the existing list view', () => {
    renderTasksPage();

    const panel = getActivePanel();

    expect(screen.getByRole('button', { name: 'List' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'false');
    expect(within(panel).getByText('Secure visa appointment')).toBeInTheDocument();
    expect(within(panel).getByText('Book flights')).toBeInTheDocument();
    expect(within(panel).queryByText('Queued for action')).not.toBeInTheDocument();
    expect(within(panel).queryByText('Todo')).not.toBeInTheDocument();
  });

  it('switches to the board view and groups tasks by status', async () => {
    const user = userEvent.setup();

    renderTasksPage();
    await user.click(screen.getByRole('button', { name: 'Board' }));

    const panel = getActivePanel();
    const todoColumn = getBoardColumn(panel, 'Todo');
    const inProgressColumn = getBoardColumn(panel, 'In Progress');
    const blockedColumn = getBoardColumn(panel, 'Blocked');
    const doneColumn = getBoardColumn(panel, 'Done');

    expect(screen.getByRole('button', { name: 'Board' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(panel).getByText('Queued for action')).toBeInTheDocument();
    expect(within(todoColumn).getByText('Book flights')).toBeInTheDocument();
    expect(within(inProgressColumn).getByText('Reserve movers')).toBeInTheDocument();
    expect(within(blockedColumn).getByText('Secure visa appointment')).toBeInTheDocument();
    expect(within(doneColumn).getByText('Collect pet records')).toBeInTheDocument();
  });

  it('keeps the selected category filter when toggling between list and board views', async () => {
    const user = userEvent.setup();

    renderTasksPage();

    await user.click(screen.getByRole('tab', { name: 'Travel (2)' }));

    let panel = getActivePanel();
    expect(within(panel).getByText('Book flights')).toBeInTheDocument();
    expect(within(panel).getByText('Reserve movers')).toBeInTheDocument();
    expect(within(panel).queryByText('Collect pet records')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Board' }));

    panel = getActivePanel();
    const todoColumn = getBoardColumn(panel, 'Todo');
    const blockedColumn = getBoardColumn(panel, 'Blocked');

    expect(within(todoColumn).getByText('Book flights')).toBeInTheDocument();
    expect(within(panel).queryByText('Collect pet records')).not.toBeInTheDocument();
    expect(within(blockedColumn).getByText('No tasks in blocked.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'List' }));

    panel = getActivePanel();
    expect(within(panel).getByText('Book flights')).toBeInTheDocument();
    expect(within(panel).queryByText('Queued for action')).not.toBeInTheDocument();
    expect(within(panel).queryByText('Collect pet records')).not.toBeInTheDocument();
  });
});