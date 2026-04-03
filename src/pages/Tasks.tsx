import { useMemo, useState } from 'react';
import { useTasks, useDeleteTask } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import type { Task } from '@/types';
import TaskDialog from '@/components/dialogs/TaskDialog';

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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Tasks</h2>
        <Button size="sm" onClick={() => { setEditTask(null); setDialogOpen(true); }}>
          <PlusIcon /> New Task
        </Button>
      </div>

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
          <TaskList tasks={sortedAll} onEdit={(t) => { setEditTask(t); setDialogOpen(true); }} onDelete={(id) => deleteMutation.mutate(id)} />
        </TabsContent>

        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <TaskList tasks={sortTasks(tasks?.filter((t) => t.category === cat) ?? [])} onEdit={(t) => { setEditTask(t); setDialogOpen(true); }} onDelete={(id) => deleteMutation.mutate(id)} />
          </TabsContent>
        ))}
      </Tabs>

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editTask} categories={categories} />
    </div>
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
