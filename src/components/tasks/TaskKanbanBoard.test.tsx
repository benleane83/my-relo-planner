import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Task } from '@/types';
import TaskKanbanBoard from './TaskKanbanBoard';

const baseTasks: Task[] = [
  {
    id: '1',
    title: 'Book flights',
    category: 'travel',
    milestone: 'booking',
    status: 'todo',
    priority: 'high',
    dueDate: '2026-06-01',
    notes: '',
  },
  {
    id: '2',
    title: 'Pack bags',
    category: 'moving',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '2026-06-03',
    notes: '',
  },
];

describe('TaskKanbanBoard', () => {
  it('renders status columns and task cards', () => {
    render(
      <TaskKanbanBoard
        tasks={baseTasks}
        isMovingTask={() => false}
        moveError={null}
        onMove={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('To Do')).toBeDefined();
    expect(screen.getByText('In Progress')).toBeDefined();
    expect(screen.getByText('Blocked')).toBeDefined();
    expect(screen.getByText('Done')).toBeDefined();
    expect(screen.getByText('Book flights')).toBeDefined();
    expect(screen.getByText('Pack bags')).toBeDefined();
  });

  it('supports moving tasks with keyboard-accessible controls', () => {
    const onMove = vi.fn();

    render(
      <TaskKanbanBoard
        tasks={baseTasks}
        isMovingTask={() => false}
        moveError={null}
        onMove={onMove}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Move Book flights to next column' }));

    expect(onMove).toHaveBeenCalledWith(baseTasks[0], 'in-progress');
  });
});
