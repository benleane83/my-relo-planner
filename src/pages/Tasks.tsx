import { useMemo, useState } from 'react';
import { useTasks, useDeleteTask } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TaskBoardCard from '@/components/tasks/TaskBoardCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanSquareIcon, ListIcon, PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import type { Task } from '@/types';
import TaskDialog from '@/components/dialogs/TaskDialog';

type TaskViewMode = 'list' | 'board';

type TaskStatus = Task['status'];

const boardColumns: Array<{
  status: TaskStatus;
  label: string;
  description: string;
  headerClassName: string;
}> = [
  {
    status: 'todo',
    label: 'Todo',
    description: 'Queued for action',
    headerClassName: 'border-l-primary/60 bg-primary/8',
  },
  {
    status: 'in-progress',
    label: 'In Progress',
    description: 'Currently moving',
    headerClassName: 'border-l-chart-2/70 bg-chart-2/12',
  },
  {
    status: 'blocked',
    label: 'Blocked',
    description: 'Needs a decision',
    headerClassName: 'border-l-destructive/70 bg-destructive/10',
  },
  {
    status: 'done',
    label: 'Done',
    description: 'Ready to archive',
    headerClassName: 'border-l-chart-3/70 bg-chart-3/12',
  },
];

const emptyTaskGroups: Record<TaskStatus, Task[]> = {
  todo: [],
  'in-progress': [],
  blocked: [],
  done: [],
};

const statusOrder: Record<string, number> = {
  blocked: 0,
  'in-progress': 1,
  todo: 2,
  done: 3,
};

const statusVariant = (status: string) => {
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

const priorityVariant = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'destructive' as const;
    case 'medium':
      return 'default' as const;
    default:
      return 'secondary' as const;
  }
};

function sortTasks<T extends { status: string; dueDate: string }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

export default function Tasks() {
  const { data: tasks, isLoading } = useTasks();
  const deleteMutation = useDeleteTask();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<TaskViewMode>('list');

  const openCreateTask = () => {
    setEditTask(null);
    setDialogOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditTask(task);
    setDialogOpen(true);
  };

  const categories = useMemo(() => {
    if (!tasks) return [];
    return Array.from(new Set(tasks.map((t) => t.category))).sort();
  }, [tasks]);

  const sortedAll = useMemo(() => {
    if (!tasks) return [];
    return sortTasks(tasks);
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
        <Skeleton className="h-10 w-96" />
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
          <div
            role="group"
            aria-label="Task view"
            className="inline-flex w-fit items-center gap-1 rounded-lg border bg-muted/40 p-1"
          >
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
            >
              <ListIcon data-icon="inline-start" />
              List
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'board' ? 'secondary' : 'ghost'}
              aria-pressed={viewMode === 'board'}
              onClick={() => setViewMode('board')}
            >
              <KanbanSquareIcon data-icon="inline-start" />
              Board
            </Button>
          </div>
        </div>
        <Button size="sm" onClick={openCreateTask}>
          <PlusIcon /> New Task
        </Button>
      </div>

      <Tabs defaultValue="all" className="min-w-0">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="all">All ({tasks?.length ?? 0})</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {cat} ({tasks?.filter((t) => t.category === cat).length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-4 min-w-0">
          <TaskView viewMode={viewMode} tasks={sortedAll} onEdit={openEditTask} onDelete={(id) => deleteMutation.mutate(id)} />
        </TabsContent>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-4 min-w-0">
            <TaskView viewMode={viewMode} tasks={sortTasks(tasks?.filter((t) => t.category === cat) ?? [])} onEdit={openEditTask} onDelete={(id) => deleteMutation.mutate(id)} />
          </TabsContent>
        ))}
      </Tabs>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editTask} categories={categories} />
    </div>
  );
}

function TaskView({ viewMode, tasks, onEdit, onDelete }: { viewMode: TaskViewMode; tasks: Task[]; onEdit: (task: Task) => void; onDelete: (id: string) => void }) {
  if (viewMode === 'board') {
    return <TaskBoard tasks={tasks} onEdit={onEdit} onDelete={onDelete} />;
  }

  return <TaskList tasks={tasks} onEdit={onEdit} onDelete={onDelete} />;
}

function TaskBoard({ tasks, onEdit, onDelete }: { tasks: Task[]; onEdit: (task: Task) => void; onDelete: (id: string) => void }) {
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      todo: [],
      'in-progress': [],
      blocked: [],
      done: [],
    };

    tasks.forEach((task) => {
      groups[task.status]?.push(task);
    });

    return groups;
  }, [tasks]);

  return (
    <ScrollArea className="w-full pb-4">
      <div className="grid min-w-max grid-flow-col auto-cols-[minmax(18rem,20rem)] gap-4 lg:min-w-0 lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-2 xl:grid-cols-4">
        {boardColumns.map((column) => {
          const columnTasks = groupedTasks[column.status] ?? emptyTaskGroups[column.status];

          return (
            <Card key={column.status} className="flex h-[min(70vh,42rem)] min-h-[24rem] flex-col gap-0 overflow-hidden">
              <CardHeader className={cn('gap-3 border-b border-l-4 pb-4', column.headerClassName)}>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{column.label}</CardTitle>
                  <Badge variant={statusVariant(column.status)}>{columnTasks.length}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{column.description}</p>
              </CardHeader>
              <CardContent className="min-h-0 flex-1 p-0">
                <ScrollArea className="h-full">
                  <div className="flex min-h-full flex-col gap-3 p-6">
                    {columnTasks.length > 0 ? (
                      columnTasks.map((task) => (
                        <TaskBoardCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
                      ))
                    ) : (
                      <div className="flex min-h-32 flex-1 items-center justify-center rounded-xl border border-dashed bg-muted/30 px-4 text-center text-sm text-muted-foreground">
                        No tasks in {column.label.toLowerCase()}.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function TaskList({ tasks, onEdit, onDelete }: { tasks: Task[]; onEdit: (task: Task) => void; onDelete: (id: string) => void }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks in this category</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="flex flex-wrap items-center gap-3 py-3">
            <span
              className={cn(
                'text-sm font-medium',
                task.status === 'done' && 'text-muted-foreground line-through'
              )}
            >
              {task.title}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(task.status)}>{task.status}</Badge>
              <Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge>
            </div>
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
            <Button variant="outline" size="icon-xs" onClick={() => onEdit(task)}>
              <PencilIcon />
            </Button>
            <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => onDelete(task.id)}>
              <TrashIcon />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
