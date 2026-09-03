import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '@/types';
import Tasks from './Tasks';

const useTasksMock = vi.hoisted(() => vi.fn());
const updateTaskMutateMock = vi.hoisted(() => vi.fn());
const deleteTaskMutateMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useApi', () => ({
  useTasks: useTasksMock,
  useDeleteTask: () => ({ mutate: deleteTaskMutateMock }),
  useUpdateTask: () => ({ mutate: updateTaskMutateMock }),
}));

vi.mock('@/components/dialogs/TaskDialog', () => ({
  default: () => null,
}));

vi.mock('@/components/tasks/TaskKanbanBoard', () => ({
  default: ({ tasks, moveError, onMove }: { tasks: Task[]; moveError: string | null; onMove: (task: Task, nextStatus: Task['status']) => void }) => (
      <div>
      <div data-testid="task-statuses">{tasks.map((task) => `${task.id}:${task.status}`).join(',')}</div>
      {moveError && <div>{moveError}</div>}
      <button onClick={() => onMove(tasks[0], tasks[0].status === 'todo' ? 'done' : 'todo')}>move-first-task</button>
    </div>
  ),
}));

describe('Tasks page Kanban status updates', () => {
  it('optimistically updates status and rolls back on failed mutation', async () => {
    const task: Task = {
      id: 'task-1',
      title: 'Book movers',
      category: 'logistics',
      status: 'todo',
      priority: 'medium',
      dueDate: '2026-08-01',
      notes: '',
    };

    useTasksMock.mockReturnValue({ data: [task], isLoading: false });

    const mutationCallbacks: Array<{ onError?: (error: Error) => void; onSettled?: () => void }> = [];
    updateTaskMutateMock.mockImplementation((_payload: unknown, callbacks: { onError?: (error: Error) => void; onSettled?: () => void }) => {
      mutationCallbacks.push(callbacks);
    });

    render(<Tasks />);

    expect(screen.getByTestId('task-statuses').textContent).toBe('task-1:todo');

    fireEvent.click(screen.getByRole('button', { name: 'move-first-task' }));

    expect(updateTaskMutateMock).toHaveBeenCalledWith(
      { id: 'task-1', status: 'done' },
      expect.objectContaining({ onError: expect.any(Function), onSettled: expect.any(Function) })
    );
    expect(screen.getByTestId('task-statuses').textContent).toBe('task-1:done');

    act(() => {
      mutationCallbacks[0]?.onError?.(new Error('Failed to update task status'));
      mutationCallbacks[0]?.onSettled?.();
    });

    await waitFor(() => {
      expect(screen.getByTestId('task-statuses').textContent).toBe('task-1:todo');
      expect(screen.getByText('Failed to update task status')).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: 'move-first-task' }));
    expect(updateTaskMutateMock).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('task-statuses').textContent).toBe('task-1:done');

    fireEvent.click(screen.getByRole('button', { name: 'move-first-task' }));
    expect(updateTaskMutateMock).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('task-statuses').textContent).toBe('task-1:done');

    act(() => {
      mutationCallbacks[1]?.onSettled?.();
    });
    fireEvent.click(screen.getByRole('button', { name: 'move-first-task' }));
    expect(updateTaskMutateMock).toHaveBeenCalledTimes(3);
  });
});
