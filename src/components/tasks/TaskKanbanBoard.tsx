import { useMemo, useState } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

const STATUS_COLUMNS: Array<{ status: Task['status']; label: string }> = [
  { status: 'todo', label: 'To Do' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'blocked', label: 'Blocked' },
  { status: 'done', label: 'Done' },
];

const statusVariant = (status: Task['status']) => {
  switch (status) {
    case 'done':
      return 'outline' as const;
    case 'in-progress':
      return 'default' as const;
    case 'blocked':
      return 'destructive' as const;
    default:
      return 'secondary' as const;
  }
};

const priorityVariant = (priority: Task['priority']) => {
  switch (priority) {
    case 'high':
      return 'destructive' as const;
    case 'medium':
      return 'default' as const;
    default:
      return 'secondary' as const;
  }
};

interface TaskKanbanBoardProps {
  tasks: Task[];
  isMovingTask: (id: string) => boolean;
  moveError: string | null;
  onMove: (task: Task, nextStatus: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export default function TaskKanbanBoard({ tasks, isMovingTask, moveError, onMove, onEdit, onDelete }: TaskKanbanBoardProps) {
  const [dragOverStatus, setDragOverStatus] = useState<Task['status'] | null>(null);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<Task['status'], Task[]> = {
      todo: [],
      'in-progress': [],
      blocked: [],
      done: [],
    };

    for (const task of tasks) {
      grouped[task.status].push(task);
    }

    for (const status of Object.keys(grouped) as Task['status'][]) {
      grouped[status].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }

    return grouped;
  }, [tasks]);

  return (
    <div className="flex flex-col gap-3" role="region" aria-label="Task Kanban board">
      {moveError && (
        <Alert variant="destructive">
          <AlertDescription>{moveError}</AlertDescription>
        </Alert>
      )}

      <div className="overflow-x-auto">
        <div className="flex min-w-max items-start gap-4 pb-2" aria-label="Task status columns">
          {STATUS_COLUMNS.map((column) => {
            const columnTasks = tasksByStatus[column.status];

            return (
              <section
                key={column.status}
                className={cn(
                  'flex w-[280px] flex-col gap-3 rounded-lg border bg-muted/20 p-3',
                  dragOverStatus === column.status && 'border-primary bg-primary/5'
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverStatus(column.status);
                }}
                onDragLeave={() => setDragOverStatus((current) => (current === column.status ? null : current))}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOverStatus(null);
                  const taskId = event.dataTransfer.getData('text/task-id');
                  const task = tasks.find((item) => item.id === taskId);
                  if (task) {
                    onMove(task, column.status);
                  }
                }}
                aria-label={`${column.label} column`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{column.label}</h3>
                  <Badge variant="secondary">{columnTasks.length}</Badge>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {columnTasks.length === 0 ? (
                    <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                      No tasks
                    </p>
                  ) : (
                    columnTasks.map((task) => {
                      const statusIndex = STATUS_COLUMNS.findIndex((columnEntry) => columnEntry.status === task.status);
                      const previousStatus = STATUS_COLUMNS[statusIndex - 1]?.status;
                      const nextStatus = STATUS_COLUMNS[statusIndex + 1]?.status;
                      const moving = isMovingTask(task.id);

                      return (
                        <Card
                          key={task.id}
                          draggable={!moving}
                          onDragStart={(event) => {
                            event.dataTransfer.setData('text/task-id', task.id);
                            event.dataTransfer.effectAllowed = 'move';
                          }}
                          className={cn('gap-3 py-3', moving && 'opacity-60')}
                        >
                          <CardContent className="flex flex-col gap-2 px-3">
                            <div className="flex items-start justify-between gap-2">
                              <span className={cn('text-sm font-medium', task.status === 'done' && 'text-muted-foreground line-through')}>
                                {task.title}
                              </span>
                              <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon-xs" onClick={() => onEdit(task)} disabled={moving} aria-label={`Edit ${task.title}`}>
                                  <PencilIcon />
                                </Button>
                                <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => onDelete(task.id)} disabled={moving} aria-label={`Delete ${task.title}`}>
                                  <TrashIcon />
                                </Button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
                              <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
                              {task.category && <Badge variant="outline">{task.category}</Badge>}
                              {task.milestone && <Badge variant="outline">{task.milestone}</Badge>}
                            </div>

                            <span className="text-xs text-muted-foreground">Due {new Date(task.dueDate).toLocaleDateString()}</span>

                            <div className="mt-1 flex items-center justify-between gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => previousStatus && onMove(task, previousStatus)}
                                disabled={!previousStatus || moving}
                                aria-label={`Move ${task.title} to previous column`}
                              >
                                <ArrowLeftIcon />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => nextStatus && onMove(task, nextStatus)}
                                disabled={!nextStatus || moving}
                                aria-label={`Move ${task.title} to next column`}
                              >
                                <ArrowRightIcon />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
