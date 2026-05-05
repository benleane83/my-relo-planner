import { useMemo, useRef, useState } from 'react';
import { useTasks, useDeleteTask, useUpdateTask } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusIcon, PencilIcon, TrashIcon, LayoutListIcon, ColumnsIcon } from 'lucide-react';
import type { Task } from '@/types';
import TaskDialog from '@/components/dialogs/TaskDialog';

const KANBAN_COLUMNS: { status: Task['status']; label: string; headerClass: string }[] = [
  { status: 'blocked',     label: 'Blocked',     headerClass: 'border-destructive/60 bg-destructive/5' },
  { status: 'in-progress', label: 'In Progress',  headerClass: 'border-blue-500/60 bg-blue-500/5' },
  { status: 'todo',        label: 'To Do',        headerClass: 'border-muted-foreground/40 bg-muted/30' },
  { status: 'done',        label: 'Done',         headerClass: 'border-green-500/60 bg-green-500/5' },
];

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
  const [view, setView] = useState<'list' | 'kanban'>('list');

  const categories = useMemo(() => {
    if (!tasks) return [];
    return Array.from(new Set(tasks.map((t) => t.category))).sort();
  }, [tasks]);

  const sortedAll = useMemo(() => {
    if (!tasks) return [];
    return sortTasks(tasks);
  }, [tasks]);

  const openEdit = (t: Task) => { setEditTask(t); setDialogOpen(true); };
  const openNew  = ()       => { setEditTask(null); setDialogOpen(true); };

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn('rounded-r-none border-r', view === 'list' && 'bg-muted')}
              onClick={() => setView('list')}
              title="List view"
            >
              <LayoutListIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className={cn('rounded-l-none', view === 'kanban' && 'bg-muted')}
              onClick={() => setView('kanban')}
              title="Kanban view"
            >
              <ColumnsIcon />
            </Button>
          </div>
          <Button size="sm" onClick={openNew}>
            <PlusIcon /> New Task
          </Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <TaskKanban tasks={tasks ?? []} onEdit={openEdit} onDelete={(id) => deleteMutation.mutate(id)} />
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="all">All ({tasks?.length ?? 0})</TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat} ({tasks?.filter((t) => t.category === cat).length})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <TaskList tasks={sortedAll} onEdit={openEdit} onDelete={(id) => deleteMutation.mutate(id)} />
          </TabsContent>

          {categories.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-4">
              <TaskList tasks={sortTasks(tasks?.filter((t) => t.category === cat) ?? [])} onEdit={openEdit} onDelete={(id) => deleteMutation.mutate(id)} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editTask} categories={categories} />
    </div>
  );
}

// ── List view ────────────────────────────────────────────────────────────────

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

// ── Kanban view ──────────────────────────────────────────────────────────────

function TaskKanban({ tasks, onEdit, onDelete }: { tasks: Task[]; onEdit: (task: Task) => void; onDelete: (id: string) => void }) {
  const updateMutation = useUpdateTask();
  const dragTaskId = useRef<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<Task['status'] | null>(null);

  const byStatus = useMemo(() => {
    const map: Record<string, Task[]> = { blocked: [], 'in-progress': [], todo: [], done: [] };
    for (const t of tasks) {
      (map[t.status] ?? (map[t.status] = [])).push(t);
    }
    for (const col of Object.values(map)) {
      col.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }
    return map;
  }, [tasks]);

  const handleDragStart = (taskId: string) => {
    dragTaskId.current = taskId;
  };

  const handleDrop = (status: Task['status']) => {
    const id = dragTaskId.current;
    dragTaskId.current = null;
    setDragOverCol(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    updateMutation.mutate({ id, status });
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KANBAN_COLUMNS.map(({ status, label, headerClass }) => {
        const col = byStatus[status] ?? [];
        const isOver = dragOverCol === status;
        return (
          <div
            key={status}
            className={cn(
              'flex flex-col gap-2 rounded-lg border p-3 transition-colors',
              isOver ? 'bg-accent/60' : 'bg-background'
            )}
            onDragOver={(e) => { e.preventDefault(); if (dragOverCol !== status) setDragOverCol(status); }}
            onDragLeave={() => setDragOverCol(null)}
            onDrop={() => handleDrop(status)}
          >
            <div className={cn('flex items-center justify-between rounded-md border px-3 py-1.5', headerClass)}>
              <span className="text-sm font-semibold">{label}</span>
              <Badge variant="secondary" className="text-xs">{col.length}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              {col.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">No tasks</p>
              )}
              {col.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDragStart={() => handleDragStart(task.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ task, onEdit, onDelete, onDragStart }: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDragStart: () => void;
}) {
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className={cn('cursor-grab active:cursor-grabbing', task.status === 'done' && 'opacity-60')}
    >
      <CardHeader className="p-3 pb-1">
        <span className={cn('text-sm font-medium leading-snug', task.status === 'done' && 'line-through text-muted-foreground')}>
          {task.title}
        </span>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-1.5 p-3 pt-1">
        <Badge variant={priorityVariant(task.priority)} className="text-xs">{task.priority}</Badge>
        {task.category && (
          <Badge variant="outline" className="text-xs">{task.category}</Badge>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {new Date(task.dueDate).toLocaleDateString()}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-xs" onClick={() => onEdit(task)}>
            <PencilIcon />
          </Button>
          <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => onDelete(task.id)}>
            <TrashIcon />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
